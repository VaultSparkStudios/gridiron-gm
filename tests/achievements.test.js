import test from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, newAchievements } from "../src/achievements.js";

test("achievements come from the career, the seasons and the titles, each earned once", () => {
  const career = { w: 13, l: 4, seasons: 2, playoffs: 1, allPro: 0, hof: 0, score: 100, recordCount: 0 };
  const seasons = [{ yr: 2026, w: 5, l: 12 }, { yr: 2027, w: 13, l: 4 }];
  const got = newAchievements({ career, seasons, titles: [2027] });
  for (const id of ["first-win", "winning", "twelve", "turnaround", "playoffs", "champ"]) assert.ok(got.includes(id), id);
  for (const id of ["perfect", "repeat", "dynasty", "decade", "hundred", "allpro", "hof", "record", "greats"]) assert.ok(!got.includes(id), id);
  const earned = Object.fromEntries(got.map((id) => [id, 2027]));
  assert.deepEqual(newAchievements({ career, seasons, titles: [2027] }, earned), []);
  assert.ok(newAchievements({ career, seasons, titles: [2027, 2028] }, earned).includes("repeat"));
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});
