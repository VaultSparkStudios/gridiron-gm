import test from "node:test";
import assert from "node:assert/strict";
import { combineRank, rankColor, COMBINE_TESTS } from "../src/scouting.js";

const forty = COMBINE_TESTS.find((t) => t.k === "fortyYd");
const bench = COMBINE_TESTS.find((t) => t.k === "bench");
const dt = (id, f, b, pro) => ({ id, pos: "DT", [pro ? "proDay" : "combine"]: { fortyYd: f, bench: b } });

test("a combine number ranks against his position group in the class, best first", () => {
  const cls = [dt(1, 4.83, 24), dt(2, 4.95, 30), dt(3, 4.79, 20, true), dt(4, 5.1, 35), { id: 5, pos: "CB", combine: { fortyYd: 4.3, bench: 12 } }, { id: 6, pos: "DT" }];
  assert.deepEqual(combineRank(cls, cls[0], forty), { rank: 2, n: 4 }); // a pro day counts; the CB and the untested DT don't
  assert.deepEqual(combineRank(cls, cls[0], bench), { rank: 3, n: 4 }); // more reps is better
  assert.equal(combineRank(cls, cls[5], forty), null);
  assert.equal(rankColor({ rank: 1, n: 16 }), "#22c55e");
  assert.equal(rankColor({ rank: 16, n: 16 }), "#ef4444");
});
