// The live-game field: both teams' starters lined up in formation at the line of scrimmage,
// redrawn (and slid into place) after every play. Offense drives left to right.
import React, { useEffect, useRef, useState } from "react";
import LivePlay from "./LivePlay.jsx";
import { calloutOf } from "./callout.js";
import { depthOrderFor } from "./DepthChart.jsx";
import TeamSprite, { hasTeamSprites, teamSpriteHeight } from "./pixel/TeamSprite.jsx";
import { UNIFORMS, teamKey, uniformFor } from "./teamUniforms.js";
import { logoUrl } from "./ui.jsx";
import lombardiArt from "./assets/lombardi.webp";
import { MOBILE } from "./mobile.js";
import { wxOf } from "./weather.js";
import { themeOf } from "./holidays.js";

const FORMATION = {
  // [pos, depth index, yards behind (-) / past (+) the line, yards from the middle].
  // Spacing is stretched a little past real life so every player stays readable.
  off: [["LT", 0, -2, -11], ["LG", 0, -2, -5.5], ["C", 0, -2, 0], ["RG", 0, -2, 5.5], ["RT", 0, -2, 11], ["TE", 0, -2.5, 16.5],
    ["WR", 0, -2, -24], ["WR", 1, -2, 24], ["WR", 2, -3.5, -17.5], ["QB", 0, -8, 0], ["RB", 0, -8.5, 5]],
  def: [["DL", 0, 2, -9], ["DL", 1, 2, -3], ["DL", 2, 2, 3], ["DL", 3, 2, 9], ["LB", 0, 7.5, 14], ["LB", 1, 7.5, 0], ["LB", 2, 7.5, -14],
    // SAM (LB 0) on the tight end's side; the free safety (S 0) deep in the middle, the strong
    // safety (S 1) rolled down on the strong side
    ["CB", 0, 8, -23.5], ["CB", 1, 8, 23.5], ["S", 0, 15, -3], ["S", 1, 11, 10]],
};
// Special teams, for a kick acted out: the field goal unit (snapper, holder seven yards back, kicker
// beside him, wings on the ends) and the punt unit (gunners split wide, a personal protector, the
// punter fifteen back). On a punt the deep safety is the returner, set back where the ball's headed.
const SPECIAL = {
  fg: {
    off: [["LT", 0, -1.5, -11], ["LG", 0, -1.5, -5.5], ["C", 0, -1.5, 0], ["RG", 0, -1.5, 5.5], ["RT", 0, -1.5, 11], ["TE", 0, -2, 15.5], ["TE", 1, -2, -15.5], ["WR", 0, -3, 19], ["WR", 1, -3, -19], ["P", 0, -8, 0.6], ["K", 0, -11, -3.5]],
    def: FORMATION.def,
  },
  // the kickoff: the kicker back at the tee with five cover men either side on the line; the return
  // team's front five ten yards off, three more behind them, the two up-backs and the returner deep.
  // Skill players and linebackers only, so everyone's upright.
  ko: {
    off: [["K", 0, -7, 0], ["LB", 0, -1, -4], ["LB", 1, -1, 4], ["LB", 2, -1, -10], ["WR", 2, -1, 10], ["S", 0, -1, -16], ["S", 1, -1, 16], ["CB", 0, -1, -22], ["CB", 1, -1, 22], ["WR", 3, -1, -19], ["TE", 1, -1, 19]],
    def: [["LB", 0, 11, -14], ["LB", 1, 11, -5], ["LB", 2, 11, 5], ["CB", 0, 11, 14], ["CB", 1, 22, -10], ["S", 1, 22, 0], ["WR", 0, 22, 10], ["WR", 1, 30, -6], ["RB", 0, 44, -4], ["RB", 1, 44, 4], ["S", 0, "RET", 0]],
  },
  punt: {
    off: [["LT", 0, -1.5, -11], ["LG", 0, -1.5, -5.5], ["C", 0, -1.5, 0], ["RG", 0, -1.5, 5.5], ["RT", 0, -1.5, 11], ["TE", 0, -2, 15.5], ["TE", 1, -2, -15.5], ["WR", 0, -1.5, 22], ["WR", 1, -1.5, -22], ["RB", 0, -6, 1.5], ["P", 0, -15, 0]],
    def: FORMATION.def.map(([pos, i, dx, lat]) => (pos === "S" && i === 0 ? ["S", 0, "RET", 0] : pos === "CB" ? [pos, i, 2, lat < 0 ? -22 : 22] : [pos, i, dx, lat])),
  },
};
const W = 800, H = 360, EZ = 60;
const xOf = (yard) => EZ + (yard / 100) * (W - 2 * EZ);
const yOf = (lat) => H / 2 + lat * (H / 53.3);

