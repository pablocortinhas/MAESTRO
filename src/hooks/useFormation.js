import { useState, useEffect } from "react";
import { DEFAULT_FORMATION } from "../constants/squads";

const LS_FORM = cat => `maestro_formation_${cat}`;
const BENCH_ORDER = ["Goleiro","Lateral Direito","Zagueiro","Lateral Esquerdo","Volante","Meia","Ponta","Atacante"];

function buildAssigned(players) {
  const gks    = players.filter(p => p.pos === "Goleiro");
  const others = players.filter(p => p.pos !== "Goleiro");
  return DEFAULT_FORMATION.map((slot, i) => ({
    ...slot,
    player: i === 0 ? (gks[0] || null) : (others[i - 1] || null),
  }));
}

function applyFormation(players, catKey) {
  const base = buildAssigned(players);
  try {
    const raw = localStorage.getItem(LS_FORM(catKey));
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return base.map(slot => {
      const s = saved.find(x => x.id === slot.id);
      if (!s) return slot;
      return { ...slot, x: s.x, y: s.y, player: s.playerId != null ? (players.find(p => p.id === s.playerId) || slot.player) : null };
    });
  } catch { return base; }
}

export function useFormation(players, catKey) {
  const [assigned,  setAssigned]  = useState(() => applyFormation(players, catKey));
  const [fixado,    setFixado]    = useState(false);
  const [subMode,   setSubMode]   = useState(false);
  const [subTarget, setSubTarget] = useState(null);
  const [uniform,   setUniform]   = useState(1);
  const [formSaved, setFormSaved] = useState(false);

  useEffect(() => { setAssigned(applyFormation(players, catKey)); }, [players, catKey]);

  const saveFormation = () => {
    const data = assigned.map(s => ({ id:s.id, x:s.x, y:s.y, playerId:s.player?.id ?? null }));
    try { localStorage.setItem(LS_FORM(catKey), JSON.stringify(data)); } catch {}
    setFormSaved(true);
    setTimeout(() => setFormSaved(false), 2000);
  };

  const reset = () => { setAssigned(buildAssigned(players)); setFixado(false); setSubMode(false); setSubTarget(null); };

  const onFieldIds = new Set(assigned.map(s => s.player?.id).filter(Boolean));
  const bench = players
    .filter(p => !onFieldIds.has(p.id))
    .sort((a, b) => {
      const ai = BENCH_ORDER.indexOf(a.pos), bi = BENCH_ORDER.indexOf(b.pos);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const doSub = pl => { setAssigned(prev => prev.map(s => s.id === subTarget ? { ...s, player:pl } : s)); setSubMode(false); setSubTarget(null); };

  return {
    assigned, setAssigned, fixado, setFixado, subMode, setSubMode, subTarget, setSubTarget,
    uniform, setUniform, formSaved, saveFormation, reset, bench, doSub,
  };
}
