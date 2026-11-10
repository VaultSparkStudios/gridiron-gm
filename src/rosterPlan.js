// Build your 53: the off-season checklist on Home. A 53-man roster split by position group with a
// typical count for each, how many you have, and the best free agent still out there at each spot.
// In the combine and re-sign week it counts only players signed for next season, so a deal that's
// running out shows up as a hole to fill.
import { posTag } from "./dline.js";
import { askingPrice, ROSTER_TARGET } from "./offseason.js";

// A typical NFL 53: adds up to ROSTER_TARGET.
export const PLAN = [
  { key: "QB", label: "Quarterbacks", pos: ["QB"], want: 3 },
  { key: "RB", label: "Running backs", pos: ["RB"], want: 4 },
  { key: "WR", label: "Receivers", pos: ["WR"], want: 6 },
  { key: "TE", label: "Tight ends", pos: ["TE"], want: 3 },
  { key: "OL", label: "Offensive line", pos: ["LT", "LG", "C", "RG", "RT"], want: 9 },
  { key: "EDGE", label: "Edge rushers", pos: ["EDGE"], want: 4 },
  { key: "DT", label: "Interior line", pos: ["DT"], want: 5 },
  { key: "LB", label: "Linebackers", pos: ["LB"], want: 6 },
  { key: "CB", label: "Cornerbacks", pos: ["CB"], want: 6 },
  { key: "S", label: "Safeties", pos: ["S"], want: 5 },
  { key: "K", label: "Kicker", pos: ["K"], want: 1 },
  { key: "P", label: "Punter", pos: ["P"], want: 1 },
];

// roster: your players; fa: the free-agent pool. nextYear: count only players signed past this
// season. Returns { count, target, open, rows }, rows in PLAN order, each { key, label, want, have,
// short, top (best OVR, 0 if none), best (top free agent or null), ask, pos (the spot to filter
// free agency by) }.
export function rosterPlan(roster = [], fa = [], { nextYear = false } = {}) {
  const mine = nextYear ? roster.filter((p) => (p.contract ?? 2) >= 2) : roster;
  const rows = PLAN.map((g) => {
    const have = mine.filter((p) => g.pos.includes(posTag(p)));
    const best = fa.filter((p) => g.pos.includes(posTag(p))).sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0] || null;
    // the line: send you to the spot you're thinnest at
    const pos = g.pos.length > 1 ? [...g.pos].sort((a, b) => have.filter((p) => posTag(p) === a).length - have.filter((p) => posTag(p) === b).length)[0] : g.pos[0];
    return { key: g.key, label: g.label, want: g.want, have: have.length, short: Math.max(0, g.want - have.length), top: Math.max(0, ...have.map((p) => p.ovr || 0)), best, ask: best ? askingPrice(best) : null, pos };
  });
  return { count: mine.length, target: ROSTER_TARGET, open: Math.max(0, ROSTER_TARGET - mine.length), rows };
}
