import { C } from "../../constants/colors";

export default function SoberCard({ title, children, style = {} }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.bdr}`,
      borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,.07)",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}>
      {title && (
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${C.bdr}`,
          fontFamily: "'Bebas Neue'",
          fontSize: 12,
          letterSpacing: 2,
          color: C.txtM,
          flexShrink: 0,
        }}>
          {title}
        </div>
      )}
      <div style={{ padding: "10px 12px", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
