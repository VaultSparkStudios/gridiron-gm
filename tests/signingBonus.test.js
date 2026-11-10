import { test } from "node:test";
import assert from "node:assert/strict";
import { signingStructure, signedTerms, deadMoney, newLeagueYear, proration } from "../src/bonus.js";

test("a signing bonus lowers this year's cap hit and spreads over the deal", () => {
  const st = signingStructure(30, 4, 0.5, { minSal: 1, cap: 300 });
  assert.equal(st.bonus, 14.5);
  assert.ok(st.hitNow < 30 && st.hitLater > 30);
  // the bonus is paid once: total cap charged over the deal equals the money paid
  assert.ok(Math.abs(st.hitNow + st.hitLater * 3 - 120) < 0.5);
});

test("no bonus on one-year deals or with None picked", () => {
  assert.deepEqual(signedTerms(10, 1, 0.75, { minSal: 1, cap: 300 }), { salary: 10 });
  assert.deepEqual(signedTerms(10, 3, 0, { minSal: 1, cap: 300 }), { salary: 10 });
});

test("the deal's cap hits follow the real schedule and cutting him leaves dead money", () => {
  const terms = signedTerms(30, 4, 0.5, { minSal: 1, cap: 300 });
  const t = { roster: [{ id: 1, contract: 4, ...terms }] };
  const p = t.roster[0];
  assert.ok(p.salary < 30);
  assert.ok(deadMoney(p, { yr: 2026, sp: "regular" }).total > 0, "bonus is dead money if he's cut");
  newLeagueYear([t]);
  assert.equal(p.salary, Math.round((terms.salary + terms.baseBack) * 10) / 10, "year two: the base salary returns");
  assert.ok(proration(p) > 0);
});
