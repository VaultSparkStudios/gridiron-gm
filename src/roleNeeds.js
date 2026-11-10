// Role needs: where a club's lineup is thin at a role (SAM, MIKE, WILL, outside corner, nickel,
// X, Z, slot), weighted by how much its personnel plays that role. A two-tight-end team barely
// needs a slot receiver; a base-heavy defense needs its SAM. Drives the "fills a need" tags in
// the draft and free agency and the AI clubs' draft boards.
import { ROLE_SLOTS, roleOvr, naturalRole, roleKind } from "./roles.js";
import { depthOrderFor } from "./depth.js";
import { snapShape, LEAGUE_MIX } from "./personnel.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BAR = 80; // a starter below this at his role is a hole (fully a hole by 60)

// roster: the club's players; shape: its snap shape (personnel.js snapShape), else the league's.
// Returns { SAM: 0..1, MIKE, WILL, OUT, NB, X, Z, SLOT }.
export function roleNeeds(roster, shape = snapShape(LEAGUE_MIX, 0)) {
  const healthy = (roster || []).filter((p) => !p.injured || (p.injWk || 0) <= 4), out = {};
  for (const [pos, slots] of Object.entries(ROLE_SLOTS)) {
    const order = depthOrderFor(healthy, {}, pos);
    slots.forEach((slot, i) => {
      const p = order[i], r = p ? roleOvr(p, slot) : 50, use = clamp((shape?.[pos]?.[i] ?? 60) / 100, 0, 1);
      const k = roleKind(slot);
      out[k] = Math.max(out[k] || 0, +(use * clamp((BAR - r) / 20, 0, 1)).toFixed(3));
    });
  }
  return out;
}
// How much a player would fill one of those needs (his natural role).
export const roleFit = (p, needs) => { const k = naturalRole(p); return k && needs ? needs[k] || 0 : 0; };

export const ROLE_TAG = { SAM: "SAM", MIKE: "MIKE", WILL: "WILL", OUT: "OUTSIDE", NB: "NICKEL", FS: "FS", SS: "SS", X: "X", Z: "Z", SLOT: "SLOT" };
// The role filter options for player lists: [value, label].
export const ROLE_FILTERS = [["R:SAM", "LB · SAM"], ["R:MIKE", "LB · MIKE"], ["R:WILL", "LB · WILL"], ["R:OUT", "CB · Outside"], ["R:NB", "CB · Nickel"], ["R:FS", "S · Free"], ["R:SS", "S · Strong"], ["R:X", "WR · X"], ["R:Z", "WR · Z"], ["R:SLOT", "WR · Slot"]];
export const roleFilterMatch = (p, v) => !String(v).startsWith("R:") || (!!ROLE_SLOTS[p.pos] && naturalRole(p) === v.slice(2));
