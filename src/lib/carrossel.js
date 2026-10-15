/* ============================================================================
 * carrossel.js — CARROSSEL 3D DE TEXTOS (títulos e frases curtas)
 * ----------------------------------------------------------------------------
 * Só títulos e frases de até ~140 caracteres passam por aqui. Conteúdo denso
 * (cards, mapa, FAQ) fica em fluxo normal, legível, sobre painel escuro.
 *
 * COMO FUNCIONA (e por que nunca fica em estado errado)
 *   Existe UM número: o progresso da faixa (0 a 1). A partir dele calculamos um
 *   índice FLUTUANTE:
 *
 *       indice = progresso * totalTextos
 *
 *   Cada bloco recebe `distancia = indice - seuIndice`, que é 0 quando ele está
 *   no centro, negativo quando ainda vai entrar e positivo quando já passou.
 *   Posição, rotação, escala e opacidade são FUNÇÕES PURAS dessa distância.
 *
 *   Consequência: não existe evento, não existe "já entrou", não existe fila.
 *   Subir o scroll refaz exatamente o mesmo caminho, ao contrário. É impossível
 *   um bloco ficar preso no meio — porque nada é memorizado.
 *
 * REGRAS RESPEITADAS
 *   • transform + opacity apenas (nada de animar layout)
 *   • perspective no contêiner, preserve-3d nos itens, backface-visibility
 *   • divisão por bloco, nunca por letra
 *   • painel semitransparente por bloco, para legibilidade sobre a cena
 *   • prefers-reduced-motion: versão estática, sem rotação
 * ==========================================================================*/

import config from '../config.js';
import { clamp, normalizar } from './utils.js';
import { icone } from './icones.js';

let palco = null;        // contêiner fixo
let itens = [];          // elementos dos blocos
let ativo = false;
let semMovimento = false;

let unidadeY = 0;        // distância vertical entre dois blocos, em px
let _alturaBloco = 0;    // altura medida de um bloco (referência/depuração)
let ultimoIndice = -999;
let dentroDaFaixa = false;

/* ---------- Montagem --------------------------------------------------- */

export function iniciarCarrossel() {
  palco = document.getElementById('carrossel');
  if (!palco) return null;

  semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  montarItens();
  medir();

  // Em `prefers-reduced-motion` o carrossel vira uma lista estática: os blocos
  // aparecem empilhados, sem rotação, e a gente só acende o que está no centro.
  palco.classList.toggle('carrossel--estatico', semMovimento);

  ativo = true;

  let tResize = 0;
  window.addEventListener('resize', () => {
    clearTimeout(tResize);
    tResize = setTimeout(medir, 200);
  }, { passive: true });

  return { definirProgresso, destruir };
}

/** Cria os blocos a partir do config. Todo texto entra com textContent. */
function montarItens() {
  palco.replaceChildren();
  itens = [];

  const lista = config.titulos || [];
  for (let i = 0; i < lista.length; i++) {
    const { rotulo, texto, icone: nomeIcone } = lista[i];

    const bloco = document.createElement('article');
    bloco.className = 'carrossel__item';
    bloco.setAttribute('aria-hidden', 'false');

    if (nomeIcone) {
      const ic = document.createElement('span');
      ic.className = 'carrossel__icone';
      ic.innerHTML = icone(nomeIcone, { tamanho: 30 });
      bloco.appendChild(ic);
    }

    if (rotulo) {
      const r = document.createElement('span');
      r.className = 'carrossel__rotulo';
      r.textContent = rotulo;
      bloco.appendChild(r);
    }

    const t = document.createElement('h2');
    t.className = 'carrossel__texto';
    t.textContent = texto;
    bloco.appendChild(t);

    palco.appendChild(bloco);
    itens.push({ el: bloco, indice: i });
  }
}

/**
 * Mede a distância entre blocos e guarda a altura de referência de um bloco.
 *
 * REGRA DO PROJETO: nunca ler layout durante o scroll. Isto roda no load e no
 * resize (com debounce), e os valores ficam guardados.
 */
function medir() {
  if (!palco || !itens.length) return;

  const alturaPalco = palco.getBoundingClientRect().height || window.innerHeight;
  // 1 unidade = quanto o bloco anda por passo do índice. O fator 0.42 faz ~2,4
  // blocos caberem na altura visível, que é o ritmo confortável de leitura.
  unidadeY = Math.max(80, alturaPalco * 0.42);

  // Altura de referência para centralizar cada bloco (só para o modo estático,
  // que não usa rotateX e por isso não pode depender do translateY do JS).
  // (guardada apenas como referência de depuração)
  _alturaBloco = itens[0].el.getBoundingClientRect().height || 0;

  // NO ESTÁTICO: cada bloco é posicionado no SEU lugar da pilha, uma vez só.
  // (No modo animado todos partem do centro e o transform faz o resto.)
  if (semMovimento) {
    const passo = unidadeY * 0.35;
    itens.forEach((item, i) => {
      const d = i - (itens.length - 1) / 2;
      item.baseY = -d * passo;
      item.el.style.transform =
        `translate3d(0, ${item.baseY.toFixed(1)}px, 0)`;
    });
  }

  ultimoIndice = -999;   // força redesenho imediato com a nova medida
}

