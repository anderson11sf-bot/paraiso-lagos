#!/usr/bin/env node
/* ============================================================================
 * auditar.mjs — CHECKLIST AUTOMÁTICO DO BUILD
 * ----------------------------------------------------------------------------
 * Roda depois de `npm run build` e confere no dist/ os pontos que mais dão
 * problema neste tipo de site. Não substitui teste em aparelho real: pega o que
 * dá para pegar olhando o código e os arquivos gerados.
 *
 * Uso:  node scripts/auditar.mjs
 *
 * O que ele verifica
 *   1.  Arquivos obrigatórios do build
 *   2.  Nenhum preço exato em reais no bundle (regra do briefing)
 *   3.  A palavra "condomínio" fora do comparativo
 *   4.  overflow-x: hidden em html/body (proibido: quebra pin/sticky)
 *   5.  100vh puro (proibido: usar svh/dvh)
 *   6.  scroll-behavior: smooth junto com o Lenis
 *   7.  position: fixed dentro de elemento com transform (quebra o palco)
 *   8.  will-change permanente (custo de memória)
 *   9.  Cabeçalhos de segurança presentes nos arquivos de deploy
 *  10.  Nenhum script inline no HTML (a CSP não permite unsafe-inline)
 *  11.  Tags de terceiros só depois do consentimento
 *  12.  Tamanho dos arquivos gerados
 * ==========================================================================*/

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const dist = join(raiz, 'dist');

const resultados = [];
let falhas = 0;
let avisos = 0;

function ok(titulo, detalhe = '') { resultados.push({ nivel: 'ok', titulo, detalhe }); }
function falha(titulo, detalhe = '') { falhas++; resultados.push({ nivel: 'falha', titulo, detalhe }); }
function aviso(titulo, detalhe = '') { avisos++; resultados.push({ nivel: 'aviso', titulo, detalhe }); }
function info(titulo, detalhe = '') { resultados.push({ nivel: 'info', titulo, detalhe }); }

/** Lê todos os arquivos de um tipo dentro do dist/. */
async function lerPorExtensao(ext) {
  const achados = [];
  async function andar(dir) {
    let itens = [];
    try { itens = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const item of itens) {
      const caminho = join(dir, item.name);
      if (item.isDirectory()) await andar(caminho);
      else if (extname(item.name) === ext) achados.push(caminho);
    }
  }
  await andar(dist);
  return achados;
}

/* --------------------------------------------------------------------------
 * 1. Arquivos obrigatórios
 * ------------------------------------------------------------------------ */
async function checarArquivos() {
  // No dist/ ficam só os arquivos que o servidor publica.
  const noDist = [
    'index.html',
    '404.html',
    'politica-de-privacidade.html',
    'politica-de-cookies.html',
    'robots.txt',
    'sitemap.xml',
    'favicon.svg',
    '.htaccess',
    '_headers',
    join('.well-known', 'security.txt')
  ];

  const faltando = noDist.filter((f) => !existsSync(join(dist, f)));
  if (faltando.length) falha('Arquivos publicados no build', `faltando: ${faltando.join(', ')}`);
  else ok('Arquivos publicados no build', `${noDist.length} presentes`);

  // Na RAIZ do projeto ficam os arquivos de configuração de deploy.
  // `vercel.json` é lido pela própria Vercel no repositório, não pelo site —
  // por isso ele NÃO precisa (nem deve) estar no dist/.
  const naRaiz = ['vercel.json', 'package.json', 'vite.config.js'];
  const faltandoRaiz = naRaiz.filter((f) => !existsSync(join(raiz, f)));
  if (faltandoRaiz.length) falha('Arquivos de configuração do projeto', `faltando: ${faltandoRaiz.join(', ')}`);
  else ok('Arquivos de configuração do projeto', `${naRaiz.length} presentes na raiz`);

  // As pastas de mídia precisam existir (mesmo vazias) para o deploy não falhar
  for (const pasta of ['media/img', 'media/video', 'media/frames']) {
    if (existsSync(join(dist, pasta))) ok(`Pasta ${pasta}`, 'existe');
    else aviso(`Pasta ${pasta}`, 'não existe no build (o site usa placeholder)');
  }
}

/* --------------------------------------------------------------------------
 * 2 e 3. Regras de conteúdo (preço exato e "condomínio")
 * ------------------------------------------------------------------------ */
