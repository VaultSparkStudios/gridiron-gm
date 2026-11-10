import { test } from "node:test";
import assert from "node:assert/strict";
import { playersOfWeek, statLine, potwLabel } from "../src/potw.js";

const teams = [{ c: "AFC", name: "Bills" }, { c: "AFC", name: "Jets" }, { c: "NFC", name: "Giants" }, { c: "NFC", name: "Eagles" }];
const games = [
  { h: 0, a: 1, hs: 31, as: 10, boxH: { q1: { name: "Josh Allen", pos: "QB", comp: 25, att: 33, passYds: 320, passTD: 4 }, e1: { name: "Greg Rousseau", pos: "DL", sacks: 3, tkl: 5 } }, boxA: { w1: { name: "Garrett Wilson", pos: "WR", rec: 9, recYds: 140, recTD: 1 } } },
  { h: 2, a: 3, hs: 17, as: 20, boxH: { c1: { name: "Kayvon Thibodeaux", pos: "DL", sacks: 1, tkl: 3 } }, boxA: { r1: { name: "Saquon Barkley", pos: "RB", rushYds: 180, rushTD: 2 }, s1: { name: "C.J. Gardner-Johnson", pos: "S", ints: 2, tkl: 6 } } },
];

test("the best offensive and defensive game in each conference", () => {
  const w = playersOfWeek(games, teams);
  assert.deepEqual(w.map((x) => [x.conf, x.side, x.name]), [["AFC", "O", "Josh Allen"], ["AFC", "D", "Greg Rousseau"], ["NFC", "O", "Saquon Barkley"], ["NFC", "D", "C.J. Gardner-Johnson"]]);
  assert.equal(w[0].pid, "q1");
  assert.equal(w[0].team, 0);
  assert.equal(potwLabel(w[1]), "AFC Defensive Player of the Week");
});

test("stat lines read like a box score", () => {
  assert.equal(statLine({ pos: "QB", comp: 25, att: 33, passYds: 320, passTD: 4 }), "25/33, 320 yds, 4 TD");
  assert.equal(statLine({ pos: "DL", sacks: 3, tkl: 5, ast: 1 }), "3 sacks, 6 tkl");
  assert.equal(statLine({ pos: "RB", rushYds: 180, rushTD: 2, rec: 2, recYds: 15 }), "180 rush yds, 2 TD, 2 rec, 15 yds");
});

test("no games, no awards", () => {
  assert.deepEqual(playersOfWeek([], teams), []);
});
