import test from "node:test";
import assert from "node:assert/strict";
import { retireChance, retires, RETIRE_AGE } from "../src/retirement.js";

test("players retire around their position's age, backs first and kickers last", () => {
  assert.equal(retireChance({ pos: "RB", age: 26, ovr: 75 }), 0);
  assert.ok(retireChance({ pos: "RB", age: 30, ovr: 75 }) > retireChance({ pos: "WR", age: 30, ovr: 75 }));
  assert.equal(retireChance({ pos: "QB", age: 32, ovr: 75 }), 0);
  assert.ok(retireChance({ pos: "QB", age: 37, ovr: 75 }) > 0.3);
  assert.equal(retireChance({ pos: "K", age: 34, ovr: 75 }), 0);
  for (const pos of Object.keys(RETIRE_AGE)) {
    const at = (a) => retireChance({ pos, age: a, ovr: 75, dev: "normal" });
    assert.ok(at(RETIRE_AGE[pos] + 2) > at(RETIRE_AGE[pos]) && at(RETIRE_AGE[pos]) > at(RETIRE_AGE[pos] - 2), pos);
  }
});

test("stars play on; fringe veterans and unsigned free agents leave sooner", () => {
  const vet = { pos: "WR", age: 32 };
  assert.ok(retireChance({ ...vet, ovr: 90 }) < retireChance({ ...vet, ovr: 75 }));
  assert.ok(retireChance({ ...vet, ovr: 65 }) > retireChance({ ...vet, ovr: 75 }));
  assert.ok(retireChance({ ...vet, ovr: 75 }, { freeAgent: true }) > retireChance({ ...vet, ovr: 75 }));
  // a young free agent: only the fringe give up
  assert.equal(retireChance({ pos: "CB", age: 24, ovr: 70 }, { freeAgent: true }), 0);
  assert.ok(retireChance({ pos: "CB", age: 27, ovr: 58 }, { freeAgent: true }) >= 0.5);
  assert.equal(retireChance({ pos: "CB", age: 27, ovr: 58 }), 0); // under contract he plays on
  assert.equal(retires({ pos: "RB", age: 34, ovr: 60 }, {}, () => 0.5), true);
  assert.equal(retires({ pos: "RB", age: 24, ovr: 60 }, {}, () => 0), false);
});

test("good players never retire early, on a roster or between teams", () => {
  // Brian Burns: an 89 DL at 29 (the DL retirement age is 32)
  const burns = { pos: "DL", age: 29, ovr: 89, dev: "star" };
  assert.equal(retireChance(burns), 0);
  assert.equal(retireChance(burns, { freeAgent: true }), 0);
  assert.equal(retireChance({ ...burns, age: 31, ovr: 78 }), 0);
  // a fading 68 at the same age can still call it a career
  assert.ok(retireChance({ ...burns, age: 31, ovr: 68 }) > 0);
  // at his position's age even a star might (less often than an average player)
  assert.ok(retireChance({ ...burns, age: 32 }) > 0);
  assert.ok(retireChance({ ...burns, age: 32 }) < retireChance({ ...burns, age: 32, ovr: 76 }));
  // a good free agent short of his position's age is between teams, not done
  assert.equal(retireChance({ pos: "WR", age: 29, ovr: 80, dev: "normal" }, { freeAgent: true }), 0);
});

test("a free agent unsigned for two full seasons retires; a fresh one doesn't", async () => {
  const { faStale } = await import("../src/retirement.js");
  assert.equal(faStale({ sh: [{ y: 2031 }] }, 2036), true);
  assert.equal(faStale({ sh: [{ y: 2035 }] }, 2036), false);
  assert.equal(faStale({ sh: [{ y: 2034 }] }, 2036), true);
  assert.equal(faStale({ sh: [], ss: { gp: 3 } }, 2036), false);
  assert.equal(faStale({ faSince: 2034 }, 2036), true);
  assert.equal(faStale({}, 2036), false);
});
