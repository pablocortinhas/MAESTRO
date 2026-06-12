import { useState } from "react";
import { C }        from "../../constants/colors";
import golImg       from "../../../imagens/gol.png";

const SHOT_IDS = new Set(["gol", "finalPos", "finalNeg"]);

const META = {
  gol:      { color: "#059669", label: "Gol" },
  finalPos: { color: "#059669", label: "Final. Certa" },
  finalNeg: { color: "#DC2626", label: "Final. Errada" },
};

export default function GoalMapStats({ hist }) {
  const [hovered, setHovered] = useState(null);

  const allShots  = hist.filter(h => SHOT_IDS.has(h.actId));
  const mapped    = allShots.filter(h => h.goalX != null && h.goalY != null);
  const unmapped  = allShots.length - mapped.length;

  if (allShots.length === 0) return null;

  const counts = { gol: 0, finalPos: 0, finalNeg: 0 };
  allShots.forEach(h => { if (h.actId in counts) counts[h.actId]++; });

  return (
    <div>
      {/* Legenda e contadores */}
      <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
        {Object.entries(META).map(([id, m]) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: m.color, border: "1.5px solid rgba(255,255,255,.5)", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: C.txtM, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>
              {m.label}: <span style={{ color: m.color, fontWeight: 700 }}>{counts[id]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Imagem do gol com pontos mapeados */}
      <div style={{ position: "relative", background: "#111", padding: "38px 28px 0", borderRadius: 6, overflow: "hidden" }}>
        <img
          src={golImg}
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto", pointerEvents: "none" }}
          alt="gol"
        />

        {mapped.map(h => {
          const color = META[h.actId]?.color ?? C.txtM;
          const isHov = hovered === h.id;
          return (
            <div
              key={h.id}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                left:  `calc(${h.goalX * 100}% - 22px)`,
                top:   `calc(${h.goalY * 100}% - 22px)`,
                width: 44, height: 44,
                borderRadius: "50%",
                background: color,
                border: `2px solid ${isHov ? "#FFF" : "rgba(255,255,255,.55)"}`,
                boxShadow: isHov
                  ? `0 0 0 3px ${color}55, 0 2px 6px rgba(0,0,0,.6)`
                  : "0 1px 4px rgba(0,0,0,.5)",
                cursor: "default",
                zIndex: isHov ? 20 : 5,
                transition: "box-shadow .12s, border .12s",
              }}
            >
              {isHov && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1A1A1A", border: `1px solid ${color}`,
                  borderRadius: 5, padding: "3px 8px",
                  whiteSpace: "nowrap", zIndex: 30,
                  pointerEvents: "none",
                }}>
                  <div style={{ fontSize: 10, color, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>
                    {h.playerDisplay}
                  </div>
                  <div style={{ fontSize: 8, color: "#AAA", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
                    {h.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unmapped > 0 && (
        <div style={{ fontSize: 9, color: C.txtM, marginTop: 5, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
          {unmapped} registro{unmapped > 1 ? "s" : ""} sem posição mapeada
        </div>
      )}
    </div>
  );
}
