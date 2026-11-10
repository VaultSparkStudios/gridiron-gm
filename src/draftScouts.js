// Your scouts' room on draft day. When your pick comes up, your scouts meet and bring you five
// names for it, weighed for your roster: how good each one is now (his current overall: exact
// after a workup, close after a report, a range before that) against how good he'll get, your
// needs, starters who are getting old, how much cap room you have to buy help instead, and
// whether you're built to win now. They also tell you who'll still be there at your next pick.
// That read comes from playing out the picks in between the way the other clubs really pick
// (their own boards, not yours): a gem only your scouts have seen won't get taken, so you can wait
// on him; a player every club rates goes early, so take him now.
import { aiBestPick } from "./league.js";
import { prospectRead, csRank, csScore, gemGap, potGrade, onSpec, SCOUT_SLOTS } from "./scouting.js";
import { teamNeeds, needGroup, needName, NEED_STARTERS } from "./needs.js";
import { posTag } from "./dline.js";

// a number from 0 to 1 that's always the same for the same key (a scout's take, a range's offset)
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const POS_VALUE = { QB: 1.03, EDGE: 1.04, LT: 1.035, CB: 1.025, WR: 1.015, DT: 1, RT: 1, S: 0.975, LB: 0.965, TE: 0.965, LG: 0.96, RG: 0.96, C: 0.955, RB: 0.955, K: 0.85, P: 0.85 };
// what a known development trait is worth to your scouts: a superstar or a generational talent
// changes a franchise, so it outweighs a few points of ceiling or a starter's readiness
const DEV_BONUS = { generational: 9, superstar: 6, star: 3 };
const DEV_WORD = { generational: "Generational talent", superstar: "Superstar trait", star: "Star trait" };
// how much they mark a player down for being likely there at your next pick: only a near-sure
// thing waits, and a superstar or better waits only when he's all but guaranteed to last
const waitCost = (x) => (x.later >= 0.9 ? 4 : x.later >= 0.7 && (DEV_BONUS[x.r.dev] || 0) < 6 ? 1.5 : 0);
const OLD = { QB: 35, RB: 29, WR: 31, TE: 31, LT: 33, LG: 33, C: 33, RG: 33, RT: 33, EDGE: 31, DT: 31, LB: 30, CB: 30, S: 31, K: 38, P: 38 };

// His current overall as your scouts see it: { v, lo, hi, kind } (kind: "workup" exact, "report"
// close, "estimate" a range from the tape everyone has).
export function currentOvr(sc, p) {
  const r = prospectRead(sc, p);
  if (r.ovrV != null) return r.exact ? { v: r.ovrV, lo: r.ovrV, hi: r.ovrV, kind: "workup" } : { v: r.ovrV, lo: r.ovrV - 2, hi: r.ovrV + 2, kind: "report" };
  const mid = Math.round(p.trueOvr + (hash(`${p.id}ovr`) - 0.5) * 8);
  return { v: mid, lo: mid - 3, hi: mid + 3, kind: "estimate" };
}
export const ovrText = (o) => (o.lo === o.hi ? `${o.v}` : `${o.lo}-${o.hi}`);

// The club's situation, the way your scouts read it before they talk players.
export function teamContext(team, capRoom) {
  const roster = team?.roster || [];
  const tn = teamNeeds(roster);
  const needs = tn.list.filter((x) => x.score >= 0.2 && x.pos !== "K" && x.pos !== "P").slice(0, 4).map((x) => x.pos);
  const by = {};
  for (const p of roster) { const g = needGroup(p); (by[g] ||= []).push(p); }
  const starters = {};
  for (const [g, n] of Object.entries(NEED_STARTERS)) starters[g] = [...(by[g] || [])].sort((a, b) => (b.ovr || 0) - (a.ovr || 0)).slice(0, n);
  const aging = Object.entries(starters).flatMap(([g, ps]) => ps.filter((p) => (p.age || 0) >= OLD[g]).map((p) => ({ p, g }))).sort((a, b) => (b.p.ovr || 0) - (a.p.ovr || 0));
  const games = (team?.w || 0) + (team?.l || 0) + (team?.t || 0);
  const pct = games ? ((team.w || 0) + (team.t || 0) / 2) / games : 0.5;
  const window = pct >= 0.55 ? "win" : pct <= 0.35 ? "rebuild" : "middle";
  // how much today's rating counts against his ceiling: winning clubs and clubs short on cap room
  // (who can't just buy a starter) need players who can play now; rebuilding clubs can wait
  let ready = 0.3 + (window === "win" ? 0.15 : window === "rebuild" ? -0.12 : 0.03);
  if (capRoom != null && capRoom < 25) ready += 0.1;
  if (aging.length) ready += 0.05;
  return { needs, score: tn.score, starters, aging, window, ready: Math.max(0.12, Math.min(0.6, ready)), capRoom, record: `${team?.w || 0}-${team?.l || 0}` };
}

