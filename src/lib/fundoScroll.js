/* ============================================================================
 * fundoScroll.js — MOTOR DE FUNDO DE VÍDEO EM TEMPO REAL POR SCROLL E TOQUE
 * ----------------------------------------------------------------------------
 * Vídeo 1 (O Lago e Amanhecer): Fundo da seção HERO (188 frames @ 20fps)
 * Vídeo 2 (Mata e Natureza): Fundo das seções abaixo (208 frames @ 20fps)
 * 
 * Alta taxa de quadros e fluidez com interpolação contínua (lerp a 60 FPS)
 * Estilo inteligente no PC para não esticar vídeo vertical em tela widescreen.
 * ==========================================================================*/

let canvas = null;
let ctx = null;
let dpr = 1;
let largura = 0;
let altura = 0;

const TOTAL_HERO = 188;
const TOTAL_SECOES = 208;

const framesHero = new Array(TOTAL_HERO).fill(null);
const framesSecoes = new Array(TOTAL_SECOES).fill(null);

let heroElement = null;
let animando = false;

// Variáveis para interpolação suave (lerp)
let progressoAlvoHero = 0;
let progressoAtualHero = 0;
let progressoAlvoSecoes = 0;
let progressoAtualSecoes = 0;
let emHero = true;

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
  window.addEventListener('scroll', onScrollOuToque, { passive: true });
  window.addEventListener('touchmove', onScrollOuToque, { passive: true });

  onScrollOuToque();
  iniciarLoopAnimacao();

  return { redimensionar, onScrollOuToque };
}

function redimensionar() {
  if (!canvas || !ctx) return;
  largura = window.innerWidth;
  altura = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  onScrollOuToque();
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
  // Carrega primeiros frames de imediato
  carregarImagem('/media/frames/hero/fundo1_0001.webp').then((img) => {
    if (img) {
      framesHero[0] = img;
      desenharFrameAtual();
    }
  });

  carregarImagem('/media/frames/secoes/fundo2_0001.webp').then((img) => {
    if (img) {
      framesSecoes[0] = img;
    }
  });
}

function iniciarCarregamentoCompleto() {
  let iHero = 1;
  let iSecoes = 1;

  function carregarLote() {
    const promessas = [];

    // Carrega blocos de 8 frames por rodada
    for (let k = 0; k < 8 && iHero < TOTAL_HERO; k++, iHero++) {
      const idx = iHero;
      const num = String(idx + 1).padStart(4, '0');
      promessas.push(
        carregarImagem(`/media/frames/hero/fundo1_${num}.webp`).then((img) => {
          if (img) framesHero[idx] = img;
        })
      );
    }

    for (let k = 0; k < 8 && iSecoes < TOTAL_SECOES; k++, iSecoes++) {
      const idx = iSecoes;
      const num = String(idx + 1).padStart(4, '0');
      promessas.push(
        carregarImagem(`/media/frames/secoes/fundo2_${num}.webp`).then((img) => {
          if (img) framesSecoes[idx] = img;
        })
      );
    }

    if (iHero < TOTAL_HERO || iSecoes < TOTAL_SECOES) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(carregarLote, { timeout: 100 });
      } else {
        setTimeout(carregarLote, 20);
      }
    }
  }

  setTimeout(carregarLote, 50);
}

function obterFrameProximo(arrayFrames, indiceAlvo, total) {
  const clampIdx = Math.max(0, Math.min(total - 1, indiceAlvo));
  if (arrayFrames[clampIdx]) return arrayFrames[clampIdx];

  // Busca o frame carregado mais próximo
  for (let delta = 1; delta < total; delta++) {
    const antes = clampIdx - delta;
    if (antes >= 0 && arrayFrames[antes]) return arrayFrames[antes];
    const depois = clampIdx + delta;
    if (depois < total && arrayFrames[depois]) return arrayFrames[depois];
  }
  return null;
}

/**
 * Desenha a imagem no canvas com estilo inteligente:
 * - No Mobile: cover 100% preenchendo a tela verticalmente sem cortes estranhos.
 * - No PC (Desktop widescreen): evita esticar 300% cortando o lago.
 *   Desenha fundo ambiente com suave vinheta e o vídeo em proporção confortável no centro.
 */
