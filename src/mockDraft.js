// The experts' mock draft: walk the draft order and give each club the prospect the analysts
// expect, which is the best player on the consensus board, nudged toward what the club needs
// (a QB-needy club reaches for a quarterback). Analysts disagree a little, so each pick also lists
// the other names linked to that club.
import { csRank } from "./scouting.js";
import { teamNeeds, needGroup } from "./needs.js";

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// How badly a club needs a position, in "board spots" it would reach (needs.js: weak starters,
// aging or expiring ones, a thin bench). Kickers and punters never go in round 1.
export function needBonus(team, p) {
  const g = needGroup(typeof p === "string" ? { pos: p } : p);
  if (g === "K" || g === "P") return -40;
  const n = teamNeeds(team?.roster || []).score[g] ?? 0;
  return Math.round(n * (g === "QB" ? 12 : 9));
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
    const score = (p) => -csRank(p) + needBonus(team, p) + ((hash(`${seed}:${pick.overall}:${p.id}`) % 5) - 2);
    const ranked = [...look].sort((a, b) => score(b) - score(a));
    const player = ranked[0];
    out.push({ pick, player, alts: ranked.slice(1, 3) });
    board.splice(board.indexOf(player), 1);
  }
  return out;
}
