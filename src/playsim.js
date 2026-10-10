// The game engine, play by play. Quick sims and watched (live) games both run on it, so they
// follow the same rules: real downs and distance, field position, a 60-minute clock, 4th-down
// decisions, field goals by distance, punts, turnovers, overtime.
//
// Every play is decided by the offense's starters against the defense's (unit ratings from the
// depth chart): a better offense gains more yards, completes more passes and turns it over less;
// a better defense gets more stops, sacks and takeaways. Players get the ball by depth chart,
// snap share AND talent, so a star WR1 or RB1 sees a star's share of the touches.
//
// Tuned to the modern NFL (checked over whole simulated seasons with scripts/scoring.mjs):
// ~22 points a team, ~63 offensive plays, ~11.5 drives, ~40% on third down, ~235 passing and
// ~120 rushing yards, ~65% completions, ~2.5 sacks, ~0.8 interceptions and ~87% on field goals.
// The score shapes the game the way it does on Sundays: a team well ahead in the second half
// runs the ball and goes vanilla, a team well behind throws into soft coverage, close games
// come down to the last drives (and the field goal at the end), and lopsided mismatches have
// diminishing returns, so blowouts and 50-point games stay rare.
import { retRating } from "./special.js";
import { unitRatings } from "./gamesim.js";
import { dlAsPlayed } from "./dline.js";
import { getLeagueYear } from "./cap.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = (rand) => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const expo = (rand, mean) => -Math.log(1 - rand() * 0.9999) * mean;
const last = (p) => (p?.name || "").split(" ").slice(-1)[0] || "Player";

// Home-field advantage and how much the game-day modifiers (game plan, coaches, morale,
// weather...) count: both in "edge" units, where 1 unit is worth about 2.5 points a game.
export const HOME_EDGE = 0.42; // home teams win ~55%, like the NFL
let HOME = HOME_EDGE;
export const POINTS_PER_EDGE = 2.5;

// Who gets the ball: snap share x how often that spot is targeted per snap x talent. Each
// rating point above 75 adds ~1.5% to a player's share, so an elite WR1 sees ~30% of the
// targets (a good one ~25%) and an elite back ~75% of the carries.
const TALENT = 0.019;
const TGT_RATE = { WR: [0.23, 0.21, 0.19, 0.18, 0.18], TE: [0.21, 0.17, 0.15], RB: [0.13, 0.12, 0.1] };
const TK = { DL: [0.07, 0.07, 0.06, 0.06, 0.03, 0.02], LB: [0.14, 0.12, 0.08, 0.03], CB: [0.07, 0.06, 0.03], S: [0.09, 0.08, 0.02] };

function pickW(rand, list) {
  const sum = list.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (!sum) return list[0]?.[0];
  let x = rand() * sum;
  for (const [p, w] of list) { x -= Math.max(0, w); if (x <= 0) return p; }
  return list[list.length - 1][0];
}

// One team's side of a game: its starters, who touches the ball, and its modifiers.
// order(pos): healthy players in depth order. snaps: id -> %. mod: game-day modifiers in points.
// lean: extra pass tendency (-0.15..0.15).
// Who gets home on a sack: edge rushers take about half a team's sacks, interior tackles and
// linebackers most of the rest, DBs a few (a 95-rated edge gets ~1.4x an average one's share).
// The spot he's playing says which (LE/RE edge, DT1/DT2 inside); else Madden's position (mpos),
// else body weight (an edge ~250-285 lbs, a tackle ~295+).
function rushRole(p) {
  if (p.pos === "DL") return p.dlKind ? (p.dlKind === "DT" ? 0.6 : 1) : p.mpos ? (p.mpos === "DT" ? 0.6 : 1) : (p.wt || 280) >= 292 ? 0.6 : 1;
  if (p.pos === "LB") return p.mpos === "SAM" ? 0.5 : 0.25;
  return 0.08;
}

// A player's form for the season: most play to their rating, give or take a point or two; now
// and then one has a career year (or a down one). Fixed per player and season, so a hot year
// stays hot, and it's what lets a record fall once in a while instead of never (or every year).
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  // Finish with a full avalanche so near-identical ids (p1, p2...) land far apart.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
};
export function seasonForm(id, season) {
  const u = (hash(`${id}|${season}|a`) + 1) / 4294967297, v = (hash(`${id}|${season}|b`) + 1) / 4294967297;
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return clamp(Math.round(z * 3), -8, 8);
}

