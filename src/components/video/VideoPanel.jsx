import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { C }                from "../../constants/colors";
import { getMeta, fmtVideo } from "../../utils/format";

/* ═══════════════════════════════════════════════════════
   VIDEO PANEL  –  player + multi-track timeline
═══════════════════════════════════════════════════════ */

export default function VideoPanel({
  videoRef, videoSrc, setVideoSrc,
  videoCurrent, setVideoCurrent,
  videoDuration, setVideoDuration,
  hist, setHist,
  playbackRate,
}) {
  const fileInputRef = useRef(null);
  const [videoError, setVideoError] = useState(null);

  /* Abre vídeo via dialog Electron (tem caminho real) ou input file (fallback) */
  const handleLoad = async () => {
    if (window.electronAPI) {
      const p = await window.electronAPI.openVideoFile();
      if (!p) return;
      if (videoSrc && videoSrc.startsWith("blob:")) URL.revokeObjectURL(videoSrc);
      setVideoError(null);
      setVideoSrc("local-video:///" + p.replace(/\\/g, "/"));
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoSrc && videoSrc.startsWith("blob:")) URL.revokeObjectURL(videoSrc);
    setVideoSrc(URL.createObjectURL(file));
  };

  const seekTo = (t) => {
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, t);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0, overflow: "hidden" }}>
      <input ref={fileInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleFile} />

      {!videoSrc ? (
        <LoadArea onClick={handleLoad} />
      ) : (
        <>
          {/* ── Video element ───────────────────────────────── */}
          {videoError ? (
            <div style={{ flex: 1, minHeight: 0, borderRadius: 6, background: "#1A1A1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ color: "#E8001C", fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2 }}>ERRO AO CARREGAR VÍDEO</div>
              <div style={{ color: "#888", fontFamily: "'Rajdhani',sans-serif", fontSize: 11, textAlign: "center", maxWidth: 280 }}>{videoError}</div>
              <button onClick={handleLoad} style={{ marginTop: 4, ...smallBtn("#E8001C") }}>TENTAR NOVAMENTE</button>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              style={{ width: "100%", flex: 1, minHeight: 0, borderRadius: 6, background: "#000" }}
              onTimeUpdate={e => setVideoCurrent(e.target.currentTime)}
              onLoadedMetadata={e => {
                setVideoDuration(e.target.duration);
                if (playbackRate && playbackRate !== 1) e.target.playbackRate = playbackRate;
              }}
              onError={e => {
                const code = e.target.error?.code;
                const msgs = { 1: "Carregamento abortado", 2: "Erro de rede", 3: "Erro de decodificação", 4: "Formato não suportado" };
                setVideoError(msgs[code] || `Erro desconhecido (código ${code})`);
              }}
            />
          )}

          {/* ── Scrubber bar ─────────────────────────────────── */}
          <ScrubBar
            videoCurrent={videoCurrent}
            videoDuration={videoDuration}
            hist={hist}
            seekTo={seekTo}
          />

          {/* ── Multi-track timeline ─────────────────────────── */}
          <MultiTrack
            hist={hist}
            setHist={setHist}
            videoRef={videoRef}
            videoDuration={videoDuration}
            videoCurrent={videoCurrent}
            seekTo={seekTo}
          />

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleLoad} style={smallBtn("#111")}>
              TROCAR VÍDEO
            </button>
            {window.electronAPI && (
              <button
                onClick={() => window.electronAPI.openVideoWindow()}
                title="Abrir vídeo em janela separada (segundo monitor)"
                style={smallBtn("#111")}
              >
                ⬝ DESTACAR VÍDEO
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Simple scrubber bar ──────────────────────────────── */
function ScrubBar({ videoCurrent, videoDuration, hist, seekTo }) {
  const events = hist.filter(h => h.videoTime != null);
  return (
    <div
      style={{
        position: "relative", height: 18,
        background: "#DEDEDF", borderRadius: 3,
        border: `1px solid ${C.bdr}`, cursor: "pointer",
      }}
      onClick={e => {
        const r = e.currentTarget.getBoundingClientRect();
        seekTo(((e.clientX - r.left) / r.width) * (videoDuration || 0));
      }}
    >
      {/* Playhead */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: 2,
        background: C.red, pointerEvents: "none", zIndex: 5,
        left: pct(videoCurrent, videoDuration) + "%",
        transform: "translateX(-50%)",
      }} />
      {/* Markers */}
      {events.map(h => {
        const meta = getMeta(h.actId);
        return (
          <div key={h.id} title={`${meta.label} ${fmtVideo(h.videoTime)}`}
            onClick={e => { e.stopPropagation(); seekTo(h.videoTime); }}
            style={{
              position: "absolute", top: 2, bottom: 2, width: 3, borderRadius: 1,
              background: meta.color, cursor: "pointer",
              left: pct(h.videoTime, videoDuration) + "%",
              transform: "translateX(-50%)", zIndex: 4,
            }}
          />
        );
      })}
      {/* Time label */}
      <div style={{
        position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
        fontSize: 8, color: C.txtM, fontFamily: "monospace", pointerEvents: "none",
      }}>
        {fmtVideo(videoCurrent)} / {fmtVideo(videoDuration)}
      </div>
    </div>
  );
}

/* ── Multi-track timeline ────────────────────────────── */
function MultiTrack({ hist, setHist, videoRef, videoDuration, videoCurrent, seekTo }) {
  const [selected,  setSelected]  = useState(null);
  const [dragState, setDragState] = useState(null); // {id, type:"move"|"left"|"right", startX, startTime}
  const trackRef = useRef({});

  /* Group events by player track */
  const tracks = useMemo(() => {
    const map = new Map();
    hist.forEach(h => {
      if (h.videoTime == null) return;
      const key = h.num ? `#${h.num} ${h.player.split(" ")[0]}` : h.player;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    });
    return [...map.entries()];
  }, [hist]);

  /* Mutate a single history event — hooks always called before any return */
  const updateEvt = useCallback((id, patch) => {
    setHist(p => p.map(h => h.id === id ? { ...h, ...patch } : h));
  }, [setHist]);

  const deleteEvt = useCallback((id) => {
    setHist(p => p.filter(h => h.id !== id));
    setSelected(s => s === id ? null : s);
  }, [setHist]);

  /* Drag: calculate new time from pixel offset */
  const handleMouseMove = useCallback((e, trackKey) => {
    if (!dragState) return;
    const el = trackRef.current[trackKey];
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newT  = Math.max(0, Math.min(videoDuration || 0, ratio * (videoDuration || 0)));

    if (dragState.type === "move") {
      const dur = (hist.find(h => h.id === dragState.id)?.videoEndTime ?? null);
      const dur2 = dur != null ? dur - (hist.find(h => h.id === dragState.id)?.videoTime ?? 0) : null;
      updateEvt(dragState.id, {
        videoTime:    newT,
        videoEndTime: dur2 != null ? newT + dur2 : null,
      });
    } else if (dragState.type === "left") {
      const h = hist.find(x => x.id === dragState.id);
      if (h && newT < (h.videoEndTime ?? videoDuration)) {
        updateEvt(dragState.id, { videoTime: newT });
      }
    } else if (dragState.type === "right") {
      const h = hist.find(x => x.id === dragState.id);
      if (h && newT > h.videoTime) {
        updateEvt(dragState.id, { videoEndTime: newT });
      }
    }
  }, [dragState, hist, videoDuration, updateEvt]);

  const stopDrag = useCallback(() => setDragState(null), []);

  const selEvt = selected ? hist.find(h => h.id === selected) : null;

  if (tracks.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontSize: 9, color: C.txtM, fontFamily: "'Bebas Neue'",
        letterSpacing: 2, marginBottom: 2,
      }}>
        LINHA DO TEMPO POR JOGADOR
      </div>

      {tracks.map(([trackKey, events]) => (
        <div
          key={trackKey}
          style={{ display: "flex", gap: 4, alignItems: "center" }}
          onMouseMove={e => handleMouseMove(e, trackKey)}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          {/* Track label */}
          <span style={{
            width: 72, flexShrink: 0,
            fontSize: 9, fontFamily: "'Rajdhani',sans-serif",
            fontWeight: 700, color: C.txtM,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {trackKey}
          </span>

          {/* Track bar */}
          <div
            ref={el => trackRef.current[trackKey] = el}
            style={{
              flex: 1, height: 24, background: "#EBEBEB",
              border: `1px solid ${C.bdr}`, borderRadius: 3,
              position: "relative", cursor: "pointer",
            }}
            onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - r.left) / r.width) * (videoDuration || 0));
            }}
          >
            {/* Playhead on this track */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, width: 1,
              background: `${C.red}88`, pointerEvents: "none", zIndex: 2,
              left: pct(videoCurrent, videoDuration) + "%",
            }} />

            {events.map(h => {
              const meta     = getMeta(h.actId);
              const startPct = pct(h.videoTime, videoDuration);
              const endT     = h.videoEndTime ?? (h.videoTime + (videoDuration > 0 ? videoDuration * 0.012 : 1));
              const endPct   = pct(endT, videoDuration);
              const width    = Math.max(endPct - startPct, 1.4);
              const isSel    = selected === h.id;

              return (
                <div
                  key={h.id}
                  onClick={e => { e.stopPropagation(); setSelected(isSel ? null : h.id); seekTo(h.videoTime); }}
                  onMouseDown={e => { e.stopPropagation(); setDragState({ id: h.id, type: "move" }); setSelected(h.id); }}
                  title={`${meta.label} — ${fmtVideo(h.videoTime)}`}
                  style={{
                    position: "absolute",
                    left:     startPct + "%",
                    width:    width + "%",
                    top: 2, bottom: 2,
                    background: meta.color,
                    borderRadius: 2, zIndex: isSel ? 10 : 3,
                    cursor: "grab",
                    border: isSel ? `2px solid #1A1A1A` : `1px solid ${meta.color}`,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    minWidth: 6,
                  }}
                >
                  {/* Left resize handle */}
                  <div
                    style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
                      cursor: "w-resize", zIndex: 12,
                      background: "rgba(0,0,0,.18)",
                    }}
                    onMouseDown={e => { e.stopPropagation(); setDragState({ id: h.id, type: "left" }); }}
                  />
                  {/* Right resize handle */}
                  <div
                    style={{
                      position: "absolute", right: 0, top: 0, bottom: 0, width: 6,
                      cursor: "e-resize", zIndex: 12,
                      background: "rgba(0,0,0,.18)",
                    }}
                    onMouseDown={e => { e.stopPropagation(); setDragState({ id: h.id, type: "right" }); }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected event controls */}
      {selEvt && (() => {
        const meta = getMeta(selEvt.actId);
        return (
          <div style={{
            background: "#F8F8F8", border: `1px solid ${C.bdr}`,
            borderRadius: 5, padding: "6px 8px",
            display: "flex", alignItems: "center",
            gap: 6, flexWrap: "wrap",
            marginTop: 2,
          }}>
            <span style={{
              fontFamily: "'Bebas Neue'", fontSize: 11,
              color: meta.color, letterSpacing: 1, flexShrink: 0,
            }}>
              {meta.label}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtM, flexShrink: 0 }}>
              {fmtVideo(selEvt.videoTime)}{selEvt.videoEndTime ? ` → ${fmtVideo(selEvt.videoEndTime)}` : ""}
            </span>

            {/* MOVER: set start to current playhead */}
            <button title="Mover início para posição atual do vídeo"
              onClick={() => {
                const cur = videoRef.current?.currentTime ?? selEvt.videoTime;
                const dur = selEvt.videoEndTime != null ? selEvt.videoEndTime - selEvt.videoTime : null;
                updateEvt(selected, { videoTime: cur, videoEndTime: dur != null ? cur + dur : null });
              }}
              style={smallBtn(C.blue)}>MOVER</button>

            {/* MARCAR FIM: set end to current playhead */}
            <button title="Marcar fim na posição atual do vídeo"
              onClick={() => updateEvt(selected, { videoEndTime: videoRef.current?.currentTime ?? selEvt.videoTime })}
              style={smallBtn("#059669")}>MARCAR FIM</button>

            {/* AUMENTAR: extend end by 1s */}
            <button title="Aumentar duração +1s"
              onClick={() => updateEvt(selected, {
                videoEndTime: (selEvt.videoEndTime ?? selEvt.videoTime + 1) + 1
              })}
              style={smallBtn("#B45309")}>+1s</button>

            {/* DIMINUIR: shrink end by 1s */}
            <button title="Diminuir duração −1s"
              onClick={() => {
                const newEnd = (selEvt.videoEndTime ?? selEvt.videoTime + 2) - 1;
                if (newEnd > selEvt.videoTime)
                  updateEvt(selected, { videoEndTime: newEnd });
              }}
              style={smallBtn("#B45309")}>−1s</button>

            {/* RECORTAR: set start to playhead (trims left side) */}
            <button title="Recortar: mover início para aqui"
              onClick={() => {
                const cur = videoRef.current?.currentTime ?? selEvt.videoTime;
                if (cur < (selEvt.videoEndTime ?? Infinity))
                  updateEvt(selected, { videoTime: cur });
              }}
              style={smallBtn("#7C3AED")}>RECORTAR</button>

            {/* EXCLUIR */}
            <button onClick={() => deleteEvt(selected)} style={smallBtn(C.negL)}>EXCLUIR</button>

            <button onClick={() => setSelected(null)} style={{ ...smallBtn(C.txtM), marginLeft: "auto" }}>×</button>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────── */
function pct(t, dur) {
  if (!dur || dur <= 0) return 0;
  return Math.max(0, Math.min(100, (t / dur) * 100));
}

function LoadArea({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px dashed ${C.bdr2}`, borderRadius: 8,
        padding: "20px 12px", textAlign: "center",
        cursor: "pointer", background: "#FAFAFA",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#F0F0F0"}
      onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
    >
      <div style={{ fontSize: 13, fontFamily: "'Bebas Neue'", letterSpacing: 2, color: C.txtM }}>
        CARREGAR VÍDEO
      </div>
      <div style={{ fontSize: 10, color: C.bdr2, fontFamily: "'Rajdhani',sans-serif", marginTop: 4 }}>
        MP4 · MOV · AVI · MKV
      </div>
    </div>
  );
}

function smallBtn(color) {
  return {
    background: `${color}12`, border: `1px solid ${color}55`,
    color, borderRadius: 3, padding: "2px 7px",
    fontFamily: "'Bebas Neue'", fontSize: 10,
    letterSpacing: 1, cursor: "pointer", flexShrink: 0,
  };
}
