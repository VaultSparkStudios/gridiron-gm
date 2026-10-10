// The NFL off-season, in league order: contracts expire when free agency opens (teams keep the
// core players they re-sign), clubs sign free agents to fill their needs, and before the next
// season every roster is topped up from the real players still on the market. No player is
// ever invented here.

import { leagueCap, leagueMin } from "./cap.js";
import { freshDeal } from "./bonus.js";
import { optionEligible, aiTakesOption, optionPrice, tagPrice } from "./contracts.js";

// Fewest players a club carries at each position.
// How much a club wants to keep a player: his rating, plus half his remaining upside while he's young.
const keepScore = (p) => (p.ovr || 0) + (p.age <= 24 ? Math.max(0, (p.pot ?? p.ovr) - p.ovr) * 0.5 : 0);
export const ROSTER_MIN = { QB: 2, RB: 3, WR: 5, TE: 3, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 7, LB: 5, CB: 5, S: 4, K: 1, P: 1 };
export const ROSTER_TARGET = 53;

const roll = (rand, a, b) => a + Math.floor(rand() * (b - a + 1));

// Opening free agency for the season after `yr`. Every contract loses a year; the ones that
// run out either get re-signed (AI clubs keep most of their core) or hit the market. Players
// 36+ or rated under 45 retire instead. Everyone touched is stamped cy = yr + 1 so the season
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
    // AI clubs re-sign best players first, and only what fits under the cap (with room for
    // coaches and the draft class).
    let payroll = roster.reduce((s, p) => s + (p.salary || 0), 0);
    let tagged = false; // one franchise tag per club
    // Franchise players first (QBs ahead of everyone), then by rating, so a club never spends
    // its room on lesser starters and loses its young star.
    // The club's starting quarterback (its best, counting the expiring ones) is kept like a
    // franchise player while he's a real starter and not old.
    const qb1 = [...t.roster, ...expiring].filter((p) => p.pos === "QB").sort((a, b) => b.ovr - a.ovr)[0];
    const isCore = (p) => isFranchisePlayer(p) || (p === qb1 && p.ovr >= 76 && p.age <= 34);
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
      const salary = +Math.max(Math.min(p.salary || 1, askingPrice(p)), askingPrice(p) * (0.95 + rand() * 0.15) * (p.perf?.f ?? 1)).toFixed(1); // market, not a small raise; his last season counts
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
        const deal = tag ? { ...freshDeal(p), sb: 0, contract: 1, salary: tagPrice(teams, p, cap), ftag: true, tagYr: yr, cy } : { ...freshDeal(p), contract: roll(rand, 2, 4), salary, cy };
        if (tag) tagged = true;
        roster.push(deal);
        payroll += deal.salary;
        resigned.push({ p, team: i, how: tag ? "tag" : "deal" });
        continue;
      }
      if (p.age >= 36 || p.ovr < 45) { retired.push({ p, team: i }); continue; }
      const fa = { ...p, contract: 0, cy, formerTeam: i, ss: p.ss, gl: [], av: 0 };
      pool.push(fa);
      if (i === ui) mine.push(fa);
    }
    return { ...t, roster };
  });
  pool.sort((a, b) => b.ovr - a.ovr);
  return { teams: out, pool, mine, resigned, retired };
}

