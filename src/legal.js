/* ============================================================================
 * legal.js — PONTO DE ENTRADA DAS PÁGINAS SECUNDÁRIAS
 * ----------------------------------------------------------------------------
 * Usado por politica-de-privacidade.html, politica-de-cookies.html e 404.html.
 * Não carrega GSAP, Lenis nem o fundo em canvas: aqui não há narrativa, só
 * texto — e isso deixa estas páginas levíssimas.
 * ==========================================================================*/

import './styles/main.css';
import config from './config.js';
import { iniciarPaginaLegal } from './lib/paginas.js';
import { iniciarCookies, ligarLinkDePreferencias } from './lib/cookies.js';
import { montarRodape } from './lib/secoes5.js';
import { ligarBotoesWhatsApp } from './lib/whatsapp.js';

function arrancar() {
  try {
    iniciarPaginaLegal();

    // Rodapé simples, o mesmo do site (sem as seções densas)
    const rodape = document.getElementById('rodape');
    if (rodape) montarRodape();

    // Consentimento: se a pessoa ainda não escolheu, o banner aparece aqui
    // também (a política de cookies precisa dele por perto).
    iniciarCookies();
    ligarLinkDePreferencias();
    ligarBotoesWhatsApp();

    document.documentElement.dataset.pdOk = '1';
  } catch (erro) {
    document.documentElement.dataset.pdErro = `${(erro && erro.message) || erro}`;
    if (typeof console !== 'undefined') console.error('[legal] falha:', erro);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancar, { once: true });
} else {
  arrancar();
}

// Mantém o config acessível para conferência rápida no console
window.__PD = { config };
