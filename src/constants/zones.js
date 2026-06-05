/* ═══════════════════════════════════════════════════════════
   ZONAS DO CAMPO — campo1.png
   Baseado nas linhas pontilhadas visíveis na imagem.

   PORTRAIT (imagem original 1019×1543):
     Linhas verticais pontilhadas:  x ≈ 0.27  e  x ≈ 0.73
     Linhas horizontais pontilhadas: y ≈ 0.17, 0.33, 0.50, 0.67, 0.83
     → 3 corredores × 6 faixas de profundidade = 18 zonas

   LANDSCAPE (rotação 90°CW para exibição horizontal):
     lx = 1 − py   (portrait y vira landscape x, invertido)
     ly = px        (portrait x vira landscape y)
     Esquerda landscape = defensivo   /   Direita = ofensivo
   ═══════════════════════════════════════════════════════════ */

/* ── Profundidade (landscape x, portrait y invertido) ─────── */
const DEP = [0.03, 0.17, 0.33, 0.50, 0.67, 0.83, 0.97];
const DEP_NAMES = ["Área Própria","Defesa","Meio Def","Meio Ata","Ataque","Área Adv"];

/* ── Corredores laterais (landscape y = portrait x) ──────── */
const LAT = [0.05, 0.27, 0.73, 0.95];
const LAT_NAMES = ["Cor. Sup","Central","Cor. Inf"];

/* ── ZONES_L: landscape (FieldBoard) ─────────────────────── */
export const ZONES_L = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 6; col++) {
    ZONES_L.push({
      id:   row * 6 + col,
      name: `${LAT_NAMES[row]} · ${DEP_NAMES[col]}`,
      row, col,
      x1: DEP[col],     x2: DEP[col + 1],
      y1: LAT[row],     y2: LAT[row + 1],
    });
  }
}

/* ── ZONES_P: portrait (FieldMap / heatmap) ──────────────────
   Mapeamento de volta para portrait: px = ly, py = 1 − lx
   prow representa profundidade (0 = ofensivo/topo, 5 = defensivo/fundo)
   pcol representa corredor (0 = esquerdo no portrait = Cor.Sup no landscape)

   ID consistente: same real area → same ID
     landscape_row = pcol
     landscape_col = 5 − prow   (portrait top = ofensivo = landscape col 5)
     id = landscape_row × 6 + landscape_col
   ─────────────────────────────────────────────────────────── */
const P_Y = [0.03, 0.17, 0.33, 0.50, 0.67, 0.83, 0.97]; // profundidade portrait (topo=ofensivo)
const P_X = [0.05, 0.27, 0.73, 0.95];                    // lateral portrait (0=esq)
const P_DEP_NAMES = ["Área Adv","Ataque","Meio Ata","Meio Def","Defesa","Área Própria"];

export const ZONES_P = [];
for (let prow = 0; prow < 6; prow++) {
  for (let pcol = 0; pcol < 3; pcol++) {
    const lRow = pcol;
    const lCol = 5 - prow;
    ZONES_P.push({
      id:   lRow * 6 + lCol,
      name: `${LAT_NAMES[lRow]} · ${P_DEP_NAMES[prow]}`,
      x1: P_X[pcol],     x2: P_X[pcol + 1],
      y1: P_Y[prow],     y2: P_Y[prow + 1],
    });
  }
}

/* ── ZONES_50: grade 10×5 para mapeamento preciso no FieldBoard ──
   50 zonas: 10 colunas (profundidade) × 5 linhas (corredor)
   IDs: row * 10 + col  (0–49)                                   */
/* ── Limites do campo dentro da imagem (idênticos ao ZONES_L) ──
   lx: 0.03 (defesa) → 0.97 (ataque)
   ly: 0.05 (Cor.Sup) → 0.95 (Cor.Inf)
   As 50 zonas ficam exatamente dentro das linhas do campo.      */
const Z50_X0 = 0.03, Z50_X1 = 0.97;   // profundidade (landscape x)
const Z50_Y0 = 0.05, Z50_Y1 = 0.95;   // corredor   (landscape y)
const Z50_CW = (Z50_X1 - Z50_X0) / 10;
const Z50_CH = (Z50_Y1 - Z50_Y0) / 5;

const Z50_COLS = ["Def.Fundo","Def.Fundo","Defesa","Defesa","Meio-Def","Meio-Ata","Ataque","Ataque","Área Adv","Área Adv"];
const Z50_ROWS = ["Cor.Sup","Q.Sup","Centro","Q.Inf","Cor.Inf"];

export const ZONES_50 = [];
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 10; col++) {
    const x1 = Z50_X0 + col * Z50_CW;
    const y1 = Z50_Y0 + row * Z50_CH;
    ZONES_50.push({
      id:   row * 10 + col,
      name: `${Z50_ROWS[row]} · ${Z50_COLS[col]}`,
      x1, x2: x1 + Z50_CW,
      y1, y2: y1 + Z50_CH,
      cx: x1 + Z50_CW / 2,
      cy: y1 + Z50_CH / 2,
    });
  }
}
