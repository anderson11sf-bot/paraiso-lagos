# Publicar e manter o site

Guia prático para colocar o site no ar e trocar dados depois.
O build é **estático**: nenhuma etapa precisa de Node no servidor.

---

## 1. Antes de publicar (15 minutos, uma vez)

### 1.1 Preencha o `src/config.js`

Os campos abaixo ainda estão vazios. Sem eles o site funciona, mas fica
incompleto (e alguns aparecem marcados como pendentes na tela):

| Campo | O que é |
|---|---|
| `seo.url` | Domínio final, sem barra no fim. Ex.: `https://paraisodasaguas.com.br` |
| `seo.imagemOg` | Imagem 1200×630 que aparece ao compartilhar o link |
| `empreendimento.legal.razaoSocial` / `.cnpj` / `.creci` / `.emailContato` | Aparecem no rodapé e nas políticas |
| `lgpd.controlador.*` | Obrigatório na Política de Privacidade |
| `lgpd.versaoPoliticas` | Data da revisão das políticas |
| `tracking.metaPixelId` / `.googleTagId` | Só se você for anunciar/medir |
| `glebas` (id `D`) | A faixa de valor que você ainda vai confirmar |
| `empreendimento.comparativoReal` | O comparativo de preço, se quiser usar |

> **A palavra "condomínio" não é usada** para descrever o empreendimento em
> nenhum texto do site (aparece apenas se você escrever no comparativo).

### 1.2 Rode o script de mídia

Com a sua pasta de fotos e vídeos:

```powershell
pwsh scripts/otimizar-midia.ps1 -Origem "C:\Users\ander\OneDrive\Desktop\agua mminando"
```

Ele converte tudo para `public/media/` e imprime a lista pronta para colar no
`config.js`. Resultados medidos nesta máquina:

| Arquivo | Antes | Depois | Redução |
|---|---|---|---|
| Vídeo de demonstração 1080×1920, 9,4 s | 14,91 MB | **1,24 MB** (720p) | 92% |
| Foto comum | 169 KB | **22 KB** (AVIF 480) | 87% |

### 1.3 Revise as políticas

As páginas de Privacidade e Cookies já estão escritas e trazem um aviso amarelo
no topo. **Elas são modelos**: preencha os campos marcados e peça a revisão de
um advogado antes de publicar.

---

## 2. Gerar o build

```bash
npm install
npm run build
```

Isso cria a pasta `dist/`. É o **conteúdo dela** que vai para o servidor.

```bash
npm run servir       # confere o resultado em http://127.0.0.1:4173
```

---

## 3. Publicar na HOSTINGER (hospedagem compartilhada)

O `.htaccess` já está pronto e vai dentro do `dist/` automaticamente.

1. No painel da Hostinger, ative o **SSL gratuito** (Let's Encrypt) e espere
   ficar ativo.
2. Abra o **Gerenciador de Arquivos** (ou conecte por FTP) e entre em
   `public_html`.
3. **Envie o CONTEÚDO de `dist/`**, não a pasta `dist` em si:
   - `index.html`, `404.html`, `politica-de-privacidade.html`,
     `politica-de-cookies.html`
   - as pastas `assets/`, `media/`, `.well-known/`
   - os arquivos `.htaccess`, `favicon.svg`, `robots.txt`, `sitemap.xml`, `_headers`
4. Depois de enviar, edite o `.htaccess` e **descomente as duas regras de HTTPS**
   (linhas com `RewriteCond %{HTTPS}` e `RewriteCond %{HTTP_HOST} ^www`).
   Troque `SEU-DOMINIO.com.br` pelo seu domínio antes.
5. Teste: abra o site, force uma URL errada (`/naoexiste`) e confira se cai na
   página 404 com o visual do site.

> **Vídeos pesados:** hospedagem compartilhada costuma ter limite de banda. Com
> a VSL recomprimida (o script resolve) o consumo fica próximo de 1 MB por
> visita. Se você publicar vídeos longos em 1080p, considere hospedar os vídeos
> em um serviço de vídeo e manter só o poster e o play no site.

### Como atualizar depois
Repita o build e envie o conteúdo novo de `dist/`. Os arquivos com hash no nome
mudam sozinhos, então o cache do visitante nunca serve versão velha.

---

## 4. Publicar na VERCEL

O `vercel.json` já está pronto na raiz do projeto.

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o
   repositório.
3. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Deploy. Para atualizar depois, basta dar push no GitHub — a Vercel
   reconstrói sozinha.

Alternativa por linha de comando:

```bash
npm i -g vercel
vercel          # pré-visualização
vercel --prod   # produção
```

> **Atenção ao plano:** o plano gratuito da Vercel é destinado a uso pessoal e
> não comercial. Para campanha comercial, verifique os termos atuais e escolha o
> plano adequado.

---

## 5. Domínio próprio (DNS)

**Na Hostinger:** o domínio já é gerenciado lá. Aponte os nameservers para a
Hostinger (ou mantenha o registro A apontando para o IP da hospedagem) e ative
o SSL no painel.

**Na Vercel:** em *Settings → Domains*, adicione o domínio. A Vercel mostra
exatamente o que criar no seu provedor de DNS:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` (domínio raiz) | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

A propagação costuma levar de 10 minutos a algumas horas. Escolha **uma** versão
canônica (com ou sem `www`) e deixe a outra redirecionando — o `.htaccess` e o
`vercel.json` já têm a regra, basta descomentar/ajustar.

---

## 6. Trocar dados depois de publicado

| O que trocar | Onde | Precisa rebuild? |
|---|---|---|
| Número do WhatsApp, textos, FAQ, faixas de valor | `src/config.js` | **Sim** (`npm run build`) |
| Fotos, vídeos, posters | `public/media/` + caminhos no `config.js` | **Sim** |
| Pixel/Tag IDs | `src/config.js` → `tracking` | **Sim** |
| Políticas (textos jurídicos) | `src/lib/paginas.js` | **Sim** |
| Cabeçalhos de segurança | `public/.htaccess`, `vercel.json`, `public/_headers` | Não (só reenviar) |

> Se quiser trocar texto **sem** rebuild, o caminho é transformar o `config.js`
> em um `config.json` buscado em tempo de execução. Não fiz isso porque o build
> estático é mais rápido e mais seguro (CSP sem `unsafe-inline`, nenhuma
> requisição extra). Se precisar, é uma mudança pequena e localizada.

---

## 7. Verificação final (roda antes de publicar)

```bash
npm run build      # sem erros
npm run servir     # abra e percorra a página inteira
node scripts/auditar.mjs   # checklist automático do projeto
```

O `scripts/auditar.mjs` confere no `dist/` os pontos que mais dão problema:
`overflow-x`, `position: fixed` dentro de elemento com `transform`, uso de
`100vh`, `scroll-behavior: smooth` junto com o Lenis, e se os cabeçalhos de
segurança estão presentes.

### O que depende de teste em aparelho real

Estes itens **não** dá para garantir só olhando o código. Teste no celular:

1. **Fluidez do scroll no toque** — a rolagem não pode parecer "atrasada".
2. **Botão de WhatsApp arrastável** — arrastar não pode rolar a página, e
   soltar depois de arrastar não pode abrir o WhatsApp sem querer.
3. **Barra do navegador aparecendo/sumindo** — a altura não pode pular.
4. **Desempenho do fundo animado** — se esquentar ou travar, o modo LITE entra
   sozinho em aparelho fraco; para forçar, veja `fundo.resolucao.modoLite`.
5. **Vídeo da VSL no iPhone** — o iOS exige um toque para liberar o áudio; o
   botão dá esse toque, mas confirme no aparelho.
