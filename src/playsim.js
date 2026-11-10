// The game engine, play by play. Quick sims and watched (live) games both run on it, so they
// follow the same rules: real downs and distance, field position, a 60-minute clock, 4th-down
// decisions, field goals by distance, punts, turnovers, overtime.
//
// Every play is decided by the offense's starters against the defense's (unit ratings from the
// depth chart): a better offense gains more yards, completes more passes and turns it over less;
// a better defense gets more stops, sacks and takeaways. Players get the ball by depth chart,
// snap share AND talent, so a star WR1 or RB1 sees a star's share of the touches.
// Every snap the offense picks a personnel grouping from its identity (11, 12, 21...) and the
// defense answers with a package (base, nickel, dime); the units on the field are rated for that
// snap, players at the roles they're playing (SAM/MIKE/WILL, CB1/CB2/nickel, X/Z/slot), and each
// throw is a matchup: the receiver against whoever has him (a corner, or a linebacker if the
// defense stayed in base against three receivers).
//
// Tuned to the modern NFL (checked over whole simulated seasons with scripts/scoring.mjs):
// ~22 points a team, ~63 offensive plays, ~11.5 drives, ~40% on third down, ~235 passing and
// ~120 rushing yards, ~65% completions, ~2.5 sacks, ~0.8 interceptions and ~87% on field goals.
// The score shapes the game the way it does on Sundays: a team well ahead in the second half
// runs the ball and goes vanilla, a team well behind throws into soft coverage, close games
// come down to the last drives (and the field goal at the end), and lopsided mismatches have
// diminishing returns, so blowouts and 50-point games stay rare.
import { retRating } from "./special.js";
import { wxOf } from "./weather.js";
import { unitRatings, offUnits, defUnits, lbCover } from "./gamesim.js";
import { dlAsPlayed } from "./dline.js";
import { ROLE_SLOTS, rolesAsPlayed } from "./roles.js";
import { PERS, PKGS, PERS_LEAN, offMix, defTilt, pickPers, pickPkg, pkgOdds, bestOffSet, snapShape, situationOf, sitPers, sitPkg } from "./personnel.js";
import { roleOvr } from "./roles.js";
import { getLeagueYear } from "./cap.js";
import { hurtPen } from "./injuries.js";
import { recPlay } from "./gameday.js";
import { iqEdge, readOdds, readComp, readInt, intShift, sackShift } from "./qbiq.js";
import { coachAggression } from "./coachStyle.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = (rand) => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const expo = (rand, mean) => -Math.log(1 - rand() * 0.9999) * mean;
const last = (p) => (p?.name || "").split(" ").slice(-1)[0] || "Player";

// Home-field advantage and how much the game-day modifiers (game plan, coaches,
// weather...) count: both in "edge" units, where 1 unit is worth about 2.5 points a game.
export const HOME_EDGE = 0.65; // home teams win ~54-55% in the real game, like the NFL (the in-game crowd and travel add a little on top; a 20-season playtest at 1.0 came out near 57%)
let HOME = HOME_EDGE;
export const POINTS_PER_EDGE = 2.5;

// Who gets the ball: snap share x how often that spot is targeted per snap x talent. Each
// rating point above 75 adds ~1.5% to a player's share, so an elite WR1 sees ~30% of the
// targets (a good one ~25%) and an elite back ~75% of the carries.
const TALENT = 0.019;
const TGT_RATE = { WR: [0.23, 0.21, 0.19, 0.18, 0.18], TE: [0.21, 0.17, 0.15], RB: [0.13, 0.12, 0.1] };
const TK = { DL: [0.07, 0.07, 0.06, 0.06, 0.03, 0.02], LB: [0.14, 0.12, 0.08, 0.03], CB: [0.07, 0.06, 0.03], S: [0.09, 0.08, 0.02] };
// By role on the field: how often each spot is thrown to, and how often each defender makes the tackle.
const ROLE_TGT = { X: 0.21, Z: 0.2, SLOT: 0.2, WR4: 0.14, TE1: 0.19, TE2: 0.12, TE3: 0.06, FB: 0.05 };
const ROLE_TK = { SAM: 0.11, MIKE: 0.14, WILL: 0.12, CB1: 0.07, CB2: 0.06, NB: 0.07, CB4: 0.03 };
const WR_ROLES = ["X", "Z", "SLOT", "WR4"];
// Personnel stats: for each offense, every grouping it played (snaps, yards, successful snaps: 40%
// of the yards needed on first down, 60% on second, all of them on third and fourth); for each
// defense, the same against each package it played.
function persLog(g, off, def, pers, pkg, yards, ok) {
  const add = (o, k) => { const r = (o[k] ||= { n: 0, yds: 0, ok: 0 }); r.n++; r.yds += yards; if (ok) r.ok++; };
  if (g.stats?.[off]) add((g.stats[off].persY ||= {}), pers);
  if (g.stats?.[def]) add((g.stats[def].pkgY ||= {}), pkg);
}

// The play-by-play names the matchup when it decided the play: a big catch, or a mismatch.
const COVER_NAME = { SAM: "the SAM", MIKE: "the MIKE", WILL: "the WILL", CB1: "CB1", CB2: "the No. 2 corner", NB: "the nickel" };
const SPOT = { SLOT: " in the slot", TE1: "", TE2: "", RB: " out of the backfield", FB: " out of the backfield" };
function matchupNote(cm, role, mm, yards, pkg) {
  if (!cm || !(yards >= 15 || (mm >= 9 && yards >= 8))) return "";
  const who = COVER_NAME[cm.role] || (cm.pos === "S" ? "the safety" : cm.pos === "CB" ? "the corner" : "the linebacker");
  const mis = cm.pos === "LB" && (role === "SLOT" || role === "X" || role === "Z") ? `, a linebacker on a receiver${pkg === "base" ? " with the defense in base" : ""}` : "";
  return `, beating ${who}, ${last(cm)},${SPOT[role] ?? ""}${mis}`.replace(/,$/, "");
}

