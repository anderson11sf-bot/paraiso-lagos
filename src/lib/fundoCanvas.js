/* ============================================================================
 * fundoCanvas.js — ORQUESTRADOR DAS TRÊS ETAPAS DO FUNDO
 * ----------------------------------------------------------------------------
 * As três cenas (amanhecer na chácara · mata e riacho · morros, lago e noite)
 * são MÓDULOS SEPARADOS em ./cenas/. Aqui só fazemos três coisas:
 *
 *   1. RESOLUÇÃO: decide a escala interna do canvas uma única vez (nunca no
 *      scroll), respeitando modo LITE e densidade de tela.
 *   2. BUFFERS: cada cena tem seu desenho ESTÁTICO guardado em um canvas
 *      offline. Só é redesenhado quando o progresso daquela etapa muda o
 *      bastante para ser perceptível — o que é caro não roda a cada quadro.
 *   3. COMPOSIÇÃO: por quadro, mistura as etapas ativas com crossfade e chama
 *      só a camada ANIMADA de cada uma.
 *
 * POR QUE ASSIM: uma cena completa tem centenas de traços (morro, mata,
 * troncos, pedras). Redesenhar tudo a 60 fps derruba qualquer celular médio.
 * Com o estático em buffer, o custo por quadro cai para "3 imagens + brilhos".
 *
 * ESTA É A CAMADA 2 DO FALLBACK DESCRITO NO PROJETO (shader/Canvas 2D
 * procedural). Quando houver frames reais, é aqui que a Camada 1 entra.
 * ==========================================================================*/

import config from '../config.js';
import { clamp } from './utils.js';
import { criarChacara } from './cenas/chacara.js';
import { criarFloresta } from './cenas/floresta.js';
import { criarNoite } from './cenas/noite.js';

/* ---------- estado do módulo ------------------------------------------- */

let canvas = null;
let ctx = null;
let dpr = 1;
let largura = 0;
let altura = 0;
let ambiente = null;
let modoLite = false;
let escalaInterna = 0.6;

/** As três cenas. Cada uma sabe se desenhar (estático + animado). */
let cenas = null;

/** Progresso de cada etapa, já com o tremor orgânico aplicado (0..1). */
const prog = { etapa1: 0, etapa2: 0, etapa3: 0 };

/** Valor lido pelo scroll, sem tremor (é o que decide redesenho). */
const progPuro = { etapa1: 0, etapa2: 0, etapa3: 0 };

let tempo = 0;
let ultimoQuadro = 0;      // referência de tempo REAL (usada por definirProgresso)
let ultimoQuadroRaf = 0;   // referência do loop de quadros
let rodando = false;
let idFrame = 0;
let intervaloMinimo = 1000 / 60;
let visivel = true;

/**
 * Progresso a partir do qual o palco deixa de ser útil.
 *
 * Por que existe: o fundo animado é a parte mais cara do site. Quando a pessoa
 * já passou da narrativa e está lendo as seções (chácaras, FAQ, rodapé), o
 * canvas fica escondido atrás do fundo sólido — continuar desenhando ali é
 * gastar bateria sem ninguém ver. `config.scroll.etapas.etapa3.fim` é o ponto
 * natural: é onde a narrativa acaba.
 */
const PROGRESSO_LIMITE_PALCO = 0.94;

/** Últimos pesos de crossfade calculados (só para diagnóstico). */
let pesosUltimoDigito = null;

/** Marca que o loop foi parado por o palco ter saído de uso. */
let palcoForaDeUso = false;

/* ---------- Tremor orgânico -------------------------------------------
 * Cada etapa recebe um deslocamento senoidal lento. Isso dá a sensação de
 * "vento/água em movimento" sem precisar de mais partículas, e evita que a
 * cena pareça uma imagem congelada quando a pessoa para de rolar.
 * A amplitude é pequena de propósito: nada de cintilar.
 * -------------------------------------------------------------------- */
function aplicarTremor(puro, fase) {
  const tremor = Math.sin(tempo * 0.13 + fase) * 0.007
               + Math.sin(tempo * 0.07 + fase * 2.1) * 0.004;
  return clamp(puro + tremor, 0, 1);
}

/* ---------- Preparo ---------------------------------------------------- */

