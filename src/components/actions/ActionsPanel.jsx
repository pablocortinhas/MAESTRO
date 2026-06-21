import { useState, useEffect, useRef } from "react";
import { SECTORS } from "../../constants/sectors";
import { C }       from "../../constants/colors";

const LS_LAYOUT    = "maestro_action_layout_v3";
const LS_SHORTCUTS = "maestro_action_shortcuts";
const LS_DEFAULT   = "maestro_action_default_v1";

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

const BTN_H = 36;

const CTRL = {
  background:"none", border:"1px solid #D4D4D4", borderRadius:3,
  padding:"2px 8px", cursor:"pointer", fontSize:10, color:C.txtM,
  fontFamily:"'Bebas Neue'", letterSpacing:1, flexShrink:0,
};

const TOOLS = [
  { id:"cor",    label:"COR",    desc:"Clique num botão para mudar a cor"      },
  { id:"nome",   label:"NOME",   desc:"Clique num botão para renomear"          },
  { id:"atalho", label:"ATALHO", desc:"Clique num botão para definir o atalho" },
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
  try { const s = localStorage.getItem(LS_LAYOUT);  if (s) return JSON.parse(s); } catch {}
  try { const s = localStorage.getItem(LS_DEFAULT); if (s) return JSON.parse(s); } catch {}
  return buildDefaultLayout();
}

function loadShortcuts() {
  try { const s = localStorage.getItem(LS_SHORTCUTS); if (s) return JSON.parse(s); } catch {}
  return {};
}

