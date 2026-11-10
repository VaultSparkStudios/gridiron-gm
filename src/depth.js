// Depth charts without the drawing: who starts where, from your order, the real depth chart and
// snap shares. Pure (no React), so the game engine and the tests can use it.
import { snapOrdered } from "./snaps.js";
import { DL_SLOTS, dlOrder } from "./dline.js";
import { returnerOrder } from "./special.js";
import { ROLE_SLOTS, roleOrder } from "./roles.js";

// Starters per position: the same counts the game sim plays with.
export const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 3, S: 2, K: 1, P: 1 };

// Default pecking order: the club's real (ESPN) depth chart rank "dk" for this season, then rating.
// That only seeds the chart: once you order a position or set snap shares, yours win.
export const byDepth = (a, b) => (a.dk ?? 99) - (b.dk ?? 99) || b.ovr - a.ovr;

// Your order for a position (anyone you haven't placed goes behind, by default order). Pass your
// snap shares and the players getting the most snaps move to the front: snap share decides who starts.
export function depthOrderFor(roster, depthOrder, pos, snaps) {
  if (pos === "KR" || pos === "PR") return returnerOrder(roster, depthOrder, pos); // kick / punt returner
  // A tight end you've put in the receiver chart is split out wide: he plays receiver (rated at
  // the receiver role, roles.js) and leaves the tight end chart until you move him back.
  const wide = new Set(((depthOrder || {}).WR || []).filter((id) => roster.some((p) => p.id === id && p.pos === "TE")));
  const players = roster.filter((p) => (p.pos === pos && !(pos === "TE" && wide.has(p.id))) || (pos === "WR" && wide.has(p.id)));
  const order = ((depthOrder || {})[pos] || []).map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const base = [...order, ...players.filter((p) => !order.includes(p)).sort(byDepth)];
  const ordered = snaps ? snapOrdered(pos, base, snaps) : base;
  if (pos === "DL") return dlOrder(players, (depthOrder || {}).DL || [], ordered, snaps);
  // linebackers (SAM, MIKE, WILL), corners (CB1, CB2, nickel) and receivers (X, Z, slot) by role
  return ROLE_SLOTS[pos] ? roleOrder(pos, players, (depthOrder || {})[pos] || [], ordered, snaps) : ordered;
}



// Where each player sits: "QB1", "WR3", or "QB #2" for backups.
export function depthSlots(roster, depthOrder, snaps) {
  const out = {};
  for (const pos of Object.keys(STARTERS)) {
    depthOrderFor(roster, depthOrder, pos, snaps).forEach((p, i) => {
      const starter = i < STARTERS[pos];
      out[p.id] = { starter, label: pos === "DL" && starter ? DL_SLOTS[i] : ROLE_SLOTS[pos] && starter ? ROLE_SLOTS[pos][i] : starter ? (STARTERS[pos] > 1 ? `${pos}${i + 1}` : `${pos}1`) : `${pos} #${i + 1}` };
    });
  }
  return out;
}
