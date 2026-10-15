/* ============================================================================
 * main.js — PONTO DE ENTRADA
 * ----------------------------------------------------------------------------
 * Ordem de subida (importa):
 *   1. Motor de scroll  → define a altura da página e passa a emitir progresso
 *   2. Palco + fundo    → cria as camadas visuais e já entrega o progresso
 *   3. UI              → barra de progresso, aviso "deslize", WhatsApp, hero
 *
 * COMO TUDO SE LIGA
 *   Existe UM ScrollTrigger mestre (em lib/scroll.js). Ele publica `progresso`
 *   (0 a 1). Cada módulo se inscreve com `aoProgredir` e recebe:
 *       (progresso, velocidade, progressoAnterior)
 *   Nenhum módulo cria o seu próprio ScrollTrigger de animação. Isso é o que
 *   garante que nada fique "pulando" ou em estado errado.
 * ==========================================================================*/

import './styles/main.css';

import config from './config.js';
import {
  iniciarScroll, atualizarMedidas, aoProgredir, getAmbiente, getProgresso,
  progressoDaFaixa, irPara, pausarScroll, retomarScroll, destruirScroll
} from './lib/scroll.js';

import { aplicarVariaveis } from './lib/utils.js';
import * as palco from './lib/palco.js';
import * as fundo from './lib/fundoCanvas.js';
import * as progresso from './lib/progresso.js';
import * as dica from './lib/dica.js';
import * as hero from './lib/hero.js';
import * as carrossel from './lib/carrossel.js';
import { montarSecoesDaFase2 } from './lib/secoes.js';
import { montarSecoesDaFase3, definirVideos } from './lib/secoes5.js';
import * as vsl from './lib/vsl.js';
import { iniciarSeo } from './lib/seo.js';
import { iniciarCookies, ligarLinkDePreferencias } from './lib/cookies.js';
import { iniciarWhatsAppFlutuante, ligarBotoesWhatsApp } from './lib/whatsapp.js';

/* --------------------------------------------------------------------------
 * 1. Textos que vêm do config.js
 * ------------------------------------------------------------------------ */

/** Injeta no DOM os textos configuráveis, sempre com textContent (sem innerHTML). */
function aplicarTextos() {
  const headline = document.getElementById('hero-headline');
  if (headline) {
    headline.innerHTML = 'Seu paraíso de <em>2 hectares</em> com lago, água mineral e segurança';
  }

  const sub = document.getElementById('hero-sub');
  if (sub) sub.textContent = config.hero.subheadline || config.hero.subheadline1 || 'a 20 minutos do centro de São José dos Campos';

  const ctaPrimario = document.getElementById('hero-cta-primario');
  if (ctaPrimario) {
    const rotulo = ctaPrimario.lastChild;
    if (rotulo && rotulo.nodeType === Node.TEXT_NODE) rotulo.nodeValue = ` ${config.hero.ctaPrimario}`;
  }

  const ctaSecundario = document.getElementById('hero-cta-secundario');
  if (ctaSecundario) ctaSecundario.textContent = config.hero.ctaSecundario;

  const dicaTexto = document.getElementById('dica-texto');
  if (dicaTexto && !dicaTexto.textContent.trim()) {
    dicaTexto.textContent = 'Deslize para baixo e descubra o paraíso';
  }

  // Título e descrição do documento (SEO) também saem do config
  if (config.seo.titulo) document.title = config.seo.titulo;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && config.seo.descricao) metaDesc.setAttribute('content', config.seo.descricao);
}

/* --------------------------------------------------------------------------
 * 2. CTA interno: rolar até a seção seguinte (sem "smooth" nativo)
 * ------------------------------------------------------------------------ */

function ligarCtasInternos() {
  const ctaSecundario = document.getElementById('hero-cta-secundario');
  if (!ctaSecundario) return;

  ctaSecundario.addEventListener('click', (ev) => {
    const alvo = ctaSecundario.getAttribute('href') || '';
    // Só intercepta se o alvo existir na página (as seções chegam nas Fases 2/3)
    if (alvo.startsWith('#') && document.querySelector(alvo)) {
      ev.preventDefault();
      irPara(alvo, -20);
    }
  });
}

/* --------------------------------------------------------------------------
 * 3. Quando a aba perde o foco, o loop para (bateria e CPU de verdade)
 * ------------------------------------------------------------------------ */

function ligarPausaPorVisibilidade() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausarScroll();
      fundo.parar();
    } else {
      retomarScroll();
      fundo.iniciar();
      atualizarMedidas();
    }
  });
}

/* --------------------------------------------------------------------------
 * 4. Arranque
 * ------------------------------------------------------------------------ */

