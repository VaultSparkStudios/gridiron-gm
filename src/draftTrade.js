// Draft-day trade-down offers. While you're on the clock, clubs picking a few spots later call
// to move up. Like real draft-day deals they're priced on the classic Jimmy Johnson value chart:
// the club moving up sends its own pick plus enough extra picks (this year's, or next year's,
// which the chart counts a round lower) to cover the gap, usually with a small premium. You can
// only trade down: you always come out with more picks.
import { inDraftOrder } from "./draftProjection.js";

// Jimmy Johnson chart, picks 1-224.
const JJ_TOP = [3000, 2600, 2200, 1800, 1700, 1600, 1500, 1400, 1350, 1300, 1250, 1200, 1150, 1100, 1050, 1000, 950, 900, 875, 850, 800, 780, 760, 740, 720, 700, 680, 660, 640, 620, 600, 590,
  580, 560, 550, 540, 530, 520, 510, 500, 490, 480, 470, 460, 450, 440, 430, 420, 410, 400, 390, 380, 370, 360, 350, 340, 330, 320, 310, 300, 292, 284, 276, 270];
export function chartValue(overall) {
  if (overall <= 64) return JJ_TOP[overall - 1];
  if (overall <= 100) return 270 - (overall - 64) * 4.7; // 265 at #65 down to 100 at #100
  return Math.max(2, 100 - (overall - 100) * 0.79);
}
// A pick with no slot yet (next year's) counts as the middle of the round below it.
export const pickChartValue = (pk, thisYr) => (pk.overall && pk.yr === thisYr ? chartValue(pk.overall) : chartValue(Math.min(224, 16 + pk.rd * 32)));

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const seeded = (s) => { let x = hash(s) || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296; };

// What a club can add on top of its pick: its later picks this year, and next year's picks in
// rounds 1-4 that it still owns. futures: next year's picks already traded.
function assets(team, picks, futures, idx, theirPick, yr) {
  const now = picks.slice(idx + 1).filter((pk) => pk.owner === team && pk.id !== theirPick.id);
  const owned = (rd) => !futures.some((pk) => pk.yr === yr + 1 && pk.orig === team && pk.rd === rd);
  const next = [1, 2, 3, 4].filter(owned).map((rd) => ({ id: `fut-${team}-${yr + 1}-${rd}`, rd, yr: yr + 1, owner: team, orig: team, future: true }));
  return [...now, ...next];
}

// Up to three offers for the pick you're on the clock with. picks: this draft in order; futures:
// next year's picks already traded; idx: the pick on the clock; target(team): the prospect a club
// would come up for; bump: extra premium per club after you ask for more.
export function tradeDownOffers({ picks, futures = [], idx, ui, yr, teams, target = () => null, bump = {} }) {
  const cur = picks[idx];
  if (!cur || cur.owner !== ui) return [];
  const rand = seeded(`${cur.id}`);
  const window = cur.rd === 1 ? 14 : 20;
  const seen = new Set();
  const callers = [];
  for (const pk of picks.slice(idx + 2, idx + 2 + window)) {
    if (pk.owner === ui || seen.has(pk.owner) || pk.yr !== yr) continue;
    seen.add(pk.owner);
    if (rand() < 0.55) callers.push(pk); // not every club wants to move up
  }
  // Spread the calls: a short move, a medium one and a big one.
  const chosen = callers.length <= 3 ? callers : [callers[0], callers[Math.floor(callers.length / 2)], callers[callers.length - 1]];
  const mine = chartValue(cur.overall);
  const offers = [];
  for (const theirPick of chosen) {
    const team = theirPick.owner;
    const premium = 1.02 + rand() * 0.12 + (bump[team] || 0);
    let need = (mine - chartValue(theirPick.overall)) * premium;
    const pool = assets(team, picks, futures, idx, theirPick, yr).map((a) => ({ a, v: pickChartValue(a, yr) })).sort((x, y) => y.v - x.v);
    const extras = [];
    let got = 0;
    while (got < need * 0.97 && extras.length < 3 && pool.length) {
      const left = need - got;
      // The asset closest to what's still owed (a little over is fine; far over isn't offered).
      const fit = pool.filter((x) => x.v <= left * 1.35);
      const pickOne = (fit.length ? fit : pool.slice(-1))[0];
      if (!fit.length && pickOne.v > left * 2.5) break;
      extras.push(pickOne.a);
      got += pickOne.v;
      pool.splice(pool.indexOf(pickOne), 1);
    }
    if (got < need * 0.85) continue; // they can't afford it
    const value = chartValue(theirPick.overall) + got;
    const t = teams[team];
    offers.push({ id: `${cur.id}-${team}`, mine: cur.id, team, theirPick, extras, give: mine, get: Math.round(value), pct: Math.round((value / mine - 1) * 100), target: target(team), from: `${t.city} ${t.name}` });
  }
  return offers.sort((a, b) => a.theirPick.overall - b.theirPick.overall);
}

