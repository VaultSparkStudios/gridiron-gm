// Hand-placed pixel art, Tecmo Bowl style. Each pose is a grid of characters, one per pixel, in a
// fixed key (outline, helmet, facemask, skin, jersey, pants, socks, cleats, ball). The game recolors
// the key into the player's team colors, draws his number in a pixel font, applies his gear, and
// stretches the sprite a little for his real height and build.
import React, { useEffect, useRef } from "react";
import { gearFor, jerseyNum } from "./PlayerFigure.jsx";

// Key: . clear  K outline  H/h/i helmet base/shade/shine  s helmet stripe  M facemask
//      F/f skin, E eye  A/a arm (skin or sleeve)  G/g hand or glove  T team trim  J/j/l jersey
//      P/p/q pants  S/o socks  W/w white  C/c cleats  B/b ball, L laces
const QB = [
  "........................................",
  ".......KKKK.............................",
  ".....KKBBBBKK...........................",
  "....KBBBBBBbbK.....KKKKKKK..............",
  "...KBBLLLLLBbK...KKiiHHsHHHKK...........",
  "...KBBBBBBBbbK..KiiHHHHsHHHHhK..........",
  "....KbBBGGGbK..KiHHHHHHsHHHHHhK.........",
  ".....KKGGGgK...KiHHHHHHsHHHHHHK.........",
  ".......KGGgK..KiHHHHHHHsHHHHHHhK........",
  ".......KAAaK..KHHHHHHHHHHKfffffK........",
  "......KAAaK...KHHHKKHHHHHKfEFFFMMK......",
  "......KAAaK...KHHHKKHHHHHKFFFFfMMK......",
  ".....KAAAaK...KhHHHHHHHHHMMMMMMMMK......",
  ".....KAAAaK...KhhHHHHHHHHKFfFFfMMK......",
  ".....KAAAAaK...KhhHHHHHHHMMMMMMMMK......",
  "......KAAAAaK..KhhHHHHHHKHFFFFKMMK......",
  ".......KAAAAaK..KKhhHHHHHHWWWWKMMK......",
  "........KAAAAaKK..KKKKKKKKKKKKKKK.......",
  ".........KTTTTtJKK..KFFFFfK.............",
  "..........KJJJJJJJKKKFFFfKKKJJJJKK......",
  ".........KlJJJJJJJJJKKKKKJJJJJJJjjK.....",
  ".........KlJJJJJJJJJJJJJJJJJJJJTTjjKK...",
  "..........KlJJJJJJJJJJJJJJJJJJJTTjAAAKK.",
  "..........KlJJJJJJJJJJJJJJJJJJjjKAAAAAGK",
  "...........KlJJJJJJJJJJJJJJJJjjjKaaaaGGK",
  "...........KlJJJJJJJJJJJJJJJJjjjjKKKKKK.",
  "...........KlJJJJJJJJJJJJJJJjjjjK.......",
  "...........KlJJJJJJJJJJJJJJJjjjK........",
  "...........KlJJJJJJJJJJJJJJjjjjK........",
  "............KlJJJJJJJJJJJJJjjjK.........",
  "............KlJJJJJJJJJJJJJjjjK.........",
  "............KlJJJjJJJJJjJJJjjjK.........",
  "............KlJJJjJJJJJjJJJjjK..........",
  "............KKKKKKKKKKKKKKKKKKK.........",
  "............KqPPPPPPPPPPPPPPPppK........",
  "............KqPPPPPPPPPPPPPPPppK........",
  "...........KqPPPPPPPpKKPPPPPPPppK.......",
  "...........KqPPPPPPpK..KqPPPPPPpK.......",
  "..........KqPPPPPPpK....KqPPPPPPpK......",
  "..........KqPPPPPPpK....KqPPPPPPpK......",
  ".........KqPPPPPPpK......KqPPPPPPpK.....",
  ".........KqPPPPPPpK......KqPPPPPPpK.....",
  ".........KqPPPPPpK........KqPPPPPpK.....",
  "........KTTTTTTK..........KTTTTTTK......",
  "........KWWWWWWK..........KWWWWWWK......",
  ".......KSSSSSoK............KSSSSSoK.....",
  ".......KSSSSSoK............KSSSSSoK.....",
  "......KSSSSSoK..............KSSSSSoK....",
  "......KSSSSSoK..............KSSSSSoK....",
  "......KSSSSoK................KSSSSoK....",
  ".....KWWWWwK.................KWWWWwK....",
  "...KKCCCCCCK................KCCCCCCKK...",
  "..KCCCCCCCCcK..............KCCCCCCCCCK..",
  "..KKKKKKKKKKK..............KKKKKKKKKKK..",
];
const POSES = { QB: { rows: QB, num: [21, 22] } };

// 3x5 digits, scaled to 2x for a 6x10 number on the chest
const DIGITS = { 0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "011", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"], 6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"] };

