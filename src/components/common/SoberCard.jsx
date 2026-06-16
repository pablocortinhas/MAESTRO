import { C } from "../../constants/colors";

export default function SoberCard({
  title, children, style = {}, headerRight, contentStyle = {},
  draggable, dragOver, dragging,
  onHeaderDragStart, onHeaderDragOver, onHeaderDragLeave, onHeaderDrop, onHeaderDragEnd,
}) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.bdr}`,
      borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,.07)",
      display: "flex",
      flexDirection: "column",
      opacity: dragging ? 0.45 : 1,
      ...style,
    }}>
      {title && (
        <div
          draggable={draggable}
          onDragStart={onHeaderDragStart}
          onDragOver={onHeaderDragOver}
          onDragLeave={onHeaderDragLeave}
          onDrop={onHeaderDrop}
          onDragEnd={onHeaderDragEnd}
          style={{
            padding: "6px 12px",
            borderBottom: dragOver ? `2px dashed ${C.red}` : `1px solid ${C.bdr}`,
            background: dragOver ? C.red+"10" : "transparent",
            fontFamily: "'Bebas Neue'",
            fontSize: 12,
            letterSpacing: 2,
            color: C.txtM,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: draggable ? "grab" : "default",
          }}>
          <span>{title}</span>
          {headerRight}
        </div>
      )}
      <div style={{ padding: "10px 12px", flex: 1, minHeight: 0, overflow: "hidden", display:"flex", flexDirection:"column", ...contentStyle }}>
        {children}
      </div>
    </div>
  );
}
