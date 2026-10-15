/* ============================================================================
 * secoes5.js — SEÇÕES 9, 10, 11, 12 e RODAPÉ
 * ----------------------------------------------------------------------------
 * Tudo aqui é CONTEÚDO DENSO: fluxo normal, painel escuro, legível e indexável.
 * A única exceção é a seção de vídeos, que tem um efeito de abertura ligado ao
 * progresso (a "linha de bambu") — e esse efeito é função pura, reversível.
 *
 * REGRAS DE COPY RESPEITADAS
 *   • Nenhum preço exato: só a faixa (`glebas[].faixa`).
 *   • Campo vazio em condicoes/faqExtras → "Consulte no WhatsApp".
 *   • A palavra "condomínio" não é usada para descrever o empreendimento.
 *   • Nada inventado sobre documentação, prazo, juros ou entrada.
 * ==========================================================================*/

import config from '../config.js';
import { criar, normalizar, suave, clamp } from './utils.js';
import { icone } from './icones.js';

/* `definirVideos` é reexportado no fim do arquivo (usado pelo main.js). */

/* --------------------------------------------------------------------------
 * Peças reutilizáveis
 * ------------------------------------------------------------------------ */

function cabecalho({ rotulo, titulo, texto }) {
  const frag = document.createDocumentFragment();
  if (rotulo) frag.appendChild(criar('span', { classe: 'rotulo-secao', texto: rotulo }));
  if (titulo) frag.appendChild(criar('h2', { texto: titulo }));
  if (texto) frag.appendChild(criar('p', { classe: 'secao__apoio', texto }));
  return frag;
}

function botaoWhatsApp(origem, texto, variante = 'ouro', extras = {}) {
  return criar('a', Object.assign({
    classe: `btn btn--${variante} secao__cta`,
    href: '#',
    'data-wa-origem': origem,
    rel: 'noopener',
    texto
  }, extras));
}

/* ==========================================================================
 * 9. CHÁCARAS DISPONÍVEIS (A a G)
 * ========================================================================== */