export function makeSide({ team, order: depth, snaps, mod = 0, lean = 0, season = getLeagueYear() }) {
  // Everyone plays at his rating plus his form this season; the defensive line at its spots
  // (edges at LE/RE, tackles inside, each rated for his spot).
  const formed = (list) => list.map((p) => { const f = seasonForm(p.id, season); return f ? { ...p, ovr: clamp((p.ovr || 70) + f, 30, 105), form: f } : p; });
  const memo = {};
  const order = (pos) => (memo[pos] ||= pos === "DL" ? dlAsPlayed(formed(depth("DL"))) : formed(depth(pos)));
  const u = unitRatings(order);
  const on = (pos) => order(pos).filter((p) => (snaps[p.id] || 0) > 0);
  const share = (p) => (snaps[p.id] || 0) / 100;
  const q = (p, k) => Math.exp(((p.ovr || 70) - 75) * k);
  const receivers = [];
  for (const pos of ["WR", "TE", "RB"]) on(pos).forEach((p, i) => receivers.push([p, (TGT_RATE[pos][i] ?? 0.1) * share(p) * q(p, TALENT)]));
  // Backs by snaps and talent; the next back up always spells the starter now and then, even
  // when the starter plays every snap (nobody carries 25+ times every week).
  const rushers = on("RB").map((p) => [p, share(p) * q(p, TALENT)]);
  const relief = order("RB").find((p) => !rushers.some(([r]) => r === p));
  if (relief && rushers.length < 2) rushers.push([relief, 0.2 * q(relief, TALENT)]);
  const qb = on("QB")[0] || order("QB")[0];
  const defs = [];
  for (const pos of ["DL", "LB", "CB", "S"]) on(pos).forEach((p, i) => defs.push([p, (TK[pos][i] ?? 0.01) * share(p) * q(p, 0.01)]));
  const rushW = defs.map(([p, w]) => [p, rushRole(p) * w * q(p, 0.012)]);
  const covW = defs.map(([p, w]) => [p, (p.pos === "CB" ? 1.4 : p.pos === "S" ? 1.1 : p.pos === "LB" ? 0.35 : 0.05) * w * q(p, 0.035)]);
  const tackleW = defs.map(([p, w]) => [p, w]);
  const k = on("K")[0] || order("K")[0];
  // Special teams: the returners, and the coverage units (the special teams coach).
  const kr = order("KR")?.[0], pr = order("PR")?.[0];
  // The punter (a kicker punts, badly, if a club has none).
  const p = on("P")[0] || order("P")?.[0];
  const pOvr = p ? p.ovr || 75 : 60, pPow = p ? p.posAttrs?.power ?? 93 : 85, pAcc = p ? p.posAttrs?.accuracy ?? 82 : 65;
  const stCov = team?.coach?.st?.rating ?? 70;
  // Measured against the league's balance, so league-wide rating drift doesn't tilt everyone's play-calling.
  const passLean = clamp(0.6 + ((u.pass - LEAGUE.pass[0]) - (u.run - LEAGUE.run[0])) * 0.006 + lean, 0.5, 0.7);
  return { team, order, u, mod, passLean, receivers, rushers, qb, defs, rushW, covW, tackleW, k, kOvr: k?.ovr || 70, kr, krR: kr ? retRating(kr) : 80, pr, prR: pr ? retRating(pr) : 80, stCov, p, pOvr, pPow, pAcc };
}

const emptyTeam = () => ({ plays: 0, passAtt: 0, comp: 0, passYds: 0, rushAtt: 0, rushYds: 0, sacks: 0, ints: 0, fumLost: 0, punts: 0, fgA: 0, fgM: 0, tds: 0, drives: 0, penalties: 0 });

export function createGame(home, away, { playoff = false, neutral = false, rand = Math.random } = {}) {
  const first = rand() < 0.5 ? "h" : "a";
  const g = {
    sides: { h: home, a: away }, playoff, neutral, rand,
    poss: first, firstPoss: first, yard: 25, down: 1, toGo: 10, qtr: 1, clock: 900,
    score: { h: 0, a: 0 }, done: false, ot: false, otScored: false, plays: 0,
    box: { h: {}, a: {} }, stats: { h: emptyTeam(), a: emptyTeam() },
  };
  g.stats[first].drives++;
  // Any given Sunday: each side has a good or bad day on offense and on defense.
  const day = () => ({ o: gauss(rand) * GAME_DAY_SD, d: gauss(rand) * GAME_DAY_SD });
  g.day = { h: day(), a: day() };
  return g;
}

const other = (s) => (s === "h" ? "a" : "h");
function line(g, side, p) {
  if (!p) return {};
  const b = g.box[side];
  return (b[p.id] ||= { name: p.name, pos: p.pos });
}
const add = (l, k, v) => { if (v) l[k] = (l[k] || 0) + v; };

