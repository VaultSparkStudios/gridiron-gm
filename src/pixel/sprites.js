// Pixel-art football players from the approved concept art: eight hand-drawn pose sprites
// (./assets/<pose>.png, drawn in a Giants uniform) recolored in the browser into any team's
// uniform, with that team's logo on the helmet (from ./assets/helmets/<team>.png) and the player's
// own number on the jersey. Results are cached as image URLs, so 22 players cost a few decodes.
//
//   spriteFor(pose, team, { away, number, facing }) -> Promise<url>
//   poses: RB (Heisman), WR / TE (spike), OL / DL (three-point stance), QB, LB, DB (upright)
import { uniformFor, teamKey } from "../teamUniforms.js";
import rbUrl from "./assets/rb.png";
import wrUrl from "./assets/wr.png";
import teUrl from "./assets/te.png";
import olUrl from "./assets/ol.png";
import dlUrl from "./assets/dl.png";
import qbUrl from "./assets/qb.png";
import lbUrl from "./assets/lb.png";
import dbUrl from "./assets/db.png";

const HELMET_FILES = import.meta.glob("./assets/helmets/*.png", { eager: true, import: "default" });
const helmetArt = (k) => (k ? HELMET_FILES[`./assets/helmets/${k.toLowerCase()}.png`] : null);

// Each pose: its art, size, where the jersey number sits [x, y, w, h], the helmet [x0, y0, x1, y1],
// and the row where the socks start (blue below this line is sock, not jersey).
export const SPRITES = {
  RB: { src: rbUrl, w: 127, h: 188, numBox: [52, 73, 33, 27], helmetBox: [50, 25, 102, 74], sockY: 150 },
  WR: { src: wrUrl, w: 139, h: 184, numBox: [63, 78, 31, 19], helmetBox: [72, 35, 126, 81], sockY: 150 },
  TE: { src: teUrl, w: 146, h: 192, numBox: [66, 82, 32, 28], helmetBox: [77, 37, 137, 93], sockY: 158 },
  OL: { src: olUrl, w: 143, h: 122, numBox: [61, 9, 21, 29], helmetBox: [80, 6, 138, 69], sockY: 92 },
  DL: { src: dlUrl, w: 159, h: 124, numBox: [63, 10, 22, 29], helmetBox: [91, 8, 149, 72], sockY: 94 },
  QB: { src: qbUrl, w: 113, h: 181, numBox: [44, 75, 32, 30], helmetBox: [39, 9, 93, 64], sockY: 148 },
  LB: { src: lbUrl, w: 131, h: 163, numBox: [58, 61, 32, 16], helmetBox: [52, 4, 114, 62], sockY: 132 },
  DB: { src: dbUrl, w: 116, h: 176, numBox: [50, 65, 30, 14], helmetBox: [41, 8, 101, 66], sockY: 144 },
};

const FONT = { 0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "111", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"], 6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"] };
const rgb = (h) => { let s = String(h || "#888888").replace("#", ""); if (s.length === 3) s = [...s].map((c) => c + c).join(""); const n = parseInt(s.padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const shade = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));

const images = new Map();
const load = (src) => {
  if (!images.has(src)) images.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
  return images.get(src);
};

