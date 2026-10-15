/* ============================================================================
 * config.js — PAINEL ÚNICO DE CONTROLE DO SITE
 * ----------------------------------------------------------------------------
 * TUDO que você precisa trocar está AQUI. Nenhum outro arquivo deve ser
 * editado para ajustar número, texto, mídia, velocidade ou ID de rastreamento.
 *
 * Regra: NÃO colocar preço exato de gleba em nenhum lugar do código (nem em
 * comentário). As faixas exibidas vêm de `glebas[].faixa`.
 *
 * Os campos marcados com PREENCHER ainda estão vazios. Sem eles o site
 * funciona, mas fica incompleto (alguns aparecem marcados na tela).
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * 1. WHATSAPP
 * -------------------------------------------------------------------------*/
export const whatsapp = {
  /** Número com DDI + DDD, só dígitos. 55 = Brasil, 12 = DDD (São José dos Campos). */
  numero: '5512983208335',

  /** Mensagem base. É SEMPRE codificada com encodeURIComponent na hora do clique. */
  mensagemBase:
    'Olá! Vi o site do Paraíso das Águas e quero saber mais sobre as chácaras e agendar uma visita.',

  /** Textos prontos por origem do clique (o evento de tracking também usa estas chaves). */
  mensagens: {
    flutuante: 'Olá! Vi o site do Paraíso das Águas e quero saber mais sobre as chácaras e agendar uma visita.',
    hero: 'Olá! Quero agendar uma visita ao Paraíso das Águas. Vi que a documentação está em ordem.',
    provaRapida: 'Olá! Quero entender melhor as condições do Paraíso das Águas.',
    vsl: 'Olá! Assisti ao vídeo do Paraíso das Águas e quero agendar uma visita.',
    paraiso: 'Olá! Quero conhecer melhor o Paraíso das Águas.',
    localizacao: 'Olá! Quero confirmar a localização e as distâncias do Paraíso das Águas.',
    comunidade: 'Olá! Quero saber como funciona a comunidade e a segurança do Paraíso das Águas.',
    vida: 'Olá! Quero saber mais sobre a vida na chácara (animais, horta, água).',
    visao3d: 'Olá! Quero ver a divisão das chácaras e entender qual gleba combina comigo.',
    gleba: 'Olá! Tenho interesse na {gleba} do Paraíso das Águas e quero agendar uma visita.',
    financiamento: 'Olá! Quero entender como funciona o financiamento direto com o proprietário.',
    troca: 'Olá! Tenho um imóvel para dar na negociação e quero saber como funciona a avaliação.',
    faq: 'Olá! Fiquei com uma dúvida sobre o Paraíso das Águas.',
    ctaFinal: 'Olá! Quero agendar minha visita ao Paraíso das Águas.'
  },

  /** Anexa utm_source/utm_medium/utm_campaign da URL do anúncio na mensagem. */
  incluirUtm: true
};

/* ---------------------------------------------------------------------------
 * 2. RITMO DO SCROLL E DO PALCO
 * -------------------------------------------------------------------------*/
export const scroll = {
  /** Altura total da página, em svh (svh = viewport pequeno, não pula com a
   *  barra do navegador). É a "régua" da narrativa: quanto maior, mais devagar
   *  cada etapa acontece.
   *
   *  Calibragem: as seções de conteúdo denso ficam em fluxo normal, então a
   *  altura TOTAL da página é a soma delas MAIS este valor. Com 11 seções, 520svh
   *  dá ~40svh de narrativa por seção — ritmo confortável no celular. */
  alturaTotalSvh: 520,

  /** Suavização (Lenis). NO MOBILE FICA SEMPRE DESLIGADA: o dedo tem de mandar. */
  lenis: {
    lerpDesktop: 0.085,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    /** Suavização do scrub no desktop. No mobile usa 0 (tempo real). */
    scrubDesktop: 0.4,
    scrubMobile: 0
  },

  /** Faixa de progresso (0→1) de cada etapa do fundo. As faixas se sobrepõem
   *  de propósito: é a sobreposição que produz o crossfade entre as cenas. */
  etapas: {
    etapa1: { inicio: 0.00, fim: 0.40 },   // amanhecer na chácara
    etapa2: { inicio: 0.38, fim: 0.72 },   // caminhada na mata e no riacho
    etapa3: { inicio: 0.70, fim: 1.00 }    // morros, lago e céu estrelado
  },

  /** Aviso "Deslize para baixo". */
  dica: {
    esconderAposPx: 20,     // some depois de rolar isso
    reaparecerAposMs: 4500, // se ficar parado nas primeiras seções, reaparece
    textoSecundario: 'Continue descendo ✨'
  }
};

/* ---------------------------------------------------------------------------
 * 3. FUNDO PROCEDURAL — as três cenas
 * -------------------------------------------------------------------------*/
