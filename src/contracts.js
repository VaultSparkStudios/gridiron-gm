// The franchise tag and the fifth-year option, priced off what the league actually pays at each
// position.
//
// Franchise tag: a one-year deal for a player whose contract is up, at the average of the five
// biggest salaries at his position (or 120% of his current pay, if more). One per club per year.
//
// Fifth-year option: a first-round pick finishing the fourth season of his rookie deal can be
// kept one more year at a set price: the top-10 average at his position for a star (85+), the
// middle of the position's market otherwise.
import { askingPrice } from "./offseason.js";
import { rookieSeason } from "./awards.js";

const r1 = (n) => +(+n || 0).toFixed(1);
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// Every salary at a position across the league, biggest first.
export function positionSalaries(teams, pos) {
  return teams.flatMap((t) => (t.roster || []).filter((p) => p.pos === pos).map((p) => p.salary || 0)).sort((a, b) => b - a);
}

export function tagPrice(teams, p, cap) {
  const top5 = mean(positionSalaries(teams, p.pos).slice(0, 5));
  return r1(Math.max(top5, askingPrice({ pos: p.pos, ovr: 86, age: 27 }, cap), (p.salary || 0) * 1.2));
}

export function optionPrice(teams, p, cap) {
  const s = positionSalaries(teams, p.pos);
  const band = p.ovr >= 85 ? s.slice(0, 10) : s.slice(2, 25);
  return r1(Math.max(mean(band), p.salary || 0, cap * 0.0033));
}

// The overall pick he went at: in this league, or in real life for players from the opening rosters.
export const overallPick = (p) => (p.draftPk > 0 ? p.draftPk : p.pk || 0);

// A first-round pick who has just finished the fourth season of his rookie deal (yr: that season).
export function optionEligible(p, yr) {
  const pk = overallPick(p);
  if (!pk || pk > 32 || p.opt5) return false;
  const rs = rookieSeason(p);
  return rs != null && yr - rs + 1 === 4;
}

// Would an AI club pick up his option? A first-rounder who turned into at least a solid starter.
export const aiTakesOption = (p) => p.ovr >= 74;
