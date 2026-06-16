import { useState, useRef, useEffect, useCallback } from "react";
import { ZONES_50 }          from "../../constants/zones";
import { C }                 from "../../constants/colors";
import { lBtn }              from "../../utils/styles";
import camisa1Img            from "../../../imagens/camisa_1.png";
import camisa2Img            from "../../../imagens/camisa_2.png";
import camisaGLImg           from "../../../imagens/camisa_GL.png";

const _camposGlob = import.meta.glob("../../../imagens/campo*.png", { eager: true });
const CAMPOS = Object.entries(_camposGlob)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, mod], i) => ({ id: i + 1, src: mod.default, label: `Campo ${i + 1}` }));

const LS_DIM    = "maestro_dim_opacity";
const LS_CAMPO  = "maestro_campo_idx";
const LS_BOUNDS = "maestro_field_bounds";
const LS_PL_SC  = "maestro_player_shortcuts";

function loadPlShortcuts() {
  try { const s = localStorage.getItem(LS_PL_SC); if (s) return JSON.parse(s); } catch {}
  return {};
}

const DEFAULT_BOUNDS = { x0: 0.03, y0: 0.05, x1: 0.97, y1: 0.95 };

function loadBounds() {
  try { const r = localStorage.getItem(LS_BOUNDS); if (r) return JSON.parse(r); } catch {}
  return DEFAULT_BOUNDS;
}

/* Calcula as 50 zonas a partir dos limites calibrados */
function computeZones(b) {
  const cw = (b.x1 - b.x0) / 10;
  const ch = (b.y1 - b.y0) / 5;
  const arr = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const zx1 = b.x0 + col * cw, zy1 = b.y0 + row * ch;
      arr.push({ id: row*10+col, x1:zx1, x2:zx1+cw, y1:zy1, y2:zy1+ch, cx:zx1+cw/2, cy:zy1+ch/2 });
    }
  }
  return arr;
}

/* ── Cor do heatmap de jogador (dourado) ── */
function playerHeatColor(t) {
  const stops = [
    [0.00, [100, 200, 255]],
    [0.35, [255, 230,  50]],
    [0.65, [255, 140,   0]],
    [1.00, [220,  30,   0]],
  ];
  for (let i = 1; i < stops.length; i++) {
    const [t0, c0] = stops[i - 1];
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return stops[stops.length - 1][1];
}

/* ── Canvas de calor por jogador ── */
function PlayerHeat({ hist, selPl }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !selPl) { canvas && canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); return; }
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pts = hist.filter(h => h.playerId === selPl && h.x != null && h.y != null);
    if (pts.length === 0) return;

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const oc = off.getContext("2d");
    oc.globalCompositeOperation = "lighter";
    const r = Math.min(W, H) * 0.065;

    pts.forEach(({ x, y }) => {
      const cx = x * W, cy = y * H;
      const g = oc.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,    "rgba(255,255,255,0.65)");
      g.addColorStop(0.45, "rgba(255,255,255,0.22)");
      g.addColorStop(1,    "rgba(255,255,255,0)");
      oc.fillStyle = g;
      oc.beginPath(); oc.arc(cx, cy, r, 0, Math.PI * 2); oc.fill();
    });

    const src = oc.getImageData(0, 0, W, H).data;
    const dst = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const raw = src[i * 4];
      if (raw < 5) continue;
      const t = Math.min(1, raw / 160);
      const [rv, gv, bv] = playerHeatColor(t);
      dst.data[i * 4]     = rv;
      dst.data[i * 4 + 1] = gv;
      dst.data[i * 4 + 2] = bv;
      dst.data[i * 4 + 3] = Math.min(255, Math.round(20 + t * 200));
    }
    ctx.putImageData(dst, 0, 0);
  }, [hist, selPl]);

  return (
    <canvas ref={ref} width={900} height={594}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }}/>
  );
}

function Sep() { return <div style={{ width:1, height:16, background:"#D0D0D0", flexShrink:0 }}/>; }

