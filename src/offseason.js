// The NFL off-season, in league order: contracts expire when free agency opens (teams keep the
// core players they re-sign), clubs sign free agents to fill their needs, and before the next
// season every roster is topped up from the real players still on the market. No player is
// ever invented here.

import { leagueCap, leagueMin, getLeagueYear } from "./cap.js";
import { freshDeal, deadMoney, chargeDead, restructure } from "./bonus.js";
import { retireAge } from "./retirement.js";
import { faceOf, isFaceOf } from "./faceOfFranchise.js";
import { rolePay } from "./roles.js";
import { naturalDL } from "./dline.js";

// A club releases a player into the pool. His remaining signing-bonus proration stays on its cap
// as dead money, the same rule as your releases (AI cuts used to cost nothing, so by the late 2020s
// no club carried any dead money at all). Counted as an in-season cut: this year's share now, the
// rest next year.
function release(t, p, pool, from) {
  t.roster.splice(t.roster.indexOf(p), 1);
  chargeDead(t, deadMoney(p, { yr: getLeagueYear(), sp: "preseason" }));
  pool.push({ ...p, contract: 0, formerTeam: from });
}
import { optionEligible, aiTakesOption, optionPrice, tagPrice } from "./contracts.js";
import { priorities, teamFit, fitPull } from "./negotiation.js";

// Fewest players a club carries at each position.
// How much a club wants to keep a player: his rating, plus half his remaining upside while he's young.
// Who a club keeps at cut-down: rating, plus a young player's upside; a veteran nearing his
// position's retirement age has to be clearly better than the kid behind him to stay.
export const keepScore = (p) => (p.ovr || 0) + (p.age <= 24 ? Math.max(0, (p.pot ?? p.ovr) - p.ovr) * 0.5 : 0) + (p.age <= 25 ? 2 : 0) - Math.max(0, (p.age || 0) - (retireAge(p) - 4)) * 1.5;
export const ROSTER_MIN = { QB: 2, RB: 3, WR: 5, TE: 3, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 7, LB: 5, CB: 5, S: 4, K: 1, P: 1 };
export const ROSTER_TARGET = 53;

const roll = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));

