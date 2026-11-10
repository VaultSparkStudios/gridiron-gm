import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { initTeams, genSched } from "../src/league.js";
import { applyLiveSeason, normName } from "../src/liveStart.js";

const live = JSON.parse(fs.readFileSync(new URL("../src/data/live2026.json", import.meta.url)));

test("names match across suffixes and punctuation", () => {
  assert.equal(normName("Montorie Foster Jr."), normName("Montorie Foster Jr"));
  assert.equal(normName("AJ Barner"), normName("A.J. Barner"));
});

test("a live start fills in every played week with the real results", () => {
  const teams = initTeams(0), sched = genSched(teams, null, 2026, null);
  const r = applyLiveSeason(teams, sched, live);
  assert.equal(r.wk, live.throughWeek);
  const real = live.games.length;
  assert.equal(r.games, real, "every real game lines up with a scheduled game");
  const played = sched.filter((g) => g.played);
  assert.equal(played.length, real);
  assert.ok(played.every((g) => g.wk <= live.throughWeek + 1), "only the week in progress can be partly played");
  const wins = teams.reduce((s, t) => s + t.w, 0), losses = teams.reduce((s, t) => s + t.l, 0);
  assert.equal(wins, losses);
  assert.ok(r.players > 1000, `stats matched for ${r.players} players`);
});