export function iniciarFundo(elementoCanvas, ambienteDetectado) {
  canvas = elementoCanvas;
  ambiente = ambienteDetectado;
  modoLite = !!ambiente.modoLite;

  if (!canvas || !config.fundo.permitirCanvas) return null;

  ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  // Resolução interna: menos pixels = mais FPS. Decidida UMA vez.
  const fator = modoLite
    ? config.fundo.resolucao.modoLite
    : (ambiente.mobile ? config.fundo.resolucao.mobile : config.fundo.resolucao.desktop);
  escalaInterna = fator;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5) * fator;

  intervaloMinimo = ambiente.mobile ? 1000 / 45 : 1000 / 60;

  cenas = montarCenas();

  redimensionar();
  iniciarPrecarregamentoFrames();

  // Reage só a mudanças reais de tamanho (não à barra do navegador no iOS).
  let tResize = 0;
  window.addEventListener('resize', () => {
    clearTimeout(tResize);
    tResize = setTimeout(redimensionar, 200);
  }, { passive: true });

  // Pausa quando a aba sai de foco: economiza bateria de verdade.
  document.addEventListener('visibilitychange', () => {
    visivel = document.visibilityState === 'visible';
    if (visivel && rodando) agendar();
  });

  return {
    redimensionar, definirProgresso, iniciar, parar, definirVisivel,
    getProgressoEtapas: () => prog,
    /** Diagnóstico: medidas internas dos buffers (usado pelas ferramentas). */
    getDiagnostico: () => ({
      largura, altura, dpr, escalaInterna, modoLite,
      canvas: `${canvas.width}x${canvas.height}`,
      buffers: cenas ? cenas.lista.map((c) => ({
        chave: c.chave,
        buffer: `${c.buffer.width}x${c.buffer.height}`,
        pPintado: Number(c.pPintado.toFixed(3)),
        pAtual: Number(prog[c.chave].toFixed(3)),
        pPuro: Number(progPuro[c.chave].toFixed(3)),
        erro: c.erro || null
      })) : [],
      pesos: pesosUltimoDigito
    }),

    /**
     * Diagnóstico: devolve uma amostra de pixels DIRETO do buffer de uma etapa,
     * sem passar pela composição. Serve para saber se o problema está na cena
     * (não desenhou) ou na composição (não chegou na tela).
     */
    amostrarBuffer: (chave, pontos) => {
      const c = cenas && cenas.porChave(chave);
      if (!c) return null;
      const g = c.bctx;
      return (pontos || [[0.5, 0.08], [0.5, 0.42], [0.5, 0.9]]).map(([px, py]) => {
        const d = g.getImageData(
          Math.max(0, Math.round(c.buffer.width * px)),
          Math.max(0, Math.round(c.buffer.height * py)),
          1, 1
        ).data;
        return `${px},${py}=${d[0]},${d[1]},${d[2]},${d[3]}`;
      }).join(' | ');
    },

    /** Diagnóstico: pinta a cena DIRETO no canvas visível (sem passar pelos
     *  buffers). Serve para separar "a cena não desenha" de "os buffers não
     *  estão chegando na tela". */
    pintarDiretoNaTela: (chave) => {
      const c = cenas && cenas.porChave(chave);
      if (!c || !ctx) return false;
      ctx.clearRect(0, 0, largura, altura);
      try {
        c.pintor.estatico(ctx, prog[c.chave], modoLite);
      } catch (e) {
        return `erro: ${(e && e.message) || e}`;
      }
      c.pintadoDireto = true;
      return true;
    },

    /**
     * Diagnóstico: pinta a cena num canvas NOVO, criado agora, e lê de volta.
     * Se aqui sai cor e no buffer do site sai preto, o problema está no buffer
     * do site (dimensão, transform ou ordem de chamadas). Se aqui também sai
     * preto, o problema está no código da cena.
     */
    testarPintura: (chave, p = 0.75) => {
      const c = cenas && cenas.porChave(chave);
      if (!c) return null;
      const grafico = document.createElement('canvas');
      grafico.width = canvas.width;
      grafico.height = canvas.height;
      const g = grafico.getContext('2d', { alpha: false });
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#ff00ff';        // magenta: se sobrar, nada foi desenhado
      g.fillRect(0, 0, largura, altura);

      // COMPARAÇÃO DECISIVA: primeiro um gradiente simples (sabemos que
      // funciona), depois a cena. Se o gradiente simples também não aparecer,
      // o problema é o ambiente de leitura; se só a cena não aparecer, o
      // problema é o código da cena.
      const gl = g.createLinearGradient(0, 0, 0, altura * 0.5);
      gl.addColorStop(0, 'rgb(255,0,0)');
      gl.addColorStop(1, 'rgb(0,0,255)');
      g.fillStyle = gl;
      g.fillRect(0, 0, 40, altura * 0.5);
      const amostraGrad = (() => {
        const d = g.getImageData(20, 20, 1, 1).data;
        return `${d[0]},${d[1]},${d[2]}`;
      })();

      let erro = null;
      try {
        c.pintor.estatico(g, p, modoLite);
      } catch (e) {
        erro = (e && e.message) || String(e);
      }

      const amostras = [[0.5, 0.08], [0.5, 0.42], [0.5, 0.9]].map(([px, py]) => {
        const d = g.getImageData(
          Math.round(grafico.width * px), Math.round(grafico.height * py), 1, 1
        ).data;
        return `${py}=${d[0]},${d[1]},${d[2]}`;
      }).join(' | ');
      return {
        erro, amostras, tamanho: `${grafico.width}x${grafico.height}`,
        gradienteControle: amostraGrad
      };
    },

    /**
     * Diagnóstico: devolve o buffer como uma GRADE, para ver o padrão do
     * desenho (céu em cima, lago embaixo, etc.) sem precisar de imagem.
     */
    gradeBuffer: (chave, colunas = 3, linhas = 8) => {
      const c = cenas && cenas.porChave(chave);
      if (!c) return null;
      const g = c.bctx;
      const larguraPx = c.buffer.width;
      const alturaPx = c.buffer.height;
      const saida = [];
      for (let j = 0; j < linhas; j++) {
        const linha = [];
        for (let i = 0; i < colunas; i++) {
          const x = Math.min(larguraPx - 1, Math.round((i + 0.5) / colunas * larguraPx));
          const y = Math.min(alturaPx - 1, Math.round((j + 0.5) / linhas * alturaPx));
          const d = g.getImageData(x, y, 1, 1).data;
          linha.push(`${d[0]},${d[1]},${d[2]}`);
        }
        saida.push(linha.join(' '));
      }
      return saida;
    }
  };
}

