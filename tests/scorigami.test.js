import test from "node:test";
import assert from "node:assert/strict";
import { scoreKey, inNflHistory, newScorigamis, isScorigami } from "../src/scorigami.js";

test("NFL history: common finals happened, 11-9 never has", () => {
  assert.ok(inNflHistory(20, 17)); assert.ok(inNflHistory(17, 20)); assert.ok(inNflHistory(0, 0));
  assert.ok(!inNflHistory(11, 9));
  assert.equal(scoreKey(9, 11), "11-9");
});

test("a new score counts once in a league: the first game to post it", () => {
  const g1 = { wk: 6, h: 3, a: 7, hs: 9, as: 11 }; // Eagles @ Giants, 11-9
  const g2 = { wk: 6, h: 1, a: 2, hs: 20, as: 17 };
  const g3 = { wk: 9, h: 4, a: 5, hs: 11, as: 9 }; // the same final later on
  assert.ok(isScorigami(g1, [], 2026)); // before it's logged
  const log = newScorigamis([g1, g2], [], 2026);
  assert.deepEqual(log, [{ s: "11-9", yr: 2026, wk: 6, h: 3, a: 7 }]);
  assert.ok(isScorigami(g1, log, 2026)); // still that game's
  assert.ok(!isScorigami(g3, log, 2026)); // not new any more
  assert.deepEqual(newScorigamis([g1, g3], log, 2026), []);
  assert.ok(!isScorigami(g2, log, 2026));
});