export function montarGlebas() {
  const secao = document.getElementById('chacaras');
  if (!secao) return null;

  const painel = criar('div', { classe: 'painel painel--largo' });
  painel.appendChild(cabecalho({
    rotulo: 'Chácaras disponíveis',
    titulo: 'Escolha onde a sua história começa',
    texto: 'Cada chácara tem cerca de 2 hectares, com limites definidos e uma parte do lago na própria matrícula. Toque em uma para falar direto sobre ela.'
  }));

  const lista = criar('div', { classe: 'glebas', role: 'list' });

  for (const g of config.glebas) {
    const cartao = criar('article', {
      classe: 'gleba',
      role: 'listitem',
      'data-gleba': g.id
    });

    // Faixa de identificação: letra grande + área
    const topo = criar('header', { classe: 'gleba__topo' });
    topo.appendChild(criar('span', { classe: 'gleba__letra', texto: g.id }));
    const blocoNome = criar('div', { classe: 'gleba__identidade' });
    blocoNome.appendChild(criar('h3', { classe: 'gleba__nome', texto: g.nome }));
    blocoNome.appendChild(criar('span', { classe: 'gleba__area', texto: g.area }));
    topo.appendChild(blocoNome);
    cartao.appendChild(topo);

    // Foto real da gleba
    const fotoGleba = config.midia.fotosGlebas && config.midia.fotosGlebas[g.id];
    if (fotoGleba) {
      const pic = criar('picture', { classe: 'gleba__foto-caixa' });
      pic.appendChild(criar('source', { srcset: fotoGleba, type: 'image/webp' }));
      pic.appendChild(criar('img', {
        src: fotoGleba,
        alt: `${g.nome} — vista real da chácara`,
        loading: 'lazy',
        decoding: 'async',
        width: '720',
        height: '405',
        classe: 'gleba__foto'
      }));
      cartao.appendChild(pic);
    }

    // Destaques
    const destaques = criar('ul', { classe: 'gleba__destaques' });
    for (const d of g.destaques) destaques.appendChild(criar('li', { texto: d }));
    cartao.appendChild(destaques);

    // Faixa de valor exibida (nunca preço exato)
    const faixa = criar('p', { classe: 'gleba__faixa' });
    const ehPlaceholder = /\[.*\]/.test(g.faixa);
    if (ehPlaceholder) {
      // Marcador que veio do briefing: fica visível de propósito, para você
      // preencher no config.js. Não escondemos nem inventamos.
      faixa.classList.add('gleba__faixa--pendente');
      faixa.appendChild(criar('span', { classe: 'gleba__pendente', texto: 'Faixa de valor a confirmar' }));
      faixa.appendChild(criar('span', { classe: 'gleba__pendente-nota', texto: 'Consulte no WhatsApp' }));
    } else {
      faixa.appendChild(criar('span', { classe: 'gleba__faixa-valor', texto: g.faixa }));
    }
    cartao.appendChild(faixa);

    // Ação: WhatsApp já com o nome da gleba na mensagem
    cartao.appendChild(botaoWhatsApp('gleba', 'Falar sobre esta chácara', 'acao', {
      'data-wa-gleba': g.nome
    }));

    lista.appendChild(cartao);
  }

  painel.appendChild(lista);

  // Condições comerciais confirmadas (só as verdadeiras)
  const cond = config.condicoes;
  const selos = criar('ul', { classe: 'condicoes', role: 'list' });
  const itens = [];
  if (cond.documentacao) itens.push('Documentação em ordem');
  if (cond.financiamentoDireto) itens.push('Financiamento direto com o proprietário');
  if (cond.aceitaImovel) itens.push('Aceita imóvel na negociação');
  for (const t of itens) {
    const li = criar('li', { classe: 'selo selo--condicao' });
    li.appendChild(criar('span', { texto: t }));
    selos.appendChild(li);
  }
  painel.appendChild(selos);

  painel.appendChild(criar('p', {
    classe: 'nota-legal',
    texto: config.empreendimento.legal.avisoValores
  }));

  painel.appendChild(botaoWhatsApp('financiamento', 'Entender o financiamento direto', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* ==========================================================================
 * 10. VÍDEOS 2×2 COM ABERTURA "LINHA DE BAMBU"
 * ========================================================================== */

let refsVideos = null;
let videoTocando = null;

export function montarVideos() {
  const secao = document.getElementById('videos');
  if (!secao) return null;

  const V = config.videosSecao;
  const painel = criar('div', { classe: 'painel painel--largo painel--videos' });

  // --- Título (entra esfumaçado) -----------------------------------------
  const tituloBloco = criar('div', { classe: 'videos__titulo-bloco' });
  tituloBloco.appendChild(criar('span', { classe: 'rotulo-secao', texto: V.rotulo }));
  tituloBloco.appendChild(criar('h2', { classe: 'videos__titulo', texto: V.titulo }));
  tituloBloco.appendChild(criar('p', { classe: 'secao__apoio', texto: V.texto }));
  painel.appendChild(tituloBloco);

  // --- Palco da abertura --------------------------------------------------
  const palco = criar('div', { classe: 'bambu', 'data-aberto': 'false' });

  // A linha e os seus dois nós de bambu
  const linha = criar('span', { classe: 'bambu__linha' });
  const linhaTopo = criar('span', { classe: 'bambu__linha bambu__linha--topo' });
  const linhaBase = criar('span', { classe: 'bambu__linha bambu__linha--base' });

  // Nós do bambu: pequenos traços na linha (textura)
  if (V.nosBambu > 0) {
    for (let i = 1; i <= 4; i++) {
      const no = criar('span', { classe: 'bambu__no' });
      no.style.top = `${(i / 5) * 100}%`;
      no.style.opacity = (V.nosBambu * 0.9).toFixed(2);
      linha.appendChild(no);
    }
  }

  // --- Grade de vídeos ---------------------------------------------------
  const recorte = criar('div', { classe: 'bambu__recorte' });
  const grade = criar('div', { classe: 'videos' });

  const lista = config.midia.videos || [];
  lista.forEach((v, i) => {
    const figura = criar('figure', { classe: 'video-card' });
    const botao = criar('button', {
      type: 'button',
      classe: 'video-card__botao',
      'aria-label': `Assistir: ${v.titulo || `Demonstração ${i + 1}`}`
    });

    // Fachada: poster + play. O vídeo só carrega no clique.
    const poster = criar('span', { classe: 'video-card__poster' });
    if (v.poster) {
      const img = criar('img', {
        src: v.poster, alt: '', loading: 'lazy', decoding: 'async',
        width: '720', height: '1280'
      });
      poster.appendChild(img);
      poster.classList.add('video-card__poster--com-imagem');
    } else {
      poster.classList.add('video-card__poster--vazio');
    }
    botao.appendChild(poster);

    const play = criar('span', { classe: 'video-card__play' });
    play.innerHTML = icone('play', { tamanho: 18 });
    botao.appendChild(play);

    botao.addEventListener('click', () => alternarVideo(botao, v));

    const legenda = criar('figcaption', {
      classe: 'video-card__legenda',
      texto: v.titulo || `Demonstração ${i + 1}`
    });

    figura.append(botao, legenda);
    grade.appendChild(figura);
  });

  recorte.appendChild(grade);
  palco.append(linha, linhaTopo, linhaBase, recorte);
  painel.appendChild(palco);

  painel.appendChild(botaoWhatsApp('ctaFinal', 'Ver tudo pessoalmente', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;

  refsVideos = { palco, linha, linhaTopo, linhaBase, recorte, tituloBloco };
  observarVideos(grade);
  aplicarBambu(0);

  return secao;
}

/** Liga/desliga o vídeo no clique — um por vez, e sempre com som liberado. */
function alternarVideo(botao, dados) {
  const jaTem = botao.querySelector('video');

  if (jaTem) {
    if (jaTem.paused) {
      // Um vídeo por vez: pausa o anterior antes de tocar o novo.
      if (videoTocando && videoTocando !== jaTem) videoTocando.pause();
      jaTem.play();
      videoTocando = jaTem;
    } else {
      jaTem.pause();
    }
    return;
  }

  const src = dados.src || dados.mp4;
  if (!src) {
    botao.classList.add('video-card__botao--sem-fonte');
    const legenda = botao.parentElement.querySelector('.video-card__legenda');
    if (legenda) legenda.textContent = 'Vídeo será publicado em breve';
    return;
  }

  const video = document.createElement('video');
  video.className = 'video-card__video';
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  if (dados.poster) video.poster = dados.poster;

  botao.appendChild(video);
  botao.classList.add('video-card__botao--tocando');

  if (videoTocando && videoTocando !== video) videoTocando.pause();
  videoTocando = video;
  const p = video.play();
  if (p && p.catch) p.catch(() => { /* controles resolvem */ });
}

/**
 * IntersectionObserver: pausa o vídeo quando ele sai da tela.
 * Isso é reprodução de mídia, não animação de scroll — pode ficar fora do
 * progresso, e o projeto permite explicitamente.
 */
function observarVideos(raiz) {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) continue;
      const v = e.target.querySelector('video');
      if (v && !v.paused) v.pause();
    }
  }, { threshold: 0.25 });
  raiz.querySelectorAll('.video-card').forEach((c) => obs.observe(c));
}

/**
 * Abertura "linha de bambu" — função pura do progresso, reversível.
 * @param {number} pGlobal progresso global (0 a 1)
 */
export function definirVideos(pGlobal) {
  if (!refsVideos) return;
  const t = normalizar(pGlobal, config.videosSecao.faixa.inicio, config.videosSecao.faixa.fim);
  aplicarBambu(t);
}

function aplicarBambu(t) {
  if (!refsVideos) return;
  const M = config.videosSecao.marcos;
  const { palco, linha, linhaTopo, linhaBase, recorte, tituloBloco } = refsVideos;

  /* --- 1. Título entra esfumaçado ---------------------------------- */
  const tTitulo = suave(normalizar(t, M.titulo, M.titulo + 0.12));
  tituloBloco.style.opacity = tTitulo.toFixed(3);
  tituloBloco.style.filter = tTitulo < 0.99 ? `blur(${((1 - tTitulo) * 8).toFixed(2)}px)` : '';

  /* --- 2. Linha desce do topo até cruzar o centro ------------------ */
  const tDesce = suave(normalizar(t, M.linhaDesce, M.abreVideos));
  // top: -10% (fora) → 50% (centro)
  const posicaoLinha = -10 + tDesce * 60;

  /* --- 3. Abre: a linha se divide em duas e a grade aparece -------- */
  const tAbre = suave(normalizar(t, M.abreVideos, M.fecha));
  // A metade de cima sobe e a de baixo desce, acompanhando a abertura
  const afastamento = tAbre * 52;             // em % da altura do palco
  const recorteCima = (1 - tAbre) * 50;       // clip-path inset de 50% a 0

  /* --- 4. Fecha de novo no fim (inverso) --------------------------- */
  // O fechamento é apenas a continuação natural: quando t passa de M.fecha,
  // a abertura volta a zero suavemente e tudo se fecha ao contrário.
  const tFecha = suave(normalizar(t, M.fecha, 1));
  const aberturaFinal = tAbre * (1 - tFecha);

  const recorte2 = (1 - aberturaFinal) * 50;

  // Linha central: aparece ao descer e some quando a grade abre por completo
  const opacidadeLinha = clamp(tDesce * (1 - tAbre * 0.85), 0, 1);
  linha.style.top = `${posicaoLinha.toFixed(2)}%`;
  linha.style.opacity = opacidadeLinha.toFixed(3);

  // Linhas superior e inferior: nascem no centro e acompanham a abertura
  linhaTopo.style.top = posicaoLinha.toFixed(2) + '%';
  linhaTopo.style.transform = `translate(-50%, -50%) translateY(${-afastamento.toFixed(2)}%)`;
  linhaBase.style.top = posicaoLinha.toFixed(2) + '%';
  linhaBase.style.transform = `translate(-50%, -50%) translateY(${afastamento.toFixed(2)}%)`;
  linhaTopo.style.opacity = (tAbre > 0.02 ? opacidadeLinha : 0).toString();
  linhaBase.style.opacity = (tAbre > 0.02 ? opacidadeLinha : 0).toString();

  // A grade é revelada pelo recorte
  recorte.style.clipPath = `inset(${recorte2.toFixed(2)}% 0% ${recorte2.toFixed(2)}% 0%)`;
  recorte.style.webkitClipPath = recorte.style.clipPath;
  recorte.style.opacity = (aberturaFinal > 0.02 ? 1 : 0).toString();

  const aberto = aberturaFinal > 0.5;
  if (palco.dataset.aberto !== String(aberto)) palco.dataset.aberto = String(aberto);
}

/* ==========================================================================
 * 11. FAQ
 * ========================================================================== */

export function montarFaq() {
  const secao = document.getElementById('faq');
  if (!secao) return null;

  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'Dúvidas frequentes',
    titulo: 'O que todo mundo pergunta',
    texto: config.faqTextoApoio
  }));

  const lista = criar('div', { classe: 'faq' });

  /** Monta um item. `details/summary` nativo: acessível por teclado e leitor. */
  function item(pergunta, resposta) {
    const det = criar('details', { classe: 'faq__item' });
    det.appendChild(criar('summary', { classe: 'faq__pergunta', texto: pergunta }));

    const corpo = criar('div', { classe: 'faq__resposta' });
    const texto = (resposta && resposta.trim()) ? resposta : config.naoSeiResponder;
    corpo.appendChild(criar('p', { texto }));

    // Quando a resposta não existe, oferecemos o caminho direto.
    if (!resposta || !resposta.trim()) {
      const original = pergunta;
      corpo.appendChild(criar('a', {
        classe: 'faq__link',
        href: '#',
        'data-wa-origem': 'faq',
        'data-wa-intencao': `Dúvida: ${original}`,
        rel: 'noopener',
        texto: 'Perguntar no WhatsApp'
      }));
    }

    det.appendChild(corpo);
    return det;
  }

  // Confirmadas primeiro; depois as extras (que podem estar sem resposta)
  for (const f of config.faq) lista.appendChild(item(f.p, f.r));
  for (const f of config.faqExtras) lista.appendChild(item(f.p, f.r));

  painel.appendChild(lista);
  painel.appendChild(botaoWhatsApp('faq', 'Falar com a gente no WhatsApp', 'acao'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* ==========================================================================
 * 12. CTA FINAL
 * ========================================================================== */

export function montarCtaFinal() {
  const secao = document.getElementById('cta-final');
  if (!secao) return null;

  const C = config.ctaFinal;
  const painel = criar('div', { classe: 'painel painel--cta' });

  painel.appendChild(criar('span', { classe: 'rotulo-secao', texto: C.rotulo }));
  painel.appendChild(criar('h2', { classe: 'cta__titulo', texto: C.titulo }));
  painel.appendChild(criar('p', { classe: 'cta__texto', texto: C.texto }));

  // Passos (reduz a fricção: a pessoa sabe exatamente o que acontece)
  if (C.passos && C.passos.length) {
    const passos = criar('ol', { classe: 'passos', role: 'list' });
    C.passos.forEach((texto, i) => {
      const li = criar('li', { classe: 'passos__item' });
      li.appendChild(criar('span', { classe: 'passos__numero', texto: String(i + 1) }));
      li.appendChild(criar('span', { classe: 'passos__texto', texto }));
      passos.appendChild(li);
    });
    painel.appendChild(passos);
  }

  const acoes = criar('div', { classe: 'cta__acoes' });
  acoes.appendChild(botaoWhatsApp('ctaFinal', C.botao, 'ouro'));
  // Botão dedicado para quem quer dar imóvel na negociação
  acoes.appendChild(botaoWhatsApp('troca', C.botaoSecundario, 'vidro'));
  painel.appendChild(acoes);

  // Escassez: só a verdadeira. Vazio → texto neutro do config.
  const escassez = (C.escassez && C.escassez.trim())
    ? C.escassez
    : config.empreendimento.escassezTexto;
  if (escassez) {
    const aviso = criar('p', { classe: 'cta__escassez' });
    aviso.appendChild(criar('span', { classe: 'pulso-dot', 'aria-hidden': 'true' }));
    aviso.appendChild(criar('span', { texto: escassez }));
    painel.appendChild(aviso);
  }

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* ==========================================================================
 * RODAPÉ
 * ========================================================================== */

export function montarRodape() {
  const rodape = document.getElementById('rodape');
  if (!rodape) return null;

  const R = config.rodape;
  const legal = config.empreendimento.legal;

  const dentro = criar('div', { classe: 'rodape__dentro' });

  // Coluna 1: marca + sobre
  const col1 = criar('div', { classe: 'rodape__coluna' });
  col1.appendChild(criar('strong', { classe: 'rodape__marca', texto: config.empreendimento.nome }));
  col1.appendChild(criar('p', { classe: 'rodape__sobre', texto: R.sobre }));
  dentro.appendChild(col1);

  // Coluna 2: links
  const col2 = criar('div', { classe: 'rodape__coluna' });
  col2.appendChild(criar('h3', { classe: 'rodape__titulo', texto: 'Informações' }));
  const links = criar('ul', { classe: 'rodape__links' });
  for (const l of R.links) {
    const li = criar('li');
    const a = criar('a', {
      href: l.href,
      texto: l.texto,
      rel: l.href.startsWith('http') ? 'noopener noreferrer' : null
    });
    if (l.acao === 'cookies') {
      a.setAttribute('data-abrir-cookies', '1');
      a.setAttribute('href', '#');
    }
    li.appendChild(a);
    links.appendChild(li);
  }
  col2.appendChild(links);
  dentro.appendChild(col2);

  // Coluna 3: contato
  const col3 = criar('div', { classe: 'rodape__coluna' });
  col3.appendChild(criar('h3', { classe: 'rodape__titulo', texto: 'Contato' }));
  if (R.mostrarWhatsApp) {
    col3.appendChild(criar('a', {
      classe: 'btn btn--acao rodape__botao',
      href: '#',
      'data-wa-origem': 'flutuante',
      rel: 'noopener',
      texto: 'Falar no WhatsApp'
    }));
  }
  // Dados legais: só aparecem quando preenchidos no config.js
  const dados = criar('ul', { classe: 'rodape__dados' });
  if (legal.razaoSocial) dados.appendChild(criar('li', { texto: legal.razaoSocial }));
  if (legal.cnpj) dados.appendChild(criar('li', { texto: `CNPJ ${legal.cnpj}` }));
  if (legal.creci) dados.appendChild(criar('li', { texto: `CRECI ${legal.creci}` }));
  if (legal.emailContato) {
    const li = criar('li');
    li.appendChild(criar('a', { href: `mailto:${legal.emailContato}`, texto: legal.emailContato }));
    dados.appendChild(li);
  }
  if (dados.children.length) col3.appendChild(dados);
  dentro.appendChild(col3);

  rodape.replaceChildren(dentro);

  // Base legal: aviso de valores + copyright
  const base = criar('div', { classe: 'rodape__base' });
  base.appendChild(criar('p', { classe: 'rodape__aviso', texto: legal.avisoValores }));
  const ano = R.ano || String(new Date().getFullYear());
  base.appendChild(criar('p', {
    classe: 'rodape__copyright',
    texto: `© ${ano} ${config.empreendimento.nome}. Todos os direitos reservados.`
  }));
  rodape.appendChild(base);

  return rodape;
}

/* ==========================================================================
 * Montagem de tudo desta fase
 * ========================================================================== */

export function montarSecoesDaFase3() {
  return {
    glebas: montarGlebas(),
    videos: montarVideos(),
    faq: montarFaq(),
    ctaFinal: montarCtaFinal(),
    rodape: montarRodape()
  };
}

export default { montarSecoesDaFase3, definirVideos };
