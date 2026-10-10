import { test } from "node:test";
import assert from "node:assert/strict";
import { coachingCarousel, ownerReview, jobOffers } from "../src/carousel.js";

const coach = (role, rating, name) => ({ id: name, name, role, rating, scheme: role === "OC" ? "West Coast" : "4-3", contract: 2 });
const league = () => Array.from({ length: 12 }, (_, i) => ({ city: `City${i}`, name: `Team${i}`, ab: `T${i}`, coach: { oc: coach("OC", 70, `oc${i}`), dc: coach("DC", 70, `dc${i}`), st: coach("ST", 70, `st${i}`) } }));
const perf = () => Array.from({ length: 12 }, (_, i) => ({ w: 12 - i, l: 5 + i - 0, pf: 450 - i * 20, pa: 300 + i * 15 }));

test("struggling clubs fire the coordinator whose side let them down; every job gets filled", () => {
  let fired = 0;
  for (let s = 1; s < 40; s++) {
    let x = s; const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    const teams = league(); teams[11].coach.dc = null; // an expired contract
    const r = coachingCarousel(teams, perf(), 0, { rand });
    assert.ok(teams.every((t) => t.coach.oc && t.coach.dc && t.coach.st), "no empty jobs");
    assert.ok(r.moves.some((m) => m.ti === 11 && m.role === "dc" && m.kind === "hired"), "the vacancy is filled");
    assert.ok(!r.moves.some((m) => m.ti === 0), "your staff is yours");
    assert.ok(!r.moves.some((m) => m.kind === "fired" && m.ti < 4), "winning clubs don't fire anyone");
    fired += r.moves.filter((m) => m.kind === "fired").length;
  }
  assert.ok(fired > 10, `firings happen (${fired})`);
});

test("owner patience: winning builds it, losing seasons drain it to an ultimatum and a firing", () => {
  assert.equal(ownerReview(70, { w: 13, l: 4 }, { madePlayoffs: true }).verdict, "fine");
  assert.ok(ownerReview(70, { w: 13, l: 4 }, { madePlayoffs: true, champion: true }).patience > 95);
  let p = 70, v;
  for (const w of [5, 4, 3]) ({ patience: p, verdict: v } = ownerReview(p, { w, l: 17 - w }));
  assert.equal(v, "fired");
  const u = ownerReview(40, { w: 6, l: 11 });
  assert.equal(u.verdict, "ultimatum");
  const teams = [{ w: 10, l: 7 }, { w: 2, l: 15 }, { w: 3, l: 14 }, { w: 9, l: 8 }];
  assert.deepEqual(jobOffers(teams, 0, 2), [1, 2]);
});

test("with firing turned off the owner grumbles but never fires you", async () => {
  const { ownerReview } = await import("../src/carousel.js");
  let pat = 40;
  for (let i = 0; i < 4; i++) { const r = ownerReview(pat, { w: 2, l: 15 }, { noFire: true }); assert.ok(!["fired", "ultimatum"].includes(r.verdict)); pat = r.patience; }
  assert.equal(ownerReview(8, { w: 2, l: 15 }).verdict, "fired");
});
