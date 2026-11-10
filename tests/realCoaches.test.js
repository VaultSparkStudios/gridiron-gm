import test from "node:test";
import assert from "node:assert/strict";
import { initTeams, TEAMS } from "../src/league.js";
import { REAL_STAFF } from "../src/data/realCoaches.js";
import { repairSave } from "../src/repair.js";

test("every club has a real 2026 staff", () => {
  for (const t of TEAMS) assert.equal(REAL_STAFF[t.ab]?.length, 4, t.ab);
});

test("new leagues start with real head coaches and coordinators", () => {
  const teams = initTeams(0);
  const kc = teams.find((t) => t.ab === "KC");
  assert.equal(kc.coach.hc.name, "Andy Reid");
  assert.equal(kc.coach.dc.name, "Steve Spagnuolo");
  assert.equal(kc.coach.dc.scheme, "Zone Blitz");
  for (const t of teams) for (const r of ["hc", "oc", "dc", "st"]) assert.ok(t.coach[r]?.name && t.coach[r].rating > 0, `${t.ab} ${r}`);
});

test("old saves get a head coach and keep their coordinators", () => {
  const d = { teams: [{ ab: "SF", roster: [], ps: [], ir: [], coach: { oc: { name: "Old OC", rating: 70 } } }] };
  repairSave(d);
  assert.equal(d.teams[0].coach.hc.name, "Kyle Shanahan");
  assert.equal(d.teams[0].coach.oc.name, "Old OC");
});

test("head coach traits do what they say", async () => {
  const { hcGrowth, hcScoutBonus, hcGameEdge, hcCulture, HC_TRAITS } = await import("../src/headCoach.js");
  const { HC_TRAIT } = await import("../src/data/realCoaches.js");
  for (const t of Object.values(HC_TRAIT)) assert.ok(HC_TRAITS[t], t);
  for (const t of initTeams(0)) assert.ok(HC_TRAITS[t.coach.hc.trait], t.ab);
  const always = () => 0;
  assert.equal(hcGrowth({ trait: "Player Developer" }, { age: 23, ovr: 70, pot: 85 }, 2, 29, always), 3);
  assert.equal(hcGrowth({ trait: "Player Developer" }, { age: 30, ovr: 70, pot: 85 }, 0, 29, always), 0);
  assert.equal(hcGrowth({ trait: "QB Whisperer" }, { age: 35, pos: "QB", ovr: 80 }, -3, 34, always), -2);
  assert.equal(hcGrowth({ trait: "Veteran Manager" }, { age: 33, pos: "WR", ovr: 80 }, -3, 29, always), -2);
  assert.equal(hcGrowth(null, { age: 23, ovr: 70 }, 1, 29, always), 1);
  assert.equal(hcScoutBonus({ trait: "Talent Evaluator" }), 3);
  assert.equal(hcGameEdge({ trait: "Offensive Guru" }).off, 0.5);
  assert.equal(hcCulture({ trait: "Culture Builder" }), 0.04);
});
