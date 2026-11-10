// Roles within a position, the way NFL staffs use them. Same idea as the defensive line
// (dline.js): every player has a natural role, his OVR is his rating there, and moved to another
// role he's re-rated on what that role asks for, his skills and his body together.
//
// Linebackers
//   SAM  (strong side): lines up over the tight end, sets the edge against the run, takes on
//        blocks and rushes now and then. Wants size, strength, block shedding, run fits.
//   MIKE (middle): the green-dot signal caller. Reads the play first: instincts and zone
//        awareness, then filling the gap and finishing the tackle.
//   WILL (weak side): the fastest of the three, chasing sideline to sideline and carrying backs
//        and tight ends in coverage. Wants speed, pursuit, coverage.
// Cornerbacks
//   CB1 / CB2 (outside): man coverage, press at the line, long speed and length to play the
//        ball deep. CB1 follows the other team's best outside receiver.
//   NB (nickel / slot): quick feet and short-area quickness in a phone booth, zone eyes, and a
//        tackler, since the slot is half run defender.
// Safeties
//   FS (free): the centerfielder, alone deep in single-high looks. Range and speed to cover
//        sideline to sideline, eyes and ball skills to make plays on throws, and he makes the
//        coverage calls. Wants range, coverage, ball-hawking, speed, communication.
//   SS (strong): plays down near the box on the tight end's side: a run defender first, then man
//        coverage on tight ends and the odd blitz. Wants run support, tackling, size and strength,
//        coverage, blitzing.
// Wide receivers
//   X (split end): on the line against press, so release, size, contested catches.
//   Z (flanker): off the line, the speed and separation receiver, the deep shot.
//   SLOT: option routes over the middle: route running, separation, quickness, hands, after the catch.
//
// Each role's score is a weighted mix of the skills (posAttrs) and measurables (speed, strength,
// height, weight). BASE is the median gap between two roles' scores over every real player
// natural at the first (Madden 27 data), so a typical player's move costs exactly COST; a player
// built for the new role loses less, one built against it loses more. Nobody rates above his
// natural OVR at another role.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const g = (p, k, d = 65) => p?.posAttrs?.[k] ?? d;
const ht = (p) => p?.ht_ ?? p?.ht ?? 73;

export const ROLE_SLOTS = { LB: ["SAM", "MIKE", "WILL"], CB: ["CB1", "CB2", "NB"], S: ["FS", "SS"], WR: ["X", "Z", "SLOT"] };
// the role kind each slot plays (CB1 and CB2 are both outside corners)
const KIND = { SAM: "SAM", MIKE: "MIKE", WILL: "WILL", CB1: "OUT", CB2: "OUT", NB: "NB", FS: "FS", SS: "SS", X: "X", Z: "Z", SLOT: "SLOT" };
export const roleKind = (slot) => KIND[slot] || slot;
export const ROLE_NAME = {
  SAM: "strong-side linebacker", MIKE: "middle linebacker", WILL: "weak-side linebacker",
  CB1: "No. 1 corner", CB2: "No. 2 corner", NB: "nickel (slot) corner", OUT: "outside corner",
  FS: "free safety", SS: "strong safety",
  X: "X receiver (split end)", Z: "Z receiver (flanker)", SLOT: "slot receiver",
};
// What each role wants, in a line, for the menus.
export const ROLE_WANTS = {
  SAM: "Size, strength, block shedding and run fits: he sets the edge over the tight end.",
  MIKE: "Instincts and zone awareness first (he makes the calls), then run fits and tackling.",
  WILL: "Speed, pursuit and coverage: he chases plays down and covers backs and tight ends.",
  OUT: "Man coverage, press, long speed, recovery and length to play the ball deep.",
  NB: "Quick feet, short-area burst, zone eyes and tackling: the slot is half run defense.",
  FS: "Range, speed and ball skills deep, and the coverage calls: he's the last line.",
  SS: "Run support and sure tackling near the box, size, and coverage on tight ends.",
  X: "Release off press, size, contested catches and body control.",
  Z: "Deep speed, separation and route running: the vertical threat.",
  SLOT: "Route running, separation, quickness, hands and yards after the catch.",
};

