// The free-agent market. Free agency runs over a few days. Every day AI clubs put offers on the
// players they'd start, and so can you; nobody signs just because an offer came first. A player
// weighs every offer on the table the same way (the money, plus the role, the scheme and the
// winning he cares about) and decides on his day: depth players sign the first fair deal, good
// players take a day or two, stars shop around. Only an extreme overpay gets a name on the
// paper right away.
import { yearlyAsk, maxYears, priorities, teamFit, fitPull, terms } from "./negotiation.js";
import { incentiveWorth } from "./contractDepth.js";

export const FA_DAYS = 4;
// below this the market doesn't bid: the first fair offer signs him (as it always has)
export const MARKET_MIN = 70;
// an offer this far over his ask, he signs on the spot
export const OVERPAY = 1.2;
// players at a position a club starts (his rating has to beat their last starter by this to bid)
const STARTS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const r1 = (x) => Math.round(x * 10) / 10;

// The day he makes up his mind (fixed per player and season).
export function decideDay(p, yr) {
  if (p.ovr < MARKET_MIN) return 1;
  const h = hash(`${p.id}:${yr}:day`);
  return p.ovr >= 85 ? (h < 0.5 ? 2 : 3) : h < 0.5 ? 1 : 2;
}
export const openMarket = (yr) => ({ yr, day: 1, bids: {} });

// What an offer is worth to him: the money (guarantees and incentives count a little), plus or
// minus how well that club gives him what he wants. Same weighing as your negotiation.
export function offerValue(p, bid, team) {
  const money = bid.sal * (1 + 0.06 * (bid.share || 0)) + incentiveWorth(bid.inc?.amt);
  return money * (1 + fitPull(priorities(p), teamFit(p, team)));
}
// The least he'd take per year for that many years (his hidden minimum, as in a negotiation).
export const needFor = (p, yrs, yr) => r1(yearlyAsk(p, yrs, "fa") * terms(p, { yr, mode: "fa" }).minF);
// Is your offer so far over his ask that he signs on the spot?
export const isOverpay = (p, bid) => bid.sal * (1 + 0.06 * (bid.share || 0)) >= yearlyAsk(p, bid.yrs, "fa") * OVERPAY;

// Put a club's offer on the table (replacing its earlier one). Returns the new market.
export function placeBid(market, pid, bid) {
  const list = (market.bids[pid] || []).filter((b) => b.team !== bid.team);
  return { ...market, bids: { ...market.bids, [pid]: [...list, bid] } };
}
export const bidsFor = (market, pid) => market?.bids?.[pid] || [];
// Money a club has promised in offers still open (it can't spend that twice).
export const committed = (market, team) => Object.values(market?.bids || {}).flat().filter((b) => b.team === team).reduce((a, b) => a + b.sal, 0);

const startBar = (t, pos) => {
  const r = t.roster.filter((p) => p.pos === pos).map((p) => p.ovr).sort((a, b) => b - a);
  return r[(STARTS[pos] || 1) - 1] ?? 0;
};

// How many clubs end up chasing one player: a star draws a handful, a solid starter a few.
export const maxSuitors = (p) => (p.ovr >= 85 ? 6 : p.ovr >= 78 ? 4 : 3);

// One day of AI offers: each club goes after the players who'd improve it most (they'd start,
// and by how much) that it can still pay after its open offers, up to `perTeam` new offers a day.
// Not every club chases every player, and a player only draws so many suitors. Returns the new market.
export function aiBids(teams, pool, ui, market, { capSpace, perTeam = 1, rand = Math.random } = {}) {
  let m = market;
  const order = teams.map((_, i) => i).filter((i) => i !== ui).sort(() => rand() - 0.5);
  const open = pool.filter((p) => p.ovr >= MARKET_MIN).sort((a, b) => b.ovr - a.ovr);
  for (const i of order) {
    const t = teams[i];
    let room = capSpace(t) - committed(m, i), made = 0;
    const wants = open.map((p) => [p, p.ovr - startBar(t, p.pos)]).filter(([, g]) => g >= 2).sort((a, b) => b[1] - a[1]); // he'd start there
    for (const [p] of wants) {
      if (made >= perTeam) break;
      const on = bidsFor(m, p.id);
      if (on.some((b) => b.team === i) || on.filter((b) => b.team !== ui).length >= maxSuitors(p)) continue;
      const yrs = Math.max(1, Math.min(maxYears(p), 2 + Math.floor(rand() * 3)));
      const sal = r1(yearlyAsk(p, yrs, "fa") * (0.9 + rand() * 0.22));
      if (sal > room || rand() < 0.4) continue;
      m = placeBid(m, p.id, { team: i, sal, yrs, day: m.day });
      room -= sal; made++;
    }
  }
  return m;
}

// Where a club's offer stands today: "lead" if he'd take it over the others right now, "behind"
// if another club's is better for him, null if that club hasn't offered. (His agent tells you.)
export function standing(p, market, teams, team) {
  const list = bidsFor(market, p.id);
  if (!list.some((b) => b.team === team)) return null;
  let best = null, top = -1;
  for (const b of list) { const v = offerValue(p, b, teams[b.team]) * (1 + hash(`${p.id}:${b.team}:gut`) * 0.03); if (v > top) { top = v; best = b; } }
  return best.team === team ? "lead" : "behind";
}

// The end of a day: everyone due to decide looks at his offers and takes the best one that meets
// his minimum. Nothing good enough yet: he waits for more (on the last day he takes the best
// within 10% of his minimum, or stays unsigned). Returns { market, signings: [{ p, bid }] } with
// those players' offers cleared; the caller signs them.
export function resolveDay(teams, pool, market, { last = false } = {}) {
  const signings = [], bids = { ...market.bids };
  // best players decide first; a club that fills a position drops its other offers there
  for (const p of [...pool].sort((a, b) => b.ovr - a.ovr)) {
    const list = bids[p.id];
    if (!list?.length || (!last && decideDay(p, market.yr) > market.day)) continue;
    let best = null, top = -1;
    for (const b of list) {
      const v = offerValue(p, b, teams[b.team]) * (1 + hash(`${p.id}:${b.team}:gut`) * 0.03);
      // an offer he already said yes to at the table (ok) always counts
      if ((b.ok || v >= needFor(p, b.yrs, market.yr) * (last ? 0.9 : 1)) && v > top) { top = v; best = b; }
    }
    if (!best) continue;
    signings.push({ p, bid: best });
    delete bids[p.id];
    for (const q of pool) if (q.pos === p.pos && bids[q.id]) bids[q.id] = bids[q.id].filter((b) => b.team !== best.team);
  }
  return { market: { ...market, bids }, signings };
}
