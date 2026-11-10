import { test } from "node:test";
import assert from "node:assert/strict";
import { applyRosterUpdates } from "../src/rosterUpdates.js";

const U = [{ id: "u1", yr: 2026, name: "A B", pos: "CB", ovr: 82, pot: 90, dev: "star", posAttrs: { press: 92 } }];
const save = (p, yr = 2026) => ({ yr, teams: [{ roster: [{ name: "A B", pos: "CB", ovr: 78, pot: 84, dev: "normal", posAttrs: { press: 78, manCov: 70 }, ...p }] }] });

test("a roster update raises the player once, in its own season", () => {
  const d = save();
  assert.equal(applyRosterUpdates(d, U).length, 1);
  const p = d.teams[0].roster[0];
  assert.deepEqual([p.ovr, p.truePot, p.dev, p.posAttrs.press, p.posAttrs.manCov], [82, 90, "star", 92, 70]);
  assert.equal(applyRosterUpdates(d, U).length, 0, "only once");
  assert.equal(applyRosterUpdates(save({}, 2027), U).length, 0, "a later season keeps what it has");
});

test("a player who has grown past the update keeps his own numbers", () => {
  const d = save({ ovr: 85, pot: 91, dev: "superstar" });
  applyRosterUpdates(d, U);
  const p = d.teams[0].roster[0];
  assert.deepEqual([p.ovr, p.pot, p.dev, p.posAttrs.press], [85, 91, "superstar", 78]);
});
