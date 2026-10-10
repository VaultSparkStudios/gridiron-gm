// Trades between AI clubs during the season (through the week 9 deadline). A contender with a
// weak starter calls a rebuilding club that has a better veteran at that spot, and pays for him
// with draft picks and/or a young player worth about what he is. Franchise players and starting
// quarterbacks are never moved, and the buyer has to fit his salary under the cap. Players and
// picks really change hands.
import { clubMode } from "./tradeOffers.js";
import { isFranchisePlayer } from "./offseason.js";
import { tradeAway } from "./bonus.js";

export const TRADE_DEADLINE_WEEK = 9;
const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2 };
const FAIR = [0.9, 1.25];

// His team's weakest starter at a position (the bar a trade target has to clear).
function starterBar(t, pos) {
  const o = t.roster.filter((p) => p.pos === pos && !p.injured).map((p) => p.ovr).sort((a, b) => b - a);
  return o[(STARTERS[pos] || 1) - 1] ?? 40;
}
const isQB1 = (t, p) => p.pos === "QB" && p === [...t.roster].filter((q) => q.pos === "QB").sort((a, b) => b.ovr - a.ovr)[0];

// What the buyer sends: picks (best value fit first) and, if that's not enough, one young player
// the seller would want. Returns { picks, players, value } or null.
function payment(buyer, bi, picks, want, pkV) {
  const lo = want * FAIR[0], hi = want * FAIR[1];
  const own = picks.filter((pk) => pk.owner === bi).map((pk) => ({ pk, v: pkV(pk) })).sort((a, b) => b.v - a.v);
  const young = buyer.roster.filter((p) => p.age <= 25 && !isFranchisePlayer(p) && !isQB1(buyer, p) && p.tradeVal > 0).map((p) => ({ p, v: p.tradeVal })).sort((a, b) => b.v - a.v);
  // One or two picks.
  for (let i = 0; i < own.length; i++) {
    if (own[i].v >= lo && own[i].v <= hi) return { picks: [own[i].pk], players: [], value: own[i].v };
    for (let j = i + 1; j < own.length; j++) {
      const v = own[i].v + own[j].v;
      if (v >= lo && v <= hi) return { picks: [own[i].pk, own[j].pk], players: [], value: v };
    }
  }
  // A young player, topped up with a pick.
  for (const y of young) {
    if (y.v > hi) continue;
    if (y.v >= lo) return { picks: [], players: [y.p], value: y.v };
    const add = own.find((o) => y.v + o.v >= lo && y.v + o.v <= hi);
    if (add) return { picks: [add.pk], players: [y.p], value: y.v + add.v };
  }
  return null;
}

// One week of AI-to-AI trades. Mutates the clubs' rosters (arrays are replaced, not edited in
// place); returns { picks, trades }. capSpace(t): room under the cap. week: the week just played.
export function aiTradeWeek(teams, picks, ui, { week, pkV, capSpace, rand = Math.random, max = 1, odds: chance } = {}) {
  const out = { picks, trades: [] };
  if (week < 3 || week > TRADE_DEADLINE_WEEK) return out;
  // Quiet early, busier as the deadline nears.
  const odds = chance ?? (week >= TRADE_DEADLINE_WEEK - 1 ? 0.75 : 0.3);
  if (rand() > odds) return out;
  const idx = teams.map((_, i) => i).filter((i) => i !== ui);
  const buyers = idx.filter((i) => clubMode(teams[i]) === "contend").sort(() => rand() - 0.5);
  const sellers = idx.filter((i) => clubMode(teams[i]) === "rebuild");
  let made = 0;
  for (const bi of buyers) {
    if (made >= max) break;
    const buyer = teams[bi];
    const needs = Object.keys(STARTERS).map((pos) => ({ pos, bar: starterBar(buyer, pos) })).sort((a, b) => a.bar - b.bar); // weakest spot first
    for (const { pos, bar } of needs) {
      const options = sellers.flatMap((si) => teams[si].roster
        .filter((p) => p.pos === pos && p.ovr >= bar + 3 && p.age >= 27 && !p.injured && !isFranchisePlayer(p) && !isQB1(teams[si], p) && !p.ftag && (p.contract || 0) >= 1)
        .map((p) => ({ si, p })))
        .sort((a, b) => b.p.ovr - a.p.ovr);
      for (const { si, p } of options) {
        const pay = payment(buyer, bi, out.picks, p.tradeVal || 1, pkV);
        if (!pay) continue;
        const outgoing = pay.players.reduce((s, q) => s + (q.salary || 0), 0);
        if (capSpace(buyer) + outgoing < (p.salary || 0)) continue;
        const seller = teams[si];
        const sent = new Set(pay.players.map((q) => q.id));
        // Each club keeps the bonus of the player it sends as dead money (see bonus.js).
        const s2 = { ...seller }, b2 = { ...buyer }, ctx = { yr: 0, sp: "regular" };
        const arrive = tradeAway(p, s2, ctx), paid = pay.players.map((q) => tradeAway(q, b2, ctx));
        teams[si] = { ...s2, roster: [...seller.roster.filter((q) => q.id !== p.id), ...paid.map((q) => ({ ...q, onBlock: false }))] };
        teams[bi] = { ...b2, roster: [...buyer.roster.filter((q) => !sent.has(q.id)), { ...arrive, onBlock: false }] };
        const ids = new Set(pay.picks.map((pk) => pk.id));
        out.picks = out.picks.map((pk) => (ids.has(pk.id) ? { ...pk, owner: si } : pk));
        out.trades.push({ buyer: bi, seller: si, player: p, picks: pay.picks, players: pay.players });
        made++;
        break;
      }
      if (made && out.trades.at(-1)?.buyer === bi) break;
    }
  }
  return out;
}
