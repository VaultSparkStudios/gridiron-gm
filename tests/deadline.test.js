import { test } from "node:test";
import assert from "node:assert/strict";
import { startDeadline, advanceDeadline, runDeadline, LAST_HOUR, marketBoard } from "../src/deadline.js";
import { playerValue } from "../src/trade.js";

const mk = (id, pos, ovr, age) => { const p = { id, name: id, pos, ovr, pot: ovr, age, salary: 5, contract: 2 }; p.tradeVal = playerValue(p); return p; };
const pkV = (pk) => [0, 33, 15, 8, 5, 3.5, 2.5, 2][pk.rd];
const league = () => [
  { city: "Your", name: "Team", ab: "YOU", w: 5, l: 4, roster: [mk("u1", "WR", 90, 26), mk("u2", "WR", 75, 28), mk("u3", "WR", 74, 27), mk("u4", "WR", 72, 26)] },
  { city: "Big", name: "Winners", ab: "WIN", w: 8, l: 1, roster: [mk("cqb", "QB", 88, 28), mk("cw1", "WR", 85, 26), mk("cw2", "WR", 80, 27), mk("cw3", "WR", 62, 25), mk("young", "LB", 72, 23)] },
  { city: "Sad", name: "Losers", ab: "LOS", w: 1, l: 8, roster: [mk("rqb", "QB", 75, 30), mk("vetwr", "WR", 82, 29), mk("vetcb", "CB", 84, 30), mk("old", "WR", 70, 33)] },
];
const picks = () => [1, 2].flatMap((o) => [1, 2, 3, 4, 5, 6, 7].map((rd) => ({ id: `${o}-${rd}`, rd, owner: o, yr: 2026 })));

test("deadline day runs 9 AM to 4 PM, with deals, rumors and calls to you, then closes", () => {
  const teams = league();
  let s = startDeadline(teams, 0, 2026, Math.random);
  assert.equal(s.hour, 0); assert.ok(s.feed.length >= 1);
  assert.deepEqual(marketBoard(teams, 0).buyers.map((b) => b.ab), ["WIN"]);
  let p = picks(), calls = 0;
  while (!s.done) {
    const r = advanceDeadline(s, teams, p, 0, { yr: 2026, pkV, capSpace: () => 50, genOffer: () => ({ fromTm: 1, want: teams[0].roster[1], give: null, givePicks: [picks()[3]] }) });
    s = r.state; p = r.picks; calls += s.offers.length;
  }
  assert.equal(s.hour, LAST_HOUR);
  assert.equal(s.offers.length, 0, "offers expire at the deadline");
  assert.ok(calls > 0, "your phone rang");
  assert.ok(s.feed[0].text.includes("deadline has passed"));
  assert.ok(s.deals.every((d) => d.buyer === 1 && d.seller === 2));
});

test("sim all runs the whole day without calls to you", () => {
  const r = runDeadline(league(), picks(), 0, { yr: 2026, pkV, capSpace: () => 50, rand: Math.random });
  assert.ok(r.state.done);
  assert.ok(r.state.deals.length >= 1, "the contender made a deal at the deadline");
});

test("the trade block: sellers' veterans, expiring deals and surplus depth; never franchise players or starting QBs", async () => {
  const { leagueTradeBlock } = await import("../src/deadline.js");
  const teams = league();
  teams[2].roster.push(mk("young-star", "WR", 92, 24), { ...mk("exp", "CB", 76, 27), contract: 1 });
  teams[1].roster.push(mk("depthwr", "WR", 78, 26));
  const block = leagueTradeBlock(teams, 0);
  const ids = block.map((x) => x.p.id);
  assert.ok(ids.includes("vetwr") && ids.includes("vetcb"), "a rebuilding club's veterans");
  assert.ok(!ids.includes("rqb") && !ids.includes("cqb"), "no starting quarterbacks");
  assert.ok(!ids.includes("young-star"), "no franchise players");
  assert.ok(!ids.includes("u1"), "nobody from your own team");
  assert.ok(block.every((x, i) => i === 0 || block[i - 1].p.ovr >= x.p.ovr), "best first");
});