// Weather on the field (weather.js): snow settles over the grass (more in heavy snow, trampled
// down the middle), rain darkens it with mud between the hashes and puddles, and rain or snow falls
// over the whole field. Positions come from a fixed sequence so nothing jumps between plays.
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const WX_CSS = `@keyframes lfRain { from { transform: translate(0, -30px) } to { transform: translate(-36px, ${H + 30}px) } }
@keyframes lfPour { from { transform: translate(0, -40px) } to { transform: translate(-90px, ${H + 40}px) } }
@keyframes lfSnow { 0% { transform: translate(0, -10px) } 50% { transform: translate(10px, ${H / 2}px) } 100% { transform: translate(-6px, ${H + 10}px) } }
@keyframes lfBlizzard { 0% { transform: translate(0, -10px) } 50% { transform: translate(-70px, ${H / 2}px) } 100% { transform: translate(-150px, ${H + 10}px) } }
@keyframes lfSplash { 0%, 70% { transform: scale(.1); opacity: 0 } 75% { opacity: .7 } 100% { transform: scale(1); opacity: 0 } }
@keyframes lfGust { 0%,100% { opacity: .14 } 50% { opacity: .26 } }
@media (prefers-reduced-motion: reduce) { .lf-fall * { animation: none !important } }`;
// The ground under rain and snow: illustrated overlays (public/weather/, one per condition) laid
// over the turf with the field's own geometry, under the paint, the players and the falling weather.
const BASE = import.meta.env?.BASE_URL ?? "/";
// where each overlay sits on the field, [x, y, width, height]: full field unless the art was drawn
// on a tighter canvas (heavy snow: its cleared lanes measured against the yard numbers)
const PLACE = { heavySnow: [-12.7, -46.4, 825, 456], lightSnow: [-12.7, -46.4, 825, 456] };
function Ground({ wx, kind }) {
  if (!wx.rain && !wx.snow) return null;
  return (
    <g pointerEvents="none" clipPath="url(#lf-wxclip)">
      <defs><clipPath id="lf-wxclip"><rect x="0" y="0" width={W} height={H} rx="9" /></clipPath></defs>
      {/* rain darkens the whole field a touch: wet grass */}
      {wx.rain && <rect x="0" y="0" width={W} height={H} fill="#041008" opacity={wx.rain === 2 ? 0.24 : 0.14} />}
      {(() => { const [x, y, w, h] = PLACE[kind] || [0, 0, W, H]; return <image href={`${BASE}weather/${kind}.webp`} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />; })()}
    </g>
  );
}
// Holiday touches on the field: Christmas lights strung down both sidelines, a Halloween dusk with
// glowing jack-o'-lanterns at the pylons, autumn leaves blown onto the Thanksgiving sidelines.
const HOL_CSS = `@keyframes lfTw { 0%,100% { opacity: 1 } 50% { opacity: .3 } } @keyframes lfFlick { 0%,100% { opacity: .9 } 40% { opacity: .55 } 70% { opacity: 1 } }`;
function HolidayDecor({ holiday: hk }) {
  // New Year's Eve and Day share one look
  const holiday = themeOf(hk);
  if (holiday === "newyear") return (
    <g pointerEvents="none"><style>{HOL_CSS}</style>
      {/* gold and silver sequins down both sidelines, confetti scattered in the end zones */}
      {[4, H - 4].map((y) => [...Array(40)].map((_, i) => { const c = ["#fbbf24", "#e5e7eb", "#fde68a", "#cbd5e1"][i % 4]; return <g key={`${y}-${i}`} style={{ animation: `lfTw ${0.8 + (i % 4) * 0.3}s ${-(i % 6) * 0.2}s ease-in-out infinite` }}><circle cx={10 + i * ((W - 20) / 39)} cy={y} r="2" fill={c} /><circle cx={10 + i * ((W - 20) / 39)} cy={y} r="5" fill={c} opacity=".3" /></g>; }))}
      {[...Array(28)].map((_, i) => { const x = i < 14 ? 6 + rnd(i, 51) * (EZ - 12) : W - EZ + 6 + rnd(i, 51) * (EZ - 12), y = 14 + rnd(i, 52) * (H - 28); return <rect key={`c${i}`} x={x} y={y} width="3.5" height="6" rx=".8" fill={["#fbbf24", "#e5e7eb", "#fde68a", "#94a3b8"][i % 4]} opacity=".85" transform={`rotate(${rnd(i, 53) * 360} ${x} ${y})`} />; })}
    </g>
  );
  if (holiday === "christmas") return (
    <g pointerEvents="none"><style>{HOL_CSS}</style>
      {[4, H - 4].map((y) => [...Array(32)].map((_, i) => { const c = ["#ef4444", "#22c55e", "#facc15", "#3b82f6"][i % 4]; return <g key={`${y}-${i}`} style={{ animation: `lfTw ${1.2 + (i % 3) * 0.4}s ${-(i % 5) * 0.25}s ease-in-out infinite` }}><circle cx={12 + i * ((W - 24) / 31)} cy={y} r="2.6" fill={c} /><circle cx={12 + i * ((W - 24) / 31)} cy={y} r="6" fill={c} opacity=".3" /></g>; }))}
    </g>
  );
  if (holiday === "halloween") return (
    <g pointerEvents="none"><style>{HOL_CSS}</style>
      <rect x="0" y="0" width={W} height={H} fill="#2e1065" opacity=".22" />
      {[[EZ, 14], [EZ, H - 6], [W - EZ, 14], [W - EZ, H - 6]].map(([x, y], i) => <g key={i} style={{ animation: `lfFlick ${1.6 + i * 0.3}s ease-in-out infinite` }}><circle cx={x} cy={y - 6} r="16" fill="#f97316" opacity=".3" /><ellipse cx={x} cy={y - 6} rx="8" ry="6.5" fill="#f97316" /><rect x={x - 1.2} y={y - 15} width="2.4" height="4" rx="1" fill="#4d7c0f" /></g>)}
    </g>
  );
  if (holiday === "thanksgiving") return (
    <g pointerEvents="none">
      {[...Array(18)].map((_, i) => { const x = 10 + rnd(i, 21) * (W - 20), y = i % 2 ? 12 + rnd(i, 22) * 8 : H - 4 - rnd(i, 22) * 8, s = 3 + rnd(i, 23) * 2.5; return <ellipse key={i} cx={x} cy={y} rx={s} ry={s * 0.55} fill={["#c2410c", "#d97706", "#92400e"][i % 3]} transform={`rotate(${rnd(i, 24) * 360} ${x} ${y})`} opacity=".85" />; })}
    </g>
  );
  return null;
}
// What's falling matches the ground: light rain a fine drizzle, heavy rain a slanting downpour
// with splashes on the turf; light snow gentle flurries, heavy snow a wind-driven blizzard with
// the far side of the field half lost in white.
function Falling({ wx }) {
  if (!wx.rain && !wx.snow) return null;
  const heavy = (wx.rain || wx.snow) === 2;
  if (wx.rain) {
    const n = heavy ? 300 : 45;
    return (
      <g className="lf-fall" pointerEvents="none">
        <style>{WX_CSS}</style>
        {heavy && <rect x="0" y="0" width={W} height={H} fill="#94a3b8" style={{ animation: "lfGust 3s ease-in-out infinite" }} />}
        {[...Array(n)].map((_, i) => {
          const x = rnd(i, 11) * (W + (heavy ? 110 : 40)), dur = heavy ? 0.32 + rnd(i, 12) * 0.2 : 0.7 + rnd(i, 12) * 0.4, delay = -rnd(i, 13) * dur;
          return heavy
            ? <line key={i} x1={x} y1="0" x2={x - 9} y2={22 + rnd(i, 14) * 16} stroke="#e2e8f0" strokeOpacity={0.4 + rnd(i, 15) * 0.4} strokeWidth={1.2 + rnd(i, 16) * 0.8} style={{ animation: `lfPour ${dur}s ${delay}s linear infinite` }} />
            : <line key={i} x1={x} y1="0" x2={x - 2} y2={6 + rnd(i, 14) * 5} stroke="#e2e8f0" strokeOpacity={0.3 + rnd(i, 15) * 0.25} strokeWidth=".9" style={{ animation: `lfRain ${dur}s ${delay}s linear infinite` }} />;
        })}
        {/* splashes where it lands */}
        {heavy && [...Array(28)].map((_, i) => { const dur = 0.9 + rnd(i, 61) * 0.7; return <ellipse key={`sp${i}`} cx={rnd(i, 62) * W} cy={rnd(i, 63) * H} rx="7" ry="2.6" fill="none" stroke="#e2e8f0" strokeWidth="1" style={{ transformBox: "fill-box", transformOrigin: "center", animation: `lfSplash ${dur}s ${-rnd(i, 64) * dur}s ease-out infinite` }} />; })}
      </g>
    );
  }
  const n = heavy ? 320 : 70;
  return (
    <g className="lf-fall" pointerEvents="none">
      <style>{WX_CSS}</style>
      {heavy && <rect x="0" y="0" width={W} height={H} fill="#f1f5f9" style={{ animation: "lfGust 4s ease-in-out infinite" }} />}
      {[...Array(n)].map((_, i) => {
        const big = i % 6 === 0, x = rnd(i, 11) * (W + (heavy ? 160 : 20)), dur = heavy ? 1.8 + rnd(i, 12) * 1.6 : 5 + rnd(i, 12) * 4, delay = -rnd(i, 13) * dur;
        const r = heavy ? (big ? 3.2 + rnd(i, 14) * 2.4 : 1.2 + rnd(i, 14) * 1.8) : big ? 2.2 + rnd(i, 14) * 1.2 : 0.9 + rnd(i, 14) * 1.2;
        return <circle key={i} cx={x} cy="0" r={r} fill="#fff" opacity={big ? 0.6 : 0.7 + rnd(i, 15) * 0.25} style={{ animation: `${heavy ? "lfBlizzard" : "lfSnow"} ${dur}s ${delay}s linear infinite`, filter: big ? "blur(1.1px)" : undefined }} />;
      })}
    </g>
  );
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A team's healthy starters at each position: the order the game engine is playing (snap
// share first), or the depth chart if none is given.
function starters(team, depth, order) {
  const healthy = (team?.roster || []).filter((p) => !p.injured && !p.holdout && !p.suspended);
  const by = {};
  for (const pos of ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"]) by[pos] = order ? order(pos) : depthOrderFor(healthy, depth, pos);
  return by;
}

// One player: a pixel-art sprite in his team's uniform, posed for the snap (linemen down in a
// three-point stance, the quarterback with the ball, defenders in a ready stance). After a
// touchdown the scoring team's backs and receivers celebrate. Offense faces right, defense left.
// The old numbered circles are still there behind ?sprites=0.
const SPRITES = !(typeof location !== "undefined" && /[?&]sprites=0\b/.test(location.search));
const uni = (team, away) => uniformFor(team, { away });
const SHOW_NAME = { off: new Set(["QB", "RB", "WR", "TE"]), def: new Set(MOBILE ? [] : ["CB", "S"]) };
function Player({ p, pos, x, y, team, side, away }) {
  const last = p ? p.name.split(" ").slice(1).join(" ") || p.name : pos;
  if (!SPRITES || !hasTeamSprites(team)) return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform .55s ease" }}>
      <title>{p ? `${pos} ${p.name} (${p.ovr})` : pos}</title>
      {/* the jersey (home color or road white), ringed in the helmet color, number in the club's number color */}
      <ellipse cx="1.5" cy="3" rx="11" ry="10" fill="#000" opacity=".28" />
      <circle r="10.5" fill={uni(team, away).jersey} stroke={uni(team, away).helmet} strokeWidth="2.6" />
      <circle r="7.9" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1" />
      <text y="4" textAnchor="middle" fontSize="11" fontWeight="900" fill={uni(team, away).number} stroke={uni(team, away).numberEdge} strokeWidth=".9" paintOrder="stroke">{p?.num ?? pos}</text>
      {/* names only where they help (the ball handlers and receivers, and on desktop the secondary
          covering them); linemen are just numbers so the fronts don't turn into a pile of text.
          Names hang away from the line of scrimmage so the two sides never overlap. */}
      {SHOW_NAME[side].has(pos) && <text x={side === "off" ? 8 : -8} y="21" textAnchor={side === "off" ? "end" : "start"} fontSize="8.5" fontWeight="700" fill="#fff" stroke="#0009" strokeWidth="2.5" paintOrder="stroke">{last.length > 10 ? `${last.slice(0, 9)}.` : last}</text>}
    </g>
  );
  // the club's own sprite sheet (every club has one)
  const h = teamSpriteHeight(team, pos);
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform .55s ease" }}>
      <TeamSprite y={Math.round(h * 0.5)} team={team} pos={pos} away={away} facing={side === "off" ? "right" : "left"} title={p ? `${pos} ${p.name} (${p.ovr})` : pos} />
    </g>
  );
}

