import { useState, useEffect } from "react";
import { SECTORS } from "../../constants/sectors";
import { C }       from "../../constants/colors";
import { lBtn }    from "../../utils/styles";

const LS_LAYOUT    = "rubromap_action_layout_v3";
const LS_SHORTCUTS = "rubromap_action_shortcuts";

const COLOR_OPTS = [
  "#059669","#DC2626","#C65100","#CA8A04","#E8001C","#374151","#1D4ED8","#7C3AED",
];
const NEG_COLORS = new Set(["#DC2626","#CA8A04","#E8001C","#C65100"]);
const SHORT = {
  "RECUPERAÇÃO DA POSSE":"RECUPER.",
  "BLOQUEIO DE FINALIZAÇÃO":"BLOQUEIO",
  "FINALIZAÇÃO":"FINALIZ.",
  "1×1 OFENSIVO":"1×1 OF.",
  "1×1 DEFENSIVO":"1×1 DEF.",
  "AÇÃO SOB PRESSÃO":"SOB PRESS.",
  "PASSE CHAVE":"P. CHAVE",
  "PASSE LONGO":"P. LONGO",
};
const sl = (p, sub) => { const s = SHORT[p] || p; return sub ? `${s} ${sub}` : s; };

const CTRL = {
  background:"none", border:"1px solid #D4D4D4", borderRadius:2,
  padding:"0 4px", cursor:"pointer", fontSize:9, color:C.txtM,
  lineHeight:"13px", flexShrink:0,
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

export default function ActionsPanel({ selAct, setSelAct, editMode, setEditMode }) {
  const [layout,     setLayout]     = useState(loadLayout);
  const [shortcuts,  setShortcuts]  = useState(loadShortcuts);
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(LS_LAYOUT, JSON.stringify(layout)); } catch {}
  }, [layout]);

  useEffect(() => {
    try { localStorage.setItem(LS_SHORTCUTS, JSON.stringify(shortcuts)); } catch {}
  }, [shortcuts]);

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
      setSelAct(btnId === selAct ? null : btnId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, editingKey, shortcuts, selAct, setSelAct]);

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

  /* ── Botão em modo edição — mesma grade 3 cols, controles compactos ── */
  const renderEditBtn = (btn) => {
    const ac  = btn.color;
    const sk  = shortcuts[btn.id] || "";
    const isAssigning = editingKey === btn.id;

    return (
      <div key={btn.id} style={{
        flex:1, minHeight:0,
        display:"flex", flexDirection:"column",
        border:`1px solid ${ac}44`, borderRadius:6,
        background:ac+"0A", overflow:"hidden",
      }}>
        {/* Barra superior: ↑ ↓ ⇄ */}
        <div style={{ display:"flex", gap:2, padding:"2px 3px", background:ac+"10", flexShrink:0 }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => moveInCol(btn.id, -1)} style={CTRL}>↑</button>
          <button onClick={() => moveInCol(btn.id,  1)} style={CTRL}>↓</button>
          <button onClick={() => switchCol(btn.id)}     style={CTRL}>⇄</button>
          <div style={{ flex:1 }}/>
          {sk && !isAssigning && (
            <span style={{ fontSize:7, fontFamily:"monospace", color:ac, background:ac+"20", borderRadius:2, padding:"0 3px", lineHeight:"13px" }}>
              {sk}
            </span>
          )}
        </div>

        {/* Label central */}
        <div style={{ flex:1, minHeight:0, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:11, letterSpacing:.4, color:ac, textAlign:"center", lineHeight:1.1, wordBreak:"break-word" }}>
            {btn.label}
          </span>
        </div>

        {/* Barra inferior: paleta de cores + atalho */}
        <div style={{ display:"flex", alignItems:"center", gap:2, padding:"2px 3px", background:ac+"10", flexShrink:0 }}
          onClick={e => e.stopPropagation()}>
          {COLOR_OPTS.map(c => (
            <button key={c} onClick={() => setColor(btn.id, c)} style={{
              width:9, height:9, background:c, borderRadius:"50%",
              border: c === btn.color ? "1.5px solid #000" : "1px solid rgba(0,0,0,.18)",
              cursor:"pointer", padding:0, flexShrink:0,
            }}/>
          ))}
          <div style={{ flex:1 }}/>
          {isAssigning ? (
            <input
              autoFocus readOnly placeholder="tecla..."
              onKeyDown={e => {
                e.preventDefault(); e.stopPropagation();
                if (e.key === "Escape") { setEditingKey(null); return; }
                if (["Control","Shift","Alt","Meta","CapsLock","Tab"].includes(e.key)) return;
                setShortcut(btn.id, e.key.length === 1 ? e.key.toUpperCase() : e.key);
                setEditingKey(null);
              }}
              onBlur={() => setEditingKey(null)}
              style={{ width:36, background:"#FFF5F5", border:"1px solid "+ac, borderRadius:2, padding:"0 2px", fontSize:8, fontFamily:"monospace", outline:"none", color:ac, textAlign:"center" }}
            />
          ) : (
            <button onClick={() => setEditingKey(btn.id)} style={{ ...CTRL, color: sk ? ac : C.txtM, fontSize:8 }}>
              {sk ? `${sk} ✎` : "⌨"}
            </button>
          )}
          {sk && !isAssigning && (
            <button onClick={() => setShortcut(btn.id, "")} style={{ ...CTRL, color:"#DC2626", border:"1px solid #FFAAAA", fontSize:8 }}>×</button>
          )}
        </div>
      </div>
    );
  };

  /* ── Botão em modo normal ── */
  const renderViewBtn = (btn) => {
    const sel = selAct === btn.id;
    const ac  = btn.color;
    const sk  = shortcuts[btn.id] || "";

    return (
      <button key={btn.id}
        onClick={() => setSelAct(btn.id === selAct ? null : btn.id)}
        style={{
          flex:1, minHeight:0,
          padding:"2px 4px", width:"100%", position:"relative",
          background: sel ? ac : ac + "12",
          border: `2px solid ${sel ? ac : ac + "44"}`,
          borderRadius:6, cursor:"pointer", transition:"all .12s",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: sel ? `0 2px 6px ${ac}44` : "none",
        }}
      >
        {sk && (
          <span style={{
            position:"absolute", top:1, right:2,
            fontSize:7, fontFamily:"monospace",
            color: sel ? "rgba(255,255,255,.85)" : ac+"BB",
            background: sel ? "rgba(0,0,0,.28)" : ac+"18",
            borderRadius:2, padding:"0 2px", lineHeight:"12px",
          }}>
            {sk}
          </span>
        )}
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:.5, color: sel ? "#FFF" : ac, textAlign:"center", lineHeight:1.15, wordBreak:"break-word" }}>
          {btn.label}
        </span>
      </button>
    );
  };

  /* ── Grade 3 colunas — igual em visualização e edição ── */
  const all = [...col0, ...col1];
  const s   = Math.ceil(all.length / 3);
  const cols3 = [all.slice(0, s), all.slice(s, s * 2), all.slice(s * 2)];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, height:"100%" }}>
      <div style={{ flex:1, minHeight:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:3 }}>
        {cols3.map((col, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", gap:3, minHeight:0 }}>
            {col.map(editMode ? renderEditBtn : renderViewBtn)}
          </div>
        ))}
      </div>
    </div>
  );
}
