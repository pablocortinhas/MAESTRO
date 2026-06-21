import { useState, useEffect, useMemo } from "react";
import { initSt, initZSt } from "../../utils/dataInit";
import { POSITIONS, CAT_LIST, BASE_CATS } from "../../constants/squads";
import camisa1Img  from "../../../imagens/camisa_1.png";
import camisaGLImg from "../../../imagens/camisa_GL.png";
import fundo1Img   from "../../../imagens/fundo1.png";
import fundo3Img   from "../../../imagens/fundo3.png";
import urubuImg    from "../../../imagens/Urubu.png";

const D = {
  bg:     "#100e0e",
  card:   "#F4F4F4",
  card2:  "#EBEBEB",
  bdr:    "#D4D4D4",
  txt:    "#111111",
  dim:    "#777777",
  red:    "#E8001C",
  green:  "#22C55E",
  blue:   "#3B82F6",
  orange: "#F97316",
  purple: "#EAB308",
};

const GROUPS = {
  GOLEIROS:    { positions: ["Goleiro"],                                         color: D.purple },
  DEFENSORES:  { positions: ["Zagueiro","Lateral Direito","Lateral Esquerdo"],   color: D.blue   },
  "MEIAS":{ positions: ["Volante","Meia"],                                  color: D.green  },
  ATACANTES:   { positions: ["Ponta","Atacante"],                                color: D.red    },
};

const DEFENDERS_POS = ["Zagueiro","Lateral Direito","Lateral Esquerdo"];
const THUMB = 40;

const POS_ORDER = {
  "Goleiro":          0,
  "Zagueiro":         1,
  "Lateral Direito":  2,
  "Lateral Esquerdo": 3,
  "Volante":          4,
  "Meia":             5,
  "Ponta":            6,
  "Atacante":         7,
};

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
          border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }}
        alt={player.nickname || player.name} />
    );
  }
  return (
    <img src={jersey}
      style={{ width: THUMB, height: THUMB, objectFit: "contain", flexShrink: 0, opacity: 0.85 }}
      alt="" />
  );
}