const lbSize = (p) => clamp(50 + ((p.wt || 235) - 232) * 1.4, 25, 99);
const cbLength = (p) => clamp(50 + (ht(p) - 71) * 8, 25, 99);
// a safety's build for the box: 200 lb is light for it, 215+ is built to fill against the run
const sSize = (p) => clamp(50 + ((p.wt || 205) - 205) * 2.2, 25, 99);
const wrSize = (p) => clamp(50 + (ht(p) - 72) * 6 + ((p.wt || 200) - 200) * 0.5, 25, 99);

const SCORE = {
  SAM: (p) => 0.2 * g(p, "shedBlock") + 0.15 * (p.str ?? 70) + 0.15 * lbSize(p) + 0.15 * g(p, "runFit") + 0.15 * g(p, "tackling") + 0.1 * g(p, "blitzing") + 0.1 * g(p, "coverage"),
  MIKE: (p) => 0.25 * g(p, "instincts") + 0.15 * g(p, "zoneAwr") + 0.2 * g(p, "runFit") + 0.15 * g(p, "tackling") + 0.1 * g(p, "shedBlock") + 0.1 * g(p, "pursuit") + 0.05 * (p.str ?? 70),
  WILL: (p) => 0.2 * (p.spd ?? 82) + 0.15 * g(p, "pursuit") + 0.2 * g(p, "coverage") + 0.1 * g(p, "zoneAwr") + 0.1 * (p.agi ?? 78) + 0.15 * g(p, "tackling") + 0.1 * g(p, "instincts"),
  OUT: (p) => 0.2 * g(p, "manCov") + 0.15 * g(p, "press") + 0.15 * (p.spd ?? 90) + 0.1 * g(p, "recovery") + 0.1 * g(p, "ballSkills") + 0.1 * cbLength(p) + 0.1 * g(p, "zoneCov") + 0.1 * (p.jmp ?? 85),
  NB: (p) => 0.2 * g(p, "zoneCov") + 0.15 * (p.agi ?? 85) + 0.15 * (p.acc ?? 90) + 0.15 * g(p, "footwork") + 0.1 * g(p, "playRec") + 0.15 * g(p, "tackling") + 0.1 * g(p, "manCov"),
  FS: (p) => 0.25 * g(p, "range") + 0.2 * g(p, "coverage") + 0.15 * g(p, "ballHawk") + 0.15 * (p.spd ?? 88) + 0.1 * g(p, "comms") + 0.05 * (p.jmp ?? 85) + 0.05 * g(p, "versatility") + 0.05 * g(p, "tackling"),
  SS: (p) => 0.25 * g(p, "runSupport") + 0.2 * g(p, "tackling") + 0.15 * g(p, "coverage") + 0.1 * sSize(p) + 0.1 * (p.str ?? 65) + 0.1 * g(p, "blitzing") + 0.05 * g(p, "versatility") + 0.05 * g(p, "comms"),
  X: (p) => 0.2 * g(p, "release") + 0.2 * g(p, "catchTraffic") + 0.15 * wrSize(p) + 0.15 * g(p, "routeRun") + 0.15 * g(p, "bodyCtrl") + 0.1 * (p.jmp ?? 85) + 0.05 * g(p, "deepSpd"),
  Z: (p) => 0.25 * g(p, "deepSpd") + 0.2 * g(p, "separation") + 0.15 * g(p, "routeRun") + 0.15 * (p.spd ?? 90) + 0.15 * g(p, "catching") + 0.1 * g(p, "release"),
  SLOT: (p) => 0.25 * g(p, "routeRun") + 0.2 * g(p, "separation") + 0.15 * (p.agi ?? 85) + 0.15 * g(p, "catching") + 0.1 * g(p, "yac") + 0.15 * (p.acc ?? 90),
};
export const roleScore = (p, kind) => SCORE[kind]?.(p) ?? p?.ovr ?? 60;

