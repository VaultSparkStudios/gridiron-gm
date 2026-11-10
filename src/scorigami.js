// Scorigami: a final score that has never happened. A score counts as new once: if it isn't in
// NFL history (data/scorigami.js) and nobody in this league has put it up yet. log: the league's
// scorigamis so far ({ s: "11-9", yr, wk, h, a }), oldest first.
import { REAL_SCORES } from "./data/scorigami.js";

const REAL = new Set(REAL_SCORES.split(","));
export const scoreKey = (x, y) => `${Math.max(x, y)}-${Math.min(x, y)}`;
export const inNflHistory = (x, y) => REAL.has(scoreKey(x, y));
const same = (e, g, yr) => e.yr === yr && e.h === g.h && e.a === g.a && (e.wk ?? null) === (g.wk ?? null);

// The played games here whose final is new (each new score once, first game first).
export function newScorigamis(games, log, yr) {
  const seen = new Set((log || []).map((e) => e.s));
  const out = [];
  for (const g of games || []) {
    if (g?.hs == null || g?.as == null) continue;
    const s = scoreKey(g.hs, g.as);
    if (REAL.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push({ s, yr, wk: g.wk ?? null, h: g.h, a: g.a });
  }
  return out;
}

// Was this game a scorigami? (its score is in the league's log for this very game, or is new to
// everyone and not logged yet)
export function isScorigami(g, log, yr) {
  if (g?.hs == null || g?.as == null) return false;
  const s = scoreKey(g.hs, g.as);
  if (REAL.has(s)) return false;
  const e = (log || []).find((x) => x.s === s);
  return !e || same(e, g, yr);
}
