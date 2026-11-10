import { test } from "node:test";
import assert from "node:assert/strict";
import { swapProblem, executeSwap, addedSalary } from "../src/tradeExec.js";

const P = (id, salary = 5) => ({ id, name: id, pos: "WR", salary, contract: 2 });
const league = () => [{ ab: "A", roster: [P("a1"), P("a2")] }, { ab: "B", roster: [P("b1", 20)] }, { ab: "C", roster: [P("c1")] }];
const picks = [{ id: "pk1", owner: 0, rd: 1 }, { id: "pk2", owner: 1, rd: 2 }];

test("a fair swap moves players and picks both ways, without touching the old league", () => {
  const t = league();
  const r = executeSwap(t, picks, [], { a: 0, b: 1, aPlayers: [t[0].roster[0]], bPlayers: [t[1].roster[0]], aPicks: [picks[0]] }, { yr: 2026, sp: "regular" });
  assert.deepEqual(r.teams[0].roster.map((p) => p.id).sort(), ["a2", "b1"]);
  assert.deepEqual(r.teams[1].roster.map((p) => p.id), ["a1"]);
  assert.equal(r.picks.find((p) => p.id === "pk1").owner, 1);
  assert.equal(t[0].roster.length, 2, "the old rosters are untouched");
  assert.equal(r.teams[2], t[2], "clubs not in the deal are the same objects");
});

test("a deal with a piece that has moved is refused", () => {
  const t = league();
  assert.match(swapProblem(t, picks, { a: 0, b: 1, aPlayers: [P("gone")], bPlayers: [t[1].roster[0]] }), /moved/);
  assert.match(swapProblem(t, picks, { a: 0, b: 1, aPlayers: [t[0].roster[0]], bPicks: [picks[0]] }), /pick/);
  assert.equal(swapProblem(t, picks, { a: 0, b: 1, aPlayers: [t[0].roster[0]], bPlayers: [t[1].roster[0]] }), null);
});

test("future picks change hands in the futures book", () => {
  const t = league();
  const fut = { id: "f", future: true, yr: 2028, rd: 1, orig: 1 };
  const r = executeSwap(t, picks, [], { a: 0, b: 1, aPlayers: [t[0].roster[0]], bPicks: [fut] });
  assert.equal(r.futures.find((x) => x.yr === 2028 && x.orig === 1).owner, 0);
});

test("salary taken on", () => assert.equal(addedSalary([P("x", 5)], [P("y", 20)]), 15));

import { executeLegs } from "../src/tradeExec.js";
test("a 3-way rotation moves each leg, and refuses if someone has moved", () => {
  const t = league();
  const r = executeLegs(t, [{ from: 0, to: 1, players: [t[0].roster[0]] }, { from: 1, to: 2, players: [t[1].roster[0]] }, { from: 2, to: 0, players: [t[2].roster[0]] }]);
  assert.ok(r.teams[0].roster.some((p) => p.id === "c1") && r.teams[1].roster.some((p) => p.id === "a1") && r.teams[2].roster.some((p) => p.id === "b1"));
  assert.match(executeLegs(t, [{ from: 0, to: 1, players: [P("nope")] }]).error, /moved/);
});
