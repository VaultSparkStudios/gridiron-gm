// Trade Deadline Day, the way the NHL and Madden games stage it: the day after week 9 runs hour
// by hour from 9 AM to the 4 PM ET deadline. Each hour AI clubs make deals (contenders buying
// veterans from rebuilding clubs), the insiders' feed fills with breaking trades and rumors from
// the real state of the league, and your phone rings with offers. At 4 PM the window closes.
import { aiTradeWeek, TRADE_DEADLINE_WEEK } from "./aiTrades.js";
import { clubMode } from "./tradeOffers.js";
import { isFranchisePlayer } from "./offseason.js";

export const DEADLINE_HOURS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
export const LAST_HOUR = DEADLINE_HOURS.length - 1;
const POS_NAME = { QB: "quarterback", RB: "running back", WR: "receiver", TE: "tight end", LT: "left tackle", LG: "guard", C: "center", RG: "guard", RT: "right tackle", DL: "pass rusher", LB: "linebacker", CB: "cornerback", S: "safety", K: "kicker" };
const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2 };
const nm = (t) => `${t.city} ${t.name}`;
const rec = (t) => `${t.w || 0}-${t.l || 0}${t.t ? `-${t.t}` : ""}`;
const pick = (rand, xs) => xs[Math.floor(rand() * xs.length)];

