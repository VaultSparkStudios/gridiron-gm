import test from "node:test";
import assert from "node:assert/strict";
import { milestoneWatch } from "../src/milestoneWatch.js";

test("players within reach of a milestone are on the watch, and crossing it today is a hit", () => {
  const roster = [
    { id: 1, name: "WR One", ss: { recYds: 930 } },
    { id: 2, name: "RB Two", ss: { rushYds: 600 } },
    { id: 3, name: "QB Three", ss: { passYds: 3820 } },
  ];
  let w = milestoneWatch(roster, {});
  assert.deepEqual(w.chase.map((e) => e.name).sort(), ["QB Three", "WR One"]);
  assert.equal(w.chase.find((e) => e.name === "WR One").need, 70);
  w = milestoneWatch(roster, { 1: { recYds: 75 } });
  assert.equal(w.hit[0].name, "WR One");
  assert.equal(w.hit[0].target, 1000);
});
