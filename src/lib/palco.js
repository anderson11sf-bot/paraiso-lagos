/* ============================================================================
 * palco.js — CAMADAS DO PALCO FIXO
 * ----------------------------------------------------------------------------
 * Monta o vidro de TV (overlay permanente) e o modo LITE.
 *
 * REGRA DE PERFORMANCE
 *   backdrop-filter é caro: só entra em aparelho forte e NUNCA é animado.
 *   O que "pulsa" aqui é opacidade de camada estática, não blur.
 * ==========================================================================*/

import config from '../config.js';
import { aplicarVariaveis, clamp } from './utils.js';

let vidroEl = null;
let palcoEl = null;
let ativo = false;
let progressoAtual = 0;

/**
 * Prepara o palco fixo.
 * @param {Object} ambiente resultado de detectarAmbiente()
 */
export function iniciarPalco(ambiente) {
  palcoEl = document.getElementById('palco');
  vidroEl = document.getElementById('vidro');

  if (!palcoEl) return null;

  const cfg = config.vidroTV;

  // Variáveis do vidro: o CSS lê daqui, então trocar no config.js basta.
  aplicarVariaveis({
    '--vidro-opacidade': cfg.opacidade,
    '--vidro-reflexo': cfg.reflexoOpacidade,
    '--vidro-vinheta': cfg.vinhetaForca,
    '--vidro-scanline': cfg.scanlineOpacidade,
    '--vidro-borda': cfg.brilhoBorda,
    '--vidro-raio': cfg.raioCantos
  });

  // backdrop-filter apenas em aparelho forte E se o config permitir.
  const podeBackdrop = cfg.usarBackdropFiltro && !ambiente.modoLite;
  palcoEl.classList.toggle('com-backdrop', podeBackdrop);

  if (!cfg.ativo) {
    vidroEl?.setAttribute('hidden', '');
  }

  ativo = true;
  return { definirProgresso, mostrarPronto };
}

/**
 * O vidro responde de leve ao progresso: clareia um pouco no fim (chegada)
 * e ganha um brilho de borda no começo. É função pura do progresso — sobe e
 * desce igual, sem estado.
 */
export function definirProgresso(p) {
  if (!ativo || !vidroEl) return;
  const novo = clamp(p, 0, 1);
  // Só mexe no DOM quando muda o suficiente (evita escrita inútil de estilo).
  if (Math.abs(novo - progressoAtual) < 0.01) return;
  progressoAtual = novo;

  // Começa mais escuro (madrugada fechada) e abre na chegada.
  const opacidade = config.vidroTV.opacidade * (1 - novo * 0.35);
  const vinheta = config.vidroTV.vinhetaForca * (1 - novo * 0.25);

  vidroEl.style.setProperty('--vidro-opacidade', opacidade.toFixed(3));
  vidroEl.style.setProperty('--vidro-vinheta', vinheta.toFixed(3));
}

/** Marca o palco como pronto: dispara o fade de entrada do canvas. */
export function mostrarPronto() {
  palcoEl?.classList.add('pronto');
  document.body.classList.remove('preload');
}

export default { iniciarPalco, definirProgresso, mostrarPronto };