export default function FieldBoard({
  flashZ, players, selPl, setSelPl,
  selAct, onFieldClick, catKey, hist,
  assigned, setAssigned, fixado, setFixado,
  subMode, setSubMode, subTarget, setSubTarget,
  uniform, setUniform, formSaved, saveFormation, reset,
}) {
  const campoRef   = useRef(null);
  const draggedRef = useRef(false);

  const [draggingId,  setDraggingId]  = useState(null);
  const [dragOffset,  setDragOffset]  = useState({ x:0, y:0 });
  const [showPl,      setShowPl]      = useState(true);
  const [hoverZone,   setHoverZone]   = useState(null);
  const [dimOpacity,  setDimOpacity]  = useState(() => {
    try { const v = parseFloat(localStorage.getItem(LS_DIM)); return isNaN(v) ? 0.4 : Math.min(0.9, Math.max(0.05, v)); }
    catch { return 0.4; }
  });
  const [campoIdx, setCampoIdx] = useState(() => {
    try { const v = parseInt(localStorage.getItem(LS_CAMPO), 10); return isNaN(v) ? 0 : Math.min(v, Math.max(0, CAMPOS.length - 1)); }
    catch { return 0; }
  });
  const [showCampoSel, setShowCampoSel] = useState(false);
  const [calibrating,  setCalibrating]  = useState(false);
  const [calibSaved,   setCalibSaved]   = useState(false);
  const [bounds,       setBounds]       = useState(loadBounds);
  const [dragCorner,   setDragCorner]   = useState(null);
  const [plShortcuts,  setPlShortcuts]  = useState(loadPlShortcuts);
  const [assigningSc,  setAssigningSc]  = useState(false);
  const [scTarget,     setScTarget]     = useState(null);

  /* Zonas 50 recalculadas com os limites calibrados */
  const dynZones = computeZones(bounds);

  const [campoAR,   setCampoAR]   = useState("3/2");
  const [campoRot,  setCampoRot]  = useState(false);
  const [campoCssW, setCampoCssW] = useState("66%");
  const [campoCssH, setCampoCssH] = useState("151%");

  useEffect(() => { try { localStorage.setItem(LS_DIM,   String(dimOpacity)); } catch {} }, [dimOpacity]);
  useEffect(() => { try { localStorage.setItem(LS_CAMPO, String(campoIdx));   } catch {} }, [campoIdx]);
  useEffect(() => { try { localStorage.setItem(LS_PL_SC, JSON.stringify(plShortcuts)); } catch {} }, [plShortcuts]);
  useEffect(() => { setCampoRot(false); }, [campoIdx]);

  const setPlShortcut = (id, key) => setPlShortcuts(prev => {
    const next = { ...prev };
    if (!key) delete next[id]; else next[id] = key;
    return next;
  });

  /* ── Captura da tecla enquanto define o atalho de um jogador ── */
  useEffect(() => {
    if (scTarget == null) return;
    const handler = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.key === "Escape") { setScTarget(null); return; }
      if (e.key === "Backspace" || e.key === "Delete") { setPlShortcut(scTarget, ""); setScTarget(null); return; }
      if (["Control","Shift","Alt","Meta","CapsLock","Tab"].includes(e.key)) return;
      setPlShortcut(scTarget, e.key.length === 1 ? e.key.toUpperCase() : e.key);
      setScTarget(null);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [scTarget]);

  /* ── Uso dos atalhos para selecionar jogadores ── */
  useEffect(() => {
    if (assigningSc) return;
    const handler = (e) => {
      if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const match = Object.entries(plShortcuts).find(([, k]) => k && (k.toUpperCase() === key || k === e.key));
      if (!match) return;
      e.preventDefault();
      const pid = Number(match[0]);
      setSelPl(pid === selPl ? null : pid);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [assigningSc, plShortcuts, selPl, setSelPl]);

  useEffect(() => {
    if (!showCampoSel) return;
    const close = () => setShowCampoSel(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showCampoSel]);

  /* ── Drag ── */
  const onPlayerMouseDown = (e, slotId) => {
    if (!showPl) return;
    if (assigningSc) return; // não arrastar em modo de atalho
    if (selAct && !subMode) return; // não arrastar em modo de registro
    if (subMode) { setSubTarget(slotId); return; }
    if (fixado) return;
    e.preventDefault(); e.stopPropagation();
    draggedRef.current = false;
    const rect = campoRef.current.getBoundingClientRect();
    const slot = assigned.find(s => s.id === slotId);
    setDragOffset({ x: e.clientX - rect.left - (slot.x / 100) * rect.width, y: e.clientY - rect.top - (slot.y / 100) * rect.height });
    setDraggingId(slotId);
  };

  const onMouseMove = (e) => {
    if (!campoRef.current) return;
    const rect = campoRef.current.getBoundingClientRect();

    if (dragCorner) {
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
      const M = 0.05;
      setBounds(b => {
        if (dragCorner === "tl") return { ...b, x0: Math.min(nx, b.x1-M), y0: Math.min(ny, b.y1-M) };
        if (dragCorner === "tr") return { ...b, x1: Math.max(nx, b.x0+M), y0: Math.min(ny, b.y1-M) };
        if (dragCorner === "bl") return { ...b, x0: Math.min(nx, b.x1-M), y1: Math.max(ny, b.y0+M) };
        if (dragCorner === "br") return { ...b, x1: Math.max(nx, b.x0+M), y1: Math.max(ny, b.y0+M) };
        return b;
      });
      return;
    }

    if (!draggingId) return;
    draggedRef.current = true;
    const nx = Math.max(2, Math.min(98, ((e.clientX - rect.left - dragOffset.x) / rect.width)  * 100));
    const ny = Math.max(2, Math.min(98, ((e.clientY - rect.top  - dragOffset.y) / rect.height) * 100));
    setAssigned(prev => prev.map(p => p.id === draggingId ? { ...p, x:nx, y:ny } : p));
  };

  const onMouseUp = () => { setDraggingId(null); setDragCorner(null); };

  const onPlayerClick = (e, slot) => {
    e.stopPropagation();
    if (draggedRef.current) return;
    if (assigningSc) {
      if (!slot.player) return;
      setScTarget(t => t === slot.player.id ? null : slot.player.id);
      return;
    }
    if (selAct && !subMode) {
      const px = slot.x / 100, py = slot.y / 100;
      const zone = dynZones.find(z => px >= z.x1 && px < z.x2 && py >= z.y1 && py < z.y2) || dynZones[22];
      onFieldClick?.(px, py, zone.id);
      return;
    }
    if (subMode || !slot.player) return;
    setSelPl(slot.player.id === selPl ? null : slot.player.id);
  };

  const onZoneClick = useCallback((z) => {
    onFieldClick?.(z.cx, z.cy, z.id);
  }, [onFieldClick]);

  const jerseyFor  = slot => slot.isGK ? camisaGLImg : (uniform === 1 ? camisa1Img : camisa2Img);

  const campoSrc = CAMPOS[campoIdx]?.src;

  const handleImgLoad = (e) => {
    const { naturalWidth:nw, naturalHeight:nh } = e.target;
    const portrait = nh > nw;
    setCampoRot(portrait);
    if (portrait) {
      setCampoAR(`${nh}/${nw}`);
      setCampoCssW(`${(nw/nh*100).toFixed(3)}%`);
      setCampoCssH(`${(nh/nw*100).toFixed(3)}%`);
    } else {
      setCampoAR(`${nw}/${nh}`);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>

      {/* ── Barra de controles ── */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
        <button onClick={() => setShowPl(s => !s)} style={{ ...lBtn(showPl), fontSize:11, padding:"3px 9px" }}>
          {showPl ? "OCULTAR" : "JOGADORES"}
        </button>

        {showPl && (
          <>
            <Sep/>
            <button onClick={() => { setFixado(f=>!f); setSubMode(false); setSubTarget(null); }} style={{ ...lBtn(fixado), fontSize:11, padding:"3px 9px" }}>
              {fixado ? "DESBLOQ." : "FIXAR"}
            </button>
            <button onClick={() => { setSubMode(s=>!s); setSubTarget(null); setAssigningSc(false); setScTarget(null); }} style={{ ...lBtn(subMode), fontSize:11, padding:"3px 9px" }}>
              {subMode ? "CANCELAR" : "SUBSTITUIR"}
            </button>
            <button onClick={() => { setAssigningSc(s=>!s); setScTarget(null); setSubMode(false); setSubTarget(null); }} style={{ ...lBtn(assigningSc), fontSize:11, padding:"3px 9px" }}>
              {assigningSc ? "CONCLUIR" : "ATALHOS"}
            </button>
            <button onClick={reset} style={{ background:"#F5F5F5", border:"1px solid #D4D4D4", color:"#888", borderRadius:5, padding:"3px 9px", fontFamily:"'Bebas Neue'", fontSize:11, letterSpacing:2, cursor:"pointer" }}>
              RESET
            </button>
            <button onClick={saveFormation} style={{ ...lBtn(formSaved), fontSize:11, padding:"3px 9px", ...(formSaved ? { background:"#059669", borderColor:"#059669" } : {}) }}>
              {formSaved ? "SALVO ✓" : "SALVAR ESC."}
            </button>
            <Sep/>
            <button onClick={() => setUniform(u => u === 1 ? 2 : 1)} style={{ ...lBtn(false), fontSize:11, padding:"3px 9px" }}>
              UNI {uniform === 1 ? "1" : "2"}
            </button>
            <Sep/>
            <span style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, flexShrink:0 }}>DIM:</span>
            <input type="range" min={0.05} max={0.9} step={0.05} value={dimOpacity}
              onChange={e => setDimOpacity(parseFloat(e.target.value))}
              style={{ width:52, cursor:"pointer", accentColor:C.red, flexShrink:0 }}/>
          </>
        )}

        {/* Campo selector */}
        {CAMPOS.length > 0 && (
          <>
            <Sep/>
            <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCampoSel(s=>!s)} style={{ ...lBtn(showCampoSel), fontSize:11, padding:"3px 9px", display:"flex", alignItems:"center", gap:4 }}>
                <img src={campoSrc} style={{ width:22, height:14, objectFit:"cover", borderRadius:2, border:"1px solid #D0D0D0" }} alt=""/>
                {showCampoSel ? "▲" : "▼"}
              </button>
              {showCampoSel && (
                <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:500, background:"#FFF", border:"1px solid #E0E0E0", borderRadius:8, padding:8, boxShadow:"0 6px 20px rgba(0,0,0,.16)", display:"grid", gridTemplateColumns:"repeat(3,80px)", gap:6, minWidth:272 }}>
                  <div style={{ gridColumn:"1/-1", fontSize:9, color:C.txtM, fontFamily:"'Bebas Neue'", letterSpacing:2, marginBottom:2 }}>ESTILO DO CAMPO</div>
                  {CAMPOS.map((c,i) => (
                    <button key={c.id} onClick={() => { setCampoIdx(i); setShowCampoSel(false); }} style={{ background:i===campoIdx?"#FFF5F5":"#FAFAFA", border:`2px solid ${i===campoIdx?C.red:"#E0E0E0"}`, borderRadius:5, padding:4, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                      <img src={c.src} style={{ width:"100%", height:46, objectFit:"cover", borderRadius:3 }} alt={c.label}/>
                      <span style={{ fontSize:9, fontFamily:"'Bebas Neue'", letterSpacing:1, color:i===campoIdx?C.red:C.txtM }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {subMode && (
          <span style={{ fontSize:10, color:C.red, fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
            {subTarget ? "Escolha no banco" : "Clique no jogador"}
          </span>
        )}
        {assigningSc && (
          <span style={{ fontSize:10, color:C.red, fontFamily:"'Rajdhani',sans-serif", fontWeight:700 }}>
            {scTarget != null ? "Pressione a tecla (ESC cancela, ⌫ remove)" : "Clique num jogador para definir o atalho"}
          </span>
        )}

        <Sep/>
        <button
          onClick={() => {
            if (calibrating) {
              try { localStorage.setItem(LS_BOUNDS, JSON.stringify(bounds)); } catch {}
              setCalibSaved(true);
              setTimeout(() => setCalibSaved(false), 2000);
            }
            setCalibrating(c => !c);
          }}
          style={{
            ...lBtn(calibrating), fontSize:11, padding:"3px 9px",
            ...(calibSaved ? { background:"#059669", borderColor:"#059669" } : {}),
          }}
        >
          {calibSaved ? "SALVO ✓" : calibrating ? "SALVAR DELIMITAÇÃO" : "CALIBRAR CAMPO"}
        </button>
        {calibrating && (
          <button
            onClick={() => { setBounds(loadBounds()); }}
            style={{ background:"#F5F5F5", border:"1px solid #D4D4D4", color:"#888", borderRadius:5, padding:"3px 9px", fontFamily:"'Bebas Neue'", fontSize:11, letterSpacing:2, cursor:"pointer" }}
          >RESETAR</button>
        )}
      </div>

      {/* ── Campo ── */}
      <div
        ref={campoRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position:"relative",
          width:"100%",
          aspectRatio: campoAR,
          userSelect:"none",
          cursor: selAct ? "crosshair" : draggingId ? "grabbing" : "default",
        }}
      >
        {/* Imagem */}
        <div style={{ position:"absolute", inset:0, borderRadius:6, overflow:"hidden", border:"1px solid #C8C8C8" }}>
          {campoSrc ? (
            <img src={campoSrc} alt="campo" draggable={false} onLoad={handleImgLoad}
              style={campoRot ? {
                position:"absolute", width:campoCssW, height:campoCssH,
                left:"50%", top:"50%",
                transform:"translate(-50%,-50%) rotate(90deg)", objectFit:"fill",
              } : {
                position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill",
              }}
            />
          ) : (
            <div style={{ position:"absolute", inset:0, background:"#2D6A4F" }}/>
          )}
        </div>

        {/* ── Modo calibração: overlay com 4 cantos arrastáveis ── */}
        {calibrating && (
          <>
            {/* Sombra fora do campo delimitado */}
            <div style={{ position:"absolute", left:0, top:0, right:0, height:(bounds.y0*100).toFixed(3)+"%", background:"rgba(0,0,0,.55)", pointerEvents:"none", zIndex:8 }}/>
            <div style={{ position:"absolute", left:0, bottom:0, right:0, height:((1-bounds.y1)*100).toFixed(3)+"%", background:"rgba(0,0,0,.55)", pointerEvents:"none", zIndex:8 }}/>
            <div style={{ position:"absolute", left:0, top:(bounds.y0*100).toFixed(3)+"%", width:(bounds.x0*100).toFixed(3)+"%", height:((bounds.y1-bounds.y0)*100).toFixed(3)+"%", background:"rgba(0,0,0,.55)", pointerEvents:"none", zIndex:8 }}/>
            <div style={{ position:"absolute", right:0, top:(bounds.y0*100).toFixed(3)+"%", width:((1-bounds.x1)*100).toFixed(3)+"%", height:((bounds.y1-bounds.y0)*100).toFixed(3)+"%", background:"rgba(0,0,0,.55)", pointerEvents:"none", zIndex:8 }}/>

            {/* Retângulo da área delimitada */}
            <div style={{
              position:"absolute",
              left:(bounds.x0*100).toFixed(3)+"%", top:(bounds.y0*100).toFixed(3)+"%",
              width:((bounds.x1-bounds.x0)*100).toFixed(3)+"%", height:((bounds.y1-bounds.y0)*100).toFixed(3)+"%",
              border:"2px dashed rgba(255,220,0,.95)", boxSizing:"border-box",
              pointerEvents:"none", zIndex:9,
            }}/>

            {/* 4 cantos arrastáveis */}
            {[
              { id:"tl", cx:bounds.x0, cy:bounds.y0, cursor:"nwse-resize" },
              { id:"tr", cx:bounds.x1, cy:bounds.y0, cursor:"nesw-resize" },
              { id:"bl", cx:bounds.x0, cy:bounds.y1, cursor:"nesw-resize" },
              { id:"br", cx:bounds.x1, cy:bounds.y1, cursor:"nwse-resize" },
            ].map(c => (
              <div
                key={c.id}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDragCorner(c.id); }}
                style={{
                  position:"absolute",
                  left:(c.cx*100).toFixed(3)+"%", top:(c.cy*100).toFixed(3)+"%",
                  transform:"translate(-50%,-50%)",
                  width:18, height:18,
                  background:"rgba(255,220,0,.95)",
                  border:"2px solid #FFF",
                  borderRadius:4,
                  cursor:c.cursor,
                  zIndex:11,
                  boxShadow:"0 2px 8px rgba(0,0,0,.7)",
                }}
              />
            ))}

            {/* Instruções */}
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              background:"rgba(0,0,0,.78)", color:"#FFE000",
              fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:2,
              padding:"7px 16px", borderRadius:5,
              pointerEvents:"none", zIndex:12, whiteSpace:"nowrap",
              textAlign:"center", lineHeight:1.5,
            }}>
              ARRASTE OS CANTOS AMARELOS<br/>
              <span style={{ fontSize:10, color:"#FFF", letterSpacing:1 }}>PARA ALINHAR COM AS LINHAS DO CAMPO</span>
            </div>
          </>
        )}

        {/* Grade 50 zonas — visível apenas quando selAct está ativo */}
        {selAct && (
          <div style={{ position:"absolute", inset:0, zIndex:3 }}>
            {dynZones.map(z => {
              const isHover = hoverZone === z.id;
              return (
                <div
                  key={z.id}
                  className="zb"
                  onClick={e => { e.stopPropagation(); onZoneClick(z); }}
                  onMouseEnter={() => setHoverZone(z.id)}
                  onMouseLeave={() => setHoverZone(null)}
                  title={z.name}
                  style={{
                    position:"absolute",
                    left:   (z.x1 * 100).toFixed(3) + "%",
                    top:    (z.y1 * 100).toFixed(3) + "%",
                    width:  ((z.x2 - z.x1) * 100).toFixed(3) + "%",
                    height: ((z.y2 - z.y1) * 100).toFixed(3) + "%",
                    background: isHover ? "rgba(232,0,28,.28)" : "transparent",
                    border: isHover
                      ? "1px solid rgba(232,0,28,.60)"
                      : "1px solid rgba(255,255,255,.18)",
                    cursor:"crosshair",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"background .08s, border-color .08s",
                    boxSizing:"border-box",
                  }}
                >
                  {isHover && (
                    <span style={{
                      fontSize:7, color:"#FFF", fontFamily:"'Bebas Neue'", letterSpacing:.5,
                      textShadow:"0 1px 3px rgba(0,0,0,.9)", textAlign:"center",
                      pointerEvents:"none", lineHeight:1.2, padding:"0 2px",
                    }}>
                      {z.name}
                    </span>
                  )}
                </div>
              );
            })}
            {/* Label no fundo */}
            <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", background:"rgba(232,0,28,.88)", color:"#FFF", fontFamily:"'Bebas Neue'", fontSize:12, letterSpacing:2, padding:"3px 14px", borderRadius:4, whiteSpace:"nowrap", pointerEvents:"none", zIndex:4 }}>
              CLIQUE NO LOCAL DA AÇÃO
            </div>
          </div>
        )}

        {/* Flash ✓ elegante ao registrar ação */}
        {flashZ != null && (() => {
          const z = dynZones.find(z => z.id === flashZ);
          if (!z) return null;
          const cx = ((z.x1 + z.x2) / 2 * 100).toFixed(3) + "%";
          const cy = ((z.y1 + z.y2) / 2 * 100).toFixed(3) + "%";
          return (
            <div style={{
              position:"absolute", left:cx, top:cy,
              animation:"fz .7s ease forwards",
              zIndex:5, pointerEvents:"none",
            }}>
              <div style={{
                background:"rgba(5,150,105,.92)",
                color:"#FFF", borderRadius:"50%",
                width:28, height:28,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17, lineHeight:1,
                boxShadow:"0 2px 10px rgba(0,0,0,.45)",
              }}>✓</div>
            </div>
          );
        })()}

        {/* Jogadores */}
        {showPl && (
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:4 }}>
            {assigned.map(slot => {
              const isSel  = slot.player?.id != null && slot.player.id === selPl;
              const scKey  = slot.player?.id != null ? plShortcuts[slot.player.id] : null;
              const isScT  = slot.player?.id != null && slot.player.id === scTarget;
              return (
                <div key={slot.id}
                  onMouseDown={e => onPlayerMouseDown(e, slot.id)}
                  onClick={e => onPlayerClick(e, slot)}
                  style={{
                    position:"absolute",
                    left:slot.x+"%", top:slot.y+"%",
                    transform:"translate(-50%,-50%)",
                    pointerEvents:"auto",
                    cursor: assigningSc ? "pointer" : selAct ? "crosshair" : fixado ? "default" : subMode ? "pointer" : "grab",
                    zIndex: draggingId === slot.id ? 10 : 2,
                    display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                    opacity: selPl !== null && slot.player?.id != null && slot.player.id !== selPl ? dimOpacity : 1,
                    transition:"opacity .2s",
                    filter: isScT ? "drop-shadow(0 0 6px #FFE000)" : subTarget===slot.id ? `drop-shadow(0 0 6px ${C.red})` : isSel ? `drop-shadow(0 0 5px ${C.gold})` : "drop-shadow(0 1px 3px rgba(0,0,0,.6))",
                  }}
                >
                  {scKey && (
                    <span style={{
                      position:"absolute", top:-4, left:-4, zIndex:1,
                      background:"#1A1A1A", color:"#FFE000",
                      fontFamily:"monospace", fontSize:9, fontWeight:700,
                      borderRadius:3, padding:"0 3px", lineHeight:"13px",
                      border:"1px solid #FFE000",
                    }}>{scKey}</span>
                  )}
                  <img src={jerseyFor(slot)} draggable={false} style={{ width:38, height:38, objectFit:"contain" }}/>
                  <div style={{
                    background: isSel ? C.gold+"DD" : "rgba(0,0,0,.82)",
                    color:"#FFF", fontSize:10, padding:"1px 5px", borderRadius:3,
                    maxWidth:68, textAlign:"center", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                    fontFamily:"'Rajdhani',sans-serif", fontWeight:700,
                  }}>
                    {slot.player
                      ? (slot.player.number ? `${slot.player.number} ` : "") + (slot.player.nickname || slot.player.name.split(" ")[0])
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
