import { test } from "node:test";
import assert from "node:assert/strict";
import { recapEntry, gradePicks, classGrades, devCounts } from "../src/draftRecap.js";

const pick = (overall, owner, pot, dev) => ({ rd: Math.ceil(overall / 32), overall, owner, player: { id: overall, name: `P${overall}`, pos: "WR", age: 22, trueOvr: pot - 10, truePot: pot, dev } });

test("every pick gets a verdict from his trait and his ceiling against where he went", () => {
  const log = [pick(1, 0, 70, "normal"), pick(2, 1, 90, "superstar"), pick(3, 0, 85, "star"), pick(100, 1, 88, "normal")];
  for (let i = 4; i < 100; i++) log.push(pick(i, i % 4, 75, "normal"));
  const rows = gradePicks(log.map(recapEntry));
  const v = Object.fromEntries(rows.map((r) => [r.overall, r.verdict]));
  assert.equal(v[2], "jackpot");
  assert.equal(v[3], "hit");
  assert.equal(v[1], "miss"); // the top pick with the class's lowest ceiling
  assert.equal(v[100], "value"); // a ceiling near the top of the class at pick 100
  assert.equal(rows[0].overall, 1);
  const g = classGrades(rows, 4);
  assert.equal(g[1].hits, 1);
  assert.ok(g.every((t) => t.grade && t.rank));
  assert.equal(devCounts(rows).superstar, 1);
});

test("dev traits are revealed even for players drafted without a scouted trait", () => {
  const e = recapEntry({ rd: 1, overall: 5, owner: 2, player: { id: "abc", name: "X", pos: "QB", trueOvr: 70, truePot: 80 } });
  assert.ok(["generational", "superstar", "star", "normal", "late"].includes(e.dev));
});

import { genDC } from "../src/league.js";
import { aiDraftScore, prospectRead, publicPot } from "../src/scouting.js";

test("every class has a few hidden gems the board undervalues", () => {
  let late = 0, total = 0;
  for (let y = 0; y < 6; y++) {
    const cls = genDC(2040 + y);
    const gems = cls.filter((p) => p.gem);
    assert.ok(gems.length >= 4 && gems.length <= 6, `${gems.length} gems`);
    for (const p of gems) {
      assert.ok(p.truePot >= 82 && publicPot(p) < p.truePot);
      assert.ok(["star", "superstar", "generational", "late"].includes(p.dev));
      assert.ok(p.cons.mid > 72, "the board has him as a mid/late-rounder");
    }
    const pool = [...cls];
    for (let i = 0; i < 224; i++) { pool.sort((a, b) => aiDraftScore(b, "analytics") - aiDraftScore(a, "analytics")); const p = pool.shift(); if (p.gem) { total++; if (i >= 96) late++; } }
    total += pool.filter((p) => p.gem).length; late += pool.filter((p) => p.gem).length;
  }
  assert.ok(late / total > 0.4, `${late}/${total} gems lasted past round 3`);
});

const GROUP = (pos) => ({ QB: "QB", RB: "RB", WR: "REC", TE: "REC", DL: "DL", LB: "LB", CB: "DB", S: "DB", LT: "OL", LG: "OL", C: "OL", RG: "OL", RT: "OL" }[pos]);

test("one average scout has only the public read of a gem", () => {
  const gem = genDC(2050).find((p) => p.gem);
  const sc = { major: { id: "m", name: "Scout", group: GROUP(gem.pos), eval: 70 } };
  const read = prospectRead(sc, gem);
  assert.ok(Math.abs(read.potV - publicPot(gem)) < 7); // his read's noise is capped at 1.6 sd (~6)
  assert.ok(!read.sleeper);
});

test("a deep, sharp crew on one group flags its sleepers and special traits early", () => {
  const crew = (g) => ({ major: { id: "a", name: "A", group: g, eval: 90 }, major2: { id: "b", name: "B", group: g, eval: 88 }, minor: { id: "c", name: "C", group: g, eval: 85 }, minor2: { id: "d", name: "D", group: g, eval: 84 } });
  let gems = 0, flagged = 0, close = 0, special = 0, spotted = 0, wrongDev = 0;
  for (let y = 0; y < 12; y++) {
    for (const p of genDC(2070 + y)) {
      const g = GROUP(p.pos); if (!g) continue;
      const read = prospectRead(crew(g), p);
      if (p.gem) { gems++; if (read.sleeper) flagged++; if (Math.abs(read.potV - p.truePot) <= 5) close++; }
      if (["generational", "superstar"].includes(p.dev)) { special++; if (read.dev === p.dev) spotted++; }
      if (read.dev && read.dev !== p.dev) wrongDev++;
    }
  }
  assert.ok(flagged / gems > 0.6, `${flagged}/${gems} sleepers flagged`);
  assert.ok(close / gems > 0.7, `${close}/${gems} gems read close to their real ceiling`);
  assert.ok(spotted / special > 0.6, `${spotted}/${special} special traits spotted early`);
  assert.equal(wrongDev, 0);
  // A single scout on the group never sees traits without a workup.
  const one = { major: { id: "a", name: "A", group: "DB", eval: 95 } };
  const db = genDC(2090).filter((p) => GROUP(p.pos) === "DB");
  assert.ok(db.every((p) => !prospectRead(one, p).devEarly));
});

import { plantBusts, bustGap, interviewProspect } from "../src/scouting.js";
test("every class has a few red-flag prospects the board loves", () => {
  let n = 0, early = 0, flagged = 0;
  for (let y = 0; y < 6; y++) {
    const cls = genDC(2400 + y);
    const busts = cls.filter((p) => p.bust);
    assert.ok(busts.length >= 3 && busts.length <= 5, `${busts.length} busts`);
    for (const p of busts) {
      n++;
      assert.ok(bustGap(p) >= 8 && publicPot(p) > p.truePot);
      if (p.cons.mid <= 70) early++;
      // a report always red-flags him
      const rep = prospectRead({}, { ...p, scout: { lvl: 1, eOvr: p.trueOvr, ePot: p.truePot, notes: { flag: "🚩" } } });
      if (rep.flag) flagged++;
    }
    assert.ok(cls.every((p) => !(p.bust && p.gem)));
  }
  assert.equal(early, n);
  assert.equal(flagged, n);
});

test("a Combine interview exposes a character red flag", () => {
  const cls = genDC(2450);
  const p = { ...cls.find((x) => x.bust) || cls[0], bust: { gap: 10, why: "Character concerns", kind: "character" }, combine: {} };
  const r = interviewProspect({ interviewsLeft: 2 }, "combine", p);
  assert.ok(r.ok && r.p.scout.intv.flag);
});
