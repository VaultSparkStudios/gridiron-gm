// Player grades, 0-100 like PFF's: 90+ elite, 80s high quality, 70s above average, 60s about
// average, 50s below, under 50 poor. The play engine (playsim.js gradeBook) grades every snap a
// man is involved in against what an average player would have done in the same spot: the same
// teammates, line, coverage and call. So a receiver piling up yards on a great offense grades
// lower than his numbers, and one producing on a bad one grades higher: the grade is him, not
// his team. Each facet is a sum and a count on the season line (qbG/qbN and so on); this turns
// them into grades against the league.
import { olLine, OL_POS, scale } from "./olStats.js";

// Each position's facets, measured over four simulated seasons of the real league (per-snap
// average and its spread among regulars, and a regular's snaps in a season):
// qb passing, rc receiving, ru rushing, pr pass rush, cv coverage, rd run defense.
const CAL = {
  QB: { qb: [0.026, 0.0331, 702] },
  WR: { rc: [0.171, 0.1168, 128] }, TE: { rc: [0.1838, 0.1125, 110] },
  RB: { ru: [-0.0141, 0.1133, 190], rc: [0.2275, 0.1237, 55] },
  DL: { pr: [-0.0012, 0.0161, 666], rd: [0.0005, 0.0079, 430] },
  LB: { rd: [-0.0013, 0.0252, 391], pr: [-0.0023, 0.0137, 586], cv: [-0.1565, 0.0591, 70] },
  CB: { cv: [-0.001, 0.0949, 109] },
  S: { rd: [-0.0007, 0.0132, 430], cv: [-0.0258, 0.1098, 32] },
};
// how each facet counts toward a position's overall grade (coverage by linebackers and safeties
// counts little: they're rarely the man thrown at, so a season of it barely carries over to the next)
const WEIGHT = { RB: { ru: 0.75, rc: 0.25 }, DL: { pr: 0.6, rd: 0.4 }, LB: { rd: 0.75, pr: 0.2, cv: 0.05 }, S: { rd: 0.8, cv: 0.2 } };
export const FACETS = { qb: "Passing", rc: "Receiving", ru: "Rushing", pr: "Pass rush", cv: "Coverage", rd: "Run defense", pb: "Pass block", rb: "Run block" };
// the sums and counts on a season line (kept out of game logs)
export const GRADE_KEYS = ["qbG", "qbN", "rcG", "rcN", "ruG", "ruN", "prG", "prN", "cvG", "cvN", "rdG", "rdN"];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A season line's grades for a position: { overall, facets: { key: grade } }, or null until he's
// played enough to say anything (a few games as a regular). A small sample is pulled toward
// average (a hot two weeks isn't an elite season).
export function gradesOf(s, pos) {
  if (!s) return null;
  if (OL_POS.has(pos)) {
    const o = olLine(s, pos);
    if (!o || o.passGrade == null) return null;
    const facets = { pb: o.passGrade, ...(o.runGrade != null ? { rb: o.runGrade } : {}) };
    return { overall: Math.round((o.runGrade != null ? 0.6 * o.passGrade + 0.4 * o.runGrade : o.passGrade) * 10) / 10, facets };
  }
  const cal = CAL[pos];
  if (!cal) return null;
  const facets = {}, zs = [];
  for (const [f, [mean, sd, reg]] of Object.entries(cal)) {
    const n = s[f + "N"] || 0;
    if (n < reg * 0.12) continue;
    const z = ((s[f + "G"] / n - mean) / sd) * (n / (n + reg * 0.3));
    facets[f] = scale(z);
    zs.push([z, WEIGHT[pos]?.[f] ?? 1]);
  }
  if (!zs.length) return null;
  const w = zs.reduce((a, [, x]) => a + x, 0), z = zs.reduce((a, [v, x]) => a + v * x, 0) / w;
  return { overall: scale(zs.length > 1 ? z * 1.1 : z), facets };
}

// the word for a grade, and its color
export const gradeWord = (g) => (g >= 90 ? "Elite" : g >= 80 ? "High quality" : g >= 70 ? "Above average" : g >= 60 ? "Average" : g >= 50 ? "Below average" : "Poor");
export const gradeColor = (g) => (g >= 90 ? "#22c55e" : g >= 80 ? "#84cc16" : g >= 70 ? "#eab308" : g >= 60 ? "#f59e0b" : g >= 50 ? "#f97316" : "#ef4444");