const cache = new Map();
export function spriteFor(pose, team, { away = false, number = null, facing = "right", skin = null } = {}) {
  const meta = SPRITES[pose] || SPRITES.DB;
  const tk = teamKey(team) || (team && typeof team === "object" ? `${team.clr}/${team.ac}` : "none");
  const key = `${pose}|${tk}|${away ? 1 : 0}|${number ?? ""}|${facing}|${skin || ""}`;
  if (cache.has(key)) return cache.get(key);
  const u = uniformFor(team, { away });
  const job = Promise.all([load(meta.src), helmetArt(teamKey(team)) ? load(helmetArt(teamKey(team))).catch(() => null) : null]).then(([img, logoImg]) => {
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const im = ctx.getImageData(0, 0, W, H), d = im.data;
    const [hx0, hy0, hx1, hy1] = meta.helmetBox, [nx, ny, nw, nh] = meta.numBox;
    const C = { jersey: rgb(u.jersey), helmet: rgb(u.helmet), stripe: rgb(u.stripe || u.helmet), sleeve: rgb(u.sleeve), pants: rgb(u.pants), pantsStripe: rgb(u.pantsStripe), socks: rgb(u.socks), sockStripe: rgb(u.sockStripe) };
    const skinC = skin ? rgb(skin) : null;
    const pantsTint = u.pants.toLowerCase() !== "#ffffff" && u.pants.toLowerCase() !== "#f4f4f2";
    const helmHard = () => false;
    const isBlueAt = (i) => d[i + 3] > 8 && d[i + 2] > 58 && d[i + 2] > d[i] * 1.48 && d[i + 2] > d[i + 1] * 1.32;
    const isWhiteAt = (i) => d[i + 3] > 8 && Math.min(d[i], d[i + 1], d[i + 2]) > 165;

    // 1. the old helmet logo: the clusters of white pixels on the shell (left of the facemask, in
    //    the middle of the helmet) that sit against the blue; the biggest one or two are the letters
    const ix0 = Math.round(hx0 + (hx1 - hx0) * 0.12), ix1 = Math.round(hx0 + (hx1 - hx0) * 0.62);
    const iy0 = Math.round(hy0 + (hy1 - hy0) * 0.12), iy1 = Math.round(hy0 + (hy1 - hy0) * 0.72);
    const seen = new Uint8Array(W * H), comps = [];
    for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) {
      const k = y * W + x; if (seen[k] || !isWhiteAt(k * 4)) continue;
      const stack = [k], pts = []; seen[k] = 1; let blueEdge = 0;
      while (stack.length) {
        const q = stack.pop(), qx = q % W, qy = (q - qx) / W; pts.push(q);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = qx + dx, ay = qy + dy; if (ax < ix0 || ax > ix1 || ay < iy0 || ay > iy1) continue;
          const a = ay * W + ax; if (seen[a]) continue;
          if (isWhiteAt(a * 4)) { seen[a] = 1; stack.push(a); } else if (isBlueAt(a * 4)) blueEdge++;
        }
      }
      if (pts.length >= 6 && blueEdge >= pts.length * 0.5) comps.push(pts);
    }
    comps.sort((a, b) => b.length - a.length);
    let lx0 = 1e9, ly0 = 1e9, lx1 = -1, ly1 = -1;
    for (const pts of comps.slice(0, 2)) for (const q of pts) { const qx = q % W, qy = (q - qx) / W; lx0 = Math.min(lx0, qx); lx1 = Math.max(lx1, qx); ly0 = Math.min(ly0, qy); ly1 = Math.max(ly1, qy); }
    if (lx1 - lx0 > (hx1 - hx0) * 0.5 || ly1 - ly0 > (hy1 - hy0) * 0.5) lx1 = -1; // not a logo after all
    const hasLogo = lx1 > lx0 + 3 && ly1 > ly0 + 3;

    // 2. recolor: blue to the uniform (helmet, jersey or socks), red to stripes, white pants tinted,
    //    the old number and logo painted out
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (d[i + 3] < 8) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2], bright = Math.max(r, g, b);
      const helm = x >= hx0 && x <= hx1 && y >= hy0 && y <= hy1;
      const inNum = !helm && x >= nx && x <= nx + nw && y >= ny && y <= ny + nh;
      const inLogo = hasLogo && x >= lx0 && x <= lx1 && y >= ly0 && y <= ly1;
      const blue = b > 58 && b > r * 1.48 && b > g * 1.32;
      const red = r > 110 && g < r * 0.36 && b < r * 0.55;
      const skin = !blue && !red && r > g && g > b && r - b > 35 && r > 70;
      const skin_ = skin && g > r * 0.5 && !(r < 150 && g < 80);
      const white = Math.min(r, g, b) > 150;
      let out = null;
      if (inLogo && (white || blue)) out = shade(C.helmet, white ? 1 : Math.max(0.39, Math.min(1.32, 0.37 + (bright / 255) * 0.87)));
      else if (inNum && !skin) out = shade(C.jersey, white ? 0.95 : 0.85);
      else if (blue) out = shade(helm ? C.helmet : y >= meta.sockY ? C.socks : C.jersey, Math.max(0.39, Math.min(1.32, 0.37 + (bright / 255) * 0.87)));
      else if (red) out = shade(helm ? C.stripe : y >= meta.sockY ? C.sockStripe : y > H * 0.5 ? C.pantsStripe : C.sleeve, Math.max(0.5, Math.min(1.18, 0.34 + bright / 255)));
      else if (pantsTint && white && !helm && y > H * 0.48 && y < meta.sockY) out = shade(C.pants, Math.max(0.68, Math.min(1.1, r / 238)));
      if (!out && skinC && skin_ && !helmHard(x, y)) out = shade(skinC, Math.max(0.35, Math.min(1.25, bright / 190)));
      if (out) { d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2]; }
    }
    ctx.putImageData(im, 0, 0);

    // 3. the team's logo on the shell, cut from its helmet art
    if (hasLogo && logoImg) {
      const lw = logoImg.naturalWidth, lh = logoImg.naturalHeight;
      const sx = Math.round(lw * 0.1), sy = Math.round(lh * 0.16), sw = Math.round(lw * 0.52), sh = Math.round(lh * 0.56);
      const pad = 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(logoImg, sx, sy, sw, sh, lx0 - pad, ly0 - pad, lx1 - lx0 + 1 + pad * 2, ly1 - ly0 + 1 + pad * 2);
    }

    // 4. face the other way if asked, then the number (never mirrored)
    let outC = c;
    if (facing === "left") {
      outC = document.createElement("canvas"); outC.width = W; outC.height = H;
      const fx = outC.getContext("2d"); fx.translate(W, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
    }
    const digits = number != null ? String(number).replace(/\D/g, "").slice(0, 2) : "";
    if (digits) {
      const ox = facing === "left" ? W - nx - nw : nx;
      const s = Math.max(1, Math.min(Math.floor((nw - 2) / (digits.length * 4 - 1)), Math.floor((nh - 2) / 5)));
      const tw = (digits.length * 4 - 1) * s, x0 = ox + Math.floor((nw - tw) / 2), y0 = ny + Math.floor((nh - 5 * s) / 2);
      const o = outC.getContext("2d"); o.setTransform(1, 0, 0, 1, 0, 0);
      const dot = (col) => [...digits].forEach((dg, k) => FONT[dg].forEach((row, yy) => [...row].forEach((bit, xx) => {
        if (bit === "1") col(x0 + (k * 4 + xx) * s, y0 + yy * s);
      })));
      o.fillStyle = u.numberEdge; dot((px, py) => o.fillRect(px - 1, py - 1, s + 2, s + 2));
      o.fillStyle = u.number; dot((px, py) => o.fillRect(px, py, s, s));
    }
    return outC.toDataURL("image/png");
  });
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  return job;
}

// What each roster position looks like at the snap, and after a touchdown.
export const snapPose = (pos, side) => {
  const p = String(pos || "").toUpperCase();
  if (["LT", "LG", "C", "RG", "RT", "OL", "OT", "OG", "G", "T"].includes(p)) return "OL";
  if (["DL", "DE", "DT", "NT", "LE", "RE", "EDGE"].includes(p)) return "DL";
  if (p === "QB") return "QB";
  if (["LB", "MLB", "OLB", "ILB"].includes(p)) return "LB";
  return side === "off" ? "DB" : "DB";
};
export const celebrationPose = (pos) => ({ RB: "RB", HB: "RB", FB: "RB", WR: "WR", TE: "TE" })[String(pos || "").toUpperCase()] || null;
