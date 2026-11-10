import test from "node:test";
import assert from "node:assert/strict";
import { startersHurt, replacementOptions, chooseStarter } from "../src/injuryCall.js";
import { depthOrderFor } from "../src/depth.js";

const R = () => [
  { id: "q1", name: "Starter QB", pos: "QB", ovr: 85 }, { id: "q2", name: "Backup QB", pos: "QB", ovr: 70 }, { id: "q3", name: "Third QB", pos: "QB", ovr: 66 },
  { id: "w1", name: "WR1", pos: "WR", ovr: 88 }, { id: "w2", name: "WR2", pos: "WR", ovr: 84 }, { id: "w3", name: "WR3", pos: "WR", ovr: 80 }, { id: "w4", name: "WR4", pos: "WR", ovr: 72 }, { id: "w5", name: "WR5", pos: "WR", ovr: 69 },
];
const hurt = (r, id, wks = 3) => r.map((p) => (p.id === id ? { ...p, injured: true, injWk: wks } : p));

test("only starters newly hurt and missing the next game get a call", () => {
  const before = R();
  assert.deepEqual(startersHurt(before, hurt(before, "q2"), {}, null), [], "a backup getting hurt is no call");
  const calls = startersHurt(before, hurt(before, "w2", 4), {}, null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].pos, "WR");
  assert.equal(calls[0].wks, 4);
  assert.deepEqual(startersHurt(hurt(before, "q1"), hurt(before, "q1"), {}, null), [], "already hurt last week");
});

test("options are the healthy backups (next man first) and practice-squad players", () => {
  const team = { roster: hurt(R(), "q1"), ps: [{ id: "ps1", pos: "QB", ovr: 60 }, { id: "ps2", pos: "RB", ovr: 60 }] };
  const o = replacementOptions(team, { pos: "QB" }, {}, null);
  assert.deepEqual(o.roster.map((p) => p.id), ["q2", "q3"]);
  assert.deepEqual(o.ps.map((p) => p.id), ["ps1"]);
});

test("your pick takes the hurt starter's slot and snaps; the rest of the order stays", () => {
  const roster = hurt(R(), "w2");
  const { depthOrder, snaps } = chooseStarter(roster, {}, { w2: 85 }, "WR", "w2", "w5");
  assert.deepEqual(depthOrder.WR.slice(0, 3), ["w1", "w5", "w3"]);
  assert.equal(snaps.w5, 85);
  const healthy = roster.filter((p) => !p.injured);
  assert.deepEqual(depthOrderFor(healthy, depthOrder, "WR", null).slice(0, 3).map((p) => p.id), ["w1", "w5", "w3"]);
});
