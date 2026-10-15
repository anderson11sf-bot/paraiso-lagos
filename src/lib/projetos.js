/* ============================================================================
 * projetos.js — SEÇÃO DE PROJETOS (Casas Prontas e em Construção)
 * ----------------------------------------------------------------------------
 * Estrutura conforme mockup (Tela 4):
 *   • Ícone de folhas no topo
 *   • Título serifado "PROJETOS"
 *   • Linha dourada com brilho
 *   • Carrossel horizontal de cards verticais com fotos reais das casas
 *   • Ícones na base (folha, gota, porteira)
 * ==========================================================================*/

import { criar, $ } from './utils.js';

export const listaProjetos = [
  {
    titulo: 'Casa Sede com Piscina',
    subtitulo: '200 m² construídos · Deck em madeira e vista para o morro',
    status: 'Pronta para morar',
    foto: '/media/projetos/projeto-1.webp'
  },
  {
    titulo: 'Chalé Suíço de Montanha',
    subtitulo: '65 m² prontos · Madeira tratada, pedra e verniz nobre',
    status: 'Pronto',
    foto: '/media/projetos/projeto-2.webp'
  },
  {
    titulo: 'Casa de Campo Moderna',
    subtitulo: 'Design integrado à serra com varanda panorâmica',
    status: 'Pronta',
    foto: '/media/projetos/projeto-3.webp'
  },
  {
    titulo: 'Chalé Sobrado com Vista',
    subtitulo: '80 m² de área privativa · Vista para o lago central',
    status: 'Pronto',
    foto: '/media/projetos/projeto-4.webp'
  },
  {
    titulo: 'Obras e Estruturas em Andamento',
    subtitulo: 'Projetos de moradores em construção na comunidade',
    status: 'Em construção',
    foto: '/media/projetos/projeto-5.webp'
  },
  {
    titulo: 'Suíte Master e Interiores',
    subtitulo: 'Ambientes rústicos aconchegantes com acabamento de luxo',
    status: 'Concluído',
    foto: '/media/projetos/projeto-6.webp'
  },
  {
    titulo: 'Varanda e Área de Convivência',
    subtitulo: 'Conexão direta com o ar puro, a mata e os pássaros',
    status: 'Pronta',
    foto: '/media/projetos/projeto-7.webp'
  }
];

export function montarProjetos() {
  const container = $('#projetos-carrossel');
  if (!container) return;

  container.replaceChildren();

  listaProjetos.forEach((proj, idx) => {
    const card = criar('div', { classe: 'projeto-card', role: 'group', 'aria-label': proj.titulo });

    const fotoWrap = criar('div', { classe: 'projeto-card__foto-caixa' });
    const img = criar('img', {
      src: proj.foto,
      alt: proj.titulo,
      loading: 'lazy',
      decoding: 'async',
      width: '600',
      height: '800',
      classe: 'projeto-card__foto'
    });
    fotoWrap.appendChild(img);

    const badgeStatus = criar('span', { classe: 'projeto-card__status', texto: proj.status });
    fotoWrap.appendChild(badgeStatus);

    const info = criar('div', { classe: 'projeto-card__info' });
    info.appendChild(criar('h3', { classe: 'projeto-card__titulo', texto: proj.titulo }));
    info.appendChild(criar('p', { classe: 'projeto-card__sub', texto: proj.subtitulo }));

    card.append(fotoWrap, info);
    container.appendChild(card);
  });
}

export default { montarProjetos };
