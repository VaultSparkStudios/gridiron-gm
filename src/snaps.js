// Snap shares. Each position has a budget of 100% per starting spot (QB 100%, WR 300%, DL 400%...)
// and nobody plays more than 100%. Your own settings are fixed first; the rest of the budget goes
// to the other players at that position by depth, the way NFL rotations actually look (no
// backup QB snaps, almost no backup O-line snaps, a real rotation on the defensive line).
export const SNAP_SLOTS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };
// Typical share by depth rank (each list adds up to the position's budget).
const DEFAULT = {
  QB: [100], RB: [62, 30, 8], WR: [93, 88, 72, 34, 13], TE: [70, 25, 5],
  LT: [100], LG: [100], C: [100], RG: [100], RT: [100],
  DL: [82, 82, 78, 72, 46, 30, 10], LB: [98, 92, 68, 28, 14], CB: [88, 82, 30], S: [95, 88, 17], K: [100], P: [100],
};
export const snapBudget = (pos) => (SNAP_SLOTS[pos] || 1) * 100;

// players: healthy players at one position in depth order. overrides: id -> % you've set.
// Returns id -> % (whole numbers; the total never exceeds the budget).
export function positionSnaps(pos, players, overrides = {}) {
  const budget = snapBudget(pos);
  const out = {};
  const fixed = players.filter((p) => overrides[p.id] != null);
  let fixedSum = fixed.reduce((s, p) => s + Math.min(100, Math.max(0, overrides[p.id])), 0);
  const scale = fixedSum > budget ? budget / fixedSum : 1;
  for (const p of fixed) out[p.id] = Math.floor(Math.min(100, Math.max(0, overrides[p.id])) * scale);
  fixedSum = fixed.reduce((s, p) => s + out[p.id], 0);
  // Everyone else shares what's left, weighted by where they sit among the players you haven't
  // set (bench your QB1 at 0% and the next QB in line takes his snaps).
  const free = players.filter((p) => overrides[p.id] == null);
  const base = DEFAULT[pos] || [100];
  const weight = (i) => base[i] ?? 0;
  let left = budget - fixedSum;
  const wts = free.map((p, i) => weight(i));
  let open = free.map((p, i) => i).filter((i) => wts[i] > 0);
  for (const p of free) out[p.id] = 0;
  // Hand out the remainder in proportion, capping anyone who hits 100%.
  for (let pass = 0; pass < 5 && left > 0 && open.length; pass++) {
    const tw = open.reduce((s, i) => s + wts[i], 0);
    let given = 0;
    const next = [];
    for (const i of open) {
      const p = free[i];
      const add = Math.min(100 - out[p.id], Math.floor((left * wts[i]) / tw));
      out[p.id] += add;
      given += add;
      if (out[p.id] < 100) next.push(i);
    }
    left -= given;
    if (!given) break;
    open = next;
  }
  // Rounding leftovers go to the top of the depth chart.
  for (const [i, p] of free.entries()) { if (left <= 0) break; if (wts[i] > 0) { const add = Math.min(left, 100 - out[p.id]); out[p.id] += add; left -= add; } }
  return out;
}

// Every player's share for one team. order(pos) -> healthy players at pos in depth order.
export function teamSnaps(order, overrides = {}) {
  const out = {};
  for (const pos of Object.keys(SNAP_SLOTS)) Object.assign(out, positionSnaps(pos, order(pos), overrides));
  return out;
}

// A position's players with whoever gets the most snaps first. Your snap settings decide who
// starts; players you haven't set keep their depth-chart order (ties never reshuffle).
export function snapOrdered(pos, players, overrides = {}) {
  const s = positionSnaps(pos, players, overrides);
  return players.map((p, i) => [p, i]).sort((a, b) => (s[b[0].id] || 0) - (s[a[0].id] || 0) || a[1] - b[1]).map((x) => x[0]);
}
