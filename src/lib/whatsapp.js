/* ============================================================================
 * whatsapp.js — BOTÃO FLUTUANTE ARRASTÁVEL + MONTAGEM DOS LINKS
 * ----------------------------------------------------------------------------
 * O botão flutuante é o principal caminho de conversão. Ele precisa ser fácil
 * de alcançar com o polegar — por isso é ARRASTÁVEL.
 *
 * REGRAS CRÍTICAS (itens 12 do checklist final)
 *   • Soltar um arraste NUNCA dispara clique.
 *   • Arrastar NUNCA rola a página.
 *   • Um toque curto (sem passar do limiar) SEMPRE abre o WhatsApp.
 *
 * COMO É FEITO
 *   Pointer Events + setPointerCapture. Guardamos a posição em translate3d
 *   (só composição, 60 fps) e salvamos em localStorage para o botão reaparecer
 *   onde a pessoa deixou.
 * ==========================================================================*/

import config from '../config.js';
import { gravarStorage, lerStorage, clamp } from './utils.js';

/* ---------- Montagem do link ------------------------------------------- */

/** Lê os UTM da URL atual para saber de qual anúncio veio o visitante. */
export function lerUtm() {
  if (!config.whatsapp.incluirUtm) return null;
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = {
      source: q.get('utm_source') || '',
      medium: q.get('utm_medium') || '',
      campaign: q.get('utm_campaign') || '',
      content: q.get('utm_content') || '',
      term: q.get('utm_term') || ''
    };
    return Object.values(utm).some(Boolean) ? utm : null;
  } catch {
    return null;
  }
}

/**
 * Monta o link do WhatsApp.
 * @param {string} origem chave em config.whatsapp.mensagens (ou mensagem livre)
 * @param {Object} [extra] { gleba: 'Gleba A', intencao: '...' }
 */
