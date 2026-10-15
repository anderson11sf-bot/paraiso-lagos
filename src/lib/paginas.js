/* ============================================================================
 * paginas.js — MONTAGEM DAS PÁGINAS LEGAIS (privacidade, cookies, 404)
 * ----------------------------------------------------------------------------
 * O conteúdo sai todo do config.js, com os campos que você precisa preencher
 * marcados de forma bem visível na tela (não escondidos em comentário).
 *
 * AVISO IMPORTANTE, REPETIDO NO TOPO DE CADA PÁGINA:
 *   estes textos são MODELOS. Eles cobrem o mínimo que a LGPD pede para este
 *   tipo de site, mas não substituem a revisão de um advogado antes de publicar.
 * ==========================================================================*/

import config from '../config.js';
import { criar } from './utils.js';

/* --------------------------------------------------------------------------
 * Peças
 * ------------------------------------------------------------------------ */

function titulo(texto, nivel = 2, classe = null) {
  return criar(`h${nivel}`, { classe, texto });
}

function paragrafo(texto) {
  return criar('p', { texto });
}

/** Marca visualmente um dado que ainda falta preencher. */
function pendente(rotulo) {
  return criar('span', { classe: 'dado-pendente', texto: `[preencher: ${rotulo}]` });
}

/** Linha de definição: rótulo + valor (ou o aviso de pendência). */
function linhaDado(rotulo, valor, nomeCampo) {
  const div = criar('div', { classe: 'dado' });
  div.appendChild(criar('dt', { texto: rotulo }));
  const dd = criar('dd');
  if (valor && String(valor).trim()) dd.textContent = valor;
  else dd.appendChild(pendente(nomeCampo));
  div.appendChild(dd);
  return div;
}

function avisoRevisao() {
  const caixa = criar('aside', { classe: 'aviso-juridico' });
  caixa.appendChild(criar('strong', { texto: 'Texto modelo — revise antes de publicar' }));
  caixa.appendChild(criar('p', {
    texto: 'Este documento foi montado a partir das informações do site e cobre o mínimo exigido pela LGPD. Ele não substitui a análise de um advogado. Preencha os campos marcados e faça a revisão jurídica antes de tornar a página pública.'
  }));
  return caixa;
}

/** Lista simples. */
function lista(itens, ordenada = false) {
  const el = criar(ordenada ? 'ol' : 'ul', { classe: 'lista-legal' });
  for (const item of itens) {
    if (typeof item === 'string') el.appendChild(criar('li', { texto: item }));
    else el.appendChild(item);
  }
  return el;
}

/** Item de lista com um link no meio. */
function itemComLink(textoAntes, link, textoDepois) {
  const li = criar('li');
  li.appendChild(document.createTextNode(textoAntes));
  li.appendChild(criar('a', { href: link.href, texto: link.texto }));
  if (textoDepois) li.appendChild(document.createTextNode(textoDepois));
  return li;
}

/* --------------------------------------------------------------------------
 * POLÍTICA DE PRIVACIDADE
 * ------------------------------------------------------------------------ */

