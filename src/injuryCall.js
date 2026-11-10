// When one of your starters gets hurt: who takes his spot. The game always has an answer (the next
// man on your depth chart plays), but you get the call: anyone healthy at his position on the 53,
// or a practice-squad player you promote. Your pick takes the hurt starter's exact place on the
// depth chart (his slot on the line, WR2, and so on) and his share of the snaps.
import { depthOrderFor, STARTERS } from "./depth.js";
import { ROLE_SLOTS, roleOvr } from "./roles.js";

const healthy = (p) => !p.injured && !p.holdout && !p.suspended;

// Starters (by your depth chart) who were healthy in `before` and are hurt in `after` and will miss
// the next game. Returns [{ pid, name, pos, wks, slot }].
export function startersHurt(before, after, depthOrder, snaps) {
  const was = new Map((before || []).map((p) => [p.id, p]));
  const out = [];
  for (const p of after || []) {
    const b = was.get(p.id);
    if (!b || !healthy(b) || !p.injured || (p.injWk ?? 1) < 1) continue;
    const order = depthOrderFor((before || []).filter(healthy), depthOrder, p.pos, snaps);
    const slot = order.findIndex((x) => x.id === p.id);
    if (slot < 0 || slot >= (STARTERS[p.pos] || 1)) continue;
    // his role (SAM, nickel, slot...) for the positions that have them: the replacement is judged there
    out.push({ pid: p.id, name: p.name, pos: p.pos, wks: p.injWk ?? 1, slot, role: ROLE_SLOTS[p.pos]?.[slot] });
  }
  return out;
}

// Who could start in his place: the healthy players at his position (the one who'd step in
// anyway first) and practice-squad players there.
export function replacementOptions(team, call, depthOrder, snaps) {
  const up = depthOrderFor((team.roster || []).filter(healthy), depthOrder, call.pos, snaps);
  const starters = STARTERS[call.pos] || 1;
  // the backups: everyone not already starting elsewhere at this position (with roles the
  // arrangement can put the next man anywhere in the starting group, so it's by who the others are)
  const all = depthOrderFor((team.roster || []).filter((p) => healthy(p) || p.id === call.pid), depthOrder, call.pos, snaps);
  const others = new Set(all.slice(0, starters).filter((p) => p.id !== call.pid).map((p) => p.id));
  const bench = all.some((p) => p.id === call.pid) ? [...up.slice(0, starters).filter((p) => !others.has(p.id)), ...up.slice(starters).filter((p) => !others.has(p.id))] : up.slice(starters - 1);
  const ps = (team.ps || []).filter((p) => p.pos === call.pos && healthy(p));
  const role = call.role || ROLE_SLOTS[call.pos]?.[call.slot];
  if (!role) return { roster: bench, ps };
  // each one rated at the role he'd play; a receiving tight end can split out to fill a receiver spot
  const at = (p) => ({ ...p, roleR: roleOvr(p, role) });
  const tes = call.pos === "WR" ? (team.roster || []).filter((p) => p.pos === "TE" && healthy(p) && !bench.some((b) => b.id === p.id)).map(at).filter((p) => p.roleR >= 60) : [];
  const roster = [...bench.map(at), ...tes];
  const best = roster.reduce((b, p) => (!b || p.roleR > b.roleR ? p : b), null);
  return { roster, ps: ps.map(at), role, bestId: best && best.id !== roster[0]?.id ? best.id : null };
}

// Put `inId` where `outId` was in the depth chart at `pos` and give him `outId`'s snap share.
// roster: the whole 53 (the hurt player included). Returns { depthOrder, snaps }.
export function chooseStarter(roster, depthOrder, snaps, pos, outId, inId) {
  const ids = depthOrderFor(roster, depthOrder, pos, null).map((p) => p.id); // the depth chart itself (snaps reorder it at kickoff)
  const i = ids.indexOf(outId), j = ids.indexOf(inId);
  if (i < 0) return { depthOrder, snaps };
  if (j >= 0) [ids[i], ids[j]] = [ids[j], ids[i]];
  else ids.splice(i, 0, inId);
  const ns = { ...(snaps || {}) };
  if (ns[outId] != null) ns[inId] = Math.max(ns[inId] || 0, ns[outId]);
  return { depthOrder: { ...(depthOrder || {}), [pos]: ids }, snaps: ns };
}
