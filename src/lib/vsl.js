/* ============================================================================
 * vsl.js — SEÇÃO 3: A TV QUE LIGA
 * ----------------------------------------------------------------------------
 * A moldura começa DESLIGADA (preta). Conforme a pessoa rola, e sempre como
 * FUNÇÃO DO PROGRESSO (reversível, sem evento, sem play):
 *
 *   0.00  linha de luz cresce no centro (uma risca horizontal fina)
 *   0.34  a linha abre para cima e para baixo, virando tela
 *   0.62  clarão curto (flash)
 *   0.74  aparecem logo, título e botão PLAY, com efeito esfumaçado
 *
 * O clipe NUNCA carrega sozinho. Só o poster entra. O arquivo de vídeo é
 * baixado no clique — é o que segura o LCP e o consumo de dados de quem chega
 * por anúncio no celular.
 *
 * Duas âncoras de tempo:
 *   • definirProgresso(p)  → liga/desliga a TV (scroll, função pura)
 *   • aoClicarPlay()       → troca a fachada pelo vídeo de verdade
 * ==========================================================================*/

import config from '../config.js';
import { clamp, normalizar, suave } from './utils.js';
import { icone } from './icones.js';

let secao = null;
let moldura = null;
let tela = null;
let linhaTopo = null;
let linhaBase = null;
let flash = null;
let conteudo = null;
let titulo = null;
let subtitulo = null;
let botaoPlay = null;
let poster = null;
let video = null;

let ativo = false;
let ligada = false;      // já passou do ponto de abrir a tela
let tocando = false;     // o vídeo de verdade está carregado/tocando

/* --------------------------------------------------------------------------
 * Montagem
 * ------------------------------------------------------------------------ */

export function iniciarVsl() {
  secao = document.getElementById('vsl');
  if (!secao) return null;

  const V = config.vsl;

  // ---- estrutura da seção -------------------------------------------------
  moldura = document.createElement('div');
  moldura.className = 'vsl';
  moldura.dataset.ligada = 'false';

  // Tela (o "painel" que acende) com as duas linhas de luz e o flash
  tela = document.createElement('div');
  tela.className = 'vsl__tela';

  linhaTopo = document.createElement('span');
  linhaTopo.className = 'vsl__linha vsl__linha--topo';
  linhaBase = document.createElement('span');
  linhaBase.className = 'vsl__linha vsl__linha--base';
  flash = document.createElement('span');
  flash.className = 'vsl__flash';

  // Fachada: poster + botão PLAY
  const fachada = document.createElement('div');
  fachada.className = 'vsl__fachada';

  poster = document.createElement('div');
  poster.className = 'vsl__poster';
  if (V.poster) {
    // <picture> com AVIF/WebP quando você enviar os arquivos.
    const img = document.createElement('img');
    img.src = V.poster;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 1280;
    img.height = 720;
    poster.appendChild(img);
    poster.classList.add('vsl__poster--com-imagem');
  } else {
    // Placeholder funcional: gradiente + aviso de onde entra o poster.
    poster.classList.add('vsl__poster--vazio');
    const aviso = document.createElement('span');
    aviso.className = 'vsl__aviso';
    aviso.textContent = 'Poster do vídeo entra aqui';
    poster.appendChild(aviso);
  }

  // Conteúdo sobre a fachada (logo/título + play), revelado pelo progresso
  conteudo = document.createElement('div');
  conteudo.className = 'vsl__conteudo';

  titulo = document.createElement('h2');
  titulo.className = 'vsl__titulo';
  titulo.textContent = V.titulo;

  subtitulo = document.createElement('p');
  subtitulo.className = 'vsl__subtitulo';
  subtitulo.textContent = V.subtitulo;

  botaoPlay = document.createElement('button');
  botaoPlay.type = 'button';
  botaoPlay.className = 'vsl__play';
  botaoPlay.setAttribute('aria-label', `Assistir: ${V.titulo}`);

  const iconePlay = document.createElement('span');
  iconePlay.className = 'vsl__play-icone';
  iconePlay.innerHTML = icone('play', { tamanho: 22 });   // desenho nosso

  const textoPlay = document.createElement('span');
  textoPlay.className = 'vsl__play-texto';
  textoPlay.textContent = V.duracao ? `Assistir · ${V.duracao}` : 'Assistir';

  botaoPlay.append(iconePlay, textoPlay);
  botaoPlay.addEventListener('click', aoClicarPlay);

  conteudo.append(titulo, subtitulo, botaoPlay);

  fachada.append(poster, conteudo);
  tela.append(linhaTopo, linhaBase, flash, fachada);

  // Legenda acessível da seção
  const legenda = document.createElement('p');
  legenda.className = 'vsl__legenda';
  legenda.textContent = V.legenda;

  moldura.append(tela, legenda);
  secao.replaceChildren(moldura);
  secao.hidden = false;

  ativo = true;
  aplicar(0);   // estado inicial: desligada

  return { definirProgresso, destruir };
}

/* --------------------------------------------------------------------------
 * Animação por progresso
 * ------------------------------------------------------------------------ */

/**
 * Aplica um progresso da faixa (0 a 1) na TV.
 * @param {number} pGlobal progresso global da página (0 a 1)
 */