/* ---------- Gerenciador de Frames WebP por Scroll (Seção 2B) ---------- */
const framesCarregados = {
  etapa1: new Map(),
  etapa2: new Map(),
  etapa3: new Map()
};

const framesEmCarregamento = new Set();

function obterUrlFrame(etapaChave, indice) {
  const dados = config.fundo.frames?.[etapaChave];
  if (!dados) return null;
  const num = String(indice + 1).padStart(4, '0');
  const pasta = dados.pasta || '/media/frames/';
  const prefixo = dados.prefixo || `${etapaChave}_`;
  const ext = dados.extensao ? (dados.extensao.startsWith('.') ? dados.extensao : `.${dados.extensao}`) : '.webp';
  return `${pasta}${prefixo}${num}${ext}`;
}

async function carregarFrame(etapaChave, indice) {
  const chave = `${etapaChave}_${indice}`;
  const mapa = framesCarregados[etapaChave];
  if (!mapa || mapa.has(indice)) return mapa ? mapa.get(indice) : null;
  if (framesEmCarregamento.has(chave)) return null;

  const url = obterUrlFrame(etapaChave, indice);
  if (!url) return null;

  framesEmCarregamento.add(chave);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    let img;
    if (typeof createImageBitmap === 'function') {
      img = await createImageBitmap(blob);
    } else {
      img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(blob);
      });
    }
    mapa.set(indice, img);
    framesEmCarregamento.delete(chave);
    return img;
  } catch {
    framesEmCarregamento.delete(chave);
    return null;
  }
}

function obterFrameMaisProximo(etapaChave, indiceAlvo) {
  const mapa = framesCarregados[etapaChave];
  if (!mapa || mapa.size === 0) return null;
  if (mapa.has(indiceAlvo)) return mapa.get(indiceAlvo);

  const total = config.fundo.frames?.[etapaChave]?.quantidade || 114;
  for (let d = 1; d < total; d++) {
    const antes = indiceAlvo - d;
    if (antes >= 0 && mapa.has(antes)) return mapa.get(antes);
    const depois = indiceAlvo + d;
    if (depois < total && mapa.has(depois)) return mapa.get(depois);
  }
  return null;
}