// sb: the Super Bowl's name ("Super Bowl LXI") on a neutral field: pinstriped end zones in each
// club's color framed in gold, a gold medallion at midfield with the trophy, the game's name and the
// host city (sbCity), each club's logo at its own 25, and gold trim around the field.
function Callout({ play, W, H }) {
  const c = calloutOf(play);
  if (!c) return null;
  const big = c.t.length > 12 ? 40 : 52, w = Math.max(c.t.length * big * 0.62, (c.s || "").length * 11) + 60;
  return (
    <g pointerEvents="none" style={{ animation: "lfCallout .45s ease-out" }}>
      <style>{"@keyframes lfCallout { 0% { opacity: 0; transform: scale(.85); transform-origin: center } 100% { opacity: 1; transform: none } }"}</style>
      <rect x={W / 2 - w / 2} y={H / 2 - 92} width={w} height={c.s ? 104 : 78} rx="14" fill="#060b18" fillOpacity=".82" stroke={c.c} strokeWidth="3" />
      <text x={W / 2} y={H / 2 - 92 + big + 8} textAnchor="middle" fill={c.c} fontSize={big} fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif">{c.t}</text>
      {c.s && <text x={W / 2} y={H / 2 - 92 + big + 36} textAnchor="middle" fill="#e2e8f0" fontSize="17" fontWeight="700" fontFamily="system-ui">{c.s}</text>}
    </g>
  );
}