export function definirProgresso(pGlobal) {
  if (!ativo) return;
  const t = normalizar(pGlobal, config.vsl.faixa.inicio, config.vsl.faixa.fim);
  aplicar(t);
}

function aplicar(t) {
  const M = config.vsl.marcos;
  const V = config.vsl;

  /* --- 1. Linha de luz cresce no centro ----------------------------- */
  // Antes do marco, a linha cresce de 0 a 1 de largura; depois se mantém.
  const cresc = normalizar(t, M.linhaCresce, M.abreTela);
  const larguraLinha = suave(cresc);

  /* --- 2. A tela abre (clip-path de 50% para 0) -------------------- */
  const abertura = suave(normalizar(t, M.abreTela, M.flash));
  // inset(top right bottom left): 50% 0 50% 0 → 0 0 0 0
  const recorte = (1 - abertura) * 50;

  /* --- 3. Flash: um clarão curto em torno do marco ----------------- */
  const janelaFlash = 0.14;
  const dFlash = Math.abs(t - M.flash);
  const intensidade = dFlash < janelaFlash
    ? (1 - dFlash / janelaFlash) * V.forcaFlash
    : 0;

  /* --- 4. Conteúdo (título, subtítulo, play) ------------------------ */
  const aparec = suave(normalizar(t, M.revelaConteudo, 1));
  const desfoque = (1 - aparec) * 12;

  // Só escreve quando cruza o limiar: evita escrita de estilo inútil.
  const estaLigada = t > M.abreTela;
  if (estaLigada !== ligada) {
    ligada = estaLigada;
    moldura.dataset.ligada = ligada ? 'true' : 'false';
  }

  // Linhas: crescem em largura e depois acompanham a abertura (sobem/descem)
  const deslocLinha = abertura * 50;   // em % da tela
  linhaTopo.style.transform =
    `translate(-50%, -50%) scaleX(${larguraLinha.toFixed(4)}) translateY(${-deslocLinha.toFixed(2)}%)`;
  linhaBase.style.transform =
    `translate(-50%, -50%) scaleX(${larguraLinha.toFixed(4)}) translateY(${deslocLinha.toFixed(2)}%)`;
  linhaTopo.style.opacity = (cresc > 0.01 ? 1 : 0).toString();
  linhaBase.style.opacity = (cresc > 0.01 ? 1 : 0).toString();

  // Recorte da tela + brilho da borda
  tela.style.clipPath = `inset(${recorte.toFixed(2)}% 0% ${recorte.toFixed(2)}% 0%)`;
  tela.style.webkitClipPath = tela.style.clipPath;

  // Flash
  flash.style.opacity = intensidade.toFixed(3);

  // Conteúdo revelado com desfoque (usado só aqui e só nestes textos)
  conteudo.style.opacity = aparec.toFixed(3);
  conteudo.style.filter = desfoque > 0.3 ? `blur(${desfoque.toFixed(2)}px)` : '';
  conteudo.style.transform = `translateY(${((1 - aparec) * 14).toFixed(2)}px)`;
}

/* --------------------------------------------------------------------------
 * Play: aqui sim o vídeo de verdade entra (facade)
 * ------------------------------------------------------------------------ */

function aoClicarPlay() {
  if (tocando) {
    // Segundo clique: alterna play/pause
    if (video.paused) video.play(); else video.pause();
    return;
  }

  const V = config.vsl;
  const mp4 = V.fontes && V.fontes.mp4;
  const webm = V.fontes && V.fontes.webm;

  if (!mp4 && !webm) {
    // Sem arquivo ainda: avisa de forma clara em vez de não fazer nada.
    botaoPlay.classList.add('vsl__play--sem-fonte');
    const texto = botaoPlay.querySelector('.vsl__play-texto');
    if (texto) texto.textContent = 'Vídeo será publicado em breve';
    return;
  }

  tocando = true;

  video = document.createElement('video');
  video.className = 'vsl__video';
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  // O vídeo pode ter som: é o ÚNICO com áudio, e só toca após o clique.
  video.poster = V.poster || '';

  if (webm) {
    const s = document.createElement('source');
    s.src = webm;
    s.type = 'video/webm';
    video.appendChild(s);
  }
  if (mp4) {
    const s = document.createElement('source');
    s.src = mp4;
    s.type = 'video/mp4';
    video.appendChild(s);
  }
  if (V.legendas) {
    const track = document.createElement('track');
    track.kind = 'captions';
    track.src = V.legendas;
    track.srclang = 'pt';
    track.label = 'Português';
    track.default = true;
    video.appendChild(track);
  }

  // Coloca o vídeo dentro da tela e esconde a fachada
  tela.appendChild(video);
  tela.classList.add('vsl__tela--tocando');
  botaoPlay.disabled = true;

  video.addEventListener('play', () => {
    try {
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { conteudo: 'vsl' });
      if (typeof window.gtag === 'function') window.gtag('event', 'play_vsl');
    } catch { /* rastreamento nunca quebra a reprodução */ }
  }, { once: true });

  const promessa = video.play();
  if (promessa && promessa.catch) {
    // Alguns navegadores exigem um segundo toque; o controle nativo resolve.
    promessa.catch(() => { /* controles já estão visíveis */ });
  }
}

export function destruir() {
  ativo = false;
  ligada = false;
  tocando = false;
  video = null;
}

export default { iniciarVsl, definirProgresso, destruir };
