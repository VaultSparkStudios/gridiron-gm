import test from "node:test";
import assert from "node:assert/strict";
import { genCoach, newCoachPool, initTeams } from "../src/league.js";
import { coachingCarousel } from "../src/carousel.js";

test("head coaches can be generated and the pool covers every job", () => {
  const hc = genCoach("HC");
  assert.equal(hc.role, "HC"); assert.ok(hc.trait); assert.equal(hc.salary, 0);
  const pool = newCoachPool([]);
  for (const r of ["HC", "OC", "DC", "ST"]) assert.ok(pool.some((c) => c.role === r), r);
});

test("fired and released coaches stay in the pool; generated leftovers are refreshed", () => {
  const reid = { id: "x", name: "Andy Reid", role: "HC", rating: 94, real: true, fired: true, from: "KC" };
  const leftover = { id: "y", name: "Old Gen", role: "OC", rating: 60 };
  const pool = newCoachPool([reid, leftover]);
  assert.ok(pool.some((c) => c.name === "Andy Reid"));
  assert.ok(!pool.some((c) => c.id === "y"));
});

test("a losing AI club can fire its head coach and hires a new one; the old one hits the market", () => {
  const teams = initTeams(0);
  const perf = teams.map((t, i) => ({ w: i === 5 ? 2 : 9, l: i === 5 ? 15 : 8, pf: 300, pa: 300 }));
  teams[5].coach.hc.rating = 70;
  const before = teams[5].coach.hc.name;
  const r = coachingCarousel(teams, perf, 0, { rand: () => 0.01 });
  assert.notEqual(teams[5].coach.hc.name, before);
  assert.ok(teams[5].coach.hc.role === "HC");
  assert.ok(r.pool.some((c) => c.name === before && c.fired && c.from === teams[5].ab) || teams.some((t) => t.coach.hc?.name === before));
});
