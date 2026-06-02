import { C } from "../../constants/colors";

const GOAL_SECTIONS = [
  ["Canto Esq-Alto","Centro-Alto","Canto Dir-Alto"],
  ["Centro Esq",    "Centro",     "Centro Dir"],
  ["Canto Esq-Baixo","Centro-Baixo","Canto Dir-Baixo"],
];

function GoalGrid({ side, onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
      {GOAL_SECTIONS.flat().map(sec => (
        <button key={sec} onClick={() => onSelect(sec)} style={{
          background: side === "home" ? `${C.red}18` : `${C.blue}18`,
          border:     `1px solid ${side === "home" ? C.red : C.blue}`,
          color:      side === "home" ? C.red : C.blue,
          borderRadius: 5, padding: "8px 4px",
          fontFamily: "'Bebas Neue'", fontSize: 10,
          letterSpacing: 0.5, cursor: "pointer",
          textAlign: "center", lineHeight: 1.2,
        }}>
          {sec}
        </button>
      ))}
    </div>
  );
}

export default function GoalModal({ goalModal, setGoalModal, registerWithData, setScore }) {
  if (!goalModal) return null;
  const { side, actId, zoneId } = goalModal;

  const handleSelect = (section) => {
    if (side === "home") setScore(s => ({ ...s, fla: s.fla + 1 }));
    else setScore(s => ({ ...s, adv: s.adv + 1 }));
    registerWithData(actId, zoneId, section);
    setGoalModal(null);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={() => setGoalModal(null)}
    >
      <div
        style={{
          background: C.card, border: `1px solid ${C.bdr}`,
          borderRadius: 10, padding: "20px 22px",
          minWidth: 320, maxWidth: 400,
          boxShadow: "0 4px 24px rgba(0,0,0,.18)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontSize: 12, color: side === "home" ? C.red : C.blue,
          letterSpacing: 3, fontFamily: "'Bebas Neue'",
          marginBottom: 12, textAlign: "center",
        }}>
          {side === "home" ? "GOL DO FLAMENGO — ONDE FOI?" : "GOL SOFRIDO — ONDE ENTROU?"}
        </div>
        <GoalGrid side={side} onSelect={handleSelect} />
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