// Opening free agency for the season after `yr`. Every contract loses a year; the ones that
// run out either get re-signed (AI clubs keep most of their core) or hit the market. Players
// three years past their position's retirement age or rated under 45 retire instead. Everyone touched is stamped cy = yr + 1 so the season
// rollover does not count the year twice.
export function openFreeAgency(teams, ui, yr, rand = Math.random, { cap = leagueCap(), room = cap * 0.06 } = {}) {
  const cy = yr + 1;
  const pool = [], mine = [], resigned = [], retired = [];
  const out = teams.map((t, i) => {
    const roster = [], expiring = [];
    for (const p of t.roster) {
      const left = (p.contract || 0) - 1;
      if (left > 0) roster.push({ ...p, contract: left, cy });
      else expiring.push(p.ftag ? { ...p, ftag: undefined } : p); // a tag lasts one year
    }
    // a deal's void years come due when it ends
    const voidDue = expiring.reduce((s, p) => s + (p.voidDead || 0), 0);
    for (let k = 0; k < expiring.length; k++) if (expiring[k].voidDead) { const { voidDead, voidYrs, ...rest } = expiring[k]; expiring[k] = rest; }
    // AI clubs re-sign best players first, and only what fits under the cap (with room for
    // coaches and the draft class).
    let payroll = roster.reduce((s, p) => s + (p.salary || 0), 0);
    let tagged = false; // one franchise tag per club
    // Franchise players first (QBs ahead of everyone), then by rating, so a club never spends
    // its room on lesser starters and loses its young star.
    // The club's starting quarterback (its best, counting the expiring ones) is kept like a
    // franchise player while he's a real starter and not old.
    const qb1 = [...t.roster, ...expiring].filter((p) => p.pos === "QB").sort((a, b) => b.ovr - a.ovr)[0];
    // and the face of the franchise (faceOfFranchise.js) is re-signed every time, to the end
    const face = faceOf({ ...t, roster: [...t.roster, ...expiring] });
    const isCore = (p) => isFranchisePlayer(p) || (face && p.id === face.id) || (p === qb1 && p.ovr >= 76 && p.age <= 34);
    const core = (p) => (isCore(p) ? 3 : 0) + (keepChance(p) >= 0.95 ? (p.pos === "QB" ? 2 : 1) : 0);
    for (const p of expiring.sort((a, b) => core(b) - core(a) || b.ovr - a.ovr)) {
      // A first-round pick finishing his rookie deal: the club picks up his fifth-year option
      // if he became a solid starter (a set price, one more year).
      if (i !== ui && optionEligible(p, yr) && aiTakesOption(p) && !isFranchisePlayer(p)) {
        const salary = optionPrice(teams, p, cap);
        if (payroll + salary <= cap) {
          roster.push({ ...p, contract: 1, salary, opt5: true, cy });
          payroll += salary;
          resigned.push({ p, team: i, how: "option" });
          continue;
        }
      }
      const keep = keepChance(p);
      const salary = +Math.max(Math.min(p.salary || 1, askingPrice(p)), askingPrice(p) * (0.95 + rand() * 0.15) * Math.min(1.1, p.perf?.f ?? 1)).toFixed(1); // market, not a small raise; his last season counts (up to +10%)
      // A young franchise player is kept even if it means cap casualties: the club cuts its
      // priciest non-core contracts (up to five) to make room, as real teams do before tagging; it
      // refills the roster in free agency and the draft. A club that still can't fit him is truly
      // cap-strapped and he walks.
      // For a franchise player the club also gives up its cap cushion (restructures, as real
      // teams do for a young QB); everyone else has to fit with room to spare.
      const limit = keep >= 0.95 || isCore(p) ? cap : cap - room;
      // A franchise player goes further: the club cuts whoever it takes (never another franchise
      // player), and if he still doesn't fit it tags him anyway and sorts the cap out later.
      const star = isCore(p);
      if (i !== ui && (keep >= 0.95 || star) && payroll + salary > limit) {
        const cuts = roster.filter((q) => (star ? !isCore(q) && q.ovr < p.ovr : q.ovr < 80)).sort((a, b) => (b.salary || 0) - (a.salary || 0)).slice(0, star ? 12 : 5);
        for (const q of cuts) {
          if (payroll + salary <= limit || roster.length <= 30) break;
          roster.splice(roster.indexOf(q), 1);
          payroll -= q.salary || 0;
          pool.push({ ...q, contract: 0, cy, formerTeam: i, gl: [], av: 0 });
        }
      }
      if (i !== ui && (star || (rand() < keep && payroll + salary <= limit))) {
        // A franchise player who still doesn't fit a long-term deal gets the franchise tag.
        const tag = star && payroll + salary > limit && !tagged;
        const deal = tag ? { ...freshDeal(p), sb: 0, contract: 1, salary: tagPrice(teams, p, cap), ftag: true, tagYr: yr, cy } : { ...freshDeal(p), contract: faYears(p, rand), salary, cy }; // a star in his prime gets a long deal, a veteran a short one
        if (tag) tagged = true;
        roster.push(deal);
        payroll += deal.salary;
        resigned.push({ p, team: i, how: tag ? "tag" : "deal" });
        continue;
      }
      // well past his position's retirement age, or no longer an NFL player
      if (p.age >= retireAge(p) + 3 || p.ovr < 45) { retired.push({ p, team: i }); continue; }
      const fa = { ...p, contract: 0, cy, formerTeam: i, ss: p.ss, gl: [], av: 0 };
      pool.push(fa);
      if (i === ui) mine.push(fa);
    }
    return { ...t, roster, ...(voidDue ? { deadCap: +((t.deadCap || 0) + voidDue).toFixed(1) } : {}) };
  });
  pool.sort((a, b) => b.ovr - a.ovr);
  return { teams: out, pool, mine, resigned, retired };
}

// A franchise player: a superstar in or before his prime (90+ at 29 or younger, or 86+ with an
// elite development trait or an X-Factor at 27 or younger; QBs three years later). AI clubs build
// around these players: they never let one walk, cut anyone else to keep him and tag him if
// they have to. t: his club, when known: its face (a career-long star, faceOfFranchise.js) counts too.
export function isFranchisePlayer(p, t = null) {
  if (t && isFaceOf(p, t)) return true;
  const a = p.pos === "QB" ? p.age - 3 : p.age;
  if (p.pos === "K" || p.pos === "P") return false;
  if (p.ovr >= 90 && a <= 29) return true;
  return p.ovr >= 86 && a <= 27 && (p.xf || p.dev === "superstar" || p.dev === "generational");
}

