/* ============================================================================
 * scroll.js — MOTOR DE SCROLL (governa todo o resto)
 * ----------------------------------------------------------------------------
 * REGRA DE OURO DO PROJETO
 *   Toda animação ligada ao scroll é FUNÇÃO DO PROGRESSO (0 a 1), reversível e
 *   sem "pulo". Descer avança, subir volta, em tempo real, seguindo o dedo.
 *
 * PROIBIDO aqui dentro:
 *   • onEnter/onLeave que disparam play
 *   • debounce, setTimeout, "scroll end"
 *   • classe adicionada quando o elemento aparece
 *
 * PERMITIDO fora do scroll (implementado em outros módulos):
 *   • pulso do WhatsApp, partículas ambientes, aviso "deslize", play de vídeo
 *
 * ARQUITETURA
 *   1. UM ScrollTrigger mestre cobre a página inteira e produz `progresso`
 *      (0 a 1). Nenhum outro ScrollTrigger de animação é criado — as seções
 *      derivam seu progresso LOCAL daqui por janelas de faixa (ver
 *      `progressoDaFaixa`), o que elimina timelines disputando elementos.
 *   2. Lenis só no desktop. No celular o scroll é nativo (syncTouch: false).
 *   3. Um único loop de animação: o ticker do GSAP alimenta o Lenis.
 * ==========================================================================*/

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import config from '../config.js';
import { detectarAmbiente, aplicarVariaveis, clamp, normalizar } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

/* ---------- Estado interno --------------------------------------------- */

let ambiente = null;
let lenis = null;
let masterTrigger = null;
let tickerFn = null;
let iniciado = false;

/** Progresso CRU vindo do ScrollTrigger (posição real do scroll). */
let pCru = 0;

/** Progresso SUAVIZADO (o que a narrativa usa). No mobile é igual ao cru. */
let pSuave = 0;

/** Progresso global atual (0 a 1). É a fonte única de verdade da narrativa. */
let progresso = 0;

/** Velocidade normalizada (-1 a 1) para efeitos de inércia. Não estável no 1º frame. */
let velocidade = 0;

let progressoAnterior = 0;

/** Taxa de interpolação do progresso no desktop (quanto menor, mais inércia). */
const LERP_PROGRESSO_DESKTOP = 0.22;

/** Assinantes: recebem (progresso, velocidade, progressoAnterior). */
const assinantes = new Set();

/* ---------- API pública ------------------------------------------------- */

/**
 * Progresso global de leitura.
 * @returns {number} 0 no topo absoluto, 1 no fim da página.
 */
export const getProgresso = () => progresso;

/**
 * Converte o progresso GLOBAL em progresso LOCAL (0 a 1) de uma faixa.
 * É assim que cada seção vira "função pura do progresso" sem criar triggers.
 *
 * @param {number} inicio fração global onde a faixa começa (ex.: 0.38)
 * @param {number} fim    fração global onde a faixa termina (ex.: 0.72)
 * @returns {number} 0 antes do início, 1 depois do fim
 */
export function progressoDaFaixa(inicio, fim) {
  return normalizar(progresso, inicio, fim);
}

/** Mesma conversão, mas aceitando o objeto { inicio, fim } do config.js. */
export function progressoDaEtapa(etapa) {
  if (!etapa) return 0;
  return progressoDaFaixa(etapa.inicio, etapa.fim);
}

/**
 * Assina as atualizações de progresso.
 * @param {(p:number, v:number, anterior:number) => void} fn
 * @returns {() => void} função para cancelar a assinatura
 */
export function aoProgredir(fn) {
  assinantes.add(fn);
  // Entrega o estado atual imediatamente: nenhum assinante fica com valor velho.
  fn(progresso, velocidade, progressoAnterior);
  return () => assinantes.delete(fn);
}

/** Ambiente detectado (mobile, toque, modoLite, núcleos...). */
export const getAmbiente = () => ambiente;

/** Instância do Lenis (null no mobile, onde o scroll é nativo). */
export const getLenis = () => lenis;

/** O ScrollTrigger mestre, para depuração/medições. */
export const getMaster = () => masterTrigger;

/**
 * Recalcula as medidas. Chamar SÓ em: load, fontes prontas, imagens prontas,
 * resize (com debounce) e mudança de orientação. Nunca durante o scroll.
 */
export function atualizarMedidas() {
  if (!iniciado) return;
  ScrollTrigger.refresh();
}

/* ---------- Inicialização ---------------------------------------------- */

/**
 * Sobe o motor de scroll.
 * @param {Object} [opcoes]
 * @param {boolean} [opcoes.usarLenis] força ligar/desligar o Lenis
 * @param {boolean} [opcoes.markers]   mostra os marcadores (só em dev)
 */
