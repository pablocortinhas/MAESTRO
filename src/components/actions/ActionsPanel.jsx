import { useState, useEffect } from "react";
import { SECTORS } from "../../constants/sectors";
import { C }       from "../../constants/colors";
import { lBtn }    from "../../utils/styles";

const LS_LAYOUT    = "rubromap_action_layout_v2";
const LS_SHORTCUTS = "rubromap_action_shortcuts";

const COLOR_OPTS = [
  "#059669","#DC2626","#C65100","#CA8A04","#E8001C","#374151","#1D4ED8","#7C3AED",
];
const NEG_COLORS = new Set(["#DC2626","#CA8A04","#E8001C","#C65100"]);
const SHORT = {
  "FINALIZAÇÃO":"FINALIZ.","1×1 OFENSIVO":"1×1 OF.",
  "1×1 DEFENSIVO":"1×1 DEF.","AÇÃO GOLEIRO":"GOLEIRO",
};
const sl = (p, sub) => { const s = SHORT[p] || p; return sub ? `${s} ${sub}` : s; };

const CTRL = {
  background:"none", border:"1px solid #D4D4D4", borderRadius:3,
  padding:"1px 5px", cursor:"pointer", fontSize:11, color:C.txtM,
  lineHeight:1, flexShrink:0,
};

function buildDefaultLayout() {
  const items = []; let po = 0, no = 0;
  SECTORS.flatMap(s => s.actions).forEach(a => {
    if (a.type === "single") {
      const col = NEG_COLORS.has(a.color) ? 1 : 0;
      items.push({ id:a.id, label:a.label, color:a.color||"#374151", col, order:col===0?po++:no++ });
    } else {
      items.push({ id:a.posId, label:sl(a.label, a.posLabel), color:a.posColor||"#059669", col:0, order:po++ });
      items.push({ id:a.negId, label:sl(a.label, a.negLabel), color:a.negColor||"#DC2626", col:1, order:no++ });
    }
  });
  return items;
}

function loadLayout() {
  try { const s = localStorage.getItem(LS_LAYOUT); if (s) return JSON.parse(s); } catch {}
  return buildDefaultLayout();
}

function loadShortcuts() {
  try { const s = localStorage.getItem(LS_SHORTCUTS); if (s) return JSON.parse(s); } catch {}
  return {};
}

