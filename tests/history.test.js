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

test("a retired great keeps his card: ratings, his last season as a line, no contract", async () => {
  const { cardOf, retiredCard } = await import("../src/history.js");
  const p = { id: 7, name: "X", pos: "WR", age: 34, ovr: 80, salary: 20, contract: 1, sh: [{ y: 2030, tm: "NYG", gp: 17, recYds: 1200 }], oh: [{ y: 2030, o: 84 }], ss: { gp: 16, recYds: 900, rec: 60 }, gl: [{}], spd: 88 };
  const c = cardOf(p, { ab: "NYG" }, 2031);
  assert.equal(c.ss, undefined); assert.equal(c.gl, undefined); assert.equal(c.salary, 0);
  assert.deepEqual(c.sh.map((x) => [x.y, x.recYds]), [[2030, 1200], [2031, 900]]);
  assert.equal(c.oh.at(-1).o, 80); assert.equal(c.spd, 88); assert.equal(c.retiredYr, 2031);
  // an older entry without a card still opens one
  const old = retiredCard({ id: 1, name: "Y", pos: "QB", peak: 91, retYr: 2029, team: "KC", career: { passYds: 40000 } });
  assert.equal(old.ovr, 91); assert.equal(old.career.passYds, 40000);
});

test("a long career that never reached greatness stays out of Canton", () => {
  const steady = { id: "w", name: "Steady Receiver", pos: "WR", age: 34, ovr: 78, peak: 83, draftYr: 2026, draftPk: 40, cs: { rec: 1000, recYds: 13000, recTD: 80 } };
  const e = retireEntry(steady, { ab: "IND" }, 2038, {});
  assert.ok(e && e.legacy >= HOF_LINE, `a big legacy (${e?.legacy}), the kind that used to get in`);
  assert.equal(e.hof, false);
});

test("every retired player in the books keeps his full card, and a free agent's last club is named", () => {
  const teams = [{ ab: "BUF" }, { ab: "PIT" }];
  const star = { id: 501, name: "Vet Star", pos: "DL", age: 37, ovr: 88, spd: 70, sh: [], cs: { sacks: 120, gp: 220 }, formerTeam: 1 };
  const e = retireEntry(star, null, 2027, { teams, startOvr: 95 });
  assert.ok(e, "a 120-sack career is notable");
  assert.equal(e.team, "PIT", "the club index becomes its abbreviation");
  assert.equal(e.card?.spd, 70, "his ratings are kept");
  assert.equal(e.card.retiredFrom, "PIT");
  const never = retireEntry({ ...star, id: 502, formerTeam: undefined }, null, 2027, { teams, startOvr: 95 });
  assert.equal(never.team, "FA");
});

test("a retiring great takes his trophies (counted), honors and franchise ranks with him", async () => {
  const { careerHaul } = await import("../src/history.js");
  const p = { id: 77, name: "Test Gunslinger", pos: "QB", sh: [2027, 2028, 2029, 2030].map((y) => ({ y, tm: "NYG", gp: 17, passYds: 30000 })), honors: [{ k: "ap1", yr: 2028 }, { k: "ap1", yr: 2029 }, { k: "pb", yr: 2029 }] };
  const teams = [{ ab: "NYG", name: "Giants", roster: [] }];
  const champs = [2027, 2028, 2029, 2030].map((yr) => ({ yr, ti: 0 }));
  const awards = [{ yr: 2028, mvp: { pid: 77 } }, { yr: 2029, mvp: { pid: 77 } }];
  const h = careerHaul(p, ["NYG"], { awards, champs, teams, retired: [], yr: 2030 });
  assert.deepEqual(h.trophies, [{ k: "sb", n: 4 }, { k: "mvp", n: 2 }]);
  assert.ok(h.honors.some((x) => /All-Pro/.test(x.label) && x.n === 2));
  assert.equal(h.ranks[0].key, "passYds");
  assert.equal(h.ranks[0].rank, 1);
});