const KINDS = { LB: ["SAM", "MIKE", "WILL"], CB: ["OUT", "NB"], S: ["FS", "SS"], WR: ["X", "Z", "SLOT"] };
// BASE[from][to]: median of score(to) - score(from) over real players natural at "from".
// From the Madden 27 rosters; roleBase() recomputes it (CENTER and NB_CUT likewise, from the same players).
export const BASE = {
  SAM: { MIKE: 3.07, WILL: 7.57 }, MIKE: { SAM: -6.44, WILL: 2.35 }, WILL: { SAM: -9.97, MIKE: -3.3 },
  OUT: { NB: -0.05 }, NB: { OUT: -4.25 },
  FS: { SS: -13.03 }, SS: { FS: 11.25 },
  X: { Z: 3.3, SLOT: 3.15 }, Z: { X: -7.85, SLOT: -2 }, SLOT: { X: -8.8, Z: 0.4 },
};
// What a move costs a typical player: linebackers and receivers move around a lot, corners
// between the slot and outside a bit less freely, safeties trade spots most easily of all (many
// defenses play them as interchangeable halves).
const COST = {
  SAM: { MIKE: 3, WILL: 3 }, MIKE: { SAM: 3, WILL: 2 }, WILL: { SAM: 3, MIKE: 2 },
  OUT: { NB: 3 }, NB: { OUT: 3 },
  FS: { SS: 2 }, SS: { FS: 2 },
  X: { Z: 1, SLOT: 3 }, Z: { X: 1, SLOT: 2 }, SLOT: { X: 3, Z: 2 },
};

// The league's median score at each role (over every real player at the position), so roles are
// compared on how far a player stands out at each, not on raw numbers.
export const CENTER = { SAM: 67.23, MIKE: 73.6, WILL: 76.2, OUT: 77.4, NB: 78.5, FS: 79.85, SS: 67.62, X: 76.22, Z: 83.8, SLOT: 82.2 };
// Corners have no Madden slot label: the quarter of them built most for the inside play there.
export const NB_CUT = 1.45;

// His natural role: Madden's (SAM/MIKE/WILL linebackers, slot and deep-threat receivers), else the
// role he stands out at most (corners: the slot if he's among the most slot-built quarter).
export function naturalRole(p) {
  const kinds = KINDS[p?.pos];
  if (!kinds) return null;
  if (p.pos === "LB" && KIND[p.mpos]) return p.mpos;
  if (p.pos === "S" && (p.mpos === "FS" || p.mpos === "SS")) return p.mpos;
  if (p.pos === "WR" && p.arch === "Slot") return "SLOT";
  if (p.pos === "WR" && p.arch === "Deep Threat") return "Z";
  if (p.prole && kinds.includes(p.prole)) return p.prole; // a draft class's balanced role (balanceRoles)
  const rel = (k) => roleScore(p, k) - CENTER[k];
  if (p.pos === "CB") return rel("NB") - rel("OUT") > NB_CUT ? "NB" : "OUT";
  return kinds.reduce((b, k) => (rel(k) > rel(b) ? k : b), kinds[0]);
}

// A tight end split out wide (X, Z or the slot): his skills read as a receiver's (receiving is
// his hands, red-zone work his contested catches, blocking helps him off press), rated on the
// receiver scale (WR_OFF: Madden WR OVR over role score, median over real receivers natural at
// each role), less a little for the move. A receiving tight end (a Kelce, a Pitts) is nearly as
// good out there; a blocking one is not. He never rates above his tight end OVR.
const WR_OFF = { X: -5.85, Z: -9.95, SLOT: -8.75 }, TE_WIDE_COST = -4; // negative: tight end skill ratings run a little low against receivers' (checked on the real tight ends)
export const teAsWR = (p) => {
  const a = p.posAttrs || {}, v = (k, d = 60) => a[k] ?? d;
  return { ...p, posAttrs: { routeRun: v("routeRun"), catching: v("receiving"), separation: Math.round((v("routeRun") + (p.agi ?? 70)) / 2), release: Math.round((v("routeRun") + v("blocking")) / 2), bodyCtrl: Math.round((v("receiving") + v("redZone")) / 2), yac: v("yac"), deepSpd: p.spd ?? 80, catchTraffic: v("redZone") } };
};
// (a blocker's OVR is mostly blocking, so he's capped lower out wide)
const teWide = (p, kind) => {
  if (!p.posAttrs) return Math.max(35, p.ovr - 8);
  const cap = p.ovr - Math.max(0, (p.posAttrs.blocking ?? 60) - (p.posAttrs.receiving ?? 60)) * 0.4;
  return Math.round(clamp(roleScore(teAsWR(p), kind) + WR_OFF[kind] - TE_WIDE_COST, 35, cap));
};

