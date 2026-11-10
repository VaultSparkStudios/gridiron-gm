import { test } from "node:test";
import assert from "node:assert/strict";
import { raceWatch, eliminated } from "../src/race.js";

// 16 conference clubs (AFC), 4 per division, plus 16 NFC clubs who don't matter here.
const mk = (w, l, i) => ({ c: i < 16 ? "AFC" : "NFC", d: ["East", "North", "South", "West"][Math.floor((i % 16) / 4)], name: `T${i}`, w, l });

test("a win clinches when it puts you out of everyone's reach", () => {
  const teams = Array.from({ length: 32 }, (_, i) => mk(6, 9, i));
  teams[0] = mk(12, 3, 0); teams[1] = mk(10, 5, 1); // you and your closest division rival, 2 weeks left
  const sched = [{ wk: 16, h: 0, a: 20 }, { wk: 16, h: 1, a: 21 }, { wk: 17, h: 0, a: 22 }, { wk: 17, h: 1, a: 23 }].map((g) => ({ ...g, played: false }));
  const r = raceWatch(teams, sched, 0, 16);
  assert.ok(r.lines.some((l) => /clinch the No. 1 seed with a win\./.test(l)), r.lines.join(" | "));
});

test("a win plus a rival's loss clinches", () => {
  const teams = Array.from({ length: 32 }, (_, i) => mk(4, 11, i));
  teams[0] = mk(11, 4, 0); teams[1] = mk(10, 5, 1);
  const sched = [{ wk: 16, h: 0, a: 20 }, { wk: 16, h: 1, a: 2 }, { wk: 17, h: 0, a: 22 }, { wk: 17, h: 1, a: 23 }].map((g) => ({ ...g, played: false }));
  const r = raceWatch(teams, sched, 0, 16);
  assert.ok(r.lines.some((l) => /with a win and a T1 loss/.test(l)), r.lines.join(" | "));
  assert.equal(r.games[0]?.root, 2, "root for whoever plays your rival");
});

test("out of it", () => {
  const teams = Array.from({ length: 32 }, (_, i) => mk(11, 4, i));
  teams[0] = mk(3, 12, 0);
  const sched = [{ wk: 16, h: 0, a: 20, played: false }, { wk: 17, h: 0, a: 21, played: false }];
  assert.ok(eliminated(teams, sched, 0));
  assert.ok(raceWatch(teams, sched, 0, 16).out);
  assert.equal(raceWatch(teams, sched, 0, 8), null, "too early to say");
});
