// The trade calls AI clubs make to you during the season. A club only calls about a player who
// fits where it is: a rebuilding club wants youth, not a 32-year-old, and an aging quarterback
// only interests a winning club looking for a cheap backup. It never pays more than the player
// is worth (a first-round pick is not on the table for a backup).

import { nflSeeds } from "./playoffs.js";
import { needGroup, NEED_STARTERS } from "./needs.js";
import { isFaceOf } from "./faceOfFranchise.js";
import { contractMult } from "./trade.js";
// what a player is worth in a deal: his trade value, priced up or down by his contract (an overpaid
// veteran is worth less, a bargain more). Read at trade time, never saved.
const tv = (p) => (p?.tradeVal || 0) * contractMult(p);

export const MAX_OVERPAY = 1.15; // the most an offer can be worth, as a multiple of your player
const MIN_FAIR = 0.75; // and the least

// The playoff race, once the standings mean something (5+ games): clubs in a playoff spot, or a
// game or less out of one, buy; clubs 2.5+ games out (or under .350) sell. Set by withRace()
// around the deadline and the weekly AI trades, so clubMode() reads the real race there.
let RACE = null;
export function raceModes(teams) {
  if (!teams?.length || teams.some((t) => t.id == null || !t.c)) return null;
  const played = teams.reduce((s, t) => s + (t.w || 0) + (t.l || 0) + (t.t || 0), 0) / teams.length;
  if (played < 5) return null;
  const out = {};
  for (const conf of [...new Set(teams.map((t) => t.c))]) {
    const seeds = nflSeeds(teams, conf);
    const last = teams.find((t) => t.id === seeds[seeds.length - 1]);
    for (const t of teams.filter((x) => x.c === conf)) {
      const g = (t.w || 0) + (t.l || 0) + (t.t || 0), pct = ((t.w || 0) + 0.5 * (t.t || 0)) / Math.max(1, g);
      const back = seeds.includes(t.id) ? 0 : ((last.w || 0) - (t.w || 0) + (t.l || 0) - (last.l || 0)) / 2;
      out[t.id] = pct < 0.35 || back >= 2.5 || (t.gmStyle === "rebuilder" && back > 0) ? "rebuild" : back <= 1 && pct >= 0.5 ? "contend" : "middle";
    }
  }
  return out;
}
export function withRace(teams, fn) { const prev = RACE; RACE = raceModes(teams); try { return fn(); } finally { RACE = prev; } }

// Where a club is: "rebuild" (losing, or built that way and not winning), "contend" (winning),
// or "middle". In the playoff race (see withRace) it's the standings that decide.
export function clubMode(t) {
  if (RACE && t && RACE[t.id]) return RACE[t.id];
  const g = (t.w || 0) + (t.l || 0);
  if (g >= 3 && (t.w || 0) / g < 0.4) return "rebuild";
  if (t.gmStyle === "rebuilder" && (t.w || 0) <= (t.l || 0)) return "rebuild";
  if (g >= 3 && (t.w || 0) > (t.l || 0)) return "contend";
  return "middle";
}

// Would he actually help this club? He has to start for them, or fill a spot where they're thin.
// Quarterbacks are strict: a club with a real starter (the Texans with Stroud) doesn't call about
// yours unless he's clearly better.
const STARTS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, EDGE: 2, DT: 2, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
export function fitsTeam(t, p) {
  const mine = (t?.roster || []).filter((x) => needGroup(x) === needGroup(p) && x.id !== p.id).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  if (p.pos === "QB") { const qb1 = mine[0]?.ovr || 0; return (p.ovr || 0) >= qb1 + 3 || qb1 < 72; }
  const n = NEED_STARTERS[needGroup(p)] || STARTS[p.pos] || 1;
  const nth = mine[n - 1]?.ovr || 0; // their worst starter there
  return (p.ovr || 0) > nth || mine.filter((x) => (x.ovr || 0) >= 65).length < n + 1;
}

// Would this club trade for him at all?
export function wantsPlayer(t, p) {
  const mode = clubMode(t);
  const old = p.pos === "QB" ? 31 : p.pos === "K" || p.pos === "P" ? 34 : 29;
  if (mode === "rebuild") return p.age <= (p.pos === "QB" ? 27 : 26);
  // A veteran quarterback is a contender's backup plan; nobody else calls about one.
  if (p.pos === "QB" && p.age >= old) return mode === "contend";
  return p.age <= old + 2;
}

