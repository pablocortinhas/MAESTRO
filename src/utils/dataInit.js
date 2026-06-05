import { ALL_IDS } from "../constants/sectors";

export const initSt   = () => Object.fromEntries(ALL_IDS.map(id => [id, 0]));
export const initZSt  = () => Object.fromEntries([...Array(50)].map((_, i) => [i, initSt()]));
export const mkPlayers = list => list.map(p => ({ ...p, stats: initSt(), zStats: initZSt() }));
