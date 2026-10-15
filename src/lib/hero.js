/* ============================================================================
 * hero.js — SAÍDA DA PRIMEIRA DOBRA (por progresso de scroll)
 * ----------------------------------------------------------------------------
 * A ENTRADA do hero NÃO está aqui: ela é uma animação CSS declarada em
 * hero.css. Isso é proposital.
 *
 *   • Animação CSS roda assim que a página pinta: não depende de
 *     requestAnimationFrame nem de setTimeout. O título (que é o LCP) nunca
 *     fica invisível por causa de um loop estrangulado.
 *   • `filter: blur()` é caro, então é usado UMA vez, na entrada, e em
 *     elementos pequenos.
 *
 * Aqui cuidamos da SAÍDA, que é função pura do progresso global: descer
 * afasta o conteúdo, subir traz de volta exatamente ao mesmo estado. Sem
 * timeline, sem evento, sem estado memorizado.
 * ==========================================================================*/

import config from '../config.js';
import { clamp, normalizar } from './utils.js';

let headline = null;
let sub = null;
let selos = null;
let acoes = null;
let ativo = false;

/* Faixa do progresso global em que o hero sai de cena. */
const FAIXA_SAIDA = { inicio: 0.00, fim: 0.085 };

/* Últimos valores escritos, por elemento (evita escrever estilo sem mudança). */
let base = null;

/** Evita reescrever o estado de repouso a cada quadro quando já está no topo. */
let noTopo = false;

export function iniciarHero() {
  headline = document.getElementById('hero-headline');
  sub = document.getElementById('hero-sub');
  selos = document.getElementById('hero-selos');
  acoes = document.querySelector('.hero__acoes');
  const secao = document.getElementById('hero');

  if (!headline || !secao) return null;
  ativo = true;

  montarSelos();
  base = { headline: null, sub: null, selos: null, acoes: null };

  return { definirProgresso, destruir };
}

/** Selos de condição comercial (Documentação em ordem · Financia direto · …). */
function montarSelos() {
  if (!selos) return;
  const itens = config.hero.selos || [];
  selos.replaceChildren();
  for (const texto of itens) {
    const li = document.createElement('li');
    li.className = 'selo';
    li.textContent = texto;
    selos.appendChild(li);
  }
}

/**
 * @param {number} p progresso global (0 a 1)
 */
export function definirProgresso(p) {
  if (!ativo) return;

  const t = normalizar(p, FAIXA_SAIDA.inicio, FAIXA_SAIDA.fim); // 0 → 1

  // Em t === 0 o hero está no estado de repouso (fim da entrada CSS). Isso
  // precisa valer tanto na primeira pintura quanto ao SUBIR de volta ao topo —
  // é justamente aí que a reversibilidade se prova.
  //
  // Importante: limpamos o transform/filtro inline para a animação CSS voltar
  // a mandar no estado de repouso.
  if (t === 0) {
    if (!noTopo) {
      noTopo = true;
      for (const el of [headline, sub, selos, acoes]) {
        if (!el) continue;
        el.style.transform = '';
        el.style.opacity = '';
        el.style.filter = '';
      }
      base = { headline: null, sub: null, selos: null, acoes: null };
    }
    return;
  }

  noTopo = false;

  // 1. Deslocamento vertical: cada elemento sobe num ritmo diferente, o que dá
  //    profundidade sem mover o palco (que é fixo).
  // 2. Opacidade: o título é o último a sair — é o que a pessoa quer ler.
  // 3. Desfoque curto só no fim da saída, quando já está quase sumindo.
  const opTitulo = clamp(1 - t * 0.85, 0, 1);
  const opSub = clamp(1 - t * 1.25, 0, 1);
  const opSelos = clamp(1 - t * 1.6, 0, 1);
  const opAcoes = clamp(1 - t * 1.45, 0, 1);
  const blurTitulo = t > 0.55 ? ((t - 0.55) / 0.45) * 5 : 0;

  escrever(headline, 'headline', -t * 46, opTitulo, blurTitulo, 0.6);
  escrever(sub, 'sub', -t * 62, opSub, blurTitulo * 0.7, 0.6);
  escrever(selos, 'selos', -t * 78, opSelos, 0, 0.8);
  escrever(acoes, 'acoes', -t * 92, opAcoes, 0, 0.8);
}

/** Compara com o último valor e só então escreve no estilo do elemento. */
function escrever(el, chave, y, opacity, blur, tolerancia) {
  if (!el) return;
  const anterior = base[chave];

  if (anterior &&
      Math.abs(anterior.y - y) < tolerancia &&
      Math.abs(anterior.opacity - opacity) < 0.02 &&
      Math.abs((anterior.blur || 0) - blur) < 0.4) {
    return;
  }
  base[chave] = { y, opacity, blur };

  // `y` e `opacity` são compostas (baratas). O filtro entra só quando há
  // desfoque de verdade e é removido quando volta a zero.
  el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
  el.style.opacity = opacity.toFixed(3);
  el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : '';
}

export function destruir() {
  ativo = false;
}

export default { iniciarHero, definirProgresso, destruir };
