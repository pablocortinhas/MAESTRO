import { C }      from "../../constants/colors";
import AdvLogo    from "../common/AdvLogo";
import flaEscudo  from "../../../imagens/Fla_Escudo.png";
import fundo1     from "../../../imagens/fundo1.png";

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
          backgroundImage: `url(${fundo1})`, /* fundo1.png */
          backgroundSize: "cover", backgroundPosition: "center",
          border: `1px solid ${C.bdr}`,
          borderRadius: 10, padding: "24px 30px",
          textAlign: "center", minWidth: 260,
          boxShadow: "0 4px 20px rgba(0,0,0,.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontSize: 11, color: "#FFF", letterSpacing: 3,
          fontFamily: "'Rajdhani',sans-serif",
          fontWeight: 700, marginBottom: 14,
        }}>
          QUEM ESTÁ COM A POSSE?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            onClick={() => { setPossMode("fla"); setShowPossModal(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "12px", display:"flex", alignItems:"center", justifyContent:"center" }}
          >
            <img src={flaEscudo} alt="Flamengo" style={{ height: 48, width: "auto", objectFit: "contain" }}/>
          </button>
          <button
            onClick={() => { setPossMode("adv"); setShowPossModal(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <AdvLogo height={48}/>
          </button>
        </div>
        <button
          onClick={() => { setPossMode("pause"); setShowPossModal(false); }}
          style={{
            marginTop: 8, background: "none", border: "none",
            color: "#FFF", fontFamily: "'Bebas Neue'", fontSize: 13,
            letterSpacing: 2, cursor: "pointer", width: "100%", padding: "7px 0",
          }}
        >
          PULAR
        </button>
      </div>
    </div>
  );
}