// League baselines for each unit rating (mean, spread) from the 2026 rosters. Units are
// compared in spreads above or below average, so an elite defense counts as much as an elite
// offense even though defensive units (8 players averaged) vary less than offensive ones.
export const LEAGUE0 = { pass: [81.4, 4.9], run: [81.7, 4.2], passD: [80.1, 2.4], runD: [79.1, 1.9], rush: [79.4, 2.2], ol: [78.2, 3.4] };
export const LEAGUE = Object.fromEntries(Object.entries(LEAGUE0).map(([k, v]) => [k, [...v]]));
// Re-centre on the league as it is now (each new season): as ratings drift over the years (say
// defensive fronts get better while backs get worse), the league's numbers stay NFL-like, and
// teams are still judged against each other. The spread can move only a little, so a club that
// pulls away from the pack still stands out.
export function setLeague(base) {
  for (const [k, [m, sd]] of Object.entries(base || {})) {
    if (!LEAGUE0[k] || !Number.isFinite(m)) continue;
    LEAGUE[k] = [m, clamp(Number.isFinite(sd) ? sd : LEAGUE0[k][1], LEAGUE0[k][1] * 0.75, LEAGUE0[k][1] * 1.33)];
  }
}
export let SENSITIVITY = 0.6; // edge units per spread of advantage
// How much a team's play swings from one game to the next (edge units, per side of the ball).
export let GAME_DAY_SD = 0.45; // with SENSITIVITY 0.6: win totals spread like the NFL's (~3 wins), no routine 16-1 or 1-16 teams
export const tune = (o) => { if (o.SENSITIVITY != null) SENSITIVITY = o.SENSITIVITY; if (o.GAME_DAY_SD != null) GAME_DAY_SD = o.GAME_DAY_SD; if (o.HOME_EDGE != null) HOME = o.HOME_EDGE; };
const z = (v, k) => (v - LEAGUE[k][0]) / LEAGUE[k][1];

// Matchup edges for the team with the ball (passing and running), in edge units. Big offensive
// mismatches have diminishing returns (even the best offense against the worst defense isn't
// a 50-point lock), and the score shapes how both teams play the second half: the team well
// ahead goes vanilla (and late, rests starters), the team well behind faces soft coverage.
export const EDGE_CAP = 1.15;
const soft = (x) => (x > 0 ? EDGE_CAP * Math.tanh(x / EDGE_CAP) : 2.2 * Math.tanh(x / 2.2)); // a dominant defense still dominates, a little more than a dominant offense
export function gameScript(qtr, margin, clock = 900) {
  if (qtr < 3) return 0;
  // The last five minutes of a one-score game: the team ahead sits in soft coverage and runs the
  // clock; the team behind gets yards underneath and a real shot to tie or win it.
  if (qtr >= 4 && clock < 480 && margin !== 0 && Math.abs(margin) <= 8) return margin < 0 ? 0.45 : -0.25;
  if (margin >= 24) return qtr >= 4 ? -0.9 : -0.55; // backups in, the playbook closed
  if (margin >= 17) return qtr >= 4 ? -0.6 : -0.35;
  if (margin >= 9) return qtr >= 4 ? -0.3 : -0.12; // protecting it: run the ball, keep everything in front
  if (margin <= -17) return 0.3;
  if (margin <= -9) return qtr >= 4 ? 0.35 : 0.15; // prevent coverage gives up yards underneath
  return 0;
}
function edges(g) {
  const o = g.sides[g.poss], d = g.sides[other(g.poss)];
  const dd = g.day ? g.day[g.poss].o - g.day[other(g.poss)].d : 0;
  const extra = o.mod / POINTS_PER_EDGE + (g.poss === "h" && !g.neutral ? HOME : 0) + dd + gameScript(g.ot ? 3 : g.qtr, g.score[g.poss] - g.score[other(g.poss)], g.clock);
  return { o, d, passE: soft((z(o.u.pass, "pass") - z(d.u.passD, "passD")) * SENSITIVITY + extra), runE: soft((z(o.u.run, "run") - z(d.u.runD, "runD")) * SENSITIVITY + extra), rushE: z(d.u.rush, "rush") - z(o.u.ol, "ol") };
}

// Field goal odds from a distance (yards) and the kicker's rating.
export const fgOdds = (dist, k = 75) => clamp(1.005 - 0.0045 * (dist - 18) - 0.0006 * Math.max(0, dist - 35) ** 2 + (k - 75) * 0.004, 0.15, 0.99);

