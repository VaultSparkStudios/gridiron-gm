import { test } from "node:test";
import assert from "node:assert/strict";
import { leagueDrama, serveSuspensions, isFictional } from "../src/drama.js";
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
  for (let wk = 1; wk <= 400; wk++) leagueDrama({ teams, sched: [], wk: (wk % 17) + 1, ui: 0, yr: 2026 + Math.floor(wk / 17), rand });
  const hit = teams.flatMap((t) => t.roster).filter((p) => p.incidents?.length);
  assert.ok(hit.length > 20, "incidents happen");
  assert.ok(hit.every(isFictional), "no real NFL player or real prospect is ever named");
  assert.ok(teams.flatMap((t) => t.roster).filter((p) => p.src === "m27").every((p) => !p.incidents));
});

test("a suspension keeps a player out, then runs down", () => {
  const teams = league();
  const p = teams[3].roster.find((x) => isFictional(x));
  p.suspended = true; p.suspWksLeft = 2;
  assert.deepEqual(serveSuspensions(teams, 1, 3), []);
  assert.equal(p.suspended, true);
  assert.deepEqual(serveSuspensions(teams, 1, 3).map((x) => x.id), [p.id]);
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
