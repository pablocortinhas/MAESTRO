import { useState, useRef } from "react";
import { C }              from "../../constants/colors";
import golImg             from "../../../imagens/gol.png";

function getZoneLabel(e, containerRect, imgEl) {
  if (!imgEl) return "";
  const ir = imgEl.getBoundingClientRect();
  const cx = e.clientX, cy = e.clientY;
  if (cx >= ir.left && cx <= ir.right && cy >= ir.top && cy <= ir.bottom) {
    const rx = (cx - ir.left) / ir.width;
    const ry = (cy - ir.top) / ir.height;
    const col = rx < 1/3 ? "Esq" : rx < 2/3 ? "Centro" : "Dir";
    const row = ry < 1/3 ? "Alto" : ry < 2/3 ? "Meio" : "Baixo";
    return (row === "Meio" && col === "Centro") ? "Centro" : `${col}-${row}`;
  }
  if (cy < ir.top) {
    const hx = (cx - containerRect.left) / containerRect.width;
    return hx < 0.33 ? "Fora-Acima-Esq" : hx < 0.67 ? "Fora-Acima" : "Fora-Acima-Dir";
  }
  return cx < ir.left ? "Fora-Esq" : "Fora-Dir";
}

export default function GoalModal({ goalModal, setGoalModal, registerWithData, setScore }) {
  const [ball, setBall] = useState(null);
  const imgRef          = useRef(null);

  if (!goalModal) return null;
  const { addScore, ballColor, title, actId, zoneId } = goalModal;

  const dotColor   = ballColor === "vermelha" ? "#DC2626" : "#059669";
  const titleColor = dotColor;

  const handleSelect = (posLabel, gx=null, gy=null) => {
    if (addScore === "home") setScore(s => ({ ...s, fla: s.fla + 1 }));
    else if (addScore === "away") setScore(s => ({ ...s, adv: s.adv + 1 }));
    registerWithData(actId, zoneId, posLabel ? ` · ${posLabel}` : "", gx, gy);
    setGoalModal(null);
    setBall(null);
  };

  const handleAreaClick = (e) => {
    if (ball) return;
    const rect    = e.currentTarget.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();
    // Dot visual position inside modal (relative to full clickable container)
    const xPct = (e.clientX - rect.left) / rect.width * 100;
    const yPct = (e.clientY - rect.top)  / rect.height * 100;
    // Saved coords: relative to the GOAL IMAGE (0-1 on image, outside for misses)
    // gy clamped to max 1.0 — can't finalize below the goal's bottom line
    const gx = (e.clientX - imgRect.left) / imgRect.width;
    const gy = Math.min((e.clientY - imgRect.top) / imgRect.height, 0.75);
    const label = getZoneLabel(e, rect, imgRef.current);
    setBall({ xPct, yPct });
    setTimeout(() => handleSelect(label, gx, gy), 650);
  };

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={() => { setGoalModal(null); setBall(null); }}
    >
      <div
        style={{ background:C.card, border:`1px solid ${C.bdr}`, borderRadius:12, padding:"18px 20px", width:400, boxShadow:"0 8px 32px rgba(0,0,0,.28)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize:13, color:titleColor, letterSpacing:3, fontFamily:"'Bebas Neue'", marginBottom:4, textAlign:"center" }}>
          {title || "POSIÇÃO DA BOLA"}
        </div>
        <div style={{ fontSize:9, color:C.txtM, letterSpacing:1.5, fontFamily:"'Rajdhani',sans-serif", fontWeight:600, textAlign:"center", marginBottom:12 }}>
          CLIQUE ONDE FOI A BOLA
        </div>

        {/* Área clicável: margem escura acima e nas laterais + imagem do gol */}
        <div
          onClick={handleAreaClick}
          style={{
            position:"relative", cursor: ball ? "default" : "crosshair",
            userSelect:"none", background:"#111",
            padding:"38px 28px 0",
            borderRadius:6, overflow:"hidden",
            border:`1px solid ${titleColor}33`,
          }}
        >
          <img
            ref={imgRef}
            src={golImg}
            draggable={false}
            style={{ display:"block", width:"100%", height:"auto" }}
            alt="gol"
          />
          {ball && (
            <div
              style={{
                position:"absolute",
                left:`calc(${ball.xPct}% - 15px)`,
                top:`calc(${ball.yPct}% - 15px)`,
                width:30, height:30,
                borderRadius:"50%",
                background: dotColor,
                border:"2.5px solid rgba(255,255,255,.8)",
                boxShadow:`0 0 0 3px ${dotColor}55, 0 2px 8px rgba(0,0,0,.7)`,
                pointerEvents:"none",
                zIndex:10,
              }}
            />
          )}
        </div>

        <button
          onClick={() => handleSelect("")}
          style={{
            marginTop:10, display:"block", width:"100%",
            textAlign:"center", background:"transparent",
            border:`1px solid ${C.bdr}`, color:C.txtM,
            borderRadius:6, padding:"7px 0",
            fontFamily:"'Bebas Neue'", fontSize:12,
            letterSpacing:2, cursor:"pointer",
          }}
        >
          REGISTRAR SEM POSIÇÃO
        </button>
      </div>
    </div>
  );
}
