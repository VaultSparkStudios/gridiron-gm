// Personnel groupings and defensive packages: who's on the field each snap.
//
// Offense, by NFL shorthand (first digit running backs, second tight ends, the rest receivers):
//   10  1 RB, 0 TE, 4 WR    11  1 RB, 1 TE, 3 WR (the league's base: ~60% of snaps)
//   12  1 RB, 2 TE, 2 WR    13  1 RB, 3 TE, 1 WR    21  2 RB (a fullback), 1 TE, 2 WR
// A club picks a personnel identity (a mix of these); a two-tight-end team barely needs a third
// receiver, a spread team plays four wide and needs a fourth. Heavier groupings run more and block
// better; lighter ones throw more and spread the defense out.
//
// Defense answers with a package:
//   base    4 DL, 3 LB (SAM, MIKE, WILL), 2 CB, 2 S: built for the run, against heavy sets
//   nickel  4 DL, 2 LB (MIKE, WILL), 3 CB (the nickel back covers the slot), 2 S: today's base
//   dime    4 DL, 1 LB (MIKE), 4 CB, 2 S: passing downs and four-wide sets
// Base against three receivers leaves a linebacker on the slot receiver; nickel against two tight
// ends leaves a corner fighting a tight end in the run game. That's the chess match: the offense
// picks a grouping, the defense matches it (or doesn't), and the players' fits at their roles
// decide who wins the snap.

export const PERS = ["10", "11", "12", "13", "21"];
export const PERS_COUNT = { 10: { rb: 1, te: 0, wr: 4 }, 11: { rb: 1, te: 1, wr: 3 }, 12: { rb: 1, te: 2, wr: 2 }, 13: { rb: 1, te: 3, wr: 1 }, 21: { rb: 2, te: 1, wr: 2 } };
// How much more (or less) a grouping throws, before down and distance.
export const PERS_LEAN = { 10: 0.14, 11: 0.05, 12: -0.08, 13: -0.24, 21: -0.15 };

export const OFF_SETS = [
  { key: "auto", label: "Auto (best fit)", icon: "", desc: "Your coordinator picks the identity that suits the roster this week." },
  { key: "balanced", label: "Balanced", icon: "", mix: { 11: 0.6, 12: 0.22, 21: 0.07, 13: 0.05, 10: 0.06 }, desc: "The league norm: mostly three receivers, two tight ends a fifth of the time." },
  { key: "spread", label: "Spread", icon: "", mix: { 11: 0.72, 10: 0.18, 12: 0.1 }, desc: "Three and four wide: needs four real receivers, barely uses a second tight end." },
  { key: "twoTE", label: "Two tight ends", icon: "", mix: { 12: 0.5, 11: 0.35, 13: 0.1, 21: 0.05 }, desc: "12 personnel: two tight ends on the field half the time, so a third receiver matters less." },
  { key: "fullback", label: "Fullback", icon: "", mix: { 21: 0.4, 11: 0.35, 12: 0.2, 13: 0.05 }, desc: "21 personnel: a lead-blocking fullback and play-action off it." },
  { key: "heavy", label: "Heavy", icon: "", mix: { 12: 0.42, 13: 0.2, 21: 0.13, 11: 0.25 }, desc: "Extra blockers everywhere: run it, then play-action over the top." },
];
export const DEF_SETS = [
  { key: "auto", label: "Auto (best fit)", icon: "", shift: null, desc: "Your coordinator leans base or nickel by who you have at SAM and nickel." },
  { key: "match", label: "Match personnel", icon: "", shift: 0, desc: "Base against heavy sets, nickel against three receivers, dime against four." },
  { key: "base", label: "Base-heavy", icon: "", shift: 0.22, desc: "Keep the SAM on the field: stout against the run, a linebacker on the slot." },
  { key: "nickel", label: "Nickel-heavy", icon: "", shift: -0.22, desc: "Stay in nickel even against two tight ends: fast, but lighter against the run." },
];
const MIX = Object.fromEntries(OFF_SETS.filter((s) => s.mix).map((s) => [s.key, s.mix]));
export const LEAGUE_MIX = MIX.balanced;

// How a defense matches each grouping: [base, nickel, dime].
const MATCH = { 10: [0, 0.45, 0.55], 11: [0.14, 0.8, 0.06], 12: [0.62, 0.38, 0], 13: [0.92, 0.08, 0], 21: [0.86, 0.14, 0] };
export const PKGS = ["base", "nickel", "dime"];

// The offense's mix for a club: its chosen identity, else the auto pick.
export function offMix(team, autoKey) {
  const k = team?.personnel && team.personnel !== "auto" ? team.personnel : autoKey || "balanced";
  return MIX[k] || MIX.balanced;
}