// The KEY PLAY banner and the result card over the field (HTML, so they stay readable on a phone),
// sized to the field (cqw) so they cover the same share of it on any screen.
const LP_CSS = `.lp-banner { position: absolute; left: 50%; top: 14%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 22px 9px; border-radius: 12px; background: linear-gradient(180deg, #111a30f0, #060b18f0); border: 2px solid #facc15; box-shadow: 0 10px 30px #000a; pointer-events: none; animation: lpIn .3s ease-out both; white-space: nowrap; }
.lp-banner b { font: 900 clamp(13px, 2.9cqw, 26px)/1 'Arial Black', Arial, sans-serif; color: #facc15; letter-spacing: 2px; }
.lp-banner span { font: 800 clamp(10px, 1.7cqw, 15px)/1.2 system-ui; color: #e2e8f0; letter-spacing: .5px; }
.lp-card { position: absolute; left: 50%; bottom: 6%; transform: translateX(-50%); width: max-content; max-width: 92%; text-align: center; padding: clamp(5px, 1.1cqw, 10px) clamp(10px, 2.8cqw, 26px) clamp(6px, 1.3cqw, 12px); border-radius: 14px; background: linear-gradient(180deg, #0b1222f2, #060b18f2); border: 2px solid var(--lp-c); box-shadow: 0 12px 32px #000b, 0 0 24px color-mix(in srgb, var(--lp-c) 35%, transparent); pointer-events: none; animation: lpPop .35s cubic-bezier(.2, 1.4, .4, 1) both; }
.lp-gold { --lp-c: #facc15; } .lp-red { --lp-c: #ef4444; } .lp-green { --lp-c: #22c55e; } .lp-grey { --lp-c: #94a3b8; }
.lp-mine { border-color: var(--lp-team); }
.lp-head { font: 900 clamp(14px, 3.3cqw, 30px)/1.05 'Arial Black', Arial, sans-serif; color: var(--lp-c); letter-spacing: 1px; }
.lp-line { font: 800 clamp(10px, 1.9cqw, 17px)/1.3 system-ui; color: #fff; margin-top: 3px; }
.lp-note { font: 700 clamp(9px, 1.45cqw, 13px)/1.3 system-ui; color: #fde68a; margin-top: 2px; }
.lp-chip { display: inline-block; font: 900 clamp(8px, 1.2cqw, 11px)/1 system-ui; letter-spacing: 1.4px; color: #fff; background: var(--lp-team); padding: 3px 8px; border-radius: 99px; margin-bottom: 4px; }
.lp-strip { position: absolute; left: 50%; bottom: 5%; transform: translateX(-50%); max-width: 92%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 800 clamp(10px, 1.7cqw, 15px)/1 system-ui; color: #fff; background: #060b18d9; border: 1px solid #ffffff2a; padding: 7px 14px; border-radius: 99px; pointer-events: none; animation: lpIn .25s ease-out both; }
@keyframes lpIn { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes lpPop { from { opacity: 0; transform: translate(-50%, 10px) scale(.85); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }`;

