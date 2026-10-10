// Retro pixel-art football players, drawn as SVG. A player is built on a 36 x 44 pixel grid from
// shared parts (hand-placed helmet, torso, hips, cleats, hands and ball stamps; arms and legs as
// shaded pixel lines), posed by position, outlined, numbered, and colored from the team's uniform
// (src/teamUniforms.js). Each finished sprite is merged into a few hundred <rect> runs and cached,
// so a field of 22 stays light.
//
//   <PixelPlayer team={team} pos="RB" number={26} />            a standalone <svg>
//   <PixelPlayer inline x={...} y={...} scale={0.8} ... />       a <g> inside a parent <svg>,
//                                                                 anchored at the feet
// pose: "auto" (by position) | "upright" | "ready" | "qb" | "stance" | "spike" | "heisman"
// facing: "right" | "left"; away: the road uniform; skin: skin tone.
import React from "react";
import { uniformFor, teamKey } from "./teamUniforms.js";

export const GW = 36, GH = 44;

// ---- hand-placed parts (facing right). Keys: H helmet, h shade, i shine, s stripe, D decal,
// M facemask, F skin, f skin shade, E eye, W white, J jersey, j shade, l light, V sleeve stripe,
// P pants, p shade, q light, R pants stripe, S socks, o shade, T sock stripe, C cleat, c cleat shade,
// A arm (skin), a shade, G glove, g glove shade, B ball, b ball shade, L laces, K outline.
const HELMET = [
  "...HHsHH...",
  "..iHHsHHH..",
  ".iHHHsHHHh.",
  "iHDDHHHHKFM",
  "HHDDHHHHKEM",
  "hHHHHHHMMMM",
  "hhHHHHKFFFM",
  ".hhHHHKFFMM",
  "..hhhKWWWM.",
  "....KK.....",
];
const TORSO = [
  ".lJJJJJJJJJJj.",
  "lJJJJJJJJJJJjj",
  "VJJJJJJJJJJJjV",
  "VJJJJJJJJJJJjV",
  ".lJJJJJJJJJjj.",
  ".lJJJJJJJJJjj.",
  ".lJJJJJJJJJjj.",
  ".lJJJJJJJJjjj.",
  "..lJJJJJJJjj..",
  "..lJJJJJJJjj..",
  "..lJJJjJJJjj..",
  "..lJJJjJJjjj..",
  "..KKKKKKKKKK..",
];
const HIPS = ["qPPPPPPPPp", "qPPPPPPPpp", "qPPPPPPPpp"];
const CLEAT = ["CCCCC.", "cCCCCC"];
const HAND = ["GGG", "GGg", "Ggg"];
const BALL = [".bBBBb.", "BBLLLBB", "bBBBBBb", ".bbbbb."];
const BALL_UP = [".bb.", "bBBb", "BLBb", "BLBb", "bBBb", ".bb."];
const DIGITS = { 0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "011", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"], 6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"] };

// ---- poses: where each part goes (facing right; y down, feet near the bottom row).
// arms/legs: [shoulder|hip, elbow|knee, hand|ankle] as [x, y]. Drawn far side, body, near side.
const POSES = {
  upright: { helmet: [14, 1], torso: [11, 10], hips: [13, 22], num: [18, 13],
    farLeg: [[15, 24], [14, 32], [14, 40]], nearLeg: [[20, 24], [21, 32], [21, 40]],
    farArm: [[12, 12], [10, 17], [10, 22]], nearArm: [[23, 12], [25, 17], [25, 22]] },
  ready: { helmet: [16, 5], torso: [12, 14], hips: [13, 26], num: [19, 17],
    farLeg: [[15, 28], [11, 34], [13, 40]], nearLeg: [[20, 28], [24, 34], [22, 40]],
    farArm: [[13, 16], [16, 22], [21, 20]], nearArm: [[24, 16], [27, 21], [30, 18]] },
  qb: { helmet: [14, 1], torso: [11, 10], hips: [13, 22], num: [17, 13], ball: [BALL, 21, 15],
    farLeg: [[15, 24], [13, 32], [12, 40]], nearLeg: [[20, 24], [22, 32], [23, 40]],
    farArm: [[12, 12], [14, 19], [21, 17]], nearArm: [[23, 12], [27, 18], [25, 16]] },
  spike: { helmet: [18, 2], torso: [13, 11], hips: [14, 23], num: [20, 14], ball: [BALL_UP, 26, 35], marks: true,
    farLeg: [[16, 25], [12, 32], [8, 40]], nearLeg: [[21, 25], [25, 32], [27, 40]],
    farArm: [[14, 13], [9, 12], [5, 8]], nearArm: [[25, 13], [28, 20], [29, 27]] },
  heisman: { helmet: [15, 6], torso: [12, 15], hips: [13, 27], num: [18, 18], ball: [BALL, 21, 0],
    farLeg: [[15, 29], [14, 35], [14, 40]], nearLeg: [[20, 29], [26, 29], [24, 36]],
    farArm: [[14, 17], [24, 18], [33, 17]], nearArm: [[23, 16], [27, 10], [25, 4]] },
  stance: { helmet: [24, 17], body: [[10, 28], [24, 26]], num: [16, 26],
    farLeg: [[11, 30], [15, 35], [11, 40]], nearLeg: [[14, 31], [19, 36], [15, 40]],
    farArm: [[21, 27], [20, 32], [17, 35]], nearArm: [[25, 29], [26, 35], [26, 40]] },
};
const BY_POS = { QB: "qb", RB: "heisman", HB: "heisman", FB: "heisman", WR: "spike", TE: "spike",
  LT: "stance", LG: "stance", C: "stance", RG: "stance", RT: "stance", OL: "stance", G: "stance", T: "stance", OT: "stance", OG: "stance",
  DL: "stance", DE: "stance", DT: "stance", NT: "stance", LE: "stance", RE: "stance", EDGE: "stance",
  LB: "ready", MLB: "ready", OLB: "ready", ILB: "ready", LOLB: "ready", ROLB: "ready", CB: "ready", S: "ready", FS: "ready", SS: "ready", DB: "ready" };
