import { C } from "../../constants/colors";
import camisa1Img  from "../../../imagens/camisa_1.png";
import camisa2Img  from "../../../imagens/camisa_2.png";
import camisaGLImg from "../../../imagens/camisa_GL.png";

export default function BenchPanel({ bench, uniform, subMode, doSub }) {
  return (
    <div style={{
      border:`1px solid ${subMode ? C.red : C.bdr}`, borderRadius:6, padding:"7px 10px",
      background:subMode?"#FFF5F5":"#FAFAFA", transition:"border-color .2s, background .2s",
      height:"100%", overflow:"auto",
    }}>
      <div style={{ fontSize:11, color:subMode?C.red:C.txtM, fontFamily:"'Bebas Neue'", letterSpacing:2, marginBottom:6 }}>
        {subMode ? "BANCO — CLIQUE PARA SUBSTITUIR" : "BANCO DE RESERVAS"}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {bench.map(pl => (
          <button key={pl.id} onClick={() => { if (subMode) doSub(pl); }} style={{
            background:"#FFF", border:`1px solid ${subMode?C.red+"66":C.bdr}`,
            borderRadius:5, padding:"5px 10px",
            cursor:subMode?"pointer":"default",
            fontFamily:"'Bebas Neue'", fontSize:13, letterSpacing:.8,
            display:"flex", alignItems:"center", gap:6, opacity:subMode?1:.8,
            boxShadow: subMode ? "0 1px 4px rgba(232,0,28,.15)" : "none",
          }}>
            <img src={pl.pos==="Goleiro"?camisaGLImg:(uniform===1?camisa1Img:camisa2Img)} style={{ width:26, height:26, objectFit:"contain" }}/>
            <span>{pl.number?`#${pl.number} `:""}{pl.nickname||pl.name.split(" ")[0]}</span>
          </button>
        ))}
        {bench.length===0 && <span style={{ fontSize:12, color:C.txtM, fontFamily:"'Rajdhani'", fontWeight:600 }}>Nenhum no banco</span>}
      </div>
    </div>
  );
}
