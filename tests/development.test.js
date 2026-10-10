import test from "node:test";
import assert from "node:assert/strict";
import { focusChance, perSeason, runFocusWeeks, seasonGrowth, seasonSnapShare, seasonAwards, awardGrowth } from "../src/development.js";

const player = (o) => ({ id: "p" + Math.random(), pos: "DL", age: 22, ovr: 80, pot: 90, dev: "superstar", ...o });

test("young, high-trait players gain fastest; veterans slowly", () => {
  const kid = player({});
  assert.ok(focusChance(player({ dev: "generational" })) > focusChance(kid));
  assert.ok(focusChance(kid) > focusChance(player({ dev: "normal" })));
  assert.ok(focusChance(kid) > focusChance(player({ age: 31 })));
  assert.ok(perSeason(kid) >= 2.5 && perSeason(kid) <= 5, `young superstar ~${perSeason(kid)}/season`);
  assert.ok(perSeason(player({ age: 31, dev: "normal" })) < 1);
});

test("only the focused players gain, and never past 99", () => {
  const off = player({ pos: "QB", ovr: 98, pot: 99, dev: "generational" });
  const def = player();
  const other = player();
  let total = 0;
  for (let i = 0; i < 40; i++) total += runFocusWeeks([off, def, other], { off: off.id, def: def.id }, 17).length;
  assert.ok(total > 0);
  assert.equal(other.ovr, 80);
  assert.ok(off.ovr <= 99);
  assert.ok(def.pot >= def.ovr);
  assert.ok(def.labGains > 0);
});

test("injured or missing players don't train", () => {
  const p = player({ injured: true });
  assert.deepEqual(runFocusWeeks([p], { off: p.id, def: "gone" }, 17), []);
  assert.equal(p.ovr, 80);
});

const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };
const avg = (f, n = 4000) => { let s = 0; for (let i = 0; i < n; i++) s += f(); return s / n; };

test("young players who play develop faster than the same player on the bench", () => {
  const p = { age: 22, ovr: 70, pot: 86 };
  const starter = avg(() => seasonGrowth(p, 1)), bench = avg(() => seasonGrowth(p, 0));
  assert.ok(starter > bench + 2, `starter ${starter} vs bench ${bench}`);
});

test("snap share counts the team's games", () => {
  assert.equal(seasonSnapShare({ ss: { snp: 1700 } }), 1);
  assert.equal(seasonSnapShare({ ss: { snp: 850 } }), 0.5);
  assert.equal(seasonSnapShare({ ss: {} }), 0);
});

test("milestones and league leads pay off", () => {
  const teams = [{ roster: [
    { id: "a", pos: "DL", age: 24, ss: { sacks: 14 } },
    { id: "b", pos: "DL", age: 31, ss: { sacks: 11 } },
    { id: "c", pos: "WR", age: 25, ss: { recYds: 900 } },
  ] }];
  const aw = seasonAwards(teams);
  assert.deepEqual(aw.a.hits, ["10 sacks"]);
  assert.ok(aw.a.leads[0].includes("sacks"));
  assert.ok(aw.c.leads.length && !aw.c.hits.length); // only receiver: leads but no milestone
  const young = awardGrowth(teams[0].roster[0], aw.a, "normal");
  assert.equal(young.ovr, 1); assert.equal(young.dev, "star");
  const vet = awardGrowth({ age: 31 }, { hits: ["10 sacks"], leads: ["led the NFL in sacks (11)"] }, "normal");
  assert.equal(vet.ovr, 2); assert.equal(vet.dev, null);
  assert.deepEqual(awardGrowth({}, undefined, "normal"), { ovr: 0, dev: null, notes: [] });
});

test("players age by position: backs decline first, quarterbacks and kickers last", () => {
  const at = (pos, age) => avg(() => seasonGrowth({ pos, age, ovr: 85, pot: 85 }, 1));
  assert.ok(at("RB", 29) < -1.5, `RB at 29: ${at("RB", 29)}`);
  assert.ok(at("QB", 29) > -0.5, `QB at 29: ${at("QB", 29)}`);
  assert.ok(at("WR", 31) < at("LT", 31), "receivers fade before tackles");
  assert.ok(at("QB", 34) > at("RB", 34) + 2);
  assert.ok(at("K", 35) > -0.5, "kickers kick into their late 30s");
});
