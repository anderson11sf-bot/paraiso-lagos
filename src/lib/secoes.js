/* ============================================================================
 * secoes.js — SEÇÕES 2, 4, 5, 6, 7 e 8
 * ----------------------------------------------------------------------------
 * Estas seções são CONTEÚDO DENSO: ficam em fluxo normal de documento, sobre um
 * painel escuro semitransparente, legíveis e indexáveis. NÃO passam pelo
 * carrossel 3D (que é só para títulos e frases curtas).
 *
 * Cada seção termina com uma chamada suave para o WhatsApp — o objetivo do site
 * é um só: agendar visita.
 *
 * Todo texto entra com textContent. Só os ícones usam innerHTML, e eles vêm do
 * nosso próprio módulo `icones.js` (nunca de dado externo).
 * ==========================================================================*/

import config from '../config.js';
import { criar, $ } from './utils.js';
import { icone } from './icones.js';

/* --------------------------------------------------------------------------
 * Peças reutilizáveis
 * ------------------------------------------------------------------------ */

/** Cabeçalho de seção: rótulo + título + texto de apoio. */
function cabecalho({ rotulo, titulo, texto }) {
  const frag = document.createDocumentFragment();
  if (rotulo) frag.appendChild(criar('span', { classe: 'rotulo-secao', texto: rotulo }));
  if (titulo) frag.appendChild(criar('h2', { texto: titulo }));
  if (texto) frag.appendChild(criar('p', { classe: 'secao__apoio', texto }));
  return frag;
}

/** Botão de WhatsApp com origem própria (para o rastreamento por seção). */
function botaoWhatsApp(origem, texto, variante = 'ouro') {
  return criar('a', {
    classe: `btn btn--${variante} secao__cta`,
    href: '#',
    'data-wa-origem': origem,
    rel: 'noopener',
    texto
  });
}

/** Cartão com ícone, título e texto. */
function cartao({ nomeIcone, titulo, texto, classe = 'cartao' }) {
  const caixa = criar('div', { classe });
  const ic = criar('span', { classe: 'cartao__icone' });
  ic.innerHTML = icone(nomeIcone, { tamanho: 30 });   // fixo e nosso
  caixa.appendChild(ic);
  if (titulo) caixa.appendChild(criar('h3', { classe: 'cartao__titulo', texto: titulo }));
  if (texto) caixa.appendChild(criar('p', { classe: 'cartao__texto', texto }));
  return caixa;
}

/* --------------------------------------------------------------------------
 * 2. PROVA RÁPIDA
 * ------------------------------------------------------------------------ */