// The package split a defense plays against one grouping: tilt (+ toward base, - toward nickel)
// comes from the club's setting, its coordinator and the down.
export function pkgOdds(pers, tilt = 0, passingDown = false) {
  let [b, n, d] = MATCH[pers] || MATCH[11];
  // a lean moves snaps between base and nickel (never more than there is to move)
  if (tilt > 0) { const t = Math.min(tilt, n); b += t; n -= t; } else if (tilt < 0) { const t = Math.min(-tilt, b); b -= t; n += t; }
  if (passingDown) { const t = Math.min(n, 0.3) * (pers === "12" || pers === "13" || pers === "21" ? 0.3 : 1); n -= t; d += t; const t2 = b * 0.5; b -= t2; n += t2; }
  return [b, n, d];
}
// The club's lean: its setting, else (auto) its personnel at SAM vs nickel, plus the coordinator.
export function defTilt(team, samOvr = 70, nbOvr = 70) {
  const set = DEF_SETS.find((s) => s.key === team?.defPkg);
  const dc = team?.coach?.dc || {};
  const coach = (dc.scheme === "3-4" ? 0.06 : dc.scheme === "Cover 2" ? -0.06 : 0) + (dc.spec === "Run Stop" ? 0.05 : dc.spec === "Zone Cov" ? -0.05 : 0);
  const own = set && set.shift != null ? set.shift : Math.max(-0.2, Math.min(0.2, (samOvr - nbOvr) * 0.02));
  return own + coach;
}
// Expected share of snaps in each package against the league's typical offense.
export function pkgShare(tilt = 0) {
  const out = { base: 0, nickel: 0, dime: 0 };
  for (const [p, w] of Object.entries(LEAGUE_MIX)) {
    const [b, n, d] = pkgOdds(p, tilt);
    const third = 0.22; // passing downs
    const [b2, n2, d2] = pkgOdds(p, tilt, true);
    out.base += w * ((1 - third) * b + third * b2); out.nickel += w * ((1 - third) * n + third * n2); out.dime += w * ((1 - third) * d + third * d2);
  }
  return out;
}

// Pick a grouping for this snap: the club's mix, heavier in short yardage and at the goal line,
// lighter on long passing downs.
export function pickPers(rand, mix, { down = 1, toGo = 10, yard = 25 } = {}) {
  const w = { ...mix };
  const short = toGo <= 2 && (down >= 3 || yard >= 95), long = down >= 3 && toGo >= 7;
  for (const p of PERS) {
    w[p] = w[p] || 0;
    if (short) w[p] *= p === "13" ? 4 : p === "21" || p === "12" ? 2.2 : p === "10" ? 0.2 : 0.6;
    if (long) w[p] *= p === "10" ? 2.5 : p === "11" ? 1.4 : 0.35;
    if (short && !mix[p] && (p === "13" || p === "12")) w[p] = 0.05; // everyone has a goal-line package
  }
  const sum = PERS.reduce((s, p) => s + w[p], 0);
  let x = rand() * sum;
  for (const p of PERS) { x -= w[p]; if (x <= 0) return p; }
  return "11";
}
export function pickPkg(rand, pers, tilt, passingDown) {
  const [b, n] = pkgOdds(pers, tilt, passingDown);
  const r = rand();
  return r < b ? "base" : r < b + n ? "nickel" : "dime";
}

// The share of snaps each slot plays for a club, for snap counts (and so stats and development):
// WR [X, Z, SLOT, WR4], TE [TE1, TE2, TE3], LB [SAM, MIKE, WILL], CB [CB1, CB2, NB, dime back].
export function slotUsage(mix, tilt = 0) {
  const m = (k) => mix[k] || 0;
  const pk = pkgShare(tilt);
  return {
    WR: [1 - 0, m(10) + m(11) + m(12) + m(21), m(10) + m(11), m(10)],
    TE: [1 - m(10), m(12) + m(13), m(13)],
    LB: [pk.base, 1, pk.base + pk.nickel],
    CB: [1, 1, pk.nickel + pk.dime, pk.dime],
  };
}

// Which offensive identity fits a roster best. value(pers) -> how good the offense is in that
// grouping (from gamesim's offUnits). The coordinator's scheme leans it: a Power Run coordinator
// wants extra blockers, an Air Raid one wants receivers.
export function bestOffSet(value, scheme) {
  const lean = { "Power Run": { heavy: 0.06, fullback: 0.06, twoTE: 0.04 }, "Air Raid": { spread: 0.06 }, Spread: { spread: 0.04 }, "West Coast": { balanced: 0.02, twoTE: 0.02 } }[scheme] || {};
  let best = "balanced", bv = -Infinity;
  for (const s of OFF_SETS) {
    if (!s.mix) continue;
    const v = Object.entries(s.mix).reduce((t, [p, w]) => t + w * value(p), 0) + (lean[s.key] || 0);
    if (v > bv) { bv = v; best = s.key; }
  }
  return best;
}