export const fundo = {
  /** Modo de fallback automático:
   *   'frames'  → sequência de imagens (só se `frames.etapa1` estiver preenchido)
   *   'shader'  → procedural em Canvas 2D (PADRÃO atual, sem mídia)
   *   'video'   → vídeo com seek (exige -g 1 no ffmpeg; evitar no iOS)
   *  Deixe 'auto' para o código escolher sozinho. */
  modo: 'frames',

  frames: {
    etapa1: { pasta: '/media/frames/', quantidade: 113, prefixo: 'fundo1_', extensao: 'webp' },
    etapa2: { pasta: '/media/frames/', quantidade: 114, prefixo: 'fundo2_', extensao: 'webp' },
    etapa3: { pasta: '/media/frames/', quantidade: 114, prefixo: 'fundo3_', extensao: 'webp' }
  },

  /** Resolução interna do canvas por etapa. Menos pixels = mais FPS no celular. */
  resolucao: {
    mobile: 0.8,
    desktop: 1.0,
    modoLite: 0.5
  },

  /** Partículas de luz (vaga-lumes / pólen). */
  particulas: {
    mobile: 26,
    desktop: 60,
    modoLite: 0,
    raioMin: 0.8,
    raioMax: 2.4,
    velocidade: 0.16,      // px por frame (base)
    deriva: 0.35,          // amplitude do balanço horizontal
    cintilar: 0.9          // intensidade do brilho pulsante
  },

  /** Intensidades globais que o progresso do scroll modula (0 = nada, 1 = máximo). */
  intensidades: {
    neblina: 1.0,          // neblina sobre o lago (Etapa 1)
    brilhoSol: 0.9,        // claridade do amanhecer
    orvalho: 0.5,          // micro-brilhos na relva
    vinheta: 0.55,         // escurecimento das bordas (foco no centro)
    raiosDeLuz: 0.7,       // feixes de luz entre as árvores (Etapa 2)
    folhagemLuminosa: 0.6, // folhas que brilham na mata (Etapa 2)
    estrelas: 1.0,         // campo de estrelas (Etapa 3)
    vagalumesChacara: 0.85 // vaga-lumes sobre a água ao anoitecer (Etapa 3)
  },

  /** Durações de transição (segundos) para crossfades entre etapas. */
  duracoes: {
    crossfadeEtapas: 0.6,
    entradaPalco: 1.2
  },

  /** Crossfade entre etapas: suavidade da troca (0 = corte seco, 1 = misturado). */
  misturaEtapas: 0.55,

  /** Desligar o canvas em aparelho sem suporte (o modo LITE entra sozinho). */
  permitirCanvas: true
};

/* ---------------------------------------------------------------------------
 * 4. VIDRO DE TV (overlay permanente sobre o palco)
 * -------------------------------------------------------------------------*/
export const vidroTV = {
  ativo: true,
  /** Escurecimento do vidro suave e elegante estilo roça com tecnologia */
  opacidade: 0.14,
  reflexoOpacidade: 0.06,   // reflexo diagonal sutil
  vinhetaForca: 0.40,       // cantos escurecidos
  scanlineOpacidade: 0.0,   // SEM scanline de robô
  brilhoBorda: 0.22,        // risco fino e sutil
  raioCantos: '18px',
  /** backdrop-filter é caro: só em aparelhos fortes e nunca animado. */
  usarBackdropFiltro: true
};

/* ---------------------------------------------------------------------------
 * 5. EMPREENDIMENTO (dados que aparecem na copy)
 * -------------------------------------------------------------------------*/
export const empreendimento = {
  nome: 'Paraíso das Águas',
  cidade: 'São José dos Campos',
  uf: 'SP',
  tempoDoCentro: 'cerca de 20 min do centro',
  distanciaSP: 'cerca de 1h30 de São Paulo (~100 km)',
  represaJaguari: 'cerca de 2 km da Represa Jaguari (lazer náutico, jetski e moto aquática)',
  areaMinima: '20 mil m²',
  areaMinimaCurta: '20 mil m²',
  tagline: 'Chácaras de 2 hectares com lago, água mineral e segurança',

  /** Escassez: só use se for VERDADE. Vazio = usa o padrão neutro. */
  escassezTexto: 'Visitas com hora marcada',

  /** Lagos extras: guardado com [CONFIRMAR], não exibir enquanto não confirmar */
  lagosExtras: '[CONFIRMAR]',

  /** Comparativo de preço: vazio para NÃO exibir comparativo não confirmado */
  comparativoReal: '',

  /** Rodapé legal. */
  legal: {
    razaoSocial: '[CONFIRMAR]',   // razão social
    cnpj: '[CONFIRMAR]',          // CNPJ
    creci: '[CONFIRMAR]',         // CRECI (se houver)
    emailContato: '[CONFIRMAR]',  // e-mail para LGPD/privacidade
    avisoValores: 'Valores sujeitos a alteração e disponibilidade. Consulte condições no WhatsApp.'
  }
};

/* ---------------------------------------------------------------------------
 * 6. HERO
 * -------------------------------------------------------------------------*/
