/* ============================================================================
 * vsl.js — SEÇÃO CONHEÇA O PARAÍSO (VSL)
 * ----------------------------------------------------------------------------
 * Estrutura conforme mockup (Tela 2):
 *   • Título serifado "CONHEÇA O PARAÍSO"
 *   • Player de vídeo com moldura de vidro escuro e contorno ciano suave
 *   • Linha de luz ciano horizontal com botão pílula "PLAY"
 *   • No clique, toca o vídeo VSL com som e controles
 * ==========================================================================*/

import config from '../config.js';
import { $ } from './utils.js';

let tocando = false;

export function iniciarVsl() {
  const container = $('#vsl-player');
  const btnPlay = $('#vsl-btn-play');
  if (!container || !btnPlay) return;

  btnPlay.addEventListener('click', () => {
    if (tocando) return;
    tocando = true;

    container.classList.add('vsl-player--tocando');

    const video = document.createElement('video');
    video.className = 'vsl-video';
    video.src = config.midia.vsl?.src || '/media/video/vsl.mp4';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'auto';

    container.replaceChildren(video);
    video.play().catch(() => {});
  });
}

export default { iniciarVsl };
