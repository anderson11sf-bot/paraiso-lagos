/* ============================================================================
 * cookies.js — CONSENTIMENTO (LGPD) + CARREGAMENTO DAS TAGS
 * ----------------------------------------------------------------------------
 * REGRA CENTRAL: nenhuma tag de marketing ou estatística carrega antes de a
 * pessoa autorizar a categoria dela. Sem exceção.
 *
 * COMO FUNCIONA
 *   1. Na subida, o Google Consent Mode v2 é declarado com TUDO NEGADO.
 *      Isso é o estado inicial correto: o Google já sabe que não pode gravar
 *      cookie e passa a trabalhar com sinais sem cookie.
 *   2. As categorias ficam salvas em localStorage (necessário, estatística,
 *      marketing) com data de validade.
 *   3. Quando a pessoa decide, o consentimento é atualizado e SÓ ENTÃO as
 *      tags são injetadas.
 *   4. Um link no rodapé ("Preferências de cookies") reabre o painel.
 *
 * O banner NÃO bloqueia a rolagem e não anima nada pesado: é uma faixa fixa no
 * rodapé. Ele também não pode prejudicar o LCP — por isso só aparece depois do
 * carregamento, sem competir com o título do hero.
 * ==========================================================================*/

import config from '../config.js';
import { lerStorage, gravarStorage, criar } from './utils.js';

/* ---------- estado ------------------------------------------------------ */

let escolha = null;      // { necessario, estatistica, marketing, em }
let banner = null;       // elemento do banner
let painel = null;       // painel de personalização
let jaInjetou = { google: false, meta: false };
let aoMudar = new Set(); // assinantes que querem saber de mudança

const CATEGORIAS = ['necessario', 'estatistica', 'marketing'];

/* ---------- leitura e gravação ----------------------------------------- */

/** A escolha salva ainda vale? (respeita a validade em dias) */
function lerEscolhaSalva() {
  const salvo = lerStorage(config.lgpd.chaveStorage, null);
  if (!salvo || typeof salvo !== 'object') return null;

  const dias = Number(config.lgpd.validadeDias) || 180;
  const limite = dias * 24 * 60 * 60 * 1000;
  if (!salvo.em || (Date.now() - salvo.em) > limite) return null;

  // Necessário é sempre permitido (é o que faz o site funcionar).
  return {
    necessario: true,
    estatistica: !!salvo.estatistica,
    marketing: !!salvo.marketing,
    em: salvo.em
  };
}

function salvarEscolha(nova) {
  escolha = { necessario: true, estatistica: !!nova.estatistica, marketing: !!nova.marketing, em: Date.now() };
  gravarStorage(config.lgpd.chaveStorage, escolha);
  for (const fn of aoMudar) {
    try { fn(escolha); } catch { /* assinante quebrado não derruba nada */ }
  }
}

/** Permite que outros módulos saibam quando o consentimento mudar. */
export function aoMudarConsentimento(fn) {
  aoMudar.add(fn);
  return () => aoMudar.delete(fn);
}

/** Consulta usada pelo restante do código. */
export function temConsentimento(categoria) {
  if (categoria === 'necessario') return true;
  return !!(escolha && escolha[categoria]);
}

/* ---------- Google Consent Mode v2 ------------------------------------- */

/**
 * Declara o estado INICIAL do Consent Mode. Precisa acontecer antes de
 * qualquer tag do Google carregar — por isso é a primeira coisa que rodamos.
 */
function declararConsentModeInicial() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',   // necessário para o site funcionar
    security_storage: 'granted',
    wait_for_update: 500
  });
}

/** Atualiza o Consent Mode para o que a pessoa escolheu. */
function atualizarConsentMode(escolhaAtual) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    ad_storage: escolhaAtual.marketing ? 'granted' : 'denied',
    ad_user_data: escolhaAtual.marketing ? 'granted' : 'denied',
    ad_personalization: escolhaAtual.marketing ? 'granted' : 'denied',
    analytics_storage: escolhaAtual.estatistica ? 'granted' : 'denied'
  });
}

/* ---------- Injeção das tags (só após consentimento) ------------------- */