export const hero = {
  wordmark: 'Paraíso das Águas',
  subtituloTopo: 'São José dos Campos',
  headline: 'Seu paraíso de 2 hectares com lago, água mineral e segurança',
  subheadline: 'a 20 minutos do centro de São José dos Campos',
  subheadline1: 'a 20 minutos do centro de São José dos Campos',
  ctaPrimario: 'Agendar visita no WhatsApp',
  ctaSecundario: 'Ver as chácaras disponíveis',
  selos: [
    { texto: 'Documentação em ordem', icone: 'chave' },
    { texto: 'Financia direto com o proprietário', icone: 'apertoMao' },
    { texto: 'Aceita imóvel na troca', icone: 'troca' }
  ],
  /** Poster da primeira dobra: foto real do lago */
  poster: '/media/img/hero-lago.webp',
  /** Entrada "esfumaçada" do texto. */
  fumaca: { blurInicial: 18, blurFinal: 0, duracao: 1.1, escalaInicial: 1.04 }
};

/* ---------------------------------------------------------------------------
 * 7. PROVA RÁPIDA (faixa de 4 itens)
 * -------------------------------------------------------------------------*/
export const provaRapida = [
  { icone: 'area',    valor: '20 mil m²',                         rotulo: 'por chácara' },
  { icone: 'lago',    valor: 'Um grande lago no coração da comunidade', rotulo: 'com parte para a maioria das chácaras' },
  { icone: 'estrada', valor: 'Asfalto, fibra e energia trifásica', rotulo: 'até a portaria' },
  { icone: 'pin',     valor: '20 min do centro',                   rotulo: 'São José dos Campos · perto de SP' }
];

/* ---------------------------------------------------------------------------
 * 8. CONDIÇÕES COMERCIAIS
 * -------------------------------------------------------------------------*/
export const condicoes = {
  documentacao: 'em ordem',
  financiamentoDireto: true,
  aceitaImovel: true,
  /** Só preencha o que for REAL. Vazio em qualquer campo faz o site mostrar
   *  "Consulte no WhatsApp". NUNCA invente estes dados. */
  entradaMinima: '',
  prazoMaximo: '',
  juros: '',
  tiposImovelAceitos: '',
  comoAvaliacao: '',
  tipoDocumentacao: ''
};

/* ---------------------------------------------------------------------------
 * 9. GLEBAS (A–G) — sem preço exato, apenas faixa exibida
 * -------------------------------------------------------------------------*/
export const glebas = [
  { id: 'A', nome: 'Gleba A', area: '20,5 mil m²',
    destaques: ['morro (entrada à direita)', 'lago', 'metade de várzea', 'chalé 65 m² pronto, com acabamentos e verniz'],
    faixa: 'Chalé pronto: cerca de R$ 900 mil a R$ 1 milhão' },

  { id: 'B', nome: 'Gleba B', area: '20,8 mil m²',
    destaques: ['morro esquerdo', 'metade de várzea', 'casa 200 m² com piscina pequena'],
    faixa: 'Casa com piscina e estrutura: cerca de R$ 1,6 a R$ 2 milhões' },

  { id: 'C', nome: 'Gleba C', area: '20 mil m²',
    destaques: ['maior parte do lago grande', 'platô com vista', 'chalé sobrado 80 m² pronto, com acabamentos e verniz'],
    faixa: 'Chalé pronto: cerca de R$ 900 mil a R$ 1 milhão' },

  { id: 'D', nome: 'Gleba D', area: '20 mil m²',
    destaques: ['casa simples 75 m²', 'maior parte do lago grande', 'meio do terreno'],
    faixa: '[FAIXA_D: eu confirmo]' },

  { id: 'E', nome: 'Gleba E', area: '20,5 mil m²',
    destaques: ['lago do fundo', 'vista ótima (fundo, lado direito)', 'sem construção'],
    faixa: 'Terreno: a partir de cerca de R$ 570 mil' },

  { id: 'F', nome: 'Gleba F', area: '22,3 mil m²',
    destaques: ['APP e reserva', 'mina de água mineral', 'vista ótima', 'sem construção'],
    faixa: 'Terreno: a partir de cerca de R$ 570 mil' },

  { id: 'G', nome: 'Gleba G', area: '21 mil m²',
    destaques: ['casa sede com deck de madeira de lei', 'piscina e pergolado (ainda será feito)',
                'energia solar gerando cerca de R$ 1.500/mês', 'tronco de aço e curral',
                'parte do lago do fundo', 'mobiliada'],
    faixa: 'Casa com piscina e estrutura: cerca de R$ 1,6 a R$ 2 milhões' }
];

/* ---------------------------------------------------------------------------
 * 10. DIFERENCIAIS (usados na seção "O Paraíso")
 * -------------------------------------------------------------------------*/
