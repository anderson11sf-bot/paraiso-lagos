/* ============================================================================
 * chacara.js — ETAPA 1 DO FUNDO: AMANHECER NA CHÁCARA
 * ----------------------------------------------------------------------------
 * A primeira dobra: céu que clareia, morros em camadas, neblina leve sobre o
 * lago, reflexo na água, orvalho e partículas de luz (vaga-lumes e pólen).
 *
 * NADA DE MAR. A água aqui é LAGO — superfície parada, brilho espalhado.
 *
 * O progresso da etapa NÃO move a câmera: ele muda a COR e a LUZ.
 * Em p=0 é o azul da madrugada; em p=1 é o amanhecer com neblina de lado.
 * ==========================================================================*/

import config from '../../config.js';
import {
  misturarCor, rgb, rgba, pseudo, ceuDegrade, halo, serra, mata, tufosLaterais,
  lago, neblina, brumaHorizonte
} from '../pintura.js';

export const PALETA_CHACARA = {
  // Céu: valores escolhidos para a cena ficar LEGÍVEL através do vidro de TV.
  // Um amanhecer escuro demais vira "fundo preto", não luz suave.
  ceuMadrugadaAlto: [9, 38, 48],
  ceuMadrugadaBaixo: [18, 70, 74],
  ceuAmanhecerAlto: [34, 92, 94],
  ceuAmanhecerMedio: [78, 132, 116],
  ceuAmanhecerBaixo: [126, 158, 116],

  solNucleo: [255, 232, 176],
  solHalo: [244, 208, 122],

  morroLonge: [46, 92, 94],
  morroMedio: [26, 70, 72],
  morroPerto: [14, 48, 50],

  lagoMadrugada: [24, 74, 82],
  lagoAmanhecer: [92, 138, 126],
  lagoFundo: [10, 38, 45],

  mataPerto: [12, 42, 40],
  mataLonge: [30, 76, 70],

  vagalume: [178, 248, 214],
  polen: [246, 240, 224],
  orvalho: [224, 252, 246]
};