export function montarPrivacidade() {
  const L = config.lgpd;
  const C = L.controlador;
  const art = criar('article', { classe: 'legal' });

  art.appendChild(avisoRevisao());

  art.appendChild(titulo('Política de Privacidade', 1, 'legal__titulo'));
  art.appendChild(paragrafo(
    `Esta política explica como o site do ${config.empreendimento.nome} trata os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).`
  ));

  /* 1. Controlador */
  art.appendChild(titulo('1. Quem é o controlador'));
  art.appendChild(paragrafo(
    'O controlador é quem decide como os seus dados são tratados. No caso deste site:'
  ));
  const dados = criar('dl', { classe: 'dados-legais' });
  dados.appendChild(linhaDado('Razão social', C.razaoSocial, 'razão social'));
  dados.appendChild(linhaDado('CNPJ', C.cnpj, 'CNPJ'));
  dados.appendChild(linhaDado('Endereço', C.endereco, 'endereço completo'));
  dados.appendChild(linhaDado('E-mail para assuntos de privacidade', C.email, 'e-mail de contato'));
  if (C.encarregado) dados.appendChild(linhaDado('Encarregado de dados (DPO)', C.encarregado, 'nome do encarregado'));
  art.appendChild(dados);

  /* 2. Dados tratados */
  art.appendChild(titulo('2. Quais dados são tratados'));
  art.appendChild(paragrafo('Este site trata apenas o necessário para funcionar e para atender você:'));
  art.appendChild(lista([
    'Dados de navegação: páginas vistas, tempo de visita, tipo de aparelho e navegador, origem do acesso (por exemplo, qual anúncio trouxe você). Coletados por cookies, e somente se você autorizar as categorias de estatística ou marketing.',
    'Dados de contato que você mesmo envia: quando você clica em um botão de WhatsApp, você é levado ao aplicativo com uma mensagem pronta. O seu número e o conteúdo da conversa ficam no WhatsApp e no atendimento — este site não recebe nem armazena esses dados.',
    'Preferências: a sua escolha sobre cookies fica guardada no seu próprio navegador.'
  ]));
  art.appendChild(paragrafo(
    'Este site NÃO usa formulários e NÃO coleta dados sensíveis, dados de crianças e adolescentes, nem dados de pagamento.'
  ));

  /* 3. Finalidades e bases legais */
  art.appendChild(titulo('3. Para que usamos e com que base legal'));
  const tabela = criar('table', { classe: 'tabela-legal' });
  tabela.innerHTML = `
    <caption class="sr-only">Finalidades e bases legais do tratamento</caption>
    <thead>
      <tr><th scope="col">Finalidade</th><th scope="col">Dados</th><th scope="col">Base legal</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Fazer o site funcionar (guardar a sua escolha de cookies)</td>
        <td>Preferência de consentimento</td>
        <td>Legítimo interesse e cumprimento de obrigação legal (art. 7º, II e IX)</td>
      </tr>
      <tr>
        <td>Entender como o site é usado e melhorá-lo</td>
        <td>Dados de navegação agregados</td>
        <td>Consentimento (art. 7º, I)</td>
      </tr>
      <tr>
        <td>Medir o resultado de anúncios</td>
        <td>Dados de navegação e identificadores de campanha</td>
        <td>Consentimento (art. 7º, I)</td>
      </tr>
      <tr>
        <td>Atender você e agendar uma visita</td>
        <td>Dados que você envia pelo WhatsApp</td>
        <td>Procedimentos preliminares a contrato (art. 7º, V)</td>
      </tr>
    </tbody>
  `;
  art.appendChild(tabela);

  /* 4. Compartilhamento */
  art.appendChild(titulo('4. Com quem compartilhamos'));
  art.appendChild(paragrafo(
    'Não vendemos dados pessoais. Compartilhamos apenas com os prestadores necessários, cada um na sua função:'
  ));
  art.appendChild(lista([
    `Marketing e medição de anúncios: ${(L.terceiros.marketing || []).join(', ') || '—'}`,
    `Estatísticas de visita: ${(L.terceiros.estatistica || []).join(', ') || '—'}`,
    'WhatsApp (Meta Platforms): quando você clica em um botão de contato, a conversa acontece dentro do WhatsApp, sob as políticas da própria Meta.',
    'Hospedagem: o provedor que mantém o site no ar, que registra logs de acesso por segurança.'
  ]));

  /* 5. Transferência internacional */
  art.appendChild(titulo('5. Transferência internacional'));
  art.appendChild(paragrafo(
    'As ferramentas de estatística e de anúncios citadas acima são operadas por empresas que podem processar dados fora do Brasil, principalmente nos Estados Unidos. Essa transferência acontece com base no seu consentimento e nas cláusulas contratuais dos próprios fornecedores.'
  ));

  /* 6. Retenção */
  art.appendChild(titulo('6. Por quanto tempo guardamos'));
  art.appendChild(paragrafo(L.retencao));
  art.appendChild(paragrafo(
    'A sua escolha sobre cookies fica guardada por ' + L.validadeDias + ' dias, ou até você mudá-la.'
  ));

  /* 7. Direitos */
  art.appendChild(titulo('7. Seus direitos'));
  art.appendChild(paragrafo('A LGPD garante a você, a qualquer momento e sem custo:'));
  art.appendChild(lista([
    'Confirmação de que tratamos os seus dados e acesso a eles;',
    'Correção de dados incompletos ou desatualizados;',
    'Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;',
    'Portabilidade a outro fornecedor;',
    'Eliminação dos dados tratados com consentimento;',
    'Informação sobre com quem compartilhamos;',
    'Informação sobre a possibilidade de não dar consentimento e as consequências disso;',
    'Revogação do consentimento.'
  ], true));
  art.appendChild(paragrafo(
    'Para exercer qualquer um desses direitos, escreva para o e-mail do controlador indicado no item 1. Respondemos em até 15 dias.'
  ));

  /* 8. Cookies */
  art.appendChild(titulo('8. Cookies'));
  art.appendChild(paragrafo(
    'Os cookies usados neste site e como gerenciá-los estão detalhados na Política de Cookies.'
  ));
  art.appendChild(lista([
    itemComLink('', { href: '/politica-de-cookies.html', texto: 'Ver a Política de Cookies' }, '')
  ]));

  /* 9. Segurança */
  art.appendChild(titulo('9. Segurança'));
  art.appendChild(paragrafo(
    'O site é publicado apenas por conexão criptografada (HTTPS), com cabeçalhos de segurança que bloqueiam a inclusão da página em outros sites e restringem a execução de scripts ao próprio domínio. O site não possui banco de dados nem formulários, o que reduz bastante a superfície de risco.'
  ));

  /* 10. Atualizações */
  art.appendChild(titulo('10. Atualizações desta política'));
  const versao = criar('p');
  versao.appendChild(document.createTextNode('Última revisão: '));
  if (L.versaoPoliticas) versao.appendChild(criar('strong', { texto: L.versaoPoliticas }));
  else versao.appendChild(pendente('data da revisão'));
  versao.appendChild(document.createTextNode(
    '. Se esta política mudar de forma relevante, avisamos no próprio site e pedimos um novo consentimento quando for o caso.'
  ));
  art.appendChild(versao);

  return art;
}