// A receiver's matchup: how much his rating beats his cover man's moves completion odds and yards.
// MM0 centers it on the league's typical matchup, so only a mismatch (a slot receiver on a
// linebacker, a great nickel on a so-so slot) moves the needle.
const MM0 = 4.3;

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
// How much more often a rusher gets home than an average one in his role, by his pass rush (a 95
// rusher about 1.65 times a 75). The front as a whole decides how often the quarterback goes
// down; this decides who gets there.
// A rusher piling up sacks gets schemed against (chipped, doubled, slid to) as the season goes on:
// past a dozen, each one comes harder. A great one still leads the league; a record is rare.
const hotRusher = (p) => Math.exp(-Math.max(0, (p.ss?.sacks || 0) - 12) / 7);
const rushQ = (p) => Math.exp(((p.posAttrs?.passRush ?? p.ovr ?? 70) - 75) * 0.025);
function rushRole(p) {
  if (p.pos === "DL") return p.dlKind ? (p.dlKind === "DT" ? 0.6 : 1) : p.mpos ? (p.mpos === "DT" ? 0.6 : 1) : (p.wt || 280) >= 292 ? 0.6 : 1;
  if (p.pos === "LB") return (p.role || p.mpos) === "SAM" ? 0.3 : 0.14;
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

// How a defense calls its plays: how often it blitzes, loads the box against the run, or drops
// into coverage. Set by the week's game plan (gamePlan.js), the coordinator's scheme and his
// specialty. Each call changes the play: a blitz brings more sacks and rushed throws but leaves
// receivers open behind it; a loaded box stuffs runs but opens up the pass; coverage takes away
// the deep ball and gives up yards on the ground.
export function defStyle(team, plan) {
  const dc = team?.coach?.dc || {};
  const p = plan?.def === "conservative" || plan?.def === "prevent" ? "coverage" : plan?.def || "balanced";
  let blitz = 0.22, box = 0.2, cover = 0.2;
  if (p === "aggressive") blitz += 0.2, cover -= 0.08;
  if (p === "run_stop") box += 0.25, blitz += 0.03, cover -= 0.08;
  if (p === "coverage") cover += 0.25, blitz -= 0.12, box -= 0.08;
  if (dc.scheme === "Zone Blitz") blitz += 0.08;
  if (dc.scheme === "Cover 2") cover += 0.08, blitz -= 0.04;
  if (dc.scheme === "3-4") blitz += 0.03;
  if (dc.spec === "Blitz Pkg") blitz += 0.07;
  if (dc.spec === "Zone Cov") cover += 0.07;
  if (dc.spec === "Run Stop") box += 0.07;
  return { blitz: clamp(blitz, 0.05, 0.6), box: clamp(box, 0.05, 0.55), cover: clamp(cover, 0.05, 0.55) };
}
// The offensive coordinator's specialty tilts the play calling too.
const OC_LEAN = { "Run Game": -0.04, Spread: 0.04, "Play-Action": 0 };

// How a typical defense rates in each package against its own average (pass D, run D): base is
// stouter against the run and weaker in coverage. Measured over the league (calibrateLeague).
export const PKG_OFF = { base: { passD: -0.75, runD: 0.44 }, nickel: { passD: 0.33, runD: -0.2 }, dime: { passD: 0.21, runD: -0.08 } };
export const setPkgOff = (o) => { for (const k of PKGS) if (o?.[k]) PKG_OFF[k] = o[k]; };

// The personnel identity that fits a roster best: each grouping valued by how its passing and
// running measure up against the league AND against the package defenses answer it with (two
// tight ends pull a defense into base, so the passing game sees a linebacker in coverage),
// weighted by how often it throws. A pass play is worth more than a run on its own (PASS_PREMIUM,
// in the same units: set so an average roster is about even between the balanced, spread and
// two-tight-end identities), so running more costs something unless the roster makes it pay.
const PASS_PREMIUM = 1.5;
export function autoOffSet(team, order) {
  const val = (pers) => {
    const u = offUnits(order, pers), pl = 0.58 + PERS_LEAN[pers], odds = pkgOdds(pers, 0);
    const dp = PKGS.reduce((t, k, i) => t + odds[i] * PKG_OFF[k].passD, 0), dr = PKGS.reduce((t, k, i) => t + odds[i] * PKG_OFF[k].runD, 0);
    return pl * (PASS_PREMIUM + z(u.pass, "pass") - dp / LEAGUE.passD[1]) + (1 - pl) * (z(u.run, "run") - dr / LEAGUE.runD[1]);
  };
  return bestOffSet(val, team?.coach?.oc?.scheme);
}

// A club's personnel picture: its offensive identity (set, or the auto pick), the mix that comes
// with it, its defense's lean toward base or nickel, and the snap shares those add up to.
// order(pos): its players in depth order (raw or already rated at their roles).
export function teamPersonnel(team, order) {
  const auto = autoOffSet(team, order), mix = offMix(team, auto);
  const sam = order("LB")[0], nb = order("CB")[2];
  const tilt = defTilt(team, sam ? (sam.natOvr != null ? sam.ovr : roleOvr(sam, "SAM")) : 60, nb ? (nb.natOvr != null ? nb.ovr : roleOvr(nb, "NB")) : 60);
  return { offSet: team?.personnel && team.personnel !== "auto" ? team.personnel : auto, auto, mix, tilt, shape: snapShape(mix, tilt) };
}

export function makeSide({ team, order: depth, snaps, mod = 0, lean = 0, plan = null, season = getLeagueYear() }) {
  // Everyone plays at his rating plus his form this season; the defensive line at its spots
  // (edges at LE/RE, tackles inside, each rated for his spot).
  // A player playing hurt (questionable) suits up at a reduced rating.
  const formed = (list) => list.map((p) => { const f = seasonForm(p.id, season) - hurtPen(p); return f ? { ...p, ovr: clamp((p.ovr || 70) + f, 30, 105), form: f } : p; });
  const memo = {};
  // linebackers, corners and receivers at their roles (roles.js), rated for the spot they play
  const order = (pos) => (memo[pos] ||= pos === "DL" ? dlAsPlayed(formed(depth("DL"))) : ROLE_SLOTS[pos] ? rolesAsPlayed(pos, formed(depth(pos))) : formed(depth(pos)));
  // the offense's personnel identity (yours, or the one that fits the roster) and the defense's lean
  const { mix, tilt } = teamPersonnel(team, order);
  const u = unitRatings(order, { mix, tilt });
  const oU = Object.fromEntries(PERS.map((p) => [p, offUnits(order, p)]));
  const dU = Object.fromEntries(PKGS.map((k) => [k, defUnits(order, k)]));
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
  // [p, weight, an average player's weight in his role and snaps (the grades' bar)]
  const rushW = defs.map(([p, w]) => [p, rushRole(p) * w * rushQ(p), rushRole(p) * w]);
  const covW = defs.map(([p, w]) => [p, (p.pos === "CB" ? 1.4 : p.pos === "S" ? 1.1 : p.pos === "LB" ? 0.35 : 0.05) * w * q(p, 0.035)]);
  const tackleW = defs.map(([p, w]) => [p, w]);
  // Who's out there in each grouping: the receivers by role, plus the backs (by snaps, as before).
  // A backup in the rotation (snaps you gave him) still sees the odd target.
  const backs = receivers.filter(([p]) => p.pos === "RB");
  const recvBy = Object.fromEntries(PERS.map((pers) => {
    const on_ = oU[pers].on, list = [];
    on_.wr.forEach((p, i) => { const r = on_.wr.length < 3 ? p.role : WR_ROLES[i]; list.push([p, (ROLE_TGT[r] ?? 0.1) * q(p, TALENT), r]); });
    on_.te.forEach((p, i) => list.push([p, (ROLE_TGT[`TE${i + 1}`] ?? 0.05) * q(p, TALENT), `TE${i + 1}`]));
    if (on_.fb) list.push([on_.fb, ROLE_TGT.FB, "FB"]);
    for (const [p, w] of backs) if (!list.some(([x]) => x === p)) list.push([p, w, "RB"]);
    for (const [p, w] of receivers) if (p.pos !== "RB" && !list.some(([x]) => x === p) && (snaps[p.id] || 0) >= 10) list.push([p, w * 0.25, "ROT"]);
    return [pers, list];
  }));
  // The defense in each package: who's on the field, who makes tackles, gets home, makes plays on the ball.
  const dlOn = defs.filter(([p]) => p.pos === "DL");
  const sOn = order("S").slice(0, 2);
  const defBy = Object.fromEntries(PKGS.map((k) => {
    const on_ = dU[k].on, list = [...dlOn];
    on_.lbs.forEach((p) => list.push([p, (ROLE_TK[p.role] ?? 0.1) * q(p, 0.01)]));
    on_.cbs.forEach((p, i) => list.push([p, (ROLE_TK[p.role || (i === 3 ? "CB4" : "")] ?? 0.03) * q(p, 0.01)]));
    sOn.forEach((p, i) => list.push([p, (TK.S[i] ?? 0.02) * q(p, 0.01)]));
    return [k, {
      tackleW: list, rushW: list.map(([p, w]) => [p, rushRole(p) * w * rushQ(p), rushRole(p) * w]),
      covW: list.map(([p, w]) => [p, (p.pos === "CB" ? 1.4 : p.pos === "S" ? 1.1 : p.pos === "LB" ? 0.35 : 0.05) * w * q(p, 0.035)]),
      on: on_,
    }];
  }));
  // Who covers a receiver in a package. CB1 takes the better of the two outside receivers.
  const L = order("LB"), CBs = order("CB"), Ss = order("S");
  const cover = (pkg, role, target, onWR) => {
    if (role === "X" || role === "Z") {
      const other = onWR.find((p, i) => i < 2 && p !== target);
      return (!other || (target.ovr || 0) >= (other.ovr || 0)) ? CBs[0] : CBs[1];
    }
    if (role === "SLOT") return pkg === "base" ? L[2] || L[1] : CBs[2];
    if (role === "WR4") return pkg === "dime" ? CBs[3] || Ss[1] : Ss[1];
    if (role === "TE1") return pkg === "base" ? L[0] : pkg === "nickel" ? L[2] || Ss[1] : Ss[1];
    if (role === "TE2" || role === "TE3") return Ss[1] || L[1];
    return L[1] || L[2]; // backs: the MIKE (or WILL)
  };
  const k = on("K")[0] || order("K")[0];
  // Special teams: the returners, and the coverage units (the special teams coach).
  const kr = order("KR")?.[0], pr = order("PR")?.[0];
  // The punter (a kicker punts, badly, if a club has none).
  const p = on("P")[0] || order("P")?.[0];
  const pOvr = p ? p.ovr || 75 : 60, pPow = p ? p.posAttrs?.power ?? 93 : 85, pAcc = p ? p.posAttrs?.accuracy ?? 82 : 65, pHang = p ? p.posAttrs?.hangTime ?? 86 : 70;
  const stCov = team?.coach?.st?.rating ?? 70;
  const kLeg = k?.posAttrs?.legStr ?? k?.attrs?.legStr ?? 93;
  const hcR = team?.coach?.hc?.rating ?? 70; // the head coach makes the 4th-down calls
  const hcAgg = coachAggression(team?.coach?.hc); // ...in his own style
  // Measured against the league's balance, so league-wide rating drift doesn't tilt everyone's play-calling.
  const passLean = clamp(0.6 + ((u.pass - LEAGUE.pass[0]) - (u.run - LEAGUE.run[0])) * 0.006 + lean + (OC_LEAN[team?.coach?.oc?.spec] || 0), 0.5, 0.64);
  const dStyle = defStyle(team, plan), paSpec = team?.coach?.oc?.spec === "Play-Action";
  // the five up front, left to right (the line's own stats: who allowed what)
  const ol = ["LT", "LG", "C", "RG", "RT"].map((pos) => on(pos)[0] || order(pos)[0] || null);
  return { team, order, u, oU, dU, mix, tilt, recvBy, defBy, cover, mod, passLean, dStyle, paSpec, receivers, rushers, ol, qb, defs, rushW, covW, tackleW, k, kOvr: k?.ovr || 70, kr, krR: kr ? retRating(kr) : 80, pr, prR: pr ? retRating(pr) : 80, stCov, hcR, hcAgg, kLeg, p, pOvr, pPow, pAcc, pHang };
}

const emptyTeam = () => ({ blitz: 0, box: 0, cover: 0, dropbacks: 0, plays: 0, passAtt: 0, comp: 0, passYds: 0, rushAtt: 0, rushYds: 0, sacks: 0, ints: 0, fumLost: 0, punts: 0, fgA: 0, fgM: 0, tds: 0, drives: 0, penalties: 0 });

export function createGame(home, away, { playoff = false, neutral = false, rand = Math.random, rec = false, wx = "clear" } = {}) {
  const first = rand() < 0.5 ? "h" : "a";
  const g = {
    sides: { h: home, a: away }, playoff, neutral, rand,
    // the weather (weather.js): wx its key, wxE what it does to the game
    wx, wxE: wxOf(wx),
    // the game opens with a kickoff to the team that won the toss (koNext: the next snap is a kickoff)
    poss: first === "h" ? "a" : "h", firstPoss: first, koNext: true, yard: 35, down: 1, toGo: 10, qtr: 1, clock: 900,
    score: { h: 0, a: 0 }, done: false, ot: false, otScored: false, plays: 0, to: { h: 3, a: 3 },
    box: { h: {}, a: {} }, stats: { h: emptyTeam(), a: emptyTeam() },
    ...(rec ? { pl: [] } : {}),
  };
  // Any given Sunday: each side has a good or bad day on offense and on defense.
  const day = () => ({ o: gauss(rand) * GAME_DAY_SD, d: gauss(rand) * GAME_DAY_SD });
  g.day = { h: day(), a: day() };
  return g;
}

// ---------- The offensive line's stats ----------
// Who allowed the sack or the pressure, and whose gap a run went through. Pure bookkeeping on its
// own dice (olRand), so the play itself plays out exactly as it would without it.
function olRand(g) { g.olS = (Math.imul(g.olS ?? 0x2545f491, 1664525) + 1013904223) >>> 0; return g.olS / 4294967296; }
const olPick = (g, list, w) => { const ws = list.map(w), t = ws.reduce((a, b) => a + b, 0); let r = olRand(g) * t; for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; };
// a lineman's chance of losing a rep: the weaker the blocker, the more often it's him
const pbW = (p) => (100 - (p?.posAttrs?.passBlock ?? p?.ovr ?? 70)) / 20 + 0.8;
const rbW = (p) => (100 - (p?.posAttrs?.runBlock ?? p?.posAttrs?.anchor ?? p?.ovr ?? 70)) / 20 + 0.8;
const rbS = (p) => Math.exp(((p?.posAttrs?.runBlock ?? p?.posAttrs?.anchor ?? p?.ovr ?? 70) - 75) * 0.06);
function olBook(g, side, ol, k, type, yards, desc) {
  const five = (ol || []).filter(Boolean);
  if (!five.length) return;
  const [lt, lg, c, rg, rt] = ol;
  if (k.pass) {
    five.forEach((p) => add(line(g, side, p), "pbSnp", 1));
    if (k.sacked) {
      // an edge rusher beat a tackle, an interior rusher a guard or the center. Not every sack is
      // on the line: the quarterback held it, the coverage held up, a back or tight end missed his
      // man, or a blitzer came free (as in the NFL, a little over half are charged up front).
      const r = k.rusher, inside = r?.dlKind === "DT", edge = r?.dlKind === "EDGE" || (r?.pos === "DL" && !inside);
      const who = olRand(g) < (edge || inside ? 0.6 : 0.4) ? (edge ? [lt, rt] : inside ? [lg, c, rg] : five) : [];
      const lost = who.filter(Boolean).length ? olPick(g, who.filter(Boolean), pbW) : null;
      if (lost) add(line(g, side, lost), "sackA", 1);
      k.lost = lost;
    } else if (olRand(g) < Math.min(0.45, Math.max(0.15, k.sackP * 4.2))) {
      // a pressure: the throw still came out, but someone up front lost his man (most of them do;
      // the rest are a back or tight end, or a free rusher)
      if (olRand(g) < 0.85) add(line(g, side, olPick(g, five, pbW)), "presA", 1);
      k.pres = true;
    }
  } else if (k.run) {
    // the gap it went through: off a tackle, around an end, or inside
    const gap = /left (tackle|end)/.test(desc) ? [lt, lg] : /right (tackle|end)/.test(desc) ? [rt, rg] : /outside/.test(desc) ? [lt, rt] : [lg, c, rg];
    const at = gap.filter(Boolean);
    if (!at.length) return;
    at.forEach((p) => add(line(g, side, p), "rbSnp", 1));
    // a good run: the block that sprung it, more often the better run blocker in the gap (crediting
    // everyone in the gap graded the back and the play call, not the lineman); a stuffed run: the
    // block that lost, more often the weaker one
    if (yards >= 4) add(line(g, side, olPick(g, at, rbS)), "rbWin", 1);
    else if (yards <= 0) add(line(g, side, olPick(g, at, rbW)), "rbStuff", 1);
  }
}

// ---------- The grades (src/grades.js turns these into 0-100) ----------
// Every snap, each man involved is graded against what an average player would have done in the
// same spot: the same teammates, line, coverage, call and score. A quarterback throwing to great
// receivers is held to a higher bar; a back behind a bad line to a lower one. So a grade says how
// good he is, not how good his team is. Sums and counts per facet (qb, rc receiving, ru rushing,
// pr pass rush, cv coverage, rd run defense), plus pressures and coverage stats. Bookkeeping only:
// the play is already decided (pressure and stop credit use the line's own dice, olRand).
export const AVG = { qb: 78, rec: 76, cov: 76, rb: 76 };
// pass-rush credit: a sack, a half sack, a pressure that didn't get home
const SACK_G = 3, HELP_G = 1, PRES_G = 0.5;
// how much less an interior rusher averages per snap than an edge rusher (measured; see gradeBook)
const DT_LIFT = 0.0043;
const phi = (x) => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));   // normal CDF
const cap = (v, a, b) => Math.max(a, Math.min(b, v));
function gradeBook(g, off, def, dP, k, yards) {
  const G = (side, p, f, v) => { if (!p) return; const l = line(g, side, p); add(l, f + "G", v); add(l, f + "N", 1); };
  // the passer and the target
  if (k.sacked) G(off, k.qb, "qb", k.lost ? -0.15 : -0.6);   // a sack nobody up front gave up: he held it
  if (k.scr != null) G(off, k.qb, "qb", cap((k.scr - 3) / 8, -0.5, 1.5));
  const t = k.tgt;
  if (t) {
    // the result, plus the process: how much he moved the odds before the ball came down (a great
    // throw that falls incomplete still graded well; a lucky catch off a bad one doesn't fully count)
    const done = !!k.comp && !k.int, proc = (c0, y0, yd) => (t.cA - c0) * 2.5 + (t.yA - y0) / yd;
    G(off, k.qb, "qb", (k.int ? -1.6 : done ? 1 - t.cQ + cap((yards - t.yQ) / 20, -0.5, 1) : -0.7 * t.cQ) + proc(t.cQ, t.yQ, 20));
    G(off, t.target, "rc", (k.int ? -0.3 : done ? 1 - t.cR + cap((yards - t.yR) / 15, -0.5, 1.5) - (k.fum ? 1.5 : 0) : -0.4 * t.cR) + 0.35 * proc(t.cR, t.yR, 15));
    if (t.cm) {
      const cl = line(g, def, t.cm);
      add(cl, "covT", 1); if (done) { add(cl, "covC", 1); add(cl, "covY", yards); }
      G(def, t.cm, "cv", (k.int && k.db === t.cm ? 1.5 : done ? -(1 - t.cC) - cap((yards - t.yC) / 20, -0.5, 1) : 0.6 * t.cC + (k.pdBy === t.cm ? 0.3 : 0)) - 0.6 * proc(t.cC, t.yC, 20));
    }
  }
  // the pass rush: who got home (a sack, or a pressure on the throw), against what an average front
  // gets against this line. A sack counts six times a pressure: sacks go to the rushers who win
  // (the play engine picks the man by his rush), while pressures are spread across the front, so
  // weighting them equally graded a rusher on his share of the line's pressures, not on getting home.
  if (k.dropback) {
    const rush = (dP.rushW || []).filter(([p, w]) => w > 0 && (p.pos === "DL" || p.pos === "LB"));
    // the bar: what an average player in each man's role and snaps would get (his share of the
    // front without his rush rating), so a rusher who wins more than his share grades above it
    const W0 = rush.reduce((a, [, w, w0]) => a + (w0 ?? w), 0) || 1;
    // The bar is half this snap's (the line he faced, the call) and half a league-average snap, so
    // getting home counts: a sack leader isn't graded average because his defense blitzes a lot.
    const bar = (sp) => sp * (SACK_G + 0.22 * HELP_G) + (1 - sp) * Math.min(0.45, Math.max(0.15, sp * 4.2)) * PRES_G;
    const e = 0.25 * bar(k.sackP0) + 0.75 * bar(0.064);
    const got = new Map();
    if (k.sacked) { if (k.rusher) got.set(k.rusher, SACK_G); if (k.helper) got.set(k.helper, HELP_G); }
    else if (k.pres && rush.length) got.set(olPick(g, rush, ([, w]) => w)[0], PRES_G);
    for (const p of got.keys()) add(line(g, def, p), "pres", 1);
    // an interior rusher is held to the bar of his share, but the inside rush gets home less often
    // than the edge: lift him by that gap so tackles and ends share one scale
    for (const [p, w, w0] of rush) G(def, p, "pr", (got.get(p) || 0) - ((w0 ?? w) / W0) * e + (p.pos === "DL" && rushRole(p) < 1 ? DT_LIFT : 0));
    for (const [p, v] of got) if (!rush.some(([q]) => q === p)) G(def, p, "pr", v);   // a DB on a blitz
  }
  // runs: the back against an average back behind this line; the front's stops against an average front
  if (k.run) {
    // a quarterback's designed runs count toward his grade too (Allen, Jackson), at half a back's weight
    // since his throws are most of his snaps
    if (k.carrier) { const v = (k.fum ? -2 : cap((yards - k.yR0) / 4, -1.2, 2.5)) + (k.yA - k.yR0) * 0.25; if (k.carrier.pos === "QB") G(off, k.carrier, "qb", v * 0.5); else G(off, k.carrier, "ru", v); }
    const front = (dP.tackleW || []).filter(([p, w]) => w > 0 && (p.pos === "DL" || p.pos === "LB" || p.pos === "S"));
    const W = front.reduce((a, [, w]) => a + w, 0) || 1;
    const stopper = (yards <= 1 || k.fum) && front.length ? olPick(g, front, ([p, w]) => w * Math.exp(((p.posAttrs?.runStop ?? p.posAttrs?.tackling ?? p.ovr ?? 70) - 75) * 0.06))[0] : null;
    for (const [p, w] of front) G(def, p, "rd", (p === stopper ? 1 : 0) - (w / W) * k.stopP0);
  }
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
// Played after the edge cap (edges below), so a mismatch still has off days. 1.2 (measured over 30
// seasons on the 2026 rosters): game margins land ~13.5 points either side of the spread like the
// NFL's, win totals spread ~3 wins, the best record averages ~14.5 wins.
export let GAME_DAY_SD = 1.2;
// for calibration runs (scripts and tests): try other values of the two dials above
export function setTuning({ sens, day } = {}) { if (Number.isFinite(sens)) SENSITIVITY = sens; if (Number.isFinite(day)) GAME_DAY_SD = day; }
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
function edges(g, pers = "11", pkg = "nickel") {
  const o = g.sides[g.poss], d = g.sides[other(g.poss)];
  // this snap's units: the offense in its grouping, the defense in its package
  const ou = o.oU?.[pers] || o.u, du = d.dU?.[pkg] || d.u;
  // the day, and a stacked roster's diminishing returns (league.js talentBrake, in points), both after the cap
  const dd = (g.day ? g.day[g.poss].o - g.day[other(g.poss)].d : 0) + ((d.brake || 0) - (o.brake || 0)) / (2 * POINTS_PER_EDGE);
  // the day (a good or bad game) goes on after the cap: even a mismatch near the cap has off days
  const extra = o.mod / POINTS_PER_EDGE + (g.poss === "h" && !g.neutral ? HOME : 0) + gameScript(g.ot ? 3 : g.qtr, g.score[g.poss] - g.score[other(g.poss)], g.clock);
  return { o, d, passE: soft((z(ou.pass, "pass") - z(du.passD, "passD")) * SENSITIVITY + extra) + dd, runE: soft((z(ou.run, "run") - z(du.runD, "runD")) * SENSITIVITY + extra) + dd, rushE: z(du.rush, "rush") - z(o.u.ol, "ol"),
    // for the grades: the same snap with one man swapped for an average one (gradeBook)
    gx: { passEWith: (dp) => soft((z(ou.pass + dp, "pass") - z(du.passD, "passD")) * SENSITIVITY + extra), runE0: soft(z(ou.run, "run") * SENSITIVITY + extra), rushE0: -z(o.u.ol, "ol") } };
}

// Field goal odds from a distance (yards) and the kicker's rating.
// A big leg matters from distance: past 40 yards, leg strength above or below a 95 counts.
export const fgOdds = (dist, k = 75, leg = 95) => clamp(1.005 - 0.0045 * (dist - 18) - 0.0005 * Math.max(0, dist - 35) ** 2 + (k - 75) * 0.004 + (leg - 95) * 0.0012 * Math.max(0, dist - 40), 0.15, 0.99);

function newPossession(g, yard) {
  // Overtime (2025 rules): once both teams have had the ball, a team that's ahead has won.
  if (g.ot) { g.otPoss = (g.otPoss || 1) + 1; if (g.otPoss >= 3 && g.score.h !== g.score.a) { g.done = true; return; } }
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
  // the play's kickoff, for the field to act out (LivePlay.jsx): only the first one a play leads to
  const ko = ev && !ev.ko ? (ev.ko = { side: kick, kicker: K?.k || null, tb: true }) : null;
  // The onside kick: behind by two scores or less in the last couple of minutes (the only time the
  // rules allow one), the kicking team tries to get it back. About one in eight works.
  const down = g.score[recv] - g.score[kick];
  if (g.qtr === 4 && !g.ot && down > 0 && down <= 16 && g.clock <= 150 && R) {
    const got = rand() < 0.12, spot = 35 + 10 + Math.round(rand() * 3);
    if (ko) Object.assign(ko, { tb: false, onside: true, recovered: got, spot });
    if (ev) ev.text += got ? ` Onside kick... RECOVERED by the ${sideName(g, kick)}!` : ` Onside kick, recovered by the ${sideName(g, recv)}.`;
    if (got) { g.yard = spot; g.down = 1; g.toGo = 10; g.stats[kick].drives++; }
    else newPossession(g, 100 - spot);
    return;
  }
  // Seconds left in the half: no touchback (that leaves a snap for a Hail Mary). The kicker drops a
  // short, high kick in bounds and the coverage swarms it; the return takes the rest of the clock.
  const runOut = !g.ot && (g.qtr === 2 || g.qtr === 4) && g.clock > 0 && g.clock <= 12 && !!R && !depth;
  newPossession(g, 35);
  if (!runOut && (rand() < 0.3 || !R)) return; // touchback
  const r = R.krR ?? 80, catchAt = runOut ? 18 + Math.round(rand() * 8) : Math.round(rand() * 8);
  let spot = runOut ? catchAt + 4 + (r - 85) * 0.15 - ((K?.stCov ?? 70) - 70) * 0.08 + gauss(rand) * 3 : 28.5 + (r - 85) * 0.25 - ((K?.stCov ?? 70) - 70) * 0.06 + gauss(rand) * 6;
  if (!runOut && rand() < 0.026 * Math.exp((r - 85) / 8)) spot += 20 + rand() * 65; // breaks one (a typical club's returner is about an 85)
  spot = Math.round(clamp(spot, catchAt + 2, runOut ? 45 : 100));
  if (runOut) {
    if (ko) Object.assign(ko, { tb: false, kr: R.kr || null, catchAt, spot, squib: true });
    const l = line(g, recv, R.kr); add(l, "kr", 1); add(l, "krYds", spot - catchAt);
    g.yard = spot; g.toGo = 10;
    if (ev) { ev.text += ` A short kick in bounds and the coverage swallows the return at the ${spot}.`; const n = tick(g, g.clock); ev.note = [ev.note, n].filter(Boolean).join(" "); }
    return;
  }
  const p = R.kr, l = line(g, recv, p);
  if (ko) Object.assign(ko, { tb: false, kr: p || null, catchAt, spot, td: spot >= 100 });
  add(l, "kr", 1);
  if (rand() < 0.005) { // muffed or stripped: the kicking team recovers
    if (ko) ko.muff = true;
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
  if (ev) { ev.text += ` ${p?.name || "The returner"} takes the ${what} back ${yds} yards for a TOUCHDOWN!`; ev.retTD = recv; }
  if (!g.done && depth < 3) kickoff(g, ev, depth + 1);
}

// Spend time on the clock and roll the quarter / half / game when it runs out.
function tick(g, secs) {
  g.clock -= secs;
  if (g.clock > 0) return null;
  if (g.ot) { // overtime period over
    if (g.score.h === g.score.a && g.playoff) { g.clock = 900; g.to = { h: 2, a: 2 }; return "Another overtime period."; }
    g.done = true; return g.score.h === g.score.a ? "Overtime ends in a tie." : "Final.";
  }
  g.qtr++;
  // the second half opens with a kickoff, by the team that received the first one
  if (g.qtr === 3) { g.to = { h: 3, a: 3 }; g.clock = 900; g.poss = g.firstPoss; g.yard = 35; g.down = 1; g.toGo = 10; g.koNext = true; return "Halftime."; }
  if (g.qtr === 5) {
    if (g.score.h !== g.score.a) { g.done = true; g.qtr = 4; g.clock = 0; return "Final."; }
    // the toss winner receives the overtime kickoff (g.poss: the side kicking it)
    g.ot = true; g.otPoss = 1; g.to = { h: 2, a: 2 }; g.clock = g.playoff ? 900 : 600; g.poss = g.rand() < 0.5 ? "h" : "a"; g.yard = 35; g.down = 1; g.toGo = 10; g.koNext = true;
    return "Overtime!";
  }
  g.clock = 900;
  return `End of quarter ${g.qtr - 1}.`;
}

// Overtime: both teams get a possession, then it's sudden death. A score on the first possession
// sends it to the other team; on the second, it ends the game if it puts them ahead; after that
// (or a defensive score) the next points win.
function scored(g, side, pts) {
  g.score[side] += pts;
  if (!g.ot) return;
  const n = g.otPoss || 1;
  if (side !== g.poss || n >= 3 || (n === 2 && g.score[side] > g.score[other(side)])) g.done = true;
}

// How far a coach trusts his kicker on an ordinary 4th down: about 52 yards for a 92 leg, 57 for a
// 97, 59 for a 99. With the half or the game on the line he'll stretch it five more (up to ~64).
export const fgRange = (leg = 93, stretch = false) => Math.round(clamp(44 + (leg - 85) * 1.1, 48, 60) + (stretch ? 5 : 0));

// Late with the game tied (or down 3 or less) and in comfortable range: play for the field goal.
const forTheKick = (g, lead) => ((g.qtr === 4 && g.clock < 150) || (g.ot && g.down >= 2)) && lead <= 0 && lead >= -3 && 100 - g.yard + 17 <= 45;
// Play style from the situation (or the user's call).
function chooseCall(g, o, pers = "11") {
  const rand = g.rand, lead = g.score[g.poss] - g.score[other(g.poss)];
  const late = g.qtr >= 4 && g.clock < 300, twoMin = (g.qtr === 2 || g.qtr === 4) && g.clock < 120;
  let pass = o.passLean;
  if (g.down === 3) pass = g.toGo >= 7 ? 0.86 : g.toGo <= 2 ? 0.42 : 0.68;
  else if (g.down === 2 && g.toGo >= 8) pass += 0.08;
  else if (g.down === 1) pass -= 0.08;
  // the grouping tips it: two tight ends and a fullback run more, four wide throws more
  pass += (PERS_LEAN[pers] || 0) * 0.8;
  // rain, snow and wind keep the ball on the ground
  pass -= g.wxE?.run || 0;
  // Game script: protect a big second-half lead on the ground; chase one through the air.
  if (g.qtr >= 3 && lead >= 14) pass -= g.qtr >= 4 ? 0.2 : 0.1;
  if (g.qtr >= 3 && lead <= -14) pass = Math.max(pass + 0.12, g.qtr >= 4 ? 0.75 : 0);
  // At the goal line, most teams pound it.
  if (g.yard >= 96 && g.down < 3) pass -= 0.18;
  // Tied or down three or less late, already in field-goal range: run, centre it, kick at the end.
  if (forTheKick(g, lead)) return "run";
  if ((late && lead < 0) || twoMin) pass = Math.max(pass, 0.8);
  if ((late && lead > 0) || (g.qtr >= 4 && lead >= 17)) pass = Math.min(pass, 0.3);
  // Ahead in the last two minutes: run the clock (only a long third down is worth a throw).
  if (g.qtr === 4 && !g.ot && g.clock <= 120 && lead > 0) pass = g.down === 3 && g.toGo >= 5 ? 0.45 : 0.08;
  return rand() < pass ? "pass" : "run";
}

// Run one play. call (optional, from the user): run_inside, run_outside, run_screen, scramble,
// pass_quick, pass_medium, pass_deep, pass_rpo, punt, fg. bonus: timing-minigame multiplier on
// yards gained. Returns what happened, for the play-by-play.
// One play; recorded in g.pl when the game keeps a play log (your games, for the game recap).
// pick (your called pass): { target: the receiver's id, open: whether he was open when you threw
// it } — the ball goes to him, and throwing into coverage costs completions and risks a pick.
export function step(g, call, bonus = 1, pick = null) {
  const ev = stepPlay(g, call, bonus, pick);
  if (g.pl) recPlay(g, ev);
  return ev;
}
function stepPlay(g, call, bonus = 1, pick = null) {
  if (g.done) return null;
  // The kickoff that opens the game, each half and overtime: a play of its own
  if (g.koNext) {
    g.koNext = false; g.plays++;
    const kick = g.poss, ev = { yard: 35, down: 1, toGo: 10, qtr: g.qtr, clock: g.clock, poss: kick, yards: 0, type: "kickoff", text: `${sideName(g, kick)} kick off.`, td: false, turnover: false, score: 0 };
    const op = g.otPoss;
    kickoff(g, ev);
    if (g.ot && !g.done) g.otPoss = op; // the overtime kickoff isn't a possession of its own
    if (ev.ko?.tb) ev.text += " Touchback.";
    ev.note = tick(g, ev.ko?.tb ? 0 : 6);
    return ev;
  }
  const rand = g.rand;
  const off = g.poss, def = other(off);
  // Personnel for this snap (heavier in short yardage, lighter on passing downs) and the defense's answer.
  const so = g.sides[off], sd = g.sides[def];
  // a club's situational packages (personnel.js SITUATIONS) win when they apply
  const sitn = situationOf({ down: g.down, toGo: g.toGo, yard: g.yard, qtr: g.qtr, clock: g.clock, lead: g.score[off] - g.score[def] });
  const pers = sitPers(so.team?.sit, sitn) || (so.mix ? pickPers(rand, so.mix, { down: g.down, toGo: g.toGo, yard: g.yard }) : "11");
  const pkg = sitPkg(sd.team?.sit, sitn) || (sd.dU ? pickPkg(rand, pers, sd.tilt || 0, g.down >= 3 && g.toGo >= 6) : "nickel");
  const { o, d, passE, runE, rushE, gx } = edges(g, pers, pkg);
  let gk = null; // what the grades need to know about this snap (gradeBook)
  const st = g.stats[off];
  const lead = g.score[off] - g.score[def];
  const hurry = ((g.qtr === 2 || g.qtr === 4) && g.clock < 120) || (g.qtr === 4 && g.clock < 300 && lead < 0) || (g.qtr === 4 && lead <= -9) || (g.ot && g.clock < 150 && lead <= 0);
  const fgDist = 100 - g.yard + 17;
  const before = { yard: g.yard, down: g.down, toGo: g.toGo, qtr: g.qtr, clock: g.clock, poss: off };
  const ev = { ...before, yards: 0, type: "", text: "", td: false, turnover: false, score: 0, pers, pkg };
  g.plays++;
  // whether the clock was still running after the last snap (only an ordinary play in bounds with
  // no timeout leaves it running; set again at the bottom)
  const running = !!g.running;
  g.running = false;

  // Victory formation: ahead in the 4th with few enough seconds left that kneeling runs it out.
  // A defense that's out of reach (down more than two scores) doesn't bother with its timeouts.
  const defTO = lead <= 16 ? g.to?.[def] ?? 0 : 0, kneels = 4 - g.down;
  if (call === "kneel" || !call && g.qtr === 4 && !g.ot && lead > 0 && g.down < 4 && g.clock <= 40 * Math.max(0, kneels - defTO) + 2 * kneels) {
    const ql = line(g, off, o.qb); add(ql, "rushAtt", 1); add(ql, "rushYds", -1); st.rushAtt++; st.rushYds -= 1;
    g.yard = Math.max(1, g.yard - 1); g.down++; g.toGo += 1;
    ev.type = "run"; ev.k = "kneel"; ev.kneel = true; ev.yards = -1; ev.player = o.qb; ev.qb = o.qb; ev.text = `${o.qb?.name || "The QB"} takes a knee.`;
    if (defTO > 0 && g.clock > 2 && lead > 0 && g.qtr === 4) { g.to[def]--; ev.text += ` Timeout, ${sideName(g, def)}.`; ev.note = tick(g, 2); }
    else ev.note = tick(g, 40);
    return ev;
  }

  // Spike it: the clock running late in a half, no timeouts left and a reason to stop it (in range
  // for the field goal, or a drive still to finish): the quarterback throws it into the ground. It
  // costs a down and a second; on fourth down there's no down to spare.
  const needStop = g.qtr === 2 ? g.yard >= 45 : (g.qtr === 4 || g.ot) && lead <= 0;
  if (!call && running && needStop && (g.to?.[off] ?? 0) === 0 && g.down <= 3 && g.clock >= 3 && g.clock <= 40) {
    const ql = line(g, off, o.qb); add(ql, "att", 1); st.passAtt++;
    g.down++;
    ev.type = "inc"; ev.k = "spike"; ev.spike = true; ev.qb = o.qb; ev.player = o.qb; ev.text = `${o.qb?.name || "The QB"} spikes it to stop the clock.`;
    ev.note = tick(g, 1);
    return ev;
  }

  // Fourth down (or the end of a half in range): kick, punt or go for it.
  // weather pulls in the longest kick a coach will try (wind and snow the most)
  const wxKick = g.wxE?.kick || 0, maxFG = fgRange(o.kLeg) - wxKick, longFG = fgRange(o.kLeg, true) - wxKick;
  const endOfHalf = ((g.qtr === 2 || g.qtr === 4 || g.ot) && g.clock <= 25 && fgDist <= longFG && !(g.qtr >= 4 && lead < -3)) || (!call && forTheKick(g, lead) && g.down >= 3 && (g.clock <= 40 || g.ot));
  let decision = call === "punt" || call === "fg" ? call : null;
  if (!decision && (g.down === 4 || endOfHalf || (g.ot && g.down >= 3 && fgDist <= maxFG && lead <= 0 && lead >= -3))) {
    if (endOfHalf && fgDist <= longFG) decision = "fg";
    else if (g.ot && g.down >= 3 && fgDist <= maxFG && !call && lead <= 0 && lead >= -3) decision = "fg"; // overtime: take the points
    else if (g.down === 4) {
      const needTD = (g.qtr === 4 && g.clock < 240 && lead < -3) || (g.ot && lead < -3);
      // Modern 4th-down aggression: short yardage near midfield or in scoring range is often a go.
      const goShort = g.toGo <= 2 && g.yard >= 40 ? (g.toGo === 1 ? 0.7 : 0.45) : g.toGo <= 4 && g.yard >= 55 && g.yard < 70 ? 0.3 : 0;
      const lateGame = g.qtr >= 4 || g.ot;
      // Late, a makeable kick that ties it or takes the lead is the call. Only a shaky head coach
      // (rated under ~72) ever gambles there, and rarely.
      const kickToLead = lateGame && lead <= 0 && lead >= -3 && fgDist <= longFG;
      const gamble = Math.max(0, 72 - (o.hcR ?? 70)) * 0.01;
      const protecting = g.qtr >= 4 && !g.ot && g.clock < 300 && lead > 0 && g.yard < 50;
      if (call) decision = null; // the user chose to go for it
      else if (needTD || (g.qtr === 4 && g.clock < 240 && lead < 0 && fgDist > longFG)) decision = null;
      else if (kickToLead) decision = rand() < gamble ? null : "fg";
      else if (!protecting && rand() < Math.min(0.95, goShort * (o.hcAgg ?? 1) * (g.wxE?.go || 1)) * (fgDist <= 40 ? 0.6 : 1)) decision = null;
      else if (fgDist <= maxFG) decision = "fg";
      else decision = "punt";
    }
  }
  if (decision === "fg") {
    const made = rand() < fgOdds(fgDist, o.kOvr, o.kLeg) + (g.wxE?.fg || 0) * (fgDist >= 40 ? 1.4 : 0.6); // weather costs the long ones most
    const kl = line(g, off, o.k);
    add(kl, "fgA", 1); st.fgA++;
    ev.type = made ? "fg" : "fg_miss"; ev.player = o.k;
    // for the field to act it out (LivePlay.jsx): the kick, its length, the holder
    ev.k = "fg"; ev.dist = fgDist; ev.made = made; ev.holder = o.p || o.qb;
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
    let gross = Math.round(clamp(47 + ((o.pOvr ?? 77) - 77) * 0.3 + ((o.pPow ?? 93) - 93) * 0.15 + gauss(rand) * 7, 22, 72));
    // The punter's head: with a short field to work with (inside about 58 yards of the goal line)
    // he doesn't bomb it into the end zone, he aims for the coffin corner and tries to pin them
    // inside the 10. A good punter does it more often and drops it closer to the goal line.
    const skill = ((o.pOvr ?? 77) - 77) * 0.02 + (acc - 82) * 0.015;
    const toGoal = 100 - g.yard, aims = toGoal <= 58 && toGoal >= 30;
    const pinned = aims ? rand() < clamp(0.5 + skill, 0.2, 0.9) : g.yard + gross >= 90 && rand() < 0.4 + (acc - 82) * 0.015;
    if (pinned) gross = Math.min(gross, toGoal - clamp(Math.round(2 + rand() * 8 - skill * 6), 1, 12));
    else if (aims && g.yard + gross > 100 && rand() < 0.5) gross = toGoal - 12 - Math.round(rand() * 8); // played it safe: fair caught around the 15
    const land = g.yard + gross;
    st.punts++;
    if (pl) { add(pl, "punts", 1); add(pl, "puntYds", Math.min(gross, 100 - g.yard)); }
    ev.type = "punt"; ev.turnover = false;
    ev.k = "punt"; ev.punter = pp; ev.gross = gross; ev.ret = 0; ev.pr = d.pr;
    ev.note = tick(g, 8);
    if (land >= 100) {
      ev.text = `Punt of ${100 - g.yard} yards into the end zone, touchback.`; ev.tb = true; ev.gross = toGoal;
      ev.land = Math.min(98, g.yard + Math.max(30, gross - 6));
      if (!g.done) newPossession(g, 20);
      return ev;
    }
    const spot = land; // where it's caught or downed: the ball never rolls past it
    ev.spot = spot;
    // a pinned punt hits short and the coverage downs it where it stops
    ev.land = pinned ? spot - 2 - Math.round(rand() * 4) : spot;
    let ret = 0;
    const r = d.prR ?? 80, p = d.pr, rl = line(g, def, p);
    // Hang time: a high punt gets the coverage there first (more fair catches, shorter returns).
    const hang = (o.pHang ?? 86) - 86;
    if (rand() < (spot >= 88 ? 0.12 : clamp(0.55 - hang * 0.012, 0.3, 0.75))) {
      ret = Math.round(Math.max(0, 8 + (r - 85) * 0.22 - ((o.stCov ?? 70) - 70) * 0.05 - hang * 0.12 + gauss(rand) * 5.5));
      if (rand() < 0.024 * Math.exp((r - 85) / 8)) ret += 15 + Math.round(rand() * 60); // breaks one
      add(rl, "pr", 1);
      ev.ret = ret; ev.returned = true;
      if (rand() < 0.008) { // muffed: the punting team recovers
        ev.muff = true; ev.ret = 0;
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
    if (pinned && !ret) ev.downed = true;
    if (pl && recvYard <= 20) add(pl, "in20", 1);
    ev.text = ret >= 20 ? `Punt, ${gross} yards. ${p?.name || "The returner"} brings it back ${ret} yards!` : ret > 0 ? `Punt, ${gross} yards, returned ${ret}.` : `Punt, ${gross} yards${pinned || recvYard <= 10 ? `, downed at the ${recvYard}` : ", fair catch"}.`;
    if (!g.done) newPossession(g, recvYard);
    return ev;
  }

  // Pre-snap fouls (about 3% of snaps): the play never happens. Each is on someone: a lineman who
  // moved early, a rusher in the neutral zone, a receiver not set; delay of game is on the offense.
  if (rand() < 0.03) {
    const r = rand(), offF = r < 0.7;
    const kind = r < 0.4 ? "false_start" : r < 0.58 ? "formation" : r < 0.7 ? "delay" : "offside";
    const who = kind === "false_start" ? pickOne(rand, (o.ol || []).filter(Boolean)) : kind === "formation" ? pickW(rand, o.receivers) : kind === "offside" ? pickW(rand, (d.defBy?.[pkg] || d).rushW) : null;
    const side = offF ? off : def;
    g.stats[side].penalties++; g.stats[side].penYds = (g.stats[side].penYds || 0) + 5;
    if (who) add(line(g, side, who), "pen", 1);
    const yds = offF ? -halfDist(g.yard, 5) : Math.min(5, 99 - g.yard);
    g.yard = clamp(g.yard + yds, 1, 99);
    if (!offF && yds >= g.toGo) { g.down = 1; g.toGo = Math.min(10, 100 - g.yard); } else g.toGo = Math.max(1, g.toGo - yds);
    ev.type = "penalty"; ev.yards = yds;
    ev.pen = { side: offF ? "off" : "def", kind, label: PEN_LABEL[kind], yds: 5, player: who, accepted: true, pre: true };
    ev.text = `${PEN_LABEL[kind]}${who ? `, ${who.name}` : ""}, ${offF ? "offense" : "defense"}. 5-yard penalty${!offF && g.down === 1 && ev.down !== 1 ? ", automatic first down" : ""}.`;
    ev.note = tick(g, 3);
    return ev;
  }
  // A flag during the play (about 5% of snaps): what it was depends on the play (holding, pass
  // interference, a late hit), decided once the play is over, and the other side takes the
  // penalty or the play, whichever is better for it. Everything the play put in the books is set
  // aside first, so a play that comes back leaves no trace.
  const flag = rand() < 0.05 ? { r1: rand(), r2: rand(), snap: { box: structuredClone(g.box), stats: structuredClone(g.stats) } } : null;

  // Run or pass?
  let style = call && call.startsWith("pass_") ? "pass" : call && (call.startsWith("run_") || call === "scramble") ? "run" : null;
  if (call === "pass_rpo") style = rand() < 0.55 ? "pass" : "run";
  if (call === "run_screen") style = "screen";
  if (!style) style = chooseCall(g, o, pers);
  const st0 = g.stats[off], dst0 = g.stats[def];
  if (st0) (st0.pers ||= {})[pers] = (st0.pers[pers] || 0) + 1;
  if (dst0) (dst0.pkg ||= {})[pkg] = (dst0.pkg[pkg] || 0) + 1;
  const dP = d.defBy?.[pkg] || d; // the defenders on the field this snap
  const qb = o.qb;
  let yards = 0, desc = "", type = "", carrier = null, completed = false, clockStops = false;
  // The defense's call this snap (defStyle): more blitzes on third and long.
  const ds = d.dStyle || { blitz: 0.22, box: 0.2, cover: 0.2 }, dst = g.stats[def];
  // more blitzes on third and long; the three calls never add up past 95% (some snaps are base)
  const bl0 = ds.blitz * (g.down === 3 && g.toGo >= 6 ? 1.25 : 1), sum = bl0 + ds.box + ds.cover, sc = sum > 0.95 ? 0.95 / sum : 1;
  const bl = bl0 * sc, rr = rand();
  const dcall = rr < bl ? "blitz" : rr < bl + ds.box * sc ? "box" : rr < bl + (ds.box + ds.cover) * sc ? "cover" : "base";
  if (dst && dcall !== "base") dst[dcall]++;
  if (dst && (style === "pass" || style === "screen")) dst.dropbacks++;
  ev.dcall = dcall;
  const B = dcall === "blitz", X = dcall === "box", V = dcall === "cover";

  if (style === "pass" || style === "screen") {
    const deep = call === "pass_deep", quick = call === "pass_quick" || call === "pass_rpo", screen = style === "screen";
    // who did what, for the field to act the play out (LivePlay.jsx)
    ev.qb = qb; ev.deep = deep; ev.quick = quick; ev.screen = screen;
    const sackAt = (rE) => clamp(0.055 + rE * 0.008 - passE * 0.004 + (deep ? 0.025 : quick || screen ? -0.035 : 0) + (B ? (quick || screen ? 0.02 : 0.06) : V ? -0.015 : 0), 0.02, 0.2);
    // his IQ: seeing the blitz and getting rid of it in time (qbiq.js)
    const iq = iqEdge(qb);
    const sackP = clamp(sackAt(rushE) + sackShift(iq), 0.015, 0.22);
    const qbl = line(g, off, qb);
    if (!screen) ev._ol = { pass: true, sackP };
    gk = { qb, dropback: !screen, sackP0: sackAt(gx.rushE0) };
    if (!screen && rand() < sackP) {
      const loss = Math.round(5 + rand() * 5);
      // Multi-sack games happen, but each sack a rusher already has makes the next one harder (he gets
      // chipped and doubled).
      const rusher = pickW(rand, dP.rushW.map(([p, w]) => { const n = g.box[def][p.id]?.sacks || 0; return [p, w * 0.45 ** n * hotRusher(p)]; }));
      ev._ol.sacked = true; ev._ol.rusher = rusher; gk.sacked = true; gk.rusher = rusher; ev.rusher = rusher;
      add(qbl, "sk", 1); add(qbl, "skYds", loss); st.sacks++;
      // About one sack in five is shared by two rushers: half a sack each.
      const helper = rusher && rand() < 0.22 ? pickW(rand, dP.rushW.filter(([p]) => p !== rusher)) : null;
      if (rusher) { const rl = line(g, def, rusher); add(rl, "sacks", helper ? 0.5 : 1); add(rl, "qbH", 1); add(rl, "tkl", 1); }
      if (helper) { const hl = line(g, def, helper); add(hl, "sacks", 0.5); add(hl, "qbH", 1); gk.helper = helper; }
      yards = -loss; type = "sack"; desc = `${qb?.name || "QB"} is SACKED${rusher ? ` by ${rusher.name}` : ""} for a loss of ${loss}.`;
      if (rand() < 0.07) { // strip sack
        if (rusher) add(line(g, def, rusher), "ff", 1);
        if (rand() < 0.55) { add(qbl, "fum", 1); st.fumLost++; type = "fumble"; ev.turnover = true; desc += " FUMBLE — recovered by the defense!"; }
      }
    } else if (!screen && !call && rand() < (qb?.spd >= 78 ? 0.05 : 0.02)) { // scramble
      yards = Math.round(clamp(3 + expo(rand, 4.5) + passE * 0.3, -2, 40));
      add(qbl, "rushAtt", 1); st.rushAtt++;
      carrier = qb; type = "run"; desc = `${qb?.name || "QB"} scrambles for ${yards}.`; gk.scr = yards; ev.scramble = true;
    } else {
      // Once a receiver has had a big day the ball spreads around (no 15-catch games every week).
      const busy = ([p, w]) => { const n = g.box[off][p.id]?.tgt || 0, s0 = 6 + Math.max(0, p.form || 0) * 0.5; return [p, n <= s0 ? w : w * Math.exp(-(n - s0) / 3)]; };
      const recv = o.recvBy?.[pers] || o.receivers;
      // the receiver you threw to, if he's out there (any grouping); otherwise the quarterback's read
      const mine = !screen && pick?.target != null ? [...recv, ...Object.values(o.recvBy || {}).flat(), ...o.receivers].find(([p]) => p?.id === pick.target) : null;
      const target = mine ? mine[0] : screen ? (o.rushers[0]?.[0] || pickW(rand, recv.map(busy))) : pickW(rand, recv.map(busy));
      const tl = line(g, off, target);
      // the matchup: who has him in this package, and by how much the receiver wins it
      const role = recv.find(([p]) => p === target)?.[2] || (mine && typeof mine[2] === "string" ? mine[2] : "RB");
      const cm = !screen && d.cover ? d.cover(pkg, role, target, o.oU?.[pers]?.on?.wr || []) : null;
      ev.tgt = target; ev.cm = cm;
      const mm = cm ? clamp((target?.ovr || 75) - (cm.pos === "LB" ? lbCover(cm) : cm.ovr || 75) - MM0, -25, 25) : 0;
      // completion odds and yards for a throw, as functions of the passing edge, the receiver and the matchup
      const yMean = screen ? 5.5 : deep ? 24 : quick ? 6.5 : 9.9;
      const compAt = (pE, t, m) => clamp(0.658 + pE * 0.018 + (t - 75) * 0.0012 + m * 0.0035 + (deep ? -0.22 : quick ? 0.08 : 0) + (screen ? 0.18 : 0) + (B ? -0.03 : X ? 0.04 + (o.paSpec ? 0.03 : 0) : V ? (deep ? -0.1 : -0.03) : 0) + (g.wxE?.comp || 0) * (deep ? 1.5 : 1), 0.25, 0.92);
      const ydsAt = (pE, t, m) => 2 + Math.max(0, yMean - 2 + pE * 0.45 + m * 0.06 + (t - 75) * 0.035 + Math.max(0, t - 90) * 0.08);
      { // the grades' baselines: the same throw with an average quarterback, receiver or cover man
        const tO = target?.ovr || 75, cv = cm ? (cm.pos === "LB" ? lbCover(cm) : cm.ovr || 75) : null, mmOf = (t, c) => (c == null ? 0 : clamp(t - c - MM0, -25, 25));
        const pEq = gx.passEWith(-0.5 * ((qb?.ovr || 75) - AVG.qb));
        gk.tgt = { target, cm, cA: compAt(passE, tO, mm), yA: ydsAt(passE, tO, mm), cQ: compAt(pEq, tO, mm), yQ: ydsAt(pEq, tO, mm), cR: compAt(passE, AVG.rec, mmOf(AVG.rec, cv)), yR: ydsAt(passE, AVG.rec, mmOf(AVG.rec, cv)), cC: compAt(passE, tO, mmOf(tO, AVG.cov)), yC: ydsAt(passE, tO, mmOf(tO, AVG.cov)) };
      }
      add(qbl, "att", 1); add(tl, "tgt", 1); st.passAtt++;
      // where you put it: hitting the open man is easy and safe; forcing it into coverage isn't
      // On his own read (no throw you aimed), his IQ decides it: a sharp QB finds the open man more
      // often and forces it into coverage less.
      const own = !mine || pick.open == null;
      let placed = own ? 0 : pick.open ? 1 : -1;
      if (own && !screen) { const ro = readOdds(iq), u = rand(); placed = u < ro.open ? 1 : u > 1 - ro.forced ? -1 : 0; }
      const plI = own ? (screen ? 0 : readInt(placed)) : placed > 0 ? -0.008 : placed < 0 ? 0.028 : 0;
      const plC = own ? (screen ? 0 : readComp(placed)) : placed > 0 ? 0.12 : placed < 0 ? -0.18 : 0;
      ev.read = placed > 0 ? "open" : placed < 0 ? "forced" : null;
      const intP = clamp(plI + intShift(iq) + 0.024 - passE * 0.004 - mm * 0.0004 + (deep ? 0.012 : quick ? -0.006 : 0) + (screen ? -0.015 : 0) + (B ? 0.006 : V ? (deep ? 0.012 : 0.004) : 0) + (g.wxE?.int || 0), 0.006, 0.08);
      if (rand() < intP) {
        const db = cm && rand() < 0.5 ? cm : pickW(rand, dP.covW);
        add(qbl, "passInt", 1); st.ints++;
        if (db) { add(line(g, def, db), "ints", 1); add(line(g, def, db), "pd", 1); }
        gk.int = true; gk.db = db; gradeBook(g, off, def, dP, gk, 0);
        type = "int"; desc = `${qb?.name || "QB"}${placed < 0 ? " forces it into coverage and it" : "'s pass"} is INTERCEPTED${db ? ` by ${db.name}` : ""}!`; ev.k = "int"; ev.db = db;
        const ret = Math.round(clamp(expo(rand, 9), 0, 60));
        ev.turnover = true; ev.player = db; ev.defPlay = true;
        persLog(g, off, def, pers, pkg, 0, false);
        ev.type = type; ev.text = desc;
        ev.note = tick(g, 6);
        if (!g.done) newPossession(g, 100 - g.yard - Math.round(8 + rand() * 12) + ret);
        return ev;
      }
      const compP = clamp(compAt(passE, target?.ovr || 75, mm) + plC, 0.12, 0.95);
      if (rand() < compP) {
        const mean = yMean;
        yards = Math.round((2 + expo(rand, mean - 2 + passE * 0.45 + mm * 0.06 + ((target?.ovr || 75) - 75) * 0.035 + Math.max(0, (target?.ovr || 75) - 90) * 0.08)) * (bonus || 1));
        // Now and then a catch turns into a big play after the catch (missed tackle, busted coverage).
        if (!deep && rand() < clamp(0.02 + Math.max(0, (target?.spd || 85) - 88) * 0.0015 + passE * 0.008 + (B ? 0.045 : X ? 0.02 : V ? -0.012 : 0), 0.004, 0.1)) { const b = Math.round(12 + expo(rand, 16)); yards += b; ev.yac = b; }
        if (V && yards > 6) yards = Math.round(yards * 0.85); // tackled in space by a deep safety
        if (screen && rand() < 0.15) yards = -Math.round(rand() * 3);
        completed = true; carrier = target; type = "pass"; gk.comp = true;
        add(qbl, "comp", 1); add(tl, "rec", 1); st.comp++;
        desc = `${qb?.name || "QB"} finds ${target?.name || "his receiver"} for ${yards}${matchupNote(cm, role, mm, yards, pkg)}.`;
      } else {
        type = "inc"; clockStops = true;
        if (rand() < 0.3) { const db = cm && rand() < 0.5 ? cm : pickW(rand, dP.covW); if (db) add(line(g, def, db), "pd", 1); gk.pdBy = db; ev.db = db; desc = `${qb?.name || "QB"}'s pass for ${last(target)} is broken up${db ? ` by ${db.name}` : ""}.`; }
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
    ev.qb = qb; ev.keeper = keeper;
    const outside = call === "run_outside";
    // Heavy workloads wear a back down: past ~18 carries in a game he averages a little less.
    const load = carrier && !keeper ? Math.max(0, (g.box[off][carrier.id]?.rushAtt || 0) - 18) : 0;
    // who's at the point of attack: the MIKE fills inside; outside, the SAM sets the edge in base,
    // and in nickel the corner in the box has to make the tackle (a lighter edge)
    // an inside run you called stays inside; otherwise a third of runs bounce to the edge
    const edgeRun = outside || (call !== "run_inside" && rand() < 0.33), lbsOn = dP.on?.lbs || [];
    ev.edge = edgeRun; ev.outside = outside;
    const mike = lbsOn.find((p) => p.role === "MIKE"), sam = lbsOn.find((p) => p.role === "SAM"), nb = dP.on?.cbs?.[2];
    const poa = edgeRun ? (sam ? ((sam.ovr || 75) - 74) * 0.045 : nb ? ((nb.posAttrs?.tackling ?? 65) - 68) * 0.03 - 0.15 : 0) : mike ? ((mike.ovr || 75) - 76) * 0.035 : 0;
    const mean = 3.85 - poa + runE * 0.3 + ((carrier?.ovr || 75) - 75) * 0.022 + (keeper ? 0.6 : 0) - load * 0.06 + (X ? -0.9 : V ? 0.6 : B ? -0.3 : 0) + (g.wxE?.runYds || 0);
    { // the grades' baselines: an average back on this run; an average front against it (its chance of a stop)
      const sd = outside ? 3.3 : 2.5, mD = mean + poa - runE * 0.3 + gx.runE0 * 0.3 - 0.6;
      gk = { run: true, carrier, keeper, yA: mean + 0.2, yR0: mean - ((carrier?.ovr || 75) - AVG.rb) * 0.022 + 0.2, stopP0: phi((1.5 - mD) / sd) };
    }
    const breakaway = rand() < clamp(0.047 + ((carrier?.spd || 80) - 82) * 0.0018 - load * 0.003 + runE * 0.005 + (outside ? 0.025 : 0) + (B ? 0.025 : X ? -0.015 : 0), 0.01, 0.14);
    yards = breakaway ? Math.round(mean + 5 + expo(rand, 11)) : Math.round(clamp(mean - 0.6 + gauss(rand) * (outside ? 3.3 : 2.5), -4, 14));
    if (yards > 0) yards = Math.round(yards * (bonus || 1));
    const cl = line(g, off, carrier);
    add(cl, "rushAtt", 1); st.rushAtt++;
    type = "run";
    ev._ol = { run: true };
    desc = `${carrier?.name || "Runner"} ${keeper ? "keeps it" : outside ? "bounces outside" : edgeRun ? ["off left tackle", "off right tackle", "around left end", "around right end"][Math.floor(rand() * 4)] : ["up the middle", "inside", "up the middle"][Math.floor(rand() * 3)]} for ${yards}${edgeRun && !keeper && yards >= 9 && !sam && nb ? `, getting outside the nickel, ${last(nb)}` : edgeRun && !keeper && yards <= 0 && sam ? `, the SAM ${last(sam)} sets the edge` : !edgeRun && !keeper && yards <= 0 && mike ? `, ${last(mike)} fills the hole` : ""}.`;
    if (yards < 0) { const t = pickW(rand, dP.tackleW); if (t) add(line(g, def, t), "tfl", 1); ev.tkl = t; }
  }

  ev.k = type === "fumble" ? "sack" : type; // what the play was before a fumble or a score renamed it
  const olk = ev._ol;
  if (ev._ol) { olBook(g, off, o.ol, ev._ol, type, yards, desc); delete ev._ol; }
  if (gk && olk) { gk.lost = olk.lost; gk.pres = olk.pres; }

  // each snap's grouping and package, and how it went (personnel stats)
  persLog(g, off, def, pers, pkg, yards, !ev.turnover && type !== "fumble" && yards >= (g.down === 1 ? 0.4 : g.down === 2 ? 0.6 : 1) * g.toGo);

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
    } else if (rand() < ((type === "run" ? 0.0055 : 0.004) - Math.max(-0.002, Math.min(0.002, (type === "run" ? runE : passE) * 0.0006))) * (g.wxE?.fum || 1)) {
      add(cl, "fum", 1); st.fumLost++;
      const t = pickW(rand, dP.tackleW); if (t) add(line(g, def, t), "ff", 1); ev.tkl = t;
      if (gk) gk.fum = true;
      ev.turnover = true; type = "fumble"; desc += ` FUMBLE — the defense recovers!`;
    } else {
      const t = pickW(rand, dP.tackleW);
      if (t) { ev.tkl ||= t; add(line(g, def, t), "tkl", 1); if (rand() < 0.3) { const t2 = pickW(rand, dP.tackleW); if (t2 && t2 !== t) { add(line(g, def, t2), "ast", 1); if (ev.tkl === t) ev.ast = t2; } } }
      if (rand() < 0.14) clockStops = true; // out of bounds
    }
  }

  if (gk) gradeBook(g, off, def, dP, gk, yards);
  ev.type = ev.td ? "td" : type; ev.yards = yards; ev.player = carrier; ev.passer = completed ? qb : null; ev.text = desc;

  let tackOn = 0;
  if (flag && type !== "fumble") {
    const pass = style === "pass" || style === "screen", sack = type === "sack", inc = type === "inc";
    // what was called, weighted by the kind of play (NFL rates: offensive holding the most, then
    // pass interference, defensive holding and the personal fouls)
    const table = pass
      ? [["holding", 26], ["opi", completed ? 8 : 0], ["def_holding", 14], ["dpi", sack ? 0 : 18], ["illegal_contact", 5], ["roughing", sack ? 3 : 6], ["unr", 8], ["facemask", 5]]
      : [["holding", 50], ["block_back", 14], ["unr", 18], ["facemask", 12], ["def_holding", 6]];
    const tot = table.reduce((a, [, w]) => a + w, 0);
    let x = flag.r1 * tot, kind = table[0][0];
    for (const [k, w] of table) { if ((x -= w) < 0) { kind = k; break; } }
    const offF = ["holding", "opi", "block_back"].includes(kind), side = offF ? off : def;
    const who = kind === "holding" || kind === "block_back" ? (pass ? pickOne(rand, (o.ol || []).filter(Boolean)) : flag.r2 < 0.6 ? pickOne(rand, (o.ol || []).filter(Boolean)) : pickW(rand, o.receivers))
      : kind === "opi" ? carrier
      : kind === "roughing" ? pickW(rand, dP.rushW)
      : kind === "dpi" || kind === "illegal_contact" || kind === "def_holding" ? (ev.cm || pickW(rand, dP.covW))
      : pickW(rand, dP.tackleW);
    const Y = kind === "dpi" ? 0 : ["unr", "facemask", "roughing"].includes(kind) ? 15 : ["def_holding", "illegal_contact"].includes(kind) ? 5 : 10;
    const room = 100 - g.yard, got = ev.td ? room : yards, first = ev.td || got >= g.toGo;
    // the spot of a pass interference: where the throw was going
    const air = kind === "dpi" ? clamp(Math.round(ev.deep ? 22 + flag.r2 * 18 : ev.quick ? 4 + flag.r2 * 5 : 8 + flag.r2 * 12), 1, room - 1) : 0;
    let accepted, tack = false;
    if (offF) accepted = !inc ? got > -Y * 0.6 : g.down < 3; // the defense takes it unless the play already cost them less
    else if (Y === 15) { accepted = true; tack = !ev.td; } // a personal foul: on top of the play
    // pass interference is an automatic first down: the offense takes it unless the play already moved the chains farther
    else if (kind === "dpi") accepted = inc || sack || !first || got < air;
    else accepted = inc || sack || !first || got < Y;
    const label = PEN_LABEL[kind];
    g.stats[side].penalties = (g.stats[side].penalties || 0) + (accepted ? 1 : 0);
    ev.pen = { side: offF ? "off" : "def", kind, label, yds: kind === "dpi" ? air : Y, player: who, accepted, tack, play: { yards, td: ev.td, type } };
    const tag = `${label}${who ? `, ${who.name}` : ""}, ${offF ? "offense" : "defense"}.`;
    if (!accepted) ev.text += ` ${tag} Declined.`;
    else if (Y === 15 && ev.td) { ev.pen.onKick = true; ev.text += ` ${tag} Enforced on the kickoff.`; g.stats[side].penYds = (g.stats[side].penYds || 0) + 15; if (who) add(line(g, side, who), "pen", 1); }
    else if (tack) { tackOn = Math.min(15, Math.max(0, 99 - (g.yard + yards))); ev.text += ` ${tag} 15 yards tacked on, automatic first down.`; g.stats[side].penYds = (g.stats[side].penYds || 0) + tackOn; if (who) add(line(g, side, who), "pen", 1); }
    else {
      // the play comes back: undo it, then walk it off from the line of scrimmage
      g.box = flag.snap.box; g.stats = flag.snap.stats;
      const st2 = g.stats[side]; st2.penalties = (st2.penalties || 0) + 1;
      if (who) add(line(g, side, who), "pen", 1);
      let mv;
      if (offF) { mv = -halfDist(g.yard, Y); g.toGo = Math.min(g.toGo - mv, 99); }
      else { mv = kind === "dpi" ? Math.min(air, 99 - g.yard) : Math.min(Y, 99 - g.yard); }
      st2.penYds = (st2.penYds || 0) + Math.abs(mv);
      g.yard = clamp(g.yard + mv, 1, 99);
      if (!offF) { g.down = 1; g.toGo = Math.min(10, 100 - g.yard); }
      ev.type = "penalty"; ev.td = false; ev.yards = mv; ev.firstDown = !offF;
      ev.text = `${desc.replace(/ — TOUCHDOWN!/, ",").replace(/ TOUCHDOWN!/, " touchdown,")} ${tag} ${offF ? `${ev.pen.play.td ? "The touchdown is wiped out. " : yards > 0 ? "The play comes back. " : ""}${Math.abs(mv)}-yard penalty, replay the down.` : kind === "dpi" ? `Ball spotted ${Math.abs(mv)} yards downfield, first down.` : `${Math.abs(mv)} yards and an automatic first down.`}`;
      ev.note = tick(g, hurry ? 5 : 8);
      return ev;
    }
  }

  if (ev.td) {
    // Extra point (or the occasional two-point try).
    const kl = line(g, off, o.k);
    let pts = 6;
    // your own call when you have one (g.patCall: { h|a: "one" | "two" }), else the coach's
    const mine = g.patCall?.[off];
    if (mine === "two" || !mine && (rand() < 0.05 * (o.hcAgg ?? 1) ** 2 || (g.qtr === 4 && g.clock < 300 && [-2, -10, 5, 1].includes(g.score[off] + 6 - g.score[def])))) {
      const good = rand() < 0.48;
      if (good) { pts += 2; ev.text += " Two-point try is good."; } else ev.text += " Two-point try fails.";
      // the try, for the field to act it out: the same kind of play that scored, to the same man
      ev.pat = { two: true, good, style: type === "run" ? "run" : "pass", player: carrier, qb };
    } else {
      add(kl, "xpA", 1);
      const good = rand() < 0.955;
      if (good) { add(kl, "xpM", 1); add(kl, "pts", 1); pts += 1; } else ev.text += " Extra point is no good.";
      ev.pat = { two: false, good, kicker: o.k, holder: o.p || o.qb };
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

  // Spot the ball, update downs (a personal foul at the end of the play adds its 15 and a first down).
  g.yard += yards;
  if (tackOn && g.yard > 0) { g.yard += tackOn; yards += tackOn; ev.firstDown = true; }
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
  let secs = clockStops ? (hurry ? 5 : 7) : hurry ? 18 : (late(g) && lead > 0) || (g.qtr === 4 && lead >= 9) ? 44 : g.ot ? 30 + Math.round(rand() * 6) : 40 + Math.round(rand() * 8);
  if (!clockStops) {
    // Timeouts: a team chasing points late stops the clock on its own drive; a defense that's behind
    // late stops it to get the ball back. (Three a half, two in overtime.)
    const endHalf = (g.qtr === 2 || g.qtr === 4 || g.ot) && g.clock <= 120;
    const offWants = endHalf && (g.qtr === 2 ? g.yard >= 50 : lead <= 0) && g.clock - secs > 0;
    const defWants = (g.qtr === 4 || g.ot) && g.clock <= 180 && lead > 0 && lead <= 16 && g.clock - secs > 0;
    const who = offWants && (g.to?.[off] ?? 0) > 0 ? off : defWants && (g.to?.[def] ?? 0) > 0 ? def : null;
    if (who) { g.to[who]--; secs = 4; ev.text += ` Timeout, ${sideName(g, who)}.`; ev.timeout = who; }
  }
  ev.note = tick(g, secs);
  g.running = !clockStops && !ev.timeout && !ev.note;
  return ev;
}
const late = (g) => g.qtr === 4 && g.clock < 300;
// Penalty names for the play-by-play, and half the distance to the goal when a full walk-off
// would go past it (yard: the offense's yard line; returns the yards moved back).
const PEN_LABEL = { false_start: "False start", formation: "Illegal formation", delay: "Delay of game", offside: "Offside", holding: "Holding", opi: "Offensive pass interference", block_back: "Illegal block in the back", def_holding: "Defensive holding", dpi: "Pass interference", illegal_contact: "Illegal contact", roughing: "Roughing the passer", unr: "Unnecessary roughness", facemask: "Face mask" };
const halfDist = (yard, n) => Math.min(n, Math.floor(yard / 2));
const pickOne = (rand, list) => (list.length ? list[Math.floor(rand() * list.length)] : null);
const sideName = (g, side) => g.sides[side]?.team?.name || (side === "h" ? "home" : "away");

// Play a whole game instantly.
export function playGame(g) {
  let guard = 0;
  while (!g.done && guard++ < 400) step(g);
  if (!g.done) g.done = true;
  return g;
}

// Season stats lines keyed by player id for each side, with QB ratings left to the caller.
export const boxOf = (g) => g.box;
