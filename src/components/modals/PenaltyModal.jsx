import { useState } from "react";
import { C } from "../../constants/colors";

/* 3×3 penalty position grid labels */
const POSITIONS = [
  { id:"TL", label:"Canto\nEsq-Alto"  }, { id:"TC", label:"Centro\nAlto"    }, { id:"TR", label:"Canto\nDir-Alto"  },
  { id:"ML", label:"Meio\nEsquerdo"   }, { id:"MC", label:"Centro"          }, { id:"MR", label:"Meio\nDireito"    },
  { id:"BL", label:"Canto\nEsq-Baixo" }, { id:"BC", label:"Centro\nBaixo"   }, { id:"BR", label:"Canto\nDir-Baixo" },
];

export default function PenaltyModal({ penaltyModal, setPenaltyModal, onConfirm }) {
  const [step, setStep]   = useState("position"); // "position" | "result"
  const [pos,  setPos]    = useState(null);

  if (!penaltyModal) return null;
  const { side } = penaltyModal;
  const isHome   = side === "home";

  const handlePosition = (p) => {
    setPos(p);
    setStep("result");
  };

  const handleResult = (result) => {
    onConfirm({ pos, result, side });
    setPenaltyModal(null);
    setStep("position");
    setPos(null);
  };

  const close = () => { setPenaltyModal(null); setStep("position"); setPos(null); };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.48)",
        zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={close}
    >
      <div
        style={{
          background: C.card, border: `1px solid ${C.bdr}`,
          borderRadius: 10, padding: "20px 22px",
          minWidth: 340, maxWidth: 420,
          boxShadow: "0 6px 28px rgba(0,0,0,.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          fontFamily: "'Bebas Neue'", fontSize: 14,
          letterSpacing: 3, color: isHome ? C.red : C.blue,
          textAlign: "center", marginBottom: 14,
        }}>
          {isHome
            ? step === "position" ? "PÊNALTI A FAVOR — ONDE FOI COBRADO?" : "RESULTADO DO PÊNALTI"
            : step === "position" ? "PÊNALTI SOFRIDO — ONDE O ADVERSÁRIO BATEU?" : "O GOLEIRO DEFENDEU?"}
        </div>

        {step === "position" && (
          <>
            <div style={{ marginBottom: 8, fontSize: 10, color: C.txtM, fontFamily: "'Rajdhani',sans-serif", textAlign: "center" }}>
              Selecione o canto / região para onde foi chutado
            </div>
            {/* Goal visual */}
            <GoalGrid onSelect={handlePosition} isHome={isHome} />
            <button onClick={close} style={{
              marginTop: 10, display: "block", width: "100%",
              textAlign: "center", background: "transparent",
              border: `1px solid ${C.bdr}`, color: C.txtM,
              borderRadius: 6, padding: "6px 0",
              fontFamily: "'Bebas Neue'", fontSize: 12,
              letterSpacing: 2, cursor: "pointer",
            }}>
              CANCELAR
            </button>
          </>
        )}

        {step === "result" && (
          <>
            <div style={{
              fontSize: 10, color: C.txtM, fontFamily: "'Rajdhani',sans-serif",
              textAlign: "center", marginBottom: 10,
            }}>
              Posição: <strong>{pos}</strong>
            </div>

            {isHome ? (
              /* Home penalty results */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => handleResult("conv")} style={resultBtn("#065F46", "#D1FAE5")}>
                  CONVERTIDO
                </button>
                <button onClick={() => handleResult("perd")} style={resultBtn("#991B1B", "#FEE2E2")}>
                  PERDIDO
                </button>
              </div>
            ) : (
              /* Away penalty results */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => handleResult("def")} style={resultBtn("#1D4ED8", "#EFF6FF")}>
                  DEFENDIDO PELO GOLEIRO
                </button>
                <button onClick={() => handleResult("sofrido")} style={resultBtn("#991B1B", "#FEE2E2")}>
                  GOL SOFRIDO
                </button>
              </div>
            )}

            <button onClick={() => setStep("position")} style={{
              marginTop: 8, display: "block", width: "100%",
              textAlign: "center", background: "transparent",
              border: `1px solid ${C.bdr}`, color: C.txtM,
              borderRadius: 6, padding: "6px 0",
              fontFamily: "'Bebas Neue'", fontSize: 11,
              letterSpacing: 2, cursor: "pointer",
            }}>
              VOLTAR
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GoalGrid({ onSelect, isHome }) {
  const accent = isHome ? C.red : C.blue;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
      gap: 4, border: `2px solid ${accent}`, borderRadius: 6, padding: 6,
      background: "#F8F8F8",
    }}>
      {POSITIONS.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)} style={{
          background: `${accent}14`,
          border: `1px solid ${accent}55`,
          color: accent, borderRadius: 5,
          padding: "10px 4px",
          fontFamily: "'Bebas Neue'", fontSize: 10,
          letterSpacing: 0.5, cursor: "pointer",
          textAlign: "center", lineHeight: 1.3,
          whiteSpace: "pre-line",
          transition: "background .1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${accent}28`}
        onMouseLeave={e => e.currentTarget.style.background = `${accent}14`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function resultBtn(color, bg) {
  return {
    background: bg, border: `2px solid ${color}`,
    color, borderRadius: 7, padding: "12px 8px",
    fontFamily: "'Bebas Neue'", fontSize: 14,
    letterSpacing: 1.5, cursor: "pointer",
    textAlign: "center", lineHeight: 1.3,
  };
}