function arrancar() {
  // Diagnóstico: qualquer erro de runtime fica registrado em <html data-pd-erro>.
  // É barato, não aparece para o visitante e salva horas de depuração.
  window.addEventListener('error', (ev) => {
    document.documentElement.dataset.pdErro =
      `${ev.message || 'erro'} @ ${ev.filename || '?'}:${ev.lineno || 0}`;
  });
  window.addEventListener('unhandledrejection', (ev) => {
    document.documentElement.dataset.pdErro =
      `promise: ${(ev.reason && ev.reason.message) || ev.reason}`;
  });

  try {
    arrancarInterno();
    document.documentElement.dataset.pdOk = '1';
  } catch (erro) {
    // Falha na subida nunca pode deixar a página em branco: os textos e o
    // WhatsApp já estão no HTML, então o site continua utilizável.
    document.documentElement.dataset.pdErro = `${erro && erro.message || erro}`;
    console.error('[pd] falha na inicialização:', erro);
    // Garante o essencial: links de WhatsApp válidos e página visível.
    try { ligarBotoesWhatsApp(); } catch { /* ignora */ }
    document.body.classList.remove('preload');
  }
}

function arrancarInterno() {
  // (a0) SEO e consentimento PRIMEIRO.
  //      O SEO porque as metatags e os dados estruturados precisam existir cedo
  //      (robôs de busca e pré-visualização de link). O consentimento porque o
  //      Google Consent Mode tem de ser declarado como "negado" ANTES de
  //      qualquer tag existir — é a primeira coisa do documento.
  iniciarSeo();
  iniciarCookies();

  aplicarTextos();

  // (a) Motor de scroll: define --altura-scroll e começa a emitir progresso.
  const { ambiente } = iniciarScroll();

  // (b) Palco fixo (vidro de TV) e fundo com as três etapas.
  const controlePalco = palco.iniciarPalco(ambiente);
  const canvas = document.getElementById('fundo-canvas');
  const controleFundo = canvas ? fundo.iniciarFundo(canvas, ambiente) : null;

  // (c) Seções de conteúdo denso (2, 4, 5, 6, 7 e 8) + carrossel 3D de textos.
  //     A montagem vem ANTES das medidas: as seções entram no fluxo e mudam a
  //     altura da página, então medir antes daria número errado.
  const secoes = montarSecoesDaFase2();

  // (c2) Fase 3: VSL (a TV que liga), chácaras A–G, vídeos com abertura de
  //      bambu, FAQ, CTA final e rodapé.
  const secoes3 = montarSecoesDaFase3();
  vsl.iniciarVsl();

  // (c3) Reserva no fluxo a altura real das seções (que são posicionadas).
  //      Sem isso o rodapé sobe para cima do conteúdo — bug que apareceu na
  //      verificação da Fase 3.
  ajustarAlturaDasSecoes();

  aplicarVariaveisCarrossel();
  carrossel.iniciarCarrossel();

  // (d) UI
  progresso.iniciarProgresso();
  dica.iniciarDica();
  hero.iniciarHero();
  iniciarWhatsAppFlutuante(ambiente);
  ligarCtasInternos();
  ligarPausaPorVisibilidade();
  ligarEventosDeScroll();

  /* ------------------------------------------------------------------------
   * (e) UMA assinatura só, alimentando todos os módulos.
   *     Aqui está a prova de que a narrativa é função do progresso:
   *     cada módulo recebe o MESMO número e reage a ele.
   * ---------------------------------------------------------------------- */
  aoProgredir((p) => {
    // O fundo recebe o progresso GLOBAL: ele mesmo distribui entre as etapas
    // usando as janelas de config.scroll.etapas (com crossfade).
    controleFundo?.definirProgresso(p);
    controlePalco?.definirProgresso(p);
    progresso.definirProgresso(p);
    dica.definirProgresso(p);
    hero.definirProgresso(p);
    carrossel.definirProgresso(p);
    vsl.definirProgresso(p);        // a TV liga/desliga (função do progresso)
    definirVideos(p);               // abertura "linha de bambu" (função também)
  });

  // (f) Sobe o loop do fundo e revela o palco.
  //
  // A revelação é SÍNCRONA de propósito. Quando o palco só era revelado dentro
  // de requestAnimationFrame/setTimeout, bastava o navegador estrangular o
  // loop (aba em segundo plano, iframe, ambiente automatizado) para o site
  // ficar permanentemente escurecido. Aqui não há timer no caminho crítico:
  // o canvas já foi pintado dentro de iniciarFundo/redimensionar, então
  // revelar na hora é seguro.
  controleFundo?.iniciar();
  document.documentElement.dataset.pdFundo = '1';
  palco.mostrarPronto();
  document.documentElement.dataset.pdPronto = '1';

  // (g) Medidas definitivas depois que as fontes entram — sem isso o item 10
  //     do checklist (medidas erradas por fontes tardias) acontece.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(() => {
      ajustarAlturaDasSecoes();
      carrossel.definirProgresso(getProgresso());
    }, 80));
  }

  // (h) Liga os links de WhatsApp que já existem (flutuante, hero e seções)
  //     e os links que reabrem as preferências de cookies no rodapé.
  ligarBotoesWhatsApp();
  ligarLinkDePreferencias();

  // Estado exposto para inspeção no console e para as ferramentas de
  // verificação. São poucos bytes e valem muito na hora de conferir o site:
  //
  //   __PD.irPara(0.5)                       → pula para 50% da narrativa
  //   __PD.controleFundo.getDiagnostico()    → estado interno do fundo
  //   __PD.controleFundo.pintarDiretoNaTela('etapa2')
  //
  window.__PD = {
    config, ambiente, controleFundo, controlePalco, secoes, secoes3,
    irPara: (fracao) => {
      const rolavel = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.round(rolavel * Math.max(0, Math.min(1, fracao))));
    }
  };
}

