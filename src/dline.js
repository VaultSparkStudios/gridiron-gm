// The defensive line: left edge, two defensive tackles, right edge. Any lineman can line up
// anywhere, but each is built for one job. Madden says which (LEDG/REDG edge rushers, DT
// interior); his OVR is his rating there. Moved to the other job he's re-rated on what it asks
// for: an edge needs get-off, speed and pass-rush moves; a tackle needs run stopping, power,
// strength and weight. A typical player loses about 5 OVR off his natural spot; a 250-lb speed
// rusher inside or a 330-lb run stuffer outside loses more, a rare player built for both (Myles
// Garrett, Aaron Donald) barely anything.

export const DL_SLOTS = ["LE", "DT1", "DT2", "RE"];
export const slotKind = (i) => (i === 0 || i === 3 ? "EDGE" : "DT");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Edge or tackle by trade: Madden's position, else body weight (older saves).
export const naturalDL = (p) => (p.mpos ? (p.mpos === "DT" ? "DT" : "EDGE") : (p.wt || 280) >= 292 ? "DT" : "EDGE");
export const dlLabel = (p) => naturalDL(p);

const g = (p, k, d = 70) => p.posAttrs?.[k] ?? d;
const edgeScore = (p) => 0.3 * g(p, "getOff") + 0.2 * g(p, "passRush") + 0.075 * (g(p, "swim") + g(p, "spin")) + 0.15 * (p.spd ?? 78) + 0.1 * g(p, "motor") + 0.1 * g(p, "handUse");
const dtScore = (p) => 0.3 * g(p, "runStop") + 0.2 * g(p, "bullRush") + 0.15 * (p.str ?? 82) + 0.15 * clamp(50 + ((p.wt || 280) - 260) * 0.9, 30, 99) + 0.1 * g(p, "handUse") + 0.1 * g(p, "passRush");
// Medians over every real lineman, so a typical player's move costs the same either way.
const EDGE_BASE = -8.05, DT_BASE = -5.54, MOVE_COST = 5;

// His rating playing "EDGE" or "DT".
export function dlOvrAt(p, kind) {
  if (p.pos !== "DL" || kind === naturalDL(p)) return p.ovr;
  const fit = kind === "DT" ? dtScore(p) - edgeScore(p) - EDGE_BASE : edgeScore(p) - dtScore(p) - DT_BASE;
  return Math.round(clamp(p.ovr + fit - MOVE_COST, 40, Math.max(40, p.ovr - 1)));
}

// The best line from these players: two edges and two tackles by their rating at each spot,
// as [LE, DT1, DT2, RE, ...everyone else in the order given].
export function arrangeDL(players) {
  const left = [...players];
  const edges = [], dts = [];
  while ((edges.length < 2 || dts.length < 2) && left.length) {
    let best = null;
    for (const p of left) for (const kind of ["EDGE", "DT"]) {
      if ((kind === "EDGE" ? edges : dts).length >= 2) continue;
      const v = dlOvrAt(p, kind);
      if (!best || v > best.v) best = { p, kind, v };
    }
    (best.kind === "EDGE" ? edges : dts).push(best.p);
    left.splice(left.indexOf(best.p), 1);
  }
  return [edges[0], dts[0], dts[1], edges[1], ...left].filter(Boolean);
}

// The starting four as they play: each copy carries his rating at his spot (dlKind says which).
export function dlAsPlayed(order) {
  return order.map((p, i) => (i < 4 && p.pos === "DL" ? { ...p, ovr: dlOvrAt(p, slotKind(i)), dlKind: slotKind(i) } : p));
}

// The defensive line as [LE, DT1, DT2, RE, backups]. A line you set keeps each player in his
// spot (an injured one's spot goes to the best fit for it); otherwise the best two edges and two
// tackles start, each where he's built to play.
export function dlOrder(players, manual, ordered, snaps) {
  if (manual.length) {
    const slots = manual.slice(0, 4).map((id) => players.find((p) => p.id === id) || null);
    const used = new Set(slots.filter(Boolean).map((p) => p.id));
    let rest = ordered.filter((p) => !used.has(p.id));
    slots.forEach((p, i) => {
      if (p) return;
      const k = slotKind(i);
      const b = [...rest].sort((a, c) => dlOvrAt(c, k) - dlOvrAt(a, k))[0];
      if (b) { slots[i] = b; rest = rest.filter((x) => x !== b); }
    });
    return [...slots.filter(Boolean), ...rest];
  }
  // With snap shares set, the snap leaders start; otherwise the best fits from the whole group.
  const setSnaps = snaps && players.some((p) => snaps[p.id] != null);
  return setSnaps ? [...arrangeDL(ordered.slice(0, 4)), ...ordered.slice(4)] : arrangeDL(ordered);
}
