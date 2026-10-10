// A club's star as Tecmo Bowl-style pixel art: drawn on a tiny grid in flat team colors with two
// shading tones and hard black outlines, then blown up with square pixels. His size comes from his
// real height, weight and strength; his gear (sleeves, tape, wristbands, gloves, towel, socks,
// cleats, facemask) from gearFor, so he looks the same every week. A black visor hides the face.
import React, { useEffect, useRef } from "react";
import { gearFor, jerseyNum } from "./PlayerFigure.jsx";

const LW = 84, LH = 140; // the sprite grid
const hex2 = (h) => { const n = parseInt((h || "#888888").replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = hex2(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const tone = (h, f) => { const c = hex2(h).map((v) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)); return `rgb(${c[0]},${c[1]},${c[2]})`; };
const INK = "#0b0b0d";

const BALL = new Set(["QB", "RB", "WR", "TE", "HB", "FB"]);

// Poses by position, as a simple skeleton in units of his height (x to the right, the way he faces;
// y up from the ground). P: pelvis, S: chest between the shoulders, Hd: helmet; n/f: near and far.
const GROUP = { QB: "qb", RB: "rb", HB: "rb", FB: "rb", WR: "wr", TE: "wr", LT: "line", LG: "line", C: "line", RG: "line", RT: "line", OL: "line", G: "line", T: "line", DL: "line", DE: "line", DT: "line", LE: "line", RE: "line", EDGE: "line", K: "stand", P: "stand" };
const POSES = {
  stand: { P: [0, 0.5], S: [0.01, 0.78], Hd: [0.02, 0.9], nK: [0.05, 0.28], nA: [0.06, 0.05], fK: [-0.05, 0.28], fA: [-0.06, 0.05], nE: [0.2, 0.63], nH: [0.21, 0.49], fE: [-0.19, 0.63], fH: [-0.2, 0.49] },
  qb: { P: [0, 0.5], S: [0.0, 0.78], Hd: [0.03, 0.9], nK: [0.1, 0.28], nA: [0.15, 0.05], fK: [-0.07, 0.27], fA: [-0.15, 0.05], nE: [0.23, 0.74], nH: [0.33, 0.77], fE: [-0.25, 0.84], fH: [-0.18, 0.98], ball: "qb" },
  rb: { P: [0, 0.5], S: [0.02, 0.78], Hd: [0.03, 0.9], nK: [0.15, 0.52], nA: [0.09, 0.3], fK: [-0.03, 0.28], fA: [-0.05, 0.05], nE: [0.27, 0.77], nH: [0.38, 0.79], fE: [-0.1, 0.62], fH: [0.03, 0.66], ball: "tuck", palm: true },
  wr: { P: [0, 0.49], S: [0.05, 0.76], Hd: [0.08, 0.88], nK: [0.1, 0.27], nA: [0.15, 0.05], fK: [-0.08, 0.27], fA: [-0.15, 0.05], nE: [0.22, 0.6], nH: [0.27, 0.45], fE: [-0.22, 0.7], fH: [-0.32, 0.64], ball: "spike" },
  line: { P: [-0.12, 0.42], S: [0.12, 0.5], Hd: [0.27, 0.55], nK: [0.0, 0.22], nA: [-0.04, 0.04], fK: [-0.2, 0.22], fA: [-0.24, 0.04], nE: [0.17, 0.27], nH: [0.19, 0.03], fE: [-0.01, 0.37], fH: [0.05, 0.31] },
  ready: { P: [-0.02, 0.44], S: [0.04, 0.7], Hd: [0.07, 0.82], nK: [0.07, 0.24], nA: [0.05, 0.04], fK: [-0.1, 0.24], fA: [-0.11, 0.04], nE: [0.2, 0.58], nH: [0.27, 0.62], fE: [-0.1, 0.57], fH: [0.04, 0.6] },
};
const poseOf = (pos) => POSES[GROUP[pos] || "ready"];

function draw(ctx, p, t, away, bob, flip) {
  const g = gearFor(p);
  const clr = t.clr || "#334155", ac = t.ac || "#e2e8f0";
  const tc = (c) => (c === "team" ? clr : c);
  const J = away ? "#eef1f5" : clr, trim = away ? clr : ac;
  const numFill = away ? clr : lum(clr) > 0.7 ? clr : "#f4f4f2", numEdge = away ? (lum(ac) > 0.85 ? "#9aa0a8" : ac) : lum(ac) > 0.85 ? "#2a2a2a" : ac;
  const pantsC = away ? "#e6e9ee" : lum(ac) > 0.85 || lum(ac) < 0.12 ? "#d9dce0" : ac;
  const sockC = away ? "#eef1f5" : clr, skin = p.face?.sk || "#8a5a3c", maskC = "#f2f2f0";

  // his build from his real size
  const ht = p.ht_ || p.ht || 74, wt = p.wt || 225, str = p.str ?? 75;
  const HS = Math.max(0.9, Math.min(1.08, ht / 75));
  const W = Math.max(0.78, Math.min(1.3, Math.pow((wt / (ht * ht)) / (225 / 5625), 0.95)));
  const M = 0.85 + Math.max(40, Math.min(99, str)) / 400;
  const gut = Math.max(0, Math.min(1, (wt - 290) / 60));

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, LW, LH);
  if (flip) ctx.setTransform(-1, 0, 0, 1, LW, 0);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  const H = 96 * HS, G = LH - 3, cx = LW / 2 - 6;
  const pose = poseOf(p.pos);
  const at = (k, lift = 0) => [cx + pose[k][0] * H, G - pose[k][1] * H - lift];

  // four shades a color: a dark line in its own hue, shadow, base and a light edge
  const line = (c) => tone(c, 0.32);
  const limb = ([x1, y1], [x2, y2], wd, c) => {
    ctx.strokeStyle = line(c); ctx.lineWidth = wd + 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, o = nx > 0 || (nx === 0 && ny > 0) ? 1 : -1;
    ctx.strokeStyle = tone(c, 0.66); ctx.lineWidth = Math.max(1, wd * 0.36); ctx.beginPath(); ctx.moveTo(x1 + o * nx * wd * 0.3, y1 + o * ny * wd * 0.3); ctx.lineTo(x2 + o * nx * wd * 0.3, y2 + o * ny * wd * 0.3); ctx.stroke();
    ctx.strokeStyle = tone(c, 1.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1 - o * nx * wd * 0.28, y1 - o * ny * wd * 0.28); ctx.lineTo(x2 - o * nx * wd * 0.28, y2 - o * ny * wd * 0.28); ctx.stroke();
  };
  const poly = (pts, c, shadeFrom, lit = true) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.save(); ctx.clip();
    if (shadeFrom != null) { ctx.fillStyle = tone(c, 0.68); ctx.fillRect(shadeFrom, 0, LW, LH); }
    if (lit) { ctx.fillStyle = tone(c, 1.3); ctx.fillRect(Math.min(...pts.map((q) => q[0])) + 1, 0, 2, LH); }
    ctx.restore();
    ctx.strokeStyle = line(c); ctx.lineWidth = 1; ctx.stroke();
  };
  const oval = (x, y, rx, ry, c, shade = true, rot = 0) => {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    if (shade) { ctx.save(); ctx.clip(); ctx.fillStyle = tone(c, 0.68); ctx.fillRect(x + rx * 0.2, y - ry - 2, rx * 2, ry * 2 + 4); ctx.fillStyle = tone(c, 1.35); ctx.fillRect(x - rx * 0.75, y - ry * 0.6, 2, ry * 0.9); ctx.restore(); }
    ctx.strokeStyle = line(c); ctx.lineWidth = 1; ctx.stroke();
  };
  const px = (x, y, w2, h2, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w2, h2); };
  const football = (x, y, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); oval(0, 0, 8, 4.6, "#7b3f1d"); px(-4, -1, 8, 1, "#f2f2ee"); for (let i = -3; i <= 3; i += 2) px(i, -2, 1, 3, "#f2f2ee"); ctx.restore(); };

  // torso frame from the pose
  const lift = bob;
  const Pc = at("P"), Sc = at("S", lift);
  const vx = Sc[0] - Pc[0], vy = Sc[1] - Pc[1], vl = Math.hypot(vx, vy);
  let qx = -vy / vl, qy = vx / vl; if (qx < 0 || (Math.abs(qx) < 0.3 && qy < 0)) { qx = -qx; qy = -qy; } // across the body, toward the near side / ground
  const sh = 16 * W, waist = 10 * W + gut * 3.8, legX = 5.4 * W;
  const shN = [Sc[0] + qx * (sh - 2), Sc[1] + qy * (sh - 2)], shF = [Sc[0] - qx * (sh - 2), Sc[1] - qy * (sh - 2)];
  const hipN = [Pc[0] + qx * legX, Pc[1] + qy * legX], hipF = [Pc[0] - qx * legX, Pc[1] - qy * legX];
  const thigh = 9.4 * W * M, shin = 6.2 * Math.sqrt(W) * M, armUp = 6 * Math.sqrt(W) * M, armLo = 5.2 * Math.sqrt(W) * M;
  const sleeveOn = (s) => g.sleeves === "both" || (g.sleeves === "one" && s < 0);
  const armC = (s) => (sleeveOn(s) ? tc(g.sleeveClr) : skin);

  const leg = (hip, kK, aK) => {
    const k = at(kK), a = at(aK);
    limb(k, a, shin, sockC);
    const t0 = 0.12, mx = k[0] + (a[0] - k[0]) * t0, my = k[1] + (a[1] - k[1]) * t0;
    if (g.socks === "low") limb([k[0] + (a[0] - k[0]) * 0.55, k[1] + (a[1] - k[1]) * 0.55], a, shin, "#f1f1ee");
    else { ctx.strokeStyle = trim; ctx.lineWidth = shin; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + (a[0] - k[0]) * 0.06, my + (a[1] - k[1]) * 0.06); ctx.stroke(); }
    poly([[a[0] - 4, a[1] - 2], [a[0] + 4, a[1] - 2], [a[0] + 9, a[1] + 2], [a[0] + 8, a[1] + 4], [a[0] - 4, a[1] + 4]], tc(g.cleats), a[0] + 2);
    limb(hip, k, thigh, pantsC);
    oval(k[0] + 0.5, k[1], thigh * 0.48, 3, pantsC);
  };
  const arm = (shoulder, eK, hK, s, gloved, palm) => {
    const e = at(eK, lift), h = at(hK, lift);
    limb(shoulder, e, armUp, armC(s)); limb(e, h, armLo, armC(s));
    const wx = e[0] + (h[0] - e[0]) * 0.82, wy = e[1] + (h[1] - e[1]) * 0.82;
    if (g.armTape) { ctx.strokeStyle = "#f1f1ee"; ctx.lineWidth = armLo + 1; ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(e[0] + (h[0] - e[0]) * 0.55, e[1] + (h[1] - e[1]) * 0.55); ctx.lineTo(e[0] + (h[0] - e[0]) * 0.65, e[1] + (h[1] - e[1]) * 0.65); ctx.stroke(); ctx.lineCap = "round"; }
    if (g.wristbands) { ctx.strokeStyle = tc(g.bandClr); ctx.lineWidth = armLo + 1; ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(e[0] + (h[0] - e[0]) * 0.92, e[1] + (h[1] - e[1]) * 0.92); ctx.stroke(); ctx.lineCap = "round"; }
    oval(h[0], h[1], palm ? 3 : 3.6, palm ? 4.6 : 3.8, gloved ? tc(g.gloveClr) : skin);
    return h;
  };
  const glovedN = g.gloves !== "none", glovedF = g.gloves === "both";

  // far side first
  const fH = arm(shF, "fE", "fH", -1, glovedF, false);
  if (pose.ball === "qb") football(fH[0] + 2, fH[1] - 5, -0.6);
  leg(hipF, "fK", "fA");
  oval(Pc[0], Pc[1], 10.5 * W + gut * 2, 7, pantsC); // hips
  leg(hipN, "nK", "nA");

  // torso: the jersey over the pads, from shoulders to belt
  const wN = [Pc[0] + qx * waist, Pc[1] + qy * waist], wF = [Pc[0] - qx * waist, Pc[1] - qy * waist];
  const tN = [Sc[0] + qx * sh, Sc[1] + qy * sh], tF = [Sc[0] - qx * sh * 0.92, Sc[1] - qy * sh * 0.92];
  poly([tF, tN, wN, wF], J, Math.min(tN[0], wN[0]) - sh * 0.5);
  oval(shF[0], shF[1] + 1, 7 * W, 5, J); oval(shN[0], shN[1] + 1, 7 * W, 5, J);
  // the number, turned with his chest
  const num = String(jerseyNum(p)).slice(0, 2);
  const mx = (Sc[0] * 0.55 + Pc[0] * 0.45) + 2, my = Sc[1] * 0.55 + Pc[1] * 0.45;
  const ang = Math.atan2(vy, vx) + Math.PI / 2;
  ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.max(-0.5, Math.min(0.5, ang))); if (flip) ctx.scale(-1, 1);
  ctx.font = `900 ${Math.round(H * (GROUP[p.pos] === "line" ? 0.13 : 0.16))}px 'Arial Black', Impact, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineWidth = 3; ctx.strokeStyle = numEdge; ctx.strokeText(num, 0, 0); ctx.fillStyle = numFill; ctx.fillText(num, 0, 0);
  ctx.restore();
  // belt and towel
  ctx.strokeStyle = "#151517"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wF[0], wF[1]); ctx.lineTo(wN[0], wN[1]); ctx.stroke();
  if (g.towel) poly([[Pc[0] - 4, Pc[1] - 5], [Pc[0], Pc[1] - 5], [Pc[0], Pc[1] + 5], [Pc[0] - 4, Pc[1] + 4]], "#f4f4f0");

  // near arm and the ball
  const nH = arm(shN, "nE", "nH", 1, glovedN, !!pose.palm);
  if (pose.ball === "tuck") football(fH[0] + 3, fH[1] - 2, 0.3);
  if (pose.ball === "spike") { football(nH[0] + 4, G - 6, 0.9); px(nH[0] + 13, G - 12, 2, 1, "#f2f2ee"); px(nH[0] + 14, G - 8, 3, 1, "#f2f2ee"); px(nH[0] - 4, G - 10, 2, 1, "#f2f2ee"); }

  // ---- helmet, three-quarters: big glossy shell, the face behind a white cage
  const Hd = at("Hd", lift), hr = 12.5 * Math.sqrt(HS), hx = Hd[0], hy = Hd[1];
  limb([Sc[0], Sc[1] - 2], [hx - 1, hy + hr * 0.5], 9 * Math.sqrt(W), tone(skin, 0.8)); // neck
  if (g.neckRoll) oval(Sc[0], Sc[1] - 2, 7, 2.6, J, false);
  oval(hx, hy, hr, hr * 0.93, clr);
  px(hx - hr * 0.62, hy - hr * 0.55, 2, Math.round(hr * 0.5), tone(clr, 1.6)); // shine
  px(hx - hr * 0.45, hy - hr * 0.74, Math.round(hr * 0.4), 1, tone(clr, 1.6));
  px(hx + hr * 0.02, hy - hr * 0.93, 3, Math.round(hr * 0.8), trim); // stripe
  oval(hx - hr * 0.25, hy + hr * 0.12, 2.2, 2.2, tone(clr, 0.45), false); // ear hole
  const fx0 = hx + hr * 0.15, fx1 = hx + hr * 0.98, fy0 = hy - hr * 0.08, fy1 = hy + hr * 0.86;
  poly([[fx0, fy0], [fx1, fy0 + 1], [fx1 - 1, fy1], [fx0 + 1, fy1]], skin, fx0 + (fx1 - fx0) * 0.5, false);
  px(fx0 + 1, fy0, Math.round(fx1 - fx0), 2, tone(skin, 0.55)); // brow shadow
  px(fx0 + 3, fy0 + 3, 2, 1, "#111"); px(fx1 - 4, fy0 + 3, 2, 1, "#111"); // eyes
  if (g.eyeBlack !== "none") { px(fx0 + 3, fy0 + 5, 3, 1, "#111"); px(fx1 - 4, fy0 + 5, 2, 1, "#111"); }
  if (g.visor !== "none") px(fx0, fy0 + 1, Math.round(fx1 - fx0), 4, g.visor === "clear" ? tone(skin, 0.8) : g.visor === "iridescent" ? "#3b2f7a" : "#08090b");
  px(fx0 + 3, fy1 - 4, 4, 1, tone(skin, 0.5)); // mouth
  oval(hx + hr * 0.1, hy + hr * 0.62, 2.8, 3.4, clr, false); // jaw pad
  const bars = g.mask === "open" ? [0.28] : g.mask === "bar2" ? [0.28, 0.58] : [0.25, 0.5, 0.76];
  for (const b of bars) { px(fx0 - 1, hy + hr * b, Math.round(fx1 - fx0 + 4), 2, maskC); px(fx0 - 1, hy + hr * b + 2, Math.round(fx1 - fx0 + 4), 1, "#8d9096"); }
  px(fx1 + 2, hy + hr * 0.2, 2, Math.round(hr * 0.66), maskC);
  if (g.mask === "cage" || g.mask === "bar3") px((fx0 + fx1) / 2 + 1, hy + hr * 0.25, 2, Math.round(hr * 0.55), maskC);
  px(fx0 + 1, fy1 + 1, Math.round((fx1 - fx0) * 0.75), 1, "#f2f2ee"); // chin strap
}

// Snap every pixel to the palette (no blended edges) and wrap the silhouette in a black outline.
function crisp(ctx) {
  const img = ctx.getImageData(0, 0, LW, LH), d = img.data, solid = new Uint8Array(LW * LH);
  for (let i = 0, k = 0; i < d.length; i += 4, k++) { if (d[i + 3] < 120) d[i + 3] = 0; else { d[i + 3] = 255; solid[k] = 1; } }
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const k = y * LW + x; if (solid[k]) continue;
    if ((x > 0 && solid[k - 1]) || (x < LW - 1 && solid[k + 1]) || (y > 0 && solid[k - LW]) || (y < LH - 1 && solid[k + LW])) { const i = k * 4; d[i] = 11; d[i + 1] = 11; d[i + 2] = 13; d[i + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
}

export default function PixelPlayer({ p, t, away = false, flip = false, h = 180, label = true }) {
  const ref = useRef(null);
  const dpr = typeof window !== "undefined" ? Math.min(3, window.devicePixelRatio || 1) : 1;
  const S = Math.max(1, Math.floor((h * dpr) / LH));
  const cw = (LW * S) / dpr, ch = (LH * S) / dpr;
  useEffect(() => {
    const out = ref.current; if (!out || !p || !t) return;
    const low = document.createElement("canvas"); low.width = LW; low.height = LH;
    const lctx = low.getContext("2d", { willReadFrequently: true });
    const octx = out.getContext("2d");
    const render = (bob) => {
      draw(lctx, p, t, away, bob, flip); lctx.setTransform(1, 0, 0, 1, 0, 0); crisp(lctx);
      octx.imageSmoothingEnabled = false; octx.clearRect(0, 0, out.width, out.height);
      octx.drawImage(low, 0, 0, out.width, out.height);
      if (S >= 3) { // the pixel grid, laid only over the figure, like the card art
        octx.save(); octx.globalCompositeOperation = "source-atop"; octx.fillStyle = "rgba(0,0,0,0.22)";
        for (let x = S - 1; x < out.width; x += S) octx.fillRect(x, 0, 1, out.height);
        for (let y = S - 1; y < out.height; y += S) octx.fillRect(0, y, out.width, 1);
        octx.restore();
      }
      if (S >= 3) { // the pixel grid, laid only over the figure
        octx.save(); octx.globalCompositeOperation = "source-atop"; octx.fillStyle = "rgba(0,0,0,0.22)";
        for (let x = S - 1; x < out.width; x += S) octx.fillRect(x, 0, 1, out.height);
        for (let y = S - 1; y < out.height; y += S) octx.fillRect(0, y, out.width, 1);
        octx.restore();
      }
    };
    render(0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let b = 0; const id = setInterval(() => { b ^= 1; render(b); }, 650 + (jerseyNum(p) % 7) * 30);
    return () => clearInterval(id);
  }, [p?.id, p?.ovr, t?.ab, away, flip, S]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p || !t) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <canvas ref={ref} width={LW * S} height={LH * S} role="img" aria-label={`${p.name}, ${t.name} ${p.pos}`} style={{ width: cw, height: ch, imageRendering: "pixelated" }} />
      {label && <div style={{ fontSize: Math.max(10, Math.round(h / 15)), fontWeight: 800, color: "#e2e8f0", marginTop: 2, whiteSpace: "nowrap", textAlign: "center" }}>{(p.name || "").split(" ").slice(1).join(" ") || p.name} <span style={{ color: "#94a3b8", fontWeight: 700 }}>{p.pos} {p.ovr}</span></div>}
    </div>
  );
}
