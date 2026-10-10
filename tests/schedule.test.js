import test from "node:test";
import assert from "node:assert/strict";
import { nflSchedule, divisionPlaces, nflByes } from "../src/schedule.js";

const DIVS = ["East", "North", "South", "West"];
const teams = [];
for (const c of ["AFC", "NFC"]) for (const d of DIVS) for (let i = 0; i < 4; i++) teams.push({ id: teams.length, c, d, w: 0, l: 0, pf: 0, pa: 0, str: Math.random() });
const place = divisionPlaces(teams, (t) => t.str);
const sameDiv = (a, b) => teams[a].c === teams[b].c && teams[a].d === teams[b].d;

for (const year of [2026, 2027, 2028, 2029]) {
  test(`${year}: real NFL formula, 17 games, one bye, no back-to-back`, () => {
    const t0 = Date.now();
    const { games, byes } = nflSchedule(teams, year, place);
    const ms = Date.now() - t0;
    assert.ok(ms < 3000, `took ${ms}ms`);
    for (const t of teams) {
      const mine = games.filter((g) => g.h === t.id || g.a === t.id).sort((a, b) => a.wk - b.wk);
      assert.equal(mine.length, 17, "17 games");
      const home = mine.filter((g) => g.h === t.id).length;
      assert.ok(home === 8 || home === 9, `home games ${home}`);
      const weeks = mine.map((g) => g.wk);
      assert.equal(new Set(weeks).size, 17, "one game a week");
      const bye = [...Array(18)].map((_, i) => i + 1).find((w) => !weeks.includes(w));
      assert.equal(bye, byes[t.id]);
      assert.ok(bye >= 5 && bye <= 14, `bye week ${bye}`);
      const opp = (g) => (g.h === t.id ? g.a : g.h);
      const div = mine.filter((g) => sameDiv(g.h, g.a));
      assert.equal(div.length, 6, "6 division games");
      for (const o of new Set(div.map(opp))) {
        const two = div.filter((g) => opp(g) === o);
        assert.equal(two.length, 2);
        assert.ok(two.some((g) => g.h === t.id) && two.some((g) => g.a === t.id), "home and away vs rivals");
        assert.ok(Math.abs(two[0].wk - two[1].wk) >= 3, "division rematch spread out");
      }
      assert.ok(sameDiv(t.id, opp(mine.find((g) => g.wk === 18))), "week 18 is a division game");
      for (let i = 1; i < mine.length; i++) if (mine[i].wk === mine[i - 1].wk + 1) assert.notEqual(opp(mine[i]), opp(mine[i - 1]), "no back-to-back opponent");
      const nonDiv = mine.filter((g) => !sameDiv(g.h, g.a));
      assert.equal(new Set(nonDiv.map(opp)).size, 11, "11 different non-division opponents");
      assert.equal(nonDiv.filter((g) => teams[opp(g)].c !== t.c).length, 5, "5 games vs the other conference");
    }
  });
}

test("three straight home or road games are kept down", () => {
  let runs = 0;
  for (const y of [2026, 2027]) {
    const { games } = nflSchedule(teams, y, place);
    for (const t of teams) {
      const m = games.filter((g) => g.h === t.id || g.a === t.id).sort((a, b) => a.wk - b.wk);
      for (let i = 2; i < m.length; i++) if (m[i].wk - m[i - 2].wk === 2 && (m.slice(i - 2, i + 1).every((g) => g.h === t.id) || m.slice(i - 2, i + 1).every((g) => g.a === t.id))) runs++;
    }
  }
  assert.ok(runs <= 100, `${runs} three-game home/road runs across 64 team-seasons (random placement gives ~190)`);
});

test("divisions rotate between years", () => {
  const opps = (y) => new Set(nflSchedule(teams, y, place).games.filter((g) => g.h === 0 || g.a === 0).map((g) => (g.h === 0 ? g.a : g.h)));
  const a = opps(2026), b = opps(2027);
  assert.ok([...a].filter((x) => b.has(x)).length < 10, "different opponents next year");
});

test("byes: weeks 5-14, everyone has one", () => {
  const b = nflByes(teams.map((t) => t.id));
  assert.equal(Object.keys(b).length, 32);
  for (let w = 5; w <= 14; w++) assert.equal(Object.values(b).filter((x) => x === w).length % 2, 0);
});