export function montarProvaRapida() {
  const secao = $('#prova-rapida');
  if (!secao) return null;

  const itens = criar('ul', { classe: 'prova', role: 'list' });
  for (const item of config.provaRapida) {
    const li = criar('li', { classe: 'prova__item' });

    const ic = criar('span', { classe: 'prova__icone' });
    ic.innerHTML = icone(item.icone, { tamanho: 26 });
    li.appendChild(ic);

    li.appendChild(criar('strong', { classe: 'prova__valor', texto: item.valor }));
    li.appendChild(criar('span', { classe: 'prova__rotulo', texto: item.rotulo }));
    itens.appendChild(li);
  }

  const painel = criar('div', { classe: 'painel painel--faixa' }, [itens]);

  if (config.provaLegenda) {
    // A frase comparativa só aparece se o comparativo real estiver preenchido
    // no config (regra do briefing: nada de número inventado).
    const mostrarComparativo = !!config.empreendimento.comparativoReal;
    if (mostrarComparativo) {
      painel.appendChild(criar('p', {
        classe: 'prova__comparativo',
        texto: config.empreendimento.comparativoReal
      }));
    } else {
      painel.appendChild(criar('p', { classe: 'prova__legenda', texto: config.provaLegenda }));
    }
  }

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* --------------------------------------------------------------------------
 * 3. (A VSL entra na Fase 3)
 * ------------------------------------------------------------------------ */

/* --------------------------------------------------------------------------
 * 4. O PARAÍSO — diferenciais
 * ------------------------------------------------------------------------ */

export function montarOParaiso() {
  const secao = $('#o-paraiso');
  if (!secao) return null;

  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'O paraíso',
    titulo: 'Tudo o que já está pronto aqui dentro',
    texto: 'Cada item abaixo é um fato do empreendimento — nada de promessa vaga.'
  }));

  // Grupos de diferenciais
  const grupos = criar('div', { classe: 'grupos' });
  for (const grupo of config.diferenciais) {
    const bloco = criar('section', { classe: 'grupo' });
    bloco.appendChild(criar('h3', { classe: 'grupo__titulo', texto: grupo.grupo }));
    const ul = criar('ul', { classe: 'lista-marcada' });
    for (const texto of grupo.itens) {
      ul.appendChild(criar('li', { texto }));
    }
    bloco.appendChild(ul);
    grupos.appendChild(bloco);
  }
  painel.appendChild(grupos);

  painel.appendChild(criar('hr', { classe: 'divisor-lago' }));
  painel.appendChild(botaoWhatsApp('paraiso', 'Quero saber mais sobre o Paraíso', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* --------------------------------------------------------------------------
 * 5. LOCALIZAÇÃO E DISTÂNCIAS
 * ------------------------------------------------------------------------ */

export function montarLocalizacao() {
  const secao = $('#localizacao');
  if (!secao) return null;

  const L = config.localizacao;
  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'Localização',
    titulo: L.titulo,
    texto: L.texto
  }));

  // Lista de distâncias. Todas com "cerca de", conforme o briefing.
  const lista = criar('ul', { classe: 'distancias', role: 'list' });
  for (const d of L.distancias) {
    const li = criar('li', { classe: 'distancias__item' });
    const ic = criar('span', { classe: 'distancias__icone' });
    ic.innerHTML = icone('pin', { tamanho: 20 });
    li.appendChild(ic);
    li.appendChild(criar('span', { classe: 'distancias__destino', texto: d.destino }));
    li.appendChild(criar('strong', { classe: 'distancias__valor', texto: d.valor }));
    lista.appendChild(li);
  }
  painel.appendChild(lista);

  // Mapa: link externo (não embutimos iframe do Google para não pesar o LCP
  // nem criar dependência de terceiros no carregamento inicial).
  if (config.midia.mapaLink) {
    painel.appendChild(criar('a', {
      classe: 'btn btn--vidro botao-mapa',
      href: config.midia.mapaLink,
      target: '_blank',
      rel: 'noopener noreferrer',
      texto: L.legendaMapa
    }));
  }

  painel.appendChild(criar('hr', { classe: 'divisor-lago' }));
  painel.appendChild(botaoWhatsApp('localizacao', 'Confirmar a localização no WhatsApp', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* --------------------------------------------------------------------------
 * 6. COMUNIDADE E SEGURANÇA
 * ------------------------------------------------------------------------ */

export function montarComunidade() {
  const secao = $('#comunidade');
  if (!secao) return null;

  const C = config.comunidade;
  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'Comunidade e segurança',
    titulo: C.titulo,
    texto: C.texto
  }));

  const grade = criar('div', { classe: 'grade-cartoes' });
  for (const c of C.cartoes) {
    grade.appendChild(cartao({
      nomeIcone: c.icone, titulo: c.titulo, texto: c.texto
    }));
  }
  painel.appendChild(grade);

  painel.appendChild(criar('hr', { classe: 'divisor-lago' }));
  painel.appendChild(botaoWhatsApp('comunidade', 'Falar sobre a comunidade', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* --------------------------------------------------------------------------
 * 7. VIDA NA CHÁCARA
 * ------------------------------------------------------------------------ */

export function montarVidaNaChacara() {
  const secao = $('#vida-na-chacara');
  if (!secao) return null;

  const V = config.vidaNaChacara;
  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'Vida na chácara',
    titulo: V.titulo,
    texto: V.texto
  }));

  const grade = criar('div', { classe: 'grade-cartoes grade-cartoes--vida' });
  for (const item of V.itens) {
    grade.appendChild(cartao({
      nomeIcone: item.icone, titulo: item.titulo, texto: item.texto,
      classe: 'cartao cartao--compacto'
    }));
  }
  painel.appendChild(grade);

  painel.appendChild(criar('hr', { classe: 'divisor-lago' }));
  painel.appendChild(botaoWhatsApp('vida', 'Quero saber da vida na chácara', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/* --------------------------------------------------------------------------
 * 8. VISÃO 3D / DRONE
 * ------------------------------------------------------------------------ */

export function montarVisao3d() {
  const secao = $('#visao-3d');
  if (!secao) return null;

  const V = config.visao3d;
  const painel = criar('div', { classe: 'painel' });
  painel.appendChild(cabecalho({
    rotulo: 'Visão 3D',
    titulo: V.titulo,
    texto: V.texto
  }));

  const { pequena, grande } = config.midia.ortofoto || {};
  const temImagem = !!(pequena || grande);

  const moldura = criar('div', {
    classe: `ortofoto ${temImagem ? '' : 'ortofoto--placeholder'}`,
    // Zoom/pan leve por transform, sem sequestrar o toque da página
    role: 'img',
    'aria-label': V.legenda
  });

  if (temImagem) {
    const img = criar('img', {
      src: pequena || grande,
      srcset: grande ? `${pequena} 1600w, ${grande} 3200w` : null,
      sizes: '(max-width: 720px) 92vw, 640px',
      alt: V.legenda,
      width: '1600',
      height: '900',
      loading: 'lazy',
      decoding: 'async'
    });
    moldura.appendChild(img);
  } else {
    // PLACEHOLDER FUNCIONAL: desenho esquemático gerado pelo próprio site,
    // no mesmo código de cores do projeto. Substitua por `midia.ortofoto`.
    moldura.appendChild(montarPlantaEsquematica());
  }

  painel.appendChild(moldura);

  // Legenda das glebas (nome + área) — reforço do que vem na Fase 3
  const legenda = criar('ul', { classe: 'legenda-glebas', role: 'list' });
  for (const g of config.glebas) {
    const li = criar('li', { classe: 'legenda-glebas__item' });
    li.appendChild(criar('span', { classe: 'legenda-glebas__marca', 'data-gleba': g.id }));
    li.appendChild(criar('strong', { texto: g.nome }));
    li.appendChild(criar('span', { classe: 'legenda-glebas__area', texto: g.area }));
    legenda.appendChild(li);
  }
  painel.appendChild(legenda);

  painel.appendChild(criar('hr', { classe: 'divisor-lago' }));
  painel.appendChild(botaoWhatsApp('visao3d', 'Ver a divisão das chácaras', 'vidro'));

  secao.replaceChildren(painel);
  secao.hidden = false;
  return secao;
}

/**
 * Planta esquemática do empreendimento, desenhada em SVG pelo próprio site.
 * Serve como placeholder até a ortofoto real entrar em `midia.ortofoto`.
 * Formas: o limite do terreno, três lagos e a faixa da APP.
 */
function montarPlantaEsquematica() {
  const div = criar('div', { classe: 'planta' });
  div.innerHTML = `
    <svg viewBox="0 0 800 450" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pl-terra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b3a3c"/>
          <stop offset="1" stop-color="#07272b"/>
        </linearGradient>
        <linearGradient id="pl-agua" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6fe3d2" stop-opacity=".55"/>
          <stop offset="1" stop-color="#1fb6a6" stop-opacity=".32"/>
        </linearGradient>
      </defs>

      <!-- limite do terreno -->
      <path d="M40 60 L760 40 L770 400 L30 420 Z" fill="url(#pl-terra)"
            stroke="#14514f" stroke-width="2"/>
      <!-- faixa de APP / reserva -->
      <path d="M40 60 L300 52 L290 250 L34 268 Z" fill="#2e9e4f" fill-opacity=".14"
            stroke="#2e9e4f" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="7 6"/>
      <!-- estrada de acesso -->
      <path d="M40 380 C160 360 240 300 330 250" fill="none" stroke="#d9a83c"
            stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>
      <!-- três lagos -->
      <ellipse cx="470" cy="150" rx="86" ry="42" fill="url(#pl-agua)"/>
      <ellipse cx="600" cy="300" rx="70" ry="34" fill="url(#pl-agua)"/>
      <ellipse cx="360" cy="360" rx="54" ry="24" fill="url(#pl-agua)" opacity=".75"/>
      <!-- divisão das glebas -->
      <g stroke="#6fe3d2" stroke-opacity=".34" stroke-width="1.3" stroke-dasharray="5 5">
        <path d="M330 46 L320 404"/>
        <path d="M120 300 L700 282"/>
        <path d="M540 44 L536 396"/>
      </g>
      <!-- riacho -->
      <path d="M760 40 C660 130 640 210 560 300 C500 366 420 392 330 404"
            fill="none" stroke="#a8f2e6" stroke-opacity=".5" stroke-width="3"
            stroke-linecap="round"/>
    </svg>
    <span class="planta__aviso">Prévia esquemática — a vista aérea real entra aqui</span>
  `;
  return div;
}

/* --------------------------------------------------------------------------
 * Montagem de todas as seções desta fase
 * ------------------------------------------------------------------------ */

export function montarSecoesDaFase2() {
  return {
    prova: montarProvaRapida(),
    paraiso: montarOParaiso(),
    localizacao: montarLocalizacao(),
    comunidade: montarComunidade(),
    vida: montarVidaNaChacara(),
    visao3d: montarVisao3d()
  };
}

export default { montarSecoesDaFase2 };
