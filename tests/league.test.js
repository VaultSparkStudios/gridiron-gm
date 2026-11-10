import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, simGame, capSpace, setInjuries, injuriesEnabled, setUserLineup, tickInjuries } from "../src/league.js";

const plan = { off: "balanced", def: "balanced" };

test("the league starts with 32 real teams and full rosters", () => {
  const teams = initTeams(0);
  assert.equal(teams.length, 32);
  assert.ok(teams.every((t) => t.roster.length >= 50 && t.roster.length <= 53));
  assert.ok(teams.every((t) => Number.isFinite(capSpace(t))));
});

test("a simulated game has whole-number scores and box scores for both teams", () => {
  const teams = initTeams(0);
  setUserLineup({}, {});
  for (let i = 0; i < 20; i++) {
    const r = simGame(teams[i % 32], teams[(i + 7) % 32], plan, plan);
    assert.ok(Number.isInteger(r.hsc) && Number.isInteger(r.asc) && r.hsc >= 0 && r.asc >= 0);
    assert.ok(Object.keys(r.boxH).length > 5 && Object.keys(r.boxA).length > 5);
  }
});

test("the injuries switch: off means nobody gets hurt", () => {
  setInjuries(false);
  assert.equal(injuriesEnabled(), false);
  const teams = initTeams(0);
  for (let i = 0; i < 40; i++) simGame(teams[i % 32], teams[(i + 5) % 32], plan, plan);
  assert.equal(teams.flatMap((t) => t.roster).filter((p) => p.injured).length, 0);
  setInjuries(true);
  for (let i = 0; i < 80; i++) simGame(teams[i % 32], teams[(i + 5) % 32], plan, plan);
  assert.ok(teams.flatMap((t) => t.roster).some((p) => p.injured), "with injuries on, someone gets hurt");
  tickInjuries(teams, 1, 0);
});
