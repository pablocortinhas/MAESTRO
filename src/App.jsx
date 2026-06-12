import { useState, useEffect, useRef, useCallback } from "react";
import fundo1Img from "../imagens/fundo1.png";
import { version as APP_VERSION } from "../package.json";
import { C }                                   from "./constants/colors";
import { ZONES_50 }                             from "./constants/zones";
import { SECTORS, ALL_IDS, GOAL_MODAL_CONFIG }  from "./constants/sectors";
import { SQUADS as SQUADS_STATIC, CAT_LIST }   from "./constants/squads";
import { LOGO_B64 }                            from "./assets/base64";
import { fmt, getMeta, download }              from "./utils/format";
import { initSt, initZSt, mkPlayers }          from "./utils/dataInit";
import { lBtn, filtBtn }                       from "./utils/styles";
import SoberCard       from "./components/common/SoberCard";
import StatCard        from "./components/common/StatCard";
import GoalMapStats    from "./components/stats/GoalMapStats";
import FieldMap        from "./components/field/FieldMap";
import FieldBoard      from "./components/field/FieldBoard";
import ActionsPanel    from "./components/actions/ActionsPanel";
import VideoPanel      from "./components/video/VideoPanel";
import HistPanel       from "./components/history/HistPanel";
import ElencoView      from "./components/views/ElencoView";
import GoalModal       from "./components/modals/GoalModal";
import PossessionModal from "./components/modals/PossessionModal";
import PenaltyModal    from "./components/modals/PenaltyModal";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@500;600;700&display=swap');
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
`;

function Div(){return <div style={{width:1,height:22,background:"#2A2A2A",flexShrink:0}}/>;}
function TopB({onClick,ch}){return <button onClick={onClick} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#999",borderRadius:3,padding:"0 5px",cursor:"pointer",fontSize:14,lineHeight:"18px",fontFamily:"monospace"}}>{ch}</button>;}

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

function RubroMap(){
  /* ── Escala proporcional ao tamanho da janela ── */
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => setScale(Math.max(0.6, Math.min(2.5, window.innerWidth / 1280)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [catKey,  setCatKey]  = useState("Sub 13");
  const [squads,  setSquads]  = useState(SQUADS_STATIC); // começa com squads.js, atualiza do XLSX
  const [players, setPlayers] = useState(mkPlayers(SQUADS_STATIC["Sub 13"]));
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
  const [penaltyModal,setPenaltyModal]=useState(null);
  const vRef      = useRef(null);
  const [vSrc,  setVSrc]  = useState(null);
  const [vCur,  setVCur]  = useState(0);
  const [vDur,  setVDur]  = useState(0);
  const mRef      = useRef(null);
  const pRef      = useRef(null);
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(48);
  const undoRef   = useRef(() => {});

  useEffect(()=>{
    if(!headerRef.current) return;
    const ro=new ResizeObserver(()=>{ if(headerRef.current) setHeaderH(headerRef.current.offsetHeight); });
    ro.observe(headerRef.current);
    return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    if(mRun) mRef.current=setInterval(()=>setMTime(t=>t+1),1000);
    else clearInterval(mRef.current);
    return()=>clearInterval(mRef.current);
  },[mRun]);
  useEffect(()=>{
    clearInterval(pRef.current);
    if(mRun&&possMode==="fla") pRef.current=setInterval(()=>setPossTime(p=>({...p,fla:p.fla+1})),1000);
    else if(mRun&&possMode==="adv") pRef.current=setInterval(()=>setPossTime(p=>({...p,adv:p.adv+1})),1000);
    return()=>clearInterval(pRef.current);
  },[mRun,possMode]);

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
  const toggleTimer=()=>{if(mRun)setMRun(false);else{if(possMode==="pause")setShowPM(true);setMRun(true);}};
  const loadCat=k=>{setCatKey(k);setPlayers(mkPlayers(squads[k]||[]));setSelPl(null);setShowCat(false);};

  const register=(actId,zoneId,lx=null,ly=null)=>{
    const aid=actId||selAct, zid=zoneId;
    if(zid===null||zid===undefined||aid===null||aid===undefined) return;
    const d=SECTORS.flatMap(s=>s.actions).find(x=>x.id===aid||x.posId===aid||x.negId===aid);
    const gmCfg=GOAL_MODAL_CONFIG[aid];
    if(gmCfg){setGoalModal({...gmCfg,actId:aid,zoneId:zid,x:lx,y:ly});setSelAct(null);return;}
    if(d?.openPenaltyModal){setPenaltyModal({side:d.openPenaltyModal,actId:aid,zoneId:zid,x:lx,y:ly});setSelAct(null);return;}
    regData(aid,zid,"",lx,ly);
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
    } else {
      const gk=players.find(p=>p.pos==="Goleiro");
      const prevPl=selPl;
      if(gk) setSelPl(gk.id);
      regData(actId,zoneId,label,x,y);
      const resId=result==="def"?"pen_def":"gol_sofr";
      regData(resId,zoneId," · "+pos,x,y);
      if(result==="sofrido") setScore(s=>({...s,adv:s.adv+1}));
      setSelPl(prevPl);
    }
  };

  const regData=(aid,zid,extraLabel="",lxIn=null,lyIn=null,goalXIn=null,goalYIn=null)=>{
    const zL=ZONES_50.find(z=>z.id===zid);
    const fx = lxIn ?? (zL ? zL.cx : 0.5);
    const fy = lyIn ?? (zL ? zL.cy : 0.5);
    const pl=players.find(p=>p.id===selPl);
    const t=fmt(mTime), vt=vRef.current?.currentTime??null;
    setTStats(p=>({...p,[aid]:p[aid]+1}));
    setTZStats(p=>({...p,[zid]:{...p[zid],[aid]:p[zid][aid]+1}}));
    if(selPl) setPlayers(p=>p.map(x=>x.id!==selPl?x:{...x,stats:{...x.stats,[aid]:x.stats[aid]+1},zStats:{...x.zStats,[zid]:{...x.zStats[zid],[aid]:x.zStats[zid][aid]+1}}}));
    const meta=getMeta(aid);
    setHist(p=>[{id:Date.now(),time:t,
      player:        pl?.athleteId || pl?.name || "Equipe",
      playerDisplay: pl?.nickname  || pl?.name?.split(" ")?.[0] || "Equipe",
      num:pl?.number||null,label:meta.label+extraLabel,color:meta.color,
      zone:zL?.name||"—",actId:aid,zoneId:zid,playerId:selPl||null,
      videoTime:vt,videoEndTime:null,
      x:fx, y:fy,
      goalX:goalXIn, goalY:goalYIn,
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
  };

  const exportData=format=>{
    const rows=hist.map(h=>({Tempo:h.time,IDAtleta:h.player,Apelido:h.playerDisplay||h.player,Numero:h.num||"",Acao:h.label,Zona:h.zone,TempoVideo:h.videoTime!=null?h.videoTime.toFixed(2):""}));
    if(format==="csv"){const hd=Object.keys(rows[0]||{}).join(",");const bd=rows.map(r=>Object.values(r).map(v=>'"'+v+'"').join(",")).join("\n");download("rubromap_"+catKey.replace(" ","_")+".csv","text/csv",hd+"\n"+bd);}
    else{const x='<?xml version="1.0" encoding="UTF-8"?>\n<partida categoria="'+catKey+'">\n'+rows.map(r=>'  <evento tempo="'+r.Tempo+'" idAtleta="'+r.IDAtleta+'" apelido="'+r.Apelido+'" numero="'+r.Numero+'" acao="'+r.Acao+'" zona="'+r.Zona+'" tempoVideo="'+r.TempoVideo+'"/>').join("\n")+"\n</partida>";download("rubromap_"+catKey.replace(" ","_")+".xml","application/xml",x);}
  };

    const SPEEDS = [1, 2, 3, 4, 5, 6, 7, 10];
  const applyRate = (rate) => {
    setPlaybackRate(rate);
    if (vRef.current) vRef.current.playbackRate = rate;
  };

  const navItems=[{id:"analise",l:"ANÁLISE"},{id:"mapa",l:"MAPA DE CALOR"},{id:"stats",l:"ESTATÍSTICAS"},{id:"elenco",l:"ELENCO"}];

  const W = `${(100/scale).toFixed(4)}vw`;
  const H = `${(100/scale).toFixed(4)}vh`;

  return(
    <div style={{width:W,height:H,zoom:scale,overflow:"hidden",background:"#F3F4F6",color:"#1A1A1A",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",zIndex:9999,pointerEvents:"none",animation:"ta 1.8s ease forwards",background:"#1A1A1A",border:"2px solid "+C.red,borderRadius:7,padding:"8px 22px",fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:"#FFF",transform:"translateX(-50%)"}}>{toast}</div>}
      <PossessionModal show={showPM} setPossMode={setPossMode} setShowPossModal={setShowPM}/>
      <GoalModal goalModal={goalModal} setGoalModal={setGoalModal} registerWithData={(aid,zid,extra,gx,gy)=>regData(aid,zid,extra,goalModal?.x,goalModal?.y,gx,gy)} setScore={setScore}/>
      <PenaltyModal penaltyModal={penaltyModal} setPenaltyModal={setPenaltyModal} onConfirm={handlePenaltyConfirm}/>

      <header ref={headerRef} style={{
        backgroundImage:`linear-gradient(rgba(20,20,20,.45),rgba(20,20,20,.45)),url(${fundo1Img})`,
        backgroundSize:"cover",backgroundPosition:"center",
        display:"flex",alignItems:"center",flexWrap:"wrap",gap:8,padding:"6px 14px",
        flexShrink:0,borderBottom:"1px solid #2A2A2A",position:"relative",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <img src={"data:image/png;base64,"+LOGO_B64} style={{width:26,height:26,objectFit:"contain"}} alt="CRF"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:4,color:"#FFF",lineHeight:1}}>RUBROMAP</span>
          <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:9,color:"#555",fontWeight:600,alignSelf:"flex-end",marginBottom:2,letterSpacing:1}}>v{APP_VERSION}</span>
        </div>
        <Div/>
        <div style={{flexShrink:0,position:"relative"}}>
          <button onClick={()=>setShowCat(s=>!s)} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#E0E0E0",borderRadius:4,padding:"3px 10px",fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,cursor:"pointer"}}>{catKey} {showCat?"▲":"▼"}</button>
          {showCat&&<div style={{position:"fixed",top:headerH,left:14,zIndex:600,background:"#FFF",border:"1px solid #E0E0E0",borderRadius:8,overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,.18)",minWidth:160}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>{CAT_LIST.map(cat=><button key={cat} onClick={()=>loadCat(cat)} style={{background:cat===catKey?C.red:"transparent",border:"none",borderRight:"1px solid #E0E0E0",borderBottom:"1px solid #E0E0E0",color:cat===catKey?"#FFF":"#1A1A1A",padding:"9px 8px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,textAlign:"center"}}>{cat}</button>)}</div></div>}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:2,color:C.red,opacity:.8}}>FLA</span>
          <TopB onClick={()=>setScore(s=>({...s,fla:Math.max(0,s.fla-1)}))} ch="−"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:C.red,minWidth:22,textAlign:"center",lineHeight:1}}>{score.fla}</span>
          <TopB onClick={()=>setScore(s=>({...s,fla:s.fla+1}))} ch="+"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:12,color:"#444",padding:"0 2px"}}>×</span>
          <TopB onClick={()=>setScore(s=>({...s,adv:s.adv+1}))} ch="+"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:24,color:"#DDD",minWidth:22,textAlign:"center",lineHeight:1}}>{score.adv}</span>
          <TopB onClick={()=>setScore(s=>({...s,adv:Math.max(0,s.adv-1)}))} ch="−"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:2,color:"#888",opacity:.8}}>ADV</span>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:10,color:C.red,minWidth:24,textAlign:"right"}}>{fp}%</span>
          <div style={{width:72,height:6,background:"#3A3A3A",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:fp+"%",height:"100%",background:C.red,transition:"width .6s"}}/>
          </div>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:10,color:"#AAA",minWidth:24}}>{ap}%</span>
          {[{m:"fla",l:"FLA"},{m:"pause",l:"⏸"},{m:"adv",l:"ADV"}].map(({m,l})=>(
            <button key={m} onClick={()=>setPossMode(m)} style={{
              background: possMode===m ? (m==="fla"?C.red : m==="adv"?"#334":"#444") : "#2A2A2A",
              border: `1px solid ${possMode===m ? (m==="adv"?"#556":"transparent") : "#3A3A3A"}`,
              color: "#FFF", borderRadius:3, padding:"2px 7px",
              fontFamily:"'Bebas Neue'", fontSize:10, letterSpacing:1, cursor:"pointer",
            }}>{l}</button>
          ))}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:4,background:"#111",border:`1px solid ${mRun?C.red:"#2A2A2A"}`,borderRadius:5,padding:"1px 8px",transition:"border-color .3s"}}>
            {mRun && <span style={{width:6,height:6,borderRadius:"50%",background:C.red,flexShrink:0,animation:"pulse .9s ease infinite"}}/>}
            <span style={{fontFamily:"monospace",fontSize:19,color:mRun?C.red:"#888",transition:"color .3s"}}>{fmt(mTime)}</span>
          </div>
          <button onClick={toggleTimer} style={{...lBtn(mRun),fontSize:11,padding:"3px 10px"}}>{mRun?"PAUSAR":"INICIAR"}</button>
          <button onClick={()=>{setMRun(false);setMTime(0);setPossMode("pause");}} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#777",borderRadius:5,padding:"3px 9px",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1,cursor:"pointer"}}>RESET</button>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
          {navItems.map(({id,l})=>(
            <button key={id} onClick={()=>setView(id)} style={{
              background: view===id ? "#2D2D2D" : "transparent",
              border: "none",
              borderBottom: `2px solid ${view===id ? C.red : "transparent"}`,
              color: view===id ? "#FFF" : "#777",
              padding: "5px 10px 3px",
              fontFamily:"'Bebas Neue'", fontSize:12, letterSpacing:1.5,
              cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap",
              borderRadius: "3px 3px 0 0",
            }}>{l}</button>
          ))}
        </div>
        <div style={{flex:1}}/>
      </header>

      <main style={{flex:1,overflow:"hidden",padding:"8px 10px",display:"flex",flexDirection:"column"}}>

        {view==="analise"&&(
          <div style={{display:"flex",gap:8,flex:1,minHeight:0}}>

            {/* ── Esquerda: Campo + Banco ── */}
            <div style={{flex:"0 0 52%",display:"flex",flexDirection:"column",gap:6,overflow:"auto"}}>
              <FieldBoard
                flashZ={flashZ}
                players={players}
                selPl={selPl}
                setSelPl={setSelPl}
                selAct={selAct}
                onFieldClick={handleFieldClick}
                catKey={catKey}
                hist={hist}
              />
            </div>

            {/* ── Direita: Vídeo (topo) → Ações (meio/baixo) → Histórico ── */}
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:7,overflow:"hidden"}}>

              {/* Vídeo — parte superior */}
              <div style={{flex:"0 0 32%",minHeight:0}}>
                <SoberCard title="VÍDEO" style={{height:"100%",minHeight:0}}
                  headerRight={vSrc && (
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
                  )}
                >
                  <VideoPanel videoRef={vRef} videoSrc={vSrc} setVideoSrc={setVSrc} videoCurrent={vCur} setVideoCurrent={setVCur} videoDuration={vDur} setVideoDuration={setVDur} hist={hist} setHist={setHist} playbackRate={playbackRate}/>
                </SoberCard>
              </div>

              {/* Ações — do meio para baixo, preenche totalmente sem scroll */}
              <SoberCard
                title="AÇÕES"
                style={{flex:1,minHeight:0,overflow:"hidden"}}
                headerRight={
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {editActMode&&[
                      {id:"cor",label:"COR"},
                      {id:"nome",label:"NOME"},
                      {id:"mover",label:"MOVER"},
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
                      style={{background:editActMode?"#E8001C":"transparent",border:`1px solid ${editActMode?"#E8001C":"#D4D4D4"}`,color:editActMode?"#FFF":"#6B7280",borderRadius:4,padding:"1px 8px",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer"}}
                    >{editActMode?"CONCLUIR":"EDITAR"}</button>
                  </div>
                }
              >
                <ActionsPanel selAct={selAct} setSelAct={setSelAct} editMode={editActMode} editTool={editTool} setEditTool={setEditTool}/>
              </SoberCard>

              {/* Histórico — base */}
              <div style={{height:150,flexShrink:0,background:"#FFF",border:"1px solid #E0E0E0",borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"5px 12px",borderBottom:"1px solid #E0E0E0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:4}}>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,color:"#6B7280"}}>HISTÓRICO <span style={{color:C.red}}>{hist.length > 0 ? `(${hist.length})` : ""}</span></span>
                  <div style={{display:"flex",gap:4}}>
                    <button
                      onClick={()=>hist.length>0&&deleteHistEntry(hist[0].id)}
                      title="Desfazer última ação (Ctrl+Z)"
                      style={{background:"transparent",border:"1px solid #D4D4D4",color:"#6B7280",borderRadius:4,padding:"1px 7px",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",opacity:hist.length>0?1:.4}}
                    >⟲ DESFAZER</button>
                    <button
                      onClick={clearAll}
                      title="Limpar todos os dados da sessão"
                      style={{background:"#FFF0F0",border:"1px solid #E8001C44",color:"#E8001C",borderRadius:4,padding:"1px 7px",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer",opacity:hist.length>0?1:.5}}
                    >LIMPAR TUDO</button>
                  </div>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"5px 8px"}}>
                  <HistPanel hist={hist} onDeleteEntry={deleteHistEntry} videoRef={vRef} videoDuration={vDur}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {view==="mapa"&&(()=>{
          const mapaPlayers=[...new Map(hist.filter(h=>h.playerId).map(h=>[h.playerId,{id:h.playerId,display:h.playerDisplay||h.player,num:h.num}])).values()];
          const mapaHist=playerFilt?hist.filter(h=>h.playerId===playerFilt):hist;
          const selPlayer=playerFilt?mapaPlayers.find(p=>p.id===playerFilt):null;
          const chipBase={borderRadius:5,padding:"3px 9px",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1,cursor:"pointer",border:"1px solid #D4D4D4",background:"#F5F5F5",color:C.txtM};
          const chipSel={...chipBase,background:C.red,border:`1px solid ${C.red}`,color:"#FFF"};
          return(
          <div style={{flex:1,overflow:"hidden",display:"flex",gap:8,minHeight:0}}>
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:6,justifyContent:"center",alignItems:"center"}}>
              <SoberCard title={"MAPA DE CALOR"+(heatFilt!=="all"?" · "+getMeta(heatFilt).label:"")+(selPlayer?" · "+selPlayer.display:"")} style={{width:"78%"}}>
                <FieldMap hist={mapaHist} filterAct={heatFilt}/>
              </SoberCard>

              {/* Abas de jogadores com ações registradas */}
              {mapaPlayers.length>0&&(
                <div style={{width:"78%",display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-start"}}>
                  <button onClick={()=>setPlayerFilt(null)} style={playerFilt===null?chipSel:chipBase}>TODOS</button>
                  {mapaPlayers.map(p=>(
                    <button key={p.id} onClick={()=>setPlayerFilt(p.id)} style={p.id===playerFilt?chipSel:chipBase}>
                      {p.num?`#${p.num} `:""}{p.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <SoberCard title="FILTRAR" style={{width:220,flexShrink:0}} contentStyle={{overflowY:"auto"}}>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <button onClick={()=>setHeatFilt("all")} style={filtBtn(heatFilt==="all",C.gold)}>TODAS AS AÇÕES</button>
                {SECTORS.map(s=>(
                  <div key={s.id} style={{marginTop:5}}>
                    <div style={{fontSize:9,color:s.color,letterSpacing:2,fontFamily:"'Bebas Neue'",marginBottom:3,borderBottom:"1px solid #E0E0E0",paddingBottom:2}}>{s.label.toUpperCase()}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {s.actions.map(a=>a.type==="single"
                        ?<button key={a.id} onClick={()=>setHeatFilt(a.id)} style={filtBtn(heatFilt===a.id,s.color)}>{a.label}</button>
                        :[<button key={a.posId} onClick={()=>setHeatFilt(a.posId)} style={filtBtn(heatFilt===a.posId,a.posColor||C.posL)}>{a.label}: {a.posLabel}</button>,
                          <button key={a.negId} onClick={()=>setHeatFilt(a.negId)} style={filtBtn(heatFilt===a.negId,a.negColor||C.negL)}>{a.label}: {a.negLabel}</button>]
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SoberCard>
          </div>
        )})()}

        {view==="stats"&&(
          <div style={{flex:1,overflow:"auto"}}>
            <div style={{maxWidth:1000}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <SoberCard title="PLACAR" style={{flex:1}}><div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0"}}><div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.red,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>FLAMENGO</div><div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:C.red,lineHeight:1}}>{score.fla}</div></div><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#E0E0E0"}}>×</div><div style={{textAlign:"center"}}><div style={{fontSize:8,color:"#6B7280",letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>ADVERSÁRIO</div><div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:"#6B7280",lineHeight:1}}>{score.adv}</div></div></div></SoberCard>
                <SoberCard title="EXPORTAR" style={{flex:1}}><div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center",padding:"8px 0"}}><div style={{fontSize:11,color:"#6B7280",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{hist.length} eventos registrados</div><div style={{display:"flex",gap:8}}><button onClick={()=>exportData("csv")} style={{...lBtn(true),fontSize:14,padding:"8px 18px"}}>EXPORTAR CSV</button><button onClick={()=>exportData("xml")} style={{...lBtn(false),fontSize:14,padding:"8px 18px"}}>EXPORTAR XML</button></div></div></SoberCard>
              </div>
              <SoberCard title="MAPA DE GOL" style={{marginBottom:14}}>
                <GoalMapStats hist={hist}/>
              </SoberCard>
              {SECTORS.map(s=>(
                <div key={s.id} style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:s.color,letterSpacing:3,marginBottom:7,fontFamily:"'Bebas Neue'",borderBottom:"1px solid #E0E0E0",paddingBottom:4}}>{s.label.toUpperCase()}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:5}}>
                    {s.actions.map(a=>a.type==="single"
                      ?<StatCard key={a.id} label={a.label} val={tStats[a.id]} color={s.color}/>
                      :[<StatCard key={a.posId} label={a.label+" "+a.posLabel} val={tStats[a.posId]} color={a.posColor||C.posL}/>,<StatCard key={a.negId} label={a.label+" "+a.negLabel} val={tStats[a.negId]} color={a.negColor||C.negL}/>]
                    )}
                  </div>
                </div>
              ))}
            </div>
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
  return <RubroMap />;
}
