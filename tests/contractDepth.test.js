import test from "node:test";
import assert from "node:assert/strict";
import { signingStructure, signedTerms, newLeagueYear } from "../src/bonus.js";
import { incentiveMet, settleIncentives, accelerateVoid, sheetCompensation, clubMatches, taggedPlayers } from "../src/contractDepth.js";
import { openFreeAgency } from "../src/offseason.js";

test("void years spread the bonus thinner and leave dead money", () => {
  const a = signingStructure(30, 2, 0.5, { minSal: 1, cap: 300 });
  const b = signingStructure(30, 2, 0.5, { minSal: 1, cap: 300, voidYrs: 2 });
  assert.ok(b.hitNow < a.hitNow);
  assert.equal(b.voidYrs, 2);
  assert.ok(Math.abs(b.voidDead - b.add * 2) < 0.11);
  const t = signedTerms(30, 2, 0.5, { minSal: 1, cap: 300, voidYrs: 2 });
  assert.equal(t.voidYrs, 2);
  assert.equal(signedTerms(30, 2, 0, { voidYrs: 2 }).voidYrs, undefined); // no bonus, nothing to void
  const team = { deadCap: 1 };
  accelerateVoid(team, { voidDead: 4.5 });
  assert.equal(team.deadCap, 5.5);
});

test("a deal's void years come due when it expires", () => {
  const p = { id: "v", pos: "WR", ovr: 60, age: 30, contract: 1, salary: 5, voidDead: 3 };
  const r = openFreeAgency([{ roster: [p] }, { roster: [] }], 1, 2026, () => 0.99);
  assert.equal(r.teams[0].deadCap, 3);
});

test("incentives are judged on the season and charged to next year's cap", () => {
  assert.ok(incentiveMet("10 sacks", { ss: { sacks: 11 } }));
  assert.ok(!incentiveMet("1,000 rec yds", { ss: { recYds: 999 } }));
  assert.ok(incentiveMet("Pro Bowl", {}, { honor: "pb" }));
  assert.ok(incentiveMet("12+ wins", {}, { wins: 13 }));
  const t = { w: 9, roster: [{ id: 1, ss: { rushYds: 1200 }, inc: { label: "1,000 rush yds", amt: 2 } }, { id: 2, ss: { rushYds: 300 }, inc: { label: "1,000 rush yds", amt: 2 } }] };
  const paid = settleIncentives([t], {}, 2026);
  assert.equal(paid.length, 1);
  assert.equal(t.incNext, 2);
  assert.equal(settleIncentives([t], {}, 2026).length, 0); // once a season
  newLeagueYear([t]);
  assert.equal(t.incCharge, 2);
  assert.equal(t.incNext, 0);
});

test("offer sheets need your first-rounders, and clubs match what they can afford", () => {
  const picks = [{ id: "a", rd: 1, overall: 12, owner: 0, yr: 2026 }];
  assert.ok(sheetCompensation(picks, [], 0, 2026).ok);
  assert.ok(!sheetCompensation(picks, [{ yr: 2027, orig: 0, rd: 1 }], 0, 2026).ok);
  assert.ok(!sheetCompensation([], [], 0, 2026).ok);
  const p = { id: "x", salary: 20 };
  assert.equal(clubMatches(p, {}, { sal: 40, yrs: 4 }, { ask: 30, room: 5, franchise: true }), false);
  const teams = [{ roster: [] }, { roster: [{ id: 9, ftag: true, tagYr: 2026 }, { id: 8 }] }];
  assert.deepEqual(taggedPlayers(teams, 0, 2026).map((x) => x.p.id), [9]);
});