export default function ActionsPanel({ selZone, selAct, setSelAct, register }) {
  const [layout,     setLayout]     = useState(loadLayout);
  const [shortcuts,  setShortcuts]  = useState(loadShortcuts);
  const [editMode,   setEditMode]   = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(LS_LAYOUT, JSON.stringify(layout)); } catch {}
  }, [layout]);

  useEffect(() => {
    try { localStorage.setItem(LS_SHORTCUTS, JSON.stringify(shortcuts)); } catch {}
  }, [shortcuts]);

  // Global keyboard shortcut handler
  useEffect(() => {
    if (editMode) return;
    const handler = (e) => {
      if (editingKey) return;
      if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const match = Object.entries(shortcuts).find(([, k]) => k && (k.toUpperCase() === key || k === e.key));
      if (!match) return;
      e.preventDefault();
      const [btnId] = match;
      if (selZone !== null) register(btnId, selZone);
      else setSelAct(btnId === selAct ? null : btnId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, editingKey, shortcuts, selZone, selAct, register, setSelAct]);

  const col0 = layout.filter(b => b.col === 0).sort((a, b) => a.order - b.order);
  const col1 = layout.filter(b => b.col === 1).sort((a, b) => a.order - b.order);

  const moveInCol = (id, dir) => setLayout(prev => {
    const btn  = prev.find(b => b.id === id);
    const col  = prev.filter(b => b.col === btn.col).sort((a, b) => a.order - b.order);
    const idx  = col.findIndex(b => b.id === id);
    const ni   = idx + dir;
    if (ni < 0 || ni >= col.length) return prev;
    const swap = col[ni];
    return prev.map(b =>
      b.id === id ? { ...b, order: swap.order } :
      b.id === swap.id ? { ...b, order: btn.order } : b
    );
  });

  const switchCol = (id) => setLayout(prev => {
    const btn = prev.find(b => b.id === id);
    const nc  = btn.col === 0 ? 1 : 0;
    const mo  = Math.max(...prev.filter(b => b.col === nc).map(b => b.order), -1) + 1;
    return prev.map(b => b.id === id ? { ...b, col: nc, order: mo } : b);
  });

  const setColor = (id, color) => setLayout(prev => prev.map(b => b.id === id ? { ...b, color } : b));

  const setShortcut = (id, key) => setShortcuts(prev => {
    const next = { ...prev };
    if (!key) delete next[id]; else next[id] = key;
    return next;
  });

  const renderBtn = (btn) => {
    const sel = selAct === btn.id;
    const ac  = btn.color;
    const sk  = shortcuts[btn.id] || "";
    const isAssigning = editingKey === btn.id;

    if (editMode) {
      return (
        <div key={btn.id} style={{ border:`1px solid ${ac}55`, borderRadius:7, padding:"5px 7px", background:ac+"0E", display:"flex", flexDirection:"column", gap:5 }}>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color:ac, flex:1, letterSpacing:.3, lineHeight:1.2 }}>{btn.label}</span>
            <button style={CTRL} onClick={() => moveInCol(btn.id, -1)}>↑</button>
            <button style={CTRL} onClick={() => moveInCol(btn.id,  1)}>↓</button>
            <button style={CTRL} onClick={() => switchCol(btn.id)}    >⇄</button>
          </div>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
            {COLOR_OPTS.map(c => (
              <button key={c} onClick={() => setColor(btn.id, c)} style={{ width:14, height:14, background:c, borderRadius:"50%", border: c === btn.color ? "2px solid #000" : "1px solid rgba(0,0,0,.2)", cursor:"pointer", padding:0, flexShrink:0 }}/>
            ))}
          </div>
          {/* Shortcut row */}
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, flexShrink:0 }}>ATALHO:</span>
            {isAssigning ? (
              <input
                autoFocus
                readOnly
                placeholder="Pressione uma tecla..."
                onKeyDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.key === "Escape") { setEditingKey(null); return; }
                  if (["Control","Shift","Alt","Meta","CapsLock","Tab"].includes(e.key)) return;
                  setShortcut(btn.id, e.key.length === 1 ? e.key.toUpperCase() : e.key);
                  setEditingKey(null);
                }}
                onBlur={() => setEditingKey(null)}
                style={{ flex:1, background:"#FFF5F5", border:"1px solid "+C.red, borderRadius:3, padding:"2px 5px", fontSize:10, fontFamily:"monospace", outline:"none", color:C.red, textAlign:"center", minHeight:22 }}
              />
            ) : (
              <button
                onClick={() => setEditingKey(btn.id)}
                style={{ flex:1, background:"#F5F5F5", border:"1px solid #D0D0D0", borderRadius:3, padding:"2px 5px", fontSize:10, fontFamily:"monospace", cursor:"pointer", textAlign:"center", color: sk ? "#1A1A1A" : C.txtM, minHeight:22 }}
              >
                {sk || "Definir tecla"}
              </button>
            )}
            {sk && !isAssigning && (
              <button style={{ ...CTRL, color:"#DC2626", border:"1px solid #FFAAAA" }} onClick={() => setShortcut(btn.id, "")}>×</button>
            )}
          </div>
        </div>
      );
    }

    return (
      <button key={btn.id}
        onClick={() => {
          if (selZone !== null) register(btn.id, selZone);
          else setSelAct(btn.id === selAct ? null : btn.id);
        }}
        style={{
          padding:"6px", width:"100%", aspectRatio:"1", position:"relative",
          background: sel ? ac : ac + "15",
          border: `2px solid ${sel ? ac : ac + "55"}`,
          borderRadius:10, cursor:"pointer", transition:"all .1s",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        {sk && (
          <span style={{
            position:"absolute", top:2, right:3,
            fontSize:8, fontFamily:"monospace",
            color: sel ? "rgba(255,255,255,.8)" : ac+"CC",
            background: sel ? "rgba(0,0,0,.3)" : ac+"18",
            borderRadius:2, padding:"0 3px", lineHeight:"13px",
          }}>
            {sk}
          </span>
        )}
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:.4, color: sel ? "#FFF" : ac, textAlign:"center", lineHeight:1.2, wordBreak:"break-word" }}>
          {btn.label}
        </span>
      </button>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={() => { setEditMode(e => !e); setEditingKey(null); }} style={{ ...lBtn(editMode), fontSize:10, padding:"2px 9px" }}>
          {editMode ? "CONCLUIR" : "EDITAR BOTÕES"}
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {col0.map(renderBtn)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {col1.map(renderBtn)}
        </div>
      </div>
    </div>
  );
}