// Positions where a roster is below its minimum: [{ pos, have, min }].
export const shortGaps = (t) => Object.entries(ROSTER_MIN).map(([pos, min]) => ({ pos, min, have: (t.roster || []).filter((p) => p.pos === pos).length })).filter((g) => g.have < g.min);

// How likely an AI club is to keep its own player whose deal is up. Young stars almost never
// reach the market (extension or the tag); the market gets veterans, mid-tier starters and the
// stars of clubs that can't fit them under the cap. QBs age about three years later.
export function keepChance(p) {
  if (isFranchisePlayer(p)) return 1;
  const a = p.pos === "QB" ? p.age - 3 : p.age;
  if (p.ovr >= 88) return a <= 28 ? 0.98 : a <= 30 ? 0.85 : a <= 32 ? 0.5 : 0.25;
  if (p.ovr >= 82) return a <= 27 ? 0.85 : a <= 29 ? 0.65 : a <= 31 ? 0.35 : 0.15;
  if (p.ovr >= 76) return a <= 26 ? 0.6 : a <= 29 ? 0.35 : 0.1;
  return 0;
}

// What a player asks for on a new deal: what the real market pays a player of his standing at his
// position. Each position's 2026 ratings by league rank (the best, the 3rd, 5th, 10th... 128th)
// are matched to the 2025 average salaries at those ranks (OverTheCap), as shares of the 2025 cap,
// so the 10th-best receiver asks what the 10th-best receiver gets ($28M, 10% of the cap) and a
// 32nd-best one a WR2's money. Pass rushers and interior linemen have their own markets. Less once
// he's past his prime (QBs age four years later, kickers six). cap: the cap for the league year the deal starts.
const RANKS = [1, 3, 5, 10, 20, 32, 50, 64, 96, 128];
const PAY_CAP = 279.2;
const OL_G = [23, 20.5, 19, 16, 10, 5, 2, 1.4];
const MARKET = {
  QB: [[99, 97, 94, 89, 80, 73, 68, 65], [60, 55, 55, 52, 38, 22, 6, 2.5]],
  RB: [[98, 97, 95, 89, 84, 81, 77, 75, 71, 66], [20.6, 16, 14, 10.5, 7, 4, 2.5, 1.8, 1.2, 1]],
  WR: [[99, 98, 96, 91, 86, 83, 80, 78, 75, 72], [40.25, 34, 32.5, 28.5, 23, 18, 12, 8.5, 4, 2]],
  TE: [[99, 95, 90, 85, 80, 76, 71, 69, 65], [19, 17, 15, 12, 7, 4, 2, 1.4, 1.1]],
  LT: [[98, 96, 94, 90, 81, 74, 67], [28.5, 26.5, 25, 22, 16, 10, 3]],
  LG: [[96, 89, 84, 80, 75, 72, 66], OL_G],
  RG: [[96, 93, 87, 83, 77, 73, 69, 66], OL_G],
  C: [[96, 88, 86, 81, 75, 71, 66], [18, 14, 13, 10, 5.5, 3, 1.5]],
  RT: [[90, 87, 85, 83, 76, 72, 66], [28, 25, 20, 16, 10, 5, 2]],
  EDGE: [[99, 97, 95, 90, 85, 81, 78, 77, 74, 71], [46.5, 41, 36, 30, 24, 18, 10, 6, 2.5, 1.5]],
  DT: [[96, 95, 94, 90, 84, 80, 77, 76, 73, 70], [31.75, 27.5, 24, 20, 15, 10, 5, 3, 1.5, 1.1]],
  LB: [[98, 93, 89, 86, 83, 80, 76, 75, 70, 66], [21, 18, 16, 13.5, 10, 7, 4, 2.8, 1.5, 1.1]],
  CB: [[98, 96, 92, 88, 85, 82, 79, 77, 75, 72], [30.5, 26, 24, 20, 16, 12, 7, 5, 2.5, 1.3]],
  S: [[94, 93, 92, 89, 83, 80, 78, 76, 72, 67], [25, 19.5, 18, 15.5, 11, 8, 5, 3.5, 1.6, 1.1]],
  K: [[87, 84, 82, 81, 77, 72], [7, 5.5, 5.2, 4.3, 3, 1.5]],
  P: [[85, 81, 80, 79, 75, 72], [4.6, 3.8, 3.6, 3.2, 2.5, 1.4]],
};
export const MIN_SHARE = 0.0033;
// His market as a share of the cap, from his rating against the league (see marketRating).
export function marketShare(r, key) {
  const [ovr, pay] = MARKET[key] || MARKET.LB;
  const sh = (k) => pay[k] / PAY_CAP, n = Math.min(ovr.length, pay.length);
  if (r >= ovr[0]) return sh(0) * Math.min(1.06, 1 + 0.015 * (r - ovr[0])); // better than anyone today
  for (let k = 0; k < n - 1; k++) {
    if (r > ovr[k + 1] || (r === ovr[k + 1] && ovr[k + 1] < ovr[k])) {
      const lo = ovr[k + 1], hi = ovr[k];
      return hi === lo ? sh(k) : sh(k + 1) + (sh(k) - sh(k + 1)) * (r - lo) / (hi - lo);
    }
  }
  // below the last ranked starter: down to the minimum over six points
  const last = sh(n - 1), lo = ovr[n - 1];
  return Math.max(MIN_SHARE, last - (last - MIN_SHARE) * (lo - r) / 6);
}
const marketKey = (p) => (p.pos === "DL" ? naturalDL(p) : p.pos);
// Players are priced against today's league, not a fixed rating. Ratings drift up over the seasons
// (development outpaces aging at the top), so an 80 in 2032 is a more ordinary starter than an 80
// in 2026. The market knows: each position is priced by how its rating compares with the league's
// starters there now, against the real 2026 rosters (the average of the top 32 x starters).
const MARKET_2026 = { QB: 83.6, RB: 87.2, WR: 81.6, TE: 82.8, LT: 84.8, LG: 78.5, C: 78, RG: 80.2, RT: 79.3, DL: 82.5, LB: 78, CB: 83, S: 81.8, K: 78.3, P: 76.8 };
const MARKET_N = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
let marketShift = {};
// Call with every club when the league changes (the app does it each time the rosters change).
// Returns the shift per position (how many points better the league's starters are than in 2026).
let marketTeams = [];
export function setMarket(teams) {
  marketShift = leagueShift(teams);
  marketTeams = teams || [];
  return marketShift;
}
// The league's contracts at his market (EDGE and DT apart), biggest first, without him:
// [{ id, name, ab, ovr, age, sal, face }] for the negotiation table's market ladder.
export function marketLadder(p, teams = marketTeams) {
  const key = marketKey(p), out = [];
  teams.forEach((t) => (t.roster || []).forEach((q) => { if (q.id !== p.id && marketKey(q) === key && (q.salary || 0) > 0) out.push({ id: q.id, name: q.name, ab: t.ab, ovr: q.ovr, age: q.age, sal: q.salary, face: q.face }); }));
  return out.sort((a, b) => b.sal - a.sal);
}
// How many points better the league's starters are than in 2026, per position (-4..8).
export function leagueShift(teams) {
  const by = {};
  for (const t of teams || []) for (const p of t.roster || []) (by[p.pos] ||= []).push(p.ovr || 0);
  const out = {};
  for (const [pos, base] of Object.entries(MARKET_2026)) {
    const o = (by[pos] || []).sort((a, b) => b - a).slice(0, 32 * MARKET_N[pos]);
    if (o.length >= 16 * MARKET_N[pos]) out[pos] = Math.max(-4, Math.min(8, +(o.reduce((a, b) => a + b, 0) / o.length - base).toFixed(1)));
  }
  return out;
}
export const marketRating = (p) => (p.ovr || 0) - (marketShift[p.pos] || 0);

