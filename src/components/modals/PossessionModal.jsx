import { C } from "../../constants/colors";

export default function PossessionModal({ show, setPossMode, setShowPossModal }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
        zIndex: 9001, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={() => setShowPossModal(false)}
    >
      <div
        style={{
          background: C.card, border: `1px solid ${C.bdr}`,
          borderRadius: 10, padding: "24px 30px",
          textAlign: "center", minWidth: 260,
          boxShadow: "0 4px 20px rgba(0,0,0,.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontSize: 11, color: C.txtM, letterSpacing: 3,
          fontFamily: "'Rajdhani',sans-serif",
          fontWeight: 700, marginBottom: 14,
        }}>
          QUEM ESTÁ COM A POSSE?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => { setPossMode("fla"); setShowPossModal(false); }} style={{
            background: "#FFF0F0", border: `2px solid ${C.red}`,
            color: C.red, borderRadius: 7, padding: "12px",
            fontFamily: "'Bebas Neue'", fontSize: 16,
            letterSpacing: 2, cursor: "pointer",
          }}>
            FLAMENGO
          </button>
          <button onClick={() => { setPossMode("adv"); setShowPossModal(false); }} style={{
            background: "#EFF6FF", border: `2px solid ${C.blue}`,
            color: C.blue, borderRadius: 7, padding: "12px",
            fontFamily: "'Bebas Neue'", fontSize: 16,
            letterSpacing: 2, cursor: "pointer",
          }}>
            ADVERSÁRIO
          </button>
        </div>
        <button onClick={() => { setPossMode("pause"); setShowPossModal(false); }} style={{
          marginTop: 8, background: "transparent",
          border: `1px solid ${C.bdr}`, color: C.txtM,
          borderRadius: 7, padding: "7px 20px",
          fontFamily: "'Bebas Neue'", fontSize: 12,
          letterSpacing: 2, cursor: "pointer", width: "100%",
        }}>
          PULAR
        </button>
      </div>
    </div>
  );
}
