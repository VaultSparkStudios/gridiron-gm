import { test } from "node:test";
import assert from "node:assert/strict";
import { retRating, returnerOrder } from "../src/special.js";
import { depthOrderFor } from "../src/depth.js";
import { makeSide, createGame, playGame } from "../src/playsim.js";

test("real returners carry their Madden kick return rating", () => {
  assert.equal(retRating({ name: "KaVontae Turpin", pos: "WR", ovr: 80 }), 95);
  assert.equal(retRating({ name: "Marcus Jones", pos: "CB", ovr: 82 }), 94);
  assert.ok(retRating({ name: "Lane Johnson", pos: "RT", ovr: 90 }) < 30);
});

test("draft prospects are rated from their athleticism (plus a knack of their own)", () => {
  const avg = (f) => { let s = 0; for (let i = 0; i < 300; i++) s += retRating(f(i)); return s / 300; };
  const fast = avg((i) => ({ id: `f${i}`, name: `F${i}`, pos: "WR", spd: 95, acc: 94, agi: 90 }));
  const slow = avg((i) => ({ id: `s${i}`, name: `S${i}`, pos: "WR", spd: 84, acc: 83, agi: 80 }));
  assert.ok(fast > slow + 10, `${fast} vs ${slow}`);
  assert.equal(retRating({ id: "x", name: "X", pos: "LT", spd: 95, acc: 95, agi: 95 }), 15);
});

test("returners: your pick first, else the best, sparing stars", () => {
  const roster = [
    { id: 1, name: "Star", pos: "WR", ovr: 92, kr: 86 },
    { id: 2, name: "Backup", pos: "WR", ovr: 66, kr: 84 },
    { id: 3, name: "Corner", pos: "CB", ovr: 75, kr: 70 },
    { id: 4, name: "Guard", pos: "LG", ovr: 80, kr: 99 },
  ];
  assert.equal(returnerOrder(roster, {}, "KR")[0].name, "Backup");
  assert.equal(depthOrderFor(roster, { KR: [3] }, "KR")[0].name, "Corner");
  assert.ok(!returnerOrder(roster, {}, "PR").some((p) => p.pos === "LG"));
});

test("a great returner gains more on returns than a poor one", () => {
  const roster = (kr) => [{ id: `q${kr}`, name: "QB", pos: "QB", ovr: 80 }, { id: `r${kr}`, name: `R${kr}`, pos: "WR", ovr: 70, kr }, { id: `k${kr}`, name: "K", pos: "K", ovr: 75 }];
  const side = (kr) => { const ros = roster(kr); return makeSide({ team: { roster: ros }, order: (pos) => depthOrderFor(ros, {}, pos), snaps: Object.fromEntries(ros.map((p) => [p.id, 100])), season: 2026 }); };
  const tally = (kr) => { let y = 0, n = 0; for (let i = 0; i < 300; i++) { const g = playGame(createGame(side(kr), side(80))); const l = g.box.h[`r${kr}`] || {}; y += (l.krYds || 0) + (l.prYds || 0); n += (l.kr || 0) + (l.pr || 0); } return y / n; };
  const good = tally(95), bad = tally(55);
  assert.ok(good > bad + 4, `${good} vs ${bad}`);
});

import { initTeams, initialFA, addPunters } from "../src/league.js";

test("every club starts with its real punter, rosters stay at 53", () => {
  const teams = initTeams(0);
  assert.ok(teams.every((t) => t.roster.filter((p) => p.pos === "P").length === 1));
  assert.ok(teams.every((t) => t.roster.length <= 53));
  assert.equal(teams.find((t) => t.ab === "SEA").roster.find((p) => p.pos === "P").name, "Michael Dickson");
  const fa = initialFA();
  assert.ok(fa.some((p) => p.pos === "P"));
  assert.ok(fa.length > 51);
});

test("older saves get their punters", () => {
  const teams = initTeams(3).map((t) => ({ ...t, roster: t.roster.filter((p) => p.pos !== "P") }));
  const d = { yr: 2028, ui: 3, teams, fa: [] };
  addPunters(d);
  assert.ok(d.teams.every((t, i) => i === 3 || t.roster.some((p) => p.pos === "P")));
  assert.ok(d.teams.every((t, i) => i === 3 || t.roster.length <= 53));
  const mine = d.teams[3].roster.some((p) => p.pos === "P") || d.fa.some((p) => p.pos === "P" && p.formerTeam === 3);
  assert.ok(mine);
  assert.equal(d.teams.find((t) => t.ab === "SEA").roster.find((p) => p.pos === "P").age, 32);
  const again = d.teams.map((t) => t.roster.length);
  addPunters(d);
  assert.deepEqual(d.teams.map((t) => t.roster.length), again);
});