export const diferenciais = [
  { grupo: 'Águas e Lazer', itens: [
    'Um grande lago no coração da comunidade, com parte para a maioria das chácaras',
    'Mina de água mineral na parte mais alta do terreno (Gleba F)',
    'Água em abundância; vizinho da Cristágua, com a mesma fonte de água mineral',
    'Cerca de 2 km da Represa Jaguari — ponto privilegiado para jetski, moto aquática e náutica',
    'Riacho preservado correndo dentro da propriedade',
    'Criação de animais e horta com solo fértil e muita água'
  ]},
  { grupo: 'Infraestrutura', itens: [
    'Asfalto até a portaria',
    'Fibra óptica com sinal de alta velocidade',
    'Energia trifásica forte instalada',
    'Ruas abertas e cascalhadas (algumas em finalização)',
    'Sem problema de enchente e sem impedimento de tráfego'
  ]},
  { grupo: 'Localização Privilegiada', itens: [
    'Cerca de 20 min do centro de São José dos Campos',
    'Cerca de 1h30 de São Paulo (~100 km) com acesso fácil pela Dutra e Carvalho Pinto',
    'Cerca de 2 km da Represa Jaguari e da UBS',
    'Cerca de 4,5 km da UPA',
    '19 km do Aquárius, 14,5 km do Calçadão do Centro e 6 km do Parque da Cidade'
  ]},
  { grupo: 'Natureza e Comunidade', itens: [
    'Área de APP totalmente preservada com mata nativa',
    'Comunidade de chácaras com vizinhança solidária e decisões em conjunto',
    'Portaria com câmeras e monitoramento por grupo de WhatsApp entre vizinhos',
    'Silêncio, privacidade, segurança e contato direto com a natureza'
  ] }
];

/* ---------------------------------------------------------------------------
 * 11. FAQ — onde estiver vazio, o site escreve "Consulte no WhatsApp"
 * -------------------------------------------------------------------------*/
export const naoSeiResponder = 'Consulte no WhatsApp';

export const faq = [
  { p: 'A documentação está em ordem?',
    r: 'Sim. O terreno e as chácaras estão totalmente documentados e regularizados. Documentação em ordem.' },
  { p: 'Como funciona o financiamento direto?',
    r: 'O financiamento é direto com o proprietário, mediante entrada. Sem banco e sem burocracia bancária. As condições são conversadas no WhatsApp.' },
  { p: 'Aceitam meu imóvel como parte do pagamento?',
    r: 'Sim. Aceitamos imóveis como parte do pagamento — terrenos e outros tipos de imóvel — sujeitos a avaliação.' },
  { p: 'Como é o lago das chácaras?',
    r: 'Existe um grande lago no coração da comunidade, dividido entre os terrenos: a maioria das chácaras tem uma parte do lago na sua própria matrícula. Na parte mais alta fica a mina de água mineral.' },
  { p: 'A represa fica perto?',
    r: 'Sim! A Represa Jaguari fica a cerca de 2 km, sendo excelente para passeios de barco, moto aquática, jetski e pesca esportiva.' },
  { p: 'Qual o valor da entrada e o prazo?', r: '' },
  { p: 'Existem juros?', r: '' },
  { p: 'Que tipo de documentação eu recebo?', r: '' },
  { p: 'Como agendo uma visita?',
    r: 'A visita é feita com hora marcada. Chame no WhatsApp e combinamos o melhor dia e horário.' },
  { p: 'O que é a comunidade de chácaras?',
    r: 'É uma comunidade de chácaras com decisões e cuidados em conjunto, vizinhança solidária, portaria e câmeras.' },
  { p: 'Como é a segurança?',
    r: 'Portaria, câmeras e monitoramento por grupo de WhatsApp entre vizinhos — vizinhança solidária.' },
  { p: 'Tem água e energia suficientes?',
    r: 'Sim. Água em abundância, energia trifásica forte e fibra óptica com sinal forte.' }
];

/* ---------------------------------------------------------------------------
 * 12. MÍDIA — pastas e arquivos reais mapeados
 * -------------------------------------------------------------------------*/
export const midia = {
  /** Caminhos públicos (o build copia public/ para a raiz do site). */
  pastas: {
    img: '/media/img/',
    video: '/media/video/',
    frames: '/media/frames/'
  },

  logo: '',                 // só exibe logo se houver arquivo real

  /** VSL 16:9. poster = imagem leve; src = mp4 (carrega só no clique). */
  vsl: { poster: '/media/img/vsl-poster.webp', src: '/media/video/vsl.mp4', webm: '' },

  /** 4 vídeos verticais 9:16 (demonstrações). */
  videos: [
    { poster: '/media/img/demo-1.webp', src: '/media/video/demo-1.mp4', titulo: 'O Lago e o Entorno' },
    { poster: '/media/img/demo-2.webp', src: '/media/video/demo-2.mp4', titulo: 'Mata e Nascentes' },
    { poster: '/media/img/demo-3.webp', src: '/media/video/demo-3.mp4', titulo: 'Vista Aérea do Terreno' },
    { poster: '/media/img/demo-4.webp', src: '/media/video/demo-4.mp4', titulo: 'Estrutura e Casas' }
  ],

  /** Ortofoto / visão 3D. */
  ortofoto: { pequena: '/media/img/localizacao-mapa.webp', grande: '/media/img/ortofoto-terreno.webp' },

  /** Mapa embed do Google (link fornecido). */
  mapaLink: 'https://maps.app.goo.gl/kVdV28pwVikpB3oJ6',

  /** Mapeamento de fotos reais por seção do site */
  secoes: {
    hero: '/media/img/hero-lago.webp',
    paraiso: '/media/img/paraiso.webp',
    infraestrutura: '/media/img/infraestrutura.webp',
    localizacao: '/media/img/localizacao-mapa.webp',
    comunidade: '/media/img/comunidade.webp',
    vida: '/media/img/vida-chacara.webp',
    visao3d: '/media/img/ortofoto-terreno.webp'
  },

  /** Fotos por gleba */
  fotosGlebas: {
    A: '/media/img/gleba-a.webp',
    B: '/media/img/gleba-b.webp',
    C: '/media/img/gleba-c.webp',
    D: '/media/img/gleba-d.webp',
    E: '/media/img/gleba-e.webp',
    F: '/media/img/gleba-f.webp',
    G: '/media/img/gleba-g.webp'
  },

  /** Poster do hero. */
  heroPoster: '/media/img/hero-lago.webp'
};