// His rating playing a slot (SAM, CB1, NB, X...). Unchanged at his own role.
export function roleOvr(p, slot) {
  if (p?.pos === "TE" && WR_OFF[KIND[slot]] != null) return teWide(p, KIND[slot]);
  // no skills on file (very old saves): nothing to judge a move by
  if (!p?.posAttrs) return p?.ovr;
  const kind = KIND[slot] || slot, nat = naturalRole(p);
  if (!nat || !kind || kind === nat || !SCORE[kind]) return p.ovr;
  const fit = roleScore(p, kind) - roleScore(p, nat) - (BASE[nat]?.[kind] ?? 0);
  return Math.round(clamp(p.ovr + fit - (COST[nat]?.[kind] ?? 3), 35, p.ovr));
}

// The best arrangement of these players into the position's slots, as
// [slot 0, slot 1, slot 2, ...everyone else in the order given]. Greedy by rating at each slot,
// the way arrangeDL fills edges and tackles. For corners, CB1 is the better outside corner.
export function arrangeRoles(pos, players) {
  const slots = ROLE_SLOTS[pos];
  if (!slots) return players;
  const left = [...players], out = new Array(slots.length).fill(null);
  for (let n = 0; n < slots.length && left.length; n++) {
    let best = null;
    for (const p of left) for (let i = 0; i < slots.length; i++) {
      if (out[i]) continue;
      const v = roleOvr(p, slots[i]) + (pos === "CB" && i === 0 ? 0.01 : 0);
      if (!best || v > best.v) best = { p, i, v };
    }
    out[best.i] = best.p;
    left.splice(left.indexOf(best.p), 1);
  }
  // two outside corners: the better one is CB1
  if (pos === "CB" && out[0] && out[1] && roleOvr(out[1], "CB1") > roleOvr(out[0], "CB1")) [out[0], out[1]] = [out[1], out[0]];
  return [...out.filter(Boolean), ...left];
}

// A position in slot order. A chart you set keeps each player in his slot (an injured one's slot
// goes to the best fit for it); with snap shares set the snap leaders fill the slots by fit;
// otherwise the best fits from the whole group.
export function roleOrder(pos, players, manual, ordered, snaps) {
  const slots = ROLE_SLOTS[pos];
  if (!slots) return ordered;
  const n = slots.length;
  if (manual.length) {
    const set = manual.slice(0, n).map((id) => players.find((p) => p.id === id && ordered.includes(p)) || null);
    const used = new Set(set.filter(Boolean).map((p) => p.id));
    let rest = ordered.filter((p) => !used.has(p.id));
    set.forEach((p, i) => {
      if (p) return;
      const b = [...rest].sort((a, c) => roleOvr(c, slots[i]) - roleOvr(a, slots[i]))[0];
      if (b) { set[i] = b; rest = rest.filter((x) => x !== b); }
    });
    return [...set.filter(Boolean), ...rest];
  }
  const setSnaps = snaps && players.some((p) => snaps[p.id] != null);
  return setSnaps ? [...arrangeRoles(pos, ordered.slice(0, n)), ...ordered.slice(n)] : arrangeRoles(pos, ordered);
}

// The starters as they play: each copy carries his rating at his slot (role says which).
export function rolesAsPlayed(pos, order) {
  const slots = ROLE_SLOTS[pos];
  if (!slots) return order;
  return order.map((p, i) => (i < slots.length && (p.pos === pos || (pos === "WR" && p.pos === "TE")) ? { ...p, ovr: roleOvr(p, slots[i]), natOvr: p.ovr, role: slots[i] } : p));
}

