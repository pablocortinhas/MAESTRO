import { useState, useEffect, useRef } from "react";
import wallpaperImg   from "../imagens/Flamengo_Wallpaper.png";
import maestroLogoImg from "../imagens/maestro_logo.png";
import fundo1Img      from "../imagens/fundo1.png";
import fundo4Img      from "../imagens/fundo4.png";
import flaEscudoImg   from "../imagens/Fla_Escudo.png";
import AdvLogo         from "./components/common/AdvLogo";
import { version as APP_VERSION } from "../package.json";
import { C }                                   from "./constants/colors";
import { ZONES_50 }                             from "./constants/zones";
import { SECTORS, ALL_IDS, GOAL_MODAL_CONFIG }  from "./constants/sectors";
import { SQUADS as SQUADS_STATIC, CAT_LIST, BASE_CATS } from "./constants/squads";
import { LOGO_B64 }                            from "./assets/base64";
import { fmt, getMeta, download }              from "./utils/format";
import { initSt, initZSt, mkPlayers }          from "./utils/dataInit";
import { lBtn, filtBtn }                       from "./utils/styles";
import { useFormation }                        from "./hooks/useFormation";
import SoberCard       from "./components/common/SoberCard";
import StatCard        from "./components/common/StatCard";
import GoalMapStats    from "./components/stats/GoalMapStats";
import StatsView      from "./components/stats/StatsView";
import FieldMap, { Legend as HeatLegend } from "./components/field/FieldMap";
import FieldBoard      from "./components/field/FieldBoard";
import BenchPanel      from "./components/field/BenchPanel";
import ActionsPanel    from "./components/actions/ActionsPanel";
import VideoPanel      from "./components/video/VideoPanel";
import HistPanel       from "./components/history/HistPanel";
import ElencoView      from "./components/views/ElencoView";
import GoalModal       from "./components/modals/GoalModal";
import PossessionModal from "./components/modals/PossessionModal";
import PenaltyModal    from "./components/modals/PenaltyModal";
import PenSimpleModal  from "./components/modals/PenSimpleModal";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@500;600;700&family=Barlow+Condensed:ital,wght@0,700;1,800&family=Oswald:wght@500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#F3F4F6;color:#1A1A1A;height:100%}
  #root{height:100%}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-thumb{background:#D0D0D0;border-radius:3px}
  ::-webkit-scrollbar-track{background:transparent}
  @keyframes fz{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}65%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
  @keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(14px)}15%,76%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .fz{animation:fz .42s ease}
  .zb{cursor:pointer;transition:background .1s}
  input,select{background:#FFF;border:1px solid #D4D4D4;color:#1A1A1A;border-radius:5px;padding:5px 8px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;outline:none;}
  input:focus,select:focus{border-color:#E8001C}
  input::placeholder{color:#AAA}
  select option{background:#FFF;color:#1A1A1A}
  button:focus-visible{outline:2px solid #E8001C;outline-offset:1px}
  @media print{
    body > #root > *:not(.print-report){display:none!important}
    .print-report{position:static!important;width:100%!important;visibility:visible!important;pointer-events:auto!important;top:0!important;left:0!important;z-index:auto!important}
  }
  .print-report{position:fixed;top:-99999px;left:0;width:900px;visibility:hidden;pointer-events:none;z-index:-1;background:#FFF}
`;

const LS_PANELS = "maestro_panel_layout_v3";
//  Layout padrão: CAMPO | AÇÕES | VÍDEO (3 colunas) + HISTÓRICO sob CAMPO + RESERVAS faixa inferior
const DEFAULT_PANELS = [
  { id:"campo",     x:0,    y:0,    w:33,   h:68,  visible:true, zIndex:1 },
  { id:"historico", x:0,    y:68.5, w:33,   h:22,  visible:true, zIndex:2 },
  { id:"acoes",     x:33.5, y:0,    w:17.5, h:91,  visible:true, zIndex:3 },
  { id:"video",     x:51.5, y:0,    w:48.5, h:91,  visible:true, zIndex:4 },
  { id:"banco",     x:0,    y:91.5, w:100,  h:8.5, visible:true, zIndex:5 },
];
const PANEL_LABELS = { campo:"CAMPO", historico:"HISTÓRICO", acoes:"AÇÕES", video:"VÍDEO", banco:"RESERVAS" };
function loadPanelLayout() {
  try {
    const s = localStorage.getItem(LS_PANELS);
    if (s) {
      const saved = JSON.parse(s);
      if (Array.isArray(saved) && DEFAULT_PANELS.every(d => saved.some(p => p.id === d.id && p.x !== undefined))) return saved;
    }
  } catch {}
  return DEFAULT_PANELS;
}

function Div(){return <div style={{width:1,height:22,background:"#2A2A2A",flexShrink:0}}/>;}
function TopB({onClick,ch}){return <button onClick={onClick} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#999",borderRadius:3,padding:"0 5px",cursor:"pointer",fontSize:14,lineHeight:"18px",fontFamily:"monospace"}}>{ch}</button>;}

const REGISTERED_TEAMS = [
  { name: "Grêmio",         logo: "gremio_logo.png"       },
  { name: "Fluminense",     logo: "fluminense_logo.png"   },
  { name: "Vasco",          logo: "vasco_logo.png"        },
  { name: "Botafogo",       logo: "botafogo_logo.png"     },
  { name: "Madureira",      logo: "madureira_logo.png"    },
  { name: "Campo Grande",   logo: "campogrande_logo.png"  },
  { name: "Sampaio Corrêa", logo: "sampaeocorrea_logo.png"},
  { name: "Volta Redonda",  logo: "voltaredonda_logo.png" },
];

function AdvRenameModal({ advName, advLogo, onSave, onClose }) {
  const [val, setVal] = useState(advName);
  const [selLogo, setSelLogo] = useState(advLogo);
  const [logoSrcs, setLogoSrcs] = useState({});
  const [bgSrc, setBgSrc] = useState(null);

  useEffect(() => {
    if (window.electronAPI?.getImagensDir) {
      window.electronAPI.getImagensDir().then(dir => {
        if (!dir) return;
        const base = "local-video:///" + dir.replace(/\\/g, "/");
        setBgSrc(base + "/fundo1.png");
        const escudos = base + "/Escudos/";
        const srcs = {};
        REGISTERED_TEAMS.forEach(t => { srcs[t.logo] = escudos + t.logo; });
        setLogoSrcs(srcs);
      });
    }
  }, []);

  const handleTeam = (team) => { setVal(team.name); setSelLogo(team.logo); };
  const handleSave = () => onSave({ name: val.trim() || "Adversário", logo: selLogo });

  const btnBase = {
    flex:1, border:"none", borderRadius:6, padding:"8px",
    fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:2, cursor:"pointer",
    background:"#E8001C", color:"#000",
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{
        borderRadius:12, padding:"22px 24px", boxShadow:"0 8px 32px rgba(0,0,0,.28)",
        display:"flex", flexDirection:"column", gap:14, minWidth:340,
        backgroundImage: bgSrc ? `url("${bgSrc}")` : undefined,
        backgroundColor: "#FFF",
        backgroundSize:"cover", backgroundPosition:"center",
      }}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:3,color:"#FFF",textAlign:"center"}}>ADVERSÁRIO</div>

        {/* Times cadastrados — tamanho fixo e uniforme */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
          {REGISTERED_TEAMS.map(team => {
            const isSel = selLogo === team.logo && val === team.name;
            return (
              <button key={team.logo} onClick={()=>handleTeam(team)} style={{
                width:90, height:90,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
                borderRadius:8, cursor:"pointer",
                border:`2px solid ${isSel?"#E8001C":"#E5E7EB"}`,
                background: isSel?"#FFF5F5":"#FAFAFA",
                transition:"all .15s", flexShrink:0,
              }}>
                {logoSrcs[team.logo]
                  ? <img src={logoSrcs[team.logo]} alt={team.name} style={{height:44,width:44,objectFit:"contain"}} onError={e=>e.currentTarget.style.display="none"}/>
                  : <div style={{height:44,width:44,borderRadius:"50%",background:"#E5E7EB"}}/>
                }
                <span style={{fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1.2,color:isSel?"#E8001C":"#374151",textAlign:"center",lineHeight:1}}>{team.name.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        <div style={{borderTop:"1px solid rgba(0,0,0,.12)",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
          <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700,color:"#FFF",letterSpacing:1}}>OU DIGITE UM NOME</span>
          <input autoFocus value={val} onChange={e=>{setVal(e.target.value);setSelLogo("adv_logo.png");}}
            onKeyDown={e=>{if(e.key==="Enter")handleSave();if(e.key==="Escape")onClose();}}
            style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:600,padding:"8px 12px",border:"1px solid #333",borderRadius:6,outline:"none",color:"#E8001C",background:"#000"}}
            placeholder="Adversário"
          />
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} style={btnBase}>SALVAR</button>
          <button onClick={onClose}   style={btnBase}>CANCELAR</button>
        </div>
      </div>
    </div>
  );
}

/* ── Popup standalone de vídeo (janela secundária) ──────── */
function VideoPopup() {
  const vRef = useRef(null);
  const [src, setSrc]     = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.max(0.6, window.innerWidth / 960));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    window.electronAPI?.getVideoPath().then(p => {
      if (p) setSrc("local-video:///" + p.replace(/\\/g, "/"));
    });
    const cleanup = window.electronAPI?.onVideoPathChanged(p => {
      if (p) setSrc("local-video:///" + p.replace(/\\/g, "/"));
    });
    return () => cleanup?.();
  }, []);

  const w = `${(100 / scale).toFixed(4)}vw`;
  const h = `${(100 / scale).toFixed(4)}vh`;

  return (
    <div style={{ width: w, height: h, zoom: scale, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <style>{CSS}</style>
      {src
        ? <video ref={vRef} src={src} controls autoPlay style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        : <div style={{ color: "#444", fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 3, textAlign: "center", padding: 20 }}>
            AGUARDANDO VÍDEO<br/>
            <span style={{ fontSize: 11, color: "#333", letterSpacing: 1 }}>Abra um vídeo na janela principal</span>
          </div>
      }
    </div>
  );
}

function Maestro(){
  /* ── Escala proporcional ao tamanho da janela ── */
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => setScale(Math.max(0.3, Math.min(2.5, window.innerWidth / 1350)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [catKey,  setCatKey]  = useState("Sub 13");
  const [squads,  setSquads]  = useState(SQUADS_STATIC); // começa com squads.js, atualiza do XLSX
  const [players, setPlayers] = useState(mkPlayers(SQUADS_STATIC["Sub 13"]));
  const formation = useFormation(players, catKey);
  const [tStats,  setTStats]  = useState(initSt());
  const [tZStats, setTZStats] = useState(initZSt());
  const [selPl,   setSelPl]   = useState(null);
  const [selAct,  setSelAct]  = useState(null);
  const [view,    setView]    = useState("analise");
  const [hist,    setHist]    = useState([]);
  const [mTime,   setMTime]   = useState(0);
  const [mRun,    setMRun]    = useState(false);
  const [score,   setScore]   = useState({fla:0,adv:0});
  const [flashZ,  setFlashZ]  = useState(null);
  const [toast,   setToast]   = useState(null);
  const [possMode,setPossMode]= useState("pause");
  const [possTime,setPossTime]= useState({fla:0,adv:0});
  const [heatFilt,setHeatFilt]= useState("all");
  const [playerFilt,setPlayerFilt]= useState(null);
  const [editActMode,setEditActMode]=useState(false);
  const [editTool,setEditTool]=useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCat, setShowCat] = useState(false);
  const [showPM,  setShowPM]  = useState(false);
  const [goalModal,   setGoalModal]   =useState(null);
  const [teamSide,    setTeamSide]    =useState("home");
  const [penSimple,   setPenSimple]   =useState(null);
  const [penaltyModal,setPenaltyModal]=useState(null);
  const [advName, setAdvName] = useState("Adversário");
  const [advLogo, setAdvLogo] = useState("adv_logo.png");
  const [advRenameModal, setAdvRenameModal] = useState(false);
  const [periodMarkers, setPeriodMarkers] = useState({t1:null,t2:null,p1:null,p2:null});
  const vRef      = useRef(null);
  const [vSrc,  setVSrc]  = useState(null);
  const [vCur,  setVCur]  = useState(0);
  const [vDur,  setVDur]  = useState(0);
  const mRef      = useRef(null);
  const pRef      = useRef(null);
  const headerRef = useRef(null);

  /* ── Painéis redimensionáveis e reordenáveis ──────────── */
  const analiseRef    = useRef(null);
  const [panelLayout, setPanelLayout] = useState(loadPanelLayout);
  const [headerH, setHeaderH] = useState(48);
  const undoRef   = useRef(() => {});

  useEffect(() => {
    try { localStorage.setItem(LS_PANELS, JSON.stringify(panelLayout)); } catch {}
  }, [panelLayout]);

  const startPanelMove = (id, e) => {
    e.preventDefault();
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    const panel = panelLayout.find(p => p.id === id);
    const rect = analiseRef.current.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const origX = panel.x, origY = panel.y, origW = panel.w, origH = panel.h;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / rect.width * 100;
      const dy = (ev.clientY - startY) / rect.height * 100;
      setPanelLayout(prev => prev.map(p =>
        p.id === id
          ? { ...p, x: Math.max(0, Math.min(100 - origW, origX + dx)), y: Math.max(0, Math.min(100 - origH, origY + dy)) }
          : p
      ));
    };
    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const startPanelResize = (id, dir, e) => {
    e.preventDefault();
    e.stopPropagation();
    const cursors = { e:"col-resize",w:"col-resize",s:"row-resize",n:"row-resize",se:"nwse-resize",nw:"nwse-resize",ne:"nesw-resize",sw:"nesw-resize" };
    document.body.style.userSelect = "none";
    document.body.style.cursor = cursors[dir] || "nwse-resize";
    const panel = panelLayout.find(p => p.id === id);
    const rect = analiseRef.current.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const { x: ox, y: oy, w: ow, h: oh } = panel;
    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / rect.width * 100;
      const dy = (ev.clientY - startY) / rect.height * 100;
      setPanelLayout(prev => prev.map(p => {
        if (p.id !== id) return p;
        let nx = ox, ny = oy, nw = ow, nh = oh;
        if (dir.includes("e")) nw = Math.max(15, Math.min(100 - ox, ow + dx));
        if (dir.includes("s")) nh = Math.max(10, Math.min(100 - oy, oh + dy));
        if (dir.includes("w")) { const x2 = Math.max(0, Math.min(ox + ow - 15, ox + dx)); nw = ow + ox - x2; nx = x2; }
        if (dir.includes("n")) { const y2 = Math.max(0, Math.min(oy + oh - 10, oy + dy)); nh = oh + oy - y2; ny = y2; }
        return { ...p, x: nx, y: ny, w: nw, h: nh };
      }));
    };
    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const bringToFront = (id) => {
    setPanelLayout(prev => {
      const maxZ = Math.max(...prev.map(p => p.zIndex || 1));
      if ((prev.find(p => p.id === id)?.zIndex || 1) === maxZ) return prev;
      return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p);
    });
  };

  const togglePanel = (id) => {
    setPanelLayout(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  };

  useEffect(()=>{
    if(!headerRef.current) return;
    const ro=new ResizeObserver(()=>{ if(headerRef.current) setHeaderH(headerRef.current.offsetHeight); });
    ro.observe(headerRef.current);
    return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    clearInterval(mRef.current);
    if(!mRun) return ()=>clearInterval(mRef.current);
    const vid=vRef.current;
    if(!vid||!vid.src){
      mRef.current=setInterval(()=>setMTime(t=>t+1),1000);
      return ()=>clearInterval(mRef.current);
    }
    let prev=vid.currentTime;
    const onUpdate=()=>{ const d=vid.currentTime-prev; if(d>0&&d<5) setMTime(t=>t+d); prev=vid.currentTime; };
    vid.addEventListener("timeupdate",onUpdate);
    return ()=>vid.removeEventListener("timeupdate",onUpdate);
  },[mRun,vSrc]);

  useEffect(()=>{
    clearInterval(pRef.current);
    if(possMode==="pause") return ()=>clearInterval(pRef.current);
    const vid=vRef.current;
    if(!vid||!vid.src){
      pRef.current=setInterval(()=>{ if(mRun) setPossTime(p=>possMode==="fla"?{...p,fla:p.fla+1}:{...p,adv:p.adv+1}); },1000);
      return ()=>clearInterval(pRef.current);
    }
    let prev=vid.currentTime;
    const onUpdate=()=>{ const d=vid.currentTime-prev; if(d>0&&d<5) setPossTime(p=>possMode==="fla"?{...p,fla:p.fla+d}:{...p,adv:p.adv+d}); prev=vid.currentTime; };
    vid.addEventListener("timeupdate",onUpdate);
    return ()=>vid.removeEventListener("timeupdate",onUpdate);
  },[mRun,possMode,vSrc]);


  /* ── Sync automático com a planilha ─────────────────────────
     Ao iniciar o Electron, lê 2026_Dados_Cadastrais_Base.xlsx e
     mescla com squads.js (que tem as fotos já resolvidas).       */
  /* Ctrl+Z — desfaz a última ação registrada */
  undoRef.current = () => { if (hist.length > 0) deleteHistEntry(hist[0].id); };
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoRef.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(()=>{
    if(!window.electronAPI?.loadSquadsXlsx) return;
    window.electronAPI.loadSquadsXlsx().then(fresh=>{
      if(!fresh) return;
      // Mescla: dados estruturais do XLSX + fotos do squads.js
      const merged={};
      for(const [cat,newPlayers] of Object.entries(fresh)){
        const photoMap={};
        (SQUADS_STATIC[cat]||[]).forEach(p=>{ if(p.athleteId) photoMap[p.athleteId]=p.photo||""; });
        merged[cat]=newPlayers.map((p,i)=>({
          id:i+1,
          athleteId:p.athleteId,
          name:p.name,
          nickname:p.nickname,
          number:"",
          pos:p.pos,
          photo:photoMap[p.athleteId]||"",
        }));
      }
      setSquads(prev=>({...prev,...merged}));
      // Recarrega a categoria atual com dados frescos
      setCatKey(k=>{
        setPlayers(mkPlayers(merged[k]||SQUADS_STATIC[k]||[]));
        return k;
      });
    });
  },[]);

  const tot=possTime.fla+possTime.adv||1;
  const fp=Math.round(possTime.fla/tot*100);
  const ap=100-fp;
  const toggleTimer=()=>{
    if(mRun){ setMRun(false); vRef.current?.pause(); }
    else { if(possMode==="pause") setShowPM(true); setMRun(true); vRef.current?.play(); }
  };
  const loadCat=k=>{setCatKey(k);if(k!=="BASE")setPlayers(mkPlayers(squads[k]||[]));setSelPl(null);setShowCat(false);};

  const register=(actId,zoneId,lx=null,ly=null)=>{
    const aid=actId||selAct, zid=zoneId;
    if(zid===null||zid===undefined||aid===null||aid===undefined) return;
    const d=SECTORS.flatMap(s=>s.actions).find(x=>x.id===aid||x.posId===aid||x.negId===aid);
    const isPen=(()=>{
      if(aid==="pen") return true;
      try{
        const layout=JSON.parse(localStorage.getItem("maestro_action_layout_v3")||"[]");
        const lbl=(layout.find(b=>b.id===aid)?.label||"").trim().toUpperCase()
          .normalize("NFD").replace(/[̀-ͯ]/g,"");
        return lbl==="PENALTI";
      }catch{return false;}
    })();
    if(isPen){setPenSimple({zoneId:zid,x:lx,y:ly});setSelAct(null);return;}
    const gmCfg=GOAL_MODAL_CONFIG[aid];
    if(gmCfg){
      if(aid==="gol"&&teamSide==="adv"){
        setGoalModal({...gmCfg,addScore:"away",title:"GOL DO ADVERSÁRIO",ballColor:"vermelha",actId:"gol_sofr",zoneId:zid,x:lx,y:ly});
      } else {
        setGoalModal({...gmCfg,actId:aid,zoneId:zid,x:lx,y:ly});
      }
      setSelAct(null);return;
    }
    if(d?.openPenaltyModal){setPenaltyModal({side:d.openPenaltyModal,actId:aid,zoneId:zid,x:lx,y:ly});setSelAct(null);return;}
    regData(aid,zid,"",lx,ly);
    setSelPl(null);
    setSelAct(null);
  };


  const handleFieldClick=(lx,ly,zoneId)=>{
    if(!selAct) return;
    register(selAct,zoneId,lx,ly);
  };

  const handlePenaltyConfirm=({pos,result,side})=>{
    const {actId,zoneId,x,y}=penaltyModal||{};
    const label=` · ${pos}`;
    if(side==="home"){
      const resId=result==="conv"?"pen_conv":"pen_perd";
      regData(actId,zoneId,label,x,y);
      regData(resId,zoneId," · "+pos,x,y);
      if(result==="conv") setScore(s=>({...s,fla:s.fla+1}));
      setSelPl(null);
    } else {
      const gk=players.find(p=>p.pos==="Goleiro");
      const prevPl=selPl;
      if(gk) setSelPl(gk.id);
      regData(actId,zoneId,label,x,y);
      const resId=result==="def"?"pen_def":"gol_sofr";
      regData(resId,zoneId," · "+pos,x,y);
      if(result==="sofrido") setScore(s=>({...s,adv:s.adv+1}));
      setSelPl(null);
    }
  };

  const handlePenSimple=(result)=>{
    const {zoneId,x,y}=penSimple||{};
    const isAdv=teamSide==="adv";
    const cfg=isAdv
      ? {
          conv:{ actId:"gol_sofr",     title:"PÊNALTI SOFRIDO — ONDE FOI?",   ballColor:"vermelha", addScore:"away", isPen:true },
          def: { actId:"pen_def",      title:"PÊNALTI DEFENDIDO — ONDE FOI?", ballColor:"verde",    addScore:null,   isPen:true },
          perd:{ actId:"finalNeg_adv", title:"PÊNALTI PERDIDO — ONDE FOI?",   ballColor:"vermelha", addScore:null,   isPen:true },
        }[result]
      : {
          conv:{ actId:"gol",      title:"PÊNALTI CONVERTIDO — ONDE FOI?", ballColor:"verde",    addScore:"home", isPen:true },
          def: { actId:"finalPos", title:"PÊNALTI DEFENDIDO — ONDE FOI?",  ballColor:"verde",    addScore:null,   isPen:true },
          perd:{ actId:"finalNeg", title:"PÊNALTI PERDIDO — ONDE FOI?",    ballColor:"vermelha", addScore:null,   isPen:true },
        }[result];
    setPenSimple(null);
    setGoalModal({...cfg, zoneId, x, y});
  };

  const getActMeta=(aid)=>{
    const meta=getMeta(aid);
    if(meta.label!==aid) return meta;
    // botão custom — busca label no layout salvo
    try{
      const layout=JSON.parse(localStorage.getItem("maestro_action_layout_v3")||"[]");
      const btn=layout.find(b=>b.id===aid);
      if(btn) return{...meta,label:btn.label,color:btn.color||meta.color};
    }catch{}
    return meta;
  };

  const regData=(aid,zid,extraLabel="",lxIn=null,lyIn=null,goalXIn=null,goalYIn=null,isPen=false)=>{
    const zL=ZONES_50.find(z=>z.id===zid);
    const fx = lxIn ?? (zL ? zL.cx : 0.5);
    const fy = lyIn ?? (zL ? zL.cy : 0.5);
    const isAdvTeam=teamSide==="adv";
    const pl=isAdvTeam?null:players.find(p=>p.id===selPl);
    const pid=isAdvTeam?null:(selPl||null);
    const t=fmt(mTime), vt=vRef.current?.currentTime??null;
    setTStats(p=>({...p,[aid]:p[aid]+1}));
    setTZStats(p=>({...p,[zid]:{...p[zid],[aid]:p[zid][aid]+1}}));
    if(!isAdvTeam&&selPl) setPlayers(p=>p.map(x=>x.id!==selPl?x:{...x,stats:{...x.stats,[aid]:x.stats[aid]+1},zStats:{...x.zStats,[zid]:{...x.zStats[zid],[aid]:x.zStats[zid][aid]+1}}}));
    const meta=getActMeta(aid);
    setHist(p=>[{id:Date.now(),time:t,
      player:        pl?.athleteId || pl?.name || (isAdvTeam ? advName : "Flamengo"),
      playerDisplay: pl?.nickname  || pl?.name?.split(" ")?.[0] || (isAdvTeam ? advName : "Flamengo"),
      num:pl?.number||null,label:meta.label+extraLabel,color:meta.color,
      zone:zL?.name||"—",actId:aid,zoneId:zid,playerId:pid,
      team:teamSide,
      videoTime:vt,videoEndTime:null,
      x:fx, y:fy,
      goalX:goalXIn, goalY:goalYIn,
      isPen: isPen||false,
    },...p.slice(0,299)]);
    setFlashZ(zid);setToast(meta.label);
    setTimeout(()=>setFlashZ(null),700);setTimeout(()=>setToast(null),1800);
  };

  const deleteHistEntry=(id)=>{
    const entry=hist.find(h=>h.id===id);
    if(!entry) return;
    setTStats(p=>({...p,[entry.actId]:Math.max(0,(p[entry.actId]||0)-1)}));
    if(entry.zoneId!=null){
      setTZStats(p=>({...p,[entry.zoneId]:{...(p[entry.zoneId]||{}),[entry.actId]:Math.max(0,(p[entry.zoneId]?.[entry.actId]||0)-1)}}));
    }
    if(entry.playerId){
      setPlayers(p=>p.map(pl=>pl.id!==entry.playerId?pl:{
        ...pl,
        stats:{...pl.stats,[entry.actId]:Math.max(0,(pl.stats[entry.actId]||0)-1)},
        zStats:entry.zoneId!=null?{...pl.zStats,[entry.zoneId]:{...(pl.zStats[entry.zoneId]||{}),[entry.actId]:Math.max(0,(pl.zStats[entry.zoneId]?.[entry.actId]||0)-1)}}:pl.zStats
      }));
    }
    setHist(p=>p.filter(h=>h.id!==id));
  };

  const clearAll=()=>{
    setHist([]);
    setTStats(initSt());
    setTZStats(initZSt());
    setPlayers(p=>p.map(pl=>({...pl,stats:initSt(),zStats:initZSt()})));
    setSelAct(null);
    setScore({fla:0,adv:0});
  };

  const exportData=format=>{
    const rows=hist.map(h=>({Tempo:h.time,IDAtleta:h.player,Apelido:h.playerDisplay||h.player,Numero:h.num||"",Acao:h.label,Zona:h.zone,TempoVideo:h.videoTime!=null?h.videoTime.toFixed(2):""}));
    if(format==="csv"){const hd=Object.keys(rows[0]||{}).join(",");const bd=rows.map(r=>Object.values(r).map(v=>'"'+v+'"').join(",")).join("\n");download("maestro_"+catKey.replace(" ","_")+".csv","text/csv",hd+"\n"+bd);}
    else{const x='<?xml version="1.0" encoding="UTF-8"?>\n<partida categoria="'+catKey+'">\n'+rows.map(r=>'  <evento tempo="'+r.Tempo+'" idAtleta="'+r.IDAtleta+'" apelido="'+r.Apelido+'" numero="'+r.Numero+'" acao="'+r.Acao+'" zona="'+r.Zona+'" tempoVideo="'+r.TempoVideo+'"/>').join("\n")+"\n</partida>";download("maestro_"+catKey.replace(" ","_")+".xml","application/xml",x);}
  };

    const SPEEDS = [0.5, 0.7, 1, 2, 3, 4, 5, 6, 7, 10];
  const applyRate = (rate) => {
    setPlaybackRate(rate);
    if (vRef.current) vRef.current.playbackRate = rate;
  };

  const [navItems, setNavItems] = useState([
    {id:"analise",l:"ANÁLISE"},
    {id:"mapa",l:"MAPA DE CALOR"},
    {id:"stats",l:"ESTATÍSTICAS"},
    {id:"elenco",l:"ELENCO"},
  ]);
  const navDragIdx  = useRef(null);
  const [navDragging, setNavDragging] = useState(null);
  const [navDragOver, setNavDragOver] = useState(null);
  const [gearOpen,    setGearOpen]    = useState(false);

  const W = `${(100/scale).toFixed(4)}vw`;
  const H = `${(100/scale).toFixed(4)}vh`;

  /* ── Painéis da aba Análise (reordenáveis por arrastar o título) ── */
  const getPanelMeta = (id) => {
    switch (id) {
      case "campo": return {
        title: "CAMPO",
        centerTitle: true,
        contentStyle: { overflow:"auto" },
        content: (
          <FieldBoard
            flashZ={flashZ} players={players} selPl={selPl} setSelPl={setSelPl}
            selAct={selAct} onFieldClick={handleFieldClick} catKey={catKey} hist={hist}
            assigned={formation.assigned} setAssigned={formation.setAssigned}
            fixado={formation.fixado} setFixado={formation.setFixado}
            subMode={formation.subMode} setSubMode={formation.setSubMode}
            subTarget={formation.subTarget} setSubTarget={formation.setSubTarget}
            uniform={formation.uniform} setUniform={formation.setUniform}
            formSaved={formation.formSaved} saveFormation={formation.saveFormation} reset={formation.reset}
            hidePlayersOverride={teamSide==="adv"}
          />
        ),
      };
      case "banco": return {
        title: "RESERVAS",
        centerTitle: true,
        headerRight: formation.subMode && (
          <span style={{fontSize:10,color:C.red,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>CLIQUE PARA SUBSTITUIR</span>
        ),
        cardStyle: formation.subMode ? { borderColor:C.red } : {},
        contentStyle: { overflow:"auto", ...(formation.subMode ? { background:"#FFF5F5" } : {}) },
        content: <BenchPanel bench={formation.bench} uniform={formation.uniform} subMode={formation.subMode} doSub={formation.doSub}/>,
      };
      case "video": return {
        title: "VÍDEO",
        centerTitle: true,
        headerRight: vSrc && (
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:9,color:"#888",fontFamily:"'Bebas Neue'",letterSpacing:1,flexShrink:0}}>VEL:</span>
            {SPEEDS.map(s=>(
              <button key={s} onClick={()=>applyRate(s)} style={{
                background: playbackRate===s ? C.red+"18" : "transparent",
                border:`1px solid ${playbackRate===s?C.red:"#444"}`,
                color: playbackRate===s ? C.red : "#999",
                borderRadius:2, padding:"0 5px",
                fontFamily:"'Bebas Neue'", fontSize:9, letterSpacing:.5,
                cursor:"pointer", flexShrink:0,
              }}>{s}×</button>
            ))}
          </div>
        ),
        content: <VideoPanel videoRef={vRef} videoSrc={vSrc} setVideoSrc={setVSrc} videoCurrent={vCur} setVideoCurrent={setVCur} videoDuration={vDur} setVideoDuration={setVDur} hist={hist} setHist={setHist} playbackRate={playbackRate} periodMarkers={periodMarkers} setPeriodMarkers={setPeriodMarkers}/>,
      };
      case "acoes": return {
        title: "AÇÕES",
        centerTitle: !editActMode,
        headerRight: (
          <div style={{display:"flex",gap:3,alignItems:"center"}}>
            {editActMode&&[
              {id:"cor",label:"COR"},
              {id:"nome",label:"NOME"},
              {id:"atalho",label:"ATALHO"},
            ].map(t=>(
              <button key={t.id}
                onClick={()=>setEditTool(e=>e===t.id?null:t.id)}
                style={{
                  background:editTool===t.id?C.red:"transparent",
                  border:`1px solid ${editTool===t.id?C.red:"#D4D4D4"}`,
                  color:editTool===t.id?"#FFF":"#6B7280",
                  borderRadius:4,padding:"1px 8px",
                  fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",
                }}
              >{t.label}</button>
            ))}
            <button
              onClick={()=>{setEditActMode(e=>!e);if(editActMode)setEditTool(null);}}
              style={{background:"none",border:"none",color:"#111",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",padding:"1px 2px"}}
            >{editActMode?"CONCLUIR":"EDITAR"}</button>
          </div>
        ),
        content: <ActionsPanel selAct={selAct} setSelAct={setSelAct} editMode={editActMode} editTool={editTool} setEditTool={setEditTool} teamSide={teamSide} setTeamSide={side=>{setTeamSide(side);if(side==="adv")setSelPl(null);}} advLogo={advLogo}/>,
      };
      case "historico": return {
        title: <>HISTÓRICO {hist.length > 0 && <span style={{color:C.red}}>({hist.length})</span>}</>,
        centerTitle: true,
        headerRight: (
          <div style={{display:"flex",gap:4}}>
            <button
              onClick={()=>hist.length>0&&deleteHistEntry(hist[0].id)}
              title="Desfazer última ação (Ctrl+Z)"
              style={{background:"none",border:"none",color:"#111",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",padding:"1px 2px",opacity:hist.length>0?1:.4}}
            >⟲ DESFAZER</button>
            <button
              onClick={clearAll}
              title="Limpar todos os dados da sessão"
              style={{background:"none",border:"none",color:"#111",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",padding:"1px 2px",opacity:hist.length>0?1:.5}}
            >LIMPAR TUDO</button>
          </div>
        ),
        contentStyle: { overflowY:"auto", padding:"5px 8px" },
        content: <HistPanel hist={hist} onDeleteEntry={deleteHistEntry} videoRef={vRef} videoDuration={vDur}/>,
      };
      default: return {};
    }
  };


  return(
    <div style={{width:W,height:H,zoom:scale,overflow:"hidden",background:"#100e0e",color:"#1A1A1A",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",zIndex:9999,pointerEvents:"none",animation:"ta 1.8s ease forwards",background:"#1A1A1A",border:"2px solid "+C.red,borderRadius:7,padding:"8px 22px",fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:"#FFF",transform:"translateX(-50%)"}}>{toast}</div>}
      <PossessionModal show={showPM} setPossMode={setPossMode} setShowPossModal={setShowPM}/>
      <GoalModal goalModal={goalModal} setGoalModal={setGoalModal} registerWithData={(aid,zid,extra,gx,gy)=>{regData(aid,zid,extra,goalModal?.x,goalModal?.y,gx,gy,goalModal?.isPen);setSelPl(null);}} setScore={setScore}/>
      <PenaltyModal penaltyModal={penaltyModal} setPenaltyModal={setPenaltyModal} onConfirm={handlePenaltyConfirm}/>
      <PenSimpleModal show={!!penSimple} onConfirm={handlePenSimple} onClose={()=>setPenSimple(null)}/>
      {advRenameModal&&<AdvRenameModal advName={advName} advLogo={advLogo} onSave={({name,logo})=>{setAdvName(name);setAdvLogo(logo);setAdvRenameModal(false);}} onClose={()=>setAdvRenameModal(false)}/>}

      <header ref={headerRef} style={{
        background:"#0A0A0A",
        display:"flex",alignItems:"center",flexWrap:"nowrap",gap:8,padding:"6px 14px",
        flexShrink:0,borderBottom:"1px solid #2A2A2A",position:"relative",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <img src={maestroLogoImg} alt="Maestro" style={{height:28,width:"auto",objectFit:"contain"}}/>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontStyle:"italic",fontSize:22,letterSpacing:3,color:"#FFF",lineHeight:1,textTransform:"uppercase"}}>MAESTRO</span>
          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:500,fontSize:9,color:"#AAA",alignSelf:"flex-end",marginBottom:2,letterSpacing:1}}>v{APP_VERSION}</span>
        </div>
        <Div/>
        <div style={{flexShrink:0,position:"relative"}}>
          <button onClick={()=>setShowCat(s=>!s)} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#E0E0E0",borderRadius:4,padding:"3px 10px",fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,cursor:"pointer"}}>{catKey} {showCat?"▲":"▼"}</button>
          {showCat&&<div style={{position:"fixed",top:headerH,left:14,zIndex:600,background:"#FFF",border:"1px solid #E0E0E0",borderRadius:8,overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,.18)",minWidth:220}}>
            <button onClick={()=>loadCat("BASE")} style={{display:"block",width:"100%",background:catKey==="BASE"?C.red:"#F5F5F5",border:"none",borderBottom:"1px solid #E0E0E0",color:catKey==="BASE"?"#FFF":"#1A1A1A",padding:"8px 14px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,textAlign:"left"}}>BASE (Sub 07 — Sub 20)</button>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:"1px solid #E0E0E0"}}>
              {BASE_CATS.map(cat=><button key={cat} onClick={()=>loadCat(cat)} style={{background:cat===catKey?C.red:"transparent",border:"none",borderRight:"1px solid #E0E0E0",borderBottom:"1px solid #E0E0E0",color:cat===catKey?"#FFF":"#1A1A1A",padding:"8px 4px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1,textAlign:"center"}}>{cat}</button>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              {["Profissional","Feminino"].map(cat=><button key={cat} onClick={()=>loadCat(cat)} style={{background:cat===catKey?C.red:"transparent",border:"none",borderRight:"1px solid #E0E0E0",color:cat===catKey?"#FFF":"#1A1A1A",padding:"9px 8px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,textAlign:"center"}}>{cat}</button>)}
            </div>
          </div>}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <img src={flaEscudoImg} alt="FLA" style={{height:22,width:"auto",objectFit:"contain",flexShrink:0}}/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:C.red,minWidth:22,textAlign:"center",lineHeight:1}}>{score.fla}</span>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#888",padding:"0 2px",lineHeight:1}}>×</span>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:"#DDD",minWidth:22,textAlign:"center",lineHeight:1}}>{score.adv}</span>
          <button onClick={()=>setAdvRenameModal(true)} title="Renomear adversário" style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center"}}><AdvLogo height={20} logoFile={advLogo}/></button>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:C.red,minWidth:28,textAlign:"right"}}>{fp}%</span>
          <div style={{width:72,height:6,background:"#3A3A3A",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:fp+"%",height:"100%",background:C.red,transition:"width .6s"}}/>
          </div>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:13,color:"#CCC",minWidth:28}}>{ap}%</span>
          {[
            {m:"fla", content:<img src={flaEscudoImg} alt="FLA" style={{height:16,width:"auto",objectFit:"contain"}}/>},
            {m:"pause", content:"⏸"},
            {m:"adv", content:<AdvLogo height={16} logoFile={advLogo}/>},
          ].map(({m,content})=>(
            <button key={m} onClick={()=>setPossMode(m)} style={{
              background: possMode===m ? (m==="fla"?C.red : "#111") : "#2A2A2A",
              border: `1px solid ${possMode===m ? (m==="fla"?C.red:"#555") : "#3A3A3A"}`,
              color: "#FFF", borderRadius:3, padding:"2px 6px",
              fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:1, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", minWidth:32,
            }}>{content}</button>
          ))}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:4,background:"#111",border:`1px solid ${mRun?C.red:"#2A2A2A"}`,borderRadius:5,padding:"1px 8px",transition:"border-color .3s"}}>
            {mRun && <span style={{width:6,height:6,borderRadius:"50%",background:C.red,flexShrink:0,animation:"pulse .9s ease infinite"}}/>}
            <span style={{fontFamily:"monospace",fontSize:19,color:mRun?C.red:"#CCC",transition:"color .3s"}}>{fmt(mTime)}</span>
          </div>
          <button onClick={toggleTimer} style={{...lBtn(mRun),fontSize:14,padding:"3px 12px"}}>{mRun?"PAUSAR":"INICIAR"}</button>
          <button onClick={()=>{setMRun(false);setMTime(0);setPossMode("pause");setPossTime({fla:0,adv:0});}} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#CCC",borderRadius:5,padding:"3px 10px",fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,cursor:"pointer"}}>RESET</button>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
          {navItems.map(({id,l},idx)=>(
            <button
              key={id}
              draggable
              onClick={()=>setView(id)}
              onDragStart={()=>{ navDragIdx.current=idx; setNavDragging(idx); }}
              onDragOver={e=>{ e.preventDefault(); if(navDragOver!==idx) setNavDragOver(idx); }}
              onDrop={e=>{
                e.preventDefault();
                const from=navDragIdx.current;
                if(from===null||from===idx) return;
                setNavItems(prev=>{ const n=[...prev]; n.splice(idx,0,n.splice(from,1)[0]); return n; });
                navDragIdx.current=null; setNavDragOver(null);
              }}
              onDragEnd={()=>{ navDragIdx.current=null; setNavDragging(null); setNavDragOver(null); }}
              style={{
                background: view===id ? "#2D2D2D" : "transparent",
                border: "none",
                borderBottom: `2px solid ${navDragOver===idx ? C.red+"99" : view===id ? C.red : "transparent"}`,
                borderLeft: navDragOver===idx&&navDragging!==idx ? `2px solid ${C.red}88` : "2px solid transparent",
                color: view===id ? "#FFF" : "#777",
                padding: "5px 10px 3px",
                fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:14, letterSpacing:1.2,
                cursor:"grab", transition:"opacity .1s,border-color .1s", whiteSpace:"nowrap",
                borderRadius: "3px 3px 0 0",
                opacity: navDragging===idx ? 0.4 : 1,
                userSelect:"none",
              }}
            >{l}</button>
          ))}
          {/* Botão OCULTAR: só visível em ANALISE */}
          <div style={{position:"relative", visibility: view==="analise" ? "visible" : "hidden", pointerEvents: view==="analise" ? "auto" : "none"}}>
            <button
              onClick={() => setGearOpen(s => !s)}
              title="Ocultar / exibir painéis"
              style={{background:"none",border:"none",color: gearOpen ? "#FFF" : "#666",cursor:"pointer",padding:"4px 6px",lineHeight:1,display:"flex",alignItems:"center"}}
            >
              {gearOpen ? (
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <ellipse cx="10" cy="7" rx="9" ry="6" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="10" cy="7" r="2.5" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <path d="M1 5 Q10 13 19 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                  <line x1="5.5" y1="10" x2="4.5" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="10"  y1="11" x2="10"  y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="14.5" y1="10" x2="15.5" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            {gearOpen && <>
              <div onClick={() => setGearOpen(false)} style={{position:"fixed",inset:0,zIndex:599}}/>
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:600,background:"#1A1A1A",border:"1px solid #333",borderRadius:6,padding:"10px 16px",display:"flex",flexDirection:"column",gap:6,minWidth:130}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:9,letterSpacing:2,color:"#555",marginBottom:2}}>PAINÉIS DE ANÁLISE</span>
                {panelLayout.map(panel => {
                  const visible = panel.visible !== false;
                  return (
                    <button key={panel.id} onClick={() => togglePanel(panel.id)} style={{background:"none",border:"none",color: visible ? "#FFF" : "#444",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,textAlign:"left",padding:0,lineHeight:1.4}}>
                      {PANEL_LABELS[panel.id]}
                    </button>
                  );
                })}
              </div>
            </>}
          </div>
        </div>
        <div style={{flex:1}}/>
      </header>

      <main style={{flex:1,overflow:"hidden",padding:"8px 10px",display:"flex",flexDirection:"column"}}>

        {view==="analise"&&(
          <div style={{flex:1,minHeight:0,display:"flex",flexDirection:"column"}}>
            {/* Área dos painéis */}
            <div ref={analiseRef} style={{flex:1,minHeight:0,position:"relative",backgroundImage:`url(${fundo4Img})`,backgroundSize:"cover",backgroundPosition:"center",borderRadius:6}}>
              {panelLayout.filter(p => p.visible !== false).map(panel => {
                const meta = getPanelMeta(panel.id);
                return (
                  <div key={panel.id}
                    onMouseDown={() => bringToFront(panel.id)}
                    style={{position:"absolute",left:`${panel.x}%`,top:`${panel.y}%`,width:`${panel.w}%`,height:`${panel.h}%`,zIndex:panel.zIndex||1}}>
                    <SoberCard
                      title={meta.title}
                      headerRight={meta.headerRight}
                      centerTitle={meta.centerTitle}
                      style={{height:"100%",...(meta.cardStyle||{})}}
                      contentStyle={meta.contentStyle}
                      headerStyle={{color:"#111"}}
                      onHeaderMouseDown={e=>startPanelMove(panel.id,e)}
                    >{meta.content}</SoberCard>
                    {/* Alças: bordas */}
                    <div onMouseDown={e=>startPanelResize(panel.id,"e",e)}  style={{position:"absolute",right:-4,top:0,width:8,height:"100%",cursor:"col-resize",zIndex:10}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"w",e)}  style={{position:"absolute",left:-4,top:0,width:8,height:"100%",cursor:"col-resize",zIndex:10}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"s",e)}  style={{position:"absolute",bottom:-4,left:0,height:8,width:"100%",cursor:"row-resize",zIndex:10}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"n",e)}  style={{position:"absolute",top:-4,left:0,height:8,width:"100%",cursor:"row-resize",zIndex:10}}/>
                    {/* Alças: 4 cantos */}
                    <div onMouseDown={e=>startPanelResize(panel.id,"se",e)} style={{position:"absolute",right:-4,bottom:-4,width:12,height:12,cursor:"nwse-resize",zIndex:11}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"nw",e)} style={{position:"absolute",left:-4,top:-4,width:12,height:12,cursor:"nwse-resize",zIndex:11}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"ne",e)} style={{position:"absolute",right:-4,top:-4,width:12,height:12,cursor:"nesw-resize",zIndex:11}}/>
                    <div onMouseDown={e=>startPanelResize(panel.id,"sw",e)} style={{position:"absolute",left:-4,bottom:-4,width:12,height:12,cursor:"nesw-resize",zIndex:11}}/>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view==="mapa"&&(()=>{
          const isAdv=h=>h.team==="adv"||(h.team==null&&h.actId==="gol_sofr");
          const mapaPlayers=[...new Map(hist.filter(h=>h.playerId&&!isAdv(h)).map(h=>[h.playerId,{id:h.playerId,display:h.playerDisplay||h.player,num:h.num}])).values()];
          const flaHist=playerFilt?hist.filter(h=>h.playerId===playerFilt):hist.filter(h=>!isAdv(h));
          const advHist=hist.filter(h=>isAdv(h));
          const selPlayer=playerFilt?mapaPlayers.find(p=>p.id===playerFilt):null;
          const chipBase={borderRadius:5,padding:"3px 9px",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1,cursor:"pointer",border:"1px solid #D4D4D4",background:"#F5F5F5",color:C.txtM};
          const chipSel={...chipBase,background:C.red,border:`1px solid ${C.red}`,color:"#FFF"};
          const heatBtn={background:"#111",border:"none",borderRadius:4,cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color:"#FFF",textAlign:"center",padding:"4px 6px",width:"100%"};
          const heatBtnSel={...heatBtn,background:C.red};
          const filterLabel=heatFilt!=="all"?` · ${getMeta(heatFilt).label}`:"";
          // Para o adversário, "gol" (Flamengo) mapeia para "gol_sofr"
          const ADV_FILTER_MAP={"gol":"gol_sofr"};
          const advFilt=ADV_FILTER_MAP[heatFilt]??heatFilt;
          return(
          <div style={{flex:1,overflow:"hidden",display:"flex",gap:8,minHeight:0,position:"relative"}}>

            {/* ── Dois mapas lado a lado ── */}
            <div style={{flex:1,minWidth:0,display:"flex",gap:6,minHeight:0,overflow:"hidden",alignItems:"center"}}>

              {/* FLAMENGO */}
              <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                <FieldMap hist={flaHist} filterAct={heatFilt}/>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <img src={flaEscudoImg} style={{height:16,width:"auto",objectFit:"contain"}} alt=""/>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:"#FFF"}}>
                    {"FLAMENGO"+filterLabel+(selPlayer?" · "+selPlayer.display:"")}
                  </span>
                </div>
                {mapaPlayers.length>0&&(
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    <button onClick={()=>setPlayerFilt(null)} style={playerFilt===null?chipSel:chipBase}>TODOS</button>
                    {mapaPlayers.map(p=>(
                      <button key={p.id} onClick={()=>setPlayerFilt(p.id)} style={p.id===playerFilt?chipSel:chipBase}>
                        {p.num?`#${p.num} `:""}{p.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ADVERSÁRIO */}
              <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                <FieldMap hist={advHist} filterAct={advFilt}/>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <AdvLogo height={16} logoFile={advLogo}/>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:"#FFF"}}>
                    {advName.toUpperCase()+(advFilt!=="all"?` · ${getMeta(advFilt).label}`:"")}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Painel de filtros ── */}
            <SoberCard title="FILTRAR" centerTitle={true} style={{width:200,flexShrink:0,background:"transparent",border:"none",boxShadow:"none"}} headerStyle={{background:"transparent",borderBottom:"none",color:"#FFF",fontSize:20,letterSpacing:3}} contentStyle={{overflowY:"auto"}}>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <button onClick={()=>setHeatFilt("all")} style={heatFilt==="all"?heatBtnSel:heatBtn}>TODAS AS AÇÕES</button>
                {SECTORS.map(s=>(
                  <div key={s.id}>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {s.actions.map(a=>a.type==="single"
                        ?<button key={a.id} onClick={()=>setHeatFilt(a.id)} style={heatFilt===a.id?heatBtnSel:heatBtn}>{a.label}</button>
                        :[<button key={a.posId} onClick={()=>setHeatFilt(a.posId)} style={heatFilt===a.posId?heatBtnSel:heatBtn}>{a.label}: {a.posLabel}</button>,
                          <button key={a.negId} onClick={()=>setHeatFilt(a.negId)} style={heatFilt===a.negId?heatBtnSel:heatBtn}>{a.label}: {a.negLabel}</button>]
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SoberCard>

            <div style={{position:"absolute",bottom:12,right:212,pointerEvents:"none"}}>
              <HeatLegend/>
            </div>
          </div>
        )})()}

        {view==="stats"&&(
          <div style={{flex:1,overflow:"auto",padding:"0 2px",backgroundImage:`url(${fundo1Img})`,backgroundSize:"cover",backgroundPosition:"center"}}>
            <StatsView hist={hist} tStats={tStats} score={score} catKey={catKey} exportData={exportData} possTime={possTime} advName={advName} advLogo={advLogo}/>
          </div>
        )}

        {view==="elenco"&&(
          <div style={{flex:1,overflow:"auto"}}>
            <ElencoView players={players} setPlayers={setPlayers} catKey={catKey} loadCat={loadCat} squads={squads}/>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  if (window.location.hash === "#video-popup") return <VideoPopup />;
  return <Maestro />;
}
