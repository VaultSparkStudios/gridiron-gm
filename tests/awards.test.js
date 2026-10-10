import test from "node:test";
import assert from "node:assert/strict";
import { seasonAwardWinners } from "../src/awards.js";
import { SUPER_BOWLS, sbName, sbNumber } from "../src/data/superbowls.js";

test("season awards go to the best seasons", () => {
  const ss = (o) => ({ gp: 17, ...o });
  const teams = [
    { ab: "KC", w: 14, roster: [{ id: "qb1", name: "A", pos: "QB", ss: ss({ passYds: 4800, passTD: 38, passInt: 8 }) }, { id: "wr1", name: "B", pos: "WR", ss: ss({ rec: 120, recYds: 1700, recTD: 14 }) }] },
    { ab: "PIT", w: 6, roster: [{ id: "qb2", name: "C", pos: "QB", ss: ss({ passYds: 3900, passTD: 24, passInt: 12 }) }, { id: "dl1", name: "D", pos: "DL", ss: ss({ sacks: 19, tkl: 50 }) }, { id: "cb1", name: "E", pos: "CB", ss: ss({ ints: 5, tkl: 60 }) }] },
  ];
  const a = seasonAwardWinners(teams, 2026);
  assert.equal(a.mvp.pid, "qb1"); assert.equal(a.mvp.ti, 0); assert.equal(a.mvp.team, "KC");
  assert.equal(a.opoy.pid, "wr1");
  assert.equal(a.dpoy.pid, "dl1"); assert.match(a.dpoy.stat, /19 sacks/);
});

test("real Super Bowl history", () => {
  assert.equal(SUPER_BOWLS.length, 60);
  assert.equal(SUPER_BOWLS.filter((s) => s[2] === "KC").length, 4);
  assert.equal(SUPER_BOWLS.filter((s) => s[2] === "NE").length, 6);
  assert.equal(SUPER_BOWLS.filter((s) => s[2] === "PIT").length, 6);
  assert.equal(sbName(58), "Super Bowl LVIII"); assert.equal(sbName(50), "Super Bowl 50"); assert.equal(sbName(44), "Super Bowl XLIV");
  assert.equal(sbNumber(2026), 61);
});

test("rookie awards find this year's draft class", () => {
  const ss = (o) => ({ gp: 16, ...o });
  const teams = [{ ab: "NYG", w: 8, roster: [
    { id: "r1", name: "Drafted WR", pos: "WR", draftYr: 2026, draftPk: 5, ss: ss({ rec: 70, recYds: 900, recTD: 6 }) },
    { id: "r2", name: "Drafted LB", pos: "LB", draftYr: 2026, draftPk: 40, ss: ss({ tkl: 110, sacks: 4 }) },
    { id: "v", name: "Vet WR", pos: "WR", draftYr: 2026, draftPk: 0, ss: ss({ rec: 90, recYds: 1200 }) },
  ] }];
  const a = seasonAwardWinners(teams, 2027);
  assert.equal(a.oroy.pid, "r1");
  assert.equal(a.droy.pid, "r2");
  assert.notEqual(seasonAwardWinners(teams, 2028).oroy?.pid, "r1", "not a rookie a year later");
});