function desenharCover(destinoCtx, img, dw, dh) {
  const iw = img.width || img.naturalWidth || 1;
  const ih = img.height || img.naturalHeight || 1;
  const escala = Math.max(dw / iw, dh / ih);
  const w = iw * escala;
  const h = ih * escala;
  const x = (dw - w) * 0.5;
  const y = (dh - h) * 0.5;
  destinoCtx.drawImage(img, x, y, w, h);
}

function iniciarPrecarregamentoFrames() {
  if (config.fundo.modo !== 'frames') return;

  // Frame 1 imediato (poster)
  carregarFrame('etapa1', 0).then(() => {
    redimensionar();
  });

  const etapas = ['etapa1', 'etapa2', 'etapa3'];
  const listaPasso = [];

  for (const et of etapas) {
    const total = config.fundo.frames?.[et]?.quantidade || 100;
    // 1 a cada 4 frames (ou 1 a cada 6 se modoLite)
    const passo = modoLite ? 6 : 4;
    for (let i = 0; i < total; i += passo) {
      listaPasso.push({ et, idx: i });
    }
  }

  let idxFila = 0;
  function proximoPasso() {
    if (idxFila >= listaPasso.length) {
      preencherRestantes();
      return;
    }
    const item = listaPasso[idxFila++];
    carregarFrame(item.et, item.idx).then(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(proximoPasso, { timeout: 250 });
      } else {
        setTimeout(proximoPasso, 40);
      }
    });
  }

  function preencherRestantes() {
    if (modoLite) return;
    const restantes = [];
    for (const et of etapas) {
      const total = config.fundo.frames?.[et]?.quantidade || 100;
      for (let i = 0; i < total; i++) {
        if (!framesCarregados[et].has(i)) restantes.push({ et, idx: i });
      }
    }

    let idxRest = 0;
    function proximoRestante() {
      if (idxRest >= restantes.length) return;
      const item = restantes[idxRest++];
      carregarFrame(item.et, item.idx).then(() => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(proximoRestante, { timeout: 350 });
        } else {
          setTimeout(proximoRestante, 50);
        }
      });
    }
    proximoRestante();
  }

  setTimeout(proximoPasso, 150);
}

/** Cria as três cenas, cada uma com o seu canvas offline. */
function montarCenas() {
  const medidas = () => ({ largura, altura, dpr });

  const lista = [
    {
      chave: 'etapa1',
      fase: 0.0,
      pintor: criarChacara(medidas()),
      buffer: null,
      bctx: null,
      pPintado: -1,
      ultimoIndice: -1
    },
    {
      chave: 'etapa2',
      fase: 1.7,
      pintor: criarFloresta(medidas()),
      buffer: null,
      bctx: null,
      pPintado: -1,
      ultimoIndice: -1
    },
    {
      chave: 'etapa3',
      fase: 3.4,
      pintor: criarNoite(medidas()),
      buffer: null,
      bctx: null,
      pPintado: -1,
      ultimoIndice: -1
    }
  ];

  for (const c of lista) {
    c.buffer = document.createElement('canvas');
    c.bctx = c.buffer.getContext('2d', { alpha: false });
    c.erro = null;
    c.pintor.prepararAnimado();
  }

  return {
    lista,
    porChave: (chave) => lista.find((c) => c.chave === chave)
  };
}