// A trade as the feed reports it.
export function tradeText(x, teams, yr) {
  const b = teams[x.buyer], s = teams[x.seller];
  const got = [...x.players.map((p) => `${p.name} (${p.pos} ${p.ovr})`), ...x.picks.map((pk) => (pk.yr && pk.yr !== yr ? `a ${pk.yr} round ${pk.rd} pick` : `a round ${pk.rd} pick${pk.overall ? ` (#${pk.overall})` : ""}`))].join(" and ");
  return `The ${nm(b)} acquire ${x.player.name} (${x.player.pos} ${x.player.ovr}, age ${x.player.age}) from the ${nm(s)} for ${got}.`;
}

// Contenders and sellers, for the board.
export function marketBoard(teams, ui) {
  const row = (t, i) => ({ ti: i, ab: t.ab, name: nm(t), rec: rec(t) });
  const idx = teams.map((t, i) => [t, i]).filter(([, i]) => i !== ui);
  const byWins = (a, b) => (b[0].w || 0) - (a[0].w || 0) || (a[0].l || 0) - (b[0].l || 0);
  return {
    buyers: idx.filter(([t]) => clubMode(t) === "contend").sort(byWins).map(([t, i]) => row(t, i)),
    sellers: idx.filter(([t]) => clubMode(t) === "rebuild").sort((a, b) => -byWins(a, b)).map(([t, i]) => row(t, i)),
  };
}

const needOf = (t) => Object.keys(STARTERS)
  .map((pos) => ({ pos, bar: t.roster.filter((p) => p.pos === pos && !p.injured).map((p) => p.ovr).sort((a, b) => b - a)[STARTERS[pos] - 1] ?? 40 }))
  .sort((a, b) => a.bar - b.bar)[0]?.pos;

// What the insiders are hearing, from the real state of the league.
export function rumors(teams, ui, rand, n = 2) {
  const out = [];
  const { buyers, sellers } = marketBoard(teams, ui);
  const sellerVets = sellers.flatMap((s) => teams[s.ti].roster.filter((p) => p.age >= 27 && p.ovr >= 78 && !isFranchisePlayer(p) && !p.injured).map((p) => ({ s, p })));
  const stars = sellers.flatMap((s) => teams[s.ti].roster.filter((p) => isFranchisePlayer(p)).map((p) => ({ s, p })));
  const mine = (teams[ui]?.roster || []).filter((p) => p.onBlock);
  const make = [
    () => { const x = sellerVets.length && pick(rand, sellerVets); return x && { text: `Sources: the ${x.s.name} (${x.s.rec}) are taking calls on ${x.p.name} (${x.p.pos} ${x.p.ovr}, age ${x.p.age}).`, ti: x.s.ti }; },
    () => { const b = buyers.length && pick(rand, buyers); const need = b && needOf(teams[b.ti]); return need && { text: `The ${b.name} (${b.rec}) are hunting for a ${POS_NAME[need]} before 4 PM.`, ti: b.ti }; },
    () => { const x = stars.length && pick(rand, stars); return x && { text: `Don't expect ${x.p.name} to move: the ${x.s.name} are building around him, rebuild or not.`, ti: x.s.ti }; },
    () => { const b = buyers.length > 1 && pick(rand, buyers); return b && { text: `The ${b.name} have been one of the busiest teams on the phones this morning.`, ti: b.ti }; },
    () => { const p = mine.length && pick(rand, mine); return p && { text: `Several teams have checked in on your ${p.name} (${p.pos} ${p.ovr}). Nothing close yet.`, ti: ui, mine: true }; },
  ];
  for (let tries = 0; out.length < n && tries < 12; tries++) {
    const r = pick(rand, make)();
    if (r && !out.some((o) => o.text === r.text)) out.push({ kind: "rumor", ...r });
  }
  return out;
}

let seq = 0;
export const feedItem = (hour, o) => ({ id: `dl${Date.now().toString(36)}${(seq++).toString(36)}`, hour, ...o });

// The morning of deadline day.
export function startDeadline(teams, ui, yr, rand = Math.random) {
  const { buyers, sellers } = marketBoard(teams, ui);
  const feed = [
    feedItem(0, { kind: "news", text: `It's Trade Deadline Day. Teams have until 4:00 PM ET to make deals. ${buyers.length} clubs are buying, ${sellers.length} are selling.` }),
    ...rumors(teams, ui, rand, 3).map((r) => feedItem(0, r)),
  ];
  return { yr, hour: 0, feed, offers: [], deals: [], done: false };
}

// One hour of the day. genOffer(teams): an AI club's call to you, or null. Returns the new state,
// with teams and picks updated in place of the arrays passed in.
export function advanceDeadline(state, teams, picks, ui, { yr, pkV, capSpace, genOffer, rand = Math.random } = {}) {
  if (state.done) return { state, teams, picks };
  const hour = state.hour + 1;
  const last = hour >= LAST_HOUR;
  // The busiest hours are the last ones.
  const r = aiTradeWeek(teams, picks, ui, { week: TRADE_DEADLINE_WEEK, pkV, capSpace, rand, odds: last ? 0.95 : 0.6, max: last ? 3 : hour >= LAST_HOUR - 2 ? 2 : 1 });
  const fresh = r.trades.map((x) => feedItem(hour, { kind: "trade", text: tradeText(x, teams, yr), ti: x.buyer, big: x.player.ovr >= 85 }));
  const talk = last ? [] : rumors(teams, ui, rand, rand() < 0.5 ? 1 : 2).map((x) => feedItem(hour, x));
  // Offers you sat on for two hours are pulled; new calls come in.
  const kept = state.offers.filter((o) => hour - o.hour < 2 && !last);
  const pulled = state.offers.filter((o) => !kept.includes(o));
  const calls = [];
  if (!last && genOffer) for (let k = 0; k < 5 && calls.length < (rand() < 0.5 ? 1 : 2) + ((teams[ui]?.roster || []).some((p) => p.onBlock && p.ovr >= 85) ? 1 : 0); k++) {
    const o = genOffer(teams);
    // Several clubs can bid on the same player (a star on the block draws a crowd); one call per club per player.
    const same = (x) => x.want.id === o.want.id && x.fromTm === o.fromTm;
    if (o && !kept.some(same) && !calls.some(same)) calls.push({ ...o, id: feedItem(hour, {}).id, hour });
  }
  const news = [
    ...(last ? [feedItem(hour, { kind: "news", text: `4:00 PM ET: the trade deadline has passed. ${state.deals.length + r.trades.length} trade${state.deals.length + r.trades.length === 1 ? " was" : "s were"} made today.` })] : []),
    ...pulled.filter(() => !last).map((o) => feedItem(hour, { kind: "mine", text: `The ${nm(teams[o.fromTm])} pulled their offer for ${o.want.name}.` })),
  ];
  return {
    teams,
    picks: r.picks,
    state: { ...state, hour, done: last, offers: [...kept, ...calls], deals: [...state.deals, ...r.trades.map((x) => ({ ...x, hour }))], feed: [...news, ...fresh, ...talk, ...state.feed] },
  };
}

// Run the whole day with no calls to you (Sim All).
export function runDeadline(teams, picks, ui, opts) {
  let s = startDeadline(teams, ui, opts.yr, opts.rand);
  let p = picks;
  while (!s.done) { const r = advanceDeadline(s, teams, p, ui, { ...opts, genOffer: null }); s = r.state; p = r.picks; }
  return { state: s, picks: p };
}

// Who's available: the league's trade block, the way clubs really shop players at the deadline.
// Rebuilding clubs make their veterans available; every club shops expiring deals it won't
// re-sign and depth it doesn't need. Franchise players and starting quarterbacks are never on it.
// Returns [{ p, ti, why }], best first.
export function leagueTradeBlock(teams, ui) {
  const out = [];
  teams.forEach((t, ti) => {
    if (ti === ui) return;
    const mode = clubMode(t);
    const qb1 = [...t.roster].filter((p) => p.pos === "QB").sort((a, b) => b.ovr - a.ovr)[0];
    const depth = {};
    for (const pos of Object.keys(STARTERS)) depth[pos] = t.roster.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
    for (const p of t.roster) {
      if (p === qb1 || p.injured || p.ftag || p.ovr < 68 || p.pos === "K" || p.pos === "P" || isFranchisePlayer(p)) continue;
      const rank = (depth[p.pos] || []).indexOf(p);
      const backup = rank >= (STARTERS[p.pos] || 1);
      let why = null;
      if (mode === "rebuild" && p.age >= 27 && p.ovr >= 70) why = "Rebuilding: veterans available";
      else if (mode !== "contend" && (p.contract || 0) <= 1 && p.age >= 26 && p.ovr >= 72) why = "Expiring contract";
      else if (backup && p.ovr >= (mode === "contend" ? 75 : 72)) why = `Surplus at ${p.pos}`;
      if (why) out.push({ p, ti, why });
    }
  });
  return out.sort((a, b) => b.p.ovr - a.p.ovr);
}
