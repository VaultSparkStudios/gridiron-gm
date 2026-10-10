import { test } from "node:test";
import assert from "node:assert/strict";
import { moveDB, canMoveDB } from "../src/positions.js";

const benford = { id: "cb", name: "Christian Benford", pos: "CB", mpos: "CB", ovr: 80, pot: 82, age: 25, spd: 90, posAttrs: { manCov: 77, zoneCov: 81, press: 86, ballSkills: 75, tackling: 74, recovery: 89, footwork: 82, playRec: 83 } };
const bishop = { id: "s", name: "Cole Bishop", pos: "S", mpos: "FS", ovr: 79, pot: 84, age: 23, spd: 86, posAttrs: { range: 91, runSupport: 74, coverage: 80, tackling: 70, ballHawk: 66, blitzing: 53, comms: 79, versatility: 73 } };

test("a corner moves to safety with safety skills and a re-figured rating", () => {
  const s = moveDB(benford);
  assert.equal(s.pos, "S"); assert.equal(s.mpos, "FS");
  assert.deepEqual(Object.keys(s.posAttrs).sort(), Object.keys(bishop.posAttrs).sort());
  assert.ok(Math.abs(s.ovr - benford.ovr) <= 6, `80 CB -> ${s.ovr} S`);
  assert.ok(s.pot >= s.ovr);
});

test("a slow safety loses more moving to corner than a fast one", () => {
  const slow = moveDB({ ...bishop, spd: 80 }), fast = moveDB({ ...bishop, spd: 93 });
  assert.equal(slow.pos, "CB");
  assert.ok(slow.ovr < fast.ovr);
});

test("moving back restores the original position, skills and rating", () => {
  const back = moveDB(moveDB(benford));
  assert.equal(back.pos, "CB"); assert.equal(back.mpos, "CB");
  assert.deepEqual(back.posAttrs, benford.posAttrs);
  assert.equal(back.ovr, benford.ovr); assert.equal(back.pot, benford.pot);
  assert.equal(back.posFrom, undefined);
  assert.equal(canMoveDB({ pos: "LB" }), false);
  assert.equal(moveDB({ pos: "WR", ovr: 70 }).pos, "WR");
});

test("offensive line: guards at tackle lose more than tackles at guard; moving back restores", async () => {
  const { moveOL, movePlayer } = await import("../src/positions.js");
  const attrs = (o) => ({ passBlock: o, footwork: o, anchor: o, awareness: o, handUse: o, reach: o + 4, agility: o - 15, toughness: o + 5, runBlock: o, pulling: o - 8, strength: o + 6, drive: o, snapping: o, leadership: o, athleticism: o - 12, power: o });
  const tackle = { id: "t", name: "T", pos: "LT", ovr: 85, pot: 88, agi: 66, posAttrs: attrs(85) };
  const guard = { id: "g", name: "G", pos: "LG", ovr: 85, pot: 88, agi: 60, posAttrs: attrs(85) };
  const tg = moveOL(tackle, "RG"), gt = moveOL(guard, "LT");
  assert.equal(tg.pos, "RG"); assert.equal(gt.pos, "LT");
  assert.ok(85 - gt.ovr > 85 - tg.ovr, `guard at tackle ${gt.ovr} vs tackle at guard ${tg.ovr}`);
  assert.ok(tg.ovr <= 85 && gt.ovr <= 85);
  const back = moveOL(moveOL(guard, "LT"), "RG");
  assert.equal(back.ovr, 85); assert.equal(back.pos, "RG"); assert.equal(back.posFrom, undefined);
  assert.equal(moveOL(tackle, "RT").ovr, 85, "left/right is free");
  assert.equal(movePlayer({ pos: "CB", ovr: 80, posAttrs: {} }, "S").pos, "S");
  assert.equal(movePlayer({ pos: "WR", ovr: 80 }, "LT").pos, "WR", "no WR at tackle");
});

test("edge rushers and linebackers can swap, and moving back restores the rating", async () => {
  const { movePlayer, moveOptions, canMoveFront } = await import("../src/positions.js");
  const edge = { id: 1, pos: "DL", mpos: "REDG", ovr: 90, pot: 92, spd: 84, wt: 255, posAttrs: { passRush: 92, runStop: 85, handUse: 88, motor: 90, getOff: 91, bullRush: 86, swim: 88, spin: 84 } };
  const dt = { id: 2, pos: "DL", mpos: "DT", ovr: 88, wt: 310, posAttrs: { passRush: 85, runStop: 90 } };
  const lb = { id: 3, pos: "LB", mpos: "MIKE", ovr: 88, pot: 88, spd: 86, wt: 238, posAttrs: { tackling: 90, coverage: 80, blitzing: 70, runFit: 88, instincts: 90, pursuit: 90, shedBlock: 78, zoneAwr: 82 } };
  assert.ok(canMoveFront(edge) && canMoveFront(lb) && !canMoveFront(dt), "interior tackles stay inside");
  assert.deepEqual(moveOptions(dt), []);
  const olb = movePlayer(edge, "LB");
  assert.equal(olb.pos, "LB"); assert.equal(olb.mpos, "SAM");
  assert.ok(olb.ovr < edge.ovr && olb.ovr >= edge.ovr - 15, `${olb.ovr}`);
  assert.ok(olb.posAttrs.blitzing >= 85, "his pass rush becomes blitzing");
  assert.equal(movePlayer(olb, "DL").ovr, edge.ovr);
  const rusher = movePlayer(lb, "DL");
  assert.equal(rusher.pos, "DL"); assert.ok(rusher.ovr < lb.ovr);
  assert.equal(movePlayer(rusher, "LB").ovr, lb.ovr);
});
