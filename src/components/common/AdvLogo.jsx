import { useState, useEffect } from "react";

export default function AdvLogo({ height = 22, style = {} }) {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getImagensDir) {
      window.electronAPI.getImagensDir().then(dir => {
        if (dir) setSrc("local-video:///" + dir.replace(/\\/g, "/") + "/Escudos/adv_logo.png");
      });
    }
  }, []);

  if (src && !err) {
    return (
      <img
        src={src}
        alt="ADV"
        onError={() => setErr(true)}
        style={{ height, width: "auto", objectFit: "contain", flexShrink: 0, ...style }}
      />
    );
  }
  return (
    <span style={{ fontFamily: "'Bebas Neue'", fontSize: height * 0.65, letterSpacing: 1, color: "#555", flexShrink: 0, ...style }}>
      ADV
    </span>
  );
}