// Every role's rating for one player, for the player card: [[role, rating], ...] best first.
export function roleCard(p) {
  if (p?.pos === "TE") return ["X", "Z", "SLOT"].map((k) => [k, teWide(p, k)]).sort((a, b) => b[1] - a[1]);
  const kinds = KINDS[p?.pos];
  if (!kinds) return null;
  const nat = naturalRole(p);
  return kinds.map((k) => [k, k === nat ? p.ovr : roleOvr(p, k)]).sort((a, b) => b[1] - a[1]);
}

// Recompute BASE from a list of real players (natural role known): median score gaps.
export function roleBase(players) {
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const out = {};
  for (const [pos, kinds] of Object.entries(KINDS)) for (const from of kinds) {
    const nat = players.filter((p) => p.pos === pos && naturalRole(p) === from);
    out[from] = {};
    for (const to of kinds) if (to !== from) out[from][to] = +med(nat.map((p) => roleScore(p, to) - roleScore(p, from))).toFixed(2);
  }
  return out;
}

// A real draft prospect's label (FS or SS) with skills that were generated: lean them toward the
// role he plays until his skills say the same (his OVR, from the real board, doesn't change). An
// FS gains range, coverage, ball-hawking and the calls and gives up run support and blitzing; an
// SS the other way round. Most move a few points; one already built for his role doesn't move.
const S_LEAN = { range: 1, coverage: 1, ballHawk: 1, comms: 0.5, runSupport: -1, tackling: -0.5, blitzing: -1 };
export function shapeSafety(p, kind) {
  if (p?.pos !== "S" || !p.posAttrs || (kind !== "FS" && kind !== "SS")) return p;
  const dir = kind === "FS" ? 1 : -1, other = kind === "FS" ? "SS" : "FS";
  const fits = (q) => roleScore(q, kind) - CENTER[kind] >= roleScore(q, other) - CENTER[other] + 1;
  let q = p;
  for (let k = 0; k <= 30 && !fits(q); k += 2) {
    const a = { ...p.posAttrs };
    for (const [key, w] of Object.entries(S_LEAN)) if (typeof a[key] === "number") a[key] = Math.round(clamp(a[key] + dir * w * k, 30, 99));
    q = { ...p, posAttrs: a };
  }
  return q;
}

// Role-shaped development: the skills each role leans on (from the role scores above). A player
// who starts a season at a role grows toward it in the off-season: those skills come along a
// little faster and the ones the role never asks of him a little slower. A light linebacker
// playing SAM learns to shed blocks; a corner moved inside learns the slot's zone eyes.
export const ROLE_SKILLS = {
  SAM: { shedBlock: 0.2, runFit: 0.15, tackling: 0.15, blitzing: 0.1, coverage: 0.1 },
  MIKE: { instincts: 0.25, zoneAwr: 0.15, runFit: 0.2, tackling: 0.15, shedBlock: 0.1, pursuit: 0.1 },
  WILL: { pursuit: 0.15, coverage: 0.2, zoneAwr: 0.1, tackling: 0.15, instincts: 0.1 },
  OUT: { manCov: 0.2, press: 0.15, recovery: 0.1, ballSkills: 0.1, zoneCov: 0.1 },
  FS: { range: 0.25, coverage: 0.2, ballHawk: 0.15, comms: 0.1 },
  SS: { runSupport: 0.25, tackling: 0.2, coverage: 0.15, blitzing: 0.1 },
  NB: { zoneCov: 0.2, footwork: 0.15, playRec: 0.1, tackling: 0.15, manCov: 0.1 },
  X: { release: 0.2, catchTraffic: 0.2, routeRun: 0.15, bodyCtrl: 0.15, deepSpd: 0.05 },
  Z: { deepSpd: 0.25, separation: 0.2, routeRun: 0.15, catching: 0.15, release: 0.1 },
  SLOT: { routeRun: 0.25, separation: 0.2, catching: 0.15, yac: 0.1 },
};
// rl: games started at each slot this season ({ SAM: 12, ... }). The role he mostly played, and
// how settled he was in it (0-1: a full season at one role is 1).
export function seasonRole(rl) {
  const e = Object.entries(rl || {}).filter(([, n]) => n > 0);
  if (!e.length) return null;
  const tot = e.reduce((t, [, n]) => t + n, 0), [slot, n] = e.sort((a, b) => b[1] - a[1])[0];
  return { slot, kind: roleKind(slot), share: Math.min(1, n / 12) * (n / tot) };
}
// The off-season nudge for each skill (added to his ordinary growth): up to about +2 for the
// role's main skills, -1 for skills it doesn't use. Young players adapt most; past 30, little.
export function roleGrowth(posAttrs, rl, age) {
  const r = seasonRole(rl), w = r && ROLE_SKILLS[r.kind];
  if (!w || !posAttrs) return null;
  const adapt = r.share * (age <= 25 ? 1 : age <= 29 ? 0.7 : 0.35), out = {};
  for (const k of Object.keys(posAttrs)) if (typeof posAttrs[k] === "number") out[k] = w[k] ? adapt * w[k] * 9 : -adapt * 0.8;
  return { ...r, nudge: out };
}

