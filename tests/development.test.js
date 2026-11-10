import test from "node:test";
import assert from "node:assert/strict";
import { focusChance, perSeason, runFocusWeeks, seasonGrowth, seasonSnapShare, seasonAwards, awardGrowth, driftCorrection, isLandslide, LEADERS, agingEnd, hitsTheWall, topEndNudge } from "../src/development.js";
import { retireAge } from "../src/retirement.js";
import { leagueShift } from "../src/offseason.js";

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
  assert.ok(aw.c.landslides.length && !aw.c.hits.length); // only receiver: far ahead, no milestone
  const young = awardGrowth(teams[0].roster[0], aw.a, "normal");
  assert.equal(young.ovr, 1); assert.equal(young.dev, "star");
  const vet = awardGrowth({ age: 31 }, { hits: ["10 sacks"], leads: ["led the NFL in sacks (11)"] }, "normal");
  assert.equal(vet.ovr, 2); assert.equal(vet.dev, null);
  assert.deepEqual(awardGrowth({}, undefined, "normal"), { ovr: 0, boost: 0, pot: 0, dev: null, notes: [] });
});

test("leading the league by a landslide makes a cornerstone", () => {
  const ints = LEADERS.find((l) => l.key === "ints"), rush = LEADERS.find((l) => l.key === "rushYds");
  assert.ok(isLandslide(ints, 11, 7)); assert.ok(!isLandslide(ints, 8, 7));
  assert.ok(isLandslide(rush, 1900, 1550)); assert.ok(!isLandslide(rush, 1600, 1450));
  const teams = [{ roster: [
    { id: "cb", pos: "CB", age: 27, ss: { ints: 11 } },
    { id: "s", pos: "S", age: 25, ss: { ints: 7 } },
    { id: "rb", pos: "RB", age: 23, ss: { rushYds: 1600 } },
    { id: "rb2", pos: "RB", age: 26, ss: { rushYds: 1480 } },
  ] }];
  const aw = seasonAwards(teams);
  assert.equal(aw.cb.landslides.length, 1); assert.ok(aw.cb.landslides[0].includes("by a landslide"));
  assert.equal(aw.rb.leads.length, 1); assert.ok(!aw.rb.landslides.length); // a close lead is an ordinary one
  // a 27-year-old still gets the trait (an ordinary lead stops at 26), a bigger ceiling and +3
  const cb = awardGrowth(teams[0].roster[0], aw.cb, "star");
  assert.equal(cb.dev, "superstar"); assert.equal(cb.boost, 3); assert.equal(cb.pot, 4);
  // a Superstar already: another point instead of a trait
  const top = awardGrowth({ age: 25 }, aw.cb, "superstar");
  assert.equal(top.dev, null); assert.equal(top.boost, 4);
  // past 29: the points, no trait
  assert.equal(awardGrowth({ age: 31 }, aw.cb, "normal").dev, null);
});

test("growth leans against league drift; earned boosts don't", () => {
  const seq = (xs) => { let i = 0; return () => xs[i++ % xs.length]; };
  assert.equal(driftCorrection(3, 0), 3);
  assert.equal(driftCorrection(-2, 4, seq([0])), -3); // well above 2026: a little more decline
  assert.equal(driftCorrection(-2, 4, seq([0.99])), -2);
  assert.equal(driftCorrection(3, 3, seq([0])), 0); // a league well above 2026: growth lost
  assert.equal(driftCorrection(3, 3, seq([0.99])), 3);
  assert.equal(driftCorrection(0, -3, seq([0])), 1); // below 2026: a point back
  assert.equal(driftCorrection(0, 0.1, seq([0])), 0); // inside the noise: nothing
  // the league's shift by position, against the real 2026 starters
  const roster = Array.from({ length: 40 }, (_, i) => ({ pos: "QB", ovr: 88 }));
  assert.equal(leagueShift([{ roster }]).QB, 4.4);
});

