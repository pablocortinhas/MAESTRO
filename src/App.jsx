import { useState, useEffect, useRef } from "react";
import { C }                                   from "./constants/colors";
import { ZONES_P, ZONES_L }                    from "./constants/zones";
import { SECTORS, ALL_IDS }                    from "./constants/sectors";
import { SQUADS, CAT_LIST }                    from "./constants/squads";
import { LOGO_B64 }                            from "./assets/base64";
import { fmt, getMeta, download }              from "./utils/format";
import { initSt, initZSt, mkPlayers }          from "./utils/dataInit";
import { lBtn, filtBtn }                       from "./utils/styles";
import SoberCard       from "./components/common/SoberCard";
import StatCard        from "./components/common/StatCard";
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
  @keyframes fz{0%{opacity:.1;transform:scale(.85)}55%{opacity:1;transform:scale(1.14)}100%{opacity:1;transform:scale(1)}}
  @keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(14px)}15%,76%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0}}
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

export default function RubroMap(){
  const [catKey,  setCatKey]  = useState("Sub 13");
  const [players, setPlayers] = useState(mkPlayers(SQUADS["Sub 13"]));
  const [tStats,  setTStats]  = useState(initSt());
  const [tZStats, setTZStats] = useState(initZSt());
  const [selPl,   setSelPl]   = useState(null);
  const [selZone, setSelZone] = useState(null);
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

  const tot=possTime.fla+possTime.adv||1;
  const fp=Math.round(possTime.fla/tot*100);
  const ap=100-fp;
  const toggleTimer=()=>{if(mRun)setMRun(false);else{if(possMode==="pause")setShowPM(true);setMRun(true);}};
  const loadCat=k=>{setCatKey(k);setPlayers(mkPlayers(SQUADS[k]||[]));setSelPl(null);setShowCat(false);};

  const register=(actId,zoneId)=>{
    const aid=actId||selAct, zid=zoneId!==undefined?zoneId:selZone;
    if(zid===null||zid===undefined||aid===null||aid===undefined) return;
    const d=SECTORS.flatMap(s=>s.actions).find(x=>x.id===aid||x.posId===aid||x.negId===aid);
    if(d?.openGoalModal){setGoalModal({side:d.openGoalModal,actId:aid,zoneId:zid});setSelZone(null);setSelAct(null);return;}
    if(d?.openPenaltyModal){setPenaltyModal({side:d.openPenaltyModal,actId:aid,zoneId:zid});setSelZone(null);setSelAct(null);return;}
    regData(aid,zid);
  };

  const handlePenaltyConfirm=({pos,result,side})=>{
    const {actId,zoneId}=penaltyModal||{};
    const label=` · ${pos}`;
    if(side==="home"){
      const resId=result==="conv"?"pen_conv":"pen_perd";
      regData(actId,zoneId,label);
      regData(resId,zoneId," · "+pos);
      if(result==="conv") setScore(s=>({...s,fla:s.fla+1}));
    } else {
      const gk=players.find(p=>p.pos==="Goleiro");
      const prevPl=selPl;
      if(gk) setSelPl(gk.id);
      regData(actId,zoneId,label);
      const resId=result==="def"?"pen_def":"gol_sofr";
      regData(resId,zoneId," · "+pos);
      if(result==="sofrido") setScore(s=>({...s,adv:s.adv+1}));
      setSelPl(prevPl);
    }
  };

  const regData=(aid,zid,extraLabel="")=>{
    const z=[...ZONES_P,...ZONES_L].find(x=>x.id===zid)||ZONES_P[zid];
    const pl=players.find(p=>p.id===selPl);
    const t=fmt(mTime), vt=vRef.current?.currentTime??null;
    setTStats(p=>({...p,[aid]:p[aid]+1}));
    setTZStats(p=>({...p,[zid]:{...p[zid],[aid]:p[zid][aid]+1}}));
    if(selPl) setPlayers(p=>p.map(x=>x.id!==selPl?x:{...x,stats:{...x.stats,[aid]:x.stats[aid]+1},zStats:{...x.zStats,[zid]:{...x.zStats[zid],[aid]:x.zStats[zid][aid]+1}}}));
    const meta=getMeta(aid);
    setHist(p=>[{id:Date.now(),time:t,player:pl?.name||"Equipe",num:pl?.number||null,label:meta.label+extraLabel,color:meta.color,zone:z?.name||"—",actId:aid,zoneId:zid,playerId:selPl||null,videoTime:vt,videoEndTime:null},...p.slice(0,299)]);
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
    setSelZone(null);
    setSelAct(null);
  };

  const zTotal=(zid,filt)=>{const st=tZStats[zid];if(!st)return 0;if(!filt||filt==="all")return Object.values(st).reduce((a,b)=>a+b,0);return st[filt]||0;};
  const maxZ=filt=>Math.max(...ZONES_P.map(z=>zTotal(z.id,filt)),1);
  const exportData=format=>{
    const rows=hist.map(h=>({Tempo:h.time,Jogador:h.player,Numero:h.num||"",Acao:h.label,Zona:h.zone,TempoVideo:h.videoTime!=null?h.videoTime.toFixed(2):""}));
    if(format==="csv"){const hd=Object.keys(rows[0]||{}).join(",");const bd=rows.map(r=>Object.values(r).map(v=>'"'+v+'"').join(",")).join("\n");download("rubromap_"+catKey.replace(" ","_")+".csv","text/csv",hd+"\n"+bd);}
    else{const x='<?xml version="1.0" encoding="UTF-8"?>\n<partida categoria="'+catKey+'">\n'+rows.map(r=>'  <evento tempo="'+r.Tempo+'" jogador="'+r.Jogador+'" numero="'+r.Numero+'" acao="'+r.Acao+'" zona="'+r.Zona+'" tempoVideo="'+r.TempoVideo+'"/>').join("\n")+"\n</partida>";download("rubromap_"+catKey.replace(" ","_")+".xml","application/xml",x);}
  };

  const navItems=[{id:"analise",l:"ANÁLISE"},{id:"mapa",l:"MAPA DE CALOR"},{id:"stats",l:"ESTATÍSTICAS"},{id:"elenco",l:"ELENCO"}];

  return(
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",background:"#F3F4F6",color:"#1A1A1A",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",zIndex:9999,pointerEvents:"none",animation:"ta 1.8s ease forwards",background:"#1A1A1A",border:"2px solid "+C.red,borderRadius:7,padding:"8px 22px",fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:"#FFF",transform:"translateX(-50%)"}}>{toast}</div>}
      <PossessionModal show={showPM} setPossMode={setPossMode} setShowPossModal={setShowPM}/>
      <GoalModal goalModal={goalModal} setGoalModal={setGoalModal} registerWithData={regData} setScore={setScore}/>
      <PenaltyModal penaltyModal={penaltyModal} setPenaltyModal={setPenaltyModal} onConfirm={handlePenaltyConfirm}/>

      <header ref={headerRef} style={{background:"#1A1A1A",display:"flex",alignItems:"center",flexWrap:"wrap",gap:8,padding:"6px 14px",flexShrink:0,borderBottom:"1px solid #2A2A2A",position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <img src={"data:image/png;base64,"+LOGO_B64} style={{width:26,height:26,objectFit:"contain"}} alt="CRF"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:4,color:"#FFF",lineHeight:1}}>RUBROMAP</span>
        </div>
        <Div/>
        <div style={{flexShrink:0,position:"relative"}}>
          <button onClick={()=>setShowCat(s=>!s)} style={{background:"#2A2A2A",border:"1px solid #3A3A3A",color:"#E0E0E0",borderRadius:4,padding:"3px 10px",fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,cursor:"pointer"}}>{catKey} {showCat?"▲":"▼"}</button>
          {showCat&&<div style={{position:"fixed",top:headerH,left:14,zIndex:600,background:"#FFF",border:"1px solid #E0E0E0",borderRadius:8,overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,.18)",minWidth:160}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>{CAT_LIST.map(cat=><button key={cat} onClick={()=>loadCat(cat)} style={{background:cat===catKey?C.red:"transparent",border:"none",borderRight:"1px solid #E0E0E0",borderBottom:"1px solid #E0E0E0",color:cat===catKey?"#FFF":"#1A1A1A",padding:"9px 8px",cursor:"pointer",fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,textAlign:"center"}}>{cat}</button>)}</div></div>}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,color:C.red}}>FLA</span>
          <TopB onClick={()=>setScore(s=>({...s,fla:Math.max(0,s.fla-1)}))} ch="−"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:C.red,minWidth:20,textAlign:"center"}}>{score.fla}</span>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:14,color:"#555"}}>×</span>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#FFF",minWidth:20,textAlign:"center"}}>{score.adv}</span>
          <TopB onClick={()=>setScore(s=>({...s,adv:Math.max(0,s.adv-1)}))} ch="−"/>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,color:"#FFF"}}>ADV</span>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:10,color:C.red,minWidth:26}}>{fp}%</span>
          <div style={{width:80,height:7,background:"#3A3A3A",borderRadius:4,overflow:"hidden"}}><div style={{width:fp+"%",height:"100%",background:C.red,transition:"width .6s"}}/></div>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:10,color:"#FFF",minWidth:26}}>{ap}%</span>
          {[{m:"fla",l:"FLA"},{m:"pause",l:"—"},{m:"adv",l:"ADV"}].map(({m,l})=><button key={m} onClick={()=>setPossMode(m)} style={{background:possMode===m?(m==="fla"?C.red:m==="adv"?"rgba(255,255,255,.22)":"#555"):"#2A2A2A",border:"1px solid "+(possMode===m?m==="adv"?"rgba(255,255,255,.5)":"transparent":"#3A3A3A"),color:"#FFF",borderRadius:3,padding:"2px 6px",fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:1,cursor:"pointer"}}>{l}</button>)}
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{fontFamily:"monospace",fontSize:20,color:mRun?C.red:"#888",background:"#111",border:"1px solid "+(mRun?C.red:"#2A2A2A"),borderRadius:5,padding:"1px 10px",transition:"all .3s"}}>{fmt(mTime)}</span>
          <button onClick={toggleTimer} style={{...lBtn(mRun),fontSize:11,padding:"3px 10px"}}>{mRun?"PAUSAR":"INICIAR"}</button>
          <button onClick={()=>{setMRun(false);setMTime(0);setPossMode("pause");}} style={{...lBtn(false),fontSize:11,padding:"3px 10px"}}>RESET</button>
        </div>
        <Div/>
        <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
          {navItems.map(({id,l})=>(
            <button key={id} onClick={()=>setView(id)} style={{background:view===id?C.red:"#2A2A2A",border:"1px solid "+(view===id?C.red:"#3A3A3A"),color:view===id?"#FFF":"#AAA",borderRadius:4,padding:"3px 9px",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1.5,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
          <button onClick={clearAll} style={{background:"#3A1A1A",border:"1px solid "+C.red,color:C.red,borderRadius:4,padding:"3px 10px",fontFamily:"'Bebas Neue'",fontSize:11,letterSpacing:1.5,cursor:"pointer"}}>LIMPAR TUDO</button>
          {hist.length>0&&<><button onClick={()=>exportData("csv")} style={{...lBtn(false),fontSize:10,padding:"3px 9px"}}>CSV</button><button onClick={()=>exportData("xml")} style={{...lBtn(false),fontSize:10,padding:"3px 9px"}}>XML</button></>}
        </div>
      </header>

      <main style={{flex:1,overflow:"auto",padding:"10px 12px"}}>

        {view==="analise"&&(
          <div style={{display:"flex",gap:10,height:"100%",minHeight:0}}>

            {/* Coluna esquerda: campo integrado */}
            <div style={{flex:1,minWidth:280,display:"flex",flexDirection:"column",gap:10,overflow:"auto"}}>
              <SoberCard title="CAMPO">
                <FieldBoard
                  zones={ZONES_L}
                  selZone={selZone}
                  onZone={id=>setSelZone(id===selZone?null:id)}
                  flashZ={flashZ}
                  tZStats={tZStats}
                  maxZ={maxZ("all")}
                  players={players}
                  selPl={selPl}
                  setSelPl={setSelPl}
                />
              </SoberCard>
            </div>

            {/* Coluna do meio: ações + histórico */}
            <div style={{flex:1,minWidth:220,display:"flex",flexDirection:"column",gap:10,overflow:"hidden"}}>
              <SoberCard title="AÇÕES" style={{flex:1,minHeight:0,overflow:"hidden"}}>
                <div style={{overflowY:"auto",height:"100%"}}>
                  <ActionsPanel selZone={selZone} selAct={selAct} setSelAct={setSelAct} register={register}/>
                </div>
              </SoberCard>
              <div style={{height:170,flexShrink:0,background:"#FFF",border:"1px solid #E0E0E0",borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"6px 12px",borderBottom:"1px solid #E0E0E0",fontFamily:"'Bebas Neue'",fontSize:12,letterSpacing:2,color:"#6B7280",flexShrink:0}}>HISTÓRICO</div>
                <div style={{flex:1,overflowY:"auto",padding:"6px 10px"}}>
                  <HistPanel hist={hist} onDeleteEntry={deleteHistEntry} videoRef={vRef} videoDuration={vDur}/>
                </div>
              </div>
            </div>

            {/* Coluna direita: vídeo */}
            <div style={{flex:1,minWidth:220,display:"flex",flexDirection:"column",gap:10,overflow:"auto"}}>
              <SoberCard title="VÍDEO"><VideoPanel videoRef={vRef} videoSrc={vSrc} setVideoSrc={setVSrc} videoCurrent={vCur} setVideoCurrent={setVCur} videoDuration={vDur} setVideoDuration={setVDur} hist={hist}/></SoberCard>
            </div>
          </div>
        )}

        {view==="mapa"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 240px",gap:10}}>
            <SoberCard title={"MAPA DE CALOR"+(heatFilt!=="all"?" · "+getMeta(heatFilt).label:"")}>
              <FieldMap zones={ZONES_P} landscape={false} selZone={null} onZone={()=>{}} flashZ={null} tZStats={tZStats} maxZ={maxZ(heatFilt)} filterAct={heatFilt}/>
            </SoberCard>
            <SoberCard title="FILTRAR AÇÃO">
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <button onClick={()=>setHeatFilt("all")} style={filtBtn(heatFilt==="all",C.gold)}>TODAS AS AÇÕES</button>
                {SECTORS.map(s=>(
                  <div key={s.id} style={{marginTop:6}}>
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
        )}

        {view==="stats"&&(
          <div style={{maxWidth:1000}}>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <SoberCard title="PLACAR" style={{flex:1}}><div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"8px 0"}}><div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.red,letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>FLAMENGO</div><div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:C.red,lineHeight:1}}>{score.fla}</div></div><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#E0E0E0"}}>×</div><div style={{textAlign:"center"}}><div style={{fontSize:8,color:"#6B7280",letterSpacing:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>ADVERSÁRIO</div><div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:"#6B7280",lineHeight:1}}>{score.adv}</div></div></div></SoberCard>
              <SoberCard title="EXPORTAR" style={{flex:1}}><div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center",padding:"8px 0"}}><div style={{fontSize:11,color:"#6B7280",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{hist.length} eventos registrados</div><div style={{display:"flex",gap:8}}><button onClick={()=>exportData("csv")} style={{...lBtn(true),fontSize:14,padding:"8px 18px"}}>EXPORTAR CSV</button><button onClick={()=>exportData("xml")} style={{...lBtn(false),fontSize:14,padding:"8px 18px"}}>EXPORTAR XML</button></div></div></SoberCard>
            </div>
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
        )}

        {view==="elenco"&&<ElencoView players={players} setPlayers={setPlayers} catKey={catKey} loadCat={loadCat} showCat={showCat} setShowCat={setShowCat}/>}
      </main>
    </div>
  );
}
