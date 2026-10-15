/* ============================================================================
 * noite.js — ETAPA 3 DO FUNDO: MORROS, LAGO E CÉU ESTRELADO
 * ----------------------------------------------------------------------------
 * A chegada. O céu abre, as estrelas aparecem sobre os morros e a luz da lua
 * deita no lago. É a cena mais calma das três — de propósito: é o momento em
 * que o visitante já entendeu a proposta.
 *
 * A CENA, DE TRÁS PARA A FRENTE
 *   1. céu noturno (azul-petróleo profundo) com transição para o entardecer
 *   2. campo de estrelas + lua com halo
 *   3. três camadas de morros
 *   4. lago com reflexo da lua e brilhos na superfície
 *   5. mata da margem e tufos emoldurando
 *   6. vaga-lumes sobre a água
 *
 * NADA DE MAR. É lago de chácara: superfície calma, brilho parado.
 * ==========================================================================*/

import config from '../../config.js';
import {
  misturarCor, rgba, pseudo, ceuDegrade, halo, serra, mata, tufosLaterais,
  lago, neblina, brumaHorizonte, estrelas
} from '../pintura.js';

export const PALETA_NOITE = {
  ceuAlto: [7, 22, 42],          // azul-petróleo da noite fechada
  ceuMedio: [14, 44, 60],
  ceuBaixo: [28, 72, 78],        // entardecer esverdeado no horizonte

  lua: [232, 240, 226],
  luaHalo: [186, 220, 214],
  estrela: [214, 244, 246],
  estrelaQuente: [248, 232, 196],

  morroLonge: [20, 52, 62],
  morroMedio: [13, 40, 50],
  morroPerto: [7, 26, 34],

  lagoPerto: [26, 70, 76],
  lagoFundo: [7, 24, 34],
  brilhoLua: [196, 236, 230],

  mataPerto: [7, 24, 26],
  mataLonge: [16, 44, 46],

  vagalume: [186, 250, 210]
};

