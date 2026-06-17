import { C } from "../../constants/colors";

export default function SoberCard({
  title, children, style = {}, headerRight, contentStyle = {},
  onHeaderMouseDown, headerStyle = {}, centerTitle = false,
}) {
  const headerBase = {
    padding: "6px 12px",
    borderBottom: `1px solid ${C.bdr}`,
    fontFamily: "'Bebas Neue'",
    fontSize: 12,
    letterSpacing: 2,
    color: C.txtM,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    cursor: onHeaderMouseDown ? "grab" : "default",
    userSelect: "none",
    ...headerStyle,
  };

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
        <div
          onMouseDown={(e) => {
            if (e.target.closest("button") || e.target.closest("input")) return;
            onHeaderMouseDown?.(e);
          }}
          style={centerTitle
            ? { ...headerBase, position: "relative", justifyContent: "flex-end" }
            : { ...headerBase, justifyContent: "space-between" }
          }>
          {centerTitle
            ? <span style={{ position:"absolute", left:0, right:0, textAlign:"center", pointerEvents:"none" }}>{title}</span>
            : <span>{title}</span>
          }
          {headerRight}
        </div>
      )}
      <div style={{ padding: "10px 12px", flex: 1, minHeight: 0, overflow: "hidden", display:"flex", flexDirection:"column", ...contentStyle }}>
        {children}
      </div>
    </div>
  );
}
