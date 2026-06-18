import { C }          from "../../constants/colors";
import { SECTORS }    from "../../constants/sectors";
import GoalMapStats   from "./GoalMapStats";
import flaEscudoImg   from "../../../imagens/Fla_Escudo.png";

/* ── Linha de estatística ──────────────────────────────── */
function StatRow({ label, val, maxVal, color }) {
  const pct = maxVal > 0 ? Math.round(val / maxVal * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
          fontSize: 12, color: "#64748B", letterSpacing: .4,
          textTransform: "uppercase", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'Bebas Neue'", fontSize: 28,
          color: val > 0 ? color : "#D1D5DB",
          lineHeight: 1, flexShrink: 0,
        }}>
          {val}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "#F1F5F9", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}BB, ${color})`,
          borderRadius: 2, transition: "width .45s ease",
        }} />
      </div>
    </div>
  );
}

/* ── Bloco de seção ─────────────────────────────────────── */
function StatsSection({ sector, tStats }) {
  const rows = [];
  sector.actions.forEach(a => {
    if (a.type === "single") {
      rows.push({ label: a.label, val: tStats[a.id] || 0, color: C.red });
    } else {
      rows.push({ label: `${a.label} — ${a.posLabel}`, val: tStats[a.posId] || 0, color: C.red });
      rows.push({ label: `${a.label} — ${a.negLabel}`, val: tStats[a.negId] || 0, color: "#374151" });
    }
  });
  const sectionMax = Math.max(...rows.map(r => r.val), 1);

  return (
    <div style={{
      background: "#FFF",
      border: `1px solid ${C.bdr}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 18px",
        borderBottom: `1px solid ${C.bdr}`,
        display: "flex", alignItems: "center", gap: 10,
        background: "#FAFBFC",
      }}>
        <div style={{ width: 3, height: 18, background: C.red, borderRadius: 2, flexShrink: 0 }} />
        <span style={{
          fontFamily: "'Bebas Neue'", fontSize: 15, letterSpacing: 2.5, color: "#111827",
        }}>
          {sector.label.toUpperCase()}
        </span>
      </div>
      <div style={{
        padding: "14px 18px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px 32px",
      }}>
        {rows.map((r, i) => (
          <StatRow key={i} label={r.label} val={r.val} maxVal={sectionMax} color={r.color} />
        ))}
      </div>
    </div>
  );
}

/* ── Vista principal de Estatísticas ────────────────────── */
export default function StatsView({ hist, tStats, score, catKey, exportData, possTime }) {
  const tot = (possTime?.fla ?? 0) + (possTime?.adv ?? 0) || 1;
  const fp  = Math.round((possTime?.fla ?? 0) / tot * 100);
  const ap  = 100 - fp;
  const hasPoss = (possTime?.fla ?? 0) + (possTime?.adv ?? 0) > 0;

  return (
    <div style={{
      maxWidth: 860, margin: "0 auto",
      display: "flex", flexDirection: "column", gap: 12,
      padding: "2px 0 16px",
    }}>

      {/* ── Cabeçalho do jogo ── */}
      <div style={{
        background: "#FFF",
        border: `1px solid ${C.bdr}`,
        borderRadius: 10,
        overflow: "hidden",
      }}>
        {/* Barra vermelha superior */}
        <div style={{ height: 4, background: C.red }} />

        {/* Placar */}
        <div style={{
          padding: "18px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* FLA */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <img src={flaEscudoImg} alt="Flamengo" style={{ height: 44, width: "auto", objectFit: "contain", flexShrink: 0 }} />
            <div>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800,
              fontSize: 26, color: C.red, letterSpacing: 3, lineHeight: 1,
            }}>
              FLAMENGO
            </div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
              fontSize: 11, color: "#9CA3AF", letterSpacing: 2, marginTop: 3,
            }}>
              {catKey}
            </div>
            </div>
          </div>

          {/* Placar central */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 24px" }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 64, color: C.red, lineHeight: 1 }}>{score.fla}</span>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: "#D1D5DB", lineHeight: 1, margin: "0 2px" }}>×</span>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 64, color: "#374151", lineHeight: 1 }}>{score.adv}</span>
          </div>

          {/* ADV */}
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800,
              fontSize: 26, color: "#374151", letterSpacing: 3, lineHeight: 1,
            }}>
              ADVERSÁRIO
            </div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
              fontSize: 11, color: "#9CA3AF", letterSpacing: 2, marginTop: 3,
            }}>
              {hist.length} eventos
            </div>
          </div>
        </div>

        {/* ── Posse de bola ── */}
        {hasPoss && (
          <div style={{
            borderTop: `1px solid ${C.bdr}`,
            padding: "12px 28px 14px",
            background: "#FAFBFC",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              marginBottom: 6,
            }}>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: C.red, lineHeight: 1 }}>{fp}%</span>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, color: "#9CA3AF", letterSpacing: 2 }}>
                POSSE DE BOLA
              </span>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: "#374151", lineHeight: 1 }}>{ap}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#E5E7EB", overflow: "hidden", display: "flex" }}>
              <div style={{
                width: `${fp}%`, background: C.red,
                transition: "width .45s ease", borderRadius: "4px 0 0 4px",
              }} />
              <div style={{
                flex: 1, background: "#374151",
                borderRadius: "0 4px 4px 0",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Mapas de gol ── */}
      {(hist.some(h => ["gol","finalPos","finalNeg"].includes(h.actId)) || score.adv > 0) && (
        <div style={{
          background: "#111827",
          border: `1px solid ${C.bdr}`,
          borderRadius: 10,
          padding: "14px 18px 18px",
        }}>
          <div style={{
            fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 3,
            color: "#6B7280", marginBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,.07)",
            paddingBottom: 8,
          }}>
            MAPAS DE GOL
          </div>
          <GoalMapStats hist={hist} scoreAdv={score.adv} />
        </div>
      )}

      {/* ── Seções de estatísticas ── */}
      {SECTORS.map(sector => (
        <StatsSection key={sector.id} sector={sector} tStats={tStats} />
      ))}

      {/* ── Exportar ── */}
      <div style={{
        background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10,
        padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, color: C.txtM }}>
          {hist.length} evento{hist.length !== 1 ? "s" : ""} registrado{hist.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportData("csv")} style={{
            background: C.red, border: "none", color: "#FFF",
            borderRadius: 7, padding: "6px 20px",
            fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 1.5, cursor: "pointer",
            boxShadow: `0 2px 8px ${C.red}44`,
          }}>EXPORTAR CSV</button>
          <button onClick={() => exportData("xml")} style={{
            background: "transparent", border: `1px solid ${C.bdr}`, color: C.txtM,
            borderRadius: 7, padding: "6px 20px",
            fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 1.5, cursor: "pointer",
          }}>EXPORTAR XML</button>
        </div>
      </div>
    </div>
  );
}
