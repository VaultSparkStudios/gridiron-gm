// One draft order for the whole game. Until the draft starts, every pick's number is projected
// the NFL way (playoffs.js draftOrder: non-playoff clubs worst record first, then playoff clubs
// by the round they went out in, the champion last), and every screen reads the same numbers:
// the pick tracker, the mock draft, Scouting HQ, your scouts' shortlist and trade values.
// Before anyone has played a game the numbers stay where they were set at the start of the
// season (last season's order).
import { draftOrder } from "./playoffs.js";

// Picks in draft order: each round's regular picks, then that round's compensatory picks (rounds
// 3-7, as in the NFL), numbered 1..N overall. num: the slot within the round.
export function inDraftOrder(picks, perRound = 32) {
  const sorted = [...picks].sort((a, b) => a.rd - b.rd || (a.comp ? 1 : 0) - (b.comp ? 1 : 0) || (a.comp ? String(a.id).localeCompare(String(b.id)) : (a.num || 0) - (b.num || 0)));
  const comps = {};
  return sorted.map((pk, i) => ({ ...pk, overall: i + 1, num: pk.comp ? perRound + (comps[pk.rd] = (comps[pk.rd] || 0) + 1) : pk.num }));
}

// picks: this year's picks [{ rd, overall, orig, owner, comp? }]. Returns the same array when
// nothing moved, or a new one with rd/num/overall re-projected (owners never change here).
export function reprojectPicks(picks, teams, pb, yr) {
  if (!picks?.length || !teams?.length) return picks;
  if (!teams.some((t) => (t.w || 0) + (t.l || 0) + (t.t || 0) > 0) && !pb) return picks;
  const order = draftOrder(teams.map((t, i) => ({ ...t, id: t.id ?? i })), pb);
  const pos = new Map(order.map((tid, i) => [tid, i]));
  const mine = picks.filter((pk) => yr == null || pk.yr == null || pk.yr === yr), rest = picks.filter((pk) => !mine.includes(pk));
  const next = inDraftOrder(mine.map((pk) => (pk.comp ? pk : { ...pk, num: (pos.get(pk.orig ?? pk.owner) ?? 0) + 1 })), order.length);
  const before = new Map(mine.map((pk) => [pk.id, pk]));
  const changed = next.some((pk) => { const b = before.get(pk.id); return !b || b.overall !== pk.overall || b.num !== pk.num; });
  return changed ? [...next, ...rest] : picks;
}

// Your remaining picks this year (overall numbers, earliest first).
export const slotsFor = (picks, ui, yr, used = []) => {
  const done = new Set(used);
  return (picks || []).filter((pk) => pk.owner === ui && (pk.yr == null || pk.yr === yr) && !done.has(pk.id)).map((pk) => pk.overall).sort((a, b) => a - b);
};
