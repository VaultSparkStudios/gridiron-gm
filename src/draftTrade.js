// Draft-day trade-down offers. While you're on the clock, clubs picking a few spots later call
// to move up. Like real draft-day deals they're priced on the classic Jimmy Johnson value chart:
// the club moving up sends its own pick plus enough extra picks (this year's, or next year's,
// which the chart counts a round lower) to cover the gap, usually with a small premium. You can
// only trade down: you always come out with more picks.

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
    const t = futures.find((pk) => pk.yr === yr && pk.orig === tid && pk.rd === rd);
    out.push({ rd, num: idx + 1, overall: (rd - 1) * 32 + idx + 1, owner: t ? t.owner : tid, orig: tid, yr });
  });
  return out;
}

export const pickLabel = (pk, yr) => (pk.future || pk.yr !== yr || !pk.overall ? `${pk.yr} Round ${pk.rd}` : `R${pk.rd} #${pk.overall}`);
