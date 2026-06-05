const G  = "#059669"; // verde — positivo
const R  = "#DC2626"; // vermelho — negativo
const O  = "#C65100"; // laranja
const AM = "#F59E0B"; // âmbar — estatísticas

export const SECTORS = [
  /* ── Estatísticas ───────────────────────────────────────── */
  { id:"stats", label:"Estatísticas", color:"#7C3AED", actions:[
    { id:"gol",         label:"GOL",        type:"single", color:AM },
    { id:"assistencia", label:"ASSISTÊNCIA", type:"single", color:G  },
  ]},

  /* ── Ações Ofensivas ────────────────────────────────────── */
  { id:"of", label:"Ações Ofensivas", color:"#C65100", actions:[
    { id:"finaliz",    label:"FINALIZAÇÃO",    type:"split",
      posId:"finalPos",      posLabel:"CERTA",  posColor:G, negId:"finalNeg",      negLabel:"ERRADA",  negColor:R },
    { id:"um1Of",      label:"1×1 OFENSIVO",   type:"split",
      posId:"um1OfPos",      posLabel:"GANHO",  posColor:G, negId:"um1OfNeg",      negLabel:"PERDIDO", negColor:R },
    { id:"perdaPosse", label:"PERDA DA POSSE", type:"single", color:R },
    { id:"passeChave", label:"PASSE CHAVE",    type:"split",
      posId:"passeChavePos", posLabel:"CERTO",  posColor:G, negId:"passeChaveNeg", negLabel:"ERRADO",  negColor:R },
  ]},

  /* ── Ações Defensivas ───────────────────────────────────── */
  { id:"def", label:"Ações Defensivas", color:"#1D4ED8", actions:[
    { id:"recuperacao", label:"RECUPERAÇÃO DA POSSE",    type:"single", color:G },
    { id:"jogoAereo",   label:"JOGO AÉREO",              type:"split",
      posId:"jogoAereoPos", posLabel:"GANHO",   posColor:G, negId:"jogoAereoNeg", negLabel:"PERDIDO",  negColor:R },
    { id:"bloquFinal",  label:"BLOQUEIO DE FINALIZAÇÃO", type:"single", color:G },
    { id:"um1Def",      label:"1×1 DEFENSIVO",           type:"split",
      posId:"um1DefPos",    posLabel:"GANHO",   posColor:G, negId:"um1DefNeg",    negLabel:"PERDIDO",  negColor:R },
    { id:"desarme",     label:"DESARME",                 type:"single", color:G },
  ]},

  /* ── Relação com a Bola ─────────────────────────────────── */
  { id:"rel", label:"Relação com a Bola", color:"#059669", actions:[
    { id:"acaoPressao", label:"AÇÃO SOB PRESSÃO", type:"split",
      posId:"acaoPressaoPos",  posLabel:"POSITIVA", posColor:G, negId:"acaoPressaoNeg",  negLabel:"NEGATIVA",  negColor:R },
    { id:"falta",       label:"FALTA",             type:"split",
      posId:"faltaRec",        posLabel:"SOFRIDA",  posColor:G, negId:"faltaCom",         negLabel:"COMETIDA",  negColor:O },
    { id:"cruzamento",  label:"CRUZAMENTO",         type:"split",
      posId:"cruzamentoPos",   posLabel:"CERTO",    posColor:G, negId:"cruzamentoNeg",    negLabel:"ERRADO",    negColor:R },
    { id:"passeLongo",  label:"PASSE LONGO",        type:"split",
      posId:"passeLongoPos",   posLabel:"CERTO",    posColor:G, negId:"passeLongoNeg",    negLabel:"ERRADO",    negColor:R },
  ]},
];

export const ALL_IDS = [];
SECTORS.forEach(s => s.actions.forEach(a => {
  if (a.type === "single") ALL_IDS.push(a.id);
  else { ALL_IDS.push(a.posId); ALL_IDS.push(a.negId); }
}));

export const DEFAULT_LIVE_BUTTONS = [
  {id:"gol",           col:0,row:0},{id:"assistencia",   col:1,row:0},
  {id:"finalPos",      col:2,row:0},{id:"um1OfPos",      col:3,row:0},
  {id:"jogoAereoPos",  col:4,row:0},{id:"um1DefPos",     col:5,row:0},
  {id:"perdaPosse",    col:0,row:1},{id:"faltaCom",      col:1,row:1},
  {id:"finalNeg",      col:2,row:1},{id:"um1OfNeg",      col:3,row:1},
  {id:"jogoAereoNeg",  col:4,row:1},{id:"um1DefNeg",     col:5,row:1},
  {id:"desarme",       col:0,row:2},{id:"recuperacao",   col:1,row:2},
  {id:"bloquFinal",    col:2,row:2},{id:"passeChavePos", col:3,row:2},
  {id:"cruzamentoPos", col:4,row:2},{id:"passeLongoPos", col:5,row:2},
];
