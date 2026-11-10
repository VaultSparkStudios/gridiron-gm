import { test } from "node:test";
import assert from "node:assert/strict";
import { mentorOf, mentorGrowth, canApprentice, bumpAttrs, learningFrom } from "../src/mentor.js";

const vet = (o = {}) => ({ id: "v", name: "Vet", pos: "QB", age: 33, ovr: 82, posAttrs: { decisions: 80, pocketAwr: 89, readDef: 82 }, ss: { snp: 1700 }, ...o });
const rook = (o = {}) => ({ id: "r", name: "Rook", pos: "QB", age: 22, ovr: 68, draftYr: 2026, posAttrs: { decisions: 62, pocketAwr: 72, readDef: 20 }, ss: { snp: 40 }, ...o });

test("a young QB sitting behind a 30+ starter learns: processing and ceiling go up", () => {
  let pot = 0, dec = 0;
  for (let i = 0; i < 300; i++) { const m = mentorGrowth(rook(), [vet(), rook()], 2026); assert.ok(m); pot += m.pot; dec += m.attrs.decisions; assert.equal(m.mentor, "Vet"); }
  assert.ok(pot / 300 >= 1.5, "ceiling rises"); assert.ok(dec / 300 >= 2, "decisions rise");
});

test("no mentor: a young starter, a veteran under 30, a veteran who didn't start, or a QB past 25", () => {
  const r = [vet(), rook()];
  assert.equal(mentorGrowth(rook({ ss: { snp: 1500 } }), r, 2026, () => 0.99), null);
  assert.equal(mentorGrowth(rook(), [vet({ age: 28 }), rook()], 2026, () => 0.99), null);
  assert.equal(mentorGrowth(rook(), [vet({ ss: { snp: 200 } }), rook()], 2026, () => 0.99), null);
  assert.equal(canApprentice(rook({ age: 27 }), 2026), false);
  assert.equal(canApprentice(rook({ mentored: { yrs: 3 } }), 2026), false);
});

test("a raw rookie thrown in as the starter can pick up bad habits", () => {
  const m = mentorGrowth(rook({ ss: { snp: 1600 } }), [rook()], 2026, () => 0.01);
  assert.equal(m.pot, -1);
});

test("attribute bumps cap at 99; the badge names the veteran", () => {
  assert.deepEqual(bumpAttrs({ decisions: 98, x: 1 }, { decisions: 3 }), { decisions: 99, x: 1 });
  assert.equal(learningFrom(rook(), [vet(), rook()], 2026)?.name, "Vet");
});

test("QB Read Def: rebuilt from awareness, pocket and accuracy, and repaired in old saves", async () => {
  const { readDefOf, brokenReadDef, iqEdge } = await import("../src/qbiq.js");
  const { repairSave } = await import("../src/repair.js");
  assert.equal(readDefOf({ decisions: 99, pocketAwr: 97, accuracy: 98 }), 98);
  const old = { id: "q", pos: "QB", name: "Q", ovr: 78, posAttrs: { decisions: 79, pocketAwr: 81, accuracy: 88, readDef: 28 } };
  assert.ok(brokenReadDef(old.posAttrs));
  const d = { yr: 2026, teams: [{ roster: [old], ps: [], ir: [] }], dc: { 2027: [{ ...old, id: "x" }] } };
  repairSave(d);
  assert.equal(d.teams[0].roster[0].posAttrs.readDef, 81);
  assert.equal(d.dc[2027][0].posAttrs.readDef, 81);
  // an average starter's IQ reads about zero; a sharp one well above, a raw one well below
  assert.ok(Math.abs(iqEdge({ ovr: 85, posAttrs: { decisions: 82, readDef: 82, pocketAwr: 84 } })) < 1.5);
  assert.ok(iqEdge({ ovr: 95, posAttrs: { decisions: 98, readDef: 97, pocketAwr: 95 } }) > 10);
  assert.ok(iqEdge({ ovr: 70, posAttrs: { decisions: 60, readDef: 64, pocketAwr: 72 } }) < -12);
});