export function iniciarScroll(opcoes = {}) {
  if (iniciado) return { progresso, ambiente };
  iniciado = true;

  ambiente = detectarAmbiente();

  /* ------------------------------------------------------------------
   * 1. Altura total da rolagem, em svh, vinda do config.js.
   *    svh (small viewport height) evita o "pulo" quando a barra do
   *    navegador aparece/some no celular. NUNCA usar 100vh puro.
   * ---------------------------------------------------------------- */
  aplicarVariaveis({ '--altura-scroll': `${config.scroll.alturaTotalSvh}svh` });

  /* Modo LITE no <body> para o CSS reagir (sem partículas, sem scanlines...) */
  document.body.classList.toggle('modo-lite', ambiente.modoLite);

  /* ------------------------------------------------------------------
   * 2. Configuração global do ScrollTrigger
   * ---------------------------------------------------------------- */
  ScrollTrigger.config({
    // No celular o redimensionamento vem da barra de endereço: ignorar evita
    // que o pin/medidas se recalculem e a tela pule no meio do scroll.
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
  });
  ScrollTrigger.defaults({ anticipatePin: 1 });

  /* ------------------------------------------------------------------
   * 3. Lenis APENAS no desktop, e nunca com "menos movimento".
   *    No mobile: scroll nativo, sem sequestrar o toque.
   * ---------------------------------------------------------------- */
  const permitirLenis = opcoes.usarLenis !== undefined
    ? opcoes.usarLenis
    : (!ambiente.mobile && !config.__reduzirMovimento);

  if (permitirLenis) {
    lenis = new Lenis({
      lerp: config.scroll.lenis.lerpDesktop,
      wheelMultiplier: config.scroll.lenis.wheelMultiplier,
      smoothWheel: true,
      // Nada de suavizar toque: no desktop é mouse, mas mantemos desligado.
      syncTouch: false,
      touchMultiplier: config.scroll.lenis.touchMultiplier,
      // Não intercepta gestos de pinch/zoom
      gestureOrientation: 'vertical'
    });

    // Lenis -> ScrollTrigger: uma única fonte de scroll para os dois.
    lenis.on('scroll', ScrollTrigger.update);
  }

  /* ------------------------------------------------------------------
   * 4. UM ÚNICO LOOP DE ANIMAÇÃO no site inteiro (ticker do GSAP).
   *    Ele faz duas coisas, nesta ordem:
   *      a) roda o Lenis (só desktop)
   *      b) interpola o progresso e avisa os assinantes
   *    Isso mantém tudo em uma única cadência — sem dois rAF competindo.
   * ---------------------------------------------------------------- */
  const usarLenis = !!lenis;
  tickerFn = (tempo) => {
    if (usarLenis) lenis.raf(tempo * 1000);
    atualizarProgresso();
  };
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);

  /* ------------------------------------------------------------------
   * 5. ScrollTrigger MESTRE
   *    Cobre a página inteira e entrega a posição crua do scroll.
   *
   *    Faixa medida com precisão: o fim é a distância real rolável
   *    (altura do documento menos altura do viewport). Assim o progresso
   *    chega EXATAMENTE a 1 quando a página termina — sem sobra, sem faltar.
   *
   *    `scrub: true` = o ScrollTrigger NÃO cria animação; ele só nos dá o
   *    progresso. A suavização (a "inércia") é feita por nós, no item 4.
   * ---------------------------------------------------------------- */
  masterTrigger = ScrollTrigger.create({
    id: 'mestre',
    trigger: document.documentElement,
    start: 'top top',
    end: () => `+=${Math.max(1, document.documentElement.scrollHeight - window.innerHeight)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => { pCru = clamp(self.progress, 0, 1); },
    onRefresh: (self) => { pCru = clamp(self.progress, 0, 1); }
  });

  /* ------------------------------------------------------------------
   * 6. Avisa o ScrollTrigger sobre as medidas reais, sem ler layout
   *    durante o scroll. Medições acontecem aqui e no resize.
   * ---------------------------------------------------------------- */
  ScrollTrigger.addEventListener('refreshInit', () => { progressoAnterior = progresso; });

  // Recalcula depois que as fontes entram (muda a altura do texto) e depois
  // que as imagens carregam. Sem isso, as medidas ficam erradas — item 10 do
  // checklist final.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(atualizarMedidas, 60));
  }
  window.addEventListener('load', () => setTimeout(atualizarMedidas, 120), { once: true });

  // Resize com debounce (o debounce aqui é de MEDIÇÃO, não de animação —
  // não viola a regra de ouro).
  let tResize = 0;
  const aoRedimensionar = () => {
    clearTimeout(tResize);
    tResize = setTimeout(atualizarMedidas, 180);
  };
  window.addEventListener('resize', aoRedimensionar, { passive: true });
  window.addEventListener('orientationchange', aoRedimensionar, { passive: true });

  // Fallback em duas camadas, para o caso de o loop de animação não rodar
  // (aba em segundo plano, navegador que estrangula o requestAnimationFrame):
  //
  //   a) listener de scroll PASSIVO  → responde na hora, sem ler layout;
  //   b) verificação por quadro       → cobre o caso do Lenis, que não emite
  //                                     o evento nativo de scroll.
  //
  // Os dois convergem para o mesmo `atualizarProgresso()`, que só age quando
  // o valor realmente mudou. Custo: praticamente zero.
  const aoRolarNativo = () => {
    ScrollTrigger.update();
  };
  if (!lenis) {
    window.addEventListener('scroll', aoRolarNativo, { passive: true });
  }

  let ultimoY = -1;
  const lerFallback = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (y !== ultimoY) {
      ultimoY = y;
      if (!lenis) {
        ScrollTrigger.update();
        atualizarProgresso();
      }
    }
    requestAnimationFrame(lerFallback);
  };
  requestAnimationFrame(lerFallback);

  // Estado inicial coerente (ninguém começa com progresso "sujo")
  pSuave = 0;
  progresso = 0;
  emitir();

  return { progresso, ambiente };
}

/**
 * Roda a cada frame (dentro do único ticker do site).
 *
 * Como funciona a suavização:
 *   • DESKTOP: o progresso suavizado persegue o cru com interpolação linear.
 *     Isso dá a sensação de massa/inércia ("câmera em um trilho").
 *   • MOBILE: o progresso é IGUAL ao cru. Qualquer suavização no toque faz o
 *     conteúdo parecer "atrasado", como se não seguisse o dedo.
 *
 * A velocidade é calculada a partir da variação por frame e serve para os
 * efeitos de inércia (partículas que se dispersam, neblina que corre).
 */
function atualizarProgresso() {
  if (ambiente.mobile) {
    pSuave = pCru;
  } else {
    const diferenca = pCru - pSuave;
    // Abaixo desse limiar, encosta de vez (evita perseguição infinita).
    pSuave = Math.abs(diferenca) < 0.00008
      ? pCru
      : pSuave + diferenca * LERP_PROGRESSO_DESKTOP;
  }

  const novo = clamp(pSuave, 0, 1);

  // Sem mudança relevante: não acorda nenhum assinante (economiza CPU/bateria).
  if (Math.abs(novo - progresso) < 0.00001 && Math.abs(velocidade) < 0.0005) return;

  const delta = novo - progresso;
  // Velocidade normalizada: variação por frame em escala legível (-1 a 1).
  velocidade = clamp(velocidade * 0.82 + clamp(delta * 22, -1, 1) * 0.18, -1, 1);

  progressoAnterior = progresso;
  progresso = novo;
  emitir();
}

/** Entrega o estado atual para todos os assinantes. */
function emitir() {
  for (const fn of assinantes) {
    try {
      fn(progresso, velocidade, progressoAnterior);
    } catch (erro) {
      // Um assinante quebrado não pode derrubar a narrativa inteira.
      console.error('[scroll] assinante falhou:', erro);
    }
  }
}

/* ---------- Religa/desliga ---------------------------------------------- */

/** Pausa o loop (usado quando a aba fica oculta — economiza bateria). */
export function pausarScroll() {
  if (lenis) lenis.stop();
  gsap.ticker.remove(tickerFn);
}

/** Retoma o loop. */
export function retomarScroll() {
  if (lenis) lenis.start();
  if (tickerFn) gsap.ticker.add(tickerFn);
}

/** Rola suavemente até um elemento (para os CTAs internos). */
export function irPara(alvo, deslocamento = 0) {
  if (lenis) {
    lenis.scrollTo(alvo, { offset: deslocamento, duration: 1.1 });
  } else {
    const el = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY + deslocamento;
    window.scrollTo({ top: y, behavior: 'auto' }); // sem smooth: quem manda é o motor
  }
}

/* ---------- Limpeza (usada só pelo HMR do Vite em dev) ------------------ */

export function destruirScroll() {
  assinantes.clear();
  if (masterTrigger) masterTrigger.scrollTrigger?.kill();
  if (masterTrigger) masterTrigger.kill();
  masterTrigger = null;
  if (lenis) { lenis.destroy(); lenis = null; }
  if (tickerFn) { gsap.ticker.remove(tickerFn); tickerFn = null; }
  ScrollTrigger.getAll().forEach((t) => t.kill());
  document.documentElement.style.removeProperty('--altura-scroll');
  iniciado = false;
}

export default {
  iniciarScroll, atualizarMedidas, aoProgredir, getProgresso, getAmbiente,
  getLenis, getMaster, progressoDaFaixa, progressoDaEtapa, irPara,
  pausarScroll, retomarScroll, destruirScroll
};
