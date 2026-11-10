import test from "node:test";
import assert from "node:assert/strict";
import { seasonHonors, bestLabel } from "../src/honors.js";
import { accoladesOf } from "../src/history.js";

// a linebacker field: one great every-down player with modest box-score numbers, one pass-rushing
// linebacker piling up sacks, and a field of ordinary starters
const lb = (id, ovr, ss) => ({ id, name: `LB ${id}`, pos: "LB", ovr, ss: { gp: 17, ...ss } });
const field = () => [
  lb("great", 99, { tkl: 110, sacks: 2, tfl: 8, rdG: 0.012 * 400, rdN: 400, prG: 0.004 * 300, prN: 300, cvG: 0, cvN: 40 }),
  lb("sacks", 84, { tkl: 70, sacks: 13, tfl: 14, rdG: -0.004 * 400, rdN: 400, prG: 0.006 * 500, prN: 500, cvG: -2, cvN: 40 }),
  ...Array.from({ length: 12 }, (_, i) => lb(`f${i}`, 74 + (i % 5), { tkl: 70 + i, sacks: 2 + (i % 3), tfl: 5, rdG: 0, rdN: 380, prG: 0, prN: 250, cvG: -4, cvN: 40 })),
];

test("the best linebacker is the one who played best, not the one with the most sacks", () => {
  const h = seasonHonors([{ ab: "AAA", c: "AFC", w: 9, roster: field() }]);
  const best = h.best.find((e) => e.slot === "LB");
  assert.equal(best.pid, "great");
  // the All-Pro ballot is still mostly numbers
  assert.ok(h.ap1.some((e) => e.pid === "sacks"));
  assert.equal(bestLabel("LB"), "Linebacker of the Year");
});

test("it is a career accolade with its own name and counts toward his legacy", () => {
  const p = { id: "great", name: "LB great", pos: "LB", honors: [{ yr: 2027, k: "best", slot: "LB" }, { yr: 2028, k: "best", slot: "LB" }] };
  const a = accoladesOf(p, {});
  const best = a.find((x) => x.k === "best");
  assert.equal(best.label, "Linebacker of the Year");
  assert.deepEqual(best.years, [2027, 2028]);
});

test("DPOY: the dominant rusher beats a near-equal sack total built on fumbles", async () => {
  const { seasonAwardWinners } = await import("../src/awards.js");
  const g = (pr) => ({ prG: pr * 650, prN: 650, rdG: 0.004 * 430, rdN: 430 });
  const carter = { id: "c", name: "Abdul Carter", pos: "DL", mpos: "LEDG", ovr: 99, ss: { gp: 17, sacks: 20.5, pres: 139, tkl: 72, tfl: 2, ff: 1, ...g(0.04) } };
  const hill = { id: "h", name: "Eli Hill", pos: "DL", mpos: "REDG", ovr: 83, ss: { gp: 17, sacks: 19, pres: 89, tkl: 64, tfl: 6, ff: 3, ...g(0.002) } };
  const w = seasonAwardWinners([{ ab: "NYG", w: 12, roster: [carter] }, { ab: "DET", w: 12, roster: [hill] }], 2037);
  assert.equal(w.dpoy.name, "Abdul Carter");
  assert.equal(w.dpoy.pos, "EDGE");
});