export const poseFor = (pos) => BY_POS[String(pos || "").toUpperCase()] || "upright";
export const POSE_NAMES = Object.keys(POSES);

// ---- building a sprite
function build(poseName) {
  const P = POSES[poseName] || POSES.upright;
  const g = new Array(GW * GH).fill(null);
  const set = (x, y, k) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < GW && y < GH) g[y * GW + x] = k; };
  const stamp = (rows, x0, y0) => rows.forEach((r, y) => [...r].forEach((k, x) => { if (k !== ".") set(x0 + x, y0 + y, k); }));
  // a shaded pixel line of width w (shade on the side away from the light, which is upper left)
  const seg = ([x0, y0], [x1, y1], w, base, shade, outline = false) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L; if (nx + ny * 0.6 < 0) { nx = -nx; ny = -ny; }
    const steps = Math.ceil(L * 2);
    const paint = (ww, key, shadeKey) => {
      const rr = (ww - 1) / 2, R = Math.ceil(rr);
      for (let s = 0; s <= steps; s++) {
        const cx = x0 + (dx * s) / steps, cy = y0 + (dy * s) / steps;
        for (let ox = -R; ox <= R; ox++) for (let oy = -R; oy <= R; oy++) {
          if (Math.hypot(ox, oy) > rr + 0.35) continue;
          const d = ox * nx + oy * ny;
          set(cx + ox, cy + oy, shadeKey && d > rr - 1.1 ? shadeKey : key);
        }
      }
    };
    if (outline) paint(w + 2, "K");
    paint(w, base, shade);
  };
  const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  const leg = ([hip, knee, ankle]) => {
    seg(knee, ankle, 3, "S", "o");
    seg(lerp(knee, ankle, 0.18), lerp(knee, ankle, 0.26), 3, "T");
    seg(lerp(knee, ankle, 0.82), lerp(knee, ankle, 0.92), 3, "W", "w");
    seg(hip, knee, 4, "P", "p", true);
    seg(lerp(hip, knee, 0.1), lerp(hip, knee, 0.95), 1, "R");
    stamp(CLEAT, Math.round(ankle[0]) - 2, Math.round(ankle[1]) + 1);
  };
  const arm = ([sh, el, hand], near) => {
    seg(sh, el, 3, "A", "a", near);
    seg(el, hand, 3, "A", "a", near);
    seg(sh, lerp(sh, el, 0.4), 4, "J", "j", near); // the sleeve
    seg(lerp(sh, el, 0.3), lerp(sh, el, 0.42), 4, "V");
    stamp(HAND, Math.round(hand[0]) - 1, Math.round(hand[1]) - 1);
  };
  arm(P.farArm, false);
  leg(P.farLeg);
  if (P.hips) stamp(HIPS, ...P.hips);
  leg(P.nearLeg);
  if (P.torso) stamp(TORSO, ...P.torso);
  if (P.body) { const [hp, shp] = P.body; seg(hp, shp, 9, "J", "j", true); seg([hp[0] - 1, hp[1] + 3], [hp[0] + 3, hp[1] + 3], 4, "P", "p"); seg([shp[0] - 1, shp[1] - 3], [shp[0] - 1, shp[1] + 3], 3, "V"); }
  if (P.ball && P.ball[0] === BALL_UP) stamp(...P.ball);
  arm(P.nearArm, true);
  if (P.ball && P.ball[0] !== BALL_UP) stamp(...P.ball);
  if (P.marks) { set(31, 37, "W"); set(32, 36, "W"); set(31, 40, "W"); set(32, 41, "W"); set(23, 38, "W"); set(22, 37, "W"); }
  stamp(HELMET, ...P.helmet);
  // the outline: every empty pixel touching the figure
  const out = g.slice();
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (g[y * GW + x]) continue;
    if ((x > 0 && g[y * GW + x - 1]) || (x < GW - 1 && g[y * GW + x + 1]) || (y > 0 && g[(y - 1) * GW + x]) || (y < GH - 1 && g[(y + 1) * GW + x])) out[y * GW + x] = "K";
  }
  return { grid: out, num: P.num };
}