function desenharQuadroInteligente(img, opacidade = 1) {
  if (!ctx || !img) return;
  const iw = img.naturalWidth || img.width || 720;
  const ih = img.naturalHeight || img.height || 1280;

  const aspectTela = largura / altura;
  const aspectVideo = iw / ih;

  ctx.globalAlpha = opacidade;

  if (aspectTela > 1.05) {
    // === PC / DESKTOP WIDESCREEN ===
    // 1. Fundo escuro verde-petróleo base
    ctx.fillStyle = '#021114';
    ctx.fillRect(0, 0, largura, altura);

    // 2. Fundo ambiente com zoom suave e escurecido nas laterais
    const escalaBg = Math.max(largura / iw, altura / ih);
    const bgW = iw * escalaBg;
    const bgH = ih * escalaBg;
    const bgX = (largura - bgW) * 0.5;
    const bgY = (altura - bgH) * 0.5;

    ctx.globalAlpha = opacidade * 0.28;
    ctx.drawImage(img, bgX, bgY, bgW, bgH);

    // 3. Imagem principal centralizada preservando a altura total da cena (sem esticar excessivamente)
    ctx.globalAlpha = opacidade;
    const escalaFg = (altura / ih) * 1.06;
    const fgW = iw * escalaFg;
    const fgH = ih * escalaFg;
    const fgX = (largura - fgW) * 0.5;
    const fgY = (altura - fgH) * 0.5;

    ctx.drawImage(img, fgX, fgY, fgW, fgH);

    // 4. Suave degradê lateral orgânico para integrar a cena perfeitamente ao fundo
    const gradEsq = ctx.createLinearGradient(fgX, 0, fgX + 160, 0);
    gradEsq.addColorStop(0, '#021114');
    gradEsq.addColorStop(1, 'rgba(2, 17, 20, 0)');
    ctx.fillStyle = gradEsq;
    ctx.fillRect(fgX, 0, 160, altura);

    const gradDir = ctx.createLinearGradient(fgX + fgW - 160, 0, fgX + fgW, 0);
    gradDir.addColorStop(0, 'rgba(2, 17, 20, 0)');
    gradDir.addColorStop(1, '#021114');
    ctx.fillStyle = gradDir;
    ctx.fillRect(fgX + fgW - 160, 0, 160, altura);

  } else {
    // === MOBILE (vertical) ===
    const escala = Math.max(largura / iw, altura / ih);
    const dw = iw * escala;
    const dh = ih * escala;
    const dx = (largura - dw) * 0.5;
    const dy = (altura - dh) * 0.5;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  ctx.globalAlpha = 1;
}

function onScrollOuToque() {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const heroAltura = heroElement ? heroElement.offsetHeight : window.innerHeight;

  if (scrollY < heroAltura) {
    emHero = true;
    progressoAlvoHero = Math.min(1, Math.max(0, scrollY / heroAltura));
  } else {
    emHero = false;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - heroAltura - window.innerHeight);
    progressoAlvoSecoes = Math.min(1, Math.max(0, (scrollY - heroAltura) / maxScroll));
  }

  if (!animando) {
    animando = true;
    requestAnimationFrame(loopSuavizacao);
  }
}

function loopSuavizacao() {
  let mudou = false;

  // Interpolação contínua (lerp 0.20) para alta taxa de quadros e fluidez
  const diffHero = progressoAlvoHero - progressoAtualHero;
  if (Math.abs(diffHero) > 0.0008) {
    progressoAtualHero += diffHero * 0.22;
    mudou = true;
  } else {
    progressoAtualHero = progressoAlvoHero;
  }

  const diffSecoes = progressoAlvoSecoes - progressoAtualSecoes;
  if (Math.abs(diffSecoes) > 0.0008) {
    progressoAtualSecoes += diffSecoes * 0.22;
    mudou = true;
  } else {
    progressoAtualSecoes = progressoAlvoSecoes;
  }

  desenharFrameAtual();

  if (mudou) {
    requestAnimationFrame(loopSuavizacao);
  } else {
    animando = false;
  }
}

function desenharFrameAtual() {
  if (!ctx) return;

  if (emHero) {
    const idx = Math.min(TOTAL_HERO - 1, Math.floor(progressoAtualHero * TOTAL_HERO));
    const imgHero = obterFrameProximo(framesHero, idx, TOTAL_HERO);

    if (imgHero) {
      ctx.clearRect(0, 0, largura, altura);
      desenharQuadroInteligente(imgHero, 1);

      // Transição suave no final do hero para as seções
      if (progressoAtualHero > 0.84) {
        const alfa = (progressoAtualHero - 0.84) / 0.16;
        const imgSec = obterFrameProximo(framesSecoes, 0, TOTAL_SECOES);
        if (imgSec) {
          desenharQuadroInteligente(imgSec, alfa);
        }
      }
    }
  } else {
    const idx = Math.min(TOTAL_SECOES - 1, Math.floor(progressoAtualSecoes * TOTAL_SECOES));
    const imgSecoes = obterFrameProximo(framesSecoes, idx, TOTAL_SECOES);

    if (imgSecoes) {
      ctx.clearRect(0, 0, largura, altura);
      desenharQuadroInteligente(imgSecoes, 1);
    }
  }
}

function iniciarLoopAnimacao() {
  desenharFrameAtual();
}

export default { iniciarFundoScroll };