// A faller: the best prospect left is someone the board had well above your pick (6+ spots). The
// club behind you that needs his position most calls to jump you for him, and pays extra for it
// (more the farther he's fallen). board: the prospects still on the board; needOf(team, p): how
// badly that club needs his position (0..1). Returns one offer (faller: true) or null.
export function fallerCall({ picks, futures = [], idx, ui, yr, teams, board = [], needOf = () => 0, bump = {} }) {
  const cur = picks[idx];
  if (!cur || cur.owner !== ui || !cur.overall) return null;
  const rank = (p) => p.cons?.final ?? p.cons?.now ?? p.cons?.mid ?? 999;
  const p = [...board].filter((x) => x.pos !== "K" && x.pos !== "P").sort((a, b) => rank(a) - rank(b))[0];
  const fell = p ? cur.overall - rank(p) : 0;
  if (!p || fell < 6) return null;
  const window = cur.rd === 1 ? 14 : 20;
  const seen = new Set();
  let best = null;
  for (const pk of picks.slice(idx + 1, idx + 1 + window)) {
    if (pk.owner === ui || seen.has(pk.owner) || pk.yr !== yr) continue;
    seen.add(pk.owner);
    const n = needOf(pk.owner, p);
    if (n >= 0.3 && (!best || n > best.n)) best = { pk, n };
  }
  if (!best) return null;
  const rand = seeded(`${cur.id}|faller|${p.id}`);
  const theirPick = best.pk, team = theirPick.owner;
  const mine = chartValue(cur.overall);
  // priced on your whole pick, not just the gap: they'll pay 15-35% over the chart to get him
  const premium = 1.15 + rand() * 0.1 + Math.min(0.1, fell * 0.008) + (bump[best.pk.owner] || 0);
  const need = mine * premium - chartValue(theirPick.overall);
  const pool = assets(team, picks, futures, idx, theirPick, yr).map((a) => ({ a, v: pickChartValue(a, yr) })).sort((x, y) => y.v - x.v);
  const extras = [];
  let got = 0;
  while (got < need * 0.97 && extras.length < 3 && pool.length) {
    const left = need - got;
    const fit = pool.filter((x) => x.v <= left * 1.35);
    const pickOne = (fit.length ? fit : pool.slice(-1))[0];
    if (!fit.length && pickOne.v > left * 2.5) break;
    extras.push(pickOne.a);
    got += pickOne.v;
    pool.splice(pool.indexOf(pickOne), 1);
  }
  if (got < need * 0.85) return null;
  const value = chartValue(theirPick.overall) + got;
  const t = teams[team];
  return { id: `${cur.id}-${team}-faller`, mine: cur.id, team, theirPick, extras, give: mine, get: Math.round(value), pct: Math.round((value / mine - 1) * 100), target: p, faller: true, fell, from: `${t.city} ${t.name}` };
}

// Accept an offer: swap the picks and record the future picks you receive.
// Returns { picks, futures }.
export function acceptOffer(picks, futures, offer, ui) {
  const now = new Set(offer.extras.filter((a) => !a.future).map((a) => a.id));
  return {
    picks: picks.map((pk) => (pk.id === offer.theirPick.id || now.has(pk.id) ? { ...pk, owner: ui } : pk.id === offer.mine ? { ...pk, owner: offer.team } : pk)),
    futures: [...futures, ...offer.extras.filter((a) => a.future).map((a) => ({ id: a.id, rd: a.rd, yr: a.yr, owner: ui, orig: offer.team }))],
  };
}

// Next year's draft order with traded future picks going to their new owners.
export function applyFutures(order, yr, futures) {
  const out = [];
  for (let rd = 1; rd <= 7; rd++) order.forEach((tid, idx) => {
    const t = futures.find((pk) => pk.yr === yr && pk.orig === tid && pk.rd === rd && !pk.comp);
    out.push({ rd, num: idx + 1, overall: (rd - 1) * 32 + idx + 1, owner: t ? t.owner : tid, orig: tid, yr });
  });
  // compensatory picks come at the end of their round (rounds 3-7)
  futures.filter((pk) => pk.comp && pk.yr === yr).forEach((pk, i) => out.push({ id: pk.id ?? `comp-${yr}-${i}`, rd: pk.rd || 7, owner: pk.owner, orig: pk.orig, yr, comp: true }));
  return inDraftOrder(out, order.length);
}

export const pickLabel = (pk, yr) => (pk.future || pk.yr !== yr || !pk.overall ? `${pk.yr} Round ${pk.rd}` : `R${pk.rd} #${pk.overall}`);