export const askingPrice = (p, cap = leagueCap()) => {
  const a = p.age - (p.pos === "QB" ? 4 : p.pos === "K" || p.pos === "P" ? 6 : 0); // kickers last longest
  const age = a >= 34 ? 0.5 : a >= 32 ? 0.7 : a >= 30 ? 0.85 : 1;
  return +Math.max(cap * MIN_SHARE, cap * marketShare(marketRating(p), marketKey(p)) * age * rolePay(p)).toFixed(1); // a SAM or slot corner costs less than a MIKE or outside corner
};

// The position a club most needs: furthest below its minimum, then the weakest starter.
function needs(t) {
  const by = {};
  for (const p of t.roster) (by[p.pos] ||= []).push(p.ovr);
  return Object.keys(ROSTER_MIN)
    .map((pos) => ({ pos, short: ROSTER_MIN[pos] - (by[pos]?.length || 0), best: Math.max(0, ...(by[pos] || [0])) }))
    .sort((a, b) => b.short - a.short || a.best - b.best)
    .map((x) => x.pos);
}

// How long a free agent signs for: a starter in his prime gets a real multi-year deal, a veteran
// near the end a short one, a depth player a year or two.
export const careerAge = (p) => (p.age || 27) - (p.pos === "QB" ? 3 : p.pos === "K" || p.pos === "P" ? 5 : 0);
export const faYears = (p, rand = Math.random) => {
  const age = careerAge(p), ovr = p.ovr || 0; // a 33-year-old quarterback signs like a 30-year-old
  const [lo, hi] = ovr < 72 ? [1, 2] : age <= 27 ? (ovr >= 85 ? [4, 5] : ovr >= 80 ? [3, 5] : [2, 4]) : age <= 29 ? [2, 4] : age <= 32 ? [1, 3] : [1, 2];
  return roll(rand, lo, hi);
};

