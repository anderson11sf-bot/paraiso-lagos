/* ============================================================================
 * floresta.js — ETAPA 2 DO FUNDO: CAMINHADA PELA MATA E PELO RIACHO
 * ----------------------------------------------------------------------------
 * Sobe a encosta, entra na mata e chega ao riacho.
 *
 * A CENA, DE TRÁS PARA A FRENTE
 *   1. céu claro visto pelas frestas da copa
 *   2. sol filtrado (halo alto, entre as árvores)
 *   3. três planos de árvores, do mais claro/distante ao mais escuro/próximo
 *   4. terra das duas margens, com o riacho recortado no meio
 *   5. riacho descendo do ponto de fuga em direção à base do quadro
 *   6. pedras e cascalho dentro e fora da água
 *   7. sub-bosque e folhagem emoldurando as laterais
 *
 * NADA DE MAR. A água aqui é RIACHO de água doce e corrente.
 *
 * DIVISÃO DE TRABALHO
 *   estatico(ctx, p, modoLite)          → o que NÃO muda a cada quadro
 *   animado(ctx, p, dt, tempo, modoLite) → faíscas na água, folhas que
 *                                          brilham, névoa e raios de luz
 *
 * As intensidades (neblina, raios, folhagem) vêm do config e são passadas
 * como parâmetro: nada de estado global escondido.
 * ==========================================================================*/

import config from '../../config.js';
import {
  misturarCor, rgb, rgba, pseudo, ceuDegrade, halo, mata, tufosLaterais,
  serra, neblina, raiosDeLuz
} from '../pintura.js';

export const PALETA_FLORESTA = {
  // Céu visto pelas frestas: claro e levemente esverdeado
  ceuAlto: [92, 140, 122],
  ceuBaixo: [196, 208, 158],

  // Luz do sol filtrada pelas folhas
  luzSol: [255, 240, 190],

  // Três planos de árvores
  copaDistante: [56, 104, 92],
  troncoDistante: [30, 66, 58],
  troncoMedio: [18, 48, 44],
  troncoPerto: [8, 28, 26],

  // Folhagem
  folhaDistante: [64, 130, 96],
  folhaMedia: [34, 96, 72],
  folhaPerto: [12, 46, 38],
  folhaBrilho: [150, 226, 178],   // verde que acende com a luz

  // Riacho
  aguaRasa: [118, 158, 140],
  aguaFundo: [24, 62, 64],
  brilhoAgua: [214, 246, 236],

  // Sub-bosque e pedra
  terra: [46, 58, 44],
  pedra: [78, 88, 82],
  pedraMolhada: [46, 60, 58]
};

/**
 * Cria o pintor da Etapa 2.
 * @param {Object} medidas { largura, altura }
 * @returns {Object} API de desenho
 */
