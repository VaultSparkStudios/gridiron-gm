// Player renders for the big screens (player card, draft night, free agency, the Hall of Fame).
// Each team has six blank players (Lean, Athletic, Big; darker or lighter skin) and its own jersey
// digits; the game puts the player's number on his chest and lights him from above, once per
// look, and keeps the picture. The files and where each number goes come from
// public/players/manifest.json (art/tools/export_web.py), loaded the first time art is asked for.
//
// Some named players have their own custom render (Giants and Texans so far), shown while they
// play for that club. The Giants go further: a player who joins them later gets a ready-made render
// with his number already on it when its player looks like him (88 of them; retired numbers and
// other looks fall back to the blanks). A team without art: null, and the screen keeps the face.

import { PORTRAITS } from "./portraits.js";
import { rookieNum } from "./rookieNum.js";

const BASE = `${import.meta.env?.BASE_URL ?? "/"}players/`;
const norm = (n) => String(n || "").toLowerCase().replace(/[.'’]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z]+/g, " ").trim();

let manifest = null, loading = null;
export function loadArt() {
  if (manifest) return Promise.resolve(manifest);
  return (loading ||= fetch(`${BASE}manifest.json`).then((r) => (r.ok ? r.json() : null)).then((m) => {
    if (m) { m.darkIds = new Set(m.dark); m.original = new Set(m.nygOriginal.map(norm)); m.numbered = new Set(m.nygNumbered); }
    return (manifest = m);
  }).catch(() => null));
}

const LEAN = new Set(["QB", "WR", "CB", "S", "K", "P"]), BIG = new Set(["LT", "LG", "C", "RG", "RT", "OL"]);
export function buildOf(p) {
  if (LEAN.has(p.pos)) return "Lean";
  if (BIG.has(p.pos) || (p.pos === "DL" && (p.wt || 0) >= 280)) return "Big";
  return "Athletic";
}
// Darker or lighter skin: a real player's from his headshot (measured offline), a generated
// player's from his portrait, else from his drawn face.
const DARK_TAGS = ["black", "pacific"];
const TAGS = Object.fromEntries(PORTRAITS.map((q) => [q.id, q.tags]));
export function skinOf(p, m) {
  const f = p.face || {}, portraitTags = TAGS[f.pid];
  if (f.espn) return m.darkIds.has(f.espn) ? "Dark" : "Light";
  if (portraitTags) return portraitTags.some((t) => DARK_TAGS.includes(t)) ? "Dark" : "Light";
  const n = parseInt(String(f.sk || "#c68642").slice(1), 16), lum = (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
  return lum < 0.62 ? "Dark" : "Light";
}

// His number: the one he wears, or (a generated player who has none yet) the steady number his
// position would give him, the same one the draft-night jersey shows.
export const jerseyNum = (p) => { const n = p.num ?? rookieNum(p); return n >= 0 && n <= 99 ? n : null; };

// Which picture a player gets for a team: { key, file, num } (num: digits still to add) or null.
export function artFor(p, ab, m) {
  if (!p || !m || !ab) return null;
  const num = jerseyNum(p);
  // his own custom render, while he plays for the club whose uniform it shows (number already on it)
  const c = m.custom[norm(p.name)]?.[ab];
  if (c) return { key: `c:${ab}:${c[0]}`, file: `${ab}/c/${c[0]}.webp` };
  if (ab === "NYG") {
    // a new Giant: the render made for his number, if its player looks like him (skin), else the blanks
    if (!m.original.has(norm(p.name)) && num != null && m.numbered.has(num) && m.nygSkin?.[num] === skinOf(p, m)) { const n = String(num).padStart(2, "0"); return { key: `n:${n}`, file: `NYG/n/${n}.webp` }; }
  }
  const t = m.teams[ab];
  if (!t) return null;
  const kind = `${buildOf(p)}_${skinOf(p, m)}`;
  return { key: `${ab}:${kind}:${num ?? ""}`, file: `${ab}/${kind}.webp`, team: ab, kind, num };
}

const img = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// The lighting every render gets: a spotlight from above. The helmet and chest catch it, the arms,
// hands and legs fall into shadow (which also hides the small mistakes in the art), the edges darken,
// and the colour is pulled back a little, with extra contrast.
function grade(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h), px = d.data;
  for (let y = 0; y < h; y++) {
    const ly = Math.min(1.04, Math.max(0.2, 1.16 - Math.pow(y / h, 1.25) * 1.1));
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!px[i + 3]) continue;
      const dx = (x - w / 2) / (w / 2), lit = ly * (1 - 0.5 * dx * dx);
      const g = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
      for (let c = 0; c < 3; c++) {
        const v = (px[i + c] / 255) * 0.85 + g * 0.15;   // 15% less colour
        px[i + c] = Math.max(0, Math.min(255, ((v * lit - 0.5) * 1.15 + 0.5) * 255));
      }
    }
  }
  ctx.putImageData(d, 0, 0);
}

const made = new Map(), done = new Map();   // key -> the job; key -> its finished picture
// The finished picture (an object URL), made once per look and kept.
export function renderArt(a, m) {
  if (made.has(a.key)) return made.get(a.key);
  const job = (async () => {
    const base = await img(BASE + a.file), w = base.naturalWidth, h = base.naturalHeight;   // full size, so it stays sharp
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(base, 0, 0, w, h);
    if (a.num != null) {
      const t = m.teams[a.team], [cx, cy, nhF] = t.spots[a.kind], { h: dh, cells } = t.digits;
      const strip = await img(`${BASE}nums/${a.team}.webp`), s = String(a.num), nh = nhF * h;
      const ws = [...s].map((d) => (cells[d][1] * nh) / dh * (s.length > 1 ? 0.92 : 1)), gap = Math.max(1, nh * 0.04);
      let x = cx * w - (ws.reduce((t2, v) => t2 + v, 0) + gap * (s.length - 1)) / 2;
      [...s].forEach((d, i) => { ctx.drawImage(strip, cells[d][0], 0, cells[d][1], dh, x, cy * h - nh / 2, ws[i], nh); x += ws[i] + gap; });
    }
    grade(ctx, w, h);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/webp", 0.92));
    const url = URL.createObjectURL(blob);
    await new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = url; });   // decoded, so it shows the moment it's asked for
    done.set(a.key, url);
    return url;
  })().catch(() => null);
  made.set(a.key, job);
  return job;
}

// What a screen can show right now, without waiting: the finished picture, false (no art for him:
// show the face), or undefined (not known yet: show nothing, the picture is on its way).
export function artNow(p, ab) {
  if (!manifest) return undefined;
  const a = artFor(p, ab, manifest);
  return a ? done.get(a.key) : false;
}

// Make his picture ahead of time (the next screen's player), so it's ready when that screen opens.
export function primeArt(p, ab) {
  if (!p) return Promise.resolve(null);
  return loadArt().then((m) => { const a = m && artFor(p, ab, m); return a ? renderArt(a, m) : null; });
}
