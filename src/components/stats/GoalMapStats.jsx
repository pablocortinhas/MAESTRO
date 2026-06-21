import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { C }        from "../../constants/colors";
import golImg       from "../../../imagens/gol.png";

const ATK_IDS = new Set(["gol", "finalPos", "finalNeg"]);
const DEF_IDS = new Set(["gol_sofr", "pen_def", "bloquFinal"]);

const SHOT_META = {
  gol:      { color: "#10B981", label: "Gol" },
  finalPos: { color: "#3B82F6", label: "Na meta" },
  finalNeg: { color: "#EF4444", label: "Para fora" },
};

function GoalMap({ shots, title, subtitle, flip }) {
  const [hovered, setHovered] = useState(null);
  const wrapRef = useRef(null);
  const imgRef  = useRef(null);
  const [ip, setIp] = useState(null); // image rect relative to wrapper (%)

  const measure = useCallback(() => {
    const w = wrapRef.current, im = imgRef.current;
    if (!w || !im) return;
    const wr = w.getBoundingClientRect(), ir = im.getBoundingClientRect();
    if (!wr.width || !wr.height) return;
    setIp({
      l: (ir.left - wr.left) / wr.width  * 100,
      t: (ir.top  - wr.top)  / wr.height * 100,
      w: ir.width  / wr.width  * 100,
      h: ir.height / wr.height * 100,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const mapped = shots.filter(h => h.goalX != null && h.goalY != null);

  // Converts image-relative (gx,gy) to absolute % within the wrapper
  const dotPos = (gx, gy) => ({
    left: `calc(${ip.l + gx * ip.w}% - 10px)`,
    top:  `calc(${ip.t + gy * ip.h}% - 10px)`,
  });

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 2.5, color: "#000" }}>{title}</div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, color: "#000" }}>{subtitle}</div>
      </div>

      {/* Wrapper com margem generosa ao redor da imagem para chutes fora */}
      <div ref={wrapRef} style={{
        position: "relative",
        background: "#000",
        borderRadius: 8,
        padding: "20% 14% 8%",
        transform: flip ? "scaleX(-1)" : undefined,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
      }}>
        <img ref={imgRef} src={golImg} onLoad={measure} draggable={false}
          style={{ display: "block", width: "100%", height: "auto", pointerEvents: "none" }}
          alt="gol"
        />
        {ip && mapped.map(h => {
          const color = SHOT_META[h.actId]?.color ?? "#888";
          const isHov = hovered === h.id;
          return (
            <div
              key={h.id}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                ...dotPos(h.goalX, h.goalY),
                width: 20, height: 20,
                borderRadius: "50%",
                background: color,
                border: `2px solid ${isHov ? "#FFF" : "rgba(255,255,255,.5)"}`,
                boxShadow: isHov ? `0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,.7)` : "0 1px 5px rgba(0,0,0,.6)",
                cursor: "default", zIndex: isHov ? 20 : 5,
                transition: "all .1s",
              }}
            >
              {isHov && (
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)", left: "50%",
                  transform: `translateX(-50%)${flip ? " scaleX(-1)" : ""}`,
                  background: "#0F172A",
                  border: `1px solid ${color}77`,
                  borderRadius: 6, padding: "5px 10px",
                  whiteSpace: "nowrap", zIndex: 30, pointerEvents: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,.5)",
                }}>
                  <div style={{ fontSize: 11, color, fontFamily: "'Bebas Neue'", letterSpacing: 1.5 }}>
                    {h.playerDisplay || "Equipe"}
                  </div>
                  <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
                    {h.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {Object.entries(SHOT_META).map(([id, m]) => {
          const cnt = shots.filter(h => h.actId === id).length;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: "#000" }}>
                {m.label} <span style={{ color: "#000" }}>{cnt}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalMapStats({ hist, scoreAdv = 0 }) {
  const atkShots  = hist.filter(h => ATK_IDS.has(h.actId));
  const defShots  = hist.filter(h => DEF_IDS.has(h.actId));
  const goals     = atkShots.filter(h => h.actId === "gol").length;
  const goalsSofr = Math.max(defShots.filter(h => h.actId === "gol_sofr").length, scoreAdv);

  if (atkShots.length === 0 && defShots.length === 0 && scoreAdv === 0) return null;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <GoalMap
        shots={atkShots}
        title="BALIZA - ADVERSÁRIO"
        subtitle={`${goals} gol${goals !== 1 ? "s" : ""} marcado${goals !== 1 ? "s" : ""} · ${atkShots.length} finalizaç${atkShots.length !== 1 ? "ões" : "ão"}`}
      />
      <div style={{ width: 1, background: "rgba(255,255,255,.08)", alignSelf: "stretch", flexShrink: 0 }} />
      <GoalMap
        shots={defShots}
        title="BALIZA - FLAMENGO"
        subtitle={`${goalsSofr} gol${goalsSofr !== 1 ? "s" : ""} sofrido${goalsSofr !== 1 ? "s" : ""}`}
        flip
      />
    </div>
  );
}