/** Mede e recria os buffers. Chamado no início e no resize (nunca no scroll). */
export function redimensionar() {
  if (!canvas || !ctx) return;

  const r = canvas.getBoundingClientRect();
  largura = Math.max(1, Math.round(r.width || window.innerWidth));
  altura = Math.max(1, Math.round(r.height || window.innerHeight));

  canvas.width = Math.max(1, Math.round(largura * dpr));
  canvas.height = Math.max(1, Math.round(altura * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;

  for (const c of cenas.lista) {
    c.buffer.width = canvas.width;
    c.buffer.height = canvas.height;
    c.bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.pPintado = -1;          // força redesenho do estático
    c.ultimoIndice = -1;
  }

  // Já entrega um quadro válido na tela (nada de tela preta no primeiro paint)
  comporEAnimar(0, true);
}

/* ---------- Pesos do crossfade ----------------------------------------
 * Cada etapa tem uma janela no progresso global. A sobreposição das janelas
 * do config (ex.: etapa1 termina em 0.40 e etapa2 começa em 0.38) é o que
 * produz o crossfade. Aqui a gente só normaliza para os pesos somarem 1.
 * -------------------------------------------------------------------- */
function calcularPesos(pGlobal) {
  const E = config.scroll.etapas;
  const mistura = config.fundo.misturaEtapas;

  const peso = (etapa) => {
    const inicio = etapa.inicio;
    const fim = etapa.fim;
    // Trecho de subida e de descida, suavizados pela `mistura`
    const subida = Math.max(0.01, (fim - inicio) * 0.25 * mistura);
    if (pGlobal <= inicio) return 0;
    if (pGlobal >= fim) return 1;
    if (pGlobal < inicio + subida) return (pGlobal - inicio) / subida;
    if (pGlobal > fim - subida) return (fim - pGlobal) / subida;
    return 1;
  };

  const p1 = peso(E.etapa1);
  const p2 = peso(E.etapa2);
  const p3 = peso(E.etapa3);
  const soma = p1 + p2 + p3;

  if (soma <= 0.0001) {
    // Fora de qualquer janela (não deve acontecer, mas nunca deixar tela preta)
    return { etapa1: 1, etapa2: 0, etapa3: 0 };
  }
  return { etapa1: p1 / soma, etapa2: p2 / soma, etapa3: p3 / soma };
}

/* ---------- Entrada de progresso --------------------------------------- */

/**
 * Recebe o progresso GLOBAL (0 a 1) e distribui para as etapas.
 * Aqui é o único lugar que converte narrativa global em cena.
 */
export function definirProgresso(pGlobal) {
  if (!cenas) return;
  const E = config.scroll.etapas;

  progPuro.etapa1 = clamp((pGlobal - E.etapa1.inicio) / (E.etapa1.fim - E.etapa1.inicio), 0, 1);
  progPuro.etapa2 = clamp((pGlobal - E.etapa2.inicio) / (E.etapa2.fim - E.etapa2.inicio), 0, 1);
  progPuro.etapa3 = clamp((pGlobal - E.etapa3.inicio) / (E.etapa3.fim - E.etapa3.inicio), 0, 1);

  // Tempo decorrido REAL, medido na fonte (não o contador de quadros).
  //
  // Por que assim: quando a página está em segundo plano, ou dentro de um
  // ambiente que estrangula o requestAnimationFrame (verificação automatizada,
  // por exemplo), o loop de animação pode não rodar. Se o `dt` dependesse só
  // dele, o desenho ficaria parado no primeiro quadro — e o fundo apareceria
  // preto. Medindo o tempo aqui, o desenho avança sempre que o scroll muda.
  const agora = performance.now();
  const dt = ultimoQuadro > 0
    ? Math.min((agora - ultimoQuadro) / 1000, 0.05)
    : 0.016;
  ultimoQuadro = agora;

  // Passou da narrativa: o palco está coberto pelas seções. Para de desenhar
  // (economia real de bateria), mas só depois de compor o último quadro — para
  // não deixar a tela preta caso alguém suba o scroll de volta.
  if (pGlobal >= PROGRESSO_LIMITE_PALCO) {
    if (rodando) {
      parar();
      palcoForaDeUso = true;
    }
  } else if (palcoForaDeUso) {
    palcoForaDeUso = false;
    iniciar();
  }

  // Desenha na hora (o scroll tem de responder sem esperar o próximo quadro)
  comporEAnimar(pGlobal, false, dt);
}

/* ---------- Loop ------------------------------------------------------- */

export function iniciar() {
  if (rodando || !cenas) return;
  rodando = true;
  ultimoQuadro = performance.now();
  agendar();
}

export function parar() {
  rodando = false;
  if (idFrame) cancelAnimationFrame(idFrame);
  idFrame = 0;
}

/** Pausa/retoma o desenho sem destruir a cena. */
export function definirVisivel(querVisivel) {
  visivel = !!querVisivel;
  if (visivel && rodando) agendar();
}

function agendar() {
  if (idFrame) return;
  idFrame = requestAnimationFrame(quadro);
}

function quadro(agora) {
  idFrame = 0;
  if (!rodando) return;

  const decorrido = agora - ultimoQuadroRaf;

  // `ultimoQuadro` NÃO é atualizado aqui de propósito: ele é a referência de
  // tempo real usada por definirProgresso(). Se os dois escrevessem nele, um
  // zeraria o intervalo do outro e a animação ficaria aos soluços.
  if (visivel && decorrido >= intervaloMinimo) {
    ultimoQuadroRaf = agora;
    const dt = Math.min(decorrido, 50) / 1000;
    tempo += dt;
    comporEAnimar(null, false, dt);
  }

  if (rodando) agendar();
}

/* ---------- Composição ------------------------------------------------- */

/**
 * Redesenha o que for necessário e compõe o quadro.
 * @param {number|null} pGlobal progresso global (null = usar o último)
 * @param {boolean} pularAnimado true quando é só para "dar um quadro" rápido
 * @param {number} dt tempo desde o quadro anterior, em segundos
 */
function comporEAnimar(pGlobal, pularAnimado, dt = 0) {
  if (!ctx || !cenas) return;

  // 1. Tremor orgânico (só o que é desenhado com ele; o puro decide redesenho)
  prog.etapa1 = aplicarTremor(progPuro.etapa1, 0.0);
  prog.etapa2 = aplicarTremor(progPuro.etapa2, 1.7);
  prog.etapa3 = aplicarTremor(progPuro.etapa3, 3.4);

  // 2. Redesenha o estático ou frame de cada etapa que mudou
  const usarFrames = config.fundo.modo === 'frames';
  for (const c of cenas.lista) {
    const p = progPuro[c.chave];
    const totalFrames = config.fundo.frames?.[c.chave]?.quantidade || 100;
    const indice = Math.round(p * (totalFrames - 1));

    const precisaPintar = usarFrames
      ? (indice !== c.ultimoIndice || c.pPintado < 0)
      : (Math.abs(p - c.pPintado) > 0.008 || c.pPintado < 0);

    if (precisaPintar) {
      c.ultimoIndice = indice;
      c.pPintado = p;
      c.bctx.clearRect(0, 0, largura, altura);
      try {
        if (usarFrames) {
          const img = obterFrameMaisProximo(c.chave, indice);
          if (img) {
            desenharCover(c.bctx, img, largura, altura);
          } else {
            c.pintor.estatico(c.bctx, prog[c.chave], modoLite);
            carregarFrame(c.chave, indice).then((novoImg) => {
              if (novoImg && c.ultimoIndice === indice) {
                desenharCover(c.bctx, novoImg, largura, altura);
                comporEAnimar(pGlobal, true);
              }
            });
          }
        } else {
          c.pintor.estatico(c.bctx, prog[c.chave], modoLite);
        }
        c.erro = null;
      } catch (erro) {
        c.erro = `${erro && erro.message || erro}`;
        if (typeof console !== 'undefined') {
          console.error(`[fundo] cena ${c.chave} falhou:`, erro);
        }
      }
    }
  }

  // 3. Pesos do crossfade (baseados no progresso global + tremor leve)
  const pRef = pGlobal === null
    ? (progPuro.etapa1 * 0.4 + progPuro.etapa2 * 0.3 + progPuro.etapa3 * 0.3)
    : pGlobal;
  const pesos = calcularPesos(pRef);
  pesosUltimoDigito = pesos;

  // 4. Composição
  ctx.clearRect(0, 0, largura, altura);
  for (const c of cenas.lista) {
    const peso = pesos[c.chave];
    if (peso <= 0.001) continue;
    ctx.globalAlpha = peso;
    ctx.drawImage(c.buffer, 0, 0, largura, altura);
  }
  ctx.globalAlpha = 1;

  if (pularAnimado || dt <= 0) return;

  // 5. Camadas animadas (por cima, com o peso de cada etapa)
  for (const c of cenas.lista) {
    const peso = pesos[c.chave];
    if (peso <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha = peso;
    c.pintor.animado(ctx, prog[c.chave], dt, tempo, modoLite);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export default {
  iniciarFundo, redimensionar, definirProgresso, iniciar, parar, definirVisivel
};
