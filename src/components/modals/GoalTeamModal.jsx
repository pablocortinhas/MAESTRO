import { useState } from "react";
import { C }        from "../../constants/colors";
import flaEscudoImg from "../../../imagens/Fla_Escudo.png";
import AdvLogo      from "../common/AdvLogo";

export default function GoalTeamModal({ show, onSelect, onClose }) {

  if (!show) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
        zIndex:9100, display:"flex", alignItems:"center", justifyContent:"center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#FFF", border:`1px solid ${C.bdr}`, borderRadius:12,
          padding:"22px 28px", boxShadow:"0 8px 32px rgba(0,0,0,.32)",
          display:"flex", flexDirection:"column", alignItems:"center", gap:16,
        }}
      >
        <div style={{
          fontFamily:"'Bebas Neue'", fontSize:16, letterSpacing:3, color:"#1A1A1A",
        }}>
          GOL DE QUEM?
        </div>

        <div style={{ display:"flex", gap:20 }}>
          {/* ── Flamengo ── */}
          <TeamBtn
            onClick={() => onSelect("home")}
            bg="#FFF5F5" bgHover="#FFECEC"
            border={`2px solid ${C.red}`}
          >
            <img src={flaEscudoImg} alt="FLA" style={{ width:56, height:"auto", objectFit:"contain" }} />
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:2, color:C.red }}>
              FLAMENGO
            </span>
          </TeamBtn>

          {/* ── Adversário ── */}
          <TeamBtn
            onClick={() => onSelect("away")}
            bg="#F5F5F5" bgHover="#E8E8E8"
            border="2px solid #888"
          >
            <AdvLogo height={56}/>
          </TeamBtn>
        </div>
      </div>
    </div>
  );
}

function TeamBtn({ onClick, bg, bgHover, border, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? bgHover : bg,
        border, borderRadius:10, padding:"14px 20px",
        display:"flex", flexDirection:"column", alignItems:"center", gap:10,
        cursor:"pointer", minWidth:120, transition:"background .12s",
      }}
    >
      {children}
    </button>
  );
}