/* ---------------------------------------------------------------------------
 * 13. SEO
 * -------------------------------------------------------------------------*/
export const seo = {
  titulo: 'Chácaras em São José dos Campos | Paraíso das Águas — 2 hectares com lago e água mineral',
  /** Até ~155 caracteres: é o que o Google mostra. */
  descricao:
    'Chácaras de 20 mil m² com um grande lago no coração da comunidade, água mineral, asfalto, fibra óptica e energia trifásica, a cerca de 20 min do centro de São José dos Campos. Documentação em ordem e financiamento direto com o proprietário.',
  url: 'https://SEU-DOMINIO.com.br',   // PREENCHER: domínio final, sem barra no fim
  imagemOg: '/og.jpg',                 // PREENCHER: imagem 1200×630
  palavrasChave: 'chácara à venda São José dos Campos, terreno com lago, sítio São José dos Campos, chácara com água mineral',
  /** Nome que aparece no preview das redes */
  nomeSite: 'Paraíso das Águas',
  locale: 'pt_BR',
  /** Perfis oficiais (opcional) */
  redes: { instagram: '', facebook: '', youtube: '' },
  /** Geo (opcional, ajuda busca local). Formato decimal. */
  geo: { latitude: '', longitude: '' },
  /** Preço "a partir de" para o dado estruturado. Só aparece se preenchido. */
  precoAPartir: ''
};

/* ---------------------------------------------------------------------------
 * 14. RASTREAMENTO — carrega SOMENTE após consentimento
 * ---------------------------------------------------------------------------
 * Nada aqui é executado antes de a pessoa aceitar a categoria correspondente.
 * O Google Consent Mode v2 começa em "denied" e só é atualizado depois.
 * -------------------------------------------------------------------------*/
export const tracking = {
  metaPixelId: '',         // PREENCHER: ex.: '1234567890'
  googleTagId: '',         // PREENCHER (GT-XXXXXXX ou AW-XXXXXXX)
  eventosScroll: [25, 50, 75, 100],
  /** Evento enviado no clique do WhatsApp */
  eventoWhatsApp: 'Contact',
  /** Evento enviado quando alguém dá play na VSL */
  eventoVsl: 'ViewContent'
};

/* ---------------------------------------------------------------------------
 * 15. LGPD — consentimento, cookies e dados do controlador
 * -------------------------------------------------------------------------*/
export const lgpd = {
  /** O banner só aparece se estiver ativo E houver tag configurada. */
  bannerAtivo: true,
  /** Mostra o banner mesmo sem tags (útil para conferir o visual). */
  forcarBanner: false,
  chaveStorage: 'pd-consent-v1',
  validadeDias: 180,
  textoResumo:
    'Usamos cookies para medir o desempenho do site e dos anúncios. Você escolhe o que permitir.',

  /** Controlador dos dados (obrigatório na política). */
  controlador: {
    razaoSocial: '',      // PREENCHER
    cnpj: '',             // PREENCHER
    endereco: '',         // PREENCHER
    email: '',            // PREENCHER: e-mail para exercer direitos
    encarregado: ''       // PREENCHER (opcional): encarregado de dados
  },

  /** Terceiros que podem receber dados, por categoria. */
  terceiros: {
    marketing: ['Meta Platforms (Facebook/Instagram/WhatsApp)', 'Google (Ads e Tag Manager)'],
    estatistica: ['Google Analytics']
  },

  /** Tempo de retenção declarado. */
  retencao: 'Os registros de navegação são mantidos por até 26 meses. As conversas de WhatsApp ficam com o corretor pelo tempo necessário ao atendimento.',

  /** Data da última revisão das políticas (aparece no rodapé das páginas). */
  versaoPoliticas: '',

  /** Tabela de cookies mostrada na política. Ajuste se mudar de ferramenta. */
  cookies: [
    { nome: 'pd-consent-v1', finalidade: 'Guarda a sua escolha de consentimento.', categoria: 'Necessário', validade: '180 dias' },
    { nome: '_fbp / _fbc', finalidade: 'Meta Pixel: mede o resultado dos anúncios.', categoria: 'Marketing', validade: '90 dias' },
    { nome: '_ga / _ga_*', finalidade: 'Google Analytics: estatísticas de visita.', categoria: 'Estatística', validade: '26 meses' },
    { nome: '_gcl_au', finalidade: 'Google Ads: atribuição de campanha.', categoria: 'Marketing', validade: '90 dias' }
  ]
};