export default function ActionsPanel({ selAct, setSelAct, editMode, editTool, setEditTool }) {
  const [layout,     setLayout]    = useState(loadLayout);
  const [shortcuts,  setShortcuts] = useState(loadShortcuts);
  const [editTarget, setEditTarget]= useState(null);
  const [editName,   setEditName]  = useState("");
  const [capturing,  setCapturing] = useState(false);
  const [dragSrc,    setDragSrc]   = useState(null);
  const [dragOver,   setDragOver]  = useState(null);
  const [addMode,    setAddMode]   = useState(false);
  const [newLabel,   setNewLabel]  = useState("");
  const [newColor,   setNewColor]  = useState(COLOR_OPTS[0]);
  const fileInputRef               = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(LS_LAYOUT, JSON.stringify(layout)); } catch {}
  }, [layout]);

  useEffect(() => {
    try { localStorage.setItem(LS_SHORTCUTS, JSON.stringify(shortcuts)); } catch {}
  }, [shortcuts]);

  useEffect(() => {
    if (!editMode) { setEditTarget(null); setCapturing(false); setAddMode(false); }
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

  const setColor    = (id, color) => setLayout(prev => prev.map(b => b.id === id ? { ...b, color } : b));
  const setShortcut = (id, key)   => setShortcuts(prev => {
    const next = { ...prev };
    if (!key) delete next[id]; else next[id] = key;
    return next;
  });

  const deleteButton = (id) => {
    setLayout(prev => prev.filter(b => b.id !== id));
    setShortcuts(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (editTarget === id) setEditTarget(null);
  };

  const addButton = () => {
    if (!newLabel.trim()) return;
    const maxOrder = layout.length > 0 ? Math.max(...layout.map(b => b.order)) : -1;
    setLayout(prev => [...prev, {
      id: `custom_${Date.now()}`,
      label: newLabel.trim().toUpperCase(),
      color: newColor,
      col: 0,
      order: maxOrder + 1,
    }]);
    setNewLabel("");
    setNewColor(COLOR_OPTS[0]);
    setAddMode(false);
  };

  const saveAsDefault = () => {
    try { localStorage.setItem(LS_DEFAULT, JSON.stringify(layout)); } catch {}
  };

  const exportConfig = () => {
    const data = JSON.stringify({ layout, shortcuts }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "maestro-acoes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.layout))           setLayout(data.layout);
        if (data.shortcuts && typeof data.shortcuts === "object") setShortcuts(data.shortcuts);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyName = () => {
    if (!editName.trim()) return;
    setLayout(prev => prev.map(b => b.id === editTarget ? { ...b, label: editName.trim().toUpperCase() } : b));
    setEditTarget(null);
  };

  const handleEditClick = (btn) => {
    if (!editTool) return;
    setAddMode(false);
    setEditTarget(btn.id);
    if (editTool === "nome") setEditName(btn.label);
    if (editTool === "atalho") setCapturing(false);
  };

  const dragEvents = (id) => ({
    draggable: true,
    onDragStart: () => setDragSrc(id),
    onDragOver:  (e) => { e.preventDefault(); setDragOver(id); },
    onDragLeave: ()  => setDragOver(null),
    onDrop: (e) => {
      e.preventDefault();
      if (dragSrc && dragSrc !== id) swapButtons(dragSrc, id);
      setDragSrc(null); setDragOver(null);
    },
    onDragEnd: () => { setDragSrc(null); setDragOver(null); },
  });

  const renderViewBtn = (btn) => {
    const sel        = selAct === btn.id;
    const ac         = btn.color;
    const sk         = shortcuts[btn.id] || "";
    const isDragSrc  = dragSrc === btn.id;
    const isDragOver = dragOver === btn.id && dragSrc !== btn.id;
    return (
      <button key={btn.id}
        {...dragEvents(btn.id)}
        onClick={() => { if (!dragSrc) setSelAct(btn.id === selAct ? null : btn.id); }}
        style={{
          height:"100%", minHeight:BTN_H,
          padding:"4px 4px", width:"100%", position:"relative", boxSizing:"border-box",
          background: isDragOver ? ac+"44" : sel ? ac : ac+"12",
          border: `2px ${isDragOver ? "dashed" : "solid"} ${isDragOver ? ac : sel ? ac : ac+"44"}`,
          borderRadius:6, cursor: isDragSrc ? "grabbing" : "grab", transition:"all .12s",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: sel ? `0 2px 6px ${ac}44` : "none",
          opacity: isDragSrc ? 0.45 : 1,
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

  const renderEditBtn = (btn) => {
    const ac         = btn.color;
    const sk         = shortcuts[btn.id] || "";
    const isTarget   = editTarget === btn.id;
    const isDragSrc  = dragSrc === btn.id;
    const isDragOver = dragOver === btn.id && dragSrc !== btn.id;
    return (
      <button key={btn.id}
        {...dragEvents(btn.id)}
        onClick={() => { if (!dragSrc) handleEditClick(btn); }}
        style={{
          height:"100%", minHeight:BTN_H,
          padding:"4px 4px", width:"100%", position:"relative", boxSizing:"border-box",
          background: isDragOver ? ac+"44" : isTarget ? ac+"28" : ac+"12",
          border: `2px ${isDragOver ? "dashed" : "solid"} ${isDragOver ? ac : isTarget ? ac : ac+"44"}`,
          borderRadius:6,
          cursor: isDragSrc ? "grabbing" : "grab",
          transition:"all .1s",
          display:"flex", alignItems:"center", justifyContent:"center",
          opacity: isDragSrc ? 0.45 : 1,
          outline: isTarget ? `2px solid ${ac}` : "none",
          outlineOffset: 1,
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); deleteButton(btn.id); }}
          style={{
            position:"absolute", top:1, left:3,
            fontSize:10, color:"#EF4444", cursor:"pointer",
            zIndex:2, lineHeight:1, fontWeight:"bold",
          }}
        >×</span>
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

  const all       = [...col0, ...col1];
  const targetBtn = editTarget ? layout.find(b => b.id === editTarget) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, height:"100%" }}>

      {/* Barra de controles em modo edição */}
      {editMode && (
        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, flexWrap:"wrap" }}>
          <span style={{ flex:1, fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:600, letterSpacing:.3 }}>
            {editTool && !editTarget && !addMode ? TOOLS.find(t => t.id === editTool)?.desc : ""}
          </span>
          <button onClick={saveAsDefault}
            style={{ ...CTRL, color:"#16A34A", border:"1px solid #86EFAC", fontSize:9, padding:"1px 6px" }}>
            PADRÃO
          </button>
          <button onClick={exportConfig}
            style={{ ...CTRL, color:"#1D4ED8", border:"1px solid #93C5FD", fontSize:9, padding:"1px 6px" }}>
            EXPORTAR
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ ...CTRL, color:"#7C3AED", border:"1px solid #C4B5FD", fontSize:9, padding:"1px 6px" }}>
            IMPORTAR
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display:"none" }} onChange={importConfig} />
        </div>
      )}

      {/* Grade 3 colunas */}
      <div style={{ flex:1, minHeight:0, overflow:"auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gridAutoRows:BTN_H, gap:3, alignContent:"start" }}>
        {all.map(editMode ? renderEditBtn : renderViewBtn)}

        {editMode && (
          <button
            onClick={() => { setAddMode(a => !a); setEditTarget(null); }}
            style={{
              height:"100%", minHeight:BTN_H,
              background: addMode ? "#F0FDF4" : "transparent",
              border: `2px dashed ${addMode ? "#16A34A" : "#CBD5E1"}`,
              borderRadius:6, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              color: addMode ? "#16A34A" : "#94A3B8",
              fontFamily:"'Bebas Neue'", fontSize:20,
              transition:"all .1s",
            }}
          >+</button>
        )}
      </div>

      {/* Painel contextual — editar botão existente */}
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

      {/* Painel contextual — adicionar novo botão */}
      {editMode && addMode && !targetBtn && (
        <div style={{
          flexShrink:0,
          background:"#F0FDF4",
          border:"1px solid #86EFAC",
          borderRadius:7, padding:"8px 10px",
          display:"flex", flexDirection:"column", gap:7,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color:"#16A34A", letterSpacing:.5, flex:1 }}>
              NOVO BOTÃO
            </span>
            <button onClick={() => setAddMode(false)}
              style={{ ...CTRL, fontSize:9, padding:"1px 6px" }}>✕</button>
          </div>

          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <input
              autoFocus
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addButton(); if (e.key === "Escape") setAddMode(false); }}
              style={{
                flex:1, fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:1,
                border:"1px solid #86EFAC", borderRadius:4,
                padding:"4px 8px", outline:"none", color:"#16A34A",
              }}
              placeholder="Nome do botão..."
            />
          </div>

          <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:9, color:C.txtM, fontFamily:"'Rajdhani',sans-serif", fontWeight:700, flexShrink:0 }}>COR:</span>
            {COLOR_OPTS.map(c => (
              <button key={c} onClick={() => setNewColor(c)} style={{
                width:22, height:22, background:c, borderRadius:"50%",
                border: c === newColor ? "2.5px solid #000" : "1px solid rgba(0,0,0,.15)",
                cursor:"pointer", padding:0, flexShrink:0,
                boxShadow: c === newColor ? `0 0 0 2px #FFF, 0 0 0 4px ${c}` : "none",
              }}/>
            ))}
          </div>

          <button onClick={addButton}
            style={{ ...CTRL, background:"#16A34A", color:"#FFF", border:"none", padding:"4px 12px", fontSize:11, borderRadius:4 }}>
            ADICIONAR
          </button>
        </div>
      )}
    </div>
  );
}
