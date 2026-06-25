import { useState } from "react";
import { C } from "../../constants/colors";

const AC = "#111";

function PenBtn({ label, result, onConfirm }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onConfirm(result)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, minHeight: 36,
        padding: "4px 4px",
        background: hover ? AC : "#F8F8F8",
        border: `1.5px solid ${AC}BB`,
        borderRadius: 2, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: hover
          ? "0 2px 5px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.18)"
          : "0 1px 2px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.7)",
        transition: "background .1s",
      }}
    >
      <span style={{
        fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: .5,
        color: hover ? "#FFF" : AC,
        textAlign: "center", lineHeight: 1.15,
        textShadow: hover ? "0 1px 2px rgba(0,0,0,.3)" : "none",
      }}>
        {label}
      </span>
    </button>
  );
}

export default function PenSimpleModal({ show, onConfirm, onClose }) {
  if (!show) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.card, border: `1px solid ${C.bdr}`,
          borderRadius: 12, padding: "22px 24px",
          boxShadow: "0 8px 32px rgba(0,0,0,.28)",
          display: "flex", flexDirection: "column", gap: 14, minWidth: 320,
        }}
      >
        <div style={{
          fontFamily: "'Bebas Neue'", fontSize: 15,
          letterSpacing: 3, color: "#1A1A1A", textAlign: "center",
        }}>
          RESULTADO DO PÊNALTI
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <PenBtn label="CONVERTIDO" result="conv" onConfirm={onConfirm} />
          <PenBtn label="DEFENDIDO"  result="def"  onConfirm={onConfirm} />
          <PenBtn label="PERDIDO"    result="perd" onConfirm={onConfirm} />
        </div>

        <button
          onClick={onClose}
          style={{
            background: "transparent", border: `1px solid ${C.bdr}`,
            color: C.txtM, borderRadius: 6, padding: "6px 0",
            fontFamily: "'Bebas Neue'", fontSize: 11,
            letterSpacing: 2, cursor: "pointer",
          }}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
