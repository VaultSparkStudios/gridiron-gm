import { test } from "node:test";
import assert from "node:assert/strict";
import { leagueDrama, offFieldWeek, serveSuspensions, isFictional } from "../src/drama.js";
import { initTeams, genDC } from "../src/league.js";

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const league = () => {
  const teams = initTeams(0);
  // a few generated players on every club (drafted rookies)
  const dc = genDC(2027);
  teams.forEach((t, i) => t.roster.push(...dc.slice(i * 5, i * 5 + 5).map((p) => ({ ...p, ovr: Math.max(p.ovr, 66) }))));
  return teams;
};

test("off-field incidents only ever involve generated players, never real people", () => {
  const teams = league();
  for (let wk = 1; wk <= 400; wk++) offFieldWeek({ teams, sched: [], wk: (wk % 17) + 1, ui: 0, yr: 2026 + Math.floor(wk / 17), rand });
  const hit = teams.flatMap((t) => t.roster).filter((p) => p.incidents?.length);
  assert.ok(hit.length > 20, "incidents happen");
  assert.ok(hit.every(isFictional), "no real NFL player or real prospect is ever named");
  assert.ok(teams.flatMap((t) => t.roster).filter((p) => p.src === "m27").every((p) => !p.incidents));
});

test("a suspension keeps a player out, then runs down", () => {
  const teams = league();
  const p = teams[3].roster.find((x) => isFictional(x));
  p.suspended = true; p.suspWksLeft = 2;
  const all = new Set(teams.map((_, i) => i));
  assert.deepEqual(serveSuspensions(teams, all, 3), []);
  assert.equal(p.suspended, true);
  // a bye week doesn't count as a game served
  assert.deepEqual(serveSuspensions(teams, new Set([0, 1]), 3), []);
  assert.equal(p.suspWksLeft, 1);
  assert.deepEqual(serveSuspensions(teams, all, 3).map((x) => x.id), [p.id]);
  assert.equal(p.suspended, false);
});

test("a gambling ban is a full 17 games and carries into next season; game sims leave suspended players out", async () => {
  const { gameSetup } = await import("../src/league.js");
  const teams = league();
  const p = teams[2].roster.find((x) => isFictional(x));
  teams.forEach((t) => t.roster.forEach((x) => { if (x !== p && isFictional(x)) x.ovr = 40; }));
  p.ovr = 75;
  // rolls: an incident happens, it's him (the only one in the pool), and it's the gambling one
  const vals = [0.001, 0, 9.5 / 16, 0.5]; let k = 0;
  offFieldWeek({ teams, sched: [], wk: 3, ui: 0, yr: 2026, rand: () => vals[k++] ?? 0.5 });
  const ban = p.incidents?.[0]?.k === "gamble" ? p.incidents[0] : null;
  assert.ok(ban, "the gambling incident can be rolled");
  assert.equal(p.suspWksLeft, 17);
  // he isn't in the lineup
  const su = gameSetup(teams[2], teams[5], { off: "balanced", def: "balanced" }, { off: "balanced", def: "balanced" }, null);
  const inGame = (su.home.order(p.pos) || []).some((x) => x.id === p.id) || JSON.stringify(su.hSnaps || {}).includes(p.id);
  assert.equal(inGame, false, "a suspended player doesn't play");
  // 15 games this season: still out next season, 2 games to go
  const sched = (w) => [{ wk: w, h: 2, a: 5, played: true }];
  for (let w = 4; w <= 18; w++) if (w !== 9) offFieldWeek({ teams, sched: sched(w), wk: w, ui: 0, yr: 2026, rand: () => 0.99 });
  assert.equal(p.suspended, true);
  assert.equal(p.suspWksLeft, 3);
  for (let w = 1; w <= 3; w++) offFieldWeek({ teams, sched: sched(w), wk: w, ui: 0, yr: 2027, rand: () => 0.99 });
  assert.equal(p.suspended, false);
});

test("box scores make stories: an interception-riddled loss, a kicker's misses", () => {
  const teams = league();
  const qb = teams[0].roster.find((p) => p.pos === "QB"), k = teams[1].roster.find((p) => p.pos === "K");
  const sched = [{ wk: 5, h: 0, a: 1, played: true, hs: 13, as: 20, boxH: { [qb.id]: { name: qb.name, pos: "QB", comp: 18, att: 40, passInt: 4 } }, boxA: {} },
    { wk: 5, h: 2, a: 1, played: true, hs: 17, as: 14, boxH: {}, boxA: { [k.id]: { name: k.name, pos: "K", fgA: 4, fgM: 2, xpA: 1, xpM: 1 } } }];
  const { stories } = leagueDrama({ teams, sched, wk: 5, ui: 9, yr: 2026, rand: () => 0.99 });
  assert.ok(stories.some((s) => s.head.includes(qb.name.split(" ").slice(1).join(" ")) && /interceptions|picks/.test(s.head)));
  assert.ok(stories.some((s) => s.head.includes(k.name) && /misses/.test(s.head)));
});

test("an incident reads as a newspaper story with what it means", async () => {
  const { incidentArticle } = await import("../src/drama.js");
  const a = incidentArticle({ k: "sa", wks: 4, yr: 2029, wk: 3, name: "Sam Hill", pos: "LB", age: 31, ovr: 84, salary: 9, contract: 1, city: "Denver", club: "Broncos", prior: 1 });
  assert.match(a.dek, /civil suit/);
  assert.ok(a.fallout.some((f) => f.startsWith("Legal:")));
  assert.ok(a.fallout.some((f) => /not his first/.test(f)));
  assert.ok(a.fallout.some((f) => /an 84-rated/.test(f)));
});