/* --------------------------------------------------------------------------
 * 4b. Reserva de altura das seções densas
 * ------------------------------------------------------------------------ */

/**
 * Mede a altura real de .secoes e escreve em --altura-secoes, que o espaçador
 * usa. Também reage a mudanças de largura: quando o layout passa de uma para
 * duas colunas, as seções ficam MAIS BAIXAS e a reserva precisa acompanhar.
 *
 * Isto lê layout, então roda só aqui e no resize — nunca durante o scroll.
 */
function ajustarAlturaDasSecoes() {
  const secoes = document.getElementById('secoes');
  if (!secoes) return;

  const medir = () => {
    // A altura é medida com o elemento no fluxo do próprio CSS; como ele é
    // posicionado, getBoundingClientRect devolve a altura do conteúdo.
    const altura = Math.ceil(secoes.getBoundingClientRect().height);
    if (altura > 0) {
      aplicarVariaveis({ '--altura-secoes': `${altura}px` });
    }
    atualizarMedidas();
  };

  medir();

  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(medir, 220);
  }, { passive: true });

  // Depois das fontes e das imagens, a altura muda de novo.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(medir, 90));
  }
  window.addEventListener('load', () => setTimeout(medir, 160), { once: true });
}

/* --------------------------------------------------------------------------
 * 4c. Valores do carrossel que vivem no CSS
 * ------------------------------------------------------------------------ */

/** Leva perspectiva e raio de rotação do config para variáveis CSS. */
function aplicarVariaveisCarrossel() {
  aplicarVariaveis({
    '--perspectiva-carrossel': `${config.carrossel.perspectiva}px`
  });
  const el = document.getElementById('carrossel');
  if (el) el.style.perspective = `${config.carrossel.perspectiva}px`;
}

/* --------------------------------------------------------------------------
 * 4c. Eventos de profundidade de scroll (25/50/75/100%)
 * ------------------------------------------------------------------------ */

/**
 * Dispara um evento uma única vez a cada marco de leitura.
 * É rastreamento, não animação — por isso pode ter estado. Nada aqui toca a
 * narrativa: só informa as tags (que existem depois do consentimento, Fase 4).
 */
function ligarEventosDeScroll() {
  const marcos = (config.tracking.eventosScroll || []).slice().sort((a, b) => a - b);
  if (!marcos.length) return;

  const disparados = new Set();

  aoProgredir((p) => {
    for (const marco of marcos) {
      if (disparados.has(marco)) continue;
      if (p * 100 >= marco) {
        disparados.add(marco);
        try {
          if (typeof window.fbq === 'function') {
            window.fbq('trackCustom', `Scroll${marco}`);
          }
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'scroll_profundidade', { percentual: marco });
          }
          if (import.meta.env && import.meta.env.DEV) {
            console.debug(`[scroll] ${marco}% da página`);
          }
        } catch { /* rastreamento nunca quebra a navegação */ }
      }
    }
  });
}

/* --------------------------------------------------------------------------
 * 5. Arranque seguro + recarga limpa no desenvolvimento (HMR do Vite)
 * ------------------------------------------------------------------------ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancar, { once: true });
} else {
  arrancar();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destruirScroll();
    fundo.parar();
    dica.destruir();
    hero.destruir();
    carrossel.destruir();
    vsl.destruir();
  });
}
