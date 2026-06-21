import { SECTORS } from "../constants/sectors";
import { C }       from "../constants/colors";

export const fmt = s => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return String(m) + ":" + String(sec).padStart(2, "0");
};

export const fmtVideo = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0)
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};

export const getMeta = id => {
  for (const s of SECTORS) {
    for (const a of s.actions) {
      if (a.type === "single" && a.id === id)
        return { label: a.label, color: s.color, sector: s };
      if (a.type === "split") {
        if (a.posId === id)
          return { label: `${a.label} ${a.posLabel}`, color: a.posColor || C.posL, sector: s };
        if (a.negId === id)
          return { label: `${a.label} ${a.negLabel}`, color: a.negColor || C.negL, sector: s };
      }
    }
  }
  return { label: id, color: C.txtM, sector: null };
};

export const download = (name, type, content) => {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
