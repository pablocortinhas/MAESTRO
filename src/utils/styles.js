import { C } from "../constants/colors";

/** Button style — active=true → red/filled, false → light/outlined */
export const lBtn = (active) => {
  if (active) return {
    background: C.red,   border: `1px solid ${C.redDk}`,
    color: C.wh,         borderRadius: 5,
    padding: "6px 14px", fontFamily: "'Bebas Neue'",
    fontSize: 13,        letterSpacing: 2,
    cursor: "pointer",   whiteSpace: "nowrap",
  };
  return {
    background: "#F5F5F5", border: "1px solid #D4D4D4",
    color: "#1A1A1A",      borderRadius: 5,
    padding: "6px 14px",   fontFamily: "'Bebas Neue'",
    fontSize: 13,          letterSpacing: 2,
    cursor: "pointer",     whiteSpace: "nowrap",
  };
};

/** Filter button (heatmap sidebar) */
export const filtBtn = (active, color) => ({
  background:  active ? color + "18" : "transparent",
  border:      `1px solid ${active ? color : C.bdr2}`,
  color:       active ? color : C.txtM,
  borderRadius: 5,
  padding:     "5px 9px",
  fontFamily:  "'Bebas Neue'",
  fontSize:    11,
  letterSpacing: 1,
  cursor:      "pointer",
  textAlign:   "left",
  width:       "100%",
  transition:  "all .1s",
});