export function criarChacara({ largura, altura }) {
  const C = PALETA_CHACARA;
  const I = config.fundo.intensidades;

  const particulas = [];
  const bandasNeblina = [];
  const reflexos = [];
  let pronto = false;

  /** Linha do lago, em fração da altura. Muda se a tela for muito larga. */
  const horizonte = largura > altura * 1.2 ? 0.58 : 0.615;

  function prepararAnimado() {
    if (pronto) return;

    const cfg = config.fundo.particulas;
    const quantas = (largura < 700 ? cfg.mobile : cfg.desktop);
    for (let i = 0; i < quantas; i++) {
      const ePolen = i % 3 === 0;
      particulas.push({
        x: pseudo(i * 1.37) * largura,
        y: altura * (ePolen ? 0.18 + pseudo(i * 2.11) * 0.40
                            : 0.50 + pseudo(i * 3.77) * 0.42),
        z: 0.35 + pseudo(i * 5.19) * 0.65,
        r: cfg.raioMin + pseudo(i * 6.31) * (cfg.raioMax - cfg.raioMin),
        baseX: pseudo(i * 7.43) * Math.PI * 2,
        vel: cfg.velocidade * (0.4 + pseudo(i * 8.57) * 1.2),
        cintila: pseudo(i * 9.61) * Math.PI * 2,
        tipo: ePolen ? 'polen' : 'vagalume'
      });
    }

    const quantasBandas = (largura < 700 ? 5 : 7);
    for (let i = 0; i < quantasBandas; i++) {
      bandasNeblina.push({
        y: altura * (0.44 + (i / quantasBandas) * 0.24 + pseudo(i * 4.13) * 0.03),
        h: altura * (0.045 + pseudo(i * 5.29) * 0.075),
        a: 0.05 + pseudo(i * 2.71) * 0.09,
        vel: 6 + pseudo(i * 6.83) * 16,
        x: -largura * pseudo(i * 3.31),
        escala: 0.7 + pseudo(i * 7.19) * 0.9
      });
    }

    for (let i = 0; i < 14; i++) {
      reflexos.push({
        y: i / 14,
        a: pseudo(i * 2.53),
        larguraRel: 0.10 + pseudo(i * 5.71) * 0.60,
        vel: 0.2 + pseudo(i * 8.17) * 0.5
      });
    }

    pronto = true;
  }

  /* ---------- CAMADA ESTÁTICA ------------------------------------------ */

  function estatico(ctx, p, modoLite) {
    prepararAnimado();
    const e = p;

    /* --- Céu ---------------------------------------------------------- */
    ceuDegrade(ctx, largura, altura * 0.72, [
      [0.00, misturarCor(C.ceuMadrugadaAlto, C.ceuAmanhecerAlto, e)],
      [0.45, misturarCor(C.ceuMadrugadaBaixo, C.ceuAmanhecerMedio, e)],
      [1.00, misturarCor(C.ceuAmanhecerBaixo, C.solHalo, e * 0.35)]
    ]);

    /* --- Sol nascendo atrás do morro --------------------------------- */
    const solX = largura * (0.72 - e * 0.10);
    const solY = altura * (0.42 - e * 0.16);
    halo(ctx, solX, solY, Math.min(largura, altura) * (0.34 + e * 0.16),
      C.solNucleo, C.solHalo, I.brilhoSol * e * 0.9);

    /* --- Morros em camadas ------------------------------------------- */
    const niveis = {
      longe: altura * (horizonte - 0.115),
      medio: altura * (horizonte - 0.065),
      lago: altura * horizonte
    };

    serra(ctx, {
      largura, altura, yBase: niveis.longe, alturaSerra: altura * 0.10,
      cor: C.morroLonge, corLuz: C.solHalo, tLuz: e * 0.16,
      alpha: 0.55, freq: 3.1, passos: 11, desloc: 0, semente: 2
    });
    serra(ctx, {
      largura, altura, yBase: niveis.medio, alturaSerra: altura * 0.14,
      cor: C.morroMedio, corLuz: C.solHalo, tLuz: e * 0.16,
      alpha: 0.85, freq: 2.2, passos: 17, desloc: 1.5, semente: 19
    });
    serra(ctx, {
      largura, altura, yBase: altura * 0.60, alturaSerra: altura * 0.12,
      cor: C.morroPerto, corLuz: C.solHalo, tLuz: e * 0.14,
      alpha: 1, freq: 1.5, passos: 7, desloc: 4.0, semente: 37
    });

    /* --- Mata na margem --------------------------------------------- */
    mata(ctx, {
      largura, altura, yBase: niveis.lago + 2,
      cor: C.mataPerto, corLuz: C.solHalo, tLuz: e * 0.2,
      alpha: 0.92, alturaTufo: altura * 0.019, tufos: 46, semente: 43
    });

    /* --- Lago ------------------------------------------------------- */
    lago(ctx, {
      largura, altura, topo: niveis.lago,
      corPerto: misturarCor(C.lagoMadrugada, C.lagoAmanhecer, e * 0.65),
      corFundo: C.lagoFundo,
      corLuz: C.solNucleo,
      tLuz: e,
      luzX: solX,
      luzForca: 0.16 * e
    });

    /* --- Fio de bruma na linha do horizonte -------------------------- */
    brumaHorizonte(ctx, {
      largura, y: niveis.lago, espessura: altura * 0.022,
      cor: C.orvalho, alfa: 0.10
    });

    /* --- Fechamento lateral (a mesma linguagem das outras etapas) ---- */
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataLonge, C.solHalo, e * 0.18),
      alpha: 0.26, quantos: 7, baseRel: 0.40, alturaRel: 0.085, semente: 51
    });
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataLonge, C.solHalo, e * 0.18),
      alpha: 0.26, quantos: 7, baseRel: 0.40, alturaRel: 0.085, semente: 51, espelhado: true
    });
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataPerto, C.solHalo, e * 0.14),
      alpha: 0.5, quantos: 6, baseRel: 0.66, alturaRel: 0.12, semente: 59
    });
    tufosLaterais(ctx, {
      largura, altura, cor: misturarCor(C.mataPerto, C.solHalo, e * 0.14),
      alpha: 0.5, quantos: 6, baseRel: 0.66, alturaRel: 0.12, semente: 59, espelhado: true
    });

    /* --- Orvalho na relva da margem ---------------------------------- */
    if (!modoLite && I.orvalho > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gotas = Math.round((40 - e * 20) * I.orvalho);
      for (let i = 0; i < gotas; i++) {
        const x = pseudo(i * 1.37) * largura;
        const y = niveis.lago - pseudo(i * 2.11) * altura * 0.04 - 2;
        ctx.fillStyle = rgba(C.orvalho, 0.16 * (1 - e * 0.4));
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      ctx.restore();
    }
  }

  /* ---------- CAMADA ANIMADA ------------------------------------------ */

  function animado(ctx, p, dt, tempo, modoLite) {
    /* --- Brilhos na superfície do lago ------------------------------- */
    const topo = altura * horizonte;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topo, largura, altura - topo);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < reflexos.length; i++) {
      const r = reflexos[i];
      const y = topo + r.y * (altura - topo);
      const desloc = Math.sin(tempo * r.vel + i * 0.8) * largura * 0.012;
      const w = largura * r.larguraRel * 0.5;
      const x = largura * 0.66 - w * 0.5 + desloc - (1 - r.y) * largura * 0.05;
      const a = r.a * 0.10 * p * (1 - r.y * 0.55);
      if (a <= 0.003) continue;
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, rgba(C.solHalo, 0));
      g.addColorStop(0.5, rgba(C.solHalo, a));
      g.addColorStop(1, rgba(C.solHalo, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, Math.max(1, 1.6 * (1 - r.y * 0.4)));
    }
    ctx.restore();

    /* --- Partículas de luz: vaga-lumes e pólen ----------------------- */
    if (!modoLite && particulas.length) {
      const cfg = config.fundo.particulas;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const pt of particulas) {
        pt.baseX += dt * 0.35;
        pt.cintila += dt * (1.1 + pt.z);

        const deriva = Math.sin(pt.baseX) * cfg.deriva * 14 * pt.z;
        const x = pt.x + deriva;
        let y = pt.y - (pt.baseX * pt.vel * 10 * pt.z) % (altura * 0.9);
        if (y < -20) y += altura * 0.9;

        const brilho = 0.15 + (Math.sin(pt.cintila) * 0.5 + 0.5) * cfg.cintilar;

        const cor = pt.tipo === 'vagalume'
          ? misturarCor(C.vagalume, [200, 240, 210], p)
          : misturarCor(C.polen, C.solHalo, p);

        // Vaga-lume predomina na madrugada; pólen dourado no amanhecer
        const alpha = (pt.tipo === 'vagalume' ? (1 - p * 0.45) : (0.35 + p * 0.5))
                    * brilho * 0.5;
        if (alpha <= 0.004) continue;

        const raio = pt.r * (1 + pt.z * 0.6) * 3.2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
        g.addColorStop(0, rgba(cor, alpha));
        g.addColorStop(0.45, rgba(cor, alpha * 0.35));
        g.addColorStop(1, rgba(cor, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* --- Neblina sobre o lago ---------------------------------------- */
    const forca = I.neblina;
    if (forca > 0.002) {
      for (const b of bandasNeblina) {
        b.x -= b.vel * dt * 0.06;
        if (b.x < -largura) b.x = 0;
      }
      // Forte no começo (madrugada), afina conforme clareia
      const curva = 0.45 + Math.sin(p * Math.PI * 0.9) * 0.55;
      neblina(ctx, {
        largura, altura, cor: C.orvalho, forca: forca * curva * 0.7, bandas: bandasNeblina
      });
    }
  }

  return { estatico, animado, prepararAnimado };
}
