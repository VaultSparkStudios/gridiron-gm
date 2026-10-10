// The live-game field: both teams' starters lined up in formation at the line of scrimmage,
// redrawn (and slid into place) after every play. Offense drives left to right.
import React from "react";
import { depthOrderFor } from "./DepthChart.jsx";
import SpritePlayer from "./pixel/SpritePlayer.jsx";
import { snapPose, celebrationPose, SPRITES as ART } from "./pixel/sprites.js";
import { UNIFORMS, teamKey } from "./teamUniforms.js";

const FORMATION = {
  // [pos, depth index, yards behind (-) / past (+) the line, yards from the middle].
  // Spacing is stretched a little past real life so every player stays readable.
  off: [["LT", 0, -2, -11], ["LG", 0, -2, -5.5], ["C", 0, -2, 0], ["RG", 0, -2, 5.5], ["RT", 0, -2, 11], ["TE", 0, -2.5, 16.5],
    ["WR", 0, -2, -24], ["WR", 1, -2, 24], ["WR", 2, -3.5, -17.5], ["QB", 0, -8, 0], ["RB", 0, -8.5, 5]],
  def: [["DL", 0, 2, -9], ["DL", 1, 2, -3], ["DL", 2, 2, 3], ["DL", 3, 2, 9], ["LB", 0, 7.5, -14], ["LB", 1, 7.5, 0], ["LB", 2, 7.5, 14],
    ["CB", 0, 8, -23.5], ["CB", 1, 8, 23.5], ["S", 0, 15, -9], ["S", 1, 15, 9]],
};
const W = 800, H = 360, EZ = 60;
const xOf = (yard) => EZ + (yard / 100) * (W - 2 * EZ);
const yOf = (lat) => H / 2 + lat * (H / 53.3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A team's healthy starters at each position: the order the game engine is playing (snap
// share first), or the depth chart if none is given.
function starters(team, depth, order) {
  const healthy = (team?.roster || []).filter((p) => !p.injured && !p.holdout && !p.suspended);
  const by = {};
  for (const pos of ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S"]) by[pos] = order ? order(pos) : depthOrderFor(healthy, depth, pos);
  return by;
}

// One player: a pixel-art sprite in his team's uniform, posed for the snap (linemen down in a
// three-point stance, the quarterback with the ball, defenders in a ready stance). After a
// touchdown the scoring team's backs and receivers celebrate. Offense faces right, defense left.
// Pixel-art players are built but switched off until they're approved; circles until then.
const SPRITE_SCALE = 0.25; // every pose drawn at the same pixel size
const SPRITES = typeof location !== "undefined" && /[?&]sprites=1\b/.test(location.search); // off unless ?sprites=1
function Player({ p, pos, x, y, team, side, away, td }) {
  const last = p ? p.name.split(" ").slice(1).join(" ") || p.name : pos;
  if (!SPRITES) return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform .55s ease" }}>
      <title>{p ? `${pos} ${p.name} (${p.ovr})` : pos}</title>
      <circle r="12" fill={team?.clr || "#334155"} stroke={team?.ac || "#fff"} strokeWidth="2.5" />
      <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">{p?.num ?? pos}</text>
      <text y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" stroke="#0008" strokeWidth="2.5" paintOrder="stroke">{last.length > 10 ? `${last.slice(0, 9)}.` : last}</text>
    </g>
  );
  const pose = (side === "off" && td && celebrationPose(pos)) || snapPose(pos, side);
  const hgt = (ART[pose] || ART.DB).h * SPRITE_SCALE;
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform .55s ease" }}>
      <SpritePlayer x={0} y={Math.round(hgt * 0.5)} height={hgt} pose={pose} team={team} away={away} number={p?.num} skin={p?.face?.sk} facing={side === "off" ? "right" : "left"} title={p ? `${pos} ${p.name} (${p.ovr})` : pos} />
    </g>
  );
}

