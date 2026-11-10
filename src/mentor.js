// Sitting and learning: a young quarterback who spends a season behind a veteran starter (30 or
// older) learns the position from him: his reads, his decisions, his feel in the pocket. It shows
// in those ratings and in a higher ceiling, the way Aaron Rodgers learned behind Brett Favre and
// Patrick Mahomes behind Alex Smith. A raw rookie thrown in as the starter grows faster now, but
// can pick up bad habits that cost him a little of his ceiling.

import { iqEdge } from "./qbiq.js";

export const MENTOR_AGE = 30; // the veteran he learns from
export const APPRENTICE_AGE = 25; // the oldest a quarterback still learns this way
export const MAX_YEARS = 3; // after three seasons on the bench there's nothing left to learn
export const MIND = ["decisions", "readDef", "pocketAwr"];

const ri = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const share = (p, games = 17) => Math.min(1, (p.ss?.snp || 0) / (games * 100));

// The veteran a young QB on this roster learns from: the club's 30-or-older starter, if it has one.
const memo = new WeakMap();
export function mentorOf(roster) {
  if (!Array.isArray(roster)) return null;
  if (memo.has(roster)) return memo.get(roster);
  const m = roster.filter((p) => p && p.pos === "QB" && p.age >= MENTOR_AGE && p.ovr >= 72 && share(p) >= 0.5).sort((a, b) => b.ovr - a.ovr)[0] || null;
  memo.set(roster, m);
  return m;
}

// Can he learn from a veteran right now? (He's young, early in his career, and not the starter.)
export const canApprentice = (p, yr) => !!p && p.pos === "QB" && p.age <= APPRENTICE_AGE && (p.draftYr == null || yr == null || yr - p.draftYr <= 3) && (p.mentored?.yrs || 0) < MAX_YEARS;

// How much the veteran has to teach: his own level and how well he processes the game.
export const mentorQuality = (m) => clamp((m.ovr + iqEdge(m) - 66) / 18, 0.25, 1.3);

// One off-season's worth: what sitting behind `mentor` (or starting too soon) did for him.
// Returns null when neither applies, else { ovr, pot, attrs, rec, note }.
export function mentorGrowth(p, roster, yr, rand = Math.random) {
  if (!canApprentice(p, yr)) return null;
  const s = share(p);
  const m = mentorOf(roster);
  if (m && m.id !== p.id && s < 0.35 && m.ovr >= p.ovr - 6) {
    const q = mentorQuality(m);
    const attrs = Object.fromEntries(MIND.map((k) => [k, Math.max(1, Math.round(ri(rand, 2, 4) * q))]));
    // the ceiling rises most in his first seasons of it, while he's still forming habits
    const first = (p.mentored?.yrs || 0) === 0;
    const pot = Math.max(0, Math.round((first ? ri(rand, 2, 4) : ri(rand, 1, 3)) * q));
    // practice reps and meeting-room work with a veteran: the bench costs him little growth
    const ovr = Math.round(ri(rand, 1, 3) * q);
    const prev = p.mentored || { yrs: 0, by: [], gain: 0 };
    const rec = { yrs: prev.yrs + 1, by: [...new Set([...prev.by, m.name])], gain: prev.gain + pot, last: yr };
    return { ovr, pot, attrs, rec, mentor: m.name, note: `learned behind ${m.name}: ${MIND.map((k) => `${LABEL[k]} +${attrs[k]}`).join(", ")}${pot ? `, ceiling +${pot}` : ""}` };
  }
  // thrown in as a raw rookie starter: he plays through it, but he can learn the wrong lessons
  const rookie = p.draftYr != null ? yr - p.draftYr <= 1 : (p.sh || []).length === 0;
  if (rookie && s >= 0.6 && p.ovr < 74 && iqEdge(p) < -8 && !p.mentored?.yrs && rand() < 0.3) {
    return { ovr: 0, pot: -1, attrs: { decisions: -1 }, rec: { yrs: 0, by: [], gain: -1, rushed: yr }, note: "started before he was ready and picked up some bad habits: ceiling -1" };
  }
  return null;
}

const LABEL = { decisions: "Decisions", readDef: "Read Def", pocketAwr: "Pocket" };

// Apply the attribute changes to his posAttrs.
export const bumpAttrs = (pa, attrs) => {
  if (!pa) return pa;
  const out = { ...pa };
  for (const [k, v] of Object.entries(attrs || {})) if (typeof out[k] === "number") out[k] = clamp(out[k] + v, 30, 99);
  return out;
};

// For the screens: is he learning from someone this season, and from whom?
export function learningFrom(p, roster, yr) {
  if (!canApprentice(p, yr)) return null;
  // the veteran who's playing ahead of him (before any snaps, the one rated above him)
  const mine = p.ss?.snp || 0;
  const vets = (roster || []).filter((q) => q && q.pos === "QB" && q.id !== p.id && q.age >= MENTOR_AGE && q.ovr >= 72 && q.ovr >= p.ovr - 6 && ((q.ss?.snp || 0) > mine * 2 + 50 || (!mine && !q.ss?.snp && q.ovr > p.ovr))).sort((a, b) => (b.ss?.snp || 0) - (a.ss?.snp || 0) || b.ovr - a.ovr);
  return vets[0] || null;
}
