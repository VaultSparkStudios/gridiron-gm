import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyOf, retireEntry, careerLeaders, HOF_LINE } from "../src/history.js";

test("an established great retires into the Hall of Fame; a journeyman doesn't", () => {
  const rodgers = { id: "ar", name: "Aaron Rodgers", pos: "QB", age: 43, ovr: 76, peak: 79, draftYr: 2005, draftPk: 0, cs: { passYds: 3600, passTD: 24 } };
  const e = retireEntry(rodgers, { ab: "PIT" }, 2026, { awards: [] });
  assert.ok(e.hof, `legacy ${e.legacy}`);
  assert.equal(e.hofClass, 2031);
  const journeyman = { id: "j", name: "Joe Backup", pos: "LB", age: 33, ovr: 70, peak: 74, draftYr: 2018, draftPk: 0, cs: { tkl: 300 } };
  assert.equal(retireEntry(journeyman, { ab: "NYJ" }, 2027, {}), null, "not notable enough to keep");
});

test("a league star earns it on his own: seasons at his peak, stats and awards", () => {
  const star = { id: "s", name: "New Star", pos: "WR", age: 34, ovr: 84, peak: 96, draftYr: 2026, draftPk: 3, cs: { rec: 1100, recYds: 15000, recTD: 110 } };
  const awards = [{ yr: 2030, opoy: { pid: "s" } }, { yr: 2031, mvp: { pid: "s" } }];
  const L = legacyOf(star, { awards, yr: 2038 });
  assert.ok(L.legacy >= HOF_LINE, `legacy ${L.legacy}`);
  assert.deepEqual(L.won, { opoy: [2030], mvp: [2031] });
});

test("career leaders combine active players (with this season) and retired ones", () => {
  const teams = [{ ab: "DET", roster: [{ id: "a", name: "Active", pos: "RB", cs: { rushYds: 5000 }, ss: { rushYds: 800 } }] }];
  const retired = [{ id: "r", name: "Old Back", pos: "RB", team: "BAL", retYr: 2028, career: { rushYds: 6000 } }];
  const L = careerLeaders(teams, retired, "rushYds");
  assert.deepEqual(L.map((x) => [x.name, x.v]), [["Old Back", 6000], ["Active", 5800]]);
});
