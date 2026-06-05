import { useState, useEffect, useMemo } from "react";
import { C }          from "../../constants/colors";
import { lBtn }       from "../../utils/styles";
import { initSt, initZSt } from "../../utils/dataInit";
import { POSITIONS, CAT_LIST } from "../../constants/squads";
import SoberCard from "../common/SoberCard";
import FG        from "../common/FG";
import camisa1Img   from "../../../imagens/camisa_1.png";
import camisaGLImg  from "../../../imagens/camisa_GL.png";

const THUMB = 44;

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

  if (url) {
    return (
      <img
        src={url}
        onError={() => setBroken(true)}
        style={{
          width: THUMB, height: THUMB,
          objectFit: "cover", borderRadius: 6,
          border: `1px solid ${C.bdr}`,
          flexShrink: 0,
        }}
        alt={player.nickname || player.name}
      />
    );
  }

  const jersey = player.pos === "Goleiro" ? camisaGLImg : camisa1Img;
  return (
    <img
      src={jersey}
      style={{
        width: THUMB, height: THUMB,
        objectFit: "contain", flexShrink: 0,
      }}
      alt=""
    />
  );
}

export default function ElencoView({ players, setPlayers, catKey, loadCat, squads }) {
  const [showCat,    setShowCat]    = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [add,        setAdd]        = useState({ name: "", nickname: "", number: "", pos: "Atacante" });
  const [imagensDir, setImagensDir] = useState("");
  const [viewFilter, setViewFilter] = useState("categoria");
  const [allClubMode, setAllClubMode] = useState(false);

  const displayPlayers = useMemo(() => {
    if (allClubMode) {
      const all = Object.entries(squads || {}).flatMap(([cat, list]) =>
        list.map(p => ({ ...p, _cat: cat }))
      );
      if (viewFilter && viewFilter !== "categoria") return all.filter(p => p.pos === viewFilter);
      return all;
    }
    if (viewFilter === "categoria") return players.map(p => ({ ...p, _cat: catKey }));
    return players.filter(p => p.pos === viewFilter).map(p => ({ ...p, _cat: catKey }));
  }, [allClubMode, viewFilter, players, squads, catKey]);

  useEffect(() => {
    window.electronAPI?.getImagensDir().then(d => d && setImagensDir(d));
  }, []);

  const editKey = p => `${p._cat || catKey}-${p.id}`;
  const startEdit = p => {
    setEditId(editKey(p));
    setForm({ name: p.name, nickname: p.nickname || "", number: p.number || "", pos: p.pos });
  };
  const saveEdit = () => {
    setPlayers(pl => pl.map(x => editKey(x) === editId ? { ...x, ...form } : x));
    setEditId(null);
  };
  const delP = p => setPlayers(pl => pl.filter(x => editKey(x) !== editKey(p)));
  const addP = () => {
    if (!add.name.trim()) return;
    setPlayers(p => [...p, {
      id: Date.now(),
      athleteId: "",
      name:     add.name.trim(),
      nickname: add.nickname.trim() || add.name.trim().split(" ")[0],
      number:   add.number || "",
      pos:      add.pos,
      photo:    "",
      stats: initSt(), zStats: initZSt(),
    }]);
    setAdd({ name: "", nickname: "", number: "", pos: "Atacante" });
  };

  const catLabel = allClubMode ? "TODOS" : catKey.toUpperCase();

  const cardTitle = allClubMode
    ? (viewFilter === "categoria" ? `TODO O CLUBE — ${displayPlayers.length} atletas` : `${viewFilter.toUpperCase()} (TODO O CLUBE) — ${displayPlayers.length} atletas`)
    : (viewFilter === "categoria"
        ? `ELENCO ${catKey.toUpperCase()} — ${displayPlayers.length} atletas`
        : `${viewFilter.toUpperCase()} — ${displayPlayers.length} atletas`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 900, padding: "4px 0" }}>

      {/* Category selector */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowCat(s => !s)} style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", textAlign: "left",
          background: C.card, border: `2px solid ${C.red}`,
          borderRadius: 8, padding: "10px 16px", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        }}>
          <span style={{ fontSize: 9, color: C.txtM, letterSpacing: 3, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>CATEGORIA</span>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: C.red, letterSpacing: 3, flex: 1 }}>{catLabel}</span>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: C.txtM }}>{showCat ? "▲" : "▼"}</span>
        </button>
        {showCat && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)",
            left: 0, right: 0, zIndex: 200,
            background: C.card, border: `1px solid ${C.bdr}`,
            borderRadius: 8, overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,.12)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {/* Opção TODOS */}
              <button
                onClick={() => { setAllClubMode(true); setViewFilter("categoria"); setShowCat(false); }}
                style={{
                  gridColumn: "1 / -1",
                  background: allClubMode ? C.red : "#F5F5F5",
                  border: "none",
                  borderBottom: `1px solid ${C.bdr}`,
                  color: allClubMode ? "#FFF" : C.txt,
                  padding: "10px 8px", cursor: "pointer",
                  fontFamily: "'Bebas Neue'", fontSize: 14,
                  letterSpacing: 2, textAlign: "center",
                }}
              >
                TODOS
              </button>
              {CAT_LIST.map(cat => (
                <button key={cat} onClick={() => { setAllClubMode(false); loadCat(cat); setShowCat(false); }} style={{
                  background: !allClubMode && cat === catKey ? C.red : "transparent",
                  border: "none",
                  borderRight: `1px solid ${C.bdr}`,
                  borderBottom: `1px solid ${C.bdr}`,
                  color: !allClubMode && cat === catKey ? C.wh : C.txt,
                  padding: "10px 8px", cursor: "pointer",
                  fontFamily: "'Bebas Neue'", fontSize: 14,
                  letterSpacing: 1, textAlign: "center",
                }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter bar — só posições (sem TODO O CLUBE) */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: C.txtM, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 2, flexShrink: 0 }}>VER:</span>
        {[
          { key: "categoria", label: "CATEGORIA" },
          ...POSITIONS.map(p => ({ key: p, label: p.toUpperCase() })),
        ].map(f => (
          <button key={f.key} onClick={() => setViewFilter(f.key)} style={{
            background: viewFilter === f.key ? C.red : "#F5F5F5",
            border: `1px solid ${viewFilter === f.key ? C.red : "#D4D4D4"}`,
            color: viewFilter === f.key ? "#FFF" : C.txtM,
            borderRadius: 4, padding: "3px 9px", cursor: "pointer",
            fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 1,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Add player */}
      <SoberCard title="ADICIONAR JOGADOR">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FG label="NOME COMPLETO" flex={2} minW={130}>
            <input value={add.name} onChange={e => setAdd(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
          </FG>
          <FG label="APELIDO (CAMPO)" flex={1} minW={90}>
            <input value={add.nickname} onChange={e => setAdd(f => ({ ...f, nickname: e.target.value }))} placeholder="Como aparece no campo" />
          </FG>
          <FG label="Nº" width={64}>
            <input value={add.number} type="number" onChange={e => setAdd(f => ({ ...f, number: e.target.value }))} placeholder="00" />
          </FG>
          <FG label="POSIÇÃO" flex={1} minW={130}>
            <select value={add.pos} onChange={e => setAdd(f => ({ ...f, pos: e.target.value }))}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </FG>
          <button onClick={addP} style={{ ...lBtn(true), padding: "7px 16px", alignSelf: "flex-end" }}>
            ADICIONAR
          </button>
        </div>
      </SoberCard>

      {/* Player list */}
      <SoberCard title={cardTitle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {displayPlayers.map((p, idx) => (
            <div key={`${p._cat}-${p.id}-${idx}`} style={{
              display: "flex", gap: 8, alignItems: "center",
              padding: "6px 8px",
              background: editId === editKey(p) ? "#FFF8F8" : "#FAFAFA",
              borderRadius: 6,
              border: `1px solid ${editId === editKey(p) ? C.red : C.bdr}`,
            }}>

              <Avatar player={p} imagensDir={imagensDir} />

              {editId === editKey(p) ? (
                <>
                  <input
                    value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    style={{ width: 48 }} placeholder="Nº"
                  />
                  <input
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ flex: 2, minWidth: 100 }} placeholder="Nome completo"
                  />
                  <input
                    value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                    style={{ flex: 1, minWidth: 80 }} placeholder="Apelido"
                    title="Apelido exibido no campo"
                  />
                  <select
                    value={form.pos} onChange={e => setForm(f => ({ ...f, pos: e.target.value }))}
                    style={{ flex: 1, minWidth: 110 }}
                  >
                    {POSITIONS.map(pos => <option key={pos}>{pos}</option>)}
                  </select>
                  <button onClick={saveEdit}             style={{ ...lBtn(true),  fontSize: 11, padding: "4px 10px" }}>SALVAR</button>
                  <button onClick={() => setEditId(null)} style={{ ...lBtn(false), fontSize: 11, padding: "4px 10px" }}>CANCELAR</button>
                </>
              ) : (
                <>
                  <span style={{
                    background: C.red, color: C.wh,
                    borderRadius: 3, padding: "0 6px",
                    fontFamily: "'Bebas Neue'", fontSize: 13, flexShrink: 0,
                  }}>
                    #{p.number || "—"}
                  </span>

                  <div style={{ flex: 2, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue'", fontSize: 14, lineHeight: 1.1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {p.name}
                    </div>
                    {p.nickname && (
                      <div style={{ fontSize: 9, color: C.red, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                        ▶ {p.nickname}
                      </div>
                    )}
                  </div>

                  {p._cat !== catKey && (
                    <span style={{
                      background: "#E8001C22", color: C.red,
                      fontSize: 9, fontFamily: "'Bebas Neue'", letterSpacing: 1,
                      border: `1px solid ${C.red}44`, borderRadius: 4, padding: "1px 6px",
                      flexShrink: 0,
                    }}>
                      {p._cat}
                    </span>
                  )}

                  {p.athleteId && (
                    <span style={{
                      color: "#999", fontSize: 9, fontFamily: "monospace",
                      border: `1px solid #E0E0E0`, borderRadius: 3, padding: "1px 5px",
                      flexShrink: 0, maxWidth: 130,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={`ID do Atleta: ${p.athleteId}`}>
                      {p.athleteId}
                    </span>
                  )}

                  <span style={{
                    color: C.txtM, fontSize: 10, fontFamily: "'Rajdhani',sans-serif",
                    border: `1px solid ${C.bdr}`, borderRadius: 4, padding: "1px 7px",
                    flexShrink: 0,
                  }}>
                    {p.pos}
                  </span>

                  {p._cat === catKey && (
                    <button onClick={() => startEdit(p)} style={{ ...lBtn(false), fontSize: 10, padding: "3px 8px" }}>EDITAR</button>
                  )}
                  {p._cat === catKey && (
                    <button onClick={() => delP(p)} style={{
                      background: "#FFF0F0", border: `1px solid ${C.negL}44`,
                      color: C.negL, borderRadius: 4, padding: "3px 8px",
                      fontFamily: "'Bebas Neue'", fontSize: 10,
                      letterSpacing: 1, cursor: "pointer",
                    }}>
                      REMOVER
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {displayPlayers.length === 0 && (
            <div style={{ color: C.bdr2, fontSize: 11, textAlign: "center", padding: "12px 0", fontFamily: "'Rajdhani'" }}>
              Nenhum jogador cadastrado
            </div>
          )}
        </div>
      </SoberCard>

      {imagensDir && (
        <div style={{
          fontSize: 10, color: C.txtM, fontFamily: "'Rajdhani',sans-serif",
          background: "#FAFAFA", border: `1px solid ${C.bdr}`,
          borderRadius: 6, padding: "8px 12px", lineHeight: 1.6,
        }}>
          <strong>Fotos dos atletas:</strong> adicione a coluna <code>app</code> na planilha com o nome do arquivo (ex: <code>AntonioCalixto2016.jpg</code>).
          Os arquivos devem estar em <code style={{ wordBreak: "break-all" }}>{imagensDir}\fotos\</code>.
          Após editar a planilha, rode <code>npm run import-squads</code> e depois <code>npm run build</code>.
        </div>
      )}
    </div>
  );
}