/* --------------------------------------------------------------------------
 * POLÍTICA DE COOKIES
 * ------------------------------------------------------------------------ */

export function montarCookiesPage() {
  const L = config.lgpd;
  const art = criar('article', { classe: 'legal' });

  art.appendChild(avisoRevisao());
  art.appendChild(titulo('Política de Cookies', 1, 'legal__titulo'));
  art.appendChild(paragrafo(
    'Cookies são pequenos arquivos que o site guarda no seu navegador. Eles servem para lembrar escolhas e para medir como o site é usado. Você decide quais permitir.'
  ));

  /* Categorias */
  art.appendChild(titulo('1. As três categorias'));
  art.appendChild(titulo('Necessários', 3));
  art.appendChild(paragrafo(
    'Fazem o site funcionar e não podem ser desligados. Aqui entra apenas a memória da sua própria escolha de consentimento. Não identificam você e não são usados para anúncio.'
  ));

  art.appendChild(titulo('Estatísticas', 3));
  art.appendChild(paragrafo(
    'Contam quantas pessoas visitam o site, de onde vêm e quais páginas são mais vistas. Os dados são agregados e servem para melhorar o conteúdo. Carregam somente se você autorizar.'
  ));

  art.appendChild(titulo('Marketing', 3));
  art.appendChild(paragrafo(
    'Medem o resultado dos anúncios e evitam mostrar o mesmo anúncio repetidas vezes. Podem identificar o seu navegador para esse fim. Carregam somente se você autorizar.'
  ));

  /* Tabela de cookies */
  art.appendChild(titulo('2. Cookies usados neste site'));
  const tabela = criar('table', { classe: 'tabela-legal' });
  const cabecalho = `
    <caption class="sr-only">Tabela de cookies</caption>
    <thead>
      <tr>
        <th scope="col">Cookie</th>
        <th scope="col">Finalidade</th>
        <th scope="col">Categoria</th>
        <th scope="col">Validade</th>
      </tr>
    </thead>`;
  const linhas = (L.cookies || []).map((c) => `
      <tr>
        <td><code>${c.nome}</code></td>
        <td>${c.finalidade}</td>
        <td>${c.categoria}</td>
        <td>${c.validade}</td>
      </tr>`).join('');
  tabela.innerHTML = `${cabecalho}<tbody>${linhas}</tbody>`;
  art.appendChild(tabela);

  /* Como gerenciar */
  art.appendChild(titulo('3. Como mudar a sua escolha'));
  art.appendChild(paragrafo(
    'Você pode rever a sua decisão a qualquer momento. O painel é o mesmo que apareceu na sua primeira visita:'
  ));
  const botao = criar('button', {
    type: 'button',
    classe: 'btn btn--ouro',
    texto: 'Abrir preferências de cookies',
    'data-abrir-cookies': '1'
  });
  art.appendChild(botao);
  art.appendChild(paragrafo(
    'Se preferir, você também pode apagar ou bloquear cookies direto nas configurações do seu navegador. Bloquear os necessários pode fazer o aviso de cookies reaparecer a cada visita.'
  ));

  /* Base legal */
  art.appendChild(titulo('4. Base legal'));
  art.appendChild(paragrafo(
    'Os cookies de estatística e de marketing só são gravados com o seu consentimento (art. 7º, I, da LGPD). O cookie necessário se apoia no legítimo interesse e na necessidade técnica de lembrar a sua escolha.'
  ));

  art.appendChild(titulo('5. Mais informações'));
  art.appendChild(lista([
    itemComLink('', { href: '/politica-de-privacidade.html', texto: 'Ver a Política de Privacidade' }, ' para saber como tratamos os seus dados e como exercer os seus direitos.')
  ]));

  const versao = criar('p', { classe: 'legal__rodape' });
  versao.appendChild(document.createTextNode('Última revisão: '));
  if (L.versaoPoliticas) versao.appendChild(criar('strong', { texto: L.versaoPoliticas }));
  else versao.appendChild(pendente('data da revisão'));
  art.appendChild(versao);

  return art;
}

