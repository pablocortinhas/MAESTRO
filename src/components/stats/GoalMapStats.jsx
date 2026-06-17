import { useState } from "react";
import { C }        from "../../constants/colors";
import golImg       from "../../../imagens/gol.png";

const ATK_IDS = new Set(["gol", "finalPos", "finalNeg"]);

const SHOT_META = {
  gol:      { color: "#10B981", label: "Gol" },
  finalPos: { color: "#3B82F6", label: "Na meta" },
  finalNeg: { color: "#EF4444", label: "Para fora" },
};

function GoalMap({ shots, title, subtitle, flip }) {
  const [hovered, setHovered] = useState(null);
  const mapped = shots.filter(h => h.goalX != null && h.goalY != null);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 2.5, color: "#94A3B8" }}>{title}</div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, color: "#64748B" }}>{subtitle}</div>
      </div>

      <div style={{
        position: "relative",
        background: "#040D1E",
        borderRadius: 8,
        overflow: "hidden",
        transform: flip ? "scaleX(-1)" : undefined,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
      }}>
        <img src={golImg} draggable={false}
          style={{ display: "block", width: "100%", height: "auto", pointerEvents: "none" }}
          alt="gol"
        />
        {mapped.map(h => {
          const color = SHOT_META[h.actId]?.color ?? "#888";
          const isHov = hovered === h.id;
          return (
            <div
              key={h.id}
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                left: `calc(${h.goalX * 100}% - 10px)`,
                top:  `calc(${h.goalY * 100}% - 10px)`,
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
              <span style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: "#94A3B8" }}>
                {m.label} <span style={{ color: m.color }}>{cnt}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalMapStats({ hist, scoreAdv = 0 }) {
  const atkShots = hist.filter(h => ATK_IDS.has(h.actId));
  const goals    = atkShots.filter(h => h.actId === "gol").length;

  if (atkShots.length === 0 && scoreAdv === 0) return null;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <GoalMap
        shots={atkShots}
        title="ATAQUE — FLAMENGO"
        subtitle={`${goals} gol${goals !== 1 ? "s" : ""} marcado${goals !== 1 ? "s" : ""} · ${atkShots.length} finalizaç${atkShots.length !== 1 ? "ões" : "ão"}`}
      />
      <div style={{ width: 1, background: "rgba(255,255,255,.08)", alignSelf: "stretch", flexShrink: 0 }} />
      <GoalMap
        shots={[]}
        title="DEFESA — ADVERSÁRIO"
        subtitle={`${scoreAdv} gol${scoreAdv !== 1 ? "s" : ""} sofrido${scoreAdv !== 1 ? "s" : ""}`}
        flip
      />
    </div>
  );
}