// AI clubs sign from the pool. perTeam caps signings each; skip() can keep players off-limits
// (e.g. your own free agents in the first wave). capSpace(t) says what a club can still spend.
// Mutates the teams and the pool; returns the signings.
export function aiSignings(teams, pool, ui, { perTeam = 2, minOvr = 60, capSpace, cy, skip = () => false, rand = Math.random } = {}) {
  const signed = [];
  // depth is signed like it's kept: a young player with upside before a veteran near the end
  pool.sort((a, b) => keepScore(b) - keepScore(a));
  const order = teams.map((_, i) => i).filter((i) => i !== ui).sort(() => rand() - 0.5);
  for (let round = 0; round < perTeam; round++) {
    for (const i of order) {
      const t = teams[i];
      for (const pos of needs(t).slice(0, 3)) {
        const have = t.roster.filter((p) => p.pos === pos);
        const bar = Math.max(minOvr, have.length >= ROSTER_MIN[pos] ? Math.min(...have.map((p) => p.ovr)) + 1 : 0);
        const k = pool.findIndex((p) => p.pos === pos && p.ovr >= bar && !skip(p) && askingPrice(p) <= capSpace(t));
        if (k < 0) continue;
        const [p] = pool.splice(k, 1);
        const deal = { ...freshDeal(p), salary: askingPrice(p), contract: faYears(p, rand), cy, formerTeam: undefined };
        t.roster.push(deal);
        signed.push({ p: deal, team: i, from: p.formerTeam });
        break;
      }
    }
  }
  return signed;
}

// Starters per position, for judging whether a free agent would start somewhere.
export const STARTS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
const startBar = (t, pos) => {
  const r = t.roster.filter((p) => p.pos === pos).map((p) => p.ovr).sort((a, b) => b - a);
  return r[STARTS[pos] - 1] ?? 0;
};

// The best free agents: every club where he'd start and that can pay him makes an offer, and he
// picks, the same way he weighs yours: the money, plus how much he'd play, the scheme and how they
// win, depending on what he cares about. A club that suits him gets him a little cheaper.
// cut: keep clubs at 53 by releasing their least valuable player (used once the season's near).
// Mutates the teams and the pool; returns the signings.
export function starterSignings(teams, pool, ui, { minOvr = 72, perTeam = 2, capSpace, cy, skip = () => false, rand = Math.random, cut = false } = {}) {
  const signed = [], count = {};
  for (const p of [...pool].sort((a, b) => b.ovr - a.ovr)) {
    if (p.ovr < minOvr || skip(p)) continue;
    const prio = priorities(p);
    let best = -1, top = 0, bestPull = 0;
    teams.forEach((t, i) => {
      if (i === ui || (count[i] || 0) >= perTeam || askingPrice(p) > capSpace(t)) return;
      if (p.ovr - startBar(t, p.pos) < 2) return; // he wouldn't start: they don't bid
      const pull = fitPull(prio, teamFit(p, t));
      const u = (1 + pull) * (1 + rand() * 0.04);
      if (u > top) { top = u; best = i; bestPull = pull; }
    });
    if (best < 0) continue;
    pool.splice(pool.indexOf(p), 1);
    const salary = +(askingPrice(p) * (1 - Math.max(0, bestPull) * 0.5)).toFixed(1);
    const deal = { ...freshDeal(p), salary, contract: faYears(p, rand), cy, formerTeam: undefined };
    const t = teams[best];
    t.roster.push(deal);
    if (cut && t.roster.length > ROSTER_TARGET) {
      const spare = [...t.roster].filter((x) => x !== deal).sort((a, b) => keepScore(a) - keepScore(b)).find((x) => t.roster.filter((q) => q.pos === x.pos).length > ROSTER_MIN[x.pos]);
      if (spare) release(t, spare, pool, best);
    }
    count[best] = (count[best] || 0) + 1;
    signed.push({ p: deal, team: best, from: p.formerTeam });
  }
  return signed;
}