export function montarLinkWhatsApp(origem = 'flutuante', extra = {}) {
  const base = config.whatsapp.mensagens[origem] || config.whatsapp.mensagemBase;

  // Troca {gleba} pelo nome real quando o clique vem de um card
  let texto = base.replace('{gleba}', extra.gleba || 'chácara disponível');

  if (extra.intencao) texto += ' ' + extra.intencao;

  // Acrescenta a origem do anúncio, para o corretor saber de onde veio
  const utm = lerUtm();
  if (utm) {
    const partes = [];
    if (utm.source) partes.push(`origem: ${utm.source}`);
    if (utm.campaign) partes.push(`campanha: ${utm.campaign}`);
    if (utm.medium) partes.push(`mídia: ${utm.medium}`);
    if (partes.length) texto += ` (${partes.join(' · ')})`;
  }

  const numero = String(config.whatsapp.numero).replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/* ---------- Rastreamento ---------------------------------------------- */

/**
 * Dispara os eventos de conversão. As tags só existem depois do consentimento
 * (Fase 4), então aqui basta checar se a função existe.
 * @param {string} origem
 * @param {Object} [dados]
 */
export function rastrearCliqueWhatsApp(origem, dados = {}) {
  const info = { origem, ...dados };

  try {
    if (typeof window.fbq === 'function') window.fbq('track', 'Contact', info);
    if (typeof window.gtag === 'function') window.gtag('event', 'clique_whatsapp', info);
    // Evento interno para depuração no console (removido no build de produção)
    if (import.meta.env && import.meta.env.DEV) {
      console.debug('[wa] clique rastreado:', info);
    }
  } catch {
    /* rastreamento nunca pode quebrar a navegação */
  }
}

/** Aplica o link e o listener de rastreamento em qualquer elemento [data-wa-origem]. */
export function ligarBotoesWhatsApp(raiz = document) {
  const botoes = raiz.querySelectorAll('[data-wa-origem]');
  botoes.forEach((el) => {
    if (el.dataset.waLigado === '1') return;
    el.dataset.waLigado = '1';

    const origem = el.dataset.waOrigem || 'flutuante';
    const gleba = el.dataset.waGleba || '';
    const intencao = el.dataset.waIntencao || '';

    el.setAttribute('href', montarLinkWhatsApp(origem, { gleba, intencao }));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');

    const aoClicar = () => rastrearCliqueWhatsApp(origem, gleba ? { gleba } : {});
    el.addEventListener('click', aoClicar);
    el.addEventListener('auxclick', aoClicar);
  });
  return botoes.length;
}

/* ---------- Botão flutuante arrastável -------------------------------- */

const CHAVE_POSICAO = 'pd-wa-pos-v1';
const LIMIAR_ARRASTE = 6;      // px: abaixo disso é clique, acima é arraste
const MARGEM = 12;             // respiro nas bordas

let botao = null;
let ambiente = null;

let pos = { x: 0, y: 0 };      // posição atual em px (canto superior esquerdo)
let inicio = { x: 0, y: 0 };   // onde o dedo encostou (coordenadas do ponteiro)
let offset = { x: 0, y: 0 };   // deslocamento entre o dedo e o canto do botão
let arrastando = false;
let moveu = false;
let ponteiroId = null;
let limite = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

/** Deslocamento temporário usado só pela animação de entrada (sempre volta a 0). */
let deslocamentoEntrada = 0;

/** Altura da tela considerando o visualViewport (barra do navegador inclusa). */
function lerAlturaTela() {
  const vv = window.visualViewport;
  return vv ? vv.height : window.innerHeight;
}

export function iniciarWhatsAppFlutuante(ambienteDetectado) {
  botao = document.getElementById('wa-flutuante');
  ambiente = ambienteDetectado;
  if (!botao) return null;

  // O link já fica pronto (com UTM) mesmo antes de qualquer clique.
  ligarBotoesWhatsApp();

  calcularLimites();
  pos = posicaoInicial();
  animarEntrada();

  // Pointer Events cobrem mouse, toque e caneta com um só código.
  botao.addEventListener('pointerdown', aoPressionar);
  botao.addEventListener('pointermove', aoMover);
  botao.addEventListener('pointerup', aoSoltar);
  botao.addEventListener('pointercancel', aoSoltar);
  // Impede o clique "fantasma" depois do arraste (o navegador dispara click
  // mesmo com pointerup fora). A captura de ponteiro resolve a maior parte;
  // este preventDefault cobre o resto.
  botao.addEventListener('click', aoClicar);

  // Recalcula os limites quando a tela muda (barra do navegador, rotação).
  window.addEventListener('resize', reposicionarDentroDosLimites, { passive: true });
  window.addEventListener('orientationchange', reposicionarDentroDosLimites, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', reposicionarDentroDosLimites, { passive: true });
  }

  return { destruir };
}

/** Área onde o botão pode ficar: tela inteira menos margens e área segura. */
function calcularLimites() {
  const vv = window.visualViewport;
  const larguraTela = vv ? vv.width : window.innerWidth;
  const alturaTela = lerAlturaTela();

  const larguraBotao = botao.offsetWidth || 62;
  const alturaBotao = botao.offsetHeight || 62;

  const seguroBaixo = lerSafeArea('bottom');
  const seguroTopo = lerSafeArea('top');

  limite = {
    minX: MARGEM,
    maxX: Math.max(MARGEM, larguraTela - larguraBotao - MARGEM),
    minY: seguroTopo + MARGEM,
    maxY: Math.max(seguroTopo + MARGEM, alturaTela - alturaBotao - seguroBaixo - MARGEM)
  };
}

/** Lê env(safe-area-inset-*) do CSS sem precisar de hack no JS. */
function lerSafeArea(lado) {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(`--safe-${lado}`)
      .trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Posição de partida:
 *   1. a que a pessoa deixou salva (localStorage);
 *   2. senão, canto inferior direito, acima da área segura.
 */
function posicaoInicial() {
  const salva = lerStorage(CHAVE_POSICAO, null);
  const vv = window.visualViewport;
  const larguraTela = vv ? vv.width : window.innerWidth;
  const alturaTela = vv ? vv.height : window.innerHeight;
  const larguraBotao = botao.offsetWidth || 62;
  const alturaBotao = botao.offsetHeight || 62;

  const padrao = {
    x: larguraTela - larguraBotao - MARGEM - 4,
    y: alturaTela - alturaBotao - MARGEM - 18
  };

  if (salva && Number.isFinite(salva.x) && Number.isFinite(salva.y)) {
    return {
      x: clamp(salva.x, limite.minX, limite.maxX),
      y: clamp(salva.y, limite.minY, limite.maxY)
    };
  }
  return {
    x: clamp(padrao.x, limite.minX, limite.maxX),
    y: clamp(padrao.y, limite.minY, limite.maxY)
  };
}

/** Escreve a posição usando translate3d (só composição). */
function aplicarPosicao() {
  botao.style.transform =
    `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y + deslocamentoEntrada)}px, 0)`;
}

/**
 * Entrada suave: o botão sobe de baixo da tela até a posição final.
 * O deslocamento é aplicado em `transform` (não em `pos`), para que o estado
 * lógico do botão nunca fique fora da tela — nada de botão inalcançável ou
 * "pulando" se alguém clicar durante a animação.
 */
function animarEntrada() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  deslocamentoEntrada = lerAlturaTela() * 0.35;
  aplicarPosicao();

  requestAnimationFrame(() => {
    botao.style.transition = 'transform 620ms cubic-bezier(0.33, 1, 0.68, 1)';
    deslocamentoEntrada = 0;
    aplicarPosicao();
    setTimeout(() => {
      if (botao) botao.style.transition = '';
    }, 700);
  });
}

/* ---------- Interação ------------------------------------------------- */

function aoPressionar(ev) {
  if (ev.button !== undefined && ev.button !== 0) return;   // só botão principal

  ponteiroId = ev.pointerId;
  // Captura o ponteiro: os eventos continuam vindo mesmo se o dedo sair do botão.
  try { botao.setPointerCapture(ponteiroId); } catch { /* navegador antigo */ }

  const r = botao.getBoundingClientRect();
  offset = { x: ev.clientX - r.left, y: ev.clientY - r.top };
  inicio = { x: ev.clientX, y: ev.clientY };

  arrastando = true;
  moveu = false;
  botao.classList.add('arrastando');
  botao.style.transition = '';
}

function aoMover(ev) {
  if (!arrastando || ev.pointerId !== ponteiroId) return;

  const dx = ev.clientX - inicio.x;
  const dy = ev.clientY - inicio.y;

  // Ainda não passou do limiar: não move nada (assim o toque continua clique).
  if (!moveu && Math.hypot(dx, dy) < LIMIAR_ARRASTE) return;

  if (!moveu) {
    moveu = true;
    botao.classList.add('compacto');   // durante o arraste, só o ícone
  }

  // O botão segue o dedo, respeitando os limites da tela.
  pos.x = clamp(ev.clientX - offset.x, limite.minX, limite.maxX);
  pos.y = clamp(ev.clientY - offset.y, limite.minY, limite.maxY);
  aplicarPosicao();

  // Evita que o navegador interprete o gesto como scroll (redundante com
  // touch-action: none no CSS, mas garante em navegadores antigos).
  if (ev.cancelable) ev.preventDefault();
}

function aoSoltar(ev) {
  if (ev.pointerId !== ponteiroId) return;

  try { botao.releasePointerCapture(ponteiroId); } catch { /* ignora */ }

  arrastando = false;
  ponteiroId = null;
  botao.classList.remove('arrastando');

  if (moveu) {
    // Arraste concluído: encaixa na lateral (mais próximo da borda esquerda ou
    // direita) — assim o botão nunca fica "no meio" atrapalhando a leitura.
    encaixarNaLateral();
    gravarStorage(CHAVE_POSICAO, { x: pos.x, y: pos.y });
  } else {
    botao.classList.remove('compacto');
  }
}

/**
 * Este listener roda SEMPRE. Se o gesto foi um arraste, ele cancela o clique
 * (item 12 do checklist) — a captura de ponteiro já ajuda, mas o cancelamento
 * explícito é o que garante o comportamento em todos os navegadores.
 */
function aoClicar(ev) {
  if (moveu) {
    ev.preventDefault();
    ev.stopPropagation();
    moveu = false;
    return;
  }
  // Clique legítimo: o rastreamento já é feito pelo listener de ligarBotoesWhatsApp.
}

/** Depois de arrastar, o botão desliza para a borda lateral mais próxima. */
function encaixarNaLateral() {
  const vv = window.visualViewport;
  const larguraTela = vv ? vv.width : window.innerWidth;
  const centro = pos.x + botao.offsetWidth / 2;
  const destinoX = centro < larguraTela / 2 ? limite.minX : limite.maxX;

  if (destinoX === pos.x) return;

  botao.style.transition = 'transform 260ms cubic-bezier(0.33, 1, 0.68, 1)';
  pos.x = destinoX;
  aplicarPosicao();
  setTimeout(() => { if (botao) botao.style.transition = ''; }, 300);
}

/** Mantém o botão visível quando a tela muda de tamanho. */
function reposicionarDentroDosLimites() {
  if (!botao) return;
  // A animação de entrada não pode "vazar" para depois de um resize.
  deslocamentoEntrada = 0;
  const larguraAnterior = limite.maxX;
  calcularLimites();
  pos.x = clamp(pos.x, limite.minX, limite.maxX);
  pos.y = clamp(pos.y, limite.minY, limite.maxY);
  // Se a tela encolheu e o botão estava na borda direita, ele acompanha.
  if (larguraAnterior && pos.x > limite.maxX - 1) pos.x = limite.maxX;
  aplicarPosicao();
}

function destruir() {
  if (!botao) return;
  botao.removeEventListener('pointerdown', aoPressionar);
  botao.removeEventListener('pointermove', aoMover);
  botao.removeEventListener('pointerup', aoSoltar);
  botao.removeEventListener('pointercancel', aoSoltar);
  botao.removeEventListener('click', aoClicar);
}

export default {
  iniciarWhatsAppFlutuante, montarLinkWhatsApp, ligarBotoesWhatsApp,
  rastrearCliqueWhatsApp, lerUtm
};
