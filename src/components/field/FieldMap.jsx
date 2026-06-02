import { CAMPO_P_B64, CAMPO_L_B64 } from "../../assets/base64";

export default function FieldMap({
  zones, landscape, selZone, onZone,
  flashZ, tZStats, maxZ, filterAct,
}) {
  const b64 = landscape ? CAMPO_L_B64 : CAMPO_P_B64;

  return (
    <div style={{
      position: "relative", width: "100%",
      lineHeight: 0, borderRadius: 6, overflow: "hidden",
      border: "1px solid #D0D0D0",
    }}>
      <img
        src={`data:image/jpeg;base64,${b64}`}
        style={{ display: "block", width: "100%", height: "auto" }}
        alt="campo" draggable={false}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        {zones.map(z => {
          const tot = filterAct && filterAct !== "all"
            ? (tZStats[z.id]?.[filterAct] || 0)
            : Object.values(tZStats[z.id] || {}).reduce((a, b) => a + b, 0);
          const intensity = tot / Math.max(maxZ, 1);
          const sel   = selZone === z.id;
          const flash = flashZ  === z.id;

          return (
            <div
              key={z.id}
              className={"zb" + (flash ? " fz" : "")}
              onClick={() => onZone(z.id)}
              title={z.name}
              style={{
                position: "absolute",
                left:   (z.x1 * 100) + "%",
                top:    (z.y1 * 100) + "%",
                width:  ((z.x2 - z.x1) * 100) + "%",
                height: ((z.y2 - z.y1) * 100) + "%",
                background: sel
                  ? "rgba(232,0,28,.42)"
                  : tot > 0
                  ? `rgba(232,0,28,${(0.07 + intensity * 0.38).toFixed(2)})`
                  : "rgba(0,0,0,.01)",
                border: sel
                  ? "2px solid rgba(232,0,28,.9)"
                  : "1px solid rgba(255,255,255,.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {tot > 0 && (
                <span style={{
                  background: "rgba(0,0,0,.62)", color: "#fff",
                  borderRadius: 5, padding: "0 4px",
                  fontSize: 9, fontWeight: 700,
                  fontFamily: "monospace", pointerEvents: "none",
                }}>
                  {tot}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
