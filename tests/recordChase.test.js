import { test } from "node:test";
import assert from "node:assert/strict";
import { recordChase } from "../src/milestoneWatch.js";

const book = { best: { recYds: { val: 1964, name: "Calvin Johnson" }, sacks: { val: 22.5, name: "Strahan" } }, franchise: { NYG: { recYds: { val: 1448, name: "Odell Beckham Jr." } } } };
const team = { ab: "NYG", name: "Giants", roster: [{ id: "n", name: "Malik Nabers", pos: "WR", ss: { recYds: 1400 } }, { id: "k", name: "Kayvon Thibodeaux", pos: "DL", ss: { sacks: 4 } }] };

test("a receiver closing on the club record shows what he needs today", () => {
  const r = recordChase(team, { n: { recYds: 7 } }, book);
  assert.equal(r.chase.length, 1);
  assert.deepEqual([r.chase[0].scope, r.chase[0].need, r.chase[0].holder], ["Giants", 42, "Odell Beckham Jr."]);
});

test("passing it in the game is a record", () => {
  const r = recordChase(team, { n: { recYds: 60 } }, book);
  assert.equal(r.hit[0]?.scope, "Giants");
  assert.equal(r.chase.length, 0);
});

test("nowhere near: nothing to show", () => {
  assert.deepEqual(recordChase(team, {}, { best: {}, franchise: {} }), { chase: [], hit: [] });
});