test("players age by position: backs decline first, quarterbacks and kickers last", () => {
  const at = (pos, age) => avg(() => seasonGrowth({ pos, age, ovr: 85, pot: 85, dev: "normal" }, 1));
  assert.ok(at("RB", 29) < -1.5, `RB at 29: ${at("RB", 29)}`);
  assert.ok(at("QB", 29) > -0.5, `QB at 29: ${at("QB", 29)}`);
  assert.ok(at("WR", 31) < at("LT", 31), "receivers fade before tackles");
  assert.ok(at("QB", 34) > at("RB", 34) + 2);
  assert.ok(at("K", 35) > -0.5, "kickers kick into their late 30s");
});

test("the wall at 33: most players fall off, the great ones and quarterbacks don't", () => {
  const at = (pos, age, dev, ovr = 85) => avg(() => seasonGrowth({ pos, age, ovr, pot: ovr, dev }, 1));
  // a Star receiver going into his age-33 season falls hard; a year earlier much less
  assert.ok(at("WR", 32, "star") < -4.5, `WR 33: ${at("WR", 32, "star")}`);
  assert.ok(at("WR", 32, "star") < at("WR", 31, "star") - 2);
  // a superstar and a generational talent at the same age hold on
  assert.ok(at("WR", 32, "superstar") > at("WR", 32, "star") + 3);
  // a superstar meets a softer wall a year later; a generational talent never does
  assert.ok(at("S", 34, "superstar") < at("S", 34, "generational") - 1);
  assert.ok(at("WR", 32, "generational") > at("WR", 32, "superstar"));
  assert.ok(at("DL", 33, "generational") > -2, "an Aaron Donald plays on");
  // quarterbacks and kickers skip the wall; so does a high-quality lineman, but not an average one
  assert.ok(at("QB", 33, "normal") > -1);
  assert.ok(at("LT", 33, "normal", 88) > at("LT", 33, "normal", 78) + 2);
  assert.ok(hitsTheWall({ pos: "CB", ovr: 90, dev: "star" }));
  assert.ok(!hitsTheWall({ pos: "CB", ovr: 90, dev: "superstar" }));
  // a longer prime and a later retirement
  assert.equal(agingEnd({ pos: "RB", dev: "generational" }) - agingEnd({ pos: "RB", dev: "star" }), 3);
  assert.ok(retireAge({ pos: "WR", dev: "generational" }) > retireAge({ pos: "WR", dev: "superstar" }));
  assert.equal(retireAge({ pos: "WR", dev: "star" }), retireAge({ pos: "WR", dev: "normal" }));
});

test("the top end holds steady: a thin league nudges young stars up, a full one doesn't", () => {
  const always = () => 0, never = () => 0.99;
  assert.equal(topEndNudge(25, 92, 28, always), 93, "short of 95s: +1");
  assert.equal(topEndNudge(25, 92, 40, always), 92, "at the 2026 count: nothing");
  assert.equal(topEndNudge(25, 92, 28, never), 92, "only now and then");
  assert.equal(topEndNudge(31, 92, 10, always), 92, "not for veterans");
  assert.equal(topEndNudge(25, 84, 10, always), 84, "only near the top");
  assert.equal(topEndNudge(25, 99, 10, always), 99, "never past 99");
});

test("a rising young star climbs past 93 more easily than a veteran", async () => {
  const { eliteTaper } = await import("../src/development.js");
  const seq = (xs) => { let i = 0; return () => xs[i++ % xs.length]; };
  // every roll 0.7: a veteran doesn't make it to 93 (60%), a rising player goes all the way (80% from 93)
  assert.equal(eliteTaper(92, 96, seq([0.7])), 92);
  assert.equal(eliteTaper(92, 96, seq([0.7]), true), 96);
  assert.equal(eliteTaper(80, 88, seq([0.99]), true), 88, "below 90 nothing is tapered");
});

test("a league short of 99s lets a young 96-98 take the last step more often", () => {
  assert.equal(topEndNudge(26, 97, 40, () => 0.2, 2), 98, "two 99s: 40% chance");
  assert.equal(topEndNudge(26, 97, 40, () => 0.2, 7), 97, "enough 99s: nothing");
  assert.equal(topEndNudge(31, 97, 40, () => 0, 0), 97, "not for veterans");
  assert.equal(topEndNudge(26, 94, 40, () => 0, 0), 94, "only from 96 up");
});
