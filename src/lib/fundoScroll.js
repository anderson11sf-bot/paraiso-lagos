/* ============================================================================
 * fundoScroll.js — MOTOR DE FUNDO DE VÍDEO EM TEMPO REAL POR SCROLL E TOQUE
 * ----------------------------------------------------------------------------
 * Vídeo 1 (O Lago e Amanhecer): Fundo da seção HERO
 * Vídeo 2 (Mata e Natureza): Fundo das seções abaixo (VSL, Glebas, Projetos...)
 * 
 * Funciona com toque em tempo real (touchmove/scroll) usando sequência de frames
 * WebP em Canvas com cobertura cover e zero atraso de decoder.
 * ==========================================================================*/

let canvas = null;
let ctx = null;
let dpr = 1;
let largura = 0;
let altura = 0;

const TOTAL_HERO = 94;
const TOTAL_SECOES = 104;

const framesHero = new Array(TOTAL_HERO).fill(null);
const framesSecoes = new Array(TOTAL_SECOES).fill(null);

let heroElement = null;
let animando = false;
let ultimoIndiceHero = -1;
let ultimoIndiceSecoes = -1;
let ultimoModo = '';

export function iniciarFundoScroll() {
  canvas = document.getElementById('fundo-canvas');
  if (!canvas) return null;

  ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  heroElement = document.getElementById('hero');

  redimensionar();
  carregarPrimeirosFrames();
  iniciarCarregamentoCompleto();

  window.addEventListener('resize', redimensionar, { passive: true });
  window.addEventListener('scroll', agendarAtualizacao, { passive: true });
  window.addEventListener('touchmove', agendarAtualizacao, { passive: true });

  atualizarQuadro();

  return { redimensionar, agendarAtualizacao };
}

function redimensionar() {
  if (!canvas || !ctx) return;
  largura = window.innerWidth;
  altura = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ultimoIndiceHero = -1;
  ultimoIndiceSecoes = -1;
  agendarAtualizacao();
}

function carregarImagem(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function carregarPrimeirosFrames() {
  // Carrega frame 0 do Hero e das Seções imediatamente para renderizar sem delay
  carregarImagem('/media/frames/hero/fundo1_0001.webp').then((img) => {
    if (img) {
      framesHero[0] = img;
      atualizarQuadro();
    }
  });

  carregarImagem('/media/frames/secoes/fundo2_0001.webp').then((img) => {
    if (img) {
      framesSecoes[0] = img;
    }
  });
}

function iniciarCarregamentoCompleto() {
  // Carrega os frames progressivamente em background
  let iHero = 1;
  let iSecoes = 1;

  function carregarLote() {
    let promessas = [];

    // Prioriza Hero primeiros 30 frames
    for (let k = 0; k < 6 && iHero < TOTAL_HERO; k++, iHero++) {
      const idx = iHero;
      const num = String(idx + 1).padStart(4, '0');
      promessas.push(
        carregarImagem(`/media/frames/hero/fundo1_${num}.webp`).then((img) => {
          if (img) framesHero[idx] = img;
        })
      );
    }

    for (let k = 0; k < 6 && iSecoes < TOTAL_SECOES; k++, iSecoes++) {
      const idx = iSecoes;
      const num = String(idx + 1).padStart(4, '0');
      promessas.push(
        carregarImagem(`/media/frames/secoes/fundo2_${num}.webp`).then((img) => {
          if (img) framesSecoes[idx] = img;
        })
      );
    }

    if (iHero < TOTAL_HERO || iSecoes < TOTAL_SECOES) {
      Promise.all(promessas).then(() => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(carregarLote, { timeout: 150 });
        } else {
          setTimeout(carregarLote, 30);
        }
      });
    }
  }

  setTimeout(carregarLote, 100);
}

function obterFrameProximo(arrayFrames, indiceAlvo, total) {
  if (arrayFrames[indiceAlvo]) return arrayFrames[indiceAlvo];
  // Procura o frame carregado mais próximo
  for (let delta = 1; delta < total; delta++) {
    const antes = indiceAlvo - delta;
    if (antes >= 0 && arrayFrames[antes]) return arrayFrames[antes];
    const depois = indiceAlvo + delta;
    if (depois < total && arrayFrames[depois]) return arrayFrames[depois];
  }
  return null;
}

function desenharCover(img, opacidade = 1) {
  if (!ctx || !img) return;
  const iw = img.naturalWidth || img.width || 720;
  const ih = img.naturalHeight || img.height || 1280;

  const escala = Math.max(largura / iw, altura / ih);
  const dw = iw * escala;
  const dh = ih * escala;
  const dx = (largura - dw) * 0.5;
  const dy = (altura - dh) * 0.5;

  ctx.globalAlpha = opacidade;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}

function agendarAtualizacao() {
  if (!animando) {
    animando = true;
    requestAnimationFrame(atualizarQuadro);
  }
}

function atualizarQuadro() {
  animando = false;
  if (!ctx) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const heroAltura = heroElement ? heroElement.offsetHeight : window.innerHeight;

  if (scrollY < heroAltura) {
    // ---- 1. SEÇÃO HERO (Vídeo 1: O Lago) ----
    const progHero = Math.min(1, Math.max(0, scrollY / heroAltura));
    const idx = Math.min(TOTAL_HERO - 1, Math.floor(progHero * TOTAL_HERO));

    const imgHero = obterFrameProximo(framesHero, idx, TOTAL_HERO);
    if (imgHero) {
      ctx.clearRect(0, 0, largura, altura);
      desenharCover(imgHero, 1);

      // Transição suave para o vídeo 2 no fim do hero
      if (progHero > 0.82) {
        const alfaTrans = (progHero - 0.82) / 0.18;
        const imgSec = obterFrameProximo(framesSecoes, 0, TOTAL_SECOES);
        if (imgSec) {
          desenharCover(imgSec, alfaTrans);
        }
      }
    }
  } else {
    // ---- 2. SEÇÕES ABAIXO (Vídeo 2: Mata e Natureza) ----
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - heroAltura - window.innerHeight);
    const progSecoes = Math.min(1, Math.max(0, (scrollY - heroAltura) / maxScroll));
    const idx = Math.min(TOTAL_SECOES - 1, Math.floor(progSecoes * TOTAL_SECOES));

    const imgSecoes = obterFrameProximo(framesSecoes, idx, TOTAL_SECOES);
    if (imgSecoes) {
      ctx.clearRect(0, 0, largura, altura);
      desenharCover(imgSecoes, 1);
    }
  }
}

export default { iniciarFundoScroll };
