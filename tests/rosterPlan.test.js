import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAN, rosterPlan } from "../src/rosterPlan.js";
import { ROSTER_TARGET } from "../src/offseason.js";

const pl = (id, pos, ovr, contract = 3) => ({ id, pos, ovr, age: 26, contract });

test("the plan is a full 53", () => {
  assert.equal(PLAN.reduce((s, g) => s + g.want, 0), ROSTER_TARGET);
});

test("counts each group, flags the holes and finds the best free agent there", () => {
  const roster = [pl(1, "QB", 80), pl(2, "QB", 65), pl(3, "LT", 78), pl(4, "LT", 70), pl(5, "C", 72), pl(6, "K", 75)];
  const fa = [pl(10, "QB", 70, 0), pl(11, "QB", 74, 0), pl(12, "RG", 77, 0), pl(13, "WR", 81, 0)];
  const r = rosterPlan(roster, fa);
  const row = (k) => r.rows.find((x) => x.key === k);
  assert.equal(r.count, 6);
  assert.equal(r.open, ROSTER_TARGET - 6);
  assert.deepEqual([row("QB").have, row("QB").short, row("QB").top], [2, 1, 80]);
  assert.equal(row("QB").best.id, 11, "the best QB on the market");
  assert.ok(row("QB").ask > 0);
  assert.equal(row("OL").have, 3);
  assert.equal(row("OL").best.id, 12, "any spot on the line counts");
  assert.ok(["LG", "RG", "RT"].includes(row("OL").pos), "sends you to a spot nobody plays");
  assert.equal(row("K").short, 0);
  assert.equal(row("P").best, null);
});

test("before free agency, a deal that's running out is a hole", () => {
  const roster = [pl(1, "QB", 85, 1), pl(2, "QB", 70, 3)];
  assert.equal(rosterPlan(roster, [], { nextYear: true }).rows[0].have, 1);
  assert.equal(rosterPlan(roster, []).rows[0].have, 2);
});
