export default function SplitActionButton({ posLabel, negLabel, posColor, negColor, selected, onSelectPos, onSelectNeg }) {
  const half = (side, label, color, active) => (
    <button
      onClick={side === "pos" ? onSelectPos : onSelectNeg}
      style={{
        flex:1, minWidth:0, alignSelf:"stretch",
        background: active ? color : color + "12",
        border: `2px solid ${active ? color : color + "44"}`,
        borderLeft: side === "neg" ? "none" : undefined,
        borderRadius: side === "pos" ? "6px 0 0 6px" : "0 6px 6px 0",
        cursor:"pointer", transition:"all .12s",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"4px 4px", boxSizing:"border-box",
      }}
    >
      <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:.5, color: active ? "#FFF" : color, textAlign:"center", lineHeight:1.15, wordBreak:"break-word" }}>
        {label}
      </span>
    </button>
  );

  return (
    <div style={{ display:"flex" }}>
      {half("pos", posLabel, posColor, selected === "pos")}
      {half("neg", negLabel, negColor, selected === "neg")}
    </div>
  );
}
