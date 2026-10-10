import test from "node:test";
import assert from "node:assert/strict";
import { repairSave } from "../src/repair.js";

test("a damaged save is repaired instead of crashing every screen", () => {
  const good = { id: "a", name: "A", pos: "QB", ovr: 80, age: 25, ss: {}, gl: [] };
  const d = { teams: [{ ab: "NYG", roster: [good, null, undefined, { id: "b", pos: "WR", ovr: 70, dev: "bogus" }, { ...good }], ps: null, ir: [] }], fa: [null, { id: "f", pos: "K", name: "F", ovr: 60 }], sched: [null, { wk: 1 }], draftPicks: [undefined], log: ["ok", { type: "veteran_farewell", name: "X", msg: "X has retired." }, null] };
  const { fixes } = repairSave(d);
  assert.equal(d.teams[0].roster.length, 2);
  assert.equal(d.teams[0].roster[1].dev, undefined);
  assert.equal(d.teams[0].roster[1].name, "Unknown Player");
  assert.deepEqual(d.teams[0].ps, []);
  assert.equal(d.fa.length, 1); assert.ok(Array.isArray(d.fa[0].gl));
  assert.equal(d.sched.length, 1); assert.equal(d.draftPicks.length, 0);
  assert.deepEqual(d.log, ["ok", "🎖️ X has retired."]);
  assert.ok(fixes.length >= 4);
  assert.deepEqual(repairSave(d).fixes, [], "a clean save needs nothing");
});
