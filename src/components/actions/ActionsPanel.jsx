import { useState, useEffect } from "react";
import { SECTORS } from "../../constants/sectors";
import { C }       from "../../constants/colors";
import SplitActionButton from "./SplitActionButton";

const LS_LAYOUT    = "maestro_action_layout_v3";
const LS_SHORTCUTS = "maestro_action_shortcuts";

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
  background:"none", border:"1px solid #D4D4D4", borderRadius:3,
  padding:"2px 8px", cursor:"pointer", fontSize:10, color:C.txtM,
  fontFamily:"'Bebas Neue'", letterSpacing:1, flexShrink:0,
};

const TOOLS = [
  { id:"cor",    label:"COR",    desc:"Clique num botão para mudar a cor"       },
  { id:"nome",   label:"NOME",   desc:"Clique num botão para renomear"           },
  { id:"mover",  label:"MOVER",  desc:"Clique num botão para reposicioná-lo"    },
  { id:"atalho", label:"ATALHO", desc:"Clique num botão para definir o atalho"  },
];

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

export default function ActionsPanel({ selAct, setSelAct, editMode, editTool, setEditTool }) {
  const [layout,     setLayout]    = useState(loadLayout);
  const [shortcuts,  setShortcuts] = useState(loadShortcuts);

  const [testSel,    setTestSel]   = useState(null); // teste do botão par (split)
  const [editTarget, setEditTarget]= useState(null);
  const [editName,   setEditName]  = useState("");
  const [capturing,  setCapturing] = useState(false);
  const [dragSrc,    setDragSrc]   = useState(null);
  const [dragOver,   setDragOver]  = useState(null);

  useEffect(() => {
    try { localStorage.setItem(LS_LAYOUT, JSON.stringify(layout)); } catch {}
  }, [layout]);

  useEffect(() => {
    try { localStorage.setItem(LS_SHORTCUTS, JSON.stringify(shortcuts)); } catch {}
  }, [shortcuts]);

  useEffect(() => {
    if (!editMode) { setEditTarget(null); setCapturing(false); }
  }, [editMode]);

  useEffect(() => {
    setEditTarget(null);
    setCapturing(false);
  }, [editTool]);

  useEffect(() => {
    if (editMode) return;
    const handler = (e) => {
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
  }, [editMode, shortcuts, selAct, setSelAct]);

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

  const swapButtons = (idA, idB) => setLayout(prev => {
    const a = prev.find(b => b.id === idA);
    const b = prev.find(b => b.id === idB);
    if (!a || !b || idA === idB) return prev;
    return prev.map(btn => {
      if (btn.id === idA) return { ...btn, col: b.col, order: b.order };
      if (btn.id === idB) return { ...btn, col: a.col, order: a.order };
      return btn;
    });
  });

  const moveToCol = (id, targetCol) => setLayout(prev => {
    const btn = prev.find(b => b.id === id);
    if (btn.col === targetCol) return prev;
    const mo = Math.max(...prev.filter(b => b.col === targetCol).map(b => b.order), -1) + 1;
    return prev.map(b => b.id === id ? { ...b, col: targetCol, order: mo } : b);
  });

  const setColor    = (id, color) => setLayout(prev => prev.map(b => b.id === id ? { ...b, color } : b));
  const setShortcut = (id, key)   => setShortcuts(prev => {
    const next = { ...prev };
    if (!key) delete next[id]; else next[id] = key;
    return next;
  });

  const applyName = () => {
    if (!editName.trim()) return;
    setLayout(prev => prev.map(b => b.id === editTarget ? { ...b, label: editName.trim().toUpperCase() } : b));
    setEditTarget(null);
  };

  const handleEditClick = (btn) => {
    if (!editTool) return;
    setEditTarget(btn.id);
    if (editTool === "nome") setEditName(btn.label);
    if (editTool === "atalho") setCapturing(false);
  };

  /* ── Botão modo visualização ── */
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
          }}>{sk}</span>
        )}
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:.5, color: sel ? "#FFF" : ac, textAlign:"center", lineHeight:1.15, wordBreak:"break-word" }}>
          {btn.label}
        </span>
      </button>
    );
  };

  /* ── Botão modo edição — mesmo visual, clique aplica ferramenta ── */
  const renderEditBtn = (btn) => {
    const ac        = btn.color;
    const sk        = shortcuts[btn.id] || "";
    const isTarget  = editTarget === btn.id;
    const isMover   = editTool === "mover";
    const isDragSrc = dragSrc === btn.id;
    const isDragOver= dragOver === btn.id && dragSrc !== btn.id;

    return (
      <button key={btn.id}
        onClick={() => handleEditClick(btn)}
        draggable={isMover}
        onDragStart={isMover ? () => { setDragSrc(btn.id); setEditTarget(null); } : undefined}
        onDragOver={isMover  ? (e) => { e.preventDefault(); setDragOver(btn.id); } : undefined}
        onDragLeave={isMover ? ()  => setDragOver(null) : undefined}
        onDrop={isMover ? (e) => {
          e.preventDefault();
          if (dragSrc && dragSrc !== btn.id) swapButtons(dragSrc, btn.id);
          setDragSrc(null); setDragOver(null);
        } : undefined}
        onDragEnd={isMover ? () => { setDragSrc(null); setDragOver(null); } : undefined}
        style={{
          flex:1, minHeight:0,
          padding:"2px 4px", width:"100%", position:"relative",
          background: isDragOver ? ac + "44" : isTarget ? ac + "28" : ac + "12",
          border: isDragOver
            ? `2px dashed ${ac}`
            : isTarget ? `2px solid ${ac}` : `2px solid ${ac}44`,
          borderRadius:6,
          cursor: isMover ? (isDragSrc ? "grabbing" : "grab") : editTool ? "pointer" : "default",
          transition:"all .1s",
          display:"flex", alignItems:"center", justifyContent:"center",
          opacity: isDragSrc ? 0.45 : 1,
          outline: isTarget && !isMover ? `2px solid ${ac}` : "none",
          outlineOffset: 1,
        }}
      >
        {sk && (
          <span style={{
            position:"absolute", top:1, right:2,
            fontSize:7, fontFamily:"monospace",
            color:ac+"BB", background:ac+"18",
            borderRadius:2, padding:"0 2px", lineHeight:"12px",
          }}>{sk}</span>
        )}
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:.5, color:ac, textAlign:"center", lineHeight:1.15, wordBreak:"break-word" }}>
          {btn.label}
        </span>
      </button>
    );
  };

  const all   = [...col0, ...col1];
  const s     = Math.ceil(all.length / 3);
  const cols3 = [all.slice(0, s), all.slice(s, s * 2), all.slice(s * 2)];
  const targetBtn = editTarget ? layout.find(b => b.id === editTarget) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, height:"100%" }}>

      {/* Dica da ferramenta ativa */}
      {editMode && editTool && !editTarget && (
        <div style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:600, textAlign:"center", letterSpacing:.3, flexShrink:0 }}>
          {TOOLS.find(t => t.id === editTool)?.desc}
        </div>
      )}

      {/* ── Teste: botão par (split) ── */}
      <div style={{ flexShrink:0, height:30 }}>
        <SplitActionButton
          posLabel="FINALIZAÇÃO POS." negLabel="FINALIZAÇÃO NEG."
          posColor="#059669" negColor="#DC2626"
          selected={testSel}
          onSelectPos={() => setTestSel(s => s === "pos" ? null : "pos")}
          onSelectNeg={() => setTestSel(s => s === "neg" ? null : "neg")}
        />
      </div>

      {/* ── Grade 3 colunas ── */}
      <div style={{ flex:1, minHeight:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:3 }}>
        {cols3.map((col, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", gap:3, minHeight:0 }}>
            {col.map(editMode ? renderEditBtn : renderViewBtn)}
          </div>
        ))}
      </div>

      {/* ── Painel contextual ── */}
      {editMode && targetBtn && (
        <div style={{
          flexShrink:0,
          background:"#FAFAFA",
          border:`1px solid ${targetBtn.color}55`,
          borderRadius:7, padding:"8px 10px",
          display:"flex", flexDirection:"column", gap:7,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color:targetBtn.color, letterSpacing:.5, flex:1 }}>
              {targetBtn.label}
            </span>
            <button onClick={() => { setEditTarget(null); setCapturing(false); }}
              style={{ ...CTRL, fontSize:9, padding:"1px 6px" }}>✕</button>
          </div>

          {/* COR */}
          {editTool === "cor" && (
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, flexShrink:0 }}>ESCOLHA:</span>
              {COLOR_OPTS.map(c => (
                <button key={c} onClick={() => setColor(targetBtn.id, c)} style={{
                  width:22, height:22, background:c, borderRadius:"50%",
                  border: c === targetBtn.color ? "2.5px solid #000" : "1px solid rgba(0,0,0,.15)",
                  cursor:"pointer", padding:0, flexShrink:0,
                  boxShadow: c === targetBtn.color ? `0 0 0 2px #FFF, 0 0 0 4px ${c}` : "none",
                }}/>
              ))}
            </div>
          )}

          {/* NOME */}
          {editTool === "nome" && (
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") applyName(); if (e.key === "Escape") setEditTarget(null); }}
                style={{
                  flex:1, fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:1,
                  border:`1px solid ${targetBtn.color}`, borderRadius:4,
                  padding:"4px 8px", outline:"none", color:targetBtn.color,
                }}
                placeholder="Novo nome..."
              />
              <button onClick={applyName}
                style={{ ...CTRL, background:targetBtn.color, color:"#FFF", border:"none" }}>SALVAR</button>
            </div>
          )}

          {/* MOVER */}
          {editTool === "mover" && (
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <button onClick={() => moveInCol(targetBtn.id, -1)} style={CTRL}>↑ SUBIR</button>
              <button onClick={() => moveInCol(targetBtn.id,  1)} style={CTRL}>↓ DESCER</button>
              <button onClick={() => moveToCol(targetBtn.id, 1)}
                style={{ ...CTRL, color:C.blue, border:`1px solid ${C.blue}` }}>→ DIREITA</button>
              <button onClick={() => moveToCol(targetBtn.id, 0)}
                style={{ ...CTRL, color:C.blue, border:`1px solid ${C.blue}` }}>← ESQUERDA</button>
            </div>
          )}

          {/* ATALHO */}
          {editTool === "atalho" && (
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, flexShrink:0 }}>ATALHO:</span>
              {capturing ? (
                <input
                  autoFocus readOnly placeholder="Pressione a tecla..."
                  onKeyDown={e => {
                    e.preventDefault(); e.stopPropagation();
                    if (e.key === "Escape") { setCapturing(false); return; }
                    if (["Control","Shift","Alt","Meta","CapsLock","Tab"].includes(e.key)) return;
                    setShortcut(targetBtn.id, e.key.length === 1 ? e.key.toUpperCase() : e.key);
                    setCapturing(false);
                  }}
                  onBlur={() => setCapturing(false)}
                  style={{
                    flex:1, background:"#FFF5F5", border:`1px solid ${C.red}`,
                    borderRadius:4, padding:"4px 8px", fontSize:11, fontFamily:"monospace",
                    outline:"none", color:C.red, textAlign:"center",
                  }}
                />
              ) : (
                <>
                  <span style={{
                    fontFamily:"monospace", fontSize:13,
                    background:"#F0F0F0", border:"1px solid #D0D0D0",
                    borderRadius:4, padding:"2px 10px", minWidth:40, textAlign:"center",
                    color: shortcuts[targetBtn.id] ? "#1A1A1A" : C.txtM,
                  }}>
                    {shortcuts[targetBtn.id] || "—"}
                  </span>
                  <button onClick={() => setCapturing(true)}
                    style={{ ...CTRL, color:C.blue, border:`1px solid ${C.blue}` }}>
                    {shortcuts[targetBtn.id] ? "ALTERAR" : "DEFINIR"}
                  </button>
                  {shortcuts[targetBtn.id] && (
                    <button onClick={() => setShortcut(targetBtn.id, "")}
                      style={{ ...CTRL, color:"#DC2626", border:"1px solid #FFAAAA" }}>REMOVER</button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
