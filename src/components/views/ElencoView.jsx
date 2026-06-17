import { useState, useEffect, useMemo } from "react";
import { initSt, initZSt } from "../../utils/dataInit";
import { POSITIONS, CAT_LIST } from "../../constants/squads";
import camisa1Img  from "../../../imagens/camisa_1.png";
import camisaGLImg from "../../../imagens/camisa_GL.png";

const D = {
  bg:    "#111111",
  card:  "#1C1C1C",
  card2: "#242424",
  bdr:   "#2E2E2E",
  txt:   "#F0F0F0",
  dim:   "#888888",
  red:   "#E8001C",
  green: "#22C55E",
  blue:  "#3B82F6",
  orange:"#F97316",
};

const GROUPS = {
  GOLEIROS:        { positions: ["Goleiro"],                            color: D.green  },
  ZAGUEIROS:       { positions: ["Zagueiro"],                          color: D.blue   },
  LATERAIS:        { positions: ["Lateral Direito","Lateral Esquerdo"],color: D.blue   },
  "MEIO-CAMP.":    { positions: ["Volante","Meia"],                    color: D.orange },
  ATACANTES:       { positions: ["Ponta","Atacante"],                  color: D.red    },
};

const DEFENDERS_POS = ["Zagueiro","Lateral Direito","Lateral Esquerdo"];
const THUMB = 40;

function photoUrl(photo, imagensDir) {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  if (!imagensDir) return null;
  return `local-video:///${imagensDir.replace(/\\/g, "/")}/fotos/${photo}`;
}

function Avatar({ player, imagensDir }) {
  const [broken, setBroken] = useState(false);
  const url = !broken ? photoUrl(player.photo, imagensDir) : null;
  useEffect(() => setBroken(false), [player.photo]);

  const jersey = player.pos === "Goleiro" ? camisaGLImg : camisa1Img;
  if (url) {
    return (
      <img src={url} onError={() => setBroken(true)}
        style={{ width: THUMB, height: THUMB, objectFit: "cover", borderRadius: 6,
          border: `1px solid ${D.bdr}`, flexShrink: 0 }}
        alt={player.nickname || player.name} />
    );
  }
  return (
    <img src={jersey}
      style={{ width: THUMB, height: THUMB, objectFit: "contain", flexShrink: 0, opacity: 0.7 }}
      alt="" />
  );
}

