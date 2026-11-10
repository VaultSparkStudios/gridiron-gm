import test from "node:test";
import assert from "node:assert/strict";
import { genDC, initTeams } from "../src/league.js";
import { scoutsPicks, currentOvr, survival, leagueIntel, intelRuns } from "../src/draftScouts.js";
import { csRank, newScouting } from "../src/scouting.js";

const setup = () => {
  const teams = initTeams(0);
  const cls = genDC(2030);
  const picks = [];
  for (let rd = 1; rd <= 2; rd++) teams.forEach((t, i) => picks.push({ id: `p${rd}-${i}`, rd, overall: (rd - 1) * 32 + i + 1, owner: i, orig: i }));
  return { teams, cls, picks, sc: newScouting ? newScouting() : {} };
};

test("the scouts bring five players for your pick, each with a reason and the scouts' votes", () => {
  const { teams, cls, picks, sc } = setup();
  const at = picks.findIndex((pk) => pk.owner === 0);
  const r = scoutsPicks({ sc, teams, ui: 0, picks, pool: cls, at, now: at, capRoom: 40 });
  assert.equal(r.five.length, 5);
  for (const x of r.five) { assert.ok(x.why.lead[0][0]); assert.ok(x.later >= 0 && x.later <= 1); }
  assert.ok(r.five.reduce((s, x) => s + x.votes.length, 0) <= 4);
  assert.equal(r.next.overall, 33);
});

test("a player the whole league rates goes early; one far down every board is still there", () => {
  const { teams, cls, picks } = setup();
  const sorted = [...cls].sort((a, b) => csRank(a) - csRank(b));
  const s = survival(cls, picks, 0, 31, teams, 31, 12);
  assert.ok(s.get(sorted[0].id) < 0.2, "the top of the board is gone after 31 picks");
  assert.equal(s.get(sorted[sorted.length - 1].id), 1, "the bottom of the board is untouched");
});

test("current overall: a range before anyone has scouted him, exact after a workup", () => {
  const p = genDC(2031)[5];
  const est = currentOvr({}, p);
  assert.equal(est.kind, "estimate");
  assert.ok(est.hi > est.lo && est.lo <= p.trueOvr + 4 && est.hi >= p.trueOvr - 4);
  p.scout = { lvl: 2, eOvr: p.trueOvr, ePot: p.truePot, exact: true };
  assert.deepEqual(currentOvr({}, p), { v: p.trueOvr, lo: p.trueOvr, hi: p.trueOvr, kind: "workup" });
});

test("league intel: what each club in between is likely to take, from the same runs", () => {
  const { teams, cls, picks } = setup();
  const r = leagueIntel(cls, picks, 0, 10, teams, 31, 8);
  assert.equal(r.picks.length, 10);
  for (const x of r.picks) {
    assert.ok(x.pos.length >= 1);
    assert.ok(Math.abs(x.pos.reduce((s, [, v]) => s + v, 0) - 1) < 1e-9, "each pick's positions add up to every run");
    assert.ok(x.who[0][1] >= x.who[x.who.length - 1][1], "most likely first");
  }
  const all = intelRuns(r);
  assert.ok(all.length);
  const last = all[all.length - 1].g;
  assert.equal(intelRuns(r, [last])[0].g, last, "your needs lead the summary");
});

test("the radar lists other players worth a look, never one of the five, each with a reason", () => {
  const { teams, cls, picks, sc } = setup();
  const at = picks.findIndex((pk) => pk.owner === 0);
  const r = scoutsPicks({ sc, teams, ui: 0, picks, pool: cls, at, now: at });
  const five = new Set(r.five.map((x) => x.p.id));
  assert.ok(Array.isArray(r.radar) && r.radar.length <= 5);
  for (const x of r.radar) { assert.ok(!five.has(x.p.id)); assert.ok(x.note[0]); }
});