export default function LiveField({ ballYard, toGo, off, def, offHome = true, offDepth, defDepth, offOrder, defOrder, lastPlay }) {
  const los = clamp(ballYard, 1, 99);
  const x0 = xOf(los);
  const o = starters(off, offDepth, offOrder), d = starters(def, defDepth, defOrder);
  // the visitors wear white, unless the home team wears white at home (Dallas): then they wear color
  const home = offHome ? off : def, homeWhite = !!UNIFORMS[teamKey(home)]?.whiteHome;
  const awayFor = (side) => (homeWhite ? false : side === "off" ? !offHome : offHome);
  const place = (side, list, team) =>
    FORMATION[side].map(([pos, i, dx, lat]) => {
      // with sprites, set each line's depth so the two rows of helmets meet evenly over the ball
      if (SPRITES && ["LT", "LG", "C", "RG", "RT"].includes(pos)) dx = -1.5;
      if (SPRITES && pos === "DL") dx = 4.8;
      if (SPRITES && pos === "LB") dx = 9.5;
      if (SPRITES && pos === "RB") lat = 7;
      const x = clamp(xOf(los + dx), 20, W - 20), y = clamp(yOf(lat), SPRITES ? 26 : 22, H - (SPRITES ? 26 : 34));
      return <Player key={`${side}${pos}${i}`} p={list[pos]?.[i]} pos={pos} x={x} y={y} team={team} side={side} away={awayFor(side)} td={!!lastPlay?.td} />;
    });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", borderRadius: 10, maxHeight: "min(46vh, 420px)" }}>
      {[...Array(10)].map((_, i) => <rect key={i} x={xOf(i * 10)} y="0" width={xOf(10) - xOf(0)} height={H} fill={i % 2 ? "#237a30" : "#1f6b2a"} />)}
      <rect x="0" y="0" width={EZ} height={H} fill={off?.clr || "#333"} opacity=".55" />
      <rect x={W - EZ} y="0" width={EZ} height={H} fill={def?.clr || "#333"} opacity=".55" />
      <text x={EZ / 2} y={H / 2} fill="#fff" opacity=".8" fontSize="20" fontWeight="900" textAnchor="middle" transform={`rotate(-90 ${EZ / 2} ${H / 2})`}>{off?.name?.toUpperCase()}</text>
      <text x={W - EZ / 2} y={H / 2} fill="#fff" opacity=".8" fontSize="20" fontWeight="900" textAnchor="middle" transform={`rotate(90 ${W - EZ / 2} ${H / 2})`}>{def?.name?.toUpperCase()}</text>
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
        <g key={y}>
          <line x1={xOf(y)} y1="0" x2={xOf(y)} y2={H} stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" />
          <text x={xOf(y)} y={H - 10} fill="#fff" fillOpacity=".7" fontSize="16" fontWeight="800" textAnchor="middle">{y <= 50 ? y : 100 - y}</text>
        </g>
      ))}
      <line x1={x0} y1="0" x2={x0} y2={H} stroke="#3b82f6" strokeWidth="3" />
      {toGo > 0 && los + toGo < 100 && <line x1={xOf(los + toGo)} y1="0" x2={xOf(los + toGo)} y2={H} stroke="#facc15" strokeWidth="3" />}
      {place("def", d, def)}
      {place("off", o, off)}
      {!SPRITES && <ellipse cx={x0 - 4} cy={H / 2} rx="7" ry="4.5" fill="#8B4513" stroke="#fff" strokeWidth="1" style={{ transition: "cx .55s ease" }} />}
      {lastPlay?.td && <text x={W / 2} y={H / 2 - 40} textAnchor="middle" fill="#facc15" fontSize="54" fontWeight="900" stroke="#000" strokeWidth="3" paintOrder="stroke">TOUCHDOWN!</text>}
      {lastPlay?.type === "int" && <text x={W / 2} y={H / 2 - 40} textAnchor="middle" fill="#ef4444" fontSize="44" fontWeight="900" stroke="#000" strokeWidth="3" paintOrder="stroke">INTERCEPTED!</text>}
    </svg>
  );
}