// Who goes between two picks, played out n times the way the other clubs really pick.
// left: Map(id -> share of the runs in which he's still there when pick `to` comes up).
// picks: for each club's pick in between, what it takes: pos [[group, share]] and who [[player, share]],
// most likely first. That's the league intel: who's after what before you're up.
export function leagueIntel(pool, picks, from, to, teams, ui, n = 24) {
  const left = new Map(pool.map((p) => [p.id, 0]));
  const between = picks.slice(from, to).filter((pk) => pk.owner !== ui);
  if (!between.length) { for (const k of left.keys()) left.set(k, 1); return { left, picks: [] }; }
  // only the top of the board is ever in play for these picks
  const cut = [...pool].sort((a, b) => csRank(a) - csRank(b)).slice(0, Math.min(pool.length, between.length * 3 + 60));
  const inPlay = new Set(cut.map((p) => p.id));
  const took = between.map(() => ({ pos: {}, who: new Map() }));
  for (let run = 0; run < n; run++) {
    const avail = [...cut], added = {};
    between.forEach((pk, k) => {
      const t = teams[pk.owner];
      if (!t || !avail.length) return;
      const bp = aiBestPick([...(t.roster || []), ...(added[pk.owner] || [])], avail, t.gmStyle);
      const i = avail.indexOf(bp);
      if (i >= 0) avail.splice(i, 1);
      (added[pk.owner] ||= []).push(bp);
      const g = needGroup(bp);
      took[k].pos[g] = (took[k].pos[g] || 0) + 1;
      took[k].who.set(bp, (took[k].who.get(bp) || 0) + 1);
    });
    for (const p of avail) left.set(p.id, left.get(p.id) + 1);
  }
  for (const [k, v] of left) left.set(k, inPlay.has(k) ? v / n : 1);
  const top = (o) => [...o].map(([k, v]) => [k, v / n]).sort((a, b) => b[1] - a[1]);
  return { left, picks: between.map((pk, k) => ({ pk, pos: top(Object.entries(took[k].pos)), who: top(took[k].who) })) };
}
export const survival = (...a) => leagueIntel(...a).left;

// The intel in a sentence or two: how many of the clubs in between are likely after each
// position, your needs first. [{ g, n, mine }]
export function intelRuns(intel, needs = []) {
  const count = {};
  for (const x of intel.picks) { const [g, sh] = x.pos[0] || []; if (g && sh >= 0.4) count[g] = (count[g] || 0) + 1; }
  return Object.entries(count).map(([g, n]) => ({ g, n, mine: needs.includes(g) })).sort((a, b) => (b.mine - a.mine) || b.n - a.n);
}

// What the rest of the league sees in him: his ceiling as the other clubs read it.
const leagueSees = (p) => p.truePot - gemGap(p) * 0.85;

