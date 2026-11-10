import test from "node:test";
import assert from "node:assert/strict";
import { weeklyStories } from "../src/stories.js";

const team = (i, c, w, l, streak = 0) => ({ city: `City${i}`, name: `Team${i}`, ab: `T${i}`, c, w, l, t: 0, pf: 200, pa: 180, streak });

test("weekly stories: your game first, then upsets and big games", () => {
  const teams = [team(0, "AFC", 3, 2), team(1, "AFC", 1, 4), team(2, "NFC", 5, 0, 5), team(3, "NFC", 4, 1)];
  const sched = [
    { wk: 5, h: 0, a: 3, played: true, hs: 27, as: 24, boxH: { q: { name: "Joe Passer", pos: "QB", comp: 30, att: 40, passYds: 410, passTD: 4 } }, boxA: {} },
    { wk: 5, h: 2, a: 1, played: true, hs: 13, as: 17, boxH: {}, boxA: { r: { name: "Sam Rusher", pos: "DL", sacks: 4 } } },
  ];
  // Team 1 (1-4 after the win, 0-4 before) beats unbeaten team 2: an upset.
  const s = weeklyStories({ teams, sched, wk: 5, ui: 0, yr: 2026 });
  assert.ok(s[0].mine && /Team0 win in Week 5/.test(s[0].head));
  assert.ok(s.some((x) => x.kind === "upset" && x.team === 1));
  assert.ok(s.some((x) => x.kind === "performance" && /Joe Passer/.test(x.head)));
  assert.ok(s.some((x) => x.kind === "performance" && /Sam Rusher/.test(x.head)));
  assert.ok(s.length <= 6 && new Set(s.map((x) => x.id)).size === s.length);
});