async function checarConteudo() {
  const arquivos = [...await lerPorExtensao('.js'), ...await lerPorExtensao('.html')];
  let texto = '';
  for (const a of arquivos) texto += await readFile(a, 'utf8');

  // Preço exato de IMÓVEL: o briefing proíbe. O alvo são valores fechados de
  // terreno/casa — a casa dos milhares ou milhões SEM a palavra "mil"/"milhão".
  // Valores com barra (ex.: "R$ 1.500/mês" de energia solar) são FATOS do
  // empreendimento e não entram na regra.
  const candidatos = texto.match(/R\$\s?\d{1,3}(?:\.\d{3})+(?:,\d{2})?/g) || [];
  const suspeitos = [];
  for (const bruto of candidatos) {
    const numero = Number(bruto.replace(/[^\d]/g, ''));
    // Só interessa valor de imóvel: 100 mil ou mais, e não valor mensal.
    if (!Number.isFinite(numero) || numero < 100000) continue;
    const posicao = texto.indexOf(bruto);
    const contexto = texto.slice(Math.max(0, posicao - 60), posicao + bruto.length + 40);
    const ehMensal = /\/\s*m[êe]s|por m[êe]s|mensal/i.test(contexto);
    const ehFaixa = /\bmil\b|\bmilh(ão|ões|ao|oes)\b/i.test(contexto);
    if (!ehMensal && !ehFaixa) suspeitos.push(bruto);
  }

  if (suspeitos.length) {
    falha('Nenhum preço exato de imóvel no código', `revisar: ${[...new Set(suspeitos)].join(', ')}`);
  } else {
    ok('Nenhum preço exato de imóvel no código', 'só faixas, e valores mensais são fatos declarados');
  }

  // "condomínio" só pode aparecer no comparativo (campo do config)
  const ocorrencias = (texto.match(/condom[íi]nio/gi) || []).length;
  if (ocorrencias > 2) {
    aviso('Uso da palavra "condomínio"', `${ocorrencias} ocorrências — confirme se é só no comparativo`);
  } else {
    ok('Palavra "condomínio" sob controle', `${ocorrencias} ocorrência(s)`);
  }
}

/* --------------------------------------------------------------------------
 * 4 a 8. Regras de CSS que quebram a arquitetura de scroll
 * ------------------------------------------------------------------------ */