// Before the season: every AI club reaches its position minimums and fills out to 53, all from
// the real players left in the pool (cheapest deals if money is tight). Your roster is yours:
// it's never filled for you (shortGaps says where you're short).
export function fillRosters(teams, pool, ui, { capSpace, cy, rand = Math.random } = {}) {
  const signed = [];
  pool.sort((a, b) => keepScore(b) - keepScore(a)); // depth: upside before a veteran near the end
  const sign = (t, i, k) => {
    const [p] = pool.splice(k, 1);
    const deal = { ...freshDeal(p), salary: capSpace(t) >= askingPrice(p) ? askingPrice(p) : leagueMin(), contract: roll(rand, 1, 2), cy, formerTeam: undefined };
    t.roster.push(deal);
    signed.push({ p: deal, team: i });
  };
  teams.forEach((t, i) => {
    if (i === ui) return;
    for (const [pos, min] of Object.entries(ROSTER_MIN)) {
      let have = t.roster.filter((p) => p.pos === pos).length;
      while (have < min) {
        const k = pool.findIndex((p) => p.pos === pos);
        if (k < 0) break;
        sign(t, i, k); have++;
      }
    }
    // Cut-down day: AI clubs release their lowest-rated players beyond 53 (never below a minimum),
    // counting a young player's upside so fresh draft picks aren't the first to go.
    while (t.roster.length > ROSTER_TARGET) {
      const spare = [...t.roster].sort((a, b) => keepScore(a) - keepScore(b)).find((p) => t.roster.filter((q) => q.pos === p.pos).length > ROSTER_MIN[p.pos]);
      if (!spare) break;
      release(t, spare, pool, i);
    }
  });
  // Then clubs take turns, one signing each per round, so a thin market is shared out evenly.
  for (let more = true; more && pool.length; ) {
    more = false;
    teams.forEach((t, i) => {
      if (i === ui || t.roster.length >= ROSTER_TARGET || !pool.length) return;
      const want = needs(t);
      let k = pool.findIndex((p) => want.slice(0, 4).includes(p.pos) && !fullAt(t, p.pos));
      if (k < 0) k = pool.findIndex((p) => !fullAt(t, p.pos));
      if (k < 0) return;
      sign(t, i, k);
      more = true;
    });
  }
  // Last pass: an AI club still over the cap releases its priciest depth players (never below 48).
  teams.forEach((t, i) => {
    while (i !== ui && capSpace(t) < 0 && t.roster.length > 48) {
      const cut = [...t.roster].sort((a, b) => keepScore(a) - keepScore(b)).slice(0, 15).sort((a, b) => (b.salary || 0) - (a.salary || 0))[0];
      release(t, cut, pool, i);
    }
  });
  return signed;
}

// ---------- Depth: a backup at every spot ----------
// Every club carries a backup at each position (kickers and punters aside), fills its 53 with
// minimum deals, and stashes the best of what's left on its practice squad. During the season a
// spot left without a healthy backup promotes his practice-squad replacement, and the practice
// squad signs a fringe free agent in his place.
export const DEPTH_MIN = { QB: 2, RB: 2, WR: 4, TE: 2, LT: 2, LG: 2, C: 2, RG: 2, RT: 2, DL: 6, LB: 4, CB: 3, S: 3, K: 1, P: 1 };
export const PS_SIZE = 10;
// Clubs carry one kicker and one punter. Hoarding them left other clubs with nobody to punt (in one
// 2028 league the Chargers had three punters while four clubs had none).
const SPECIALIST = { K: 1, P: 1 };
const fullAt = (t, pos) => SPECIALIST[pos] != null && t.roster.filter((p) => p.pos === pos).length >= SPECIALIST[pos];
const minDeal = (p, minSal, cy) => ({ ...freshDeal(p), salary: minSal, contract: 1, ...(cy ? { cy } : {}), formerTeam: undefined, onPS: undefined });
const psDeal = (p, cy) => ({ ...freshDeal(p), salary: 0, contract: 1, ...(cy ? { cy } : {}), formerTeam: undefined });
const bestAt = (list, pos) => { let k = -1; list.forEach((p, i) => { if (p.pos === pos && (k < 0 || p.ovr > list[k].ovr)) k = i; }); return k; };