/* MODO DE TESTE DO BANNER
 * Enquanto você não tiver Pixel/Tag, o banner de cookies não aparece (não há
 * o que consentir). Para CONFERIR o visual e o funcionamento antes, ligue
 * `ativo` abaixo e rode o build: o banner aparece e as tags de teste são
 * injetadas só depois do aceite. A escolha continua salva no navegador.
 *
 * IMPORTANTE: deixe `ativo: false` quando publicar de verdade. */
export const trackingTeste = {
  ativo: false,
  googleTagFalso: 'GT-TESTE',
  metaPixelFalso: '000000000000000'
};

/* ---------------------------------------------------------------------------
 * 16. CARROSSEL 3D DE TEXTOS
 * ---------------------------------------------------------------------------
 * Só para TÍTULOS e FRASES CURTAS (até ~140 caracteres). Conteúdo denso
 * (cards de gleba, mapa, FAQ, rodapé) NÃO passa por aqui: fica em fluxo
 * normal, legível, sobre um painel escuro.
 *
 * Ordem do array = ordem em que os blocos aparecem durante a rolagem.
 * -------------------------------------------------------------------------*/
export const titulos = [
  { rotulo: 'Água pura', icone: 'nascente', texto: 'Onde a água nasce na sua própria terra' },
  { rotulo: 'O Lago', icone: 'lago', texto: 'Um grande lago no coração da comunidade' },
  { rotulo: 'Infraestrutura', icone: 'estrada', texto: 'Asfalto até a portaria, fibra óptica e energia trifásica' },
  { rotulo: 'O Paraíso', icone: 'montanha', texto: 'A 20 min do centro e a 2 km da Represa Jaguari com jetski' },
  { rotulo: 'Visão 3D', icone: 'area', texto: 'Chácaras de 2 hectares com documentação em ordem' }
];

/** Comportamento do carrossel. */
export const carrossel = {
  /** Faixa do progresso global em que o carrossel acontece. */
  faixa: { inicio: 0.08, fim: 0.40 },
  /** Quantos textos ficam visíveis ao mesmo tempo (o resto fica fora de cena). */
  visiveis: 3,
  /** Rotação máxima de entrada/saída, em graus. */
  rotacaoMax: 45,
  /** Perspectiva do contêiner, em px. */
  perspectiva: 1200,
  /** Translação vertical máxima, em múltiplos da altura do bloco. */
  deslocamento: 1.2,
  /** Opacidade mínima (para o texto não "piscar" ao entrar). */
  opacidadeMinima: 0,
  /** Escala do bloco no centro. */
  escalaCentro: 1,
  /** Escala do bloco nas pontas (dá sensação de profundidade). */
  escalaPonta: 0.85,
  /** Desfoque nas pontas, em px. */
  desfoquePonta: 0
};

/* ---------------------------------------------------------------------------
 * 17. PROVA RÁPIDA — legenda (vazia: só exibe se comparativoReal for preenchido)
 * -------------------------------------------------------------------------*/
export const provaLegenda = '';

/* ---------------------------------------------------------------------------
 * 18. LOCALIZAÇÃO E DISTÂNCIAS (seção 5)
 * -------------------------------------------------------------------------*/
export const localizacao = {
  titulo: 'Perto de tudo o que importa, longe do barulho',
  texto:
    'Acesso por asfalto até a portaria, ruas internas cascalhadas e a minutos da Represa Jaguari. O dia a dia resolve rápido, sem abrir mão do silêncio da roça.',
  /** Todas as distâncias com "cerca de", conforme o briefing. */
  distancias: [
    { destino: 'Represa Jaguari (jetski, esportes náuticos e pesca)', valor: 'cerca de 2 km' },
    { destino: 'Centro de São José dos Campos', valor: 'cerca de 20 min' },
    { destino: 'São Paulo (Dutra / Carvalho Pinto)', valor: 'cerca de 1h30 (~100 km)' },
    { destino: 'Santana Parque (Parque da Cidade)', valor: 'cerca de 6 km' },
    { destino: 'Calçadão do Centro', valor: 'cerca de 14,5 km' },
    { destino: 'Aquárius', valor: 'cerca de 19 km' },
    { destino: 'UPA e UBS', valor: 'cerca de 2 a 4,5 km' }
  ],
  legendaMapa: 'Toque para abrir a localização exata no Google Maps'
};

