// Position changes in the secondary: a cornerback can move to safety and back. His Madden skills
// are translated to the new spot (a corner's recovery speed becomes a safety's range, his ball
// skills become ball-hawking) and his OVR is re-rated on them, with a small learning cost and,
// for a safety moving to corner, a penalty if he isn't fast enough to play on the outside. The
// move remembers where he came from, so moving him back restores his old rating exactly.

const avg = (...xs) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
const mean = (o) => { const v = Object.values(o || {}); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 60; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const DB_SWAP = { CB: "S", S: "CB" };
// How Madden's OVR sits against the average of a position's skills (median over every real
// CB and S): safeties rate about 4 above theirs, corners about 1 below.
const OVR_OFFSET = { CB: -1, S: 3.9 };
export const canMoveDB = (p) => !!DB_SWAP[p?.pos];

function cbToS(a, spd) {
  const g = (k, d = 65) => a[k] ?? d;
  return {
    range: avg(g("recovery"), spd ?? g("recovery")), runSupport: g("tackling"), coverage: avg(g("manCov"), g("zoneCov")),
    tackling: g("tackling"), ballHawk: g("ballSkills"), blitzing: Math.min(g("tackling"), 60), comms: g("playRec"), versatility: avg(g("manCov"), g("zoneCov"), g("press")),
  };
}
function sToCB(a) {
  const g = (k, d = 65) => a[k] ?? d;
  return {
    manCov: g("coverage") - 3, zoneCov: g("coverage"), press: avg(g("runSupport"), g("coverage")) - 4, ballSkills: g("ballHawk"),
    tackling: g("tackling"), recovery: g("range"), footwork: avg(g("range"), g("versatility")), playRec: g("comms"),
  };
}

// The player at his new position. Returns him unchanged if he isn't a CB or S.
export function moveDB(p) {
  const to = DB_SWAP[p.pos];
  if (!to) return p;
  // Going back where he came from: undo the move exactly (keeping any growth since).
  if (p.posFrom?.pos === to) {
    const { posFrom, ...rest } = p;
    const ovr = clamp((p.ovr || 0) - posFrom.shift, 40, 99);
    const pot = clamp((p.pot || p.ovr || 0) - posFrom.shift, ovr, 99);
    return { ...rest, pos: to, mpos: posFrom.mpos, posAttrs: posFrom.attrs, ovr, trueOvr: ovr, pot, truePot: pot };
  }
  const attrs = to === "S" ? cbToS(p.posAttrs || {}, p.spd) : sToCB(p.posAttrs || {});
  const speedCost = to === "CB" ? Math.max(0, 90 - (p.spd ?? 88)) / 3 : 0;
  const shift = Math.round(mean(attrs) + OVR_OFFSET[to] - (mean(p.posAttrs) + OVR_OFFSET[p.pos]) - 1 - speedCost);
  const ovr = clamp((p.ovr || 0) + shift, 40, 99);
  const pot = clamp((p.pot || p.ovr || 0) + shift, ovr, 99);
  return {
    ...p, pos: to, mpos: to === "S" ? "FS" : "CB", posAttrs: attrs, ovr, trueOvr: ovr, pot, truePot: pot,
    posFrom: { pos: p.pos, mpos: p.mpos, attrs: p.posAttrs, shift },
  };
}

// What the move would do to his rating, for the button label.
export const moveDBPreview = (p) => { const n = moveDB(p); return { to: n.pos, ovr: n.ovr }; };

// ---------- Offensive line ----------
// Tackles, guards and centers can move along the line. Left/right swaps (LT/RT, LG/RG) cost
// nothing; moving between tackle, guard and center re-rates a lineman on what the new spot asks
// for: tackles pass protection, footwork, reach and agility; guards run blocking, strength and
// power; centers snapping, awareness and leadership. A typical tackle loses ~1 at guard, a guard
// ~4 at tackle, a center ~1 at guard. Moving back restores his rating.
export const OL_POS = ["LT", "LG", "C", "RG", "RT"];
const OL_KIND = { LT: "T", RT: "T", LG: "G", RG: "G", C: "C" };
export const isOL = (p) => !!OL_KIND[p?.pos];
const olScore = (p, k) => {
  const g = (x) => p.posAttrs?.[x] ?? 70;
  if (k === "T") return 0.25 * g("passBlock") + 0.2 * g("footwork") + 0.15 * g("reach") + 0.15 * (p.agi ?? 63) + 0.1 * g("athleticism") + 0.15 * g("anchor");
  if (k === "G") return 0.25 * g("runBlock") + 0.2 * g("strength") + 0.15 * g("anchor") + 0.15 * g("drive") + 0.15 * g("power") + 0.1 * g("pulling");
  return 0.25 * g("snapping") + 0.2 * g("awareness") + 0.15 * g("leadership") + 0.15 * g("runBlock") + 0.15 * g("anchor") + 0.1 * g("handUse");
};
// Median score gap between spots over every real lineman (from -> to), and what a move costs.
const OL_BASE = { T: { G: 3.0, C: 3.55 }, G: { T: -4.2, C: -2.0 }, C: { T: -3.77, G: -1.0 } };
const OL_COST = { T: { G: 1, C: 3 }, G: { T: 4, C: 2 }, C: { T: 5, G: 1 } };

// His rating at another line spot (no change for his own kind of spot).
export function olShift(p, from, to) {
  const a = OL_KIND[from], b = OL_KIND[to];
  if (!a || !b || a === b) return 0;
  return Math.round(Math.min(0, olScore(p, b) - olScore(p, a) - OL_BASE[a][b] - OL_COST[a][b]));
}

// The lineman at a new spot on the line.
export function moveOL(p, to) {
  if (!isOL(p) || !OL_KIND[to] || p.pos === to) return p;
  const home = p.posFrom?.pos || p.pos;
  const base = (p.ovr || 0) - (p.posFrom?.shift || 0);
  const basePot = (p.pot || p.ovr || 0) - (p.posFrom?.shift || 0);
  if (OL_KIND[to] === OL_KIND[home]) { const { posFrom, ...rest } = p; return { ...rest, pos: to, ovr: base, trueOvr: base, pot: Math.max(base, basePot), truePot: Math.max(base, basePot) }; }
  const shift = olShift({ ...p, pos: home }, home, to);
  const ovr = clamp(base + shift, 40, 99);
  const pot = clamp(basePot + shift, ovr, 99);
  return { ...p, pos: to, ovr, trueOvr: ovr, pot, truePot: pot, posFrom: { pos: home, shift } };
}

// ---------- Front seven: edge rushers and linebackers ----------
// An edge rusher can stand up as a rush linebacker (a 3-4 outside backer) and a linebacker can put
// his hand in the dirt on the edge: build a blitz-heavy front with more rushers off the ball. His
// skills are translated to the new spot (an edge's pass rush becomes blitzing, his run stop and
// motor become run fits and pursuit; a backer's blitzing becomes pass rush) and re-rated, with a
// small learning cost, and a backer too light to hold the edge (under ~245 lbs) gives up more.
// Interior tackles stay inside. Moving back restores his rating exactly.
const FRONT_OFFSET = { EDGE: -1.25, LB: 1.5 };
const isEdge = (p) => p?.pos === "DL" && (p.mpos ? p.mpos !== "DT" : (p.wt || 280) < 292);
export const canMoveFront = (p) => p?.pos === "LB" || isEdge(p);
function edgeToLB(a, spd) {
  const g = (k, d = 65) => a[k] ?? d;
  const cov = clamp(Math.round(48 + ((spd ?? 80) - 75) * 0.8), 35, 75);
  return {
    tackling: avg(g("runStop"), g("motor")) - 3, coverage: cov, blitzing: avg(g("passRush"), g("getOff"), g("bullRush")), runFit: g("runStop") - 2,
    instincts: avg(g("runStop"), g("motor")) - 5, pursuit: avg(g("motor"), spd ?? 80), shedBlock: avg(g("handUse"), g("bullRush")), zoneAwr: cov - 3,
  };
}
function lbToEdge(a, wt) {
  const g = (k, d = 65) => a[k] ?? d;
  const light = Math.max(0, 245 - (wt ?? 235)) / 2;
  return {
    passRush: g("blitzing"), runStop: Math.round(avg(g("runFit"), g("shedBlock")) - light), handUse: g("shedBlock") - 3, motor: g("pursuit"),
    getOff: avg(g("pursuit"), g("blitzing")), bullRush: Math.round(g("shedBlock") - 4 - light), swim: g("blitzing") - 4, spin: g("blitzing") - 6,
  };
}
export function moveFront(p) {
  if (!canMoveFront(p)) return p;
  const to = p.pos === "LB" ? "DL" : "LB";
  if (p.posFrom?.pos === to) {
    const { posFrom, ...rest } = p;
    const ovr = clamp((p.ovr || 0) - posFrom.shift, 40, 99);
    const pot = clamp((p.pot || p.ovr || 0) - posFrom.shift, ovr, 99);
    return { ...rest, pos: to, mpos: posFrom.mpos, posAttrs: posFrom.attrs, ovr, trueOvr: ovr, pot, truePot: pot };
  }
  const attrs = to === "LB" ? edgeToLB(p.posAttrs || {}, p.spd) : lbToEdge(p.posAttrs || {}, p.wt);
  const fromK = p.pos === "LB" ? "LB" : "EDGE", toK = to === "LB" ? "LB" : "EDGE";
  const shift = Math.round(mean(attrs) + FRONT_OFFSET[toK] - (mean(p.posAttrs) + FRONT_OFFSET[fromK]) - 2);
  const ovr = clamp((p.ovr || 0) + shift, 40, 99);
  const pot = clamp((p.pot || p.ovr || 0) + shift, ovr, 99);
  return { ...p, pos: to, mpos: to === "LB" ? "SAM" : "LEDG", posAttrs: attrs, ovr, trueOvr: ovr, pot, truePot: pot, posFrom: { pos: p.pos, mpos: p.mpos, attrs: p.posAttrs, shift } };
}

// Where a player can line up instead: [position, label] pairs for the profile's position menu.
export function moveOptions(p) {
  if (!p) return [];
  if (OL_KIND[p.pos]) return OL_POS.filter((x) => x !== p.pos).map((x) => [x, x]);
  if (DB_SWAP[p.pos]) return [[DB_SWAP[p.pos], DB_SWAP[p.pos] === "S" ? "Safety" : "Cornerback"]];
  if (p.pos === "LB") return [["DL", "Edge rusher (DL)"]];
  if (isEdge(p)) return [["LB", "Rush linebacker (LB)"]];
  return [];
}

// Any position change the game supports (CB/S, along the line, edge/linebacker). Returns the player unchanged otherwise.
export const movePlayer = (p, to) => (OL_KIND[p.pos] && OL_KIND[to] ? moveOL(p, to) : DB_SWAP[p.pos] === to ? moveDB(p) : canMoveFront(p) && (to === "LB" || to === "DL") && p.pos !== to ? moveFront(p) : p);
export const movePreview = (p, to) => movePlayer(p, to).ovr;
