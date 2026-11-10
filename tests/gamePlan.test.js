import test from "node:test";
import assert from "node:assert/strict";
import { planOptions, bestPlan, resolvePlan, planEdge, defKey } from "../src/gamePlan.js";

const U = (o) => ({ pass: 75, run: 75, passD: 75, runD: 75, rush: 75, ol: 75, ...o });

test("run when your run game has the bigger edge, pass when your passing does", () => {
  assert.equal(bestPlan(U({ run: 85 }), U({ runD: 68 })).off, "run_heavy");
  assert.equal(bestPlan(U({ pass: 86 }), U({ passD: 66 })).off, "pass_heavy");
  assert.equal(bestPlan(U(), U()).off, "balanced", "no edge either way: balanced");
});

test("defense: stack the box against a run team, cover against a passing team, blitz a weak line", () => {
  assert.equal(bestPlan(U(), U({ run: 88 })).def, "run_stop");
  assert.equal(bestPlan(U(), U({ pass: 88 })).def, "coverage");
  assert.equal(bestPlan(U({ rush: 90 }), U({ ol: 66 })).def, "aggressive");
  assert.ok(planOptions(U({ rush: 66 }), U({ ol: 86 })).def.aggressive.v < 0, "blitzing a great line backfires");
});

test("the wrong plan costs you and the right one helps, symmetrically", () => {
  const me = U({ run: 85 }), them = U({ runD: 66, pass: 70 });
  const good = planEdge({ off: "run_heavy", def: "balanced" }, { off: "balanced", def: "balanced" }, me, them);
  const bad = planEdge({ off: "pass_heavy", def: "balanced" }, { off: "balanced", def: "balanced" }, me, them);
  assert.ok(good.h > 0.5 && bad.h < 0);
});

test("your pick only counts for the game it was made for; old saves' plans still work", () => {
  const me = U({ run: 85 }), them = U({ runD: 66 });
  const pick = { off: "pass_heavy", def: "prevent", wk: "2027:5", auto: false };
  assert.equal(resolvePlan(pick, me, them, "2027:5").off, "pass_heavy");
  assert.equal(resolvePlan(pick, me, them, "2027:5").def, "coverage");
  const next = resolvePlan(pick, me, them, "2027:6");
  assert.equal(next.off, "run_heavy");
  assert.equal(next.auto, true);
  assert.equal(defKey("conservative"), "coverage");
  assert.equal(resolvePlan(undefined, me, them, "x").off, "run_heavy");
});
