/* ============================================================================
 * titulos3d.js — MOTOR DE ANIMAÇÕES 3D DE TÍTULOS E CENAS
 * ----------------------------------------------------------------------------
 * 1. Cenas Narrativas 3D em palco isolado (rotateX 3D sem sobreposição)
 * 2. Entrada 3D cinematográfica em todos os títulos de seção
 * ==========================================================================*/

import { icone } from './icones.js';

const cenasData = [
  {
    rotulo: 'Água Mineral Pura',
    icone: 'nascente',
    titulo: 'Onde a água nasce na sua própria terra',
    apoio: 'Mina própria perene com laudo de pureza e vazão abundante o ano todo.'
  },
  {
    rotulo: 'O Coração da Comunidade',
    icone: 'lago',
    titulo: 'Um grande lago no centro dos terrenos',
    apoio: 'Espelho d’água compartilhado, com parte do lago na matrícula da maioria das chácaras.'
  },
  {
    rotulo: 'Infraestrutura Completa',
    icone: 'estrada',
    titulo: 'Asfalto, fibra óptica e energia trifásica',
    apoio: 'Acesso rápido e pavimentado até a portaria, com conexão de alta velocidade e energia forte.'
  },
  {
    rotulo: 'Localização Privilegiada',
    icone: 'pin',
    titulo: '20 min do centro e 2 km da Represa Jaguari',
    apoio: 'Toda a tranquilidade e ar puro do campo, pertinho da cidade e com náutica na represa.'
  }
];

let secaoCenas = null;
let cards = [];
let animando = false;

export function iniciarTitulos3D() {
  iniciarCenasNarrativas();
  iniciarTitulosSecoes3D();
}

function iniciarCenasNarrativas() {
  secaoCenas = document.getElementById('cenas-narrativas');
  const palco = document.getElementById('cenas-palco');
  if (!secaoCenas || !palco) return;

  palco.replaceChildren();
  cards = [];

  cenasData.forEach((c) => {
    const card = document.createElement('article');
    card.className = 'cena-3d-card';
    card.setAttribute('aria-hidden', 'true');

    const ic = document.createElement('div');
    ic.className = 'cena-3d-card__icone';
    ic.innerHTML = icone(c.icone, { tamanho: 24 });
    card.appendChild(ic);

    const rot = document.createElement('span');
    rot.className = 'cena-3d-card__rotulo';
    rot.textContent = c.rotulo;
    card.appendChild(rot);

    const tit = document.createElement('h3');
    tit.className = 'cena-3d-card__titulo';
    tit.textContent = c.titulo;
    card.appendChild(tit);

    const ap = document.createElement('p');
    ap.className = 'cena-3d-card__apoio';
    ap.textContent = c.apoio;
    card.appendChild(ap);

    palco.appendChild(card);
    cards.push(card);
  });

  window.addEventListener('scroll', agendarAtualizacaoCenas, { passive: true });
  agendarAtualizacaoCenas();
}

function agendarAtualizacaoCenas() {
  if (!animando) {
    animando = true;
    requestAnimationFrame(atualizarCenas);
  }
}

function atualizarCenas() {
  animando = false;
  if (!secaoCenas || cards.length === 0) return;

  const rect = secaoCenas.getBoundingClientRect();
  const alturaTotal = secaoCenas.offsetHeight - window.innerHeight;

  if (alturaTotal <= 0) return;

  // Progresso local da seção de 0 a 1
  const progresso = Math.min(1, Math.max(0, -rect.top / alturaTotal));
  const dentro = rect.top <= 0 && rect.bottom >= window.innerHeight;

  const total = cards.length;

  cards.forEach((card, i) => {
    if (!dentro) {
      card.style.opacity = '0';
      card.style.visibility = 'hidden';
      card.style.pointerEvents = 'none';
      return;
    }

    // Distância do ponto central do card (0 = no centro exato)
    const centroDoCard = (i + 0.5) / total;
    const dist = (progresso - centroDoCard) * total;

    if (Math.abs(dist) > 0.95) {
      card.style.opacity = '0';
      card.style.visibility = 'hidden';
      card.style.pointerEvents = 'none';
      return;
    }

    const opacidade = Math.max(0, 1 - Math.abs(dist) * 1.8);
    const rotX = dist * -38;
    const transY = dist * -80;
    const scale = 1 - Math.abs(dist) * 0.12;

    card.style.visibility = 'visible';
    card.style.opacity = opacidade.toFixed(3);
    card.style.transform = `perspective(1200px) translateY(${transY.toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
  });
}

/**
 * Adiciona animação de entrada com rotação 3D perspectiva em todos os títulos
 * .secao-titulo-serif do site ao rolar até eles.
 */
function iniciarTitulosSecoes3D() {
  const titulos = document.querySelectorAll('.secao-titulo-serif');
  if (!titulos.length) return;

  titulos.forEach((t) => {
    t.classList.add('titulo-3d-init');
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('titulo-3d-ativo');
        } else if (entry.boundingClientRect.top > window.innerHeight) {
          entry.target.classList.remove('titulo-3d-ativo');
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });

    titulos.forEach((t) => observer.observe(t));
  } else {
    titulos.forEach((t) => t.classList.add('titulo-3d-ativo'));
  }
}

export default { iniciarTitulos3D };
