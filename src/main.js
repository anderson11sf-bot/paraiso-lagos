/* ============================================================================
 * main.js — PONTO DE ENTRADA DO SITE
 * ==========================================================================*/

import './styles/main.css';

import config from './config.js';
import { iniciarFundoScroll } from './lib/fundoScroll.js';
import * as hero from './lib/hero.js';
import * as vsl from './lib/vsl.js';
import { montarGlebas, montarFaq, montarCtaFinal, montarRodape } from './lib/secoes5.js';
import { montarProjetos } from './lib/projetos.js';
import { montarLocalizacao, montarComunidade } from './lib/secoes.js';
import { iniciarTitulos3D } from './lib/titulos3d.js';
import { iniciarSeo } from './lib/seo.js';
import { iniciarCookies, ligarLinkDePreferencias } from './lib/cookies.js';
import { iniciarWhatsAppFlutuante, ligarBotoesWhatsApp } from './lib/whatsapp.js';

function aplicarTextos() {
  const headline = document.getElementById('hero-headline');
  if (headline) {
    headline.innerHTML = 'Seu paraíso<br>de <em>2 hectares</em>';
  }

  const sub = document.getElementById('hero-sub');
  if (sub) {
    sub.textContent = 'Lago, água mineral e segurança, a 20 min do centro';
  }

  const ctaPrimario = document.getElementById('hero-cta-primario');
  if (ctaPrimario) {
    ctaPrimario.textContent = 'Agendar visita no WhatsApp';
  }

  const ctaSecundario = document.getElementById('hero-cta-secundario');
  if (ctaSecundario) {
    ctaSecundario.textContent = 'Conhecer o Paraíso';
  }

  if (config.seo.titulo) document.title = config.seo.titulo;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && config.seo.descricao) metaDesc.setAttribute('content', config.seo.descricao);
}

function ligarCtasInternos() {
  const ctaSecundario = document.getElementById('hero-cta-secundario');
  if (!ctaSecundario) return;

  ctaSecundario.addEventListener('click', (ev) => {
    const alvo = ctaSecundario.getAttribute('href') || '';
    if (alvo.startsWith('#')) {
      const el = document.querySelector(alvo);
      if (el) {
        ev.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

function ligarBarraProgresso() {
  const fill = document.getElementById('progresso-fill');
  if (!fill) return;

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const p = Math.min(1, Math.max(0, window.scrollY / total));
    fill.style.transform = `scaleX(${p.toFixed(4)})`;
  }, { passive: true });
}

function arrancar() {
  try {
    iniciarSeo();
    iniciarCookies();
    aplicarTextos();

    // 1. Motor de fundo com 2 vídeos em tempo real (Hero + Seções abaixo)
    iniciarFundoScroll();

    // 2. Tela 1: Hero
    hero.iniciarHero();

    // 3. Tela 2: Conheça o Paraíso (VSL)
    vsl.iniciarVsl();

    // 4. Tela 3: Lotes Exclusivos (Glebas)
    montarGlebas();

    // 5. Tela 4: Projetos (Casas prontas e em construção)
    montarProjetos();

    // 6. Seções complementares
    montarLocalizacao();
    montarComunidade();
    montarFaq();
    montarCtaFinal();
    montarRodape();

    // 7. Animações 3D de títulos e cenas
    iniciarTitulos3D();

    // 8. Utilitários e WhatsApp
    ligarBarraProgresso();
    ligarCtasInternos();
    ligarBotoesWhatsApp();
    ligarLinkDePreferencias();
    iniciarWhatsAppFlutuante({ mobile: window.innerWidth < 768, touch: 'ontouchstart' in window });

    document.documentElement.dataset.pdPronto = '1';
    document.body.classList.remove('preload');
  } catch (err) {
    console.error('[pd] erro de inicialização:', err);
    document.body.classList.remove('preload');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancar);
} else {
  arrancar();
}
