// The health run's user-vs-matched-AI check.
import test from "node:test";
import assert from "node:assert/strict";
import { matchedClubs, matchedSeason, matchedRun } from "../src/balanceWatch.js";

const club = (ovr, w = 0, l = 0) => ({ roster: Array.from({ length: 22 }, () => ({ ovr })), w, l });

test("matched clubs are the AI clubs closest in starter strength", () => {
  const teams = [club(80), club(60), club(79), club(81), club(90), club(78)];
  assert.deepEqual(matchedClubs(teams, 0).sort(), [2, 3, 5]);
});

test("season gap and the run's average", () => {
  const teams = [club(80, 12, 5), club(80, 8, 9), club(80, 9, 8)];
  const s = matchedSeason(teams, 0, [1, 2]);
  assert.equal(s.user, 0.706); assert.ok(Math.abs(s.gap - 0.206) < 0.002);
  const r = matchedRun([{ gap: 0.2 }, { gap: 0.2 }]);
  assert.ok(r.flag); assert.equal(r.wins, 3.4);
  assert.ok(!matchedRun([{ gap: 0.05 }, { gap: -0.03 }]).flag);
});