// Before the season. Mutates teams and pool (sorted best first). Returns log lines for your club.
export function fillDepth(teams, pool, { ui, minSal = leagueMin(), cy } = {}) {
  const mine = [];
  // 0. AI clubs carrying a second kicker or punter let the extra go first, so every club can find one.
  teams.forEach((t, i) => {
    if (i === ui) return;
    for (const [pos, n] of Object.entries(SPECIALIST)) {
      const at = t.roster.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
      for (const p of at.slice(n)) release(t, p, pool, i);
    }
  });
  pool.sort((a, b) => b.ovr - a.ovr);
  teams.forEach((t, i) => {
    t.ps = t.ps || [];
    const note = (txt) => { if (i === ui) mine.push(txt); };
    // 1. A backup everywhere: from the practice squad first, then free agency.
    for (const [pos, min] of Object.entries(DEPTH_MIN)) {
      while (t.roster.filter((p) => p.pos === pos).length < min) {
        if (t.roster.length >= ROSTER_TARGET) {
          // Full: release the least valuable player at a position with more than its minimum.
          const spare = [...t.roster].sort((a, b) => keepScore(a) - keepScore(b)).find((q) => q.pos !== pos && t.roster.filter((x) => x.pos === q.pos).length > (DEPTH_MIN[q.pos] || 1));
          if (!spare) break;
          release(t, spare, pool, i);
          note(`${spare.name} (${spare.pos} ${spare.ovr}) released to make room for a backup ${pos}.`);
        }
        let k = bestAt(t.ps, pos);
        if (k >= 0) { const [p] = t.ps.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`${p.name} (${pos} ${p.ovr}) promoted from the practice squad for depth.`); continue; }
        k = bestAt(pool, pos);
        if (k < 0) break;
        const [p] = pool.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`${p.name} (${pos} ${p.ovr}) signed to a minimum deal for depth.`);
      }
    }
    // 2. The rest of the 53 on minimum deals: the best players left, favouring thin positions.
    while (t.roster.length < ROSTER_TARGET && pool.length) {
      const thin = (pos) => t.roster.filter((p) => p.pos === pos).length - (DEPTH_MIN[pos] || 1);
      const k = pool.reduce((b, p, j) => (fullAt(t, p.pos) ? b : b < 0 || p.ovr - thin(p.pos) * 3 > pool[b].ovr - thin(pool[b].pos) * 3 ? j : b), -1);
      if (k < 0) break;
      const [p] = pool.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`${p.name} (${p.pos} ${p.ovr}) signed to a minimum deal to fill the 53.`);
    }
  });
  // 3. Practice squads: clubs take turns on the free agents still out there.
  for (let more = true; more && pool.length; ) {
    more = false;
    teams.forEach((t, i) => {
      if ((t.ps || []).length >= PS_SIZE || !pool.length) return;
      const [p] = pool.splice(0, 1);
      t.ps.push(psDeal(p, cy));
      if (i === ui) mine.push(`${p.name} (${p.pos} ${p.ovr}) added to the practice squad.`);
      more = true;
    });
  }
  return mine;
}

