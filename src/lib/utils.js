/* ============================================================================
 * utils.js — utilidades pequenas e sem dependência
 * ==========================================================================*/

/**
 * Detecta o perfil do aparelho UMA VEZ no carregamento.
 * Medir durante o scroll é proibido pelo projeto (causa reflow e travar).
 */
export function detectarAmbiente() {
  const temJanela = typeof window !== 'undefined';
  if (!temJanela) {
    return { mobile: false, toque: false, modoLite: true, memoria: 8, nucleos: 8, largura: 1280 };
  }

  const ua = navigator.userAgent || '';
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
  const toque = (navigator.maxTouchPoints || 0) > 0;

  // Tela estreita também é tratada como mobile. Motivo: o Lenis sequestra o
  // scroll suave do trackpad e o comportamento fica errado em qualquer
  // viewport pequeno — inclusive numa janela estreita no desktop e no modo
  // responsivo das ferramentas de desenvolvedor.
  const larguraInicial = (typeof window !== 'undefined' && window.innerWidth) || 1280;
  const telaEstreita = larguraInicial < 900;
  const mobile = uaMobile || telaEstreita;

  const nucleos = navigator.hardwareConcurrency || 8;
  const memoria = navigator.deviceMemory || navigator.deviceMemory === 0 ? navigator.deviceMemory : 8;

  const semMemoria = typeof navigator.deviceMemory === 'undefined';
  const memoriaBaixa = !semMemoria && navigator.deviceMemory <= 4;
  const nucleosBaixos = nucleos <= 4;

  // Conexão lenta também entra em modo LITE (2G/3G ou saveData)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const redeLenta = !!conn && (conn.saveData === true || /(^|-)2g$|(^|-)3g$/i.test(conn.effectiveType || ''));

  const modoLite = nucleosBaixos || memoriaBaixa || redeLenta;

  return {
    mobile,
    toque,
    modoLite,
    memoria: semMemoria ? 8 : memoria,
    nucleos,
    largura: window.innerWidth || 1280,
    conexao: conn ? conn.effectiveType || '' : ''
  };
}

/** Usuário pediu menos movimento no sistema? */
export function prefereMenosMovimento() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/* ---------- Matemática ------------------------------------------------- */

export const clamp = (v, min = 0, max = 1) => (v < min ? min : v > max ? max : v);

/** Normaliza v da faixa [a,b] para [0,1], já limitado. */
export function normalizar(v, a, b) {
  if (b === a) return v >= b ? 1 : 0;
  return clamp((v - a) / (b - a), 0, 1);
}

export const lerp = (a, b, t) => a + (b - a) * t;

/** Suavização tipo "ease-in-out" (t útil para aceleração de câmera). */
export const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Ease-out cúbico: entra rápido, desacelera. Bom para revelações. */
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Mistura dois valores interpretando t já clampado. */
export const mix = (a, b, t) => lerp(a, b, clamp(t, 0, 1));

/* ---------- DOM -------------------------------------------------------- */

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/** Cria elemento com atributos e filhos de forma segura (sem innerHTML). */
export function criar(tag, attrs = {}, filhos = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'classe') el.className = v;
    else if (k === 'texto') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;          // só com conteúdo próprio e confiável
    else if (k === 'estilo') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of [].concat(filhos)) {
    if (f === null || f === undefined || f === false) continue;
    el.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
  }
  return el;
}

/** Aplica variáveis CSS em :root a partir de um objeto. */
export function aplicarVariaveis(mapa) {
  const raiz = document.documentElement;
  for (const [k, v] of Object.entries(mapa)) raiz.style.setProperty(k, String(v));
}

/* ---------- Persistência segura --------------------------------------- */

export function lerStorage(chave, padrao = null) {
  try {
    const v = window.localStorage.getItem(chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}

export function gravarStorage(chave, valor) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
