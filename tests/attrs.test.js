import { test } from "node:test";
import assert from "node:assert/strict";
import { genPAttrs, growAttrs, combToPhys, genCombine } from "../src/league.js";

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

test("generated players' skills have their position's shape, not a flat row near the overall", () => {
  const rbs = Array.from({ length: 200 }, () => genPAttrs("RB", 80));
  assert.ok(mean(rbs.map((a) => a.vision)) - mean(rbs.map((a) => a.passBlock)) > 15, "a back sees holes better than he pass-blocks");
  const qbs = Array.from({ length: 200 }, () => genPAttrs("QB", 80));
  assert.ok(mean(qbs.map((a) => a.armStr)) > 82, "a quarterback's arm sits above his overall");
});

test("combine numbers give real-player speed and strength", () => {
  const cbs = Array.from({ length: 300 }, () => combToPhys(genCombine("CB", 70)));
  const ol = Array.from({ length: 300 }, () => combToPhys(genCombine("LT", 70)));
  assert.ok(mean(cbs.map((p) => p.spd)) > 87, "corners are fast");
  assert.ok(mean(ol.map((p) => p.str)) > 82 && mean(ol.map((p) => p.str)) < 92, "tackles are strong, not maxed out");
  assert.ok(mean(ol.map((p) => p.spd)) < 76);
});

test("skills move with the overall, and speed fades with age", () => {
  const p = { pos: "RB", spd: 92, acc: 91, agi: 88, posAttrs: { vision: 80, burst: 85 } };
  const up = growAttrs(p, 4, 23);
  assert.ok(up.posAttrs.vision >= 83 && up.posAttrs.vision <= 85);
  assert.ok(up.spd >= 92, "a young back doesn't slow down");
  const old = Array.from({ length: 50 }, () => growAttrs(p, 0, 33).spd);
  assert.ok(mean(old) < 90, "a 33-year-old back loses a step");
});
