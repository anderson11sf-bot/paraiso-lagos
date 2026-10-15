/* ============================================================================
 * seo.js — METADADOS E DADOS ESTRUTURADOS
 * ----------------------------------------------------------------------------
 * O QUE ESTE MÓDULO FAZ
 *   1. Preenche (ou corrige) as metatags a partir do config.js — assim você
 *      troca título, descrição e domínio em UM lugar só.
 *   2. Monta o JSON-LD (dados estruturados) do empreendimento e do FAQ.
 *      É isso que faz o Google entender que é um lugar de verdade, com
 *      perguntas e respostas, e não só uma página qualquer.
 *
 * NOTA SOBRE CSP
 *   Este módulo cria o <script type="application/ld+json"> com o texto já
 *   serializado (JSON.stringify). O valor dos dados NÃO passa por innerHTML —
 *   vai em textContent de um elemento de script, que é o correto: assim
 *   nenhum conteúdo externo pode virar código.
 * ==========================================================================*/

import config from '../config.js';
import { $ } from './utils.js';

/** Garante que existe uma meta com o atributo pedido e devolve o elemento. */
function meta(seletor, criar) {
  let el = document.head.querySelector(seletor);
  if (!el) {
    el = criar();
    document.head.appendChild(el);
  }
  return el;
}

function definirMeta(nome, conteudo, atributo = 'name') {
  if (!conteudo) return;
  const el = meta(`meta[${atributo}="${nome}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(atributo, nome);
    return m;
  });
  el.setAttribute('content', conteudo);
}

function definirLink(rel, href) {
  if (!href) return;
  const el = meta(`link[rel="${rel}"]`, () => {
    const l = document.createElement('link');
    l.setAttribute('rel', rel);
    return l;
  });
  el.setAttribute('href', href);
}

/** Junta o domínio base com um caminho, sem barra duplicada. */
function urlAbsoluta(caminho) {
  const base = (config.seo.url || '').replace(/\/+$/, '');
  if (!caminho) return base || '/';
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${base}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}

/* --------------------------------------------------------------------------
 * 1. Metatags
 * ------------------------------------------------------------------------ */

export function aplicarSeo() {
  const S = config.seo;

  document.title = S.titulo;
  definirMeta('description', S.descricao);
  if (S.palavrasChave) definirMeta('keywords', S.palavrasChave);
  definirMeta('robots', 'index, follow, max-image-preview:large');

  const canonical = urlAbsoluta('/');
  definirLink('canonical', canonical);
  definirLink('alternate', canonical);

  // Open Graph (WhatsApp, Facebook, LinkedIn)
  definirMeta('og:type', 'website', 'property');
  definirMeta('og:locale', S.locale || 'pt_BR', 'property');
  definirMeta('og:site_name', S.nomeSite, 'property');
  definirMeta('og:title', S.titulo, 'property');
  definirMeta('og:description', S.descricao, 'property');
  definirMeta('og:url', canonical, 'property');
  if (S.imagemOg) {
    const img = urlAbsoluta(S.imagemOg);
    definirMeta('og:image', img, 'property');
    definirMeta('og:image:width', '1200', 'property');
    definirMeta('og:image:height', '630', 'property');
    definirMeta('og:image:alt', S.titulo, 'property');
  }

  // Twitter/X
  definirMeta('twitter:card', 'summary_large_image');
  definirMeta('twitter:title', S.titulo);
  definirMeta('twitter:description', S.descricao);
  if (S.imagemOg) definirMeta('twitter:image', urlAbsoluta(S.imagemOg));

  // Cor da barra do navegador no celular (combina com o palco)
  definirMeta('theme-color', '#04191F');
}

/* --------------------------------------------------------------------------
 * 2. Dados estruturados
 * ------------------------------------------------------------------------ */

/**
 * Monta o objeto JSON-LD do empreendimento.
 * Usa o tipo "Place" + "Offer" (mais preciso que "Residence" para um
 * loteamento) e inclui o FAQ quando existir.
 */
function montarJsonLd() {
  const S = config.seo;
  const E = config.empreendimento;
  const url = urlAbsoluta('/');

  const lugar = {
    '@type': 'Place',
    name: E.nome,
    description: S.descricao,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: E.cidade,
      addressRegion: E.uf,
      addressCountry: 'BR'
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Um grande lago no coração da comunidade', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Represa Jaguari a 2 km (jetski e esportes náuticos)', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Água mineral', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Asfalto até a portaria', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Fibra óptica', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Energia trifásica', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Portaria e monitoramento', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Área de APP preservada', value: true }
    ]
  };

  if (config.seo.geo && (config.seo.geo.latitude && config.seo.geo.longitude)) {
    lugar.geo = {
      '@type': 'GeoCoordinates',
      latitude: config.seo.geo.latitude,
      longitude: config.seo.geo.longitude
    };
  }

  if (S.imagemOg) lugar.image = urlAbsoluta(S.imagemOg);

  // Oferta: só entra se houver preço "a partir de" preenchido.
  // Nunca inventamos faixa de preço no dado estruturado.
  if (S.precoAPartir) {
    lugar.makesOffer = {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: String(S.precoAPartir),
      availability: 'https://schema.org/InStock',
      url
    };
  }

  const grafo = [lugar];

  // FAQPage: o Google pode exibir as perguntas direto no resultado de busca.
  const perguntas = [];
  for (const f of (config.faq || [])) {
    if (f.r && f.r.trim()) perguntas.push({ pergunta: f.p, resposta: f.r });
  }
  for (const f of (config.faqExtras || [])) {
    if (f.r && f.r.trim()) perguntas.push({ pergunta: f.p, resposta: f.r });
  }
  if (perguntas.length) {
    grafo.push({
      '@type': 'FAQPage',
      mainEntity: perguntas.map(({ pergunta, resposta }) => ({
        '@type': 'Question',
        name: pergunta,
        acceptedAnswer: { '@type': 'Answer', text: resposta }
      }))
    });
  }

  // Lista das chácaras (sem preço exato; a faixa não é dado estruturado)
  if (config.glebas && config.glebas.length) {
    grafo.push({
      '@type': 'ItemList',
      name: 'Chácaras disponíveis',
      numberOfItems: config.glebas.length,
      itemListElement: config.glebas.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${g.nome} — ${g.area}`
      }))
    });
  }

  return { '@context': 'https://schema.org', '@graph': grafo };
}

/** Escreve o JSON-LD no documento, de forma segura. */
export function aplicarDadosEstruturados() {
  let el = document.getElementById('pd-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'pd-jsonld';
    document.head.appendChild(el);
  }
  // textContent (não innerHTML): o dado vira texto, nunca marcação.
  el.textContent = JSON.stringify(montarJsonLd());
}

/** Roda tudo. Chamado uma vez na subida. */
export function iniciarSeo() {
  try {
    aplicarSeo();
    aplicarDadosEstruturados();
    return true;
  } catch (erro) {
    // SEO quebrado não pode derrubar o site.
    if (typeof console !== 'undefined') console.error('[seo] falhou:', erro);
    return false;
  }
}

export default { iniciarSeo, aplicarSeo, aplicarDadosEstruturados };
