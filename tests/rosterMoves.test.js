import { test } from "node:test";
import assert from "node:assert/strict";
import { toPracticeSquad, fromPracticeSquad, releaseFromPracticeSquad, toInjuredReserve, fromInjuredReserve, releasePlayer } from "../src/rosterMoves.js";

const club = () => ({ roster: [{ id: "qb", name: "QB", salary: 45 }, { id: "fb", name: "FB", salary: 1 }, { id: "hurt", name: "H", salary: 3, injured: true, injRecWks: 6 }], ps: [], ir: [], deadCap: 0 });

test("a big contract can't be parked on the practice squad", () => {
  assert.match(toPracticeSquad(club(), "qb", { minSal: 1 }).error, /too big a contract/);
});

test("practice squad and back keeps his salary", () => {
  const t0 = club();
  const down = toPracticeSquad(t0, "fb", { minSal: 0.8 });
  assert.equal(down.team.ps[0].salary, 0);
  const up = fromPracticeSquad(down.team, "fb", { minSal: 0.8 });
  assert.equal(up.team.roster.find((p) => p.id === "fb").salary, 1);
  assert.equal(t0.ps.length, 0, "the club passed in isn't edited");
});

test("promotion respects the 53 and the cap", () => {
  const t = { roster: Array.from({ length: 53 }, (_, i) => ({ id: `p${i}` })), ps: [{ id: "x", name: "X", psSal: 1 }], ir: [] };
  assert.match(fromPracticeSquad(t, "x", { minSal: 1 }).error, /full/);
  const t2 = { roster: [], ps: [{ id: "x", name: "X", psSal: 5 }], ir: [] };
  assert.match(fromPracticeSquad(t2, "x", { minSal: 1, capRoom: 2 }).error, /cap/);
});

test("releasing from the practice squad hands the player back (for free agency)", () => {
  const t = { roster: [], ps: [{ id: "x", name: "X", psSal: 1 }], ir: [] };
  const r = releaseFromPracticeSquad(t, "x");
  assert.equal(r.player.id, "x");
  assert.equal(r.team.ps.length, 0);
});

test("IR: injured only, minimum stay before he's back", () => {
  assert.match(toInjuredReserve(club(), "fb", { wk: 6 }).error, /injured/);
  const r = toInjuredReserve(club(), "hurt", { wk: 6, rand: () => 0.9 });
  assert.equal(r.irType, "IR");
  assert.match(fromInjuredReserve(r.team, "hurt", { wk: 8 }).error, /minimum/);
  assert.ok(fromInjuredReserve(r.team, "hurt", { wk: 14 }).team.roster.some((p) => p.id === "hurt"));
});

test("a release charges his dead money", () => {
  const r = releasePlayer(club(), "qb", { dm: { now: 10, next: 4 } });
  assert.equal(r.team.deadCap, 10);
  assert.equal(r.team.deadNext, 4);
  assert.ok(!r.team.roster.some((p) => p.id === "qb"));
});