/* ---------------------------------------------------------------------------
 * 19. COMUNIDADE E SEGURANÇA (seção 6)
 * -------------------------------------------------------------------------*/
export const comunidade = {
  titulo: 'Vizinhança que se conhece e se cuida',
  texto:
    'Uma comunidade de chácaras com decisões e cuidados em conjunto. Portaria, câmeras e um grupo de WhatsApp entre vizinhos — o tipo de lugar onde se sabe o nome de quem passa.',
  cartoes: [
    { icone: 'portaria', titulo: 'Portaria e câmeras', texto: 'Controle de entrada e monitoramento nas vias principais.' },
    { icone: 'vizinhos', titulo: 'Vizinhança solidária', texto: 'Grupo de WhatsApp entre vizinhos para avisos e cuidado mútuo.' },
    { icone: 'decisao',  titulo: 'Decisões em conjunto', texto: 'As melhorias do lugar são decididas e cuidadas por todos.' },
    { icone: 'perfil',   titulo: 'Mesma via', texto: 'Empresários locais e profissionais liberais na mesma via.' }
  ]
};

/* ---------------------------------------------------------------------------
 * 20. VIDA NA CHÁCARA (seção 7)
 * -------------------------------------------------------------------------*/
export const vidaNaChacara = {
  titulo: 'O dia começa com o som dos bichos',
  texto:
    'Terra de alta qualidade e muita água: dá para criar animais, manter horta o ano inteiro e curtir a represa e os morros da serra.',
  itens: [
    { icone: 'cavalo', titulo: 'Cavalos e ovelhas', texto: 'Espaço de sobra para criação e para o lazer da família.' },
    { icone: 'horta',  titulo: 'Horta natural', texto: 'Terra fértil e água em abundância o ano inteiro.' },
    { icone: 'lago',   titulo: 'Um grande lago no coração', texto: 'Água límpida para contemplar e viver em paz.' },
    { icone: 'jetski', titulo: 'Represa Jaguari a 2 km', texto: 'Passeios de barco, moto aquática e esportes na água.' },
    { icone: 'cerca',  titulo: 'Cerca e porteira', texto: 'Área de APP preservada e ruas internas tranquilas.' },
    { icone: 'montanha', titulo: 'Vista dos morros e céu aberto', texto: 'Silêncio, ar puro e qualidade de vida de verdade.' }
  ]
};

/* ---------------------------------------------------------------------------
 * 21. VISÃO 3D / ORTOFOTO (seção 8)
 * -------------------------------------------------------------------------*/
export const visao3d = {
  titulo: 'Veja a divisão das chácaras',
  texto:
    'Explore a vista aérea com as demarcações reais das glebas, do lago central e da área de preservação.',
  legenda: 'Vista aérea do empreendimento — divisão das glebas A a G'
};

/* ---------------------------------------------------------------------------
 * 22. VSL — A TV QUE LIGA (seção 3)
 * ---------------------------------------------------------------------------
 * A moldura começa DESLIGADA (preta). Conforme a pessoa rola, uma linha de luz
 * cresce no centro, abre em tela, dá um flash curto e revela o título e o PLAY.
 * Tudo isso é reversível e ligado ao progresso (não é play de vídeo).
 *
 * O vídeo NUNCA carrega sozinho: só o poster. O arquivo real só é baixado no
 * clique — é isso que segura o LCP e o consumo de dados de quem vem de anúncio.
 * -------------------------------------------------------------------------*/
export const vsl = {
  /* --- Conteúdo ------------------------------------------------------ */
  titulo: 'Veja o Paraíso das Águas de perto',
  subtitulo: 'Um grande lago no coração da comunidade, mata preservada e água mineral dentro da propriedade.',
  legenda: 'Vídeo de apresentação',
  duracao: '',                  // ex.: '2:14' (deixe vazio para não exibir)
  poster: '/media/img/vsl-poster.webp',

  /* --- Fontes do vídeo (preenchidas depois de otimizar a mídia) ------ */
  fontes: { mp4: '', webm: '' },
  /* Legenda/transcrição: só preencha quando existir o arquivo .vtt. */
  legendas: '',

  /* --- Efeito "ligar" (função do progresso) -------------------------- */
  faixa: { inicio: 0.40, fim: 0.50 },   // faixa do progresso global
  /** Em qual ponto da faixa (0..1) cada etapa acontece */
  marcos: {
    linhaCresce: 0.00,    // linha de luz cresce no centro
    abreTela: 0.34,       // a linha abre para cima e para baixo
    flash: 0.62,          // clarão curto
    revelaConteudo: 0.74  // título, subtítulo e botão PLAY
  },
  /** Intensidade do flash (0 = sem flash) */
  forcaFlash: 0.85
};

/* ---------------------------------------------------------------------------
 * 23. VÍDEOS DE DEMONSTRAÇÃO (seção 10) — 2×2 no PC, carrossel no celular
 * ---------------------------------------------------------------------------
 * A abertura é o efeito "linha de bambu", controlado pelo progresso:
 *   1. só o título aparece (esfumaçado);
 *   2. uma linha fina cor de bambu desce e cruza o centro;
 *   3. ao centralizar, ela se divide em duas e abre para cima e para baixo,
 *      revelando os vídeos;
 *   4. ao continuar descendo, fecha ao contrário e sai de cena.
 * Tudo reversível: subir refaz o caminho ao contrário.
 * -------------------------------------------------------------------------*/
