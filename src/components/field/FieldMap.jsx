import { useRef, useEffect } from "react";
import campo1Img from "../../../imagens/campo1.png";

/*
  Coordenadas do histórico em sistema LANDSCAPE:
    x: 0=defesa (esq)  →  1=ataque (dir)
    y: 0=corredor sup  →  1=corredor inf
  campo1.png é retrato → rotacionado 90° CW para landscape.
  Mapeamento direto: cx = x * W,  cy = y * H
*/
const NW = 1019, NH = 1543;
const CSS_IMG_W = `${(NW / NH * 100).toFixed(3)}%`;
const CSS_IMG_H = `${(NH / NW * 100).toFixed(3)}%`;
const CW = 600, CH = Math.round(CW * NW / NH); // canvas 600×396

// azul frio → teal → verde → amarelo → laranja → vermelho
function heatColor(t) {
  const stops = [
    [0.00, [ 20,  80, 200]],   // azul frio  (rarissimo)
    [0.20, [  0, 190, 180]],   // teal       (pouco)
    [0.42, [ 80, 210,  40]],   // verde      (moderado)
    [0.62, [255, 210,   0]],   // amarelo    (frequente)
    [0.80, [255,  80,   0]],   // laranja    (muito)
    [1.00, [200,   0,   0]],   // vermelho   (hotspot)
  ];
  for (let i = 1; i < stops.length; i++) {
    const [t0, c0] = stops[i - 1];
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return stops[stops.length - 1][1];
}

function HeatCanvas({ hist, filterAct }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CW, CH);

    const pts = hist.filter(h =>
      h.x != null && h.y != null &&
      (filterAct === "all" || !filterAct || h.actId === filterAct)
    );
    if (pts.length === 0) return;

    /* ── Grade de densidade ─────────────────── */
    const GW = 100, GH = 66;
    const grid = new Float32Array(GW * GH);
    const SIGMA = 5.5;                       // raio gaussiano em células
    const RANGE = Math.ceil(SIGMA * 3);

    pts.forEach(({ x, y }) => {
      const gx = x * (GW - 1);
      const gy = y * (GH - 1);
      for (let dy = -RANGE; dy <= RANGE; dy++) {
        for (let dx = -RANGE; dx <= RANGE; dx++) {
          const nx = Math.round(gx) + dx;
          const ny = Math.round(gy) + dy;
          if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
          grid[ny * GW + nx] += Math.exp(-(dx*dx + dy*dy) / (2 * SIGMA * SIGMA));
        }
      }
    });

    /* ── Normalização: hotspot sempre = 1.0 ─── */
    let maxV = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i] > maxV) maxV = grid[i];
    if (maxV === 0) return;

    /* ── Renderizar com interpolação bilinear ─ */
    const img = ctx.createImageData(CW, CH);

    for (let py = 0; py < CH; py++) {
      for (let px = 0; px < CW; px++) {
        const gx = (px / (CW - 1)) * (GW - 1);
        const gy = (py / (CH - 1)) * (GH - 1);
        const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, GW - 1);
        const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, GH - 1);
        const fx = gx - x0, fy = gy - y0;

        const v =
          grid[y0*GW+x0] * (1-fx)*(1-fy) +
          grid[y0*GW+x1] * fx   *(1-fy) +
          grid[y1*GW+x0] * (1-fx)*fy    +
          grid[y1*GW+x1] * fx   *fy;

        const t = v / maxV;
        if (t < 0.025) continue;  // skip zonas de ruído

        const [r, g, b] = heatColor(t);

        /* Opacidade suave: cresce com S-curve → transparente nas bordas */
        const alpha = t < 0.12
          ? Math.round(t / 0.12 * 100)
          : Math.round(100 + (t - 0.12) / 0.88 * 145);

        const idx = (py * CW + px) * 4;
        img.data[idx]     = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = Math.min(245, alpha);
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [hist, filterAct]);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
    />
  );
}

/* ── Legenda de cores ─────────────────────────────────────────── */
function Legend() {
  const stops = [
    { label:"POUCO",    color:"rgb(0,190,180)" },
    { label:"MÉDIO",    color:"rgb(80,210,40)" },
    { label:"FREQ.",    color:"rgb(255,210,0)" },
    { label:"MUITO",    color:"rgb(255,80,0)" },
    { label:"HOTSPOT",  color:"rgb(200,0,0)" },
  ];
  return (
    <div style={{
      background:"rgba(0,0,0,.6)", borderRadius:6,
      padding:"6px 10px", display:"flex", flexDirection:"column", gap:3,
    }}>
      {stops.map(s => (
        <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:12, height:12, borderRadius:3, background:s.color, flexShrink:0 }}/>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:9, letterSpacing:1, color:"#EEE" }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── FieldMap ─────────────────────────────────────────────────── */
export default function FieldMap({ hist, filterAct }) {
  return (
    <div style={{
      position:"relative", width:"100%",
      aspectRatio:`${NH}/${NW}`,
      overflow:"hidden", borderRadius:6,
    }}>
      {/* campo1.png (retrato) rotacionado 90° para landscape */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
        <img src={campo1Img} alt="campo" draggable={false} style={{
          position:"absolute", width:CSS_IMG_W, height:CSS_IMG_H,
          left:"50%", top:"50%",
          transform:"translate(-50%,-50%) rotate(90deg)",
          objectFit:"fill",
        }}/>
      </div>

      {/* Mapa de calor KDE */}
      <HeatCanvas hist={hist} filterAct={filterAct} />
    </div>
  );
}

export { Legend };
