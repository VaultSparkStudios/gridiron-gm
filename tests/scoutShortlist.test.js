import test from "node:test";
import assert from "node:assert/strict";
import { newScouting, rankClass, csRank, combineInvites, runCombine, interviewProspect, scoutsShortlist } from "../src/scouting.js";

const POS = ["QB", "RB", "WR", "TE", "LT", "DL", "LB", "CB", "S"];
let n = 0;
const prospect = () => {
  n++;
  const ovr = 55 + (n % 25);
  return { id: `s${n}`, name: `Prospect ${n}`, pos: POS[n % POS.length], age: 21, ovr, pot: ovr + 8, trueOvr: ovr, truePot: ovr + 8, spd: 70, posAttrs: { a1: ovr, a2: ovr, a3: ovr, a4: ovr }, bio: { college: "Alabama" }, scoutLvl: 0, cs: {} };
};
function combineClass() {
  const cls = rankClass(Array.from({ length: 240 }, prospect));
  const inv = combineInvites(cls);
  for (const p of cls) p.combine = inv.has(p.id) ? { fortyYd: 4.5, bench: 20, vert: 34, broad: 120, threeCone: 6.9, shuttle: 4.2 } : null;
  const { sc } = runCombine(newScouting(2026), cls, { quiet: true });
  return { sc, cls };
}

test("the shortlist sticks to prospects who could be there at your picks", () => {
  const { sc, cls } = combineClass();
  const list = scoutsShortlist(sc, cls, [28, 60]);
  assert.ok(list.length >= 4);
  for (const x of list) {
    const r = csRank(x.p);
    assert.ok(x.slot === 28 ? r >= 20 && r <= 42 : r >= 48 && r <= 84, `${x.p.name} at #${r} for pick ${x.slot}`);
    assert.ok(x.why.length && x.why[0].includes(`#${x.slot}`));
  }
  assert.ok(!list.some((x) => csRank(x.p) <= 10), "no top-10 names for a late first-rounder");
  assert.equal(new Set(list.map((x) => x.p.id)).size, list.length);
});

test("your needs come first, and the list follows your pick", () => {
  const { sc, cls } = combineClass();
  const list = scoutsShortlist(sc, cls, [3], { isNeed: (p) => p.pos === "CB" });
  const cbs = cls.filter((p) => p.pos === "CB" && csRank(p) <= 17);
  if (cbs.length) assert.equal(list[0].p.pos, "CB");
  assert.ok(list.every((x) => csRank(x.p) <= 17));
  assert.ok(list.some((x) => x.why.some((w) => w.includes("need"))) || !cbs.length);
});

test("someone already interviewed and fully read drops off; no picks means no list", () => {
  const { sc, cls } = combineClass();
  const first = scoutsShortlist(sc, cls, [28])[0];
  const r = interviewProspect(sc, "combine", first.p);
  const i = cls.findIndex((p) => p.id === first.p.id);
  cls[i] = { ...r.p, scout: { ...r.p.scout, lvl: 3 }, scoutLvl: 3 };
  const again = scoutsShortlist(r.sc, cls, [28]);
  const still = again.find((x) => x.p.id === first.p.id);
  assert.ok(!still || (!still.interview));
  assert.deepEqual(scoutsShortlist(sc, cls, []), []);
});

test("the scouts favor players they grade well, drop ones they don't, and chase red flags before a 1st", () => {
  const { sc, cls } = combineClass();
  const range = cls.filter((p) => csRank(p) >= 20 && csRank(p) <= 42);
  // a scouted range: every report says ~75 potential...
  for (const p of range) p.scout = { lvl: 1, eOvr: 68, ePot: 75, sd: 3 };
  const [star, dud, flagged] = [range[10], range[2], range[16]];
  star.scout = { lvl: 1, eOvr: 72, ePot: 88, sd: 3 }; // ...but they love this one
  dud.scout = { lvl: 1, eOvr: 60, ePot: 64, sd: 3 }; // ...and don't think much of this one
  flagged.scout = { lvl: 1, eOvr: 68, ePot: 76, sd: 3, notes: { flag: "Character concerns" } };
  const list = scoutsShortlist(sc, cls, [28]);
  const ids = list.map((x) => x.p.id);
  assert.ok(ids.includes(star.id), "the player they grade highest makes the list");
  assert.ok(list.find((x) => x.p.id === star.id).why.some((w) => w.includes("rate him above")));
  assert.ok(!ids.includes(dud.id), "a player they grade well below the range is left off");
  const f = list.find((x) => x.p.id === flagged.id);
  assert.ok(f && f.why.some((w) => w.includes("red flag") && w.includes("1st")));
});
