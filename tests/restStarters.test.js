import test from "node:test";
import assert from "node:assert/strict";
import { canRest, restSnaps, REST_SNAPS } from "../src/restStarters.js";
import { teamSnaps } from "../src/snaps.js";
import { depthOrderFor } from "../src/depth.js";

const pl = (id, pos, ovr) => ({ id, name: id, pos, ovr });
const team = { roster: [pl("qb1", "QB", 95), pl("qb2", "QB", 70), pl("rb1", "RB", 90), pl("rb2", "RB", 70), pl("k", "K", 80), pl("te1", "TE", 85)] };

test("only once the No. 1 seed is clinched, in the regular season, with a game left", () => {
  const sched = [{ wk: 18, h: 0, a: 1, played: false }];
  assert.ok(canRest({ sp: "regular", clinched: { yr: 2027, top: true }, yr: 2027, sched, ui: 0 }));
  assert.ok(!canRest({ sp: "regular", clinched: { yr: 2027, berth: true, div: true }, yr: 2027, sched, ui: 0 }));
  assert.ok(!canRest({ sp: "playoffs", clinched: { yr: 2027, top: true }, yr: 2027, sched, ui: 0 }));
  assert.ok(!canRest({ sp: "regular", clinched: { yr: 2026, top: true }, yr: 2027, sched, ui: 0 }));
  assert.ok(!canRest({ sp: "regular", clinched: { yr: 2027, top: true }, yr: 2027, sched: [{ wk: 18, h: 0, a: 1, played: true }], ui: 0 }));
});

test("starters play a fraction, backups the rest; a starter with no backup plays as usual", () => {
  const snaps = restSnaps(team, {}, {});
  assert.equal(snaps.qb1, REST_SNAPS.QB);
  assert.equal(snaps.rb1, REST_SNAPS.default);
  assert.equal(snaps.te1, undefined);   // the only tight end: nobody to spell him
  const healthy = team.roster;
  const game = teamSnaps((pos) => depthOrderFor(healthy, {}, pos, snaps), snaps);
  assert.ok(game.qb2 > game.qb1, `backup QB ${game.qb2} vs starter ${game.qb1}`);
  assert.ok(game.rb2 > game.rb1);
});
