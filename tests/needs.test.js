import test from "node:test";
import assert from "node:assert/strict";
import { teamNeeds, topNeeds, fillsNeed, needGroup } from "../src/needs.js";

let n = 0;
const pl = (pos, ovr, extra = {}) => ({ id: `n${n++}`, name: `${pos} ${n}`, pos, ovr, age: 26, contract: 3, ...extra });
// a solid club: every starter in his prime, signed, with a backup
const solid = () => [
  pl("QB", 85), pl("QB", 66), pl("RB", 82), pl("RB", 70), pl("WR", 84), pl("WR", 83), pl("WR", 82), pl("WR", 70), pl("TE", 82), pl("TE", 68),
  pl("LT", 84), pl("LT", 68), pl("LG", 82), pl("C", 82), pl("RG", 82), pl("RT", 82),
  pl("DL", 84, { mpos: "LEDG" }), pl("DL", 83, { mpos: "REDG" }), pl("DL", 70, { mpos: "REDG" }), pl("DL", 84, { mpos: "DT" }), pl("DL", 83, { mpos: "DT" }), pl("DL", 70, { mpos: "DT" }),
  pl("LB", 82), pl("LB", 82), pl("LB", 82), pl("LB", 68), pl("CB", 84), pl("CB", 83), pl("CB", 82), pl("CB", 70), pl("S", 83), pl("S", 82), pl("S", 68), pl("K", 85), pl("P", 82),
];

test("a solid club has no real needs", () => {
  assert.deepEqual(topNeeds(solid()), []);
});

test("edge rushers and interior tackles are separate needs", () => {
  const r = solid().map((p) => (p.mpos === "LEDG" || p.mpos === "REDG" ? { ...p, ovr: 58 } : p));
  const top = topNeeds(r);
  assert.equal(top[0], "EDGE");
  assert.ok(!top.includes("DT"));
  assert.ok(fillsNeed(top, { pos: "DL", mpos: "REDG" }));
  assert.ok(!fillsNeed(top, { pos: "DL", mpos: "DT" }));
  assert.equal(needGroup({ pos: "DL", mpos: "DT" }), "DT");
});

test("an aging or expiring starter makes a position a need, a young signed one doesn't", () => {
  const base = teamNeeds(solid()).score.CB;
  const old = teamNeeds(solid().map((p) => (p.pos === "CB" && p.ovr >= 82 ? { ...p, age: 33 } : p))).score.CB;
  const exp = teamNeeds(solid().map((p) => (p.pos === "CB" && p.ovr >= 82 ? { ...p, contract: 1 } : p))).score.CB;
  assert.ok(old > base + 0.1 && exp > base + 0.1, `${base} ${old} ${exp}`);
  const why = teamNeeds(solid().map((p) => (p.pos === "CB" && p.ovr === 84 ? { ...p, age: 33, contract: 1 } : p))).list.find((x) => x.pos === "CB").why.join(" ");
  assert.match(why, /is 33/);
  assert.match(why, /deal is up/);
});

test("quarterback: a real starter means no need; an old or leaving one does", () => {
  assert.ok(teamNeeds(solid()).score.QB <= 0.1);
  const old = solid().map((p) => (p.pos === "QB" && p.ovr === 85 ? { ...p, age: 37 } : p));
  assert.ok(teamNeeds(old).score.QB > 0.2);
});

test("a hurt starter out for the year counts now; no backup adds a little", () => {
  const hurt = solid().map((p) => (p.pos === "LT" && p.ovr === 84 ? { ...p, injured: true, injWk: 12 } : p));
  assert.ok(teamNeeds(hurt).score.LT > teamNeeds(solid()).score.LT + 0.2);
  const thin = solid().filter((p) => !(p.pos === "RB" && p.ovr === 70));
  assert.ok(teamNeeds(thin).score.RB > teamNeeds(solid()).score.RB);
  assert.ok(teamNeeds(thin).list.find((x) => x.pos === "RB").why.includes("no real backup"));
});
