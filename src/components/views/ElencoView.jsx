import { useState } from "react";
import { C }          from "../../constants/colors";
import { lBtn }       from "../../utils/styles";
import { initSt, initZSt } from "../../utils/dataInit";
import { POSITIONS, CAT_LIST } from "../../constants/squads";
import SoberCard from "../common/SoberCard";
import FG        from "../common/FG";
import camisa1Img   from "../../../imagens/camisa_1.png";
import camisaGLImg  from "../../../imagens/camisa_GL.png";

export default function ElencoView({ players, setPlayers, catKey, loadCat, showCat, setShowCat }) {
  const [editId, setEditId] = useState(null);
  const [form,   setForm]   = useState({ name: "", number: "", pos: "Atacante" });
  const [add,    setAdd]    = useState({ name: "", number: "", pos: "Atacante" });

  const startEdit = p => { setEditId(p.id); setForm({ name: p.name, number: p.number, pos: p.pos }); };
  const saveEdit  = () => { setPlayers(p => p.map(x => x.id === editId ? { ...x, ...form } : x)); setEditId(null); };
  const delP      = id => setPlayers(p => p.filter(x => x.id !== id));
  const addP      = () => {
    if (!add.name.trim()) return;
    setPlayers(p => [...p, {
      id: Date.now(), name: add.name.trim(),
      number: add.number || "", pos: add.pos,
      stats: initSt(), zStats: initZSt(),
    }]);
    setAdd({ name: "", number: "", pos: "Atacante" });
  };

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
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: C.red, letterSpacing: 3, flex: 1 }}>{catKey.toUpperCase()}</span>
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
              {CAT_LIST.map(cat => (
                <button key={cat} onClick={() => loadCat(cat)} style={{
                  background: cat === catKey ? C.red : "transparent",
                  border: "none",
                  borderRight: `1px solid ${C.bdr}`,
                  borderBottom: `1px solid ${C.bdr}`,
                  color: cat === catKey ? C.wh : C.txt,
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

      {/* Add player */}
      <SoberCard title="ADICIONAR JOGADOR">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FG label="NOME" flex={2} minW={130}>
            <input value={add.name} onChange={e => setAdd(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
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
      <SoberCard title={`ELENCO (${players.length} jogadores)`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {players.map(p => (
            <div key={p.id} style={{
              display: "flex", gap: 8, alignItems: "center",
              padding: "6px 8px",
              background: editId === p.id ? "#FFF8F8" : "#FAFAFA",
              borderRadius: 6,
              border: `1px solid ${editId === p.id ? C.red : C.bdr}`,
            }}>
              <img
                src={p.pos === "Goleiro" ? camisaGLImg : camisa1Img}
                style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
              />
              {editId === p.id ? (
                <>
                  <input
                    value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                    style={{ width: 48 }} placeholder="Nº"
                  />
                  <input
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ flex: 2, minWidth: 100 }}
                  />
                  <select
                    value={form.pos} onChange={e => setForm(f => ({ ...f, pos: e.target.value }))}
                    style={{ flex: 1, minWidth: 110 }}
                  >
                    {POSITIONS.map(pos => <option key={pos}>{pos}</option>)}
                  </select>
                  <button onClick={saveEdit} style={{ ...lBtn(true), fontSize: 11, padding: "4px 10px" }}>SALVAR</button>
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
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, flex: 1 }}>{p.name}</span>
                  <span style={{
                    color: C.txtM, fontSize: 10,
                    fontFamily: "'Rajdhani',sans-serif",
                    border: `1px solid ${C.bdr}`,
                    borderRadius: 4, padding: "1px 7px",
                  }}>
                    {p.pos}
                  </span>
                  <button onClick={() => startEdit(p)} style={{ ...lBtn(false), fontSize: 10, padding: "3px 8px" }}>EDITAR</button>
                  <button onClick={() => delP(p.id)} style={{
                    background: "#FFF0F0", border: `1px solid ${C.negL}44`,
                    color: C.negL, borderRadius: 4, padding: "3px 8px",
                    fontFamily: "'Bebas Neue'", fontSize: 10,
                    letterSpacing: 1, cursor: "pointer",
                  }}>
                    REMOVER
                  </button>
                </>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <div style={{ color: C.bdr2, fontSize: 11, textAlign: "center", padding: "12px 0", fontFamily: "'Rajdhani'" }}>
              Nenhum jogador cadastrado
            </div>
          )}
        </div>
      </SoberCard>
    </div>
  );
}