function StatCard({ icon, label, count, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 80, background: D.card2,
      border: `1px solid ${D.bdr}`, borderRadius: 10,
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10,
        letterSpacing: 1, color: D.dim, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export default function ElencoView({ players, setPlayers, catKey, loadCat, squads }) {
  const [showCat,    setShowCat]    = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [add,        setAdd]        = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [showAdd,    setShowAdd]    = useState(false);
  const [imagensDir, setImagensDir] = useState("");
  const [activeGroup, setActiveGroup] = useState("TODOS");
  const [search,     setSearch]     = useState("");
  const [allClubMode, setAllClubMode] = useState(false);

  useEffect(() => { window.electronAPI?.getImagensDir().then(d => d && setImagensDir(d)); }, []);

  const allPlayers = useMemo(() => {
    if (allClubMode) {
      return Object.entries(squads || {}).flatMap(([cat, list]) =>
        list.map(p => ({ ...p, _cat: cat }))
      );
    }
    return players.map(p => ({ ...p, _cat: catKey }));
  }, [allClubMode, players, squads, catKey]);

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (activeGroup !== "TODOS") {
      const grp = GROUPS[activeGroup];
      if (grp) list = list.filter(p => grp.positions.includes(p.pos));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nickname || "").toLowerCase().includes(q) ||
        String(p.number || "").includes(q)
      );
    }
    return list;
  }, [allPlayers, activeGroup, search]);

  const count = g => {
    if (g === "TODOS") return allPlayers.length;
    const grp = GROUPS[g];
    if (!grp) return 0;
    return allPlayers.filter(p => grp.positions.includes(p.pos)).length;
  };

  const editKey = p => `${p._cat || catKey}-${p.id}`;
  const startEdit = p => { setEditId(editKey(p)); setForm({ name: p.name, nickname: p.nickname || "", number: p.number || "", pos: p.pos }); };
  const saveEdit  = () => { setPlayers(pl => pl.map(x => editKey(x) === editId ? { ...x, ...form } : x)); setEditId(null); };
  const delP  = p => setPlayers(pl => pl.filter(x => editKey(x) !== editKey(p)));
  const addP  = () => {
    if (!add.name.trim()) return;
    setPlayers(p => [...p, {
      id: Date.now(), athleteId: "",
      name: add.name.trim(),
      nickname: add.nickname.trim() || add.name.trim().split(" ")[0],
      number: add.number || "", pos: add.pos,
      photo: "", stats: initSt(), zStats: initZSt(),
    }]);
    setAdd({ name: "", nickname: "", number: "", pos: "Atacante" });
    setShowAdd(false);
  };

  const inpStyle = (w) => ({
    background: "#1A1A1A", border: `1px solid ${D.bdr}`, color: D.txt,
    borderRadius: 6, padding: "6px 10px", fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 600, outline: "none",
    width: w || undefined,
  });

  const selStyle = {
    background: "#1A1A1A", border: `1px solid ${D.bdr}`, color: D.txt,
    borderRadius: 6, padding: "6px 10px", fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 600, outline: "none",
  };

  return (
    <div style={{ background: D.bg, minHeight: "100%", padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Category selector */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowCat(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", textAlign: "left",
          background: D.card, border: `1px solid ${D.bdr}`,
          borderRadius: 8, padding: "10px 16px", cursor: "pointer",
        }}>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
            fontSize: 10, color: D.dim, letterSpacing: 2 }}>CATEGORIA</span>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: D.red, letterSpacing: 3, flex: 1 }}>
            {allClubMode ? "TODO O CLUBE" : catKey.toUpperCase()}
          </span>
          <span style={{ color: D.dim, fontSize: 12 }}>{showCat ? "▲" : "▼"}</span>
        </button>
        {showCat && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
            background: D.card, border: `1px solid ${D.bdr}`,
            borderRadius: 8, overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            <button onClick={() => { setAllClubMode(true); setShowCat(false); }} style={{
              display: "block", width: "100%",
              background: allClubMode ? D.red : "transparent",
              border: "none", borderBottom: `1px solid ${D.bdr}`,
              color: allClubMode ? "#FFF" : D.dim,
              padding: "10px 16px", cursor: "pointer",
              fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 2, textAlign: "left",
            }}>TODO O CLUBE</button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {CAT_LIST.map(cat => (
                <button key={cat} onClick={() => { setAllClubMode(false); loadCat(cat); setShowCat(false); }} style={{
                  background: !allClubMode && cat === catKey ? D.red : "transparent",
                  border: "none", borderRight: `1px solid ${D.bdr}`, borderBottom: `1px solid ${D.bdr}`,
                  color: !allClubMode && cat === catKey ? "#FFF" : D.txt,
                  padding: "8px 6px", cursor: "pointer",
                  fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 1, textAlign: "center",
                }}>{cat}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NOVO ATLETA row */}
      <div style={{ background: D.card, border: `1px solid ${D.bdr}`, borderRadius: 10, overflow: "hidden" }}>
        <button onClick={() => setShowAdd(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", background: "transparent", border: "none",
          padding: "10px 16px", cursor: "pointer",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: D.red, color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, lineHeight: 1, fontWeight: 300, flexShrink: 0,
          }}>+</div>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, letterSpacing: 2, color: D.txt }}>
            NOVO ATLETA
          </span>
          <span style={{ color: D.dim, fontSize: 11, marginLeft: "auto" }}>{showAdd ? "▲" : "▼"}</span>
        </button>
        {showAdd && (
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
            padding: "0 16px 12px",
          }}>
            <input value={add.name} onChange={e => setAdd(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo" style={{ ...inpStyle(), flex: 2, minWidth: 120 }} />
            <input value={add.nickname} onChange={e => setAdd(f => ({ ...f, nickname: e.target.value }))}
              placeholder="Apelido" style={{ ...inpStyle(), flex: 1, minWidth: 90 }} />
            <input value={add.number} type="number" onChange={e => setAdd(f => ({ ...f, number: e.target.value }))}
              placeholder="Nº" style={{ ...inpStyle(60) }} />
            <select value={add.pos} onChange={e => setAdd(f => ({ ...f, pos: e.target.value }))}
              style={{ ...selStyle, flex: 1, minWidth: 120 }}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={addP} style={{
              background: D.red, color: "#FFF", border: "none",
              borderRadius: 7, padding: "7px 18px", cursor: "pointer",
              fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2,
            }}>ADICIONAR</button>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: 8 }}>
        <StatCard icon="👤" label="Total de Atletas" count={allPlayers.length}    color={D.txt}    />
        <StatCard icon="🧤" label="Goleiros"          count={count("GOLEIROS")}    color={D.green}  />
        <StatCard icon="🛡️" label="Defensores"
          count={allPlayers.filter(p => DEFENDERS_POS.includes(p.pos)).length}     color={D.blue}   />
        <StatCard icon="🎯" label="Meio-Camp."        count={count("MEIO-CAMP.")}  color={D.orange} />
        <StatCard icon="⚡" label="Atacantes"         count={count("ATACANTES")}   color={D.red}    />
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {["TODOS", ...Object.keys(GROUPS)].map(g => {
          const active = activeGroup === g;
          const grp = GROUPS[g];
          const c = grp?.color || D.red;
          return (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              background: active ? c : D.card,
              border: `1px solid ${active ? c : D.bdr}`,
              color: active ? "#FFF" : D.dim,
              borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 1,
              whiteSpace: "nowrap",
            }}>
              {g} ({count(g)})
            </button>
          );
        })}
        <div style={{ flex: 1, minWidth: 120, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar atleta..."
            style={{ ...inpStyle(), width: "100%", paddingLeft: 10 }} />
        </div>
      </div>

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.map((p, idx) => {
          const posColor = p.pos === "Goleiro" ? D.green
            : DEFENDERS_POS.includes(p.pos) ? D.blue
            : ["Volante","Meia"].includes(p.pos) ? D.orange
            : D.red;

          return (
            <div key={`${p._cat}-${p.id}-${idx}`} style={{
              display: "flex", gap: 10, alignItems: "center",
              padding: "6px 10px",
              background: editId === editKey(p) ? "#2A1A1A" : D.card,
              borderRadius: 8,
              border: `1px solid ${editId === editKey(p) ? D.red : D.bdr}`,
            }}>
              <Avatar player={p} imagensDir={imagensDir} />

              {editId === editKey(p) ? (
                <>
                  <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    style={{ ...inpStyle(48) }} placeholder="Nº" />
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ ...inpStyle(), flex: 2, minWidth: 100 }} placeholder="Nome completo" />
                  <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                    style={{ ...inpStyle(), flex: 1, minWidth: 80 }} placeholder="Apelido" />
                  <select value={form.pos} onChange={e => setForm(f => ({ ...f, pos: e.target.value }))}
                    style={{ ...selStyle, flex: 1, minWidth: 110 }}>
                    {POSITIONS.map(pos => <option key={pos}>{pos}</option>)}
                  </select>
                  <button onClick={saveEdit} style={{
                    background: D.red, color: "#FFF", border: "none",
                    borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                    fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 1,
                  }}>SALVAR</button>
                  <button onClick={() => setEditId(null)} style={{
                    background: "transparent", color: D.dim,
                    border: `1px solid ${D.bdr}`, borderRadius: 6,
                    padding: "4px 10px", cursor: "pointer",
                    fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 1,
                  }}>CANCELAR</button>
                </>
              ) : (
                <>
                  <span style={{
                    background: "#FFFFFF12", color: D.dim,
                    borderRadius: 4, padding: "2px 7px",
                    fontFamily: "'Bebas Neue'", fontSize: 13, flexShrink: 0,
                    minWidth: 32, textAlign: "center",
                  }}>
                    {p.number || "—"}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue'", fontSize: 14, color: D.txt,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      lineHeight: 1.2,
                    }}>{p.name}</div>
                    {p.nickname && (
                      <div style={{ fontSize: 10, color: D.dim, fontFamily: "'Rajdhani',sans-serif",
                        fontWeight: 600, letterSpacing: 1 }}>
                        {p.nickname}
                      </div>
                    )}
                  </div>

                  {allClubMode && p._cat !== catKey && (
                    <span style={{
                      background: "#FFFFFF08", color: D.dim, fontSize: 9,
                      fontFamily: "'Bebas Neue'", letterSpacing: 1,
                      border: `1px solid ${D.bdr}`, borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                    }}>{p._cat}</span>
                  )}

                  <span style={{
                    color: posColor, fontSize: 10, fontFamily: "'Rajdhani',sans-serif",
                    fontWeight: 700, border: `1px solid ${posColor}44`,
                    borderRadius: 4, padding: "2px 8px", flexShrink: 0,
                    background: `${posColor}15`,
                  }}>{p.pos}</span>

                  {p._cat === catKey && (
                    <>
                      <button onClick={() => startEdit(p)} style={{
                        background: "transparent", color: D.dim,
                        border: `1px solid ${D.bdr}`, borderRadius: 5,
                        padding: "3px 9px", cursor: "pointer",
                        fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 1,
                      }}>EDITAR</button>
                      <button onClick={() => delP(p)} style={{
                        background: "transparent", color: "#FF4444",
                        border: "1px solid #FF444433", borderRadius: 5,
                        padding: "3px 9px", cursor: "pointer",
                        fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 1,
                      }}>✕</button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ color: D.dim, fontSize: 12, textAlign: "center",
            padding: "24px 0", fontFamily: "'Rajdhani',sans-serif" }}>
            Nenhum atleta encontrado
          </div>
        )}
      </div>
    </div>
  );
}