function StatCard({ label, count, color, img, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, minWidth: 80,
      background: active ? "#000" : D.card2,
      border: `2px solid ${D.bdr}`,
      borderRadius: 10,
      padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      transition: "border-color .15s, background .15s",
    }}>
      {img && (
        <img src={img} alt="" style={{
          position: "absolute", right: -6, bottom: -6,
          width: 64, height: 64, objectFit: "contain", opacity: 0.15, pointerEvents: "none",
        }} />
      )}
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10,
        letterSpacing: 1, color: D.dim, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export default function ElencoView({ players, setPlayers, catKey, loadCat, squads }) {
  const [showCat,     setShowCat]     = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [add,         setAdd]         = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [showAdd,     setShowAdd]     = useState(false);
  const [imagensDir,  setImagensDir]  = useState("");
  const [activeGroup, setActiveGroup] = useState("TODOS");
  const [search,      setSearch]      = useState("");
  const [allClubMode, setAllClubMode] = useState(false);

  useEffect(() => { window.electronAPI?.getImagensDir().then(d => d && setImagensDir(d)); }, []);

  const isBaseMode = catKey === "BASE";

  const allPlayers = useMemo(() => {
    if (isBaseMode) {
      return BASE_CATS.flatMap(cat =>
        (squads[cat] || []).map(p => ({ ...p, _cat: cat }))
      );
    }
    if (allClubMode) {
      return Object.entries(squads || {}).flatMap(([cat, list]) =>
        list.map(p => ({ ...p, _cat: cat }))
      );
    }
    return players.map(p => ({ ...p, _cat: catKey }));
  }, [isBaseMode, allClubMode, players, squads, catKey]);

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
    return [...list].sort((a, b) => (POS_ORDER[a.pos] ?? 99) - (POS_ORDER[b.pos] ?? 99));
  }, [allPlayers, activeGroup, search]);

  const count = g => {
    if (g === "TODOS") return allPlayers.length;
    const grp = GROUPS[g];
    if (!grp) return 0;
    return allPlayers.filter(p => grp.positions.includes(p.pos)).length;
  };

  const editKey   = p => `${p._cat || catKey}-${p.id}`;
  const startEdit = p => { setEditId(editKey(p)); setForm({ name: p.name, nickname: p.nickname || "", number: p.number || "", pos: p.pos }); };
  const saveEdit  = () => { setPlayers(pl => pl.map(x => editKey(x) === editId ? { ...x, ...form } : x)); setEditId(null); };
  const delP      = p => setPlayers(pl => pl.filter(x => editKey(x) !== editKey(p)));
  const addP      = () => {
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
    background: "#FFFFFF", border: `1px solid ${D.bdr}`, color: D.txt,
    borderRadius: 6, padding: "6px 10px", fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 600, outline: "none",
    width: w || undefined,
  });

  const selStyle = {
    background: "#FFFFFF", border: `1px solid ${D.bdr}`, color: D.txt,
    borderRadius: 6, padding: "6px 10px", fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 600, outline: "none",
  };

  return (
    <div style={{ background: D.bg, minHeight: "100%", padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Stats cards — clicáveis para filtrar */}
      <div style={{ display: "flex", gap: 8 }}>
        <StatCard label="Total de Atletas" count={allPlayers.length}      color={activeGroup === "TODOS" ? "#FFF" : "#111"}     img={urubuImg}
          onClick={() => setActiveGroup("TODOS")} active={activeGroup === "TODOS"} />
        <StatCard label="Goleiros"          count={count("GOLEIROS")}      color={D.purple}
          onClick={() => setActiveGroup("GOLEIROS")} active={activeGroup === "GOLEIROS"} />
        <StatCard label="Defensores"        count={count("DEFENSORES")}    color={D.blue}
          onClick={() => setActiveGroup("DEFENSORES")} active={activeGroup === "DEFENSORES"} />
        <StatCard label="Meias"        count={count("MEIAS")}    color={D.green}
          onClick={() => setActiveGroup("MEIAS")} active={activeGroup === "MEIAS"} />
        <StatCard label="Atacantes"         count={count("ATACANTES")}     color={D.red}
          onClick={() => setActiveGroup("ATACANTES")} active={activeGroup === "ATACANTES"} />
      </div>

      {/* Search + novo atleta */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar atleta..."
            style={{ ...inpStyle(), width: "100%", paddingLeft: 10 }} />
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
          background: showAdd ? D.red : D.card,
          border: `1px solid ${showAdd ? D.red : D.bdr}`,
          color: showAdd ? "#FFF" : D.txt,
          borderRadius: 6, padding: "5px 14px", cursor: "pointer",
          fontFamily: "'Bebas Neue'", fontSize: 13, letterSpacing: 1,
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> NOVO ATLETA
        </button>
      </div>

      {/* Novo atleta form (expands below filter row) */}
      {showAdd && (
        <div style={{
          background: D.card, border: `1px solid ${D.bdr}`, borderRadius: 10,
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 16px",
        }}>
          <input value={add.name} onChange={e => setAdd(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome completo" style={{ ...inpStyle(), flex: 2, minWidth: 120 }} />
          <input value={add.nickname} onChange={e => setAdd(f => ({ ...f, nickname: e.target.value }))}
            placeholder="Apelido" style={{ ...inpStyle(), flex: 1, minWidth: 90 }} />
          <input value={add.number} type="number" onChange={e => setAdd(f => ({ ...f, number: e.target.value }))}
            placeholder="N°" style={{ ...inpStyle(60) }} />
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

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {filtered.map((p, idx) => {
          const posColor = p.pos === "Goleiro"             ? D.purple
            : DEFENDERS_POS.includes(p.pos)               ? D.blue
            : ["Volante","Meia"].includes(p.pos)           ? D.green
            : D.red;

          const isEditing = editId === editKey(p);

          return (
            <div key={`${p._cat}-${p.id}-${idx}`} style={{
              display: "flex", gap: 10, alignItems: "center",
              padding: "6px 10px",
              backgroundImage: isEditing ? "none" : `linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.52)), url(${fundo1Img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: isEditing ? "#2A1A1A" : "transparent",
              borderRadius: 8,
              borderTop:    `1px solid ${isEditing ? D.red : "transparent"}`,
              borderRight:  `1px solid ${isEditing ? D.red : "transparent"}`,
              borderBottom: `1px solid ${isEditing ? D.red : "transparent"}`,
              borderLeft:   `4px solid ${posColor}`,
              overflow: "hidden",
            }}>
              <Avatar player={p} imagensDir={imagensDir} />

              {isEditing ? (
                <>
                  <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    style={{ ...inpStyle(48) }} placeholder="N°" />
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
                    background: "transparent", color: "#AAAAAA",
                    border: "1px solid #444", borderRadius: 6,
                    padding: "4px 10px", cursor: "pointer",
                    fontFamily: "'Bebas Neue'", fontSize: 12, letterSpacing: 1,
                  }}>CANCELAR</button>
                </>
              ) : (
                <>
                  <span style={{
                    background: "rgba(0,0,0,0.45)", color: "#FFFFFF",
                    borderRadius: 4, padding: "2px 7px",
                    fontFamily: "'Bebas Neue'", fontSize: 13, flexShrink: 0,
                    minWidth: 32, textAlign: "center",
                  }}>
                    {p.number || "—"}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue'", fontSize: 14, color: "#FFFFFF",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                    }}>{p.name}</div>
                    {p.athleteId ? (
                      <div style={{
                        fontSize: 10, color: "rgba(255,255,255,0.75)",
                        fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: 1,
                        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                      }}>
                        {p.athleteId}
                      </div>
                    ) : p.nickname ? (
                      <div style={{
                        fontSize: 10, color: "rgba(255,255,255,0.6)",
                        fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: 1,
                      }}>
                        {p.nickname}
                      </div>
                    ) : null}
                  </div>

                  {(isBaseMode || (allClubMode && p._cat !== catKey)) && (
                    <span style={{
                      background: "rgba(0,0,0,0.4)", color: "#FFF", fontSize: 9,
                      fontFamily: "'Bebas Neue'", letterSpacing: 1,
                      border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4,
                      padding: "1px 6px", flexShrink: 0,
                    }}>{p._cat}</span>
                  )}

                  <span style={{
                    background: posColor, color: "#FFFFFF",
                    fontSize: 13, fontFamily: "'Bebas Neue'",
                    letterSpacing: 1, borderRadius: 4, padding: "3px 10px", flexShrink: 0,
                  }}>{p.pos}</span>

                  {!isBaseMode && p._cat === catKey && (
                    <>
                      <button onClick={() => startEdit(p)} style={{
                        background: "rgba(0,0,0,0.4)", color: "#FFFFFF",
                        border: "1px solid rgba(255,255,255,0.25)", borderRadius: 5,
                        padding: "4px 12px", cursor: "pointer",
                        fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 1,
                      }}>EDITAR</button>
                      <button onClick={() => delP(p)} style={{
                        background: "rgba(232,0,28,0.25)", color: "#FF4444",
                        border: "1px solid rgba(255,68,68,0.3)", borderRadius: 5,
                        padding: "3px 9px", cursor: "pointer",
                        fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 1,
                      }}>X</button>
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