// The market pays roles differently, as the NFL does: a SAM (a two-down linebacker) and a slot
// corner earn well under an outside corner or a MIKE of the same rating; slot receivers a little
// under outside ones. Applied to asking prices (offseason.js askingPrice).
export const ROLE_PAY = { SAM: 0.8, MIKE: 1, WILL: 0.95, OUT: 1, NB: 0.84, FS: 1, SS: 1, X: 1, Z: 1, SLOT: 0.92 };
// (free and strong safeties are paid alike: the top of both markets sits at the same number)
export const rolePay = (p) => (["LB", "CB", "S", "WR"].includes(p?.pos) ? ROLE_PAY[naturalRole(p)] ?? 1 : 1);

// A draft class's roles in realistic proportions. Read one prospect at a time, the thresholds tuned
// on NFL veterans put almost every college linebacker at SAM or every corner outside; a real class
// has nickels, slots and free safeties too. So within each position the prospects most built for a
// role get it, up to its share of the class: corners a third nickel, receivers 40% X and 30% each
// Z and slot, safeties half and half, linebackers about a third each. Stamped as p.prole, which
// naturalRole() reads first. Leaves a class that already has roles alone.
export const ROLE_SHARE = { CB: { OUT: 0.65, NB: 0.35 }, WR: { X: 0.4, Z: 0.3, SLOT: 0.3 }, S: { FS: 0.5, SS: 0.5 }, LB: { SAM: 0.35, MIKE: 0.3, WILL: 0.35 } };
export function balanceRoles(cls) {
  if (!Array.isArray(cls) || cls.some((p) => p.prole && !p.mpos && !p.arch)) return cls;
  for (const [pos, share] of Object.entries(ROLE_SHARE)) {
    const ps = cls.filter((p) => p.pos === pos);
    if (!ps.length) continue;
    const kinds = Object.keys(share), left = Object.fromEntries(kinds.map((k) => [k, Math.max(1, Math.round(share[k] * ps.length))]));
    // how much more a player is built for each role than for his others
    // a label the data already gives him (a real safety's FS/SS, a linebacker's spot, a slot or
    // deep-threat receiver) stands, and counts against that role's share
    for (const p of ps) {
      const lab = (pos === "LB" || pos === "S") && kinds.includes(p.mpos) ? p.mpos : pos === "WR" && p.arch === "Slot" ? "SLOT" : pos === "WR" && p.arch === "Deep Threat" ? "Z" : null;
      if (lab) { p.prole = lab; left[lab] = Math.max(0, left[lab] - 1); }
    }
    const pairs = [];
    for (const p of ps) {
      if (p.prole) continue;
      const rel = Object.fromEntries(kinds.map((k) => [k, roleScore(p, k) - CENTER[k]]));
      for (const k of kinds) pairs.push({ p, k, edge: rel[k] - Math.max(...kinds.filter((x) => x !== k).map((x) => rel[x])) });
    }
    pairs.sort((a, b) => b.edge - a.edge);
    for (const { p, k } of pairs) if (!p.prole && left[k] > 0) { p.prole = k; left[k]--; }
    for (const p of ps) if (!p.prole) p.prole = kinds[0];
  }
  return cls;
}
export const balanceClasses = (dc) => Object.fromEntries(Object.entries(dc || {}).map(([y, c]) => [y, balanceRoles(c)]));
