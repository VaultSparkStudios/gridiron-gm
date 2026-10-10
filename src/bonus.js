// Contract structure: signing bonuses, dead money and restructures.
//
// A player's cap hit (salary) is his base salary plus his signing bonus spread evenly over the
// years of the deal (the proration, sb). The bonus is already paid, so it stays on the cap even
// after he's gone: cut or trade him and every year of proration still to come is dead money.
// Before June 1 (re-sign week, free agency, the draft) it all lands on this year's cap; after
// June 1 (the season), or with a June 1 designation in the off-season, this year's share stays
// this year and the rest moves to next year's cap.
//
// A restructure turns most of this year's base salary into bonus, spread over the years left:
// space now, a bigger cap hit in every later year, and more dead money if he's cut.
import { capFor, BASE_YEAR } from "./cap.js";

const r1 = (x) => Math.round((+x || 0) * 10) / 10;
export const OFFSEASON = new Set(["resign", "freeagency", "draft"]);
export const JUNE1_CUTS = 2;

// How much of a new deal is signing bonus: big deals are bonus-heavy, minimum deals aren't.
export function bonusShare(salary, cap) {
  const s = (salary || 0) / cap;
  return s >= 0.08 ? 0.4 : s >= 0.03 ? 0.3 : s >= 0.01 ? 0.15 : 0.05;
}

// His bonus proration per year: set by a restructure or trade, otherwise his deal's usual share.
export const proration = (p) => (p.sb != null ? p.sb : r1((p.salary || 0) * bonusShare(p.salary, capFor(p.cy || BASE_YEAR))));

// League years left on his deal, counting the one in force. From re-sign week on it's next
// season's league year, so a deal signed before then has one year fewer left.
export function yearsLeft(p, yr, sp) {
  const n = OFFSEASON.has(sp) && p.cy !== yr + 1 ? (p.contract || 0) - 1 : p.contract || 0;
  return Math.max(0, n);
}

// Dead money if he's released (or traded): { now, next, total }.
export function deadMoney(p, { yr, sp, june1 = false } = {}) {
  const yl = yearsLeft(p, yr, sp);
  const pr = proration(p);
  const total = r1(pr * yl);
  if (!yl || !pr) return { now: 0, next: 0, total: 0 };
  if (OFFSEASON.has(sp) && !june1) return { now: total, next: 0, total };
  return { now: r1(pr), next: r1(total - pr), total };
}

// Charge dead money to a team (mutates it).
export function chargeDead(t, d) {
  if (d.now) t.deadCap = r1((t.deadCap || 0) + d.now);
  if (d.next) t.deadNext = r1((t.deadNext || 0) + d.next);
}

// A player leaving his team in a trade: the team keeps his bonus as dead money, and he arrives
// at his new club carrying only his base salary.
export function tradeAway(p, from, ctx) {
  const pr = proration(p);
  if (!pr || !from) return p;
  chargeDead(from, deadMoney(p, ctx));
  return { ...p, salary: r1((p.salary || 0) - pr), sb: 0 };
}

// What a restructure would do, or null if he can't be restructured (fewer than 2 years left, or
// a base salary already near the minimum).
export function restructurePlan(p, { yr, sp, minSal }) {
  const yl = yearsLeft(p, yr, sp);
  if (yl < 2) return null;
  const pr = proration(p);
  const convert = r1((p.salary || 0) - pr - minSal);
  if (convert < 1) return null;
  const n = Math.min(yl, 5);
  const add = r1(convert / n);
  return {
    convert, years: n, addPerYr: add, saved: r1(convert - add),
    hitNow: r1(p.salary - convert + add), hitLater: r1(p.salary + add),
    deadIfCut: r1((pr + add) * yl),
  };
}
export function restructure(p, ctx) {
  const plan = restructurePlan(p, ctx);
  if (!plan) return null;
  return { plan, p: { ...p, salary: plan.hitNow, sb: r1(proration(p) + plan.addPerYr), baseBack: r1((p.baseBack || 0) + plan.convert), restructures: (p.restructures || 0) + 1 } };
}

// A brand-new contract: his old bonus and restructures don't come with him.
export const freshDeal = (p) => { const { sb, baseBack, restructures, restructured, ...rest } = p; return rest; };

// A new league year (re-sign week): last year's dead money is off the books, money pushed to
// this year arrives, and restructured base salaries come back. Mutates the teams.
export function newLeagueYear(teams) {
  for (const t of teams) {
    if (!t) continue;
    t.deadCap = r1(t.deadNext || 0);
    t.deadNext = 0;
    t.june1 = 0;
    for (const list of [t.roster, t.ir, t.ps]) for (const p of list || []) {
      if (p.baseBack) { p.salary = r1((p.salary || 0) + p.baseBack); delete p.baseBack; }
    }
  }
  return teams;
}