/* --------------------------------------------------------------------------
 * 404
 * ------------------------------------------------------------------------ */

export function montar404() {
  const art = criar('article', { classe: 'legal legal--404' });
  art.appendChild(criar('span', { classe: 'rotulo-secao', texto: 'Página não encontrada' }));
  art.appendChild(titulo('Este caminho não existe', 1, 'legal__titulo'));
  art.appendChild(paragrafo(
    'O endereço que você abriu não está mais aqui. Nada de problema: os caminhos abaixo levam de volta ao que interessa.'
  ));

  const acoes = criar('div', { classe: 'cta__acoes' });
  acoes.appendChild(criar('a', { classe: 'btn btn--ouro', href: '/', texto: 'Voltar para o início' }));
  acoes.appendChild(criar('a', {
    classe: 'btn btn--vidro', href: '#', 'data-wa-origem': 'ctaFinal',
    rel: 'noopener', texto: 'Falar no WhatsApp'
  }));
  art.appendChild(acoes);

  return art;
}

/* --------------------------------------------------------------------------
 * Ponto de entrada das páginas secundárias
 * ------------------------------------------------------------------------ */

/**
 * Monta a página conforme o atributo data-pagina do <body>.
 * Assim um único módulo serve para as três páginas.
 */
export function iniciarPaginaLegal() {
  const alvo = document.getElementById('conteudo-legal');
  if (!alvo) return null;

  const tipo = document.body.dataset.pagina || 'privacidade';
  const conteudo = tipo === 'cookies' ? montarCookiesPage()
    : tipo === '404' ? montar404()
    : montarPrivacidade();

  alvo.replaceChildren(conteudo);

  // Título da aba e descrição coerentes com a página
  const mapa = {
    privacidade: 'Política de Privacidade',
    cookies: 'Política de Cookies',
    '404': 'Página não encontrada'
  };
  document.title = `${mapa[tipo]} | ${config.seo.nomeSite}`;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    desc.setAttribute('content', tipo === 'privacidade'
      ? `Como o site do ${config.empreendimento.nome} trata os seus dados pessoais, conforme a LGPD.`
      : tipo === 'cookies'
        ? `Quais cookies o site do ${config.empreendimento.nome} usa e como mudar a sua escolha.`
        : 'Página não encontrada.');
  }

  return conteudo;
}

export default { iniciarPaginaLegal, montarPrivacidade, montarCookiesPage, montar404 };
