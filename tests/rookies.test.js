import { test } from "node:test";
import assert from "node:assert/strict";
import { genDC } from "../src/league.js";
import { aiDraftScore } from "../src/scouting.js";

// Draft a few classes the way AI teams do and look at the rookies by round.
const styles = ["rebuilder", "win-now", "analytics"];
const ovr = {}, pot = {};
for (let y = 0; y < 6; y++) {
  const pool = [...genDC(2060 + y)];
  for (let i = 0; i < 224; i++) {
    pool.sort((a, b) => aiDraftScore(b, styles[i % 3]) - aiDraftScore(a, styles[i % 3]));
    const p = pool.shift(), r = Math.ceil((i + 1) / 32);
    (ovr[r] ||= []).push(p.trueOvr); (pot[r] ||= []).push(p.truePot);
  }
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

test("early-round rookies are close to league ready, like real rookies", () => {
  assert.ok(mean(ovr[1]) >= 73 && mean(ovr[1]) <= 81, `R1 ${mean(ovr[1])}`);
  assert.ok(mean(ovr[2]) >= 67 && mean(ovr[2]) <= 74, `R2 ${mean(ovr[2])}`);
  assert.ok(mean(ovr[3]) >= 65 && mean(ovr[3]) <= 72, `R3 ${mean(ovr[3])}`);
  assert.ok(mean(ovr[7]) < mean(ovr[3]) - 4, "late-rounders are depth");
});

test("ceilings stay where they were: still room to grow", () => {
  for (let r = 1; r <= 7; r++) assert.ok(mean(pot[r]) - mean(ovr[r]) >= 3, `R${r} gap ${mean(pot[r]) - mean(ovr[r])}`);
  assert.ok(mean(pot[1]) >= 84 && mean(pot[1]) <= 92, `R1 pot ${mean(pot[1])}`);
});

import { reshapeDC } from "../src/league.js";
test("old saves' draft classes are reshaped once, never lowering anyone", () => {
  const cls = genDC(2080).map((p) => ({ ...p, ovr: 60, trueOvr: 60, ovrV: undefined }));
  const dc = reshapeDC({ 2080: cls }, 2079, "regular", 0);
  assert.ok(dc[2080].every((p, i) => p.trueOvr >= 60 && p.ovrV === 2 && p.truePot === cls[i].truePot));
  assert.ok(mean(dc[2080].map((p) => p.trueOvr)) > 63);
  assert.strictEqual(reshapeDC(dc, 2079, "regular", 0)[2080], dc[2080]);
  assert.strictEqual(reshapeDC({ 2080: cls }, 2080, "draft", 5)[2080], cls);
});

import { seasonGrowth } from "../src/development.js";
test("a young player at his ceiling only creeps past it now and then", () => {
  let g = 0; for (let i = 0; i < 2000; i++) g += Math.max(0, seasonGrowth({ pos: "TE", age: 23, ovr: 75, pot: 75 }, 1));
  assert.ok(g / 2000 < 0.35, `${g / 2000} a year`);
});

test("an Elite class's can't-miss prospect goes near the top of the board", () => {
  const cls = genDC(2091, "Elite");
  // The boosted prospect: 90+ now with a 94+ ceiling (Elite classes can have several 99 ceilings).
  const top = cls.filter((p) => !p.gem && p.trueOvr >= 90 && p.truePot >= 94).sort((a, b) => a.cons.mid - b.cons.mid)[0];
  assert.ok(top, "a can't-miss prospect");
  assert.ok(top.cons.mid <= 12, `board #${top.cons.mid}`);
});
