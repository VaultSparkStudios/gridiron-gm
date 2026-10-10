// The experts' mock draft: walk the draft order and give each club the prospect the analysts
// expect, which is the best player on the consensus board, nudged toward what the club needs
// (a QB-needy club reaches for a quarterback). Analysts disagree a little, so each pick also lists
// the other names linked to that club.
import { csRank } from "./scouting.js";

const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// How badly a club needs a position, in "board spots" it would reach: its weakest starter there.
export function needBonus(team, pos) {
  const ovrs = (team?.roster || []).filter((p) => p.pos === pos).map((p) => p.ovr).sort((a, b) => b - a);
  const weakest = ovrs[(STARTERS[pos] || 1) - 1] ?? 50;
  const base = weakest < 68 ? 7 : weakest < 74 ? 4 : weakest < 79 ? 2 : 0;
  return pos === "QB" ? (ovrs[0] ?? 50) < 76 ? 9 : 0 : pos === "K" || pos === "P" ? -40 : base;
}

// order: the picks to project, in order ({ id, rd, overall, owner }). cls: prospects still on
// the board. Returns [{ pick, player, alts }].
export function mockDraft({ order, cls, teams, seed = "mock" }) {
  const board = [...cls].sort((a, b) => csRank(a) - csRank(b));
  const out = [];
  for (const pick of order) {
    if (!board.length) break;
    const team = teams[pick.owner];
    // Analysts only look at the next dozen or so on the board, and never mock a kicker in round 1.
    const look = board.filter((p) => !["K", "P"].includes(p.pos) || pick.rd > 1).slice(0, pick.rd === 1 ? 12 : 16);
    const score = (p) => -csRank(p) + needBonus(team, p.pos) + ((hash(`${seed}:${pick.overall}:${p.id}`) % 5) - 2);
    const ranked = [...look].sort((a, b) => score(b) - score(a));
    const player = ranked[0];
    out.push({ pick, player, alts: ranked.slice(1, 3) });
    board.splice(board.indexOf(player), 1);
  }
  return out;
}
