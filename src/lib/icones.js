/* ============================================================================
 * icones.js — ÍCONES SVG PRÓPRIOS (traço fino orgânico)
 * ----------------------------------------------------------------------------
 * Nenhum ícone vem de biblioteca de terceiros: são desenhos próprios, em traço
 * fino, dentro da linguagem do projeto (folha, gota, lago, porteira, cerca,
 * casa de chácara, árvore, horta, cavalo, nascente).
 *
 * REGRA: nada de mar. Sem concha, coral, peixe, baleia, onda de mar, âncora,
 * tridente ou navio — nem em ícone.
 *
 * Os traços usam `currentColor`, então o ícone herda a cor do texto onde está.
 * ==========================================================================*/

const comum = 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';

/** Envolve o desenho num SVG acessível. */
function svg(conteudo, { tamanho = 28, titulo = '' } = {}) {
  const rotulo = titulo ? `role="img" aria-label="${titulo}"` : 'aria-hidden="true"';
  return `<svg class="icone" viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" ${rotulo} focusable="false" ${comum}>${conteudo}</svg>`;
}

const desenhos = {
  /* ---------- Dados e infraestrutura ---------------------------------- */

  // Área / medida de terra: um polígono com a cota marcada
  area: `<path d="M4 17.5 8.5 6.5h9.5L20 17.5z"/><path d="M6.6 12h12"/><path d="M4 20.5h16" opacity=".5"/>`,

  // Gota d'água (o símbolo da marca)
  gota: `<path d="M12 3.5c-3.4 4.6-5.4 7.4-5.4 10.2a5.4 5.4 0 0 0 10.8 0c0-2.8-2-5.6-5.4-10.2z"/><path d="M9.6 14.2a2.6 2.6 0 0 0 2.6 2.4" opacity=".6"/>`,

  // Lago visto de cima: três faixas de água
  lago: `<path d="M3 9.5c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0"/><path d="M3 13c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" opacity=".75"/><path d="M3 16.5c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" opacity=".5"/>`,

  // Raio / energia trifásica
  energia: `<path d="M13.5 2.5 5.5 13.5h5.2L10 21.5l8.2-11.2h-5.3z"/>`,

  // Ponto de localização
  pin: `<path d="M12 21.5s6.5-6.2 6.5-11a6.5 6.5 0 1 0-13 0c0 4.8 6.5 11 6.5 11z"/><circle cx="12" cy="10.4" r="2.4"/>`,

  // Fibra / sinal
  fibra: `<path d="M3 15.5c2.5-3.2 5.7-4.8 9.6-4.8s7.1 1.6 8.4 3"/><path d="M5.5 19c2-2.4 4.4-3.6 7.2-3.6s5.2 1.2 6.5 2.2" opacity=".7"/><circle cx="12.2" cy="7.4" r="1.6"/><path d="M12.2 9v1.7" opacity=".7"/>`,

  /* ---------- Chácara ------------------------------------------------- */

  // Porteira / portaria
  portaria: `<path d="M4 19.5V8.5l8-5 8 5v11"/><path d="M8.5 19.5v-6.2h7v6.2"/><path d="M12 8.6v1.9"/>`,

  // Cerca de madeira
  cerca: `<path d="M4 20V9.5M9.3 20V8M14.7 20V9.5M20 20V8"/><path d="M3 12.4h18M3 16.6h18" opacity=".7"/>`,

  // Casa de chácara com telhado e chaminé
  casa: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.6v9.4h13v-9.4"/><path d="M10 20v-5h4v5"/><path d="M17.5 6.2V4h1.8v3.9" opacity=".7"/>`,

  // Árvore de copa redonda
  arvore: `<path d="M12 3.5c3.2 0 5.6 2.2 5.6 5 0 1.3-.5 2.4-1.3 3.2 1 .7 1.6 1.8 1.6 3 0 2.2-1.9 3.8-4.3 3.8H10.4C8 18.5 6.1 16.9 6.1 14.7c0-1.2.6-2.3 1.6-3-.8-.8-1.3-1.9-1.3-3.2 0-2.8 2.4-5 5.6-5z"/><path d="M12 18.5V21" opacity=".7"/>`,

  // Horta: canteiro com folhas
  horta: `<path d="M3.5 20.5h17"/><path d="M5.5 20.5c0-3.4 1.6-5.6 4.3-6.8"/><path d="M12 20.5c0-4.2 2-6.6 5.4-7.6" opacity=".8"/><path d="M8.6 14.4c-.6-1.9.4-3.6 2.6-4.2.6 1.9-.4 3.6-2.6 4.2z"/><path d="M16 13.4c-.4-1.9.8-3.4 3-3.6.3 1.9-.9 3.4-3 3.6z" opacity=".8"/>`,

  // Cavalo (silhueta simples e elegante)
  cavalo: `<path d="M5 20.5c0-3.6 1.6-6.4 4.4-8.2l-1-3.6 2.4-2 1.4 2.4 2.6-.4 2.2 2.2-1.2 1.2c1 1.3 1.4 2.7 1.4 4.4v4h-2.6v-3.2h-6.4v3.2z"/><circle cx="10.4" cy="7.4" r=".7"/>`,

  // Galinha / aves
  aves: `<path d="M8.5 20.5c-2 0-3.4-1.5-3.4-3.4 0-1.3.7-2.4 1.8-3-.4-.6-.6-1.3-.6-2 0-2.6 2.2-4.6 4.9-4.6 1.6 0 3 .7 3.9 1.9l1.6-.5-.4 1.7c.5.7.7 1.5.7 2.4v.6c1.3.3 2.2 1.4 2.2 2.7v.5h-3.4"/><path d="M10.6 20.5v-3M15 20.5v-2" opacity=".7"/><circle cx="10.2" cy="8.6" r=".7"/>`,

  // Sol / céu aberto
  sol: `<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5"/>`,

  /* ---------- Comunidade e segurança ---------------------------------- */

  // Vizinhança: duas casas lado a lado
  vizinhos: `<path d="M2.5 13 8 8.6 13.5 13"/><path d="M4.4 12.4V19h7.2v-6.6"/><path d="M11 13.6 15.4 10 20.6 13.6"/><path d="M12.6 12.9V19h6.8v-5.4" opacity=".8"/>`,

  // Decisão em conjunto: três pontos ligados
  decisao: `<circle cx="12" cy="4.6" r="1.9"/><circle cx="4.8" cy="18.4" r="1.9"/><circle cx="19.2" cy="18.4" r="1.9"/><path d="M10.6 6.3 6.2 16.6M13.4 6.3l4.4 10.3M6.7 18.4h10.6"/>`,

  // Perfil / pessoas da mesma via
  perfil: `<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20.5c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/>`,

  // Câmera de monitoramento
  camera: `<path d="M3.5 9.6 15 5.4l1.8 4.6-11.5 4.2z"/><path d="M5.3 14.2v3.4l5 2.4v-3.8" opacity=".8"/><path d="M17.6 11.6c1.4.5 2.2 1.6 2.2 3.1 0 1.9-1.5 3.2-3.6 3.4" opacity=".7"/>`,

  /* ---------- Água e natureza ----------------------------------------- */

  // Nascente / mina de água
  nascente: `<path d="M3 15.5c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 2.9-1 4.8-.4"/><path d="M8.6 11.6C10 9.8 12 7 12 7s2 2.8 3.4 4.6"/><path d="M12 7V4.2" opacity=".7"/><path d="M3 19.6c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 2.9-1 4.8-.4" opacity=".6"/>`,

  // Folha
  folha: `<path d="M20 4c-8 .6-13 5.4-13 12 0 1.4.2 2.6.6 3.6C14 19 19.4 13.4 20 4z"/><path d="M7.6 19.4C10 14 14 9.8 19.4 5.4" opacity=".55"/>`,

  // Broto / muda
  broto: `<path d="M12 21v-8"/><path d="M12 13c0-3.4 2.4-5.8 6.4-6.2.4 3.8-2 6.2-6.4 6.2z"/><path d="M12 15.4C8.6 15.4 6.4 13.6 6 10.4c3.6-.2 5.6 1.6 6 5z" opacity=".8"/>`,

  // Reserva / APP preservada
  reserva: `<path d="M12 3.6 5 7.6v8.8l7 4 7-4V7.6z"/><path d="M12 12.2 9 10.5v4.8l3 1.7 3-1.7v-4.8z" opacity=".8"/>`,

  /* ---------- Ações --------------------------------------------------- */

  // Seta para baixo (indica "arraste para explorar")
  arrastar: `<path d="M12 3.5v17"/><path d="M6.5 15 12 20.5 17.5 15"/>`,

  // Play (usado na Fase 3, já registrado aqui)
  play: `<path d="M8 5.4v13.2L19 12z"/>`
};

/**
 * Devolve o SVG de um ícone.
 * @param {string} nome chave de `desenhos`
 * @param {Object} [opcoes] { tamanho, titulo }
 */
export function icone(nome, opcoes) {
  const d = desenhos[nome] || desenhos.folha;
  return svg(d, opcoes);
}

/** Lista de nomes disponíveis (útil para conferir no config). */
export const nomesDeIcones = Object.keys(desenhos);

/** Cria o elemento já pronto (evita innerHTML no meio da montagem de seções). */
export function criarIcone(nome, opcoes) {
  const span = document.createElement('span');
  span.className = 'icone-caixa';
  span.innerHTML = icone(nome, opcoes);   // conteúdo é fixo e nosso, não vem de fora
  return span;
}

export default { icone, criarIcone, nomesDeIcones };
