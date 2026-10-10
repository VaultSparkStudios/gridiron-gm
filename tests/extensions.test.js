import { test } from "node:test";
import assert from "node:assert/strict";
import { canExtend, nextYearCommitted, nextYearRoom, extRoom, applyExtensions } from "../src/extensions.js";
import { capFor } from "../src/cap.js";
import { terms, respond, yearlyAsk } from "../src/negotiation.js";

test("players in the last two years of their deal can be extended in season", () => {
  assert.ok(canExtend({ contract: 1 }, "regular"));
  assert.ok(canExtend({ contract: 2 }, "preseason"));
  assert.ok(!canExtend({ contract: 3 }, "regular"));
  assert.ok(!canExtend({ contract: 1, ext: { sal: 5, yrs: 2 } }, "regular"));
  assert.ok(!canExtend({ contract: 1 }, "freeagency"));
});

test("an extension has to fit next season's cap", () => {
  const t = { deadNext: 4, roster: [{ id: 1, contract: 1, salary: 10 }, { id: 2, contract: 3, salary: 50, baseBack: 5 }, { id: 3, contract: 1, salary: 2, ext: { sal: 20, yrs: 3 } }] };
  assert.equal(nextYearCommitted(t), 79);
  assert.equal(nextYearRoom(t, 2026), Math.round((capFor(2027) - 79) * 10) / 10);
  assert.equal(extRoom(t, t.roster[0], 2026), nextYearRoom(t, 2026));
});

test("the new deal takes over at the new league year, not before", () => {
  const teams = [{ roster: [{ id: 1, name: "A", contract: 1, salary: 8.6, sb: 2, ext: { sal: 60, yrs: 3, yr: 2026 } }, { id: 2, name: "B", contract: 2, salary: 5, ext: { sal: 9, yrs: 2 } }] }];
  const done = applyExtensions(teams, 2026);
  assert.equal(done.length, 1);
  const a = teams[0].roster[0], b = teams[0].roster[1];
  assert.equal(a.salary, 60); assert.equal(a.contract, 4); assert.equal(a.ext, undefined); assert.equal(a.sb, undefined);
  assert.equal(b.salary, 5); assert.ok(b.ext); // a year left on his old deal: waits
});

test("extensions cost a little more than re-signing in re-sign week", () => {
  const p = { id: "x", pos: "WR", ovr: 85, age: 26 };
  assert.ok(terms(p, { yr: 2026, mode: "extend" }).minF > terms(p, { yr: 2026, mode: "resign" }).minF);
  assert.equal(respond(p, { sal: yearlyAsk(p, 3) * 1.2, yrs: 3 }, terms(p, { yr: 2026, mode: "extend" })).result, "accept");
});

test("a signing bonus lowers an extension's cap hit, starting this season", async () => {
  const { extStructure, applyExtensions } = await import("../src/extensions.js");
  const none = extStructure(60, 4, 0), big = extStructure(60, 4, 0.55);
  assert.equal(none.hit, 60);
  assert.equal(none.nowAdd, 0);
  assert.ok(big.hit < 55, `cap hit ${big.hit}`);
  assert.ok(big.nowAdd > 0 && big.pr === big.nowAdd);
  // the money adds up: bonus spread over 5 years (this one + 4) and the base over the 4 new years
  assert.ok(Math.abs(big.hit * 4 + big.pr - 60 * 4) < 0.5);
  const t = { roster: [{ id: 1, name: "QB", salary: 30, contract: 1, ext: { sal: big.hit, apy: 60, yrs: 4, yr: 2026, sb: big.pr } }] };
  applyExtensions([t], 2026);
  assert.equal(t.roster[0].salary, big.hit);
  assert.equal(t.roster[0].sb, big.pr, "the bonus proration carries into the new deal (dead money if he's cut)");
  assert.equal(t.roster[0].contract, 5);
});
