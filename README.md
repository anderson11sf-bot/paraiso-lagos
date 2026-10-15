# Paraíso das Águas — site de campanha

Site imersivo (mobile-first) para venda de chácaras em São José dos Campos – SP.
Objetivo único: levar o visitante ao **WhatsApp para agendar visita**.

**Stack:** HTML + CSS + JavaScript puro, empacotado com **Vite**, animação com
**GSAP + ScrollTrigger** e rolagem suave com **Lenis** (só no desktop). Sem frameworks.

---

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento, com recarga automática
npm run build      # gera dist/ (é isto que vai para o servidor)
npm run servir     # abre dist/ em http://127.0.0.1:4173 (servidor simples, sem Vite)
```

> `npm run preview` também existe, mas depende do esbuild. Se o seu antivírus ou
> a política da máquina bloquear a abertura de processos, use `npm run servir`,
> que só usa o `http` nativo do Node.

---

## O painel de controle é UM arquivo: `src/config.js`

Nada de caçar texto no código. **Tudo** que você troca está lá:

| O que você quer trocar | Onde |
|---|---|
| Número do WhatsApp | `whatsapp.numero` |
| Mensagens por origem do clique | `whatsapp.mensagens` |
| Velocidade e duração da narrativa | `scroll.alturaTotalSvh` (menor = mais rápido) |
| Faixas do fundo (etapa 1, 2, 3) | `scroll.etapas` |
| Aviso "Deslize para baixo" | `scroll.dica` |
| Intensidade de neblina, sol, partículas | `fundo.intensidades`, `fundo.particulas` |
| Escurecimento do vidro de TV | `vidroTV` |
| Textos do topo (headline, selos, botões) | `hero` |
| Faixa de prova rápida | `provaRapida` |
| Condições comerciais | `condicoes` |
| Glebas A–G | `glebas` |
| Diferenciais | `diferenciais` |
| FAQ | `faq` |
| Vídeos, posters, ortofoto, mapa | `midia` |
| SEO (título, descrição, domínio) | `seo` |
| Pixel da Meta e Google Tag | `tracking` |
| Aviso de cookies | `lgpd` |

### Regras que o código já respeita por você
- **Nenhum preço exato** de gleba no código. Só a faixa exibida (`glebas[].faixa`).
- Campo **vazio** de condições (entrada, prazo, juros, tipo de documento) faz o
  site escrever **"Consulte no WhatsApp"** — ele nunca inventa dado jurídico.
- `empreendimento.comparativoReal` vazio ⇒ a frase comparativa **não aparece**.
- `empreendimento.escassezTexto` vazio ⇒ usa o padrão neutro "Visitas com hora marcada".
- A palavra "condomínio" não é usada na copy (só "comunidade de chácaras",
  "vizinhança solidária", "chácaras com portaria e monitoramento").

---

## Como colocar sua mídia

1. Copie os arquivos para dentro de `public/media/`:
   - `img/` → fotos, posters, logo, ortofoto
   - `video/` → VSL (16:9) e os 4 vídeos de demonstração (9:16)
   - `frames/` → sequências dos fundos (`fundo1_0001.webp`…)
2. Preencha os caminhos em `config.js` → `midia` (ex.: `/media/img/lago.avif`).
3. Rode `npm run build`.

**Nomes de arquivo:** sem espaço, sem acento, minúsculos, com hífen
(`casa-sede-deck.webp`).

Enquanto não houver mídia, o site usa **placeholders funcionais**:
- Fundo: cena procedural desenhada em canvas (amanhecer na chácara) — Etapa 1 pronta.
- VSL e vídeos: moldura e poster cinza, prontos para receber o arquivo.

O script `scripts/otimizar-midia.sh` (chega na Fase 4) converte tudo para
AVIF/WebP/MP4 nos tamanhos certos e sem metadados EXIF.

---

## Como o scroll funciona (leia antes de mexer nas animações)

Existe **um único ScrollTrigger mestre** (`src/lib/scroll.js`). Ele publica um
número — o **progresso global (0 a 1)** — e cada módulo se inscreve com
`aoProgredir`. Nenhum módulo cria o seu próprio ScrollTrigger de animação.

Isso significa que **toda animação de scroll é função pura do progresso**:
descer avança, subir volta, em tempo real, sem "pulo" e sem estado errado.

- **Celular:** rolagem nativa, sem Lenis. Zero suavização (senão o conteúdo
  parece não seguir o dedo).
- **Desktop:** Lenis ligado + interpolação própria do progresso (inércia de câmera).
- **Movimento reduzido / aparelho fraco:** modo LITE automático (menos frames,
  sem partículas, sem `backdrop-filter`).

### O que é permitido animar fora do scroll
Pulso do WhatsApp, partículas ambientes, aviso "Deslize para baixo" e o play de
vídeo. Todo o resto é progresso.

---

## Ferramentas de verificação (não vão para produção)

Estão em `scripts/` e são ótimas para achar problema visual sem ficar tentando
no celular:

- `scripts/_diag.html` → mede viewport, overflow, opacidade do canvas, posição do
  botão de WhatsApp, erros de JS. Copie para `dist/` e abra
  `/_diag.html?w=390&h=844`.
- `scripts/_captura.html` → carrega o site em um iframe do tamanho exato de um
  aparelho e rola até a fração pedida, para tirar print.
  Ex.: `/_captura.html?w=390&h=844&p=0.32`.
- `scripts/servir.mjs` → servidor estático de `dist/` sem dependências.

O código também deixa rastro de diagnóstico em `<html data-pd-erro>`: se algo
quebrar no ar, abra o inspetor e veja esse atributo.

---

## Estado do projeto

| Fase | Conteúdo | Situação |
|---|---|---|
| **1** | Estrutura, `config.js`, motor de scroll, palco fixo, vidro de TV, fundo da Etapa 1, aviso "Deslize", barra de progresso, WhatsApp, Hero | **concluída** |
| **2** | Carrossel 3D de textos, Etapas 2 e 3 do fundo, seções 2, 4, 5, 6, 7 e 8 | **concluída** |
| **3** | VSL que liga, glebas A–G, vídeos 2×2 com linha de bambu, FAQ, CTA final, rodapé | **concluída** |
| **4** | SEO + dados estruturados, rastreamento com consentimento, LGPD, otimizações, deploy e checklist | **concluída** |

### SEO e dados estruturados
Título, descrição, Open Graph, Twitter Card e canonical vêm do `config.js`. O
JSON-LD é gerado com **Place** (o empreendimento), **FAQPage** (as 10 perguntas
respondidas podem aparecer direto na busca) e **ItemList** (as chácaras sem
preço exato). Preço só entra no dado estruturado se você preencher
`seo.precoAPartir`.

### Rastreamento e consentimento (LGPD)
O **Google Consent Mode v2** é declarado como `denied` **antes** de qualquer tag
existir. Meta Pixel e Google Tag só são injetados depois que a pessoa autoriza a
categoria. O banner tem três botões com o mesmo peso visual — recusar é tão
fácil quanto aceitar — e um link no rodapé reabre as preferências.

> **Sem Pixel/Tag configurados o banner não aparece** — não há o que consentir.
> Para conferir o visual e o funcionamento antes de ter as contas, ligue
> `trackingTeste.ativo = true` no `config.js`: o banner aparece e as tags de
> teste entram só depois do aceite. **Volte para `false` ao publicar.**

### Checklist final

| # | Item | Situação |
|---|---|---|
| 1 | Animação só roda quando o scroll para | ✅ Toda animação de scroll é função do progresso; só pulso do WhatsApp, partículas, aviso "Deslize" e play de vídeo ficam fora |
| 2 | Animação cortada no meio | ✅ Sem timeline, sem `onEnter`: não existe estado para "cortar" |
| 3 | Pulo de tela por barra do navegador | ✅ `svh` em tudo, `ScrollTrigger.config({ ignoreMobileResize: true })` |
| 4 | Lenis sequestrando o toque | ✅ Lenis **desligado** no mobile (`syncTouch: false` e instância nem é criada) |
| 5 | `scroll-behavior: smooth` + Lenis | ✅ Ausente — verificado pela auditoria |
| 6 | Pin/sticky quebrado por overflow ou transform | ✅ Sem `overflow-x: hidden`, sem `contain: paint` no ancestral do palco; auditoria confere |
| 7 | Fundo travando ao voltar | ✅ Tudo reversível por função pura; o palco para de desenhar depois das seções e volta ao subir |
| 8 | Blur/`backdrop-filter` em excesso | ✅ Blur só na entrada do hero e nas pontas do carrossel; `backdrop-filter` só em aparelho forte e nunca animado |
| 9 | Layout shift (CLS) | ✅ `width`/`height` em mídia, `aspect-ratio` em molduras, `content-visibility` **removido** de propósito |
| 10 | Medidas erradas por fontes/imagens tardias | ✅ `ScrollTrigger.refresh()` no `fonts.ready`, no `load` e no resize com debounce |
| 11 | Texto ilegível | ✅ Painel escuro semitransparente em todo conteúdo denso; contraste alto |
| 12 | WhatsApp arrastável disparando clique ou rolando a página | ✅ Limiar de 6 px, `setPointerCapture`, `touch-action: none`, cancelamento explícito do clique após arraste |

### O que só um aparelho real confirma

1. **Fluidez do toque** e a sensação de "seguir o dedo".
2. **Arrastar o botão do WhatsApp** sem rolar a página e sem abrir a conversa.
3. **Barra do navegador aparecendo/sumindo** sem pular a altura.
4. **Desempenho do fundo animado** (o modo LITE entra sozinho em aparelho fraco).
5. **Vídeo da VSL no iPhone** — o iOS exige toque para liberar áudio; o botão dá
   esse toque, mas vale confirmar.

### Mídia que ainda falta (nada disso bloqueia o site)

O site está completo e funcional com **placeholders visíveis**. Para ficar
definitivo, faltam os arquivos — todos entram em `public/media/` e são apontados
no `config.js`:

| Item | Onde preencher | Especificação |
|---|---|---|
| Poster da VSL | `vsl.poster` | AVIF/WebP, 1280×720, até 120 KB |
| Arquivo da VSL | `vsl.fontes.mp4` / `.webm` | MP4 H.264 **faststart**, 1080p, sem áudio pesado. O arquivo atual tem **53 MB** — precisa ser recomprimido |
| 4 posters verticais | `midia.videos[].poster` | AVIF/WebP, 720×1280, até 80 KB |
| 4 vídeos de demonstração | `midia.videos[].src` | MP4 9:16 (720×1280), **sem áudio**, até ~3 MB cada |
| Ortofoto / vista aérea | `midia.ortofoto.pequena` e `.grande` | 1600 px e 3200 px de largura. Enquanto não houver, o site mostra uma **planta esquemática** que ele mesmo desenha |
| Fotos das chácaras | `midia.fotosGlebas` | AVIF/WebP, 1280 px |
| Faixa de valor da Gleba D | `glebas[].faixa` (a de `id: 'D'`) | Aparece hoje como "Faixa de valor a confirmar" |
| Comparativo de preço | `empreendimento.comparativoReal` | Se ficar vazio, a frase comparativa **não aparece** |
| Razão social, CNPJ, CRECI, e-mail | `empreendimento.legal` | Aparecem no rodapé e nas páginas de LGPD (Fase 4) |
| Domínio, imagem OG | `seo.url`, `seo.imagemOg` | Necessário para o SEO da Fase 4 |

O script `scripts/otimizar-midia.sh` (chega na Fase 4) converte tudo de uma vez,
com os tamanhos e formatos certos e sem metadados EXIF.

### Como as três etapas do fundo se ligam ao scroll

O fundo tem três cenas independentes, cada uma em `src/lib/cenas/`:

| Etapa | Cena | Faixa do progresso |
|---|---|---|
| 1 | `chacara.js` — amanhecer, morros, neblina sobre o lago | 0,00 → 0,40 |
| 2 | `floresta.js` — mata, troncos, riacho, raios de luz | 0,38 → 0,72 |
| 3 | `noite.js` — morros, lago e céu estrelado | 0,70 → 1,00 |

As faixas **se sobrepõem de propósito**: é a sobreposição que produz o
crossfade. Para mudar o ritmo, edite `scroll.etapas` no `config.js`.

Cada cena desenha em duas camadas:
- **estática** (céu, morros, mata, água, pedras) → guardada num canvas offline e
  redesenhada **só quando o progresso muda o suficiente**;
- **animada** (partículas, brilhos, névoa, raios) → desenhada a cada quadro.

É isso que permite 60 fps num celular médio: o que é caro quase nunca roda.

### Ferramenta de conferência de uma cena isolada

Se o navegador estrangular o `requestAnimationFrame` (aba em segundo plano,
ambiente automatizado), a cena pode não avançar. Para conferir uma etapa
sozinha, use `?prova=N` na URL (`?prova=1`, `?prova=2`, `?prova=3`).

> **Atenção ao verificar com Chrome headless:** com tempo virtual
> (`--virtual-time-budget`), o headless **não executa** `setTimeout`/`requestAnimationFrame`
> de forma confiável e **congela transições CSS**. Consequência: o canvas do
> palco fica preso no primeiro quadro e semitransparente, e a página parece
> escura. Isso é limitação da ferramenta, não do site. A verificação visual
> boa é no **navegador de verdade**, com `npm run servir`.

Existe também um **fundo de segurança em CSS** no próprio palco: se o canvas
não desenhar (navegador sem canvas 2D, WebView antiga, erro de runtime), a
página mostra um degradê de amanhecer e nunca fica preta.

---

## Contraste e acessibilidade

- Texto (`#F0E9D8`) sobre fundo (`#04191F`): contraste altíssimo.
- Ciano e dourado passam AA sobre o fundo escuro; **nunca** use os dois como
  texto sobre fundo claro.
- Todo texto está no DOM real (SEO e leitores de tela), inclusive o que é animado.
- `prefers-reduced-motion` desliga entrada esfumaçada, pulsos e parallax.
