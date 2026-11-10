import test from "node:test";
import assert from "node:assert/strict";
import { winProb, summarize, topPerformers } from "../src/gameday.js";
import { simGame, initTeams } from "../src/league.js";

test("win probability behaves", () => {
  assert.ok(Math.abs(winProb(0, 3600, null, 25, 0) - 0.5) < 0.01);
  assert.ok(winProb(14, 120, "h", 50) > 0.97);
  assert.ok(winProb(-14, 120, "h", 50) < 0.03);
  assert.equal(winProb(3, 0, null, 0), 1);
  assert.ok(winProb(0, 1800, "h", 80) > winProb(0, 1800, "a", 80));
});

test("a recorded game summarizes into a chart, drives, key plays and top performers", () => {
  const teams = initTeams(0);
  const r = simGame(teams[0], teams[1], null, null, null, { rec: true });
  assert.ok(r.game?.pl?.length > 80);
  const gd = summarize(r.game, { h: r.hsc, a: r.asc }, { h: r.boxH, a: r.boxA });
  assert.ok(gd.wp.length >= 70 && gd.wp.length < 120, String(gd.wp.length));
  const fin = gd.wp[gd.wp.length - 1];
  assert.equal(fin, r.hsc > r.asc ? 100 : r.hsc < r.asc ? 0 : 50);
  assert.ok(gd.drives.length >= 12);
  assert.ok(gd.drives.every((d) => d.res && d.res !== "Live"));
  assert.ok(gd.keys.length >= 1 && gd.keys.length <= 5);
  assert.equal(gd.top.length, 3);
  assert.ok(JSON.stringify(gd).length < 8000); // small enough to keep on every one of your games
  assert.equal(simGame(teams[2], teams[3], null, null, null, {}).game, undefined); // others aren't recorded
});

test("top performers rank the biggest lines", () => {
  const top = topPerformers({ h: { 1: { name: "QB", pos: "QB", att: 30, comp: 22, passYds: 350, passTD: 4 } }, a: { 2: { name: "LB", pos: "LB", tkl: 5 } } });
  assert.equal(top[0].name, "QB");
});