// Snap shares by depth for the positions personnel moves around (see snaps.js): receivers
// [X, Z, SLOT, WR4, ...], tight ends, linebackers [SAM, MIKE, WILL, ...], corners [CB1, CB2, NB, ...].
export function snapShape(mix, tilt = 0) {
  const u = slotUsage(mix, tilt), r = (x) => Math.round(x);
  return {
    WR: [93, r(90 * u.WR[1]), r(92 * u.WR[2]), r(90 * u.WR[3]) + 6, 4],
    TE: [r(90 * u.TE[0]), r(92 * u.TE[1]) + 3, r(92 * u.TE[2]) + 2],
    LB: [r(95 * u.LB[0]), 98, r(95 * u.LB[2]), 10, 5],
    CB: [97, 93, r(95 * u.CB[2]), r(95 * u.CB[3]) + 3, 4],
  };
}

// Situational packages: what a club plays in the moments that matter, if it sets them (each
// "auto" leaves it to the usual mix, tilted by down and distance as above).
//   short   short yardage and the goal line (3rd/4th and 1-2, or inside the 5): heavy sets
//   long    3rd and 7 or more: spread it out
//   twoMin  the last two minutes of a half when chasing points: hurry-up groupings
//   longD   the defense on 3rd and long: nickel or dime
//   shortD  the defense in short yardage and at the goal line: base (or stay in nickel)
export const SITUATIONS = [
  { key: "short", label: "Short yardage & goal line", side: "off", opts: ["auto", "13", "12", "21", "11"] },
  { key: "long", label: "3rd and long", side: "off", opts: ["auto", "10", "11"] },
  { key: "twoMin", label: "Two-minute drill", side: "off", opts: ["auto", "10", "11"] },
  { key: "longD", label: "Defense on 3rd and long", side: "def", opts: ["auto", "dime", "nickel"] },
  { key: "shortD", label: "Defense in short yardage", side: "def", opts: ["auto", "base", "nickel"] },
];
// Which situation a snap is: { short, long, twoMin } for the offense on that snap.
export function situationOf({ down, toGo, yard, qtr, clock, lead }) {
  const short = (down >= 3 && toGo <= 2) || (yard >= 95 && toGo <= 5);
  const long = down >= 3 && toGo >= 7;
  const twoMin = (qtr === 2 || qtr === 4) && clock <= 120 && (qtr === 2 || lead <= 0);
  return { short, long, twoMin };
}
// The grouping a club's settings call for in this situation (null: no setting applies).
export function sitPers(sit, s) {
  if (!sit) return null;
  if (s.twoMin && sit.twoMin && sit.twoMin !== "auto") return sit.twoMin;
  if (s.short && sit.short && sit.short !== "auto") return sit.short;
  if (s.long && sit.long && sit.long !== "auto") return sit.long;
  return null;
}
export function sitPkg(sit, s) {
  if (!sit) return null;
  if (s.short && sit.shortD && sit.shortD !== "auto") return sit.shortD;
  if (s.long && sit.longD && sit.longD !== "auto") return sit.longD;
  return null;
}

// What each coordinator wants to run. His favorite identity first, then the ones he's comfortable
// in. Running his favorite gets the most out of him; a set he doesn't believe in costs a little
// (the calls, the practice reps and the install all fight it).
export const OC_PREFS = { "Power Run": ["heavy", "fullback", "twoTE"], "Air Raid": ["spread", "balanced"], Spread: ["spread", "balanced"], "West Coast": ["balanced", "twoTE", "fullback"] };
export const DC_PREFS = { "3-4": ["base", "match"], "4-3": ["match", "base"], "Cover 2": ["nickel", "match"], "Zone Blitz": ["match", "nickel"] };
const fitPts = (prefs, key) => (!prefs ? 0 : prefs[0] === key ? 0.6 : prefs.includes(key) ? 0.25 : -0.5);
// offSet: the identity the offense actually runs (auto resolved). Points: off for the club's own
// offense, def taken off the opponent's.
export function coordFit(team, offSet) {
  const oc = team?.coach?.oc?.scheme, dc = team?.coach?.dc?.scheme;
  const dKey = team?.defPkg && team.defPkg !== "auto" ? team.defPkg : DC_PREFS[dc]?.[0]; // auto: his call
  return { off: fitPts(OC_PREFS[oc], offSet), def: fitPts(DC_PREFS[dc], dKey), ocWants: OC_PREFS[oc]?.[0], dcWants: DC_PREFS[dc]?.[0], ocOk: OC_PREFS[oc] || [], dcOk: DC_PREFS[dc] || [] };
}

// What a club lines up in most: the grouping (from its identity, or its OC's favorite on auto)
// and the package (from its lean). The depth chart's field view opens on these.
const topKey = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0];
export const viewFor = (team) => ({ form: topKey(offMix(team, OC_PREFS[team?.coach?.oc?.scheme]?.[0])) || "11", pkg: topKey(pkgShare(defTilt(team))) || "nickel" });
