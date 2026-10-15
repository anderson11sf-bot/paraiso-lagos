/* ============================================================================
 * progresso.js — BARRA FINA DE PROGRESSO DE SCROLL (topo)
 * ----------------------------------------------------------------------------
 * A barra é movida por `transform: scaleX()`. Nunca por width: transform roda
 * no compositor (60 fps, sem reflow nem repaint da página).
 * ==========================================================================*/

import { clamp } from './utils.js';

let fill = null;
let ultimo = -1;
let ativo = false;

export function iniciarProgresso() {
  fill = document.getElementById('progresso-fill');
  ativo = !!fill;
  return ativo;
}

/**
 * @param {number} p progresso global (0 a 1)
 */
export function definirProgresso(p) {
  if (!ativo) return;
  const novo = clamp(p, 0, 1);
  // Quantiza em 0.2%: economiza escritas de estilo sem perda visível.
  const quantizado = Math.round(novo * 500) / 500;
  if (quantizado === ultimo) return;
  ultimo = quantizado;
  fill.style.transform = `scaleX(${quantizado})`;
}

export default { iniciarProgresso, definirProgresso };
