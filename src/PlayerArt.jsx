// A player's render (src/playerArt.js) at a given width. While it's being made the space stays
// empty; `fallback` (his face) only shows when there is no render for him.
import React, { useEffect, useState } from "react";
import { loadArt, artFor, renderArt, artNow } from "./playerArt.js";

// the picture (a URL), false (no art for him) or undefined (still coming)
export function usePlayerArt(p, ab) {
  const [src, setSrc] = useState(() => artNow(p, ab));
  const look = `${ab}|${p?.name}|${p?.num}|${p?.pos}|${p?.face?.espn ?? p?.face?.pid ?? p?.face?.sk ?? ""}`;
  useEffect(() => {
    let live = true; setSrc(artNow(p, ab));
    loadArt().then((m) => { const a = m && artFor(p, ab, m); return a ? renderArt(a, m) : false; }).then((u) => { if (live) setSrc(u || false); });
    return () => { live = false; };
  }, [look]); // eslint-disable-line react-hooks/exhaustive-deps
  return src;
}

// width: px; the picture is 3:4 (helmet to mid-thigh). crop: the share of its height to show.
// A picture already made when the screen opens is simply there; one that arrives later eases in.
export default function PlayerArt({ p, ab, width, crop = 1, fallback = null, style }) {
  const src = usePlayerArt(p, ab);
  const [ready] = useState(() => !!src);
  if (src === false) return fallback;
  if (!src) return <div style={{ width, height: Math.round(width * (4 / 3) * crop), flexShrink: 0, ...style, filter: undefined }} />;   // on its way
  return (
    <div style={{ width, height: Math.round(width * (4 / 3) * crop), overflow: "hidden", flexShrink: 0, ...style }}>
      <img src={src} alt={p.name} draggable="false" style={{ width, height: Math.round(width * 4 / 3), display: "block", animation: ready ? undefined : "artIn .45s ease-out" }} />
      <style>{"@keyframes artIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>
    </div>
  );
}