/** Carrega o Google Tag (GA4 / Ads) uma única vez. */
export function carregarGoogleTag() {
  const id = config.tracking.googleTagId;
  if (!id || jaInjetou.google) return false;

  jaInjetou.google = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);

  window.gtag('js', new Date());
  // Aqui o Consent Mode já foi atualizado: sem consentimento, a tag respeita.
  window.gtag('config', id, { anonymize_ip: true });
  return true;
}

/** Carrega o Meta Pixel uma única vez. */
export function carregarMetaPixel() {
  const id = config.tracking.metaPixelId;
  if (!id || jaInjetou.meta) return false;

  jaInjetou.meta = true;

  /* Trecho oficial do Pixel. Escrito com funções nomeadas (sem eval e sem
     string de script) para não exigir 'unsafe-eval' na CSP. */
  if (!window.fbq) {
    const n = window.fbq = function fbq() {
      if (n.callMethod) n.callMethod.apply(n, arguments);
      else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
  }

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/pt_BR/fbevents.js';
  document.head.appendChild(s);

  window.fbq('init', id);
  window.fbq('track', 'PageView');
  return true;
}

/** Aplica o consentimento atual: liga o que foi autorizado. */
function aplicarTags() {
  if (!escolha) return;

  if (escolha.estatistica || escolha.marketing) {
    // O Google Tag cobre GA4 e Ads; ele mesmo respeita o Consent Mode.
    carregarGoogleTag();
  }
  if (escolha.marketing) {
    carregarMetaPixel();
  }
}

/* ---------- Banner ------------------------------------------------------ */

/** O banner só faz sentido se houver tag configurada (ou se você forçar). */
function precisaDeBanner() {
  if (!config.lgpd.bannerAtivo) return false;
  if (config.lgpd.forcarBanner) return true;
  return !!(config.tracking.metaPixelId || config.tracking.googleTagId);
}

export function montarBanner() {
  if (!precisaDeBanner()) return null;
  if (banner) return banner;

  banner = criar('section', {
    classe: 'cookies',
    id: 'cookies',
    role: 'dialog',
    'aria-label': 'Aviso de cookies',
    'aria-live': 'polite'
  });

  const texto = criar('div', { classe: 'cookies__texto' });
  texto.appendChild(criar('strong', { classe: 'cookies__titulo', texto: 'Sua privacidade' }));
  texto.appendChild(criar('p', { texto: config.lgpd.textoResumo }));
  const links = criar('p', { classe: 'cookies__links' });
  links.appendChild(criar('a', { href: '/politica-de-cookies.html', texto: 'Política de Cookies' }));
  links.appendChild(document.createTextNode(' · '));
  links.appendChild(criar('a', { href: '/politica-de-privacidade.html', texto: 'Política de Privacidade' }));
  texto.appendChild(links);

  const acoes = criar('div', { classe: 'cookies__acoes' });
  // Os três botões têm o mesmo peso visual: recusar é tão fácil quanto aceitar.
  const btnPersonalizar = criar('button', { type: 'button', classe: 'btn btn--vidro btn--pequeno', texto: 'Personalizar' });
  const btnRecusar = criar('button', { type: 'button', classe: 'btn btn--vidro btn--pequeno', texto: 'Recusar não essenciais' });
  const btnAceitar = criar('button', { type: 'button', classe: 'btn btn--ouro btn--pequeno', texto: 'Aceitar todos' });

  btnPersonalizar.addEventListener('click', abrirPreferencias);
  btnRecusar.addEventListener('click', () => decidir({ estatistica: false, marketing: false }));
  btnAceitar.addEventListener('click', () => decidir({ estatistica: true, marketing: true }));

  acoes.append(btnPersonalizar, btnRecusar, btnAceitar);
  banner.append(texto, acoes);
  document.body.appendChild(banner);

  return banner;
}

/** Registra a decisão, fecha o banner e aplica as tags. */
function decidir(nova) {
  salvarEscolha(nova);
  atualizarConsentMode(escolha);
  aplicarTags();
  fecharBanner();
}

function fecharBanner() {
  if (banner) {
    banner.dataset.visivel = 'false';
    // Só remove do DOM depois da transição, para não cortar o fade.
    setTimeout(() => {
      if (banner && banner.dataset.visivel === 'false') banner.hidden = true;
    }, 400);
  }
  if (painel) {
    painel.hidden = true;
  }
}

/* ---------- Painel de personalização ----------------------------------- */

export function abrirPreferencias() {
  if (!painel) montarPainel();
  if (!painel) return;
  // Reflete a escolha atual nos interruptores
  for (const cat of CATEGORIAS) {
    const input = painel.querySelector(`input[data-cat="${cat}"]`);
    if (!input) continue;
    input.checked = cat === 'necessario' ? true : !!(escolha && escolha[cat]);
  }
  if (banner) banner.hidden = false;
  painel.hidden = false;
}

function montarPainel() {
  painel = criar('div', { classe: 'cookies__painel', id: 'cookies-painel' });
  painel.appendChild(criar('h2', { classe: 'cookies__painel-titulo', texto: 'Escolha o que permitir' }));

  const itens = [
    { cat: 'necessario', titulo: 'Necessários', texto: 'Fazem o site funcionar (guardar a sua escolha aqui, por exemplo). Não podem ser desligados.' },
    { cat: 'estatistica', titulo: 'Estatísticas', texto: 'Ajudam a entender quais páginas são mais úteis. Os dados são agregados.' },
    { cat: 'marketing', titulo: 'Marketing', texto: 'Medem o resultado dos anúncios e evitam mostrar o mesmo anúncio várias vezes.' }
  ];

  for (const item of itens) {
    const linha = criar('label', { classe: 'cookies__opcao' });
    const input = criar('input', {
      type: 'checkbox',
      'data-cat': item.cat,
      classe: 'cookies__switch'
    });
    if (item.cat === 'necessario') {
      input.checked = true;
      input.disabled = true;
    }
    const bloco = criar('span', { classe: 'cookies__opcao-texto' });
    bloco.appendChild(criar('strong', { texto: item.titulo }));
    bloco.appendChild(criar('span', { texto: item.texto }));
    linha.append(input, bloco);
    painel.appendChild(linha);
  }

  const acoes = criar('div', { classe: 'cookies__painel-acoes' });
  const btnSalvar = criar('button', { type: 'button', classe: 'btn btn--ouro btn--pequeno', texto: 'Salvar preferências' });
  btnSalvar.addEventListener('click', () => {
    const nova = { estatistica: false, marketing: false };
    for (const cat of CATEGORIAS) {
      const input = painel.querySelector(`input[data-cat="${cat}"]`);
      if (input && cat !== 'necessario') nova[cat] = input.checked;
    }
    decidir(nova);
  });
  acoes.appendChild(btnSalvar);
  painel.appendChild(acoes);

  banner.appendChild(painel);
}

/* ---------- Ponto de entrada ------------------------------------------- */

export function iniciarCookies() {
  // 1) Sempre: declara o Consent Mode inicial NEGADO.
  declararConsentModeInicial();

  // 2) Recupera a escolha anterior (se ainda válida).
  escolha = lerEscolhaSalva();

  if (escolha) {
    atualizarConsentMode(escolha);
    aplicarTags();
    // Um link no rodapé reabre o painel a qualquer momento.
    ligarLinkDePreferencias();
    return { escolha, reabrir: abrirPreferencias };
  }

  // 3) Sem escolha ainda: banner aparece DEPOIS do carregamento, para não
  //    disputar com o título do hero (LCP).
  montarBanner();
  const mostrar = () => {
    if (!banner) return;
    banner.hidden = false;
    requestAnimationFrame(() => { banner.dataset.visivel = 'true'; });
  };
  if (document.readyState === 'complete') setTimeout(mostrar, 900);
  else window.addEventListener('load', () => setTimeout(mostrar, 900), { once: true });

  ligarLinkDePreferencias();
  return { escolha: null, reabrir: abrirPreferencias };
}

/** Liga qualquer elemento com data-abrir-cookies ao painel. */
export function ligarLinkDePreferencias() {
  document.querySelectorAll('[data-abrir-cookies]').forEach((el) => {
    if (el.dataset.cookiesLigado === '1') return;
    el.dataset.cookiesLigado = '1';
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      abrirPreferencias();
    });
  });
}

export default {
  iniciarCookies, abrirPreferencias, temConsentimento, aoMudarConsentimento,
  carregarGoogleTag, carregarMetaPixel, ligarLinkDePreferencias
};