export function criarNoite({ largura, altura }) {
  const C = PALETA_NOITE;
  const I = config.fundo.intensidades;

  /* ---------- estado do que anima -------------------------------------- */
  const brilhosAgua = [];
  const vagalumes = [];
  const bandasNeblina = [];
  let pronto = false;

  const horizonte = 0.60;   // linha do lago, em fração da altura

  function prepararAnimado() {
    if (pronto) return;

    // Brilhos na superfície: faixas curtas que cintilam e deslizam de leve
    for (let i = 0; i < 34; i++) {
      brilhosAgua.push({
        u: pseudo(i * 2.77) * 2 - 1,
        v: Math.pow(pseudo(i * 5.13), 0.7),
        larguraRel: 0.05 + pseudo(i * 7.31) * 0.22,
        fase: pseudo(i * 9.17) * Math.PI * 2,
        vel: 0.4 + pseudo(i * 3.41) * 0.9,
        forca: 0.35 + pseudo(i * 4.83) * 0.65
      });
    }

    // Vaga-lumes: só sobre a água e a margem, nunca sobre o texto
    for (let i = 0; i < 40; i++) {
      vagalumes.push({
        x: pseudo(i * 1.31) * largura,
        y: altura * (0.58 + pseudo(i * 3.19) * 0.38),
        z: 0.35 + pseudo(i * 6.73) * 0.65,
        r: 0.9 + pseudo(i * 8.11) * 1.9,
        fase: pseudo(i * 2.93) * Math.PI * 2,
        vel: 0.4 + pseudo(i * 5.57) * 1.2,
        deriva: pseudo(i * 7.77) * Math.PI * 2
      });
    }

    for (let i = 0; i < 4; i++) {
      bandasNeblina.push({
        y: altura * (0.56 + (i / 4) * 0.30),
        h: altura * (0.04 + pseudo(i * 4.41) * 0.06),
        a: 0.045 + pseudo(i * 6.29) * 0.06,
        vel: 4 + pseudo(i * 1.77) * 9,
        x: -largura * pseudo(i * 8.53),
        escala: 0.85 + pseudo(i * 3.13) * 0.6
      });
    }

    pronto = true;
  }

  /* ---------- CAMADA ESTÁTICA ------------------------------------------ */

  function estatico(ctx, p, modoLite) {
    prepararAnimado();
    const e = p; // 0 = anoitecer chegando · 1 = noite plena e serena

    /* --- 1. Céu ------------------------------------------------------ */
    ceuDegrade(ctx, largura, altura * 0.74, [
      [0.00, misturarCor(C.ceuAlto, [4, 14, 30], e * 0.35)],
      [0.52, misturarCor(C.ceuMedio, C.ceuAlto, e * 0.30)],
      [1.00, misturarCor(C.ceuBaixo, C.luaHalo, 0.10 + e * 0.10)]
    ]);

    /* --- 2. Estrelas (base) ------------------------------------------ */
    // A camada animada acrescenta a cintilância; aqui fica a "poeira" fixa.
    estrelas(ctx, {
      largura, altura, ateY: altura * horizonte * 0.95,
      cor: C.estrela, corQuente: C.estrelaQuente,
      forca: I.estrelas * (0.35 + e * 0.65),
      quantas: modoLite ? 90 : 190, semente: 5
    });

    /* --- 3. Lua ------------------------------------------------------ */
    const luaX = largura * 0.70;
    const luaY = altura * (0.28 - e * 0.06);
    halo(ctx, luaX, luaY, Math.min(largura, altura) * 0.55,
      C.lua, C.luaHalo, 0.34 + e * 0.12);
    ctx.save();
    ctx.fillStyle = rgba(C.lua, 0.92);
    ctx.beginPath();
    ctx.arc(luaX, luaY, Math.min(largura, altura) * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* --- 4. Morros em três camadas ----------------------------------- */
    serra(ctx, {
      largura, altura, yBase: altura * (horizonte - 0.045), alturaSerra: altura * 0.13,
      cor: C.morroLonge, corLuz: C.luaHalo, tLuz: e * 0.16,
      alpha: 0.9, freq: 3.1, passos: 16, desloc: 0.6, semente: 13
    });
    serra(ctx, {
      largura, altura, yBase: altura * (horizonte - 0.008), alturaSerra: altura * 0.11,
      cor: C.morroMedio, corLuz: C.luaHalo, tLuz: e * 0.12,
      alpha: 0.95, freq: 2.2, passos: 18, desloc: 2.1, semente: 29
    });
    serra(ctx, {
      largura, altura, yBase: altura * (horizonte + 0.012), alturaSerra: altura * 0.075,
      cor: C.morroPerto, alpha: 1, freq: 1.6, passos: 12, desloc: 4.4, semente: 47
    });

    // Fio de bruma na linha do horizonte: evita a emenda dura entre morro e água
    brumaHorizonte(ctx, {
      largura, y: altura * horizonte, espessura: altura * 0.030,
      cor: C.luaHalo, alfa: 0.10 + e * 0.06
    });

    /* --- 5. Lago ----------------------------------------------------- */
    lago(ctx, {
      largura, altura, topo: altura * horizonte,
      corPerto: misturarCor(C.lagoPerto, C.luaHalo, e * 0.10),
      corFundo: C.lagoFundo,
      corLuz: C.brilhoLua,
      tLuz: e,
      luzX: luaX,
      luzForca: 0.10 + e * 0.10
    });

    /* --- 6. Mata da margem e emolduramento --------------------------- */
    mata(ctx, {
      largura, altura, yBase: altura * (horizonte + 0.004),
      cor: C.mataPerto, alpha: 0.85,
      alturaTufo: altura * 0.022, tufos: 48, semente: 67, espalhamento: 6
    });

    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataLonge, C.luaHalo, e * 0.10),
      alpha: 0.42, quantos: 6, baseRel: 0.68, alturaRel: 0.10, semente: 71
    });
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataLonge, C.luaHalo, e * 0.10),
      alpha: 0.42, quantos: 6, baseRel: 0.68, alturaRel: 0.10, semente: 71, espelhado: true
    });
    tufosLaterais(ctx, {
      largura, altura, cor: C.mataPerto,
      alpha: 0.62, quantos: 5, baseRel: 0.93, alturaRel: 0.16, semente: 83
    });
    tufosLaterais(ctx, {
      largura, altura, cor: C.mataPerto,
      alpha: 0.62, quantos: 5, baseRel: 0.93, alturaRel: 0.16, semente: 83, espelhado: true
    });
  }

  /* ---------- CAMADA ANIMADA ------------------------------------------ */

  function animado(ctx, p, dt, tempo, modoLite) {
    const e = p;
    const topoAgua = altura * horizonte;

    /* --- Brilhos na superfície do lago ------------------------------- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topoAgua, largura, altura - topoAgua);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';

    for (const b of brilhosAgua) {
      b.fase += dt * b.vel;
      const cintila = Math.sin(b.fase) * 0.5 + 0.5;
      const y = topoAgua + b.v * (altura - topoAgua);
      const w = largura * b.larguraRel;
      // Deslizamento lateral lento: a água "respira", não tem onda de mar
      const desloc = Math.sin(tempo * 0.25 * b.vel + b.fase * 0.3) * largura * 0.008;
      const x = largura * 0.70 - w * 0.5 + b.u * largura * 0.16 + desloc;
      const a = b.forca * cintila * (0.05 + e * 0.10) * (1 - b.v * 0.5);
      if (a <= 0.003) continue;

      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, rgba(C.brilhoLua, 0));
      g.addColorStop(0.5, rgba(C.brilhoLua, a));
      g.addColorStop(1, rgba(C.brilhoLua, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, Math.max(1, 1.4 * (1 - b.v * 0.35)));
    }
    ctx.restore();

    /* --- Vaga-lumes sobre a água ------------------------------------- */
    if (!modoLite && I.vagalumesChacara > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const v of vagalumes) {
        v.fase += dt * v.vel;
        v.deriva += dt * 0.35 * v.z;

        const x = v.x + Math.sin(v.deriva) * 16 * v.z;
        const y = v.y - (v.deriva * 6 * v.z) % (altura * 0.24);

        const cintila = Math.sin(v.fase) * 0.5 + 0.5;
        const a = cintila * I.vagalumesChacara * 0.34 * (0.35 + v.z * 0.65);
        if (a <= 0.004) continue;

        const r = v.r * (1.8 + v.z);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, rgba(C.vagalume, a));
        g.addColorStop(0.4, rgba(C.vagalume, a * 0.34));
        g.addColorStop(1, rgba(C.vagalume, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* --- Névoa baixa sobre a água ------------------------------------ */
    const forcaNevoa = I.neblina * 0.45;
    if (forcaNevoa > 0.002) {
      for (const b of bandasNeblina) {
        b.x -= b.vel * dt * 0.04;
        if (b.x < -largura) b.x = 0;
      }
      neblina(ctx, {
        largura, altura, cor: C.luaHalo, forca: forcaNevoa, bandas: bandasNeblina
      });
    }
  }

  return { estatico, animado, prepararAnimado };
}
