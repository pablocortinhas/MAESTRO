import { C }        from "../../constants/colors";
import { fmtVideo } from "../../utils/format";

export default function HistPanel({ hist, onDeleteEntry, videoRef, videoDuration }) {
  const seekTo = (t) => {
    if (videoRef?.current && t != null) videoRef.current.currentTime = t;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minHeight: 0 }}>

      {hist.length === 0 ? (
        <div style={{
          color: C.bdr2, fontSize: 11, textAlign: "center",
          padding: "12px 0", fontFamily: "'Rajdhani',sans-serif",
        }}>
          Nenhum evento registrado
        </div>
      ) : (
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {hist.map((h, i) => (
            <div
              key={h.id}
              onClick={() => h.videoTime != null && seekTo(h.videoTime)}
              style={{
                display:       "flex", gap: 5, alignItems: "center",
                padding:       "4px 6px", borderRadius: 4,
                background:    i === 0 ? "#FFF5F5" : "#FAFAFA",
                borderLeft:    `3px solid ${i === 0 ? h.color : "transparent"}`,
                cursor:        h.videoTime != null ? "pointer" : "default",
                transition:    "background .1s",
              }}
              onMouseEnter={e => { if (h.videoTime != null) e.currentTarget.style.background = "#F0F0F0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = i === 0 ? "#FFF5F5" : "#FAFAFA"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 34 }}>
                <span style={{ color: C.txtM, fontFamily: "monospace", fontSize: 9, lineHeight: 1 }}>
                  {h.time}
                </span>
                {h.videoTime != null && (
                  <span style={{ color: C.red, fontFamily: "monospace", fontSize: 8, lineHeight: 1 }}>
                    {fmtVideo(h.videoTime)}
                  </span>
                )}
              </div>

              <span style={{
                color: C.txtM, minWidth: 22,
                fontFamily: "'Rajdhani',sans-serif",
                fontWeight: 600, fontSize: 10,
              }}>
                {h.num ? `#${h.num}` : (h.team === "adv" ? "ADV" : "FLA")}
              </span>

              <span
                title={h.player}
                style={{
                  color: C.txtM, flex: 1, minWidth: 50, maxWidth: 70,
                  fontFamily: "'Rajdhani',sans-serif",
                  fontWeight: 600, fontSize: 10,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {h.playerDisplay || h.player}
              </span>

              <span style={{
                color: h.color, flex: 2,
                fontFamily: "'Rajdhani',sans-serif",
                fontWeight: 700, fontSize: 10,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {h.label}
              </span>

              <button
                onClick={e => { e.stopPropagation(); onDeleteEntry(h.id); }}
                style={{
                  background: "transparent",
                  border:     `1px solid ${C.bdr}`,
                  color:      C.negL, cursor: "pointer",
                  fontSize:   9, borderRadius: 3,
                  padding:    "1px 5px",
                  fontFamily: "'Rajdhani',sans-serif",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
