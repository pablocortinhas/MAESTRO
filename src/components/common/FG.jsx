import { C } from "../../constants/colors";

/** Form Group — label + input/select wrapper */
export default function FG({ label, children, flex, width, minW }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 3,
      ...(flex ? { flex } : {}),
      ...(width ? { width } : {}),
      ...(minW ? { minWidth: minW } : {}),
    }}>
      <label style={{
        fontSize: 9, color: C.txtM,
        fontFamily: "'Rajdhani',sans-serif",
        fontWeight: 700, letterSpacing: 1,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