// How wide the field may get (it keeps its shape, so this caps its height to fit the screen).
// A frame around it (HolidayFrame) takes the same cap, so it hugs the field; --live-frame is how
// much taller the frame makes it. big: the caption and the buttons sit beside the field, not under it.
export const fieldMaxW = (big) => `calc(${MOBILE ? "min(56vh, 100%)" : `min(calc((var(--vh, 100vh) - ${big ? 300 : 470}px - var(--live-extra, 0px)) / var(--live-frame, 1)), ${big ? 820 : 560}px)`} * ${W / H})`;

// anim: a play to act out ({ ev, key, id, card }, livePlays.js), with animSpeed (1 normal) and
// onAnimDone when it's over (a tap on the field skips it); paused holds it where it is.
// The plays that follow a score (the extra point, the kickoff) are acted out after the score has gone
// in, when the ball already belongs to the other side: the field puts the team that has the ball
// on that play (anim.ev.offAb, or the kicking team, kickAb) back on offense for it.
export default function LiveField(props) {
  const { anim, off, def } = props;
  const want = anim?.ev?.offAb || anim?.ev?.kickAb;
  if (want && off?.ab !== want && def?.ab === want) {
    return <LiveFieldView {...props} off={def} def={off} offHome={!props.offHome} offDepth={props.defDepth} defDepth={props.offDepth} offOrder={props.defOrder} defOrder={props.offOrder} />;
  }
  return <LiveFieldView {...props} />;
}
function LiveFieldView({ ballYard, toGo, off, def, offHome = true, offDepth, defDepth, offOrder, defOrder, lastPlay, sb, sbCity, night, wx, holiday, tall, anim, animSpeed = 1, paused = false, onAnimDone, camMode = "Action" }) {
  const cam = useRef(null);
  const [phase, setPhase] = useState(null);
  useEffect(() => {
    setPhase(null);
    // the play's over: ease the camera back out to the whole field
    if (!anim && cam.current) { cam.current.style.transition = "transform .6s ease"; cam.current.style.transform = "none"; }
  }, [anim?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const W8 = wxOf(wx);
  // a kickoff goes from the kicking team's 35, wherever the scoring play ended
  const los = anim?.ev?.k === "ko" ? 35 : anim?.ev?.offAb ? anim.ev.yard : clamp(ballYard, 1, 99);
  const x0 = xOf(los);
  const o = starters(off, offDepth, offOrder), d = starters(def, defDepth, defOrder);
  // the visitors wear white, unless the home team wears white at home (Dallas): then they wear color
  const home = offHome ? off : def, homeWhite = !!UNIFORMS[teamKey(home)]?.whiteHome;
  const awayFor = (side) => (homeWhite ? false : side === "off" ? !offHome : offHome);
  const slots = [];
  const st = anim && SPECIAL[anim.ev?.k] ? anim.ev.k : null, FORM = st ? SPECIAL[st] : FORMATION;
  const place = (side, list, team) =>
    FORM[side].map(([pos, i, dx, lat]) => {
      // with sprites, set each line's depth so the two rows of helmets meet evenly over the ball
      if (SPRITES && st !== "ko" && ["LT", "LG", "C", "RG", "RT"].includes(pos)) dx = -1.5;
      if (SPRITES && st !== "ko" && pos === "DL") dx = 4.8;
      if (SPRITES && st !== "ko" && pos === "LB") dx = 9.5;
      if (SPRITES && pos === "RB" && !st) lat = 7;
      // the punt returner waits about where it's coming down
      if (dx === "RET") dx = anim.ev.k === "ko" ? clamp(100 - (anim.ev.catchAt ?? 3) - los - 1, 50, 66) : clamp(Math.min(anim.ev.gross || 42, 100 - los + 4) - 4, 25, 48);
      const x = clamp(xOf(los + dx), 20, W - 20), y = clamp(yOf(lat), SPRITES ? 26 : 22, H - (SPRITES ? 26 : 34));
      const p = list[pos]?.[i];
      // the same spot in yards, for a play acted out (playScript.js)
      slots.push({ key: `${side}${pos}${i}`, side, pos, p, id: p?.id, team, away: awayFor(side), x: (x - EZ) / ((W - 2 * EZ) / 100), y: (y - H / 2) / (H / 53.3) });
      return <Player key={`${side}${pos}${i}`} p={p} pos={pos} x={x} y={y} team={team} side={side} away={awayFor(side)} />;
    });
  const defMen = place("def", d, def), offMen = place("off", o, off);
  const card = anim?.card;
  return (
    <div style={{ position: "relative", maxWidth: fieldMaxW(tall), width: "100%", margin: "0 auto", containerType: "inline-size" }} onClick={anim ? () => onAnimDone?.() : undefined}>
    <style>{LP_CSS}</style>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", borderRadius: 10 }}>
      <defs>
        {/* turf grain: fine noise over the grass */}
        <filter id="lf-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 -.2" />
        </filter>
        <linearGradient id="lf-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".18" /><stop offset=".25" stopColor="#000" stopOpacity="0" />
          <stop offset=".75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        {/* a night game: the stadium lights throw four pools of light onto a darker field */}
        <radialGradient id="lf-light" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fffbe6" stopOpacity=".38" /><stop offset="1" stopColor="#fffbe6" stopOpacity="0" /></radialGradient>
        {/* painted on the grass: a white border around the logo, like a real midfield logo */}
        <filter id="lf-paint" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d" />
          <feFlood floodColor="#fff" result="w" /><feComposite in="w" in2="d" operator="in" result="edge" />
          <feMerge><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {sb && <>
          <linearGradient id="lf-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff1b8" /><stop offset=".35" stopColor="#e8c45a" /><stop offset=".65" stopColor="#a8822a" /><stop offset="1" stopColor="#f5d77a" /></linearGradient>
          <radialGradient id="lf-medal" cx=".5" cy=".4" r=".65"><stop offset="0" stopColor="#1e2a44" /><stop offset="1" stopColor="#070b16" /></radialGradient>
          <linearGradient id="lf-ezshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".38" /><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".38" /></linearGradient>
          <pattern id="lf-pin" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="none" /><line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeOpacity=".07" strokeWidth="3" /></pattern>
          <path id="lf-arc-top" d={`M ${W / 2 - 55} ${H / 2 + 6} A 55 55 0 0 1 ${W / 2 + 55} ${H / 2 + 6}`} />
          <path id="lf-arc-bot" d={`M ${W / 2 - 57} ${H / 2} A 57 57 0 0 0 ${W / 2 + 57} ${H / 2}`} />
        </>}
      </defs>
      <g ref={cam}>
      {/* mowed stripes, five yards each, running through the end zones */}
      {[...Array(24)].map((_, i) => <rect key={`e${i}`} x={i < 12 ? i * (EZ / 12) : W - EZ + (i - 12) * (EZ / 12)} y="0" width={EZ / 12 + 0.5} height={H} fill={i % 2 ? "#2f8a3a" : "#287c33"} />)}
      {[...Array(20)].map((_, i) => <rect key={i} x={xOf(i * 5)} y="0" width={xOf(5) - xOf(0) + 0.5} height={H} fill={i % 2 ? "#2f8a3a" : "#287c33"} />)}
      {/* end zones: plain grass with the club's wordmark painted big across it (club color, white
          outline), its logo painted at each end, and orange pylons at the four corners */}
      {[[0, offHome ? def : off, -90], [W - EZ, offHome ? off : def, 90]].map(([x, t, rot], i) => t && (sb ? (
        // the Super Bowl: each club's end zone painted solid in its color, pinstriped, framed in gold,
        // its name big in white with a trim in its second color, and its logo at both ends
        <g key={i}>
          <rect x={x} y="0" width={EZ} height={H} fill={t.clr || "#334155"} />
          <rect x={x} y="0" width={EZ} height={H} fill="url(#lf-pin)" />
          <rect x={x} y="0" width={EZ} height={H} fill="url(#lf-ezshade)" />
          <rect x={x + 6} y="6" width={EZ - 12} height={H - 12} rx="4" fill="none" stroke="url(#lf-gold)" strokeWidth="2" />
          <text x={x + EZ / 2} y={H / 2} fill="#fff" fontSize="40" fontWeight="900" fontStyle="italic" fontFamily="'Arial Black', Arial, sans-serif" textAnchor="middle" dominantBaseline="central" textLength={H - 170} lengthAdjust="spacingAndGlyphs" stroke={t.ac && t.ac !== t.clr ? t.ac : "#0b1220"} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" transform={`rotate(${rot} ${x + EZ / 2} ${H / 2})`}>{(t.name || "").toUpperCase()}</text>
          {[44, H - 44].map((cy) => <image key={cy} href={logoUrl(t.ab)} x={x + EZ / 2 - 22} y={cy - 22} width="44" height="44" filter="url(#lf-paint)" transform={`rotate(${rot} ${x + EZ / 2} ${cy})`} />)}
        </g>
      ) : (
        <g key={i}>
          <text x={x + EZ / 2} y={H / 2} fill={t.clr || "#334155"} fontSize="34" fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" textAnchor="middle" dominantBaseline="central" textLength={H - 120} lengthAdjust="spacingAndGlyphs" stroke="#fff" strokeWidth="2.5" paintOrder="stroke" opacity=".92" transform={`rotate(${rot} ${x + EZ / 2} ${H / 2})`}>{(t.name || "").toUpperCase()}</text>
          {[30, H - 30].map((cy) => <image key={cy} href={logoUrl(t.ab)} x={x + EZ / 2 - 16} y={cy - 16} width="32" height="32" opacity=".5" filter="url(#lf-paint)" transform={`rotate(${rot} ${x + EZ / 2} ${cy})`} />)}
        </g>
      )))}
      {/* the home club's logo at midfield */}
      {!sb && (offHome ? off : def)?.ab && <image href={logoUrl((offHome ? off : def).ab)} x={W / 2 - 44} y={H / 2 - 44} width="88" height="88" opacity=".26" filter="url(#lf-paint)" />}
      {/* the Super Bowl: no home team, so the trophy takes midfield, ringed in gold with the game's name */}
      {sb && <g>
        <circle cx={W / 2} cy={H / 2} r="76" fill="#000" opacity=".25" />
        <circle cx={W / 2} cy={H / 2} r="72" fill="url(#lf-medal)" stroke="url(#lf-gold)" strokeWidth="5" />
        <circle cx={W / 2} cy={H / 2} r="44" fill="none" stroke="url(#lf-gold)" strokeWidth="1.5" strokeOpacity=".8" />
        <text fill="url(#lf-gold)" fontSize="11" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="1.2" textAnchor="middle"><textPath href="#lf-arc-top" startOffset="50%" textAnchor="middle">{sb.toUpperCase()}</textPath></text>
        {sbCity && <text fill="#fde68a" fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="2" textAnchor="middle"><textPath href="#lf-arc-bot" startOffset="50%" textAnchor="middle">{sbCity.toUpperCase()}</textPath></text>}
        <image href={lombardiArt} x={W / 2 - 18} y={H / 2 - 38} width="36" height="72" preserveAspectRatio="xMidYMid meet" />
      </g>}
      {/* each club's logo painted at its own 25 */}
      {sb && [[25, offHome ? def : off, -90], [75, offHome ? off : def, 90]].map(([y, t, rot]) => t?.ab && <image key={y} href={logoUrl(t.ab)} x={xOf(y) - 30} y={H / 2 - 30} width="60" height="60" opacity=".8" filter="url(#lf-paint)" transform={`rotate(${rot} ${xOf(y)} ${H / 2})`} />)}
      {/* (the grain is left out while the camera moves: re-drawing it every frame is slow) */}
      {!anim && <rect x="0" y="0" width={W} height={H} filter="url(#lf-grain)" opacity=".55" />}
      <Ground wx={W8} kind={wx} />
      {/* yard lines every five, goal lines heavier */}
      {[...Array(21)].map((_, i) => <line key={i} x1={xOf(i * 5)} y1="0" x2={xOf(i * 5)} y2={H} stroke="#fff" strokeOpacity={i % 20 === 0 ? 0.95 : i % 2 ? 0.4 : 0.7} strokeWidth={i % 20 === 0 ? 3 : i % 2 ? 1.2 : 1.8} />)}
      {/* hash marks every yard: along both sidelines and the two inbound rows */}
      {[...Array(99)].map((_, i) => (i + 1) % 5 !== 0 && <g key={i} stroke="#fff" strokeOpacity=".55" strokeWidth="1">
        <line x1={xOf(i + 1)} y1="2" x2={xOf(i + 1)} y2="9" /><line x1={xOf(i + 1)} y1={H - 9} x2={xOf(i + 1)} y2={H - 2} />
        <line x1={xOf(i + 1)} y1={yOf(-3.1) - 3} x2={xOf(i + 1)} y2={yOf(-3.1) + 3} /><line x1={xOf(i + 1)} y1={yOf(3.1) - 3} x2={xOf(i + 1)} y2={yOf(3.1) + 3} />
      </g>)}
      {/* numbers, upright at the bottom and upside down at the top, like a real field */}
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
        <g key={y} fill="#fff" fillOpacity=".8" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif">
          {/* set in from the sidelines (as on a real field), clear of a holiday frame's art over the edges */}
          <text x={xOf(y)} y={H - 40}>{y <= 50 ? y : 100 - y}</text>
          <text x={xOf(y)} y={54} transform={`rotate(180 ${xOf(y)} 47)`}>{y <= 50 ? y : 100 - y}</text>
        </g>
      ))}
      <rect x="0" y="0" width={W} height={H} fill="url(#lf-shade)" />
      {night && <g pointerEvents="none"><rect x="0" y="0" width={W} height={H} fill="#050c24" opacity=".55" />{[[0.18, 0], [0.82, 0], [0.18, 1], [0.82, 1]].map(([fx, fy], i) => <ellipse key={i} cx={W * fx} cy={H * fy} rx={W * 0.34} ry={H * 0.7} fill="url(#lf-light)" />)}</g>}
      <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" stroke={sb ? "url(#lf-gold)" : "#fff"} strokeOpacity=".85" strokeWidth={sb ? 5 : 2} rx="9" />
      {[2, EZ - 3, W - EZ - 3, W - 8].flatMap((x) => [2, H - 8].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#f97316" stroke="#7c2d12" strokeWidth=".6" />))}
      {/* the field stays put all game (the away end zone on the left, the home end zone on the right,
          like a broadcast); when the home team has the ball the play is drawn mirrored so it drives
          right to left, with its writing turned back the right way (lf-mir) */}
      <g className={offHome ? "lf-mir" : undefined} transform={offHome ? `translate(${W} 0) scale(-1 1)` : undefined}>
      {offHome && <style>{".lf-mir text { transform-box: fill-box; transform-origin: center; transform: scaleX(-1) }"}</style>}
      {/* line of scrimmage and the line to gain, with a soft glow */}
      <line x1={x0} y1="0" x2={x0} y2={H} stroke="#3b82f6" strokeWidth="8" strokeOpacity=".25" />
      <line x1={x0} y1="0" x2={x0} y2={H} stroke="#60a5fa" strokeWidth="3" />
      {toGo > 0 && !st && !anim?.ev?.offAb && los + toGo < 100 && <><line x1={xOf(los + toGo)} y1="0" x2={xOf(los + toGo)} y2={H} stroke="#facc15" strokeWidth="8" strokeOpacity=".25" /><line x1={xOf(los + toGo)} y1="0" x2={xOf(los + toGo)} y2={H} stroke="#fde047" strokeWidth="3" /></>}
      {anim ? <LivePlay key={anim.id} anim={anim} slots={slots} X={xOf} Y={yOf} cam={cam} W={W} H={H} mir={offHome} zoom={camMode === "Field" ? 1 : MOBILE ? 2.2 : 2.1} speed={animSpeed} paused={paused} onPhase={setPhase} onDone={() => onAnimDone?.()} /> : <>{defMen}{offMen}</>}
      {/* a field goal try: the goalposts at the back of the end zone, seen from above */}
      {st === "fg" && <g pointerEvents="none"><line x1={W - 5} y1={yOf(-3.1)} x2={W - 5} y2={yOf(3.1)} stroke="#facc15" strokeWidth="3" strokeLinecap="round" /><circle cx={W - 5} cy={H / 2} r="3.5" fill="#facc15" /></g>}
      </g>
      <HolidayDecor holiday={holiday} />
      </g>
      <Falling wx={W8} />
      {(W8.rain || W8.snow || W8.cold || wx === "wind") && <g pointerEvents="none"><rect x="10" y="12" width={W8.label.length * 7.4 + 20} height="22" rx="11" fill="#0b1220" opacity=".72" /><text x="20" y="27" fontSize="12" fontWeight="800" fill="#e2e8f0" fontFamily="system-ui">{W8.label}</text></g>}
      {!SPRITES && <ellipse cx={x0 - 4} cy={H / 2} rx="7" ry="4.5" fill="#8B4513" stroke="#fff" strokeWidth="1" style={{ transition: "cx .55s ease" }} />}
      {!anim && !lastPlay?.live && <Callout play={lastPlay} W={W} H={H} />}
    </svg>
    {/* a key play: the banner goes up before the snap (decided before the result is known) */}
    {anim?.key && !phase && <div key={`b${anim.id}`} className="lp-banner"><b>KEY PLAY</b><span>{anim.key}</span></div>}
    {/* the result, over the last picture of the play */}
    {phase === "card" && card && (card.head ? (
      <div key={`c${anim.id}`} className={`lp-card lp-${card.tone || "grey"}${card.mine ? " lp-mine" : ""}`} style={card.mine ? { "--lp-team": anim.teamClr || "#38bdf8" } : undefined}>
        {card.mine && <div className="lp-chip">★ YOUR PLAYER</div>}
        <div className="lp-head">{card.head}</div>
        <div className="lp-line">{card.line}</div>
        {card.note && <div className="lp-note">{card.note}</div>}
      </div>
    ) : <div key={`c${anim.id}`} className="lp-strip">{card.line}</div>)}
    </div>
  );
}