/* ---------- Animação --------------------------------------------------- */

/**
 * @param {number} pGlobal progresso global da página (0 a 1)
 */
export function definirProgresso(pGlobal) {
  if (!ativo || !itens.length) return;

  const { faixa } = config.carrossel;

  // Progresso DENTRO da faixa do carrossel (0 a 1). Fora dela o palco some.
  const t = normalizar(pGlobal, faixa.inicio, faixa.fim);
  const dentro = pGlobal >= faixa.inicio - 0.004 && pGlobal <= faixa.fim + 0.004;

  if (dentro !== dentroDaFaixa) {
    dentroDaFaixa = dentro;
    palco.dataset.ativo = dentro ? 'true' : 'false';
    // Fora da faixa os blocos não precisam ser lidos por leitores de tela
    palco.setAttribute('aria-hidden', dentro ? 'false' : 'true');
  }

  if (!dentro) return;

  // Índice flutuante: 0 no primeiro bloco, total no "depois do último".
  const total = itens.length;
  const indice = t * total;

  // Micro-otimização: se o índice mal mudou, não reescreve 7 estilos.
  if (Math.abs(indice - ultimoIndice) < 0.0015) return;
  ultimoIndice = indice;

  const cfg = config.carrossel;
  const visiveis = cfg.visiveis;
  const distanciaVisivel = (visiveis - 1) / 2;

  for (const item of itens) {
    escreverItem(item, indice - item.indice, distanciaVisivel);
  }
}

/** Uma linha por bloco. Tudo aqui é função pura da distância. */
function escreverItem(item, d, distanciaVisivel) {
  const cfg = config.carrossel;
  const el = item.el;

  // Fora da área visível: nem calcula, nem desenha (economia real em celular)
  if (Math.abs(d) > distanciaVisivel + 0.6) {
    if (el.dataset.oculto !== '1') {
      el.dataset.oculto = '1';
      el.style.opacity = '0';
      // visibility evita que o navegador pinte um bloco invisível
      el.style.visibility = 'hidden';
    }
    return;
  }
  if (el.dataset.oculto === '1') {
    el.dataset.oculto = '0';
    el.style.visibility = 'visible';
  }

  const abertura = clamp(1 - Math.abs(d) / (distanciaVisivel + 0.55), 0, 1);
  const espelhado = d >= 0 ? 1 : -1;

  // ESTÁTICO (prefers-reduced-motion): sem rotação, só fade e deslocamento
  // leve a partir do lugar fixo de cada bloco (definido em `medir`).
  if (semMovimento) {
    const baseY = item.baseY || 0;
    el.style.transform =
      `translate3d(0, ${(baseY - d * unidadeY * 0.18).toFixed(1)}px, 0)`;
    el.style.opacity = abertura.toFixed(3);
    return;
  }

  // POSIÇÃO: translateY ANTES do rotateX.
  // Esta ordem é o que mantém os blocos separados na vertical por igual. Se a
  // rotação viesse primeiro, o espaçamento seria comprimido pelo cosseno do
  // ângulo e a lista pareceria "amassada" nas pontas.
  const deslocamentoY = -d * unidadeY;

  // ROTAÇÃO: 0 no centro; ±70° nas pontas. O bloco que vai entrar gira para
  // trás (positivo) e o que já passou gira para frente (negativo).
  const angulo = cfg.rotacaoMax * (1 - abertura) * espelhado;

  const escala = cfg.escalaPonta + (cfg.escalaCentro - cfg.escalaPonta) * abertura;

  // Opacidade: usa a abertura para entrar/sair suave, com piso configurável.
  const opacidade = cfg.opacidadeMinima + (1 - cfg.opacidadeMinima) * Math.pow(abertura, 0.75);

  // Desfoque só nas pontas, quando configurado (custa composição: mantenha baixo)
  const desfoque = cfg.desfoquePonta > 0 ? cfg.desfoquePonta * (1 - abertura) : 0;

  el.style.transform =
    `translate3d(0, calc(-50% + ${deslocamentoY.toFixed(1)}px), 0) ` +
    `rotateX(${angulo.toFixed(2)}deg) ` +
    `scale(${escala.toFixed(3)})`;
  el.style.opacity = opacidade.toFixed(3);

  // Só escreve o filter quando há desfoque: string vazia é mais barata
  const filter = desfoque > 0.25 ? `blur(${desfoque.toFixed(2)}px)` : '';
  if (el.style.filter !== filter) el.style.filter = filter;

  // O bloco do centro fica "aceso": ganha borda e brilho
  const noCentro = Math.abs(d) < 0.5;
  if (el.dataset.centro !== (noCentro ? '1' : '0')) {
    el.dataset.centro = noCentro ? '1' : '0';
  }
}

export function destruir() {
  ativo = false;
  if (palco) palco.replaceChildren();
  itens = [];
}

export default { iniciarCarrossel, definirProgresso, destruir };