// The five your scouts bring you for your pick (index `at` in picks), and why.
// opts: { sc, teams, ui, picks, pool (the players still on the board), at, now (the pick on the clock), capRoom,
//   likely (leave out the ones who'll almost surely be gone by your pick) }
export function scoutsPicks({ sc, teams, ui, picks, pool, at, now, capRoom, likely = false }) {
  const team = teams[ui];
  const ctx = teamContext(team, capRoom);
  const nextAt = picks.findIndex((pk, i) => i > at && pk.owner === ui);
  const next = nextAt >= 0 ? picks[nextAt] : null;
  // there at your pick (if it isn't up yet), and there at the one after it
  const before = at > now ? leagueIntel(pool, picks, now, at, teams, ui, 16) : null;
  const after = next ? leagueIntel(pool, picks, at + 1, nextAt, teams, ui, 16) : null;
  const atMine = before?.left, atNext = after?.left;
  const rated = pool.map((p) => {
    const r = prospectRead(sc, p), g = needGroup(p), cur = currentOvr(sc, p);
    const ceil = Math.round(r.potV ?? csScore(p) + 4);
    const need = ctx.score[g] || 0;
    const st = ctx.starters[g] || [];
    const short = st.length < (NEED_STARTERS[g] || 1);
    const weakest = short ? null : st[st.length - 1];
    const starts = !weakest || cur.v >= (weakest.ovr || 0);
    const value = (ceil * (1 - ctx.ready) + cur.v * ctx.ready + 7 * need + (starts ? 2 : 0) + (DEV_BONUS[r.dev] || 0)) * (POS_VALUE[g] || 1);
    const there = atMine ? atMine.get(p.id) ?? 1 : 1;
    const later = atNext ? atNext.get(p.id) ?? 1 : 0;
    return { p, r, g, cur, ceil, need, short, weakest, starts, value, there, later };
  }).filter((x) => !likely || x.there >= 0.3); // likely: only players with a real chance to be there
  // the ones they'd take: best for you, lower only when he's near-certain to be there next time
  // (before your pick is up, the ones who'll likely be gone still show: that's what a trade up is for)
  rated.sort((a, b) => b.value - waitCost(b) - (a.value - waitCost(a)));
  const five = rated.slice(0, 5);
  // the rest of the board worth a look: a trait your scouts have seen, a player they rate well
  // above the board, the biggest ceiling left; with a real chance to be there
  const inFive = new Set(five.map((x) => x.p.id));
  const topCeil = Math.max(0, ...rated.filter((x) => !inFive.has(x.p.id) && x.there >= 0.3).map((x) => x.ceil));
  let ceilShown = false;
  const radar = rated.filter((x) => !inFive.has(x.p.id) && x.there >= 0.3).map((x) => {
    const gap = x.r.potV != null ? x.r.potV - leagueSees(x.p) : 0;
    const note = DEV_BONUS[x.r.dev] ? [DEV_WORD[x.r.dev], "dev"]
      : gap >= 5 ? ["Rated well above the board", "gem"]
      : !ceilShown && x.ceil === topCeil && x.ceil >= 80 ? ((ceilShown = true), ["Highest ceiling left", "ceil"])
      : null;
    return note ? { ...x, note } : null;
  }).filter(Boolean).slice(0, 5);
  // each scout makes his case: his own read of the five, leaning to the positions he knows
  const scouts = SCOUT_SLOTS.map((k) => sc?.[k]).filter(Boolean);
  for (const x of five) x.votes = [];
  for (const s of scouts) {
    const take = (x) => x.value - waitCost(x) + (onSpec(s, x.p) ? 2.5 : 0) + (hash(`${s.name}${x.p.id}`) - 0.5) * (2 + (100 - (s.eval || 60)) / 10);
    const best = [...five].sort((a, b) => take(b) - take(a))[0];
    if (best) best.votes.push(s);
  }
  for (const x of five) x.why = reason(x, ctx, next);
  // the clubs ahead of you: before your pick if it isn't up yet, else before your next one
  const intel = before || after;
  return { five, radar, ctx, next, scouts, mine: picks[at], upAt: at > now ? picks[at] : null, intel, intelTo: at > now ? picks[at] : next };
}

const yrs = (n) => (n <= 1 ? "a year" : `${n} years`);
const short = (n) => { const a = String(n || "").split(" "); return a.length > 1 ? `${a[0][0]}. ${a.slice(1).join(" ")}` : n; };
function reason(x, ctx, next) {
  const { p, g, cur, weakest, starts } = x;
  const old = ctx.aging.find((a) => a.g === g);
  // the one thing that matters most about him for you, after whether he plays now
  const extra =
    (DEV_BONUS[x.r.dev] || 0) >= 6 ? `your scouts have seen a ${x.r.dev === "generational" ? "generational" : "superstar"} trait`
    : x.r.potV != null && x.r.potV - leagueSees(p) >= 5 ? "the league hasn't seen what your scouts have"
    : g === "QB" && (ctx.score.QB || 0) <= 0.1 ? "you're set at quarterback"
    : old ? `${short(old.p.name)} is ${old.p.age}`
    : !weakest ? (x.short && (ctx.starters[g] || []).length ? `you're a ${needName(g)} short` : `you have no ${needName(g)}`)
    : "";
  const lead = starts
    ? [weakest ? `${cur.kind === "estimate" ? "Should start" : "Starts"} over ${short(weakest.name)} (${weakest.ovr})` : cur.kind === "estimate" ? "Should start" : "Starts day one", "g"]
    : weakest && x.ceil > (weakest.ovr || 0) ? [`${yrs(Math.max(1, Math.ceil(((weakest.ovr || 0) - cur.v) / 4)))} from passing ${short(weakest.name)}`, "y"]
    : ["Depth", "dim"];
  return { lead: [lead], rest: extra, wait: !!next && waitCost(x) > 0 };
}

// Your auto pick when your clock runs out: your scouts' first choice.
export const scoutsAutoPick = (args) => scoutsPicks(args).five[0]?.p || null;

export const ceilingText = (x) => (x.r.grade || potGrade(x.ceil));
export const posLabel = (p) => posTag(p);