function newPossession(g, yard) {
  g.poss = other(g.poss);
  g.yard = clamp(Math.round(yard), 1, 99);
  g.down = 1; g.toGo = Math.min(10, 100 - g.yard);
  g.stats[g.poss].drives++;
}
// Kickoff after a score (2025 rules: touchbacks come out to the 35, and most kicks are returned).
// The return depends on the returner and the kicking team's coverage; a great returner breaks a
// long one now and then, and once in a while takes it all the way. ev: the scoring play, which
// gets the return added to its text when it's worth telling.
function kickoff(g, ev, depth = 0) {
  const rand = g.rand, kick = g.poss, recv = other(kick);
  const R = g.sides[recv], K = g.sides[kick];
  newPossession(g, 35);
  if (rand() < 0.3 || !R) return; // touchback
  const r = R.krR ?? 80, catchAt = Math.round(rand() * 8);
  let spot = 28.5 + (r - 85) * 0.25 - ((K?.stCov ?? 70) - 70) * 0.06 + gauss(rand) * 6;
  if (rand() < 0.026 * Math.exp((r - 85) / 8)) spot += 20 + rand() * 65; // breaks one (a typical club's returner is about an 85)
  spot = Math.round(clamp(spot, catchAt + 5, 100));
  const p = R.kr, l = line(g, recv, p);
  add(l, "kr", 1);
  if (rand() < 0.005) { // muffed or stripped: the kicking team recovers
    add(l, "krYds", spot - catchAt); add(l, "fum", 1); g.stats[recv].fumLost++;
    newPossession(g, 100 - spot);
    if (ev) ev.text += ` ${p?.name || "The returner"} FUMBLES the kickoff, and the kicking team recovers!`;
    return;
  }
  if (spot >= 100) return returnTD(g, ev, recv, p, l, "krYds", "krTD", 100 - catchAt, "kickoff", depth);
  add(l, "krYds", spot - catchAt);
  g.yard = spot; g.toGo = 10;
  if (ev && spot - catchAt >= 40) ev.text += ` ${p?.name || "The returner"} brings the kickoff back ${spot - catchAt} yards to the ${spot > 50 ? `opponents' ${100 - spot}` : `${spot}`}.`;
}
// A kick or punt returned all the way.
function returnTD(g, ev, recv, p, l, ydsKey, tdKey, yds, what, depth) {
  add(l, ydsKey, yds); add(l, tdKey, 1); add(l, "pts", 6);
  g.stats[recv].tds++;
  let pts = 6;
  const kl = line(g, recv, g.sides[recv].k);
  add(kl, "xpA", 1);
  if (g.rand() < 0.955) { add(kl, "xpM", 1); add(kl, "pts", 1); pts++; }
  scored(g, recv, pts);
  if (ev) { ev.text += ` 🔥 ${p?.name || "The returner"} takes the ${what} back ${yds} yards for a TOUCHDOWN!`; ev.retTD = recv; }
  if (!g.done && depth < 3) kickoff(g, ev, depth + 1);
}

// Spend time on the clock and roll the quarter / half / game when it runs out.
function tick(g, secs) {
  g.clock -= secs;
  if (g.clock > 0) return null;
  if (g.ot) { // overtime period over
    if (g.score.h === g.score.a && g.playoff) { g.clock = 900; return "Another overtime period."; }
    g.done = true; return g.score.h === g.score.a ? "Overtime ends in a tie." : "Final.";
  }
  g.qtr++;
  if (g.qtr === 3) { g.clock = 900; g.poss = other(g.firstPoss); g.yard = 25; g.down = 1; g.toGo = 10; g.stats[g.poss].drives++; return "Halftime."; }
  if (g.qtr === 5) {
    if (g.score.h !== g.score.a) { g.done = true; g.qtr = 4; g.clock = 0; return "Final."; }
    g.ot = true; g.clock = g.playoff ? 900 : 600; g.poss = g.rand() < 0.5 ? "h" : "a"; g.yard = 25; g.down = 1; g.toGo = 10; g.stats[g.poss].drives++;
    return "Overtime!";
  }
  g.clock = 900;
  return `End of quarter ${g.qtr - 1}.`;
}

function scored(g, side, pts) {
  g.score[side] += pts;
  if (g.ot) { g.done = true; }
}

// Late with the game tied (or down 3 or less) and in comfortable range: play for the field goal.
const forTheKick = (g, lead) => ((g.qtr === 4 && g.clock < 150) || (g.ot && g.down >= 2)) && lead <= 0 && lead >= -3 && 100 - g.yard + 17 <= 45;
// Play style from the situation (or the user's call).
function chooseCall(g, o) {
  const rand = g.rand, lead = g.score[g.poss] - g.score[other(g.poss)];
  const late = g.qtr >= 4 && g.clock < 300, twoMin = (g.qtr === 2 || g.qtr === 4) && g.clock < 120;
  let pass = o.passLean;
  if (g.down === 3) pass = g.toGo >= 7 ? 0.86 : g.toGo <= 2 ? 0.42 : 0.68;
  else if (g.down === 2 && g.toGo >= 8) pass += 0.08;
  else if (g.down === 1) pass -= 0.08;
  // Game script: protect a big second-half lead on the ground; chase one through the air.
  if (g.qtr >= 3 && lead >= 14) pass -= g.qtr >= 4 ? 0.2 : 0.1;
  if (g.qtr >= 3 && lead <= -14) pass = Math.max(pass + 0.12, g.qtr >= 4 ? 0.75 : 0);
  // At the goal line, most teams pound it.
  if (g.yard >= 96 && g.down < 3) pass -= 0.18;
  // Tied or down three or less late, already in field-goal range: run, centre it, kick at the end.
  if (forTheKick(g, lead)) return "run";
  if ((late && lead < 0) || twoMin) pass = Math.max(pass, 0.8);
  if ((late && lead > 0) || (g.qtr >= 4 && lead >= 17)) pass = Math.min(pass, 0.3);
  return rand() < pass ? "pass" : "run";
}