// Picks (best first) adding up to between MIN_FAIR and MAX_OVERPAY of the target value: one pick
// if one fits, else two. Returns null when nothing fits.
export function fairPicks(pks, value, pkV) {
  const lo = value * MIN_FAIR, hi = value * MAX_OVERPAY;
  const ok = (v) => v >= lo && v <= hi;
  const one = pks.filter((pk) => ok(pkV(pk))).sort((a, b) => Math.abs(pkV(a) - value) - Math.abs(pkV(b) - value))[0];
  if (one) return [one];
  let best = null;
  for (let i = 0; i < pks.length; i++) for (let j = i + 1; j < pks.length; j++) {
    const v = pkV(pks[i]) + pkV(pks[j]);
    if (ok(v) && (!best || Math.abs(v - value) < best.d)) best = { d: Math.abs(v - value), pks: [pks[i], pks[j]] };
  }
  return best ? best.pks : null;
}

// One club's call about one of your players, or null. rand: () => [0, 1).
// What one club would offer for one of your players: an even player swap, a player plus a pick or
// two, or picks alone, worth MIN_FAIR to MAX_OVERPAY of him. null if it can't build a fair one.
function buildOffer(teams, fromTm, want, picks, pkV, rand) {
  const aiT = teams[fromTm], wv = tv(want) || 0, wPos = want.pos;
  const aiPks = (picks || []).filter((pk) => pk.owner === fromTm);
  const roll = rand();
  if (roll < 0.35) {
    const give = aiT.roster.filter((p) => tv(p) >= wv * MIN_FAIR && tv(p) <= wv * MAX_OVERPAY && p.pos !== wPos && !isFaceOf(p, aiT)).sort((a, b) => Math.abs(tv(a) - wv) - Math.abs(tv(b) - wv))[0];
    if (give) return { fromTm, give, want, givePicks: [], wantPicks: [] };
  }
  if (roll < 0.75) {
    const give = aiT.roster.filter((p) => tv(p) >= wv * 0.35 && tv(p) < wv * 0.85 && p.pos !== wPos && !isFaceOf(p, aiT)).sort((a, b) => tv(b) - tv(a))[0];
    if (give) {
      const gap = wv - tv(give);
      const pks = fairPicks(aiPks, gap, pkV);
      if (pks) return { fromTm, give, want, givePicks: pks, wantPicks: [] };
    }
  }
  const pks = fairPicks(aiPks, wv, pkV);
  return pks ? { fromTm, give: null, want, givePicks: pks, wantPicks: [] } : null;
}

// One club's call about one of your players, or null. Players you've put on the trade block draw
// most of the calls (from clubs thin at his position or chasing a title); otherwise a club asks
// about depth you can spare. rand: () => [0, 1).
export function genTradeOffer(teams, ui, picks, pkV, rand = Math.random) {
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const usT = teams[ui];
  const block = (usT?.roster || []).filter((p) => p.onBlock && !p.ftag && !p.injured);
  if (block.length && rand() < 0.8) {
    const want = block[ri(0, block.length - 1)];
    const fits = teams.map((t, i) => i).filter((i) => i !== ui && wantsPlayer(teams[i], want) && fitsTeam(teams[i], want));
    for (let k = fits.length - 1; k > 0; k--) { const j = ri(0, k); [fits[k], fits[j]] = [fits[j], fits[k]]; }
    for (const fromTm of fits.slice(0, 6)) { const o = buildOffer(teams, fromTm, want, picks, pkV, rand); if (o) return o; }
  }
  // Otherwise a club calls about one of your players who'd start for them (the biggest upgrade
  // over their own man first, with some luck in it). A few clubs are tried before the phone goes quiet.
  const aiIdxs = teams.map((_, i) => i).filter((i) => i !== ui);
  for (let k = aiIdxs.length - 1; k > 0; k--) { const j = ri(0, k); [aiIdxs[k], aiIdxs[j]] = [aiIdxs[j], aiIdxs[k]]; }
  for (const fromTm of aiIdxs.slice(0, 8)) {
    const aiT = teams[fromTm];
    const theirBest = (pos) => Math.max(0, ...(aiT.roster || []).filter((x) => x.pos === pos).map((x) => x.ovr || 0));
    const cands = (usT?.roster || []).filter((p) => (p.ovr || 0) >= 68 && !p.ftag && !p.injured && !p.suspended && p.pos !== "K" && p.pos !== "P" && wantsPlayer(aiT, p) && fitsTeam(aiT, p))
      .sort((a, b) => (b.ovr - theirBest(b.pos)) - (a.ovr - theirBest(a.pos)));
    if (!cands.length) continue;
    const want = cands[ri(0, Math.min(2, cands.length - 1))];
    const o = buildOffer(teams, fromTm, want, picks, pkV, rand);
    if (o) return o;
  }
  return null;
}
