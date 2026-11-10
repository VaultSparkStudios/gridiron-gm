import test from "node:test";
import assert from "node:assert/strict";
import { playoffStandouts, stampPlayoffs, playoffBoost, HUGE } from "../src/playoffGrowth.js";

const box = { 1: { passYds: 320, passTD: 3 }, 2: { tkl: 3 }, 3: { rushYds: 160, rushTD: 3 } };

test("playoff standouts: only the big lines", () => {
  assert.deepEqual(playoffStandouts(box).map((x) => x.pid).sort(), ["1", "3"]);
});

test("stamping a round marks standouts and the Super Bowl MVP", () => {
  const out = stampPlayoffs([{ roster: [{ id: 1 }, { id: 2 }, { id: 3 }] }], [{ boxH: box, boxA: {} }], 2027, 4, "1");
  assert.equal(out[0].roster[0].po[0].mvp, true);
  assert.equal(out[0].roster[0].po[0].rd, 4);
  assert.equal(out[0].roster[1].po, undefined);
  assert.ok(out[0].roster[2].po[0].s >= HUGE);
});

test("a postseason turns into a capped boost", () => {
  assert.equal(playoffBoost({ po: [{ yr: 2027, rd: 4, s: 40, mvp: true }, { yr: 2027, rd: 3, s: 35 }] }, 2027).ovr, 3);
  assert.equal(playoffBoost({ po: [{ yr: 2027, rd: 1, s: 23 }] }, 2027).ovr, 0);
  assert.equal(playoffBoost({ po: [{ yr: 2027, rd: 3, s: 23 }] }, 2027).ovr, 1);
  assert.equal(playoffBoost({ po: [{ yr: 2027, rd: 4, s: 40, mvp: true }] }, 2027, true).ovr, 1);
  assert.equal(playoffBoost({ po: [{ yr: 2026, rd: 4, s: 40 }] }, 2027).ovr, 0);
});