// ---- colors
const hex2 = (h) => { const n = parseInt(String(h || "#888888").replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const tone = (h, f) => { const c = hex2(h).map((v) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)); return `rgb(${c[0]},${c[1]},${c[2]})`; };
function palette(u, skin) {
  return {
    K: "#0e0e12", H: u.helmet, h: tone(u.helmet, 0.62), i: tone(u.helmet, 1.55), s: u.stripe || u.helmet, D: u.decal, M: u.mask, E: "#111",
    F: skin, f: tone(skin, 0.62), W: "#f2f2ee", w: "#b8b9b6", J: u.jersey, j: tone(u.jersey, 0.68), l: tone(u.jersey, 1.3), V: u.sleeve,
    P: u.pants, p: tone(u.pants, 0.7), q: tone(u.pants, 1.2), R: u.pantsStripe, S: u.socks, o: tone(u.socks, 0.65), T: u.sockStripe,
    C: "#1b1b1d", c: "#000", A: skin, a: tone(skin, 0.65), G: "#efefec", g: "#b5b6b3", B: "#7b3f1d", b: "#4f2611", L: "#f2f2ee",
  };
}

const cache = new Map();
function sprite({ team, away, pose, number, facing, skin }) {
  const tk = teamKey(team) || (team && typeof team === "object" ? `${team.clr}/${team.ac}` : "none");
  const key = `${tk}|${away ? 1 : 0}|${pose}|${number ?? ""}|${facing}|${skin}`;
  if (cache.has(key)) return cache.get(key);
  const u = uniformFor(team, { away });
  const pal = palette(u, skin);
  const { grid, num } = build(pose);
  const flip = facing === "left";
  const colors = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const k = grid[y * GW + (flip ? GW - 1 - x : x)]; colors.push(k ? pal[k] || "#f0f" : null); }
  // the number, painted on top (never mirrored)
  const digits = number != null && number !== "" ? String(number).slice(0, 2).split("").filter((d) => DIGITS[d]) : [];
  if (digits.length) {
    const nw = digits.length * 4 - 1, cx = flip ? GW - 1 - num[0] : num[0], x0 = Math.round(cx - nw / 2), y0 = num[1];
    const on = new Set();
    digits.forEach((d, k) => DIGITS[d].forEach((r, yy) => [...r].forEach((b, xx) => { if (b === "1") on.add((y0 + yy) * GW + x0 + k * 4 + xx); })));
    const put = (i, c) => { if (i >= 0 && i < colors.length && colors[i]) colors[i] = c; };
    on.forEach((i) => { for (const d of [1, -1, GW, -GW]) if (!on.has(i + d)) put(i + d, u.numberEdge); });
    on.forEach((i) => put(i, u.number));
  }
  // merge each row into runs of one color
  const rects = [];
  for (let y = 0; y < GH; y++) {
    let x = 0;
    while (x < GW) {
      const c = colors[y * GW + x];
      if (!c) { x++; continue; }
      let e = x + 1; while (e < GW && colors[y * GW + e] === c) e++;
      rects.push([x, y, e - x, c]); x = e;
    }
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, rects);
  return rects;
}

function PixelPlayerImpl({ team, pos, number, pose = "auto", facing = "right", away = false, skin = "#8d5a3b", size = 88, inline = false, x = 0, y = 0, scale = 1, title }) {
  const ps = pose === "auto" ? poseFor(pos) : POSES[pose] ? pose : "upright";
  const rects = sprite({ team, away, pose: ps, number, facing, skin });
  const body = rects.map(([rx, ry, rw, c], i) => <rect key={i} x={rx} y={ry} width={rw} height={1} fill={c} />);
  if (inline) {
    return (
      <g transform={`translate(${x - (GW * scale) / 2} ${y - GH * scale}) scale(${scale})`} shapeRendering="crispEdges">
        {title && <title>{title}</title>}
        {body}
      </g>
    );
  }
  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} width={(size * GW) / GH} height={size} shapeRendering="crispEdges" role="img" aria-label={title || `${pos || "player"} ${number ?? ""}`.trim()} style={{ display: "block" }}>
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
}

const PixelPlayer = React.memo(PixelPlayerImpl);
export default PixelPlayer;
