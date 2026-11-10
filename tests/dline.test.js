import { test } from "node:test";
import assert from "node:assert/strict";
import { dlOvrAt, arrangeDL, naturalDL, dlAsPlayed, dlOrder } from "../src/dline.js";
// The depth chart's DL order (depthOrderFor), without snaps.
const depthOrderFor = (ps, d, _pos) => dlOrder(ps, d.DL || [], ps, null);

const edge = (id, ovr) => ({ id, name: id, pos: "DL", mpos: "LEDG", ovr, wt: 255, spd: 86, str: 76, posAttrs: { passRush: ovr, runStop: ovr - 12, handUse: ovr - 4, motor: ovr, getOff: ovr + 3, bullRush: ovr - 10, swim: ovr, spin: ovr } });
const tackle = (id, ovr) => ({ id, name: id, pos: "DL", mpos: "DT", ovr, wt: 325, spd: 68, str: 94, posAttrs: { passRush: ovr - 12, runStop: ovr + 3, handUse: ovr - 2, motor: ovr - 4, getOff: ovr - 14, bullRush: ovr, swim: ovr - 18, spin: ovr - 20 } });

test("linemen rate best where they're built to play", () => {
  const e = edge("e", 88), t = tackle("t", 88);
  assert.equal(naturalDL(e), "EDGE"); assert.equal(naturalDL(t), "DT");
  assert.equal(dlOvrAt(e, "EDGE"), 88); assert.equal(dlOvrAt(t, "DT"), 88);
  assert.ok(dlOvrAt(e, "DT") < 88 - 3, `edge inside: ${dlOvrAt(e, "DT")}`);
  assert.ok(dlOvrAt(t, "EDGE") < 88 - 3, `tackle outside: ${dlOvrAt(t, "EDGE")}`);
  assert.equal(naturalDL({ pos: "DL", wt: 310 }), "DT", "old saves: weight decides");
});

test("the default line puts edges outside and tackles inside", () => {
  const ps = [tackle("t1", 92), tackle("t2", 85), tackle("t3", 84), edge("e1", 90), edge("e2", 80), edge("e3", 70)];
  const o = arrangeDL(ps).map((p) => p.id);
  assert.deepEqual(o.slice(0, 4), ["e1", "t1", "t2", "e2"]);
  const played = dlAsPlayed(arrangeDL(ps));
  assert.equal(played[0].dlKind, "EDGE"); assert.equal(played[1].dlKind, "DT");
  // Through the depth chart, with no line set by hand.
  assert.deepEqual(depthOrderFor(ps, {}, "DL").slice(0, 4).map((p) => p.id), ["e1", "t1", "t2", "e2"]);
});

test("a line you set keeps your spots; an injured starter's spot goes to the best fit", () => {
  const ps = [tackle("t1", 92), tackle("t2", 85), tackle("t3", 84), edge("e1", 90), edge("e2", 80), edge("e3", 78)];
  const mine = { DL: ["t3", "t1", "t2", "e1"] }; // a tackle at left edge, by choice
  assert.deepEqual(depthOrderFor(ps, mine, "DL").slice(0, 4).map((p) => p.id), ["t3", "t1", "t2", "e1"]);
  const healthy = ps.filter((p) => p.id !== "e1");
  assert.equal(depthOrderFor(healthy, mine, "DL")[3].id, "e2", "the best edge left fills RE");
});
