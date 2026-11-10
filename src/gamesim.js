// Unit ratings: each team's starters (from the depth chart) rolled up into passing, running,
// pass defense, run defense, pass rush and O-line. The play-by-play engine (playsim.js) runs
// every game off these, one set for each personnel grouping on offense (offUnits) and each
// package on defense (defUnits): who's on the field, at the role he's playing (roles.js).
import { ROLE_SLOTS, rolesAsPlayed, roleOvr } from "./roles.js";
import { PERS_COUNT, LEAGUE_MIX, pkgShare } from "./personnel.js";

const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 60);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const at = (p, k, d = 60) => p?.posAttrs?.[k] ?? d;

// What a tight end or fullback brings as a blocker, and a fullback as a receiver.
export const teBlock = (p) => 0.45 * at(p, "blocking") + 0.25 * at(p, "passBlock") + 0.15 * (p?.str ?? 70) + 0.15 * at(p, "toughness", 75);
export const fbBlock = (p) => 0.4 * at(p, "passBlock", 55) + 0.3 * (p?.str ?? 70) + 0.3 * clamp(50 + ((p?.wt || 215) - 215) * 1.2, 30, 99) + (p?.mpos === "FB" ? 6 : 0);
// A linebacker in coverage: his coverage, zone eyes and speed.
export const lbCover = (p) => 0.55 * at(p, "coverage") + 0.25 * at(p, "zoneAwr") + 0.2 * (p?.spd ?? 80);
// The fullback in a 21 grouping: the back behind the starter built most for it.
export const pickFB = (backs) => [...backs].sort((a, b) => fbBlock(b) - fbBlock(a))[0] || null;

// The receivers on the field when a grouping has fewer than three: the best of the top three at
// the outside spots (a star slot receiver moves outside in two-receiver sets rather than sitting),
// each rated at X or Z, whichever pairing is better. wrs: receivers in depth order (raw or played).
export function wrOnField(wrs, n) {
  const raw = (p) => (p.natOvr != null ? { ...p, ovr: p.natOvr } : p);
  if (n >= 3) return wrs.slice(0, n);
  const c = wrs.slice(0, 3).map((p) => ({ p: raw(p), x: roleOvr(raw(p), "X"), z: roleOvr(raw(p), "Z") }));
  const as = (o, role) => ({ ...o.p, ovr: role === "X" ? o.x : o.z, natOvr: o.p.ovr, role });
  if (n === 1) { const b = c.sort((a, d) => Math.max(d.x, d.z) - Math.max(a.x, a.z))[0]; return b ? [as(b, b.x >= b.z ? "X" : "Z")] : []; }
  let best = null;
  for (let i = 0; i < c.length; i++) for (let j = 0; j < c.length; j++) if (i !== j && (!best || c[i].x + c[j].z > best.v)) best = { v: c[i].x + c[j].z, i, j };
  return best ? [as(c[best.i], "X"), as(c[best.j], "Z")] : c.map((o) => as(o, "X"));
}

// Players at a position as they play: role ratings applied once (makeSide passes them in already
// applied; the depth chart and previews don't).
const played = (order) => {
  const memo = {};
  return (pos) => (memo[pos] ||= ROLE_SLOTS[pos] && !(order(pos)[0]?.natOvr != null) ? rolesAsPlayed(pos, order(pos)) : order(pos));
};

