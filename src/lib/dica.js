/* ============================================================================
 * dica.js — AVISO "DESLIZE PARA BAIXO"
 * ----------------------------------------------------------------------------
 * Este componente está FORA da regra do progresso — e o projeto permite isso
 * explicitamente: o aviso pode aparecer/sumir por tempo. O que ele NUNCA faz
 * é bloquear, atrasar ou sequestrar o scroll.
 *
 * Comportamento:
 *   • Visível no carregamento, com brilho pulsante e dedo deslizando (CSS).
 *   • Some suavemente depois de ~20 px de scroll.
 *   • Se a pessoa ficar 4,5 s parada nas primeiras seções, reaparece como
 *     "Continue descendo ✨".
 *   • Ao chegar na segunda dobra, o aviso é aposentado de vez.
 * ==========================================================================*/

import config from '../config.js';
import { clamp } from './utils.js';

let el = null;
let elTexto = null;
let visivel = false;
let aposentado = false;
let relogioParado = 0;
let ultimoY = 0;
let aoRolar = null;

const textoOriginal = 'Deslize para baixo e descubra o paraíso';

export function iniciarDica() {
  el = document.getElementById('dica');
  elTexto = document.getElementById('dica-texto');
  if (!el) return null;

  ultimoY = window.scrollY || 0;

  if (elTexto) elTexto.textContent = textoOriginal;
  mostrar(true, true);

  // Escuta o scroll de forma PASSIVA e só para saber a posição em px.
  // Isso não anima nada por progresso: apenas decide se o aviso aparece.
  aoRolar = () => {
    const y = window.scrollY || 0;
    const delta = Math.abs(y - ultimoY);
    ultimoY = y;

    // Chegou longe: aposenta o aviso (não volta mais, nem ao subir).
    if (y > window.innerHeight * 1.15) {
      aposentar();
      return;
    }

    if (delta > 2) {
      // Rolou: o aviso sai e o relógio de "parado" reinicia.
      relogioParado = 0;
      if (visivel && y > config.scroll.dica.esconderAposPx) mostrar(false);
    }
  };

  window.addEventListener('scroll', aoRolar, { passive: true });

  // Relógio de inatividade: verifica 2x por segundo (barato, sem rAF).
  setInterval(verificarInatividade, 500);

  return { mostrar, aposentar, destruir };
}

/** Mostra ou esconde com transição de opacidade/transform (CSS cuida). */
function mostrar(querVisivel, instantaneo = false) {
  if (!el || aposentado) return;
  visivel = querVisivel;

  if (instantaneo) {
    // Sem transição na primeira pintura: evita "piscar" no carregamento.
    const antiga = el.style.transition;
    el.style.transition = 'none';
    el.dataset.visivel = querVisivel ? 'true' : 'false';
    void el.offsetWidth;                 // força o navegador a aplicar o estado
    el.style.transition = antiga;
    return;
  }

  el.dataset.visivel = querVisivel ? 'true' : 'false';
}

/**
 * Se a pessoa parou de rolar nas primeiras seções por tempo suficiente,
 * o convite volta — com texto diferente para não repetir a mesma frase.
 */
function verificarInatividade() {
  if (!el || aposentado || visivel) return;

  const y = window.scrollY || 0;
  // Só nas primeiras seções: mais para baixo o aviso atrapalharia.
  if (y < 20 || y > window.innerHeight * 0.9) return;

  relogioParado += 500;
  if (relogioParado >= config.scroll.dica.reaparecerAposMs) {
    if (elTexto) elTexto.textContent = config.scroll.dica.textoSecundario;
    mostrar(true);
    relogioParado = 0;
  }
}

/** Tira o aviso de cena definitivamente. */
function aposentar() {
  if (aposentado) return;
  aposentado = true;
  mostrar(false);
  if (aoRolar) window.removeEventListener('scroll', aoRolar);
}

/** Deixa o aviso coerente com o progresso (usado a cada frame, custo ~zero). */
export function definirProgresso(p) {
  if (!el || aposentado) return;
  // Passou de 18% da narrativa: não faz mais sentido convidar a descer.
  if (clamp(p, 0, 1) > 0.18) aposentar();
}

export function destruir() {
  if (aoRolar) window.removeEventListener('scroll', aoRolar);
  aposentado = true;
}

export default { iniciarDica, definirProgresso, destruir };
