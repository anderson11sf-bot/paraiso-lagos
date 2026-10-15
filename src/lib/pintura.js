/* ============================================================================
 * pintura.js — FERRAMENTAS DE PINTURA COMPARTILHADAS
 * ----------------------------------------------------------------------------
 * Tudo o que as três etapas de fundo (chácara, floresta, noite) têm em comum:
 * mistura de cor, gradientes, perfis de serra, matas, lagos, névoa, feixes de
 * luz, estrelas e névoa baixa.
 *
 * Por que compartilhar: garante que a mesma cena pareça do MESMO lugar nas três
 * etapas. Mudando um perfil de morro aqui, ele muda (igual) nas três.
 *
 * Nenhuma função aqui lê layout ou chama requestAnimationFrame: são funções
 * puras de desenho, recebem o contexto e as medidas prontas.
 * ==========================================================================*/

/* ---------- Cor --------------------------------------------------------- */

/** Mistura duas cores RGB par-a-par. t é limitado a 0..1. */
export function misturarCor(a, b, t) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k)
  ];
}

export const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

export const rgba = (c, a) => {
  const k = a < 0 ? 0 : a > 1 ? 1 : a;
  return `rgba(${c[0]},${c[1]},${c[2]},${k.toFixed(3)})`;
};

/** Ruído determinístico: mesma semente devolve sempre o mesmo valor (0..1). */
export function pseudo(semente) {
  const x = Math.sin(semente * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ---------- Céu --------------------------------------------------------- */

/**
 * Preenche o céu com um degradê vertical de duas paradas de cor.
 * @param {string[]} paradas [[posição 0..1, cor], ...] em ordem crescente
 */
export function ceuDegrade(c, largura, alturaAte, paradas) {
  const g = c.createLinearGradient(0, 0, 0, alturaAte);
  for (const [pos, cor] of paradas) g.addColorStop(pos, rgb(cor));
  c.fillStyle = g;
  c.fillRect(0, 0, largura, alturaAte);
}

/** Halo radial suave (sol, lua, brilho). */
export function halo(c, x, y, raio, corNucleo, corHalo, alfa) {
  if (alfa <= 0.002) return;
  const g = c.createRadialGradient(x, y, 0, x, y, raio);
  g.addColorStop(0.00, rgba(corNucleo, alfa * 0.62));
  g.addColorStop(0.24, rgba(corHalo, alfa * 0.30));
  g.addColorStop(0.60, rgba(corHalo, alfa * 0.09));
  g.addColorStop(1.00, rgba(corHalo, 0));
  c.fillStyle = g;
  c.fillRect(x - raio, y - raio, raio * 2, raio * 2);
}

/* ---------- Terreno ----------------------------------------------------- */

/**
 * Perfil de serra/morro: soma de senos defasados + ruído.
 * Desenhado como silhueta fechada até a base do quadro.
 */
export function serra(c, opcoes) {
  const {
    largura, altura, yBase, alturaSerra, cor, corLuz, tLuz,
    alpha = 1, freq = 3, passos = 18, desloc = 0, semente = 0
  } = opcoes;

  const corFinal = corLuz ? misturarCor(cor, corLuz, tLuz || 0) : cor;

  c.save();
  c.beginPath();
  c.moveTo(-10, altura);
  c.lineTo(-10, yBase);
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = -10 + t * (largura + 20);
    const onda =
      Math.sin(t * freq * Math.PI + desloc) * 0.56 +
      Math.cos(t * freq * 1.7 * Math.PI + desloc * 0.5) * 0.30 +
      Math.sin(t * freq * 0.6 * Math.PI) * 0.14 +
      (pseudo(i * 3.7 + semente) - 0.5) * 0.16;
    const y = yBase - alturaSerra * (0.45 + onda * 0.55);
    c.lineTo(x, y);
  }
  c.lineTo(largura + 10, yBase);
  c.lineTo(largura + 10, altura);
  c.closePath();

  const g = c.createLinearGradient(0, yBase - alturaSerra, 0, yBase + alturaSerra * 0.6);
  g.addColorStop(0.00, rgba(corFinal, alpha * 0.55));
  g.addColorStop(0.55, rgba(corFinal, alpha));
  g.addColorStop(1.00, rgba(corFinal, alpha * 0.92));
  c.fillStyle = g;
  c.fill();
  c.restore();
}

/**
 * Faixa de mata: tufos irregulares encostados numa linha de base.
 * É a mesma linguagem visual usada em todas as etapas (nunca palmeira,
 * nunca árvore em forma de triângulo).
 */
export function mata(c, opcoes) {
  const {
    largura, altura, yBase, cor, corLuz, tLuz, alpha = 0.92,
    alturaTufo = 16, tufos = 46, semente = 0, espalhamento = 0
  } = opcoes;

  const corFinal = corLuz ? misturarCor(cor, corLuz, tLuz || 0) : cor;
  c.save();
  c.fillStyle = rgba(corFinal, alpha);
  c.beginPath();
  c.moveTo(0, yBase + 2);
  for (let i = 0; i <= tufos; i++) {
    const t = i / tufos;
    const x = t * largura;
    const h = alturaTufo * (0.35 + pseudo(i * 3.7 + semente) * 1.2)
            + Math.sin(t * 12 + semente) * alturaTufo * 0.2
            + (espalhamento ? (pseudo(i * 8.1 + semente) - 0.5) * espalhamento : 0);
    c.lineTo(x, yBase - h);
  }
  c.lineTo(largura, yBase + 2);
  c.closePath();
  c.fill();
  c.restore();
}

/**
 * Massa de folhagem em tufos: arbustos de arcos sobrepostos, encostados na
 * borda. Usado para emoldurar as laterais em todas as etapas.
 */
export function tufosLaterais(c, opcoes) {
  const {
    largura, altura, cor, alpha, quantos = 6, baseRel = 0.62,
    alturaRel = 0.12, extensaoRel = 0.17, semente = 0, espelhado = false
  } = opcoes;

  c.save();
  c.translate(espelhado ? largura : 0, 0);
  if (espelhado) c.scale(-1, 1);

  const base = altura * baseRel;
  c.fillStyle = rgba(cor, alpha);

  for (let i = 0; i < quantos; i++) {
    const t = (i + 0.5) / quantos;
    const x = t * largura * extensaoRel;
    const escala = (0.5 + pseudo(i * 5.7 + semente) * 0.8) * (1 - t * 0.62);
    const alturaArb = altura * alturaRel * escala;
    const larguraArb = alturaArb * 0.72;
    const y = base + t * altura * 0.26 + pseudo(i * 9.1 + semente) * altura * 0.03;

    for (let k = 0; k < 3; k++) {
      const desloc = (k - 1) * larguraArb * 0.32;
      const raio = larguraArb * (0.62 - Math.abs(k - 1) * 0.14);
      const h = alturaArb * (1 - Math.abs(k - 1) * 0.22);
      c.beginPath();
      c.ellipse(x + desloc, y - h * 0.34, raio, h * 0.62, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.ellipse(x, y - alturaArb * 0.18, larguraArb * 0.5, alturaArb * 0.34, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/* ---------- Água -------------------------------------------------------- */

/**
 * Lago: degradê de profundidade + mancha de luz refletida.
 * As bordas da luz são curvas (Bézier) de propósito — nada de holofote
 * triangular, que denuncia o desenho.
 */
export function lago(c, opcoes) {
  const {
    largura, altura, topo, corPerto, corFundo, corLuz, tLuz = 0,
    luzX = largura * 0.6, luzForca = 0.16
  } = opcoes;

  const g = c.createLinearGradient(0, topo, 0, altura);
  g.addColorStop(0.00, rgb(misturarCor(corPerto, corLuz, tLuz * 0.35)));
  g.addColorStop(0.32, rgb(corPerto));
  g.addColorStop(1.00, rgb(corFundo));
  c.fillStyle = g;
  c.fillRect(0, topo, largura, altura - topo);

  if (luzForca > 0.002) {
    const alturaAgua = altura - topo;
    const larguraTopo = largura * 0.035;
    const larguraBase = largura * 0.16;
    const grad = c.createLinearGradient(0, topo, 0, altura);
    grad.addColorStop(0.00, rgba(corLuz, luzForca * 1.0));
    grad.addColorStop(0.25, rgba(corLuz, luzForca * 0.68));
    grad.addColorStop(0.55, rgba(corLuz, luzForca * 0.36));
    grad.addColorStop(0.80, rgba(corLuz, luzForca * 0.15));
    grad.addColorStop(1.00, rgba(corLuz, 0));

    c.save();
    c.beginPath();
    c.moveTo(luzX - larguraTopo, topo);
    c.bezierCurveTo(
      luzX - larguraTopo * 1.6, topo + alturaAgua * 0.35,
      luzX - larguraBase * 0.85, topo + alturaAgua * 0.7,
      luzX - larguraBase, altura
    );
    c.lineTo(luzX + larguraBase, altura);
    c.bezierCurveTo(
      luzX + larguraBase * 0.85, topo + alturaAgua * 0.7,
      luzX + larguraTopo * 1.6, topo + alturaAgua * 0.35,
      luzX + larguraTopo, topo
    );
    c.closePath();
    c.fillStyle = grad;
    c.fill();
    c.restore();
  }
}

/* ---------- Atmosfera -------------------------------------------------- */

/** Feixes de luz atravessando a copa (Etapa 2). */
export function raiosDeLuz(c, opcoes) {
  const { largura, altura, cor, forca, quantos = 7, semente = 0, inclinacao = 0.35 } = opcoes;
  if (forca <= 0.002) return;

  c.save();
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < quantos; i++) {
    const t = (i + 0.5) / quantos;
    const xTopo = largura * (0.08 + t * 0.84) + (pseudo(i * 7.7 + semente) - 0.5) * largura * 0.06;
    const larguraRaio = largura * (0.025 + pseudo(i * 3.1 + semente) * 0.05);
    const fim = altura * (0.35 + pseudo(i * 5.3 + semente) * 0.45);
    const deslocBase = fim * inclinacao;

    const g = c.createLinearGradient(xTopo, 0, xTopo + deslocBase, fim);
    g.addColorStop(0.00, rgba(cor, forca * 0.30));
    g.addColorStop(0.45, rgba(cor, forca * 0.16));
    g.addColorStop(1.00, rgba(cor, 0));
    c.fillStyle = g;

    c.beginPath();
    c.moveTo(xTopo - larguraRaio * 0.35, 0);
    c.lineTo(xTopo + larguraRaio * 0.35, 0);
    c.lineTo(xTopo + deslocBase + larguraRaio, fim);
    c.lineTo(xTopo + deslocBase - larguraRaio, fim);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** Névoa baixa: bandas com gradiente vertical (nunca blur). */
export function neblina(c, opcoes) {
  const { largura, altura, cor, forca, bandas } = opcoes;
  if (forca <= 0.002 || !bandas || !bandas.length) return;

  c.save();
  c.globalCompositeOperation = 'screen';
  for (const b of bandas) {
    // Mais densa perto da linha da água; quase nada no alto (não suja o texto)
    const peso = (b.y / altura) < 0.45 ? 0.35 : 1;
    const alfa = b.a * forca * peso;
    if (alfa <= 0.002) continue;
    const w = largura * 1.25 * b.escala;
    const g = c.createLinearGradient(0, b.y - b.h, 0, b.y + b.h);
    g.addColorStop(0.00, rgba(cor, 0));
    g.addColorStop(0.45, rgba(cor, alfa));
    g.addColorStop(1.00, rgba(cor, 0));
    c.fillStyle = g;
    c.fillRect(b.x, b.y - b.h, w, b.h * 2);
  }
  c.restore();
}

/** Campo de estrelas determinístico (Etapa 3). */
export function estrelas(c, opcoes) {
  const { largura, altura, ateY, cor, corQuente, forca, quantas, semente = 0 } = opcoes;
  if (forca <= 0.002) return;

  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < quantas; i++) {
    const x = pseudo(i * 1.37 + semente) * largura;
    const y = pseudo(i * 2.71 + semente * 1.3) * ateY;
    const brilho = pseudo(i * 4.19 + semente * 0.7);
    // As estrelas rareiam perto do horizonte (mais ar no caminho)
    const peso = 1 - (y / ateY) * 0.55;
    const a = forca * brilho * 0.85 * peso;
    if (a <= 0.01) continue;
    const r = 0.5 + brilho * 1.5;
    const quente = pseudo(i * 9.13) > 0.78;
    c.fillStyle = rgba(quente ? corQuente : cor, a);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    // Algumas estrelas ganham um halo pequeno
    if (brilho > 0.93) {
      c.fillStyle = rgba(cor, a * 0.22);
      c.beginPath();
      c.arc(x, y, r * 5, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/**
 * Faz uma linha do horizonte sumir num fio de bruma.
 * Sem isso, a emenda entre morro e lago vira uma linha dura e artificial.
 */
export function brumaHorizonte(c, opcoes) {
  const { largura, y, espessura, cor, alfa } = opcoes;
  const g = c.createLinearGradient(0, y - espessura, 0, y + espessura);
  g.addColorStop(0.00, rgba(cor, 0));
  g.addColorStop(0.50, rgba(cor, alfa));
  g.addColorStop(1.00, rgba(cor, 0));
  c.save();
  c.globalCompositeOperation = 'screen';
  c.fillStyle = g;
  c.fillRect(0, y - espessura, largura, espessura * 2);
  c.restore();
}