async function checarCss() {
  const folhas = await lerPorExtensao('.css');
  if (!folhas.length) { falha('CSS encontrado no build'); return; }

  let css = '';
  for (const f of folhas) css += await readFile(f, 'utf8');

  // 4. overflow-x: hidden em html/body
  if (/html[^{]*\{[^}]*overflow-x:\s*hidden/i.test(css) || /body[^{]*\{[^}]*overflow-x:\s*hidden/i.test(css)) {
    falha('Sem overflow-x: hidden em html/body', 'use overflow-x: clip (hidden cria contexto de scroll)');
  } else {
    ok('Sem overflow-x: hidden em html/body');
  }

  // 5. 100vh puro
  const vhPuro = (css.match(/[^-]100vh/g) || []).length;
  if (vhPuro) falha('Sem 100vh puro', `${vhPuro} ocorrência(s) — use svh/dvh`);
  else ok('Sem 100vh puro', 'usa svh/dvh');

  // 6. scroll-behavior: smooth (briga com o Lenis)
  if (/scroll-behavior:\s*smooth/i.test(css)) {
    falha('Sem scroll-behavior: smooth', 'conflita com o Lenis');
  } else {
    ok('Sem scroll-behavior: smooth');
  }

  // 7. position: fixed — não pode haver ancestral com transform para os
  //    elementos fixos do projeto (.palco, .carrossel, .wa-flutuante,
  //    .barra-progresso). Aqui conferimos se as classes críticas existem.
  const criticos = ['.palco', '.carrossel', '.wa-flutuante', '.barra-progresso'];
  const ausentes = criticos.filter((c) => !css.includes(c));
  if (ausentes.length) falha('Elementos fixos presentes no CSS', `ausentes: ${ausentes.join(', ')}`);
  else ok('Elementos fixos presentes no CSS', criticos.join(', '));

  // 8. will-change permanente
  const willChange = (css.match(/will-change/g) || []).length;
  info('Uso de will-change', `${willChange} ocorrência(s) — deve ser só em elemento animado`);

  // Extra: prefers-reduced-motion presente
  if (/prefers-reduced-motion/i.test(css)) ok('Suporte a prefers-reduced-motion');
  else aviso('Sem prefers-reduced-motion', 'usuários sensíveis a movimento não têm alternativa');
}

/* --------------------------------------------------------------------------
 * 9. Cabeçalhos de segurança
 * ------------------------------------------------------------------------ */
async function checarCabecalhos() {
  // Atenção às pastas: .htaccess e _headers são publicados (vão no dist/),
  // mas vercel.json é lido pela Vercel direto do repositório, na raiz.
  const arquivos = {
    'Hostinger (.htaccess)': join(dist, '.htaccess'),
    'Vercel (vercel.json)': join(raiz, 'vercel.json'),
    'Netlify/Cloudflare (_headers)': join(dist, '_headers')
  };
  const exigidos = [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Content-Security-Policy',
    'frame-ancestors'
  ];

  for (const [nome, caminho] of Object.entries(arquivos)) {
    if (!existsSync(caminho)) { falha(`Cabeçalhos — ${nome}`, 'arquivo ausente'); continue; }
    const conteudo = await readFile(caminho, 'utf8');
    const faltando = exigidos.filter((h) => !conteudo.includes(h));
    if (faltando.length) falha(`Cabeçalhos — ${nome}`, `faltando: ${faltando.join(', ')}`);
    else ok(`Cabeçalhos — ${nome}`, 'todos presentes');
  }
}

/* --------------------------------------------------------------------------
 * 10 e 11. HTML: script inline e tags de terceiros
 * ------------------------------------------------------------------------ */
async function checarHtml() {
  const paginas = await lerPorExtensao('.html');
  let problemaInline = 0;

  for (const pagina of paginas) {
    const html = await readFile(pagina, 'utf8');
    const nome = relative(dist, pagina);

    // Script inline: <script> sem src e com conteúdo executável.
    // Os blocos application/ld+json são dados, não código, e são permitidos.
    const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
    for (const s of scripts) {
      const semSrc = !/\bsrc\s*=/.test(s);
      const ehDados = /type\s*=\s*["']application\/ld\+json["']/i.test(s);
      const temCodigo = /<script\b[^>]*>\s*\S/.test(s);
      if (semSrc && temCodigo && !ehDados) {
        problemaInline++;
        aviso('Script inline no HTML', `${nome}: a CSP não permite unsafe-inline em script-src`);
      }
    }
  }
  if (!problemaInline) ok('Nenhum script inline executável', 'CSP pode ficar sem unsafe-inline');

  // Tags de terceiros: não podem aparecer como <script src> no HTML.
  // Elas são injetadas em tempo de execução, só depois do consentimento.
  let tagNoHtml = 0;
  for (const pagina of paginas) {
    const html = await readFile(pagina, 'utf8');
    if (/connect\.facebook\.net|googletagmanager\.com\/gtag/i.test(html)) tagNoHtml++;
  }
  if (tagNoHtml) falha('Tags de terceiros só após consentimento', `${tagNoHtml} página(s) com tag embutida no HTML`);
  else ok('Tags de terceiros só após consentimento', 'injetadas em tempo de execução');
}

/* --------------------------------------------------------------------------
 * Verificação de consentimento no bundle
 * ------------------------------------------------------------------------ */
async function checarConsentimento() {
  const arquivos = await lerPorExtensao('.js');
  let bundle = '';
  for (const f of arquivos) bundle += await readFile(f, 'utf8');

  const marcas = [
    ['Consent Mode declarado como negado', /ad_storage.{0,40}denied|denied.{0,40}ad_storage/],
    ['Chave do consentimento no storage', /pd-consent/],
    ['Carrega a tag do Google sob demanda', /googletagmanager\.com\/gtag/],
    ['Carrega o pixel da Meta sob demanda', /connect\.facebook\.net/]
  ];

  for (const [titulo, regex] of marcas) {
    if (regex.test(bundle)) ok(titulo);
    else aviso(titulo, 'não encontrado no bundle');
  }
}

/* --------------------------------------------------------------------------
 * Tamanhos
 * ------------------------------------------------------------------------ */
async function checarTamanhos() {
  const js = await lerPorExtensao('.js');
  const css = await lerPorExtensao('.css');

  let pesoJs = 0;
  for (const f of js) pesoJs += (await stat(f)).size;
  let pesoCss = 0;
  for (const f of css) pesoCss += (await stat(f)).size;

  const kb = (b) => `${Math.round(b / 1024)} KB`;
  info('JavaScript total', `${kb(pesoJs)} (GSAP + Lenis + código do site)`);
  info('CSS total', kb(pesoCss));

  // Referência prática: acima de 300 KB de JS começa a pesar em 3G/4G ruim.
  if (pesoJs > 300 * 1024) aviso('JavaScript acima de 300 KB', 'considere dividir o bundle por rota');
  else ok('JavaScript dentro do razoável', kb(pesoJs));

  if (pesoCss > 60 * 1024) aviso('CSS acima de 60 KB', 'verifique se há regra não usada');
  else ok('CSS dentro do razoável', kb(pesoCss));
}

/* --------------------------------------------------------------------------
 * Execução
 * ------------------------------------------------------------------------ */
async function main() {
  console.log('\n\x1b[36m=== AUDITORIA DO BUILD ===\x1b[0m');
  console.log(`Pasta: ${dist}\n`);

  if (!existsSync(dist)) {
    console.error('A pasta dist/ não existe. Rode `npm run build` primeiro.');
    process.exit(1);
  }

  await checarArquivos();
  await checarConteudo();
  await checarCss();
  await checarCabecalhos();
  await checarHtml();
  await checarConsentimento();
  await checarTamanhos();

  const icones = { ok: '\x1b[32m OK \x1b[0m', falha: '\x1b[31mFALHA\x1b[0m', aviso: '\x1b[33mAVISO\x1b[0m', info: '\x1b[36mINFO\x1b[0m' };
  for (const r of resultados) {
    const detalhe = r.detalhe ? `  \x1b[2m${r.detalhe}\x1b[0m` : '';
    console.log(`[${icones[r.nivel]}] ${r.titulo}${detalhe}`);
  }

  console.log('');
  if (falhas) {
    console.log(`\x1b[31m${falhas} falha(s)\x1b[0m e ${avisos} aviso(s). Corrija as falhas antes de publicar.\n`);
    process.exit(1);
  }
  console.log(`\x1b[32mNenhuma falha.\x1b[0m ${avisos} aviso(s) para revisar.\n`);
}

main().catch((erro) => {
  console.error('Erro na auditoria:', erro);
  process.exit(1);
});
