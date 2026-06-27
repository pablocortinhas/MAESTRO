import { useState, useRef, useCallback, useLayoutEffect } from "react";
import golImg from "../../../imagens/gol.png";

const ATK_IDS = new Set(["gol", "finalPos", "finalNeg"]);
const DEF_IDS = new Set(["gol_sofr", "pen_def", "bloquFinal", "finalNeg_adv"]);

const ATK_META = [
  { id: "gol",      color: "#10B981", label: "Gol" },
  { id: "finalPos", color: "#3B82F6", label: "Na meta" },
  { id: "finalNeg", color: "#EF4444", label: "Para fora" },
];
const DEF_META = [
  { id: "gol_sofr",     color: "#E8001C", label: "Gol sofrido" },
  { id: "pen_def",      color: "#F59E0B", hidden: true },
  { id: "finalNeg_adv", color: "#EF4444", label: "Para fora" },
];

// Penalty shot colors by actId — used for any shot where isPen=true
const PEN_COLOR = {
  gol:          "#10B981", // ATK converted
  gol_sofr:     "#10B981", // DEF converted (ADV scored)
  finalNeg:     "#EF4444", // ATK missed
  finalNeg_adv: "#EF4444", // DEF missed (ADV missed)
  finalPos:     "#F59E0B", // ATK defended (ADV keeper saved)
  pen_def:      "#F59E0B", // DEF defended (FLA keeper saved)
};

const PEN_BREAKDOWN_ITEMS = [
  { key: "conv", color: "#10B981", label: "Convertido" },
  { key: "def",  color: "#F59E0B", label: "Defendido"  },
  { key: "perd", color: "#EF4444", label: "Perdido"    },
];

function GoalMap({ shots, title, subtitle, flip, meta, penBreakdown }) {
  const [hovered, setHovered]     = useState(null);
  const [penFilter, setPenFilter] = useState(false);
  const wrapRef = useRef(null);
  const imgRef  = useRef(null);
  const [ip, setIp] = useState(null);

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

  const allMapped   = shots.filter(h => h.goalX != null && h.goalY != null);
  const penShots    = shots.filter(h => h.isPen);
  const hasPen      = penShots.length > 0;
  const visibleDots = penFilter ? allMapped.filter(h => h.isPen) : allMapped;

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
        {ip && visibleDots.map(h => {
          // Penalty shots always use penalty colors; regular shots use meta colors
          const color = h.isPen
            ? (PEN_COLOR[h.actId] ?? "#888")
            : (meta.find(m => m.id === h.actId)?.color ?? "#888");
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

      {/* Main legend */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {meta.filter(m => !m.hidden).map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: "#000" }}>
              {m.label} {shots.filter(h => h.actId === m.id).length}
            </span>
          </div>
        ))}
      </div>

      {/* Penalty row — only shown when there are penalties in the match */}
      {hasPen && penBreakdown && (
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", alignItems: "center",
          padding: "3px 8px",
          background: penFilter ? "rgba(245,158,11,.16)" : "rgba(245,158,11,.08)",
          borderRadius: 4,
          border: `1px solid ${penFilter ? "rgba(245,158,11,.5)" : "rgba(245,158,11,.2)"}`,
          transition: "all .15s",
        }}>
          <span
            onClick={() => setPenFilter(f => !f)}
            style={{
              fontSize: 9,
              fontFamily: "'Rajdhani',sans-serif",
              fontWeight: 700,
              color: "#92400E",
              cursor: "pointer",
              textDecoration: penFilter ? "underline" : "none",
              userSelect: "none",
            }}
          >
            Pênalti:
          </span>
          {PEN_BREAKDOWN_ITEMS.map(item => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color: "#000" }}>
                {item.label} {penBreakdown[item.key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalMapStats({ hist, scoreAdv = 0, advName = "Adversário" }) {
  const atkShots  = hist.filter(h => ATK_IDS.has(h.actId));
  const defShots  = hist.filter(h => DEF_IDS.has(h.actId));
  const goals     = atkShots.filter(h => h.actId === "gol").length;
  const goalsSofr = Math.max(defShots.filter(h => h.actId === "gol_sofr").length, scoreAdv);

  if (atkShots.length === 0 && defShots.length === 0 && scoreAdv === 0) return null;

  const atkPen = atkShots.filter(h => h.isPen);
  const defPen = defShots.filter(h => h.isPen);

  const atkPenBreakdown = {
    conv: atkPen.filter(h => h.actId === "gol").length,
    def:  atkPen.filter(h => h.actId === "finalPos").length,
    perd: atkPen.filter(h => h.actId === "finalNeg").length,
  };
  const defPenBreakdown = {
    conv: defPen.filter(h => h.actId === "gol_sofr").length,
    def:  defPen.filter(h => h.actId === "pen_def").length,
    perd: defPen.filter(h => h.actId === "finalNeg_adv").length,
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <GoalMap
        shots={atkShots}
        meta={ATK_META}
        title={`BALIZA · ${advName.toUpperCase()}`}
        subtitle={`${goals} gol${goals !== 1 ? "s" : ""} marcado${goals !== 1 ? "s" : ""} · ${atkShots.length} finalizaç${atkShots.length !== 1 ? "ões" : "ão"}`}
        penBreakdown={atkPenBreakdown}
      />
      <div style={{ width: 1, background: "rgba(255,255,255,.08)", alignSelf: "stretch", flexShrink: 0 }} />
      <GoalMap
        shots={defShots}
        meta={DEF_META}
        title="BALIZA - FLAMENGO"
        subtitle={`${goalsSofr} gol${goalsSofr !== 1 ? "s" : ""} sofrido${goalsSofr !== 1 ? "s" : ""}`}
        flip
        penBreakdown={defPenBreakdown}
      />
    </div>
  );
}
