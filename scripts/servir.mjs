/* Servidor estático mínimo, só com o http nativo do Node.
 * Usado para você abrir o site no navegador sem depender do esbuild.
 *   node scripts/servir.mjs [porta]
 * Depois abra http://127.0.0.1:4173
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath resolve o caminho do Windows corretamente (a barra inicial
// antes de "C:" quebraria a checagem de segurança abaixo).
const raiz = fileURLToPath(new URL('../dist/', import.meta.url));
const porta = Number(process.argv[2] || 4173);

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2'
};

createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // Simula o "cleanUrls" da Vercel: /politica-de-cookies -> .html
    if (caminho.endsWith('/')) caminho += 'index.html';

    const relativo = caminho.replace(/^[/\\]+/, '').replace(/\.\./g, '');
    let arquivo = join(raiz, relativo);

    // Trava de segurança: nada fora da pasta dist/
    const raizSegura = raiz.endsWith(sep) ? raiz : raiz + sep;
    if (!arquivo.startsWith(raizSegura)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Proibido');
      return;
    }

    let info = null;
    try {
      info = await stat(arquivo);
    } catch {
      // Não existe: tenta com .html (comportamento de hospedagem real)
      try {
        const comHtml = `${arquivo}.html`;
        info = await stat(comHtml);
        arquivo = comHtml;
      } catch {
        // Última tentativa: a página 404 do próprio site, com status 404
        const pagina404 = join(raiz, '404.html');
        try {
          const corpo404 = await readFile(pagina404);
          res.writeHead(404, { 'Content-Type': tipos['.html'], 'Cache-Control': 'no-store' });
          res.end(corpo404);
          return;
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
          return;
        }
      }
    }

    if (info.isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
      return;
    }

    const corpo = await readFile(arquivo);
    res.writeHead(200, {
      'Content-Type': tipos[extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(corpo);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Erro no servidor');
  }
}).listen(porta, '127.0.0.1', () => {
  console.log(`Servindo dist/ em http://127.0.0.1:${porta}`);
  console.log('Ctrl+C para parar.');
});