// Run one play. call (optional, from the user): run_inside, run_outside, run_screen, scramble,
// pass_quick, pass_medium, pass_deep, pass_rpo, punt, fg. bonus: timing-minigame multiplier on
// yards gained. Returns what happened, for the play-by-play.
export function step(g, call, bonus = 1) {
  if (g.done) return null;
  const rand = g.rand;
  const { o, d, passE, runE, rushE } = edges(g);
  const off = g.poss, def = other(off);
  const st = g.stats[off];
  const lead = g.score[off] - g.score[def];
  const hurry = ((g.qtr === 2 || g.qtr === 4) && g.clock < 120) || (g.qtr === 4 && g.clock < 300 && lead < 0) || (g.qtr === 4 && lead <= -9);
  const fgDist = 100 - g.yard + 17;
  const before = { yard: g.yard, down: g.down, toGo: g.toGo, qtr: g.qtr, clock: g.clock, poss: off };
  const ev = { ...before, yards: 0, type: "", text: "", td: false, turnover: false, score: 0 };
  g.plays++;

  // Fourth down (or the end of a half in range): kick, punt or go for it.
  const endOfHalf = ((g.qtr === 2 || g.qtr === 4 || g.ot) && g.clock <= 25 && fgDist <= 55 && !(g.qtr >= 4 && lead < -3)) || (!call && forTheKick(g, lead) && g.down >= 3 && (g.clock <= 40 || g.ot));
  let decision = call === "punt" || call === "fg" ? call : null;
  if (!decision && (g.down === 4 || endOfHalf || (g.ot && g.down >= 3 && fgDist <= 52))) {
    if (endOfHalf && fgDist <= 55) decision = "fg";
    else if (g.ot && g.down >= 3 && fgDist <= 52 && !call) decision = "fg"; // overtime: take the points
    else if (g.down === 4) {
      const needTD = g.qtr === 4 && g.clock < 240 && lead < -3;
      // Modern 4th-down aggression: short yardage near midfield or in scoring range is often a go.
      const goShort = g.toGo <= 2 && g.yard >= 40 ? (g.toGo === 1 ? 0.7 : 0.45) : g.toGo <= 4 && g.yard >= 55 && g.yard < 70 ? 0.3 : 0;
      if (call) decision = null; // the user chose to go for it
      else if (needTD || (g.qtr === 4 && g.clock < 240 && lead < 0 && fgDist > 52)) decision = null;
      else if (rand() < goShort * (fgDist <= 40 ? 0.6 : 1)) decision = null;
      else if (fgDist <= 54) decision = "fg";
      else decision = "punt";
    }
  }
  if (decision === "fg") {
    const made = rand() < fgOdds(fgDist, o.kOvr);
    const kl = line(g, off, o.k);
    add(kl, "fgA", 1); st.fgA++;
    ev.type = made ? "fg" : "fg_miss"; ev.player = o.k;
    if (made) { add(kl, "fgM", 1); add(kl, "pts", 3); kl.lng = Math.max(kl.lng || 0, fgDist); st.fgM++; ev.score = 3; scored(g, off, 3); ev.text = `${o.k?.name || "Kicker"}'s ${fgDist}-yard field goal is GOOD.`; }
    else ev.text = `${o.k?.name || "Kicker"}'s ${fgDist}-yard try is NO GOOD.`;
    ev.note = tick(g, 6);
    if (!g.done) { if (made) kickoff(g, ev); else newPossession(g, Math.max(20, 100 - (g.yard - 7))); }
    return ev;
  }
  if (decision === "punt") {
    // The punt: its distance (the punter's leg), then the return (the returner against the
    // coverage team). Punts deep in their territory are mostly fair caught or downed.
    const pp = o.p, pl = pp ? line(g, off, pp) : null;
    // Distance from his rating and leg (league average: a 77 punter with a 93 leg, ~46 yards).
    const acc = o.pAcc ?? 82;
    const gross = Math.round(clamp(47 + ((o.pOvr ?? 77) - 77) * 0.3 + ((o.pPow ?? 93) - 93) * 0.15 + gauss(rand) * 7, 22, 72));
    const land = g.yard + gross;
    st.punts++;
    if (pl) { add(pl, "punts", 1); add(pl, "puntYds", Math.min(gross, 100 - g.yard)); }
    ev.type = "punt"; ev.turnover = false;
    ev.note = tick(g, 8);
    // Near the goal line a good punter pins it inside the 10 instead of sailing it into the end zone.
    const pinned = land >= 90 && rand() < 0.4 + (acc - 82) * 0.015;
    if (land >= 100 && !pinned) {
      ev.text = `Punt of ${100 - g.yard} yards into the end zone, touchback.`;
      if (!g.done) newPossession(g, 20);
      return ev;
    }
    const spot = pinned && land >= 100 ? 92 + Math.round(rand() * 6) : land; // where it's caught or downed
    let ret = 0;
    const r = d.prR ?? 80, p = d.pr, rl = line(g, def, p);
    if (rand() < (spot >= 88 ? 0.12 : 0.55)) {
      ret = Math.round(Math.max(0, 8 + (r - 85) * 0.22 - ((o.stCov ?? 70) - 70) * 0.05 + gauss(rand) * 5.5));
      if (rand() < 0.024 * Math.exp((r - 85) / 8)) ret += 15 + Math.round(rand() * 60); // breaks one
      add(rl, "pr", 1);
      if (rand() < 0.008) { // muffed: the punting team recovers
        add(rl, "fum", 1); g.stats[def].fumLost++;
        ev.text = `Punt, ${gross} yards. ${p?.name || "The returner"} MUFFS it, and the punting team recovers!`;
        if (!g.done) { g.yard = clamp(spot, 1, 99); g.down = 1; g.toGo = Math.min(10, 100 - g.yard); g.stats[off].drives++; }
        return ev;
      }
      if (100 - spot + ret >= 100) {
        ev.text = `Punt, ${gross} yards.`;
        if (!g.done) { newPossession(g, 99); returnTD(g, ev, def, p, rl, "prYds", "prTD", spot, "punt", 0); }
        return ev;
      }
      add(rl, "prYds", ret);
    }
    const recvYard = 100 - spot + ret;
    if (pl && recvYard <= 20) add(pl, "in20", 1);
    ev.text = ret >= 20 ? `Punt, ${gross} yards. ${p?.name || "The returner"} brings it back ${ret} yards!` : ret > 0 ? `Punt, ${gross} yards, returned ${ret}.` : `Punt, ${gross} yards${recvYard <= 10 ? `, downed at the ${recvYard}` : ", fair catch"}.`;
    if (!g.done) newPossession(g, recvYard);
    return ev;
  }

  // Penalties (~4% of snaps).
  if (rand() < 0.04) {
    st.penalties++;
    const offense = rand() < 0.55;
    const yds = offense ? (rand() < 0.6 ? -10 : -5) : rand() < 0.35 ? 15 : 5;
    ev.type = "penalty"; ev.yards = yds;
    ev.text = offense ? (yds === -10 ? "🚩 Holding, offense. 10-yard penalty." : "🚩 False start. 5-yard penalty.") : yds === 15 ? "🚩 Pass interference, defense. Automatic first down." : "🚩 Offside, defense. 5-yard penalty.";
    g.yard = clamp(g.yard + yds, 1, 99);
    if (yds === 15 || (!offense && yds >= g.toGo)) { g.down = 1; g.toGo = Math.min(10, 100 - g.yard); }
    else g.toGo = Math.max(1, g.toGo - yds);
    ev.note = tick(g, 5);
    return ev;
  }

  // Run or pass?
  let style = call && call.startsWith("pass_") ? "pass" : call && (call.startsWith("run_") || call === "scramble") ? "run" : null;
  if (call === "pass_rpo") style = rand() < 0.55 ? "pass" : "run";
  if (call === "run_screen") style = "screen";
  if (!style) style = chooseCall(g, o);
  const qb = o.qb;
  let yards = 0, desc = "", type = "", carrier = null, completed = false, clockStops = false;

  if (style === "pass" || style === "screen") {
    const deep = call === "pass_deep", quick = call === "pass_quick" || call === "pass_rpo", screen = style === "screen";
    const sackP = clamp(0.064 + rushE * 0.008 - passE * 0.004 + (deep ? 0.025 : quick || screen ? -0.035 : 0), 0.02, 0.14);
    const qbl = line(g, off, qb);
    if (!screen && rand() < sackP) {
      const loss = Math.round(5 + rand() * 5);
      // Multi-sack games happen, but a rusher who already has two gets chipped and doubled.
      const rusher = pickW(rand, d.rushW.map(([p, w]) => { const n = g.box[def][p.id]?.sacks || 0; return [p, n < 2 ? w : w * 0.45 ** (n - 1)]; }));
      add(qbl, "sk", 1); add(qbl, "skYds", loss); st.sacks++;
      // About one sack in seven is shared by two rushers: half a sack each.
      const helper = rusher && rand() < 0.14 ? pickW(rand, d.rushW.filter(([p]) => p !== rusher)) : null;
      if (rusher) { const rl = line(g, def, rusher); add(rl, "sacks", helper ? 0.5 : 1); add(rl, "qbH", 1); add(rl, "tkl", 1); }
      if (helper) { const hl = line(g, def, helper); add(hl, "sacks", 0.5); add(hl, "qbH", 1); }
      yards = -loss; type = "sack"; desc = `${qb?.name || "QB"} is SACKED${rusher ? ` by ${rusher.name}` : ""} for a loss of ${loss}.`;
      if (rand() < 0.07) { // strip sack
        if (rusher) add(line(g, def, rusher), "ff", 1);
        if (rand() < 0.55) { add(qbl, "fum", 1); st.fumLost++; type = "fumble"; ev.turnover = true; desc += " FUMBLE — recovered by the defense!"; }
      }
    } else if (!screen && !call && rand() < (qb?.spd >= 78 ? 0.05 : 0.02)) { // scramble
      yards = Math.round(clamp(3 + expo(rand, 4.5) + passE * 0.3, -2, 40));
      add(qbl, "rushAtt", 1); st.rushAtt++;
      carrier = qb; type = "run"; desc = `${qb?.name || "QB"} scrambles for ${yards}.`;
    } else {
      // Once a receiver has had a big day the ball spreads around (no 15-catch games every week).
      const busy = ([p, w]) => { const n = g.box[off][p.id]?.tgt || 0, s0 = 8 + Math.max(0, p.form || 0) * 0.5; return [p, n <= s0 ? w : w * Math.exp(-(n - s0) / 4)]; };
      const target = screen ? (o.rushers[0]?.[0] || pickW(rand, o.receivers.map(busy))) : pickW(rand, o.receivers.map(busy));
      const tl = line(g, off, target);
      add(qbl, "att", 1); add(tl, "tgt", 1); st.passAtt++;
      const intP = clamp(0.024 - passE * 0.004 + (deep ? 0.012 : quick ? -0.006 : 0) + (screen ? -0.015 : 0), 0.006, 0.06);
      if (rand() < intP) {
        const db = pickW(rand, d.covW);
        add(qbl, "passInt", 1); st.ints++;
        if (db) { add(line(g, def, db), "ints", 1); add(line(g, def, db), "pd", 1); }
        type = "int"; desc = `${qb?.name || "QB"}'s pass is INTERCEPTED${db ? ` by ${db.name}` : ""}!`;
        const ret = Math.round(clamp(expo(rand, 9), 0, 60));
        ev.turnover = true; ev.player = db; ev.defPlay = true;
        ev.type = type; ev.text = desc;
        ev.note = tick(g, 6);
        if (!g.done) newPossession(g, 100 - g.yard - Math.round(8 + rand() * 12) + ret);
        return ev;
      }
      const compP = clamp(0.655 + passE * 0.018 + ((target?.ovr || 75) - 75) * 0.0025 + (deep ? -0.22 : quick ? 0.08 : 0) + (screen ? 0.18 : 0), 0.3, 0.9);
      if (rand() < compP) {
        const mean = screen ? 5.5 : deep ? 24 : quick ? 6.5 : 9.9;
        yards = Math.round((2 + expo(rand, mean - 2 + passE * 0.45 + ((target?.ovr || 75) - 75) * 0.055 + Math.max(0, (target?.ovr || 75) - 90) * 0.08)) * (bonus || 1));
        // Now and then a catch turns into a big play after the catch (missed tackle, busted coverage).
        if (!deep && rand() < clamp(0.02 + Math.max(0, (target?.spd || 85) - 88) * 0.0015 + passE * 0.008, 0.004, 0.05)) yards += Math.round(12 + expo(rand, 16));
        if (screen && rand() < 0.15) yards = -Math.round(rand() * 3);
        completed = true; carrier = target; type = "pass";
        add(qbl, "comp", 1); add(tl, "rec", 1); st.comp++;
        desc = `${qb?.name || "QB"} finds ${target?.name || "his receiver"} for ${yards}.`;
      } else {
        type = "inc"; clockStops = true;
        if (rand() < 0.3) { const db = pickW(rand, d.covW); if (db) add(line(g, def, db), "pd", 1); desc = `${qb?.name || "QB"}'s pass for ${last(target)} is broken up${db ? ` by ${db.name}` : ""}.`; }
        else desc = `${qb?.name || "QB"}'s pass ${deep ? "deep " : ""}for ${last(target)} falls incomplete.`;
      }
    }
  } else {
    // Designed run: the back (by depth, snaps and talent), now and then a QB keeper.
    const keeper = call === "scramble" || (!call && (qb?.spd || 60) >= 80 && rand() < 0.1);
    // A back's share tapers off as his carries pile up in a game (fatigue): a workhorse gets ~20-24,
    // and the season record (416) stays out of reach.
    // A back in the form of his life gets fed a few more before the staff spells him.
    const tired = ([p, w]) => { const n = g.box[off][p.id]?.rushAtt || 0, s0 = 12 + Math.max(0, p.form || 0) * 0.5; return [p, n <= s0 ? w : w * Math.exp(-(n - s0) / 4)]; };
    carrier = keeper ? qb : pickW(rand, o.rushers.map(tired)) || qb;
    const outside = call === "run_outside";
    // Heavy workloads wear a back down: past ~18 carries in a game he averages a little less.
    const load = carrier && !keeper ? Math.max(0, (g.box[off][carrier.id]?.rushAtt || 0) - 18) : 0;
    const mean = 3.85 + runE * 0.3 + ((carrier?.ovr || 75) - 75) * 0.022 + (keeper ? 0.6 : 0) - load * 0.06;
    const breakaway = rand() < clamp(0.047 + ((carrier?.spd || 80) - 82) * 0.0018 - load * 0.003 + runE * 0.005 + (outside ? 0.025 : 0), 0.015, 0.12);
    yards = breakaway ? Math.round(mean + 5 + expo(rand, 11)) : Math.round(clamp(mean - 0.6 + gauss(rand) * (outside ? 3.3 : 2.5), -4, 14));
    if (yards > 0) yards = Math.round(yards * (bonus || 1));
    const cl = line(g, off, carrier);
    add(cl, "rushAtt", 1); st.rushAtt++;
    type = "run";
    desc = `${carrier?.name || "Runner"} ${keeper ? "keeps it" : outside ? "bounces outside" : ["up the middle", "off left tackle", "off right tackle"][Math.floor(rand() * 3)]} for ${yards}.`;
    if (yards < 0) { const t = pickW(rand, d.tackleW); if (t) add(line(g, def, t), "tfl", 1); }
  }

  // Ball carrier: yardage, touchdowns, fumbles, tackles.
  if (type === "run" || type === "pass") {
    const room = 100 - g.yard;
    if (yards >= room) yards = room;
    const cl = line(g, off, carrier);
    if (type === "run") { add(cl, "rushYds", yards); st.rushYds += yards; }
    else { add(cl, "recYds", yards); add(line(g, off, qb), "passYds", yards); st.passYds += yards; }
    if (yards >= room) {
      ev.td = true; st.tds++;
      if (type === "run") add(cl, "rushTD", 1); else { add(cl, "recTD", 1); add(line(g, off, qb), "passTD", 1); }
      desc = type === "run" ? `${carrier?.name || "Runner"} runs it in from ${room} — TOUCHDOWN!` : `${qb?.name || "QB"} hits ${carrier?.name || "his receiver"} for a ${room}-yard TOUCHDOWN!`;
    } else if (rand() < (type === "run" ? 0.0055 : 0.004) - Math.max(-0.002, Math.min(0.002, (type === "run" ? runE : passE) * 0.0006))) {
      add(cl, "fum", 1); st.fumLost++;
      const t = pickW(rand, d.tackleW); if (t) add(line(g, def, t), "ff", 1);
      ev.turnover = true; type = "fumble"; desc += ` FUMBLE — the defense recovers!`;
    } else {
      const t = pickW(rand, d.tackleW);
      if (t) { add(line(g, def, t), "tkl", 1); if (rand() < 0.3) { const t2 = pickW(rand, d.tackleW); if (t2 && t2 !== t) add(line(g, def, t2), "ast", 1); } }
      if (rand() < 0.14) clockStops = true; // out of bounds
    }
  }

  ev.type = ev.td ? "td" : type; ev.yards = yards; ev.player = carrier; ev.passer = completed ? qb : null; ev.text = desc;

  if (ev.td) {
    // Extra point (or the occasional two-point try).
    const kl = line(g, off, o.k);
    let pts = 6;
    if (rand() < 0.05 || (g.qtr === 4 && g.clock < 300 && [-2, -10, 5, 1].includes(g.score[off] + 6 - g.score[def]))) {
      if (rand() < 0.48) { pts += 2; ev.text += " Two-point try is good."; } else ev.text += " Two-point try fails.";
    } else {
      add(kl, "xpA", 1);
      if (rand() < 0.955) { add(kl, "xpM", 1); add(kl, "pts", 1); pts += 1; } else ev.text += " Extra point is no good.";
    }
    ev.score = pts; scored(g, off, pts);
    ev.note = tick(g, 6);
    if (!g.done) kickoff(g, ev);
    return ev;
  }
  if (type === "fumble") {
    ev.note = tick(g, 6);
    if (!g.done) newPossession(g, 100 - clamp(g.yard + yards, 1, 99));
    return ev;
  }

  // Spot the ball, update downs.
  g.yard += yards;
  if (g.yard <= 0) { // safety
    ev.type = "safety"; ev.text += " SAFETY!"; ev.score = 0; scored(g, def, 2);
    ev.note = tick(g, 6);
    if (!g.done) newPossession(g, 35); // free kick to the team that scored
    return ev;
  }
  if (yards >= g.toGo) { g.down = 1; g.toGo = Math.min(10, 100 - g.yard); ev.firstDown = true; }
  else { g.down++; g.toGo -= yards; }
  if (g.down > 4) { // turnover on downs
    ev.text += " Turnover on downs.";
    ev.downs = true;
    ev.note = tick(g, hurry ? 4 : 6);
    if (!g.done) newPossession(g, 100 - g.yard);
    return ev;
  }
  ev.note = tick(g, clockStops ? (hurry ? 5 : 7) : hurry ? 18 : (late(g) && lead > 0) || (g.qtr === 4 && lead >= 9) ? 44 : 40 + Math.round(rand() * 8));
  return ev;
}
const late = (g) => g.qtr === 4 && g.clock < 300;

// Play a whole game instantly.
export function playGame(g) {
  let guard = 0;
  while (!g.done && guard++ < 400) step(g);
  if (!g.done) g.done = true;
  return g;
}

// Season stats lines keyed by player id for each side, with QB ratings left to the caller.
export const boxOf = (g) => g.box;
