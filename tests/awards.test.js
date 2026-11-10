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

test("pass rushers win Defensive Player of the Year over tackle piles; a receiver beats the second-best QB for Offensive", () => {
  const P = (id, pos, ss) => ({ id, name: id, pos, ss: { gp: 17, ...ss } });
  const teams = [{ ab: "A", w: 12, roster: [
    P("qb1", "QB", { passYds: 5100, passTD: 42, passInt: 8 }),
    P("qb2", "QB", { passYds: 4800, passTD: 36, passInt: 10 }),
    P("wr", "WR", { rec: 115, recYds: 1620, recTD: 12 }),
    P("lb", "LB", { tkl: 158, sacks: 6, tfl: 14, pd: 5, ints: 1 }),
    P("edge", "DL", { tkl: 48, sacks: 16, tfl: 18, ff: 3 }),
  ] }];
  const a = seasonAwardWinners(teams, 2030);
  assert.equal(a.mvp.pid, "qb1");
  assert.equal(a.opoy.pid, "wr");
  assert.equal(a.dpoy.pid, "edge");
});

test("Comeback Player and Coach of the Year", async () => {
  const { seasonAwardWinners } = await import("../src/awards.js");
  const P = (id, pos, ss, sh) => ({ id, name: id, pos, ss: { gp: 16, ...ss }, sh });
  const teams = [
    { ab: "AAA", w: 13, l: 4, lw: 4, coach: { hc: { id: "c1", name: "Turnaround Coach" } }, roster: [P("qb1", "QB", { passYds: 5000, passTD: 40 }), P("back", "WR", { rec: 90, recYds: 1300, recTD: 9 }, [{ y: 2029, gp: 4 }])] },
    { ab: "BBB", w: 14, l: 3, lw: 14, coach: { hc: { id: "c2", name: "Steady Coach" } }, roster: [P("wr2", "WR", { rec: 100, recYds: 1500, recTD: 12 }, [{ y: 2029, gp: 17 }])] },
  ];
  const a = seasonAwardWinners(teams, 2030);
  assert.equal(a.cpoy?.name, "back", "missed most of last season, big one now");
  assert.equal(a.coy?.name, "Turnaround Coach", "13 wins, up from 4, beats 14 wins with no jump");
  assert.match(a.coy.stat, /13-4, up from 4 wins/);
});

test("award races rank the contenders the way the awards do", async () => {
  const { awardRaces, seasonAwardWinners } = await import("../src/awards.js");
  const P = (id, pos, ss) => ({ id, name: id, pos, ss: { gp: 9, ...ss } });
  const teams = [{ ab: "A", w: 8, roster: [P("q1", "QB", { passYds: 2600, passTD: 22 }), P("e1", "DL", { sacks: 10 }), P("e2", "DL", { sacks: 6 })] }, { ab: "B", w: 2, roster: [P("q2", "QB", { passYds: 2500, passTD: 18 })] }];
  const r = awardRaces(teams, 2030, 2);
  assert.deepEqual(r.mvp.map((x) => x.name), ["q1", "q2"]);
  assert.deepEqual(r.dpoy.map((x) => x.name), ["e1", "e2"]);
  assert.equal(r.mvp[0].name, seasonAwardWinners(teams, 2030).mvp.name);
});
