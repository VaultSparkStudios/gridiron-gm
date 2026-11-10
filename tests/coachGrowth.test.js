// AI coordinators grow like yours: game experience every week and off-season development.
import test from "node:test";
import assert from "node:assert/strict";
import { coachXP, aiCoachWeek, aiCoachOffseason, CAP } from "../src/coachGrowth.js";

const club = (r = 70) => ({ coach: { oc: { rating: r, scheme: "Air Raid" }, dc: { rating: r, scheme: "3-4" }, st: { rating: r } } });

test("20 experience is +1 rating, never past the cap", () => {
  const c = { rating: 70, xp: 18 };
  assert.equal(coachXP(c, true), 1); assert.equal(c.rating, 71); assert.equal(c.xp, 1);
  const top = { rating: CAP, xp: 19 }; coachXP(top, true); assert.equal(top.rating, CAP);
});

test("a week's games feed every AI club's coordinators, not yours", () => {
  const teams = [club(), club(), club()];
  for (let w = 0; w < 7; w++) aiCoachWeek(teams, [{ played: true, h: 0, a: 1, hs: 24, as: 17 }, { played: true, h: 2, a: 0, hs: 10, as: 3 }], 0);
  assert.equal(teams[0].coach.oc.xp ?? 0, 0); // yours: handled in the app
  assert.equal(teams[1].coach.oc.rating, 70); assert.equal(teams[1].coach.oc.xp, 7); // 7 losses
  assert.equal(teams[2].coach.dc.rating, 71); // 7 wins = 21 experience
});

test("off-season development: +5 once a year, a specialty that fits the scheme", () => {
  const teams = [club(), club()];
  aiCoachOffseason(teams, 0, 2027, () => 0); aiCoachOffseason(teams, 0, 2027, () => 0);
  assert.equal(teams[0].coach.oc.rating, 70);
  assert.equal(teams[1].coach.oc.spec, "Spread"); assert.equal(teams[1].coach.dc.spec, "Run Stop");
  assert.equal(teams[1].coach.oc.rating, 78); // +5 development, +3 specialty, once
});