// During the season, after injuries: any spot without a healthy backup promotes from the practice
// squad, and the squad signs a fringe free agent (rated under 70) at that position. Mutates teams
// and fa. Returns log lines for your club.
export function keepBackups(teams, fa, { ui, minSal = leagueMin() } = {}) {
  const mine = [];
  teams.forEach((t, i) => {
    t.ps = t.ps || [];
    // An AI club with no kicker or punter signs the best one out there (making room if it must).
    if (i !== ui) for (const pos of ["K", "P"]) {
      if (t.roster.some((p) => p.pos === pos && !p.injured)) continue;
      const f = bestAt(fa, pos);
      if (f < 0) continue;
      if (t.roster.length >= ROSTER_TARGET) {
        const cut = [...t.roster].filter((q) => !q.injured && !SPECIALIST[q.pos] && t.roster.filter((x) => x.pos === q.pos).length > (DEPTH_MIN[q.pos] || 1)).sort((a, b) => keepScore(a) - keepScore(b))[0];
        if (!cut) continue;
        release(t, cut, fa, i);
      }
      const [p] = fa.splice(f, 1);
      t.roster.push(minDeal(p, minSal));
    }
    for (const [pos, n] of Object.entries(STARTS)) {
      if (pos === "K" || pos === "P") continue;
      if (t.roster.filter((p) => p.pos === pos && !p.injured).length > n) continue;
      const k = bestAt(t.ps.filter((p) => !p.injured), pos);
      if (k < 0) continue;
      const cand = t.ps.filter((p) => !p.injured)[k];
      // A full 53 needs a spot first: the least valuable player at the deepest position goes.
      let cut = null;
      if (t.roster.length >= ROSTER_TARGET) {
        cut = [...t.roster].filter((q) => q.pos !== pos && !q.injured && t.roster.filter((x) => x.pos === q.pos).length > (DEPTH_MIN[q.pos] || 1)).sort((a, b) => keepScore(a) - keepScore(b))[0];
        if (!cut) continue;
        release(t, cut, fa, i);
      }
      t.ps.splice(t.ps.indexOf(cand), 1);
      t.roster.push(minDeal(cand, minSal));
      let line = `No healthy backup at ${pos}: ${cand.name} (${cand.ovr}) promoted from the practice squad${cut ? `; ${cut.name} (${cut.pos} ${cut.ovr}) released to make room` : ""}.`;
      // Refill the practice squad with a cheap fringe player at the position.
      const f = fa.reduce((b, p, j) => (p.pos === pos && p.ovr < 70 && (b < 0 || p.ovr > fa[b].ovr) ? j : b), -1);
      if (f >= 0 && t.ps.length < PS_SIZE) { const [p] = fa.splice(f, 1); t.ps.push(psDeal(p)); line += ` ${p.name} (${p.ovr}) signed to the practice squad.`; }
      if (i === ui) mine.push(line);
    }
  });
  return mine;
}

// ---------- Cap compliance ----------
// Every club has to be under the cap when the season starts. Keeping a franchise player can push an
// AI club over in re-sign week (it tags him and sorts the cap out later), and in a 2039 test league
// twelve clubs opened the season over, the Chiefs by $54M. An AI club over the cap does what real
// clubs do: restructures its biggest deals first (up to four), then releases veterans whose cut
// saves the most room over his market value, never a franchise player and never below 46 players. Mutates the teams
// (pool gets the released players); returns [{ team, p, how: "restructure" | "release", saved }].
export function capCompliance(teams, pool, ui, { capSpace, yr, sp = "preseason", minSal = leagueMin() } = {}) {
  const moves = [];
  teams.forEach((t, i) => {
    if (i === ui || capSpace(t) >= 0) return;
    const big = [...t.roster].sort((a, b) => (b.salary || 0) - (a.salary || 0));
    for (const p of big.slice(0, 8)) {
      if (capSpace(t) >= 0 || moves.filter((m) => m.team === i && m.how === "restructure").length >= 4) break;
      // once per player, and not at 33 or older: in a 20-season test, quarterbacks restructured twice
      // carried cap hits of a quarter of the cap into their mid-30s
      if ((p.restructures || 0) >= 1 || (p.age || 0) >= 33) continue;
      const r = restructure(p, { yr, sp, minSal });
      if (!r || r.plan.saved < 1) continue;
      t.roster[t.roster.indexOf(p)] = r.p;
      moves.push({ team: i, p: r.p, how: "restructure", saved: r.plan.saved });
    }
    const saves = (p) => (p.salary || 0) - deadMoney(p, { yr, sp }).now;
    while (capSpace(t) < 0 && t.roster.length > 46) {
      // the most overpaid first (what a cut saves over what he'd cost on the market), veterans ahead
      const over = (p) => saves(p) - askingPrice(p) + (p.age >= 30 ? 2 : 0);
      const cut = t.roster.filter((p) => !isFranchisePlayer(p, t) && saves(p) > 0).sort((a, b) => over(b) - over(a))[0];
      if (!cut) break;
      const saved = saves(cut);
      release(t, cut, pool, i);
      moves.push({ team: i, p: cut, how: "release", saved: +saved.toFixed(1) });
    }
  });
  return moves;
}
