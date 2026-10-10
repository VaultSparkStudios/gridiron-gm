// A concept-art pixel player inside a parent <svg>, standing with his cleats at (x, y).
// height: in the parent's units. Shows nothing until his uniform is painted (a frame or two).
import React, { memo, useEffect, useState } from "react";
import { SPRITES, spriteFor } from "./sprites.js";

function SpritePlayer({ x = 0, y = 0, height = 40, pose = "DB", team, away = false, number = null, facing = "right", skin = null, title, shadow = true }) {
  const meta = SPRITES[pose] || SPRITES.DB;
  const [src, setSrc] = useState(null);
  const tk = team && typeof team === "object" ? team.ab || team.name : team;
  useEffect(() => {
    let on = true;
    spriteFor(pose, team, { away, number, facing, skin }).then((u) => on && setSrc(u)).catch(() => {});
    return () => { on = false; };
  }, [pose, tk, away, number, facing, skin]); // eslint-disable-line react-hooks/exhaustive-deps
  const w = (height * meta.w) / meta.h;
  return (
    <g transform={`translate(${x} ${y})`}>
      {title && <title>{title}</title>}
      {shadow && <ellipse cx="0" cy="-1" rx={w * 0.42} ry={Math.max(2, height * 0.06)} fill="#000" opacity=".28" />}
      {src && <image href={src} x={-w / 2} y={-height} width={w} height={height} preserveAspectRatio="none" style={{ imageRendering: "pixelated" }} />}
    </g>
  );
}
export default memo(SpritePlayer);
