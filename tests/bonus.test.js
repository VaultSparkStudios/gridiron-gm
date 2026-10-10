import { test } from "node:test";
import assert from "node:assert/strict";
import { proration, yearsLeft, deadMoney, tradeAway, restructure, restructurePlan, newLeagueYear, freshDeal } from "../src/bonus.js";

const star = { id: 1, salary: 40, contract: 4, cy: 2026 }; // 13% of the 2026 cap: 40% bonus

test("bonus proration follows the size of the deal", () => {
  assert.equal(proration(star), 16);
  assert.equal(proration({ salary: 1.2, contract: 1 }), 0.1);
  assert.equal(proration({ ...star, sb: 3 }), 3);
});

test("years left count the league year in force", () => {
  assert.equal(yearsLeft(star, 2026, "regular"), 4);
  assert.equal(yearsLeft(star, 2026, "freeagency"), 3);
  assert.equal(yearsLeft({ ...star, cy: 2027 }, 2026, "freeagency"), 4); // signed this off-season
});

test("dead money: before June 1 it all lands now, after June 1 it splits", () => {
  assert.deepEqual(deadMoney(star, { yr: 2026, sp: "freeagency" }), { now: 48, next: 0, total: 48 });
  assert.deepEqual(deadMoney(star, { yr: 2026, sp: "freeagency", june1: true }), { now: 16, next: 32, total: 48 });
  assert.deepEqual(deadMoney(star, { yr: 2026, sp: "regular" }), { now: 16, next: 48, total: 64 });
  assert.equal(deadMoney({ ...star, contract: 1 }, { yr: 2026, sp: "resign" }).total, 0); // expiring
});

test("a traded player leaves his bonus behind", () => {
  const from = { deadCap: 0 };
  const moved = tradeAway(star, from, { yr: 2026, sp: "regular" });
  assert.equal(moved.salary, 24);
  assert.equal(moved.sb, 0);
  assert.equal(from.deadCap, 16);
  assert.equal(from.deadNext, 48);
});

test("restructure: space now, more later, base returns next league year", () => {
  const plan = restructurePlan(star, { yr: 2026, sp: "regular", minSal: 1 });
  assert.equal(plan.convert, 23);
  const r = restructure(star, { yr: 2026, sp: "regular", minSal: 1 });
  assert.ok(r.p.salary < star.salary);
  assert.equal(r.p.salary, plan.hitNow);
  assert.ok(plan.saved > 15);
  const t = { roster: [r.p], deadCap: 5, deadNext: 7 };
  newLeagueYear([t]);
  assert.equal(t.deadCap, 7);
  assert.equal(t.deadNext, 0);
  assert.equal(t.roster[0].salary, plan.hitLater);
  assert.equal(restructurePlan({ ...star, contract: 1 }, { yr: 2026, sp: "regular", minSal: 1 }), null);
});

test("a new deal starts clean", () => {
  const p = freshDeal({ ...star, sb: 9, baseBack: 4, restructures: 1 });
  assert.equal(p.sb, undefined);
  assert.equal(p.baseBack, undefined);
});
