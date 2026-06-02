const G  = "#059669"; // verde — ação positiva
const R  = "#DC2626"; // vermelho — ação negativa
const Y  = "#CA8A04"; // amarelo — cartão amarelo
const VR = "#E8001C"; // vermelho vibrante — cartão vermelho
const O  = "#C65100"; // laranja — advertências e faltas
const BK = "#374151"; // preto — ações extras

export const SECTORS = [
  /* ── Ofensivo ─────────────────────────────────────────── */
  { id:"of", label:"Ofensivo", color:"#C65100", actions:[
    { id:"gol_fav",     label:"GOL A FAVOR",           type:"single", color:G, openGoalModal:"home" },
    { id:"chegada",     label:"CHEGADA ÚLTIMO TERÇO",   type:"single", color:BK },
    { id:"finaliz",     label:"FINALIZAÇÃO",            type:"split",
      posId:"finalPos",  posLabel:"CERTA",  posColor:G,  negId:"finalNeg",  negLabel:"ERRADA",     negColor:R },
    { id:"drible",      label:"DRIBLE",                 type:"split",
      posId:"driblePos", posLabel:"GANHO",  posColor:G,  negId:"dribleNeg", negLabel:"PERDIDO",    negColor:R },
    { id:"um1Of",       label:"1×1 OFENSIVO",           type:"split",
      posId:"um1OfPos",  posLabel:"GANHO",  posColor:G,  negId:"um1OfNeg",  negLabel:"PERDIDO",    negColor:R },
    { id:"cruzamento",  label:"CRUZAMENTO",             type:"single", color:BK },
    { id:"assistencia", label:"ASSISTÊNCIA",            type:"single", color:G },
    { id:"pen_sofr",    label:"PÊNALTI SOFRIDO",        type:"single", color:O, openPenaltyModal:"home" },
    { id:"pen_conv",    label:"PÊNALTI CONVERTIDO",     type:"single", color:G },
    { id:"pen_perd",    label:"PÊNALTI PERDIDO",        type:"single", color:R },
  ]},

  /* ── Defensivo ────────────────────────────────────────── */
  { id:"def", label:"Defensivo", color:"#1D4ED8", actions:[
    { id:"gol_sofr",      label:"GOL SOFRIDO",          type:"single", color:R, openGoalModal:"away" },
    { id:"desarme",       label:"DESARME",               type:"single", color:G },
    { id:"recuperacao",   label:"RECUPERAÇÃO",           type:"single", color:G },
    { id:"um1Def",        label:"1×1 DEFENSIVO",         type:"split",
      posId:"um1DefPos", posLabel:"GANHO",    posColor:G, negId:"um1DefNeg", negLabel:"PERDIDO",    negColor:R },
    { id:"corte",         label:"CORTE",                 type:"single", color:G },
    { id:"interceptacao", label:"INTERCEPTAÇÃO",         type:"single", color:G },
    { id:"goleiro",       label:"AÇÃO GOLEIRO",          type:"split",
      posId:"goleiroFla", posLabel:"FLAMENGO", posColor:G, negId:"goleiroAdv", negLabel:"ADVERSÁRIO", negColor:R },
    { id:"pen_comet",     label:"PÊNALTI COMETIDO",      type:"single", color:O, openPenaltyModal:"away" },
    { id:"pen_def",       label:"PÊNALTI DEFENDIDO",     type:"single", color:G },
  ]},

  /* ── Advertência ──────────────────────────────────────── */
  { id:"adv", label:"Advertência", color:"#B45309", actions:[
    { id:"cartAmr",     label:"CARTÃO AMARELO",  type:"single", color:Y },
    { id:"cartVerm",    label:"CARTÃO VERMELHO", type:"single", color:VR },
    { id:"falta",       label:"FALTA",           type:"split",
      posId:"faltaRec", posLabel:"SOFRIDA", posColor:O, negId:"faltaCom", negLabel:"COMETIDA", negColor:O },
    { id:"impedimento", label:"IMPEDIMENTO",     type:"single", color:O },
  ]},
];

export const ALL_IDS = [];
SECTORS.forEach(s => s.actions.forEach(a => {
  if (a.type === "single") ALL_IDS.push(a.id);
  else { ALL_IDS.push(a.posId); ALL_IDS.push(a.negId); }
}));

export const DEFAULT_LIVE_BUTTONS = [
  {id:"gol_fav",    col:0,row:0},{id:"assistencia",  col:1,row:0},
  {id:"finalPos",   col:2,row:0},{id:"driblePos",    col:3,row:0},
  {id:"cruzamento", col:4,row:0},{id:"goleiroFla",   col:5,row:0},
  {id:"gol_sofr",   col:0,row:1},{id:"faltaCom",     col:1,row:1},
  {id:"finalNeg",   col:2,row:1},{id:"dribleNeg",    col:3,row:1},
  {id:"cartAmr",    col:4,row:1},{id:"cartVerm",     col:5,row:1},
  {id:"desarme",    col:0,row:2},{id:"recuperacao",  col:1,row:2},
  {id:"um1DefPos",  col:2,row:2},{id:"um1OfPos",     col:3,row:2},
  {id:"faltaRec",   col:4,row:2},{id:"impedimento",  col:5,row:2},
];