// Trade-up calls: while another club is on the clock, you can phone the clubs picking between now
// and your next pick. A club will move down for your next pick plus enough of your other picks
// (later picks this year, next year's rounds 1-4) to cover the chart gap and a premium: moving up
// costs more than moving down earns. Returns up to `max` offers, nearest pick first.
export function tradeUpOffers({ picks, futures = [], idx, ui, yr, teams, max = 4 }) {
  const myIdx = picks.findIndex((pk, i) => i >= idx && pk.owner === ui && pk.yr === yr);
  if (myIdx < 0) return [];
  const seen = new Set();
  const offers = [];
  for (let i = idx; i < myIdx && offers.length < max; i++) {
    const theirPick = picks[i];
    if (theirPick.owner === ui || theirPick.yr !== yr || seen.has(theirPick.owner)) continue;
    seen.add(theirPick.owner);
    const q = quoteTradeUp({ picks, futures, i, myIdx, ui, yr, teams });
    if (q.offer) offers.push(q.offer);
  }
  return offers;
}

// What it takes to get one pick (picks[i]) for your next pick plus extras. Returns { offer }, or
// { no: "keep" } when the club won't move off the spot, { no: "cost" } when you can't cover the
// price, { no: "none" } when you have no later pick this year to build a deal around. The answer
// is the same every time you ask (seeded on the two picks), so asking again doesn't change it.
export function quoteTradeUp({ picks, futures = [], i, myIdx, ui, yr, teams }) {
  if (myIdx == null) myIdx = picks.findIndex((pk, k) => k > i && pk.owner === ui && pk.yr === yr);
  if (myIdx < 0 || myIdx <= i) return { no: "none" };
  const theirPick = picks[i], myPick = picks[myIdx];
  const mine = chartValue(myPick.overall);
  const rand = seeded(`${myPick.id}:${theirPick.id}`);
  if (rand() < 0.3) return { no: "keep" }; // some clubs love their spot
  const premium = 1.08 + rand() * 0.14;
  const need = (chartValue(theirPick.overall) - mine) * premium;
  const pool = assets(ui, picks, futures, myIdx, myPick, yr).map((a) => ({ a, v: pickChartValue(a, yr) })).sort((x, y) => y.v - x.v);
  const extras = [];
  let got = 0;
  while (got < need * 0.97 && extras.length < 3 && pool.length) {
    const left = need - got;
    const fit = pool.filter((x) => x.v <= left * 1.35);
    const pickOne = (fit.length ? fit : pool.slice(-1))[0];
    if (!fit.length && pickOne.v > left * 2.5) break;
    extras.push(pickOne.a);
    got += pickOne.v;
    pool.splice(pool.indexOf(pickOne), 1);
  }
  if (got < need * 0.9) return { no: "cost" };
  const t = teams[theirPick.owner];
  return { offer: { id: `up-${myPick.id}-${theirPick.id}`, team: theirPick.owner, theirPick, myPick, extras, give: Math.round(mine + got), get: chartValue(theirPick.overall), up: myPick.overall - theirPick.overall, from: `${t.city} ${t.name}` } };
}

// Accept a trade-up: their pick becomes yours; your pick and the extras go to them.
export function acceptTradeUp(picks, futures, offer, ui) {
  const give = new Set([offer.myPick.id, ...offer.extras.filter((a) => !a.future).map((a) => a.id)]);
  return {
    picks: picks.map((pk) => (pk.id === offer.theirPick.id ? { ...pk, owner: ui } : give.has(pk.id) ? { ...pk, owner: offer.team } : pk)),
    futures: [...futures, ...offer.extras.filter((a) => a.future).map((a) => ({ id: a.id, rd: a.rd, yr: a.yr, owner: offer.team, orig: ui }))],
  };
}

// Steal or reach: where a player went against where the consensus board had him.
export function pickValueTag(overall, csr) {
  if (!csr || csr >= 999) return null;
  const d = overall - csr; // positive: he lasted longer than he should have
  const big = Math.max(6, Math.round(overall * 0.25));
  if (d >= big) return { kind: "steal", d };
  if (-d >= Math.max(10, Math.round(overall * 0.4))) return { kind: "reach", d };
  return null;
}

// Tradeable picks in the next three drafts after `draftYr`, with their current owners (a pick
// nobody has traded belongs to its original club). Rounds 1-4, plus any later-round pick that
// has already changed hands. ahead: years after this draft (it lowers the pick's value).
export const FUTURE_YEARS = 3;
export function futurePickList(futures, draftYr, nTeams = 32) {
  const out = [];
  for (let ahead = 1; ahead <= FUTURE_YEARS; ahead++) {
    const y = draftYr + ahead;
    for (let rd = 1; rd <= 7; rd++) for (let orig = 0; orig < nTeams; orig++) {
      const rec = futures.find((pk) => pk.yr === y && pk.orig === orig && pk.rd === rd);
      if (rd > 4 && !rec) continue;
      out.push({ id: `fut-${orig}-${y}-${rd}`, rd, yr: y, orig, owner: rec ? rec.owner : orig, future: true, ahead });
    }
  }
  return out;
}
// Record a future pick changing hands.
export const moveFuture = (futures, pk, owner) => [...futures.filter((x) => !(x.yr === pk.yr && x.orig === pk.orig && x.rd === pk.rd)), { id: pk.id, rd: pk.rd, yr: pk.yr, orig: pk.orig, owner }];
