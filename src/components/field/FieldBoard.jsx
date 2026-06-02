import { useState, useRef, useEffect } from "react";
import { CAMPO_L_B64 }       from "../../assets/base64";
import { DEFAULT_FORMATION } from "../../constants/squads";
import { C }                 from "../../constants/colors";
import { lBtn }              from "../../utils/styles";
import camisa1Img            from "../../../imagens/camisa_1.png";
import camisa2Img            from "../../../imagens/camisa_2.png";
import camisaGLImg           from "../../../imagens/camisa_GL.png";

const LS_DIM = "rubromap_dim_opacity";

function buildAssigned(players) {
  const gks    = players.filter(p => p.pos === "Goleiro");
  const others = players.filter(p => p.pos !== "Goleiro");
  return DEFAULT_FORMATION.map((slot, i) => ({
    ...slot,
    player: i === 0 ? (gks[0] || null) : (others[i - 1] || null),
  }));
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: "#D0D0D0", flexShrink: 0 }}/>;
}

export default function FieldBoard({
  zones, selZone, onZone, flashZ, tZStats, maxZ,
  players, selPl, setSelPl,
}) {
  const campoRef   = useRef(null);
  const draggedRef = useRef(false);

  const [assigned,   setAssigned]   = useState(() => buildAssigned(players));
  const [fixado,     setFixado]     = useState(false);
  const [subMode,    setSubMode]    = useState(false);
  const [subTarget,  setSubTarget]  = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uniform,    setUniform]    = useState(1);
  const [showPl,     setShowPl]     = useState(true);
  const [dimOpacity, setDimOpacity] = useState(() => {
    try { const v = parseFloat(localStorage.getItem(LS_DIM)); return isNaN(v) ? 0.4 : Math.min(0.9, Math.max(0.05, v)); } catch { return 0.4; }
  });

  useEffect(() => {
    try { localStorage.setItem(LS_DIM, String(dimOpacity)); } catch {}
  }, [dimOpacity]);

  useEffect(() => { setAssigned(buildAssigned(players)); }, [players]);

  /* ── Drag ───────────────────────────────────────── */
  const onPlayerMouseDown = (e, slotId) => {
    if (!showPl) return;
    if (subMode) { setSubTarget(slotId); return; }
    if (fixado) return;
    e.preventDefault();
    e.stopPropagation();
    draggedRef.current = false;
    const rect = campoRef.current.getBoundingClientRect();
    const slot = assigned.find(s => s.id === slotId);
    setDragOffset({
      x: e.clientX - rect.left - (slot.x / 100) * rect.width,
      y: e.clientY - rect.top  - (slot.y / 100) * rect.height,
    });
    setDraggingId(slotId);
  };

  const onMouseMove = (e) => {
    if (!draggingId || !campoRef.current) return;
    draggedRef.current = true;
    const rect = campoRef.current.getBoundingClientRect();
    const nx = Math.max(2, Math.min(98, ((e.clientX - rect.left - dragOffset.x) / rect.width)  * 100));
    const ny = Math.max(2, Math.min(98, ((e.clientY - rect.top  - dragOffset.y) / rect.height) * 100));
    setAssigned(prev => prev.map(p => p.id === draggingId ? { ...p, x: nx, y: ny } : p));
  };

  const onMouseUp = () => setDraggingId(null);

  const onPlayerClick = (e, slot) => {
    e.stopPropagation();
    if (draggedRef.current || subMode || !slot.player) return;
    setSelPl(slot.player.id === selPl ? null : slot.player.id);
  };

  /* ── Substitution ───────────────────────────────── */
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

      {/* ── Barra de controles ── */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShowPl(s => !s)} style={{ ...lBtn(showPl), fontSize: 11, padding: "3px 9px" }}>
          {showPl ? "OCULTAR JOGADORES" : "EXIBIR JOGADORES"}
        </button>
        {showPl && (
          <>
            <Sep/>
            <button onClick={() => { setFixado(f => !f); setSubMode(false); setSubTarget(null); }} style={{ ...lBtn(fixado), fontSize: 11, padding: "3px 9px" }}>
              {fixado ? "DESBLOQUEAR" : "FIXAR"}
            </button>
            <button onClick={() => { setSubMode(s => !s); setSubTarget(null); }} style={{ ...lBtn(subMode), fontSize: 11, padding: "3px 9px" }}>
              {subMode ? "CANCELAR" : "SUBSTITUIR"}
            </button>
            <button onClick={reset} style={{ ...lBtn(false), fontSize: 11, padding: "3px 9px" }}>RESET</button>
            <Sep/>
            <button onClick={() => setUniform(1)} style={{ ...lBtn(uniform === 1), fontSize: 11, padding: "3px 9px" }}>UNIFORME 1</button>
            <button onClick={() => setUniform(2)} style={{ ...lBtn(uniform === 2), fontSize: 11, padding: "3px 9px" }}>UNIFORME 2</button>
            <Sep/>
            <span style={{ fontSize: 9, color: C.txtM, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, flexShrink: 0 }}>DIM SELEÇÃO:</span>
            <input
              type="range" min={0.05} max={0.9} step={0.05} value={dimOpacity}
              onChange={e => setDimOpacity(parseFloat(e.target.value))}
              style={{ width: 64, cursor: "pointer", accentColor: C.red, flexShrink: 0 }}
            />
            <span style={{ fontSize: 9, fontFamily: "monospace", color: C.txtM, minWidth: 28, flexShrink: 0 }}>{Math.round(dimOpacity * 100)}%</span>
          </>
        )}
        {subMode && (
          <span style={{ fontSize: 10, color: C.red, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>
            {subTarget ? "Escolha no banco abaixo" : "Clique em um jogador no campo"}
          </span>
        )}
      </div>

      {/* ── Campo integrado ── */}
      <div
        ref={campoRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: "relative", width: "100%",
          cursor: draggingId ? "grabbing" : "default",
          userSelect: "none",
        }}
      >
        {/* Imagem + zonas — com overflow:hidden para clipar nas bordas do campo */}
        <div style={{ position: "relative", lineHeight: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #D0D0D0" }}>
          <img
            src={`data:image/jpeg;base64,${CAMPO_L_B64}`}
            style={{ display: "block", width: "100%", height: "auto" }}
            alt="campo" draggable={false}
          />
          <div style={{ position: "absolute", inset: 0 }}>
            {zones.map(z => {
              const tot = Object.values(tZStats[z.id] || {}).reduce((a, b) => a + b, 0);
              const intensity = tot / Math.max(maxZ, 1);
              const sel   = selZone === z.id;
              const flash = flashZ  === z.id;
              return (
                <div
                  key={z.id}
                  className={"zb" + (flash ? " fz" : "")}
                  onClick={() => onZone(z.id)}
                  title={z.name}
                  style={{
                    position: "absolute",
                    left: (z.x1 * 100) + "%", top: (z.y1 * 100) + "%",
                    width: ((z.x2 - z.x1) * 100) + "%", height: ((z.y2 - z.y1) * 100) + "%",
                    background: sel
                      ? "rgba(232,0,28,.42)"
                      : tot > 0
                      ? `rgba(232,0,28,${(0.07 + intensity * 0.38).toFixed(2)})`
                      : "rgba(0,0,0,.01)",
                    border: sel
                      ? "2px solid rgba(232,0,28,.9)"
                      : "1px solid rgba(255,255,255,.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {tot > 0 && (
                    <span style={{ background: "rgba(0,0,0,.62)", color: "#fff", borderRadius: 5, padding: "0 4px", fontSize: 9, fontWeight: 700, fontFamily: "monospace", pointerEvents: "none" }}>
                      {tot}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Jogadores — camada separada SEM overflow:hidden para nomes não serem cortados */}
        {showPl && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {assigned.map(slot => {
              const isSelected = slot.player?.id != null && slot.player.id === selPl;
              return (
                <div
                  key={slot.id}
                  onMouseDown={e => onPlayerMouseDown(e, slot.id)}
                  onClick={e => onPlayerClick(e, slot)}
                  style={{
                    position: "absolute",
                    left: slot.x + "%", top: slot.y + "%",
                    transform: "translate(-50%,-50%)",
                    pointerEvents: "auto",
                    cursor: fixado ? "default" : subMode ? "pointer" : "grab",
                    zIndex: draggingId === slot.id ? 10 : 2,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                    opacity: selPl !== null && slot.player?.id != null && slot.player.id !== selPl ? dimOpacity : 1,
                    transition: "opacity .2s",
                    filter: subTarget === slot.id
                      ? `drop-shadow(0 0 6px ${C.red})`
                      : isSelected
                      ? `drop-shadow(0 0 5px ${C.gold})`
                      : "drop-shadow(0 1px 3px rgba(0,0,0,.6))",
                  }}
                >
                  <img src={jerseyFor(slot)} draggable={false} style={{ width: 40, height: 40, objectFit: "contain" }}/>
                  <div style={{
                    background: isSelected ? C.gold + "DD" : "rgba(0,0,0,.82)",
                    color: "#fff", fontSize: 10.5, padding: "2px 6px", borderRadius: 3,
                    maxWidth: 72, textAlign: "center", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                    fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
                  }}>
                    {slot.player
                      ? (slot.player.number ? `${slot.player.number} ` : "") + slot.player.name.split(" ")[0]
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nome da zona selecionada */}
      {selZone !== null && (
        <div style={{ textAlign: "center", fontSize: 10, color: C.gold, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>
          {zones[selZone]?.name}
        </div>
      )}

      {/* ── Banco de reservas ── */}
      <div style={{ border: `1px solid ${subMode ? C.red : C.bdr}`, borderRadius: 5, padding: "6px 8px", background: subMode ? "#FFF5F5" : "#FAFAFA", transition: "border-color .2s, background .2s" }}>
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
                opacity: subMode ? 1 : 0.75,
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