export function criarFloresta({ largura, altura }) {
  const C = PALETA_FLORESTA;
  const I = config.fundo.intensidades;

  /* ---------- estado do que anima -------------------------------------- */
  const faiscas = [];
  const folhasLuz = [];
  const bandasNeblina = [];
  let pronto = false;

  function prepararAnimado() {
    if (pronto) return;

    for (let i = 0; i < 46; i++) {
      faiscas.push({
        u: pseudo(i * 2.13) * 2 - 1,          // -1..1: deslocamento lateral
        v: pseudo(i * 6.71),                  // 0..1: posição ao longo do riacho
        vel: 0.05 + pseudo(i * 5.7) * 0.12,
        brilho: pseudo(i * 8.3),
        fase: pseudo(i * 11.1) * Math.PI * 2,
        tamanho: 0.9 + pseudo(i * 3.3) * 1.9
      });
    }

    for (let i = 0; i < 60; i++) {
      folhasLuz.push({
        x: pseudo(i * 1.71) * largura,
        y: altura * (0.12 + pseudo(i * 4.11) * 0.62),
        r: 1.2 + pseudo(i * 6.9) * 3.4,
        fase: pseudo(i * 9.4) * Math.PI * 2,
        vel: 0.5 + pseudo(i * 7.7) * 1.1
      });
    }

    for (let i = 0; i < 4; i++) {
      bandasNeblina.push({
        y: altura * (0.42 + (i / 4) * 0.34),
        h: altura * (0.05 + pseudo(i * 3.9) * 0.07),
        a: 0.05 + pseudo(i * 2.7) * 0.07,
        vel: 5 + pseudo(i * 1.3) * 12,
        x: -largura * pseudo(i * 8.1),
        escala: 0.8 + pseudo(i * 5.5) * 0.7
      });
    }

    pronto = true;
  }

  /* ---------- geometria do riacho ---------------------------------------
   * O riacho nasce no ponto de fuga e se abre em direção à base. A MESMA
   * função posiciona o desenho e as faíscas — é isso que faz cada brilho cair
   * exatamente dentro da água.
   * -------------------------------------------------------------------- */
  const topoRiacho = 0.52;

  function faixaRiacho(v) {
    const k = v < 0 ? 0 : v > 1 ? 1 : v;
    const y = altura * (topoRiacho + (1 - topoRiacho) * Math.pow(k, 0.86));
    const meiaLargura = largura * (0.012 + Math.pow(k, 1.25) * 0.30);
    const centroX = largura * (0.53 - k * 0.06);
    return { y, centroX, meiaLargura };
  }

  /* ---------- CAMADA ESTÁTICA ------------------------------------------ */

  function estatico(ctx, p, modoLite) {
    prepararAnimado();
    const e = p; // 0 = entrando na mata · 1 = já no riacho

    /* --- 1. Céu pelas frestas ---------------------------------------- */
    ceuDegrade(ctx, largura, altura * 0.8, [
      [0.00, misturarCor(C.ceuAlto, C.ceuBaixo, e * 0.45)],
      [0.62, C.ceuBaixo],
      [1.00, misturarCor(C.ceuBaixo, C.luzSol, 0.35)]
    ]);

    /* --- 2. Sol filtrado --------------------------------------------- */
    const solX = largura * (0.30 + e * 0.10);
    const solY = altura * (0.14 + e * 0.05);
    halo(ctx, solX, solY, Math.min(largura, altura) * 0.62,
      C.luzSol, C.luzSol, 0.30 + e * 0.16);

    /* --- 3. Três planos de árvores ----------------------------------- */
    desenharCopas(ctx, {
      yTopo: altura * 0.02, cor: misturarCor(C.copaDistante, C.luzSol, e * 0.22),
      alpha: 0.55, quantas: 14, alturaCopa: altura * 0.30, semente: 3
    });

    // Serra distante ao fundo: dá um "lá fora" para a mata
    serra(ctx, {
      largura, altura, yBase: altura * 0.62, alturaSerra: altura * 0.16,
      cor: misturarCor(C.troncoDistante, C.folhaDistante, 0.5),
      corLuz: C.luzSol, tLuz: e * 0.2, alpha: 0.7, freq: 3.2, passos: 14, semente: 7
    });

    desenharTroncos(ctx, {
      cor: C.troncoDistante, alpha: 0.8, quantos: 9, yBase: altura * 0.72,
      larguraTronco: largura * 0.022, semente: 11, alturaTronco: altura * 0.52
    });

    desenharCopas(ctx, {
      yTopo: altura * 0.06, cor: misturarCor(C.folhaDistante, C.luzSol, e * 0.14),
      alpha: 0.7, quantas: 10, alturaCopa: altura * 0.26, semente: 17
    });

    desenharTroncos(ctx, {
      cor: C.troncoMedio, alpha: 0.94, quantos: 4, yBase: altura * 0.86,
      larguraTronco: largura * 0.05, semente: 23, alturaTronco: altura * 0.95,
      apenasLaterais: true
    });

    /* --- 4. Terra das margens ---------------------------------------- */
    desenharMargensTerra(ctx, e);

    /* --- 5. Riacho --------------------------------------------------- */
    desenharRiacho(ctx, e);

    /* --- 6. Pedras e cascalho ---------------------------------------- */
    desenharPedras(ctx, e);

    /* --- 7. Sub-bosque e folhagem emoldurando ------------------------ */
    mata(ctx, {
      largura, altura, yBase: altura * 0.995,
      cor: misturarCor(C.folhaPerto, C.luzSol, e * 0.10),
      alpha: 0.9, alturaTufo: altura * 0.035, tufos: 54, semente: 31, espalhamento: 8
    });

    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.folhaMedia, C.luzSol, e * 0.12),
      alpha: 0.5, quantos: 6, baseRel: 0.72, alturaRel: 0.16, semente: 41
    });
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.folhaMedia, C.luzSol, e * 0.12),
      alpha: 0.5, quantos: 6, baseRel: 0.72, alturaRel: 0.16, semente: 41, espelhado: true
    });
    tufosLaterais(ctx, {
      largura, altura, cor: C.folhaPerto,
      alpha: 0.72, quantos: 5, baseRel: 0.94, alturaRel: 0.20, semente: 53
    });
    tufosLaterais(ctx, {
      largura, altura, cor: C.folhaPerto,
      alpha: 0.72, quantos: 5, baseRel: 0.94, alturaRel: 0.20, semente: 53, espelhado: true
    });

    // Em modo LITE as samambaias (muitos traços finos) ficam de fora.
    if (!modoLite) desenharSamambaias(ctx, e);
  }

  /** Copas: bolhas grandes e sobrepostas ocupando o topo do quadro. */
  function desenharCopas(ctx, { yTopo, cor, alpha, quantas, alturaCopa, semente }) {
    ctx.save();
    ctx.fillStyle = rgba(cor, alpha);
    for (let i = 0; i < quantas; i++) {
      const t = (i + 0.5) / quantas;
      const x = t * largura + (pseudo(i * 3.3 + semente) - 0.5) * largura * 0.08;
      const h = alturaCopa * (0.6 + pseudo(i * 5.1 + semente) * 0.8);
      const w = h * (1.5 + pseudo(i * 7.9 + semente) * 0.9);
      const y = yTopo + h * 0.28 + pseudo(i * 2.7 + semente) * altura * 0.05;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Troncos: retos, com leve inclinação e afunilamento para o topo. */
  function desenharTroncos(ctx, opcoes) {
    const {
      cor, alpha, quantos, yBase, larguraTronco, semente,
      alturaTronco, apenasLaterais = false
    } = opcoes;

    ctx.save();
    ctx.fillStyle = rgba(cor, alpha);
    for (let i = 0; i < quantos; i++) {
      let x;
      if (apenasLaterais) {
        // Só as bordas: são elas que emolduram o quadro
        x = i % 2 === 0
          ? largura * (0.02 + pseudo(i + semente) * 0.10)
          : largura * (0.88 + pseudo(i + semente) * 0.10);
      } else {
        const t = (i + 0.5) / quantos;
        x = largura * (0.04 + t * 0.92);
      }

      const h = alturaTronco * (0.7 + pseudo(i * 4.3 + semente) * 0.6);
      const wBase = larguraTronco * (0.7 + pseudo(i * 6.1 + semente) * 0.8);
      const inclinacao = (pseudo(i * 8.7 + semente) - 0.5) * largura * 0.03;
      const topo = yBase - h;

      ctx.beginPath();
      ctx.moveTo(x - wBase * 0.5, yBase);
      ctx.quadraticCurveTo(
        x + inclinacao * 0.4 - wBase * 0.34, (yBase + topo) * 0.5,
        x + inclinacao - wBase * 0.20, topo
      );
      ctx.lineTo(x + inclinacao + wBase * 0.20, topo);
      ctx.quadraticCurveTo(
        x + inclinacao * 0.4 + wBase * 0.34, (yBase + topo) * 0.5,
        x + wBase * 0.5, yBase
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** As duas margens de terra, deixando o vão do riacho livre. */
  function desenharMargensTerra(ctx, e) {
    const cor = misturarCor(C.terra, C.luzSol, e * 0.12);
    ctx.save();
    ctx.fillStyle = rgba(cor, 0.96);

    // Margem esquerda
    ctx.beginPath();
    ctx.moveTo(0, altura * 0.66);
    for (let i = 0; i <= 10; i++) {
      const { y, centroX, meiaLargura } = faixaRiacho(i / 10);
      ctx.lineTo(centroX - meiaLargura * 1.18, y);
    }
    ctx.lineTo(0, altura);
    ctx.closePath();
    ctx.fill();

    // Margem direita
    ctx.beginPath();
    ctx.moveTo(largura, altura * 0.66);
    for (let i = 0; i <= 10; i++) {
      const { y, centroX, meiaLargura } = faixaRiacho(i / 10);
      ctx.lineTo(centroX + meiaLargura * 1.18, y);
    }
    ctx.lineTo(largura, altura);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /** A água do riacho, com cascalho visível no fundo. */
  function desenharRiacho(ctx, e) {
    const passo = 0.06;
    ctx.save();

    ctx.beginPath();
    for (let v = 0; v <= 1.0001; v += passo) {
      const { y, centroX, meiaLargura } = faixaRiacho(v);
      if (v === 0) ctx.moveTo(centroX - meiaLargura, y);
      else ctx.lineTo(centroX - meiaLargura, y);
    }
    for (let v = 1; v >= -0.0001; v -= passo) {
      const { y, centroX, meiaLargura } = faixaRiacho(v);
      ctx.lineTo(centroX + meiaLargura, y);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(0, altura * topoRiacho, 0, altura);
    g.addColorStop(0.00, rgb(misturarCor(C.aguaFundo, C.luzSol, e * 0.30)));
    g.addColorStop(0.35, rgb(misturarCor(C.aguaFundo, C.aguaRasa, 0.35 + e * 0.25)));
    g.addColorStop(1.00, rgb(misturarCor(C.aguaRasa, C.brilhoAgua, e * 0.25)));
    ctx.fillStyle = g;
    ctx.fill();

    // Cascalho e pedras dentro da água (recortado pela forma do riacho)
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 90; i++) {
      const v = pseudo(i * 1.91);
      const { y, centroX, meiaLargura } = faixaRiacho(Math.pow(v, 0.8));
      const x = centroX + (pseudo(i * 3.77) * 2 - 1) * meiaLargura * 0.88;
      const r = (0.8 + pseudo(i * 5.19) * 2.6) * (0.4 + v * 1.4);
      const clara = pseudo(i * 7.31) > 0.55;
      ctx.fillStyle = rgba(clara ? C.pedra : C.pedraMolhada, 0.30 + pseudo(i * 9.1) * 0.35);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.5, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Pedras grandes nas margens, quebrando a linha reta da terra. */
  function desenharPedras(ctx, e) {
    ctx.save();
    const cor = misturarCor(C.pedra, C.luzSol, e * 0.16);
    for (let i = 0; i < 16; i++) {
      const v = 0.18 + pseudo(i * 2.9) * 0.78;
      const { y, centroX, meiaLargura } = faixaRiacho(v);
      const lado = pseudo(i * 6.3) > 0.5 ? 1 : -1;
      const x = centroX + lado * meiaLargura * (1.15 + pseudo(i * 4.7) * 0.5);
      const r = (4 + pseudo(i * 8.9) * 13) * (0.5 + v);
      ctx.fillStyle = rgba(cor, 0.55 + pseudo(i * 3.1) * 0.35);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.25, r * 0.72, (pseudo(i * 5.5) - 0.5) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Samambaias: leques de traços finos nas margens (só fora do modo LITE). */
  function desenharSamambaias(ctx, e) {
    ctx.save();
    ctx.strokeStyle = rgba(misturarCor(C.folhaMedia, C.folhaBrilho, 0.25 + e * 0.2), 0.45);
    ctx.lineWidth = 1;
    for (let i = 0; i < 22; i++) {
      const v = 0.25 + pseudo(i * 3.13) * 0.7;
      const { y, centroX, meiaLargura } = faixaRiacho(v);
      const lado = i % 2 === 0 ? 1 : -1;
      const x = centroX + lado * meiaLargura * (1.28 + pseudo(i * 7.7) * 0.5);
      const comprimento = (10 + pseudo(i * 4.9) * 26) * (0.4 + v * 1.1);
      const abertura = 0.5 + pseudo(i * 6.1) * 0.6;
      for (let k = -3; k <= 3; k++) {
        const ang = -Math.PI / 2 + (k / 3) * abertura * lado * -1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * comprimento, y + Math.sin(ang) * comprimento);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---------- CAMADA ANIMADA ------------------------------------------ */

  function animado(ctx, p, dt, tempo, modoLite) {
    const e = p;

    /* --- Faíscas na correnteza --------------------------------------- */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of faiscas) {
      f.v += dt * f.vel * (0.6 + e * 0.8);   // a água corre mais ao chegar perto
      f.fase += dt * (1.4 + f.brilho);
      if (f.v > 1) f.v -= 1;

      const { y, centroX, meiaLargura } = faixaRiacho(f.v);
      const x = centroX + f.u * meiaLargura * 0.8;
      const brilho = 0.25 + (Math.sin(f.fase) * 0.5 + 0.5) * 0.75;
      const a = brilho * (0.16 + e * 0.22) * (0.4 + f.v * 0.9);
      if (a <= 0.004) continue;
      const r = f.tamanho * (1.6 + f.v * 3.4);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(C.brilhoAgua, a));
      g.addColorStop(0.5, rgba(C.brilhoAgua, a * 0.3));
      g.addColorStop(1, rgba(C.brilhoAgua, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* --- Folhas que acendem com a luz -------------------------------- */
    if (!modoLite && I.folhagemLuminosa > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const f of folhasLuz) {
        f.fase += dt * f.vel;
        const brilho = Math.sin(f.fase) * 0.5 + 0.5;
        const a = brilho * I.folhagemLuminosa * (0.10 + e * 0.16);
        if (a <= 0.004) continue;
        ctx.fillStyle = rgba(C.folhaBrilho, a);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.r * 1.5, f.r * 0.7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* --- Névoa entre os troncos -------------------------------------- */
    const forcaNevoa = I.neblina * 0.55;
    if (forcaNevoa > 0.002) {
      for (const b of bandasNeblina) {
        b.x -= b.vel * dt * 0.05;
        if (b.x < -largura) b.x = 0;
      }
      neblina(ctx, {
        largura, altura, cor: C.brilhoAgua, forca: forcaNevoa, bandas: bandasNeblina
      });
    }

    /* --- Raios de luz respirando ------------------------------------- */
    if (I.raiosDeLuz > 0.002) {
      const respira = 0.72 + Math.sin(tempo * 0.22) * 0.28;
      raiosDeLuz(ctx, {
        largura, altura, cor: C.luzSol,
        forca: I.raiosDeLuz * respira * (0.55 + e * 0.6),
        quantos: modoLite ? 4 : 7, semente: 61
      });
    }
  }

  return { estatico, animado, prepararAnimado };
}
