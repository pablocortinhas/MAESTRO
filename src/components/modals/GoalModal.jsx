import { useState } from "react";
import { C }        from "../../constants/colors";
import golImg       from "../../../imagens/gol.png";

/* Zonas do gol: 3 colunas × 3 linhas (esq→dir, cima→baixo) */
const GOAL_ZONES = [
  ["Canto Esq-Alto",  "Centro-Alto",  "Canto Dir-Alto"],
  ["Centro Esq",      "Centro",       "Centro Dir"],
  ["Canto Esq-Baixo", "Centro-Baixo", "Canto Dir-Baixo"],
];

function GoalImage({ side, onSelect }) {
  const [hover, setHover] = useState(null);

  const accentR = side === "home" ? "232,0,28" : "0,80,200";
  const accentC = side === "home" ? C.red       : "#0050C8";

  return (
    <div style={{ position: "relative", userSelect: "none", borderRadius: 6, overflow: "hidden", border: `2px solid ${accentC}44` }}>
      {/* Imagem do gol */}
      <img
        src={golImg}
        draggable={false}
        style={{ display: "block", width: "100%", height: "auto" }}
        alt="gol"
      />

      {/* Grid 3×3 clicável sobreposto */}
      <div style={{
        position: "absolute", inset: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
      }}>
        {GOAL_ZONES.flat().map(zone => {
          const isHover = hover === zone;
          return (
            <div
              key={zone}
              onMouseEnter={() => setHover(zone)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(zone)}
              title={zone}
              style={{
                cursor: "crosshair",
                background: isHover
                  ? `rgba(${accentR}, 0.52)`
                  : "transparent",
                border: isHover
                  ? `2px solid rgba(${accentR}, 0.9)`
                  : "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .1s",
              }}
            >
              {isHover && (
                <span style={{
                  color: "#fff",
                  fontSize: 11,
                  fontFamily: "'Bebas Neue'",
                  letterSpacing: 1,
                  textShadow: "0 1px 4px rgba(0,0,0,.9)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  padding: "2px 4px",
                  background: `rgba(${accentR}, 0.6)`,
                  borderRadius: 3,
                }}>
                  {zone}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalModal({ goalModal, setGoalModal, registerWithData, setScore }) {
  if (!goalModal) return null;
  const { side, actId, zoneId } = goalModal;

  const handleSelect = (section) => {
    if (side === "home") setScore(s => ({ ...s, fla: s.fla + 1 }));
    else                 setScore(s => ({ ...s, adv: s.adv + 1 }));
    registerWithData(actId, zoneId, section ? ` · ${section}` : "");
    setGoalModal(null);
  };

  const titleColor = side === "home" ? C.red : "#0050C8";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={() => setGoalModal(null)}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.bdr}`,
          borderRadius: 12,
          padding: "18px 20px",
          width: 360,
          boxShadow: "0 8px 32px rgba(0,0,0,.28)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Título */}
        <div style={{
          fontSize: 13, color: titleColor,
          letterSpacing: 3, fontFamily: "'Bebas Neue'",
          marginBottom: 4, textAlign: "center",
        }}>
          {side === "home" ? "GOL DO FLAMENGO" : "GOL SOFRIDO"}
        </div>
        <div style={{
          fontSize: 9, color: C.txtM,
          letterSpacing: 1.5, fontFamily: "'Rajdhani',sans-serif",
          fontWeight: 600, textAlign: "center",
          marginBottom: 12,
        }}>
          CLIQUE NO GRÁFICO ONDE A BOLA ENTROU
        </div>

        {/* Imagem do gol com zonas clicáveis */}
        <GoalImage side={side} onSelect={handleSelect} />

        {/* Botão para registrar sem posição */}
        <button
          onClick={() => handleSelect("")}
          style={{
            marginTop: 10, display: "block", width: "100%",
            textAlign: "center", background: "transparent",
            border: `1px solid ${C.bdr}`, color: C.txtM,
            borderRadius: 6, padding: "7px 0",
            fontFamily: "'Bebas Neue'", fontSize: 12,
            letterSpacing: 2, cursor: "pointer",
          }}
        >
          REGISTRAR SEM POSIÇÃO
        </button>
      </div>
    </div>
  );
}
