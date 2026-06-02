import { useState, useRef, useEffect } from "react";
import { CAMPO_L_B64 }       from "../../assets/base64";
import { DEFAULT_FORMATION } from "../../constants/squads";
import { C }                 from "../../constants/colors";
import { lBtn }              from "../../utils/styles";
import camisa1Img            from "../../../imagens/camisa_1.png";
import camisa2Img            from "../../../imagens/camisa_2.png";
import camisaGLImg           from "../../../imagens/camisa_GL.png";

function buildAssigned(players) {
  const gks    = players.filter(p => p.pos === "Goleiro");
  const others = players.filter(p => p.pos !== "Goleiro");
  return DEFAULT_FORMATION.map((slot, i) => ({
    ...slot,
    player: i === 0 ? (gks[0] || null) : (others[i - 1] || null),
  }));
}

export default function TacticalBoard({ players }) {
  const campoRef    = useRef(null);
  const [assigned,   setAssigned]   = useState(() => buildAssigned(players));
  const [fixado,     setFixado]     = useState(false);
  const [subMode,    setSubMode]    = useState(false);
  const [subTarget,  setSubTarget]  = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uniform,    setUniform]    = useState(1);

  useEffect(() => { setAssigned(buildAssigned(players)); }, [players]);

  const onMouseDown = (e, id) => {
    if (fixado) return;
    if (subMode) { setSubTarget(id); return; }
    e.preventDefault();
    const rect = campoRef.current.getBoundingClientRect();
    const slot = assigned.find(p => p.id === id);
    const px   = (slot.x / 100) * rect.width;
    const py   = (slot.y / 100) * rect.height;
    setDragOffset({ x: e.clientX - rect.left - px, y: e.clientY - rect.top - py });
    setDraggingId(id);
  };

  const onMouseMove = (e) => {
    if (!draggingId || !campoRef.current) return;
    const rect = campoRef.current.getBoundingClientRect();
    const nx = Math.max(2, Math.min(98, ((e.clientX - rect.left - dragOffset.x) / rect.width)  * 100));
    const ny = Math.max(2, Math.min(98, ((e.clientY - rect.top  - dragOffset.y) / rect.height) * 100));
    setAssigned(prev => prev.map(p => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
  };

  const onMouseUp = () => setDraggingId(null);

  const onFieldIds = new Set(assigned.map(s => s.player?.id).filter(Boolean));
  const bench      = players.filter(p => !onFieldIds.has(p.id));

  const doSub = (newPlayer) => {
    setAssigned(prev => prev.map(s => s.id === subTarget ? { ...s, player: newPlayer } : s));
    setSubMode(false); setSubTarget(null);
  };

  const reset = () => { setAssigned(buildAssigned(players)); setFixado(false); setSubMode(false); setSubTarget(null); };

  const jerseyFor = (slot) => {
    if (slot.isGK) return camisaGLImg;
    return uniform === 1 ? camisa1Img : camisa2Img;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

      {/* Controls */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => { setFixado(f => !f); setSubMode(false); setSubTarget(null); }} style={{ ...lBtn(fixado), fontSize: 11, padding: "3px 9px" }}>
          {fixado ? "DESBLOQUEAR" : "FIXAR"}
        </button>
        <button onClick={() => { setSubMode(s => !s); setSubTarget(null); }} style={{ ...lBtn(subMode), fontSize: 11, padding: "3px 9px" }}>
          {subMode ? "CANCELAR" : "SUBSTITUIR"}
        </button>
        <button onClick={reset} style={{ ...lBtn(false), fontSize: 11, padding: "3px 9px" }}>RESET</button>
        <div style={{ width: 1, height: 16, background: "#D0D0D0", flexShrink: 0 }}/>
        <button onClick={() => setUniform(1)} style={{ ...lBtn(uniform === 1), fontSize: 11, padding: "3px 9px" }}>UNIFORME 1</button>
        <button onClick={() => setUniform(2)} style={{ ...lBtn(uniform === 2), fontSize: 11, padding: "3px 9px" }}>UNIFORME 2</button>
        {subMode && (
          <span style={{ fontSize: 10, color: C.red, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>
            {subTarget ? "Escolha no banco abaixo" : "Clique em um jogador no campo"}
          </span>
        )}
      </div>

      {/* Campo */}
      <div
        ref={campoRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: "relative", width: "100%", paddingBottom: "67%",
          overflow: "hidden", cursor: draggingId ? "grabbing" : "default",
          userSelect: "none", borderRadius: 6, border: "1px solid #C8C8C8",
        }}
      >
        <img src={`data:image/jpeg;base64,${CAMPO_L_B64}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="campo" draggable={false}/>
        {assigned.map(slot => (
          <div
            key={slot.id}
            onMouseDown={e => onMouseDown(e, slot.id)}
            style={{
              position: "absolute", left: slot.x + "%", top: slot.y + "%",
              transform: "translate(-50%,-50%)",
              cursor: fixado ? "default" : subMode ? "pointer" : "grab",
              zIndex: draggingId === slot.id ? 10 : 1,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              filter: subTarget === slot.id ? `drop-shadow(0 0 5px ${C.red})` : "drop-shadow(0 1px 3px rgba(0,0,0,.6))",
            }}
          >
            <img src={jerseyFor(slot)} draggable={false} style={{ width: 28, height: 28, objectFit: "contain" }}/>
            <div style={{ background: "rgba(0,0,0,.78)", color: "#fff", fontSize: 7.5, padding: "1px 4px", borderRadius: 3, maxWidth: 52, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>
              {slot.player ? (slot.player.number ? `${slot.player.number} ` : "") + slot.player.name.split(" ")[0] : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Banco — sempre visível, sem jogadores que estão em campo */}
      <div style={{ border: `1px solid ${subMode ? C.red : C.bdr}`, borderRadius: 5, padding: "6px 8px", background: subMode ? "#FFF5F5" : "#FAFAFA", transition: "all .2s" }}>
        <div style={{ fontSize: 9, color: subMode ? C.red : C.txtM, fontFamily: "'Bebas Neue'", letterSpacing: 2, marginBottom: 5 }}>
          {subMode ? "BANCO — CLIQUE PARA SUBSTITUIR" : "BANCO DE RESERVAS"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {bench.map(pl => (
            <button
              key={pl.id}
              onClick={() => { if (subMode) doSub(pl); }}
              style={{
                background: "#FFF", border: `1px solid ${subMode ? C.bdr2 : C.bdr}`,
                borderRadius: 4, padding: "3px 7px",
                cursor: subMode ? "pointer" : "default",
                fontFamily: "'Bebas Neue'", fontSize: 10, letterSpacing: 0.5,
                display: "flex", alignItems: "center", gap: 4,
                opacity: subMode ? 1 : 0.7,
              }}
            >
              <img src={pl.pos === "Goleiro" ? camisaGLImg : (uniform === 1 ? camisa1Img : camisa2Img)} style={{ width: 14, height: 14, objectFit: "contain" }}/>
              <span>{pl.number ? `#${pl.number} ` : ""}{pl.name.split(" ")[0]}</span>
            </button>
          ))}
          {bench.length === 0 && (
            <span style={{ fontSize: 10, color: C.txtM, fontFamily: "'Rajdhani'" }}>Nenhum no banco</span>
          )}
        </div>
      </div>
    </div>
  );
}
