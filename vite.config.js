import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Vite - build estatico puro (sem Node em producao).
 * Saida: dist/ com caminhos relativos a raiz (/assets/...).
 * Funciona igual na Hostinger (Apache) e na Vercel.
 */
export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'es2019',          // cobre iOS 13+ / Android 8+ (a maior parte do trafego de anuncio)
    cssCodeSplit: false,       // um unico CSS: menos requisicoes no 4G
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true, passes: 2 },
      format: { comments: false }
    },
    rollupOptions: {
      /**
       * Varias paginas ("multi-page app"). Cada chave vira um HTML na raiz do
       * dist/. A Hostinger e a Vercel servem todos sem configuracao extra.
       */
      input: {
        principal: resolve(__dirname, 'index.html'),
        privacidade: resolve(__dirname, 'politica-de-privacidade.html'),
        cookies: resolve(__dirname, 'politica-de-cookies.html'),
        naoEncontrado: resolve(__dirname, '404.html')
      },
      output: {
        // Nomes estaveis e com hash de conteudo (cache immutable de 1 ano)
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (info) => {
          const n = info.name || '';
          if (/\.(woff2?|ttf|otf)$/i.test(n)) return 'assets/fonts/[name]-[hash][extname]';
          if (/\.(png|jpe?g|avif|webp|svg|gif|ico)$/i.test(n)) return 'assets/img/[name]-[hash][extname]';
          if (/\.(mp4|webm|ogv|mov)$/i.test(n)) return 'assets/video/[name]-[hash][extname]';
          if (/\.css$/i.test(n)) return 'assets/css/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  server: { port: 5173, open: false },
  preview: { port: 4173 }
});

