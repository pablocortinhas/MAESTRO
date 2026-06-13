import { C }       from "../../constants/colors";
import camisa1Img   from "../../../imagens/camisa_1.png";
import camisaGLImg  from "../../../imagens/camisa_GL.png";

export default function PlayerSelector({ players, selPl, setSelPl }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap",
      gap: 6, alignItems: "flex-start",
    }}>
      {/* "Equipe" button */}
      <button
        onClick={() => setSelPl(null)}
        style={{
          background:   selPl === null ? C.red : "#F5F5F5",
          border:       `1px solid ${selPl === null ? C.red : "#D4D4D4"}`,
          borderRadius: 6,
          padding:      "4px 10px",
          cursor:       "pointer",
          display:      "flex",
          flexDirection: "column",
          alignItems:   "center",
          gap:          2,
          minWidth:     48,
          transition:   "all .1s",
        }}
      >
        <span style={{
          fontFamily:   "'Bebas Neue'",
          fontSize:     18,
          color:        selPl === null ? C.wh : C.txtM,
          lineHeight:   1,
        }}>
          EQ
        </span>
        <span style={{
          fontSize:     8,
          fontFamily:   "'Rajdhani',sans-serif",
          fontWeight:   600,
          color:        selPl === null ? "rgba(255,255,255,.8)" : C.txtM,
          letterSpacing: 0.5,
        }}>
          EQUIPE
        </span>
      </button>

      {/* One button per player */}
      {players.map(p => {
        const isGK   = p.pos === "Goleiro";
        const active = selPl === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setSelPl(p.id === selPl ? null : p.id)}
            style={{
              background:    active ? C.red : "#F5F5F5",
              border:        `1px solid ${active ? C.red : "#D4D4D4"}`,
              borderRadius:  6,
              padding:       "4px 6px",
              cursor:        "pointer",
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           3,
              minWidth:      52,
              maxWidth:      64,
              transition:    "all .12s",
              outline:       "none",
            }}
          >
            {/* Jersey image */}
            <div style={{ position: "relative" }}>
              <img
                src={isGK ? camisaGLImg : camisa1Img}
                alt={isGK ? "GL" : "Jogador"}
                draggable={false}
                style={{
                  width:      36,
                  height:     36,
                  objectFit:  "contain",
                  display:    "block",
                  /* Tint red when selected */
                  filter:     active
                    ? "brightness(0) invert(1)"
                    : "none",
                  transition: "filter .12s",
                }}
              />
              {/* Number badge */}
              {p.number && (
                <span style={{
                  position:    "absolute",
                  top:         -3,
                  right:       -4,
                  background:  active ? "rgba(255,255,255,.25)" : C.red,
                  color:       "#fff",
                  fontSize:    8,
                  fontFamily:  "'Bebas Neue'",
                  borderRadius: 3,
                  padding:     "0 3px",
                  lineHeight:  "14px",
                  minWidth:    14,
                  textAlign:   "center",
                }}>
                  {p.number}
                </span>
              )}
            </div>

            {/* Player first name */}
            <span style={{
              fontSize:     8.5,
              fontFamily:   "'Rajdhani',sans-serif",
              fontWeight:   700,
              color:        active ? "rgba(255,255,255,.9)" : C.txt,
              letterSpacing: 0.3,
              maxWidth:     60,
              textAlign:    "center",
              lineHeight:   1.2,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {p.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