// The offense in one personnel grouping.
export function offUnits(order0, pers = "11") {
  const order = played(order0), c = PERS_COUNT[pers] || PERS_COUNT[11];
  const top = (pos, n) => order(pos).slice(0, n);
  const ol = avg([...top("LT", 1), ...top("LG", 1), ...top("C", 1), ...top("RG", 1), ...top("RT", 1)].map((p) => p.ovr));
  const qb = avg(top("QB", 1).map((p) => p.ovr)), rbs = order("RB"), rb = avg(rbs.slice(0, 1).map((p) => p.ovr));
  const wr = wrOnField(order("WR"), c.wr), te = top("TE", c.te), fb = c.rb > 1 ? pickFB(rbs.slice(1)) : null;
  // four eligible receivers besides the back: the second and third tight ends count part as blockers
  const recs = [...wr.map((p) => p.ovr), ...te.map((p, i) => (i === 0 ? p.ovr : (p.ovr + at(p, "receiving", p.ovr)) / 2)), ...(fb ? [at(fb, "receiving", fb.ovr - 8)] : [])];
  while (recs.length < 4) recs.push(55); // a grouping the roster can't fill
  const rec = avg(recs.slice(0, 4));
  const blockers = [...te.map(teBlock), ...(fb ? [fbBlock(fb)] : [])];
  const extra = blockers.length - 1; // over 11 personnel's one tight end
  return {
    pass: qb * 0.5 + rec * 0.3 + ol * 0.2 + extra * 0.35, // max protection and play-action
    run: rb * 0.4 + ol * 0.45 + qb * 0.15 + extra * 1.0 + blockers.reduce((s, b) => s + (b - 62) * 0.04, 0),
    ol, qb, rec, k: avg(top("K", 1).map((p) => p.ovr)),
    on: { wr, te, fb, rb: rbs[0] || null },
  };
}

// The defense in one package. Linebackers by role [SAM, MIKE, WILL], corners [CB1, CB2, NB, ...].
export function defUnits(order0, pkg = "nickel") {
  const order = played(order0);
  const dl = avg(order("DL").slice(0, 4).map((p) => p.ovr));
  const L = order("LB"), Cb = order("CB"), S = order("S").slice(0, 2);
  const lbs = (pkg === "base" ? [L[0], L[1], L[2]] : pkg === "nickel" ? [L[1], L[2]] : [L[1]]).filter(Boolean);
  const cbs = Cb.slice(0, pkg === "base" ? 2 : pkg === "nickel" ? 3 : 4);
  const lb = avg(lbs.map((p) => p.ovr));
  let cov = avg([...cbs, ...S].map((p) => p.ovr)), box = 0;
  // base: a linebacker (the better cover man of the SAM and WILL) has the slot or the second tight end
  if (pkg === "base") { const lc = Math.max(...[L[0], L[2]].filter(Boolean).map(lbCover), 55); cov = cov * 0.8 + lc * 0.2; box = 0.8; }
  // nickel: the nickel back is the extra man near the box, so his tackling counts against the run
  if (pkg === "nickel") box = -0.6 + (at(cbs[2], "tackling", 65) - 68) * 0.03;
  if (pkg === "dime") box = -2.0;
  return {
    passD: cov * 0.55 + dl * 0.3 + lb * 0.15,
    runD: dl * 0.45 + lb * 0.4 + cov * 0.15 + box,
    rush: dl * 0.7 + lb * 0.3 + (pkg === "base" ? 0.4 : 0),
    dl, lb, cov,
    on: { lbs, cbs, s: S },
  };
}

// A club's ratings over a game: its offense across its personnel mix, its defense across the
// packages it plays (tilt: + base-heavy, - nickel-heavy). Without options, the league's usual mix.
export function unitRatings(order, { mix = LEAGUE_MIX, tilt = 0 } = {}) {
  const o = { pass: 0, run: 0 }, d = { passD: 0, runD: 0, rush: 0 };
  let ow = 0;
  for (const [p, w] of Object.entries(mix)) { if (!w) continue; const u = offUnits(order, p); o.pass += w * u.pass; o.run += w * u.run; ow += w; }
  const share = pkgShare(tilt);
  for (const [k, w] of Object.entries(share)) { if (!w) continue; const u = defUnits(order, k); d.passD += w * u.passD; d.runD += w * u.runD; d.rush += w * u.rush; }
  const base = offUnits(order, "11");
  return { pass: o.pass / ow, run: o.run / ow, passD: d.passD, runD: d.runD, rush: d.rush, ol: base.ol, qb: base.qb, k: base.k };
}