const hex2 = (h) => { const n = parseInt((h || "#888888").replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = hex2(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const tone = (h, f) => hex2(h).map((v) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f));

function paint(p, t, away, flip) {
  const g = gearFor(p);
  const clr = t.clr || "#334155", ac = t.ac || "#e2e8f0";
  const tc = (c) => (c === "team" ? clr : c);
  const J = away ? "#eef1f5" : clr, trim = away ? clr : ac;
  const pantsC = away ? "#e6e9ee" : lum(ac) > 0.85 || lum(ac) < 0.12 ? "#d9dce0" : ac;
  const sockC = away ? "#eef1f5" : clr, skin = p.face?.sk || "#8a5a3c";
  const armC = g.sleeves !== "none" ? tc(g.sleeveClr) : skin, handC = g.gloves !== "none" ? tc(g.gloveClr) : skin;
  const pal = {
    K: [12, 12, 14], H: tone(clr, 1), h: tone(clr, 0.62), i: tone(clr, 1.55), s: tone(trim, 1), M: [240, 240, 236],
    F: tone(skin, 1), f: tone(skin, 0.62), E: [17, 17, 17], A: tone(armC, 1), a: tone(armC, 0.65), G: tone(handC, 1), g: tone(handC, 0.65),
    T: tone(trim, 1), t: tone(trim, 0.65), J: tone(J, 1), j: tone(J, 0.68), l: tone(J, 1.3), P: tone(pantsC, 1), p: tone(pantsC, 0.68), q: tone(pantsC, 1.25),
    S: tone(sockC, 1), o: tone(sockC, 0.65), W: [239, 239, 236], w: [185, 186, 184], C: tone(tc(g.cleats), 1), c: tone(tc(g.cleats), 0.6),
    B: [123, 63, 29], b: [79, 38, 17], L: [242, 242, 238],
  };
  const pose = POSES[p.pos] || POSES.QB;
  const rows = pose.rows.map((r) => r.padEnd(40, ".").slice(0, 40).split(""));
  if (g.visor !== "none") rows[10] = rows[10].map((c, x) => (x >= 26 && x <= 30 && /[FfE]/.test(c) ? "K" : c));
  else if (g.eyeBlack !== "none") rows[11][27] = "K";
  if (flip) rows.forEach((r) => r.reverse());
  const w = 40, h = rows.length, img = new ImageData(w, h);
  rows.forEach((r, y) => r.forEach((c, x) => { if (c === ".") return; const v = pal[c] || [255, 0, 255]; const i = (y * w + x) * 4; img.data[i] = v[0]; img.data[i + 1] = v[1]; img.data[i + 2] = v[2]; img.data[i + 3] = 255; }));
  // the number on his chest, never mirrored
  const num = String(jerseyNum(p)).slice(0, 2).split("");
  const fill = away ? tone(clr, 1) : lum(clr) > 0.7 ? tone(clr, 0.5) : [244, 244, 242], edge = tone(lum(ac) > 0.85 && !away ? "#2a2a2a" : ac, 1);
  const nw = num.length * 7 - 1, [ncx, ny] = pose.num, nx0 = Math.round((flip ? w - 1 - ncx : ncx) - nw / 2);
  const set = (x, y, v) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; img.data[i] = v[0]; img.data[i + 1] = v[1]; img.data[i + 2] = v[2]; img.data[i + 3] = 255; };
  const on = new Set();
  num.forEach((d, k) => DIGITS[d].forEach((r, yy) => r.split("").forEach((b, xx) => { if (b === "1") for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) on.add(`${nx0 + k * 7 + xx * 2 + dx},${ny + yy * 2 + dy}`); })));
  on.forEach((k) => { const [x, y] = k.split(",").map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has(`${x + dx},${y + dy}`)) set(x + dx, y + dy, edge); });
  on.forEach((k) => { const [x, y] = k.split(",").map(Number); set(x, y, fill); });
  return img;
}

export default function TecmoSprite({ p, t, away = false, flip = false, h = 180, label = true }) {
  const ref = useRef(null);
  // his build: taller players stand taller, heavier ones are drawn wider
  const ht = p?.ht_ || p?.ht || 74, wt = p?.wt || 225;
  const HS = Math.max(0.9, Math.min(1.08, ht / 75));
  const W = Math.max(0.84, Math.min(1.22, Math.pow((wt / (ht * ht)) / (225 / 5625), 0.8)));
  const dh = Math.round(h * HS), dw = Math.round(((h * 40) / 54) * W);
  useEffect(() => {
    const c = ref.current; if (!c || !p || !t) return;
    const img = paint(p, t, away, flip);
    const src = document.createElement("canvas"); src.width = img.width; src.height = img.height; src.getContext("2d").putImageData(img, 0, 0);
    const ctx = c.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(src, 0, 0, c.width, c.height);
  }, [p?.id, p?.pos, t?.ab, away, flip, dw, dh]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p || !t) return null;
  const dpr = typeof window !== "undefined" ? Math.min(3, window.devicePixelRatio || 1) : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, height: label ? undefined : h * 1.08 }}>
      <canvas ref={ref} width={Math.round(dw * dpr)} height={Math.round(dh * dpr)} role="img" aria-label={`${p.name}, ${t.name} ${p.pos}`} style={{ width: dw, height: dh, imageRendering: "pixelated" }} />
      {label && <div style={{ fontSize: Math.max(10, Math.round(h / 15)), fontWeight: 800, color: "#e2e8f0", marginTop: 2, whiteSpace: "nowrap" }}>{(p.name || "").split(" ").slice(1).join(" ") || p.name} <span style={{ color: "#94a3b8", fontWeight: 700 }}>{p.pos} {p.ovr}</span></div>}
    </div>
  );
}