// A franchise player: a superstar in or before his prime (90+ at 29 or younger, or 86+ with an
// elite development trait or an X-Factor at 27 or younger; QBs three years later). AI clubs build
// around these players: they never let one walk, cut anyone else to keep him and tag him if
// they have to.
export function isFranchisePlayer(p) {
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

// What a player asks for on a new deal: a share of the salary cap set by his position and
// rating, from real contracts. A 99 earns the top of his position's market (QB ~23.5% of the
// cap, elite WR or pass rusher ~15%, down to kickers ~2%); an 88 gets ~87% of that, an 80 half,
// a 70 a tenth, and anyone below starter level the minimum. Less once he's past his prime (QBs
// age four years later). cap: the cap for the league year the deal starts.
export const TOP_SHARE = { QB: 0.235, WR: 0.15, DL: 0.15, LT: 0.115, CB: 0.11, RT: 0.09, LB: 0.09, S: 0.085, TE: 0.08, LG: 0.08, RG: 0.08, RB: 0.07, C: 0.07, K: 0.02, P: 0.015 };
const curve = (ovr) => Math.min(1, 1 / (1 + Math.exp(-(ovr - 80) / 4.5)) / 0.985);
export const askingPrice = (p, cap = leagueCap()) => {
  const a = p.pos === "QB" ? p.age - 4 : p.age;
  const age = a >= 34 ? 0.5 : a >= 32 ? 0.7 : a >= 30 ? 0.85 : 1;
  return +Math.max(cap * 0.0033, cap * (TOP_SHARE[p.pos] ?? 0.08) * curve(p.ovr) * age).toFixed(1);
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

// AI clubs sign from the pool. perTeam caps signings each; skip() can keep players off-limits
// (e.g. your own free agents in the first wave). capSpace(t) says what a club can still spend.
// Mutates the teams and the pool; returns the signings.
export function aiSignings(teams, pool, ui, { perTeam = 2, minOvr = 60, capSpace, cy, skip = () => false, rand = Math.random } = {}) {
  const signed = [];
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
        const deal = { ...freshDeal(p), salary: askingPrice(p), contract: roll(rand, 1, p.age >= 30 ? 2 : 4), cy, formerTeam: undefined };
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

// The best free agents go to the clubs where they'd start and that can pay them (the club
// gaining the most wins him). Mutates the teams and the pool; returns the signings.
export function starterSignings(teams, pool, ui, { minOvr = 72, perTeam = 2, capSpace, cy, skip = () => false, rand = Math.random } = {}) {
  const signed = [], count = {};
  for (const p of [...pool]) {
    if (p.ovr < minOvr || skip(p)) continue;
    let best = -1, gain = 0;
    teams.forEach((t, i) => {
      if (i === ui || (count[i] || 0) >= perTeam || askingPrice(p) > capSpace(t)) return;
      const g = p.ovr - startBar(t, p.pos) + rand() * 2;
      if (g > gain) { gain = g; best = i; }
    });
    if (best < 0 || gain < 2) continue;
    pool.splice(pool.indexOf(p), 1);
    const deal = { ...freshDeal(p), salary: askingPrice(p), contract: roll(rand, 1, p.age >= 30 ? 2 : 4), cy, formerTeam: undefined };
    teams[best].roster.push(deal);
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
      t.roster.splice(t.roster.indexOf(spare), 1);
      pool.push({ ...spare, contract: 0, formerTeam: i });
    }
  });
  // Then clubs take turns, one signing each per round, so a thin market is shared out evenly.
  for (let more = true; more && pool.length; ) {
    more = false;
    teams.forEach((t, i) => {
      if (i === ui || t.roster.length >= ROSTER_TARGET || !pool.length) return;
      const want = needs(t);
      const k = pool.findIndex((p) => want.slice(0, 4).includes(p.pos));
      sign(t, i, k >= 0 ? k : 0);
      more = true;
    });
  }
  // Last pass: an AI club still over the cap releases its priciest depth players (never below 48).
  teams.forEach((t, i) => {
    while (i !== ui && capSpace(t) < 0 && t.roster.length > 48) {
      const cut = [...t.roster].sort((a, b) => keepScore(a) - keepScore(b)).slice(0, 15).sort((a, b) => (b.salary || 0) - (a.salary || 0))[0];
      t.roster.splice(t.roster.indexOf(cut), 1);
      pool.push({ ...cut, contract: 0, formerTeam: i });
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
const minDeal = (p, minSal, cy) => ({ ...freshDeal(p), salary: minSal, contract: 1, ...(cy ? { cy } : {}), formerTeam: undefined, onPS: undefined });
const psDeal = (p, cy) => ({ ...freshDeal(p), salary: 0, contract: 1, ...(cy ? { cy } : {}), formerTeam: undefined });
const bestAt = (list, pos) => { let k = -1; list.forEach((p, i) => { if (p.pos === pos && (k < 0 || p.ovr > list[k].ovr)) k = i; }); return k; };

// Before the season. Mutates teams and pool (sorted best first). Returns log lines for your club.
export function fillDepth(teams, pool, { ui, minSal = leagueMin(), cy } = {}) {
  const mine = [];
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
          t.roster.splice(t.roster.indexOf(spare), 1);
          pool.push({ ...spare, contract: 0, formerTeam: i });
          note(`✂️ ${spare.name} (${spare.pos} ${spare.ovr}) released to make room for a backup ${pos}.`);
        }
        let k = bestAt(t.ps, pos);
        if (k >= 0) { const [p] = t.ps.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`⬆️ ${p.name} (${pos} ${p.ovr}) promoted from the practice squad for depth.`); continue; }
        k = bestAt(pool, pos);
        if (k < 0) break;
        const [p] = pool.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`✍️ ${p.name} (${pos} ${p.ovr}) signed to a minimum deal for depth.`);
      }
    }
    // 2. The rest of the 53 on minimum deals: the best players left, favouring thin positions.
    while (t.roster.length < ROSTER_TARGET && pool.length) {
      const thin = (pos) => t.roster.filter((p) => p.pos === pos).length - (DEPTH_MIN[pos] || 1);
      const k = pool.reduce((b, p, j) => (b < 0 || p.ovr - thin(p.pos) * 3 > pool[b].ovr - thin(pool[b].pos) * 3 ? j : b), -1);
      if (k < 0) break;
      const [p] = pool.splice(k, 1); t.roster.push(minDeal(p, minSal, cy)); note(`✍️ ${p.name} (${p.pos} ${p.ovr}) signed to a minimum deal to fill the 53.`);
    }
  });
  // 3. Practice squads: clubs take turns on the free agents still out there.
  for (let more = true; more && pool.length; ) {
    more = false;
    teams.forEach((t, i) => {
      if ((t.ps || []).length >= PS_SIZE || !pool.length) return;
      const [p] = pool.splice(0, 1);
      t.ps.push(psDeal(p, cy));
      if (i === ui) mine.push(`📋 ${p.name} (${p.pos} ${p.ovr}) added to the practice squad.`);
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
        t.roster.splice(t.roster.indexOf(cut), 1);
        fa.push({ ...cut, contract: 0, formerTeam: i });
      }
      t.ps.splice(t.ps.indexOf(cand), 1);
      t.roster.push(minDeal(cand, minSal));
      let line = `⬆️ No healthy backup at ${pos}: ${cand.name} (${cand.ovr}) promoted from the practice squad${cut ? `; ${cut.name} (${cut.pos} ${cut.ovr}) released to make room` : ""}.`;
      // Refill the practice squad with a cheap fringe player at the position.
      const f = fa.reduce((b, p, j) => (p.pos === pos && p.ovr < 70 && (b < 0 || p.ovr > fa[b].ovr) ? j : b), -1);
      if (f >= 0 && t.ps.length < PS_SIZE) { const [p] = fa.splice(f, 1); t.ps.push(psDeal(p)); line += ` ${p.name} (${p.ovr}) signed to the practice squad.`; }
      if (i === ui) mine.push(line);
    }
  });
  return mine;
}
