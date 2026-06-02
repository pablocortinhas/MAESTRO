export const POSITIONS = [
  "Goleiro","Zagueiro","Lateral Direito","Lateral Esquerdo",
  "Volante","Meia","Ponta","Atacante",
];

export const CAT_LIST = [
  "Sub 08","Sub 09","Sub 10","Sub 11","Sub 12","Sub 13",
  "Sub 14","Sub 15","Sub 16","Sub 17","Sub 20","Profissional","Feminino",
];

export const SQUADS = {
  "Sub 13": [
    {id:1,  name:"Eduardo Costa",      number:"1",  pos:"Goleiro"},
    {id:2,  name:"João Miguel",        number:"2",  pos:"Lateral Direito"},
    {id:3,  name:"Kauê Braga",         number:"3",  pos:"Zagueiro"},
    {id:4,  name:"Guilherme",          number:"4",  pos:"Zagueiro"},
    {id:5,  name:"Papa",               number:"5",  pos:"Volante"},
    {id:6,  name:"Bernardo Marins",    number:"6",  pos:"Ponta"},
    {id:7,  name:"Enzinho",            number:"7",  pos:"Meia"},
    {id:8,  name:"Miguel Vitor",       number:"8",  pos:"Volante"},
    {id:9,  name:"Enzo Gabriel",       number:"9",  pos:"Atacante"},
    {id:10, name:"Bernardo Aiex",      number:"10", pos:"Meia"},
    {id:11, name:"Arthur Santana",     number:"11", pos:"Atacante"},
    {id:12, name:"Arthur Leonardo",    number:"12", pos:"Goleiro"},
    {id:13, name:"Bento",              number:"13", pos:"Zagueiro"},
    {id:14, name:"Davi Henrique",      number:"14", pos:"Volante"},
    {id:15, name:"Diego Velloso",      number:"15", pos:"Volante"},
    {id:16, name:"Pietro Andrey",      number:"16", pos:"Lateral Esquerdo"},
    {id:17, name:"Théo",               number:"17", pos:"Lateral Esquerdo"},
    {id:18, name:"Ivan",               number:"18", pos:"Ponta"},
    {id:19, name:"Vitor",              number:"19", pos:"Zagueiro"},
    {id:20, name:"Pietro Aragon",      number:"20", pos:"Volante"},
    {id:21, name:"Rhay",               number:"21", pos:"Ponta"},
    {id:22, name:"Kaio Lima",          number:"22", pos:"Lateral Direito"},
    {id:23, name:"Bernardo Praça",     number:"23", pos:"Zagueiro"},
    {id:24, name:"Guilherme Medeiros", number:"24", pos:"Goleiro"},
    {id:25, name:"Gustavo Pereira",    number:"25", pos:"Meia"},
  ],
};

CAT_LIST.forEach(k => { if (!SQUADS[k]) SQUADS[k] = []; });

/* Landscape 4-3-3: x=field depth (0=attack-left, 100=defense-right), y=lateral (0=top, 100=bottom) */
export const DEFAULT_FORMATION = [
  {id:"p0",  isGK:true,  x:12, y:50},   // GL
  {id:"p1",  isGK:false, x:30, y:15},   // LD
  {id:"p2",  isGK:false, x:28, y:38},   // ZGD
  {id:"p3",  isGK:false, x:28, y:62},   // ZGE
  {id:"p4",  isGK:false, x:30, y:85},   // LE
  {id:"p5",  isGK:false, x:50, y:25},   // VLD
  {id:"p6",  isGK:false, x:52, y:50},   // VLE
  {id:"p7",  isGK:false, x:50, y:75},   // MEI
  {id:"p8",  isGK:false, x:78, y:15},   // PD
  {id:"p9",  isGK:false, x:82, y:50},   // CA
  {id:"p10", isGK:false, x:78, y:85},   // PE
];