export const videosSecao = {
  rotulo: 'Demonstrações',
  titulo: 'Ande pela chácara sem sair de casa',
  texto: 'Quatro vídeos curtos mostrando o grande lago, as ruas, as casas e a vista.',
  faixa: { inicio: 0.72, fim: 0.88 },
  marcos: {
    titulo: 0.00,
    linhaDesce: 0.10,
    abreVideos: 0.34,
    fecha: 0.86
  },
  /** Textura de nós do bambu: 0 desliga (mais rápido), 1 deixa marcada. */
  nosBambu: 0.8
};

/* ---------------------------------------------------------------------------
 * 24. FAQ — apoio e perguntas extras
 * -------------------------------------------------------------------------*/
export const faqTextoApoio =
  'Se a sua dúvida não estiver aqui, chame no WhatsApp: a resposta é rápida e sem compromisso.';

/** Perguntas que dependem de dado comercial: só aparecem se respondidas. */
export const faqExtras = [
  { p: 'Aceita troca por outro terreno?', r: 'Sim. Aceitamos imóveis como parte do pagamento — terrenos e outros tipos de imóvel — sujeitos a avaliação.' },
  { p: 'Como funciona a avaliação do meu imóvel?', r: '' },
  { p: 'Posso construir do jeito que eu quiser?', r: 'Cada chácara tem cerca de 2 hectares e área de APP preservada. As regras de construção são combinadas na comunidade.' },
  { p: 'Tem problema de enchente ou de acesso em dia de chuva?', r: 'Não. O acesso é asfaltado até a portaria, as ruas internas são abertas e cascalhadas, e a região não tem problema de enchente nem impedimento de tráfego.' }
];

/* ---------------------------------------------------------------------------
 * 25. CTA FINAL (seção 12)
 * -------------------------------------------------------------------------*/
export const ctaFinal = {
  rotulo: 'Agende sua visita',
  titulo: 'Venha ver com os seus olhos',
  texto: 'A visita é com hora marcada. A gente combina o melhor dia e mostra cada canto: o grande lago no coração da comunidade, a mina de água, as ruas e as chácaras disponíveis.',
  botao: 'Agendar visita no WhatsApp',
  botaoSecundario: 'Tenho um imóvel para negociar',
  /** Só aparece se estiver preenchido (escassez de verdade, não inventada). */
  escassez: '',   // vazio → usa empreendimento.escassezTexto
  passos: [
    'Você chama no WhatsApp e conta o que procura',
    'A gente marca o dia e a hora da visita',
    'Você conhece o lugar e tira todas as dúvidas no local'
  ]
};

/* ---------------------------------------------------------------------------
 * 26. RODAPÉ
 * -------------------------------------------------------------------------*/
export const rodape = {
  sobre: 'Comunidade de chácaras de cerca de 2 hectares com um grande lago no coração da comunidade, água mineral, mata preservada e infraestrutura completa, a cerca de 20 minutos do centro de São José dos Campos.',
  /** Links internos */
  links: [
    { texto: 'Política de Privacidade', href: '/politica-de-privacidade.html' },
    { texto: 'Política de Cookies', href: '/politica-de-cookies.html' },
    { texto: 'Preferências de cookies', href: '#', acao: 'cookies' }
  ],
  /** Contato */
  mostrarWhatsApp: true,
  /** Ano do copyright: vazio usa o ano atual */
  ano: ''
};

/* ---------------------------------------------------------------------------
 * 27. EXPORT ÚNICO (usado pelo resto do código: import config from './config.js')
 * -------------------------------------------------------------------------*/
const config = {
  whatsapp, scroll, fundo, vidroTV, empreendimento, hero, provaRapida,
  condicoes, glebas, diferenciais, faq, naoSeiResponder, midia, seo,
  tracking, lgpd, titulos, carrossel, provaLegenda, localizacao,
  comunidade, vidaNaChacara, visao3d,
  vsl, videosSecao, faqTextoApoio, faqExtras, ctaFinal, rodape,
  trackingTeste
};

/* --------------------------------------------------------------------------
 * MODO DE TESTE — se `trackingTeste.ativo` estiver ligado, os IDs falsos
 * entram no lugar dos reais. Serve para conferir o banner de consentimento
 * antes de você ter as contas de anúncio. Desligado por padrão.
 * ------------------------------------------------------------------------ */
if (trackingTeste.ativo) {
  if (!config.tracking.googleTagId) config.tracking.googleTagId = trackingTeste.googleTagFalso;
  if (!config.tracking.metaPixelId) config.tracking.metaPixelId = trackingTeste.metaPixelFalso;
  config.lgpd.forcarBanner = true;
}

export default config;
