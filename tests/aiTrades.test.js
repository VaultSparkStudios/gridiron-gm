import { test } from "node:test";
import assert from "node:assert/strict";
import { aiTradeWeek, TRADE_DEADLINE_WEEK } from "../src/aiTrades.js";
import { playerValue } from "../src/trade.js";

const mk = (id, pos, ovr, age, extra = {}) => { const p = { id, name: id, pos, ovr, pot: ovr, age, salary: 5, contract: 2, ...extra }; p.tradeVal = playerValue(p); return p; };
const pkV = (pk) => [0, 33, 15, 8, 5, 3.5, 2.5, 2][pk.rd];
const league = () => {
  const user = { w: 5, l: 1, roster: [mk("u1", "WR", 90, 26)] };
  const contender = { w: 6, l: 1, roster: [mk("cqb", "QB", 88, 28), mk("cw1", "WR", 85, 26), mk("cw2", "WR", 80, 27), mk("cw3", "WR", 62, 25), mk("young", "LB", 72, 23)] };
  const rebuild = { w: 1, l: 6, roster: [mk("rqb", "QB", 75, 30), mk("vetwr", "WR", 82, 29), mk("star", "WR", 95, 26), mk("old", "WR", 70, 33)] };
  return [user, contender, rebuild];
};
const picks = () => [1, 2].flatMap((o) => [1, 2, 3, 4, 5, 6, 7].map((rd) => ({ id: `${o}-${rd}`, rd, owner: o, yr: 2026 })));

test("a contender buys a rebuilding club's veteran for fair value; stars and starting QBs stay put", () => {
  let seen = 0;
  for (let s = 1; s < 60; s++) {
    let x = s; const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    const teams = league();
    const r = aiTradeWeek(teams, picks(), 0, { week: TRADE_DEADLINE_WEEK, pkV, capSpace: () => 50, rand });
    for (const t of r.trades) {
      seen++;
      assert.equal(t.buyer, 1); assert.equal(t.seller, 2);
      assert.equal(t.player.id, "vetwr", "the 26-year-old 95 and the QB aren't for sale");
      const paid = t.picks.reduce((s2, pk) => s2 + pkV(pk), 0) + t.players.reduce((s2, p) => s2 + p.tradeVal, 0);
      assert.ok(paid >= t.player.tradeVal * 0.9 && paid <= t.player.tradeVal * 1.25, `paid ${paid} for ${t.player.tradeVal}`);
      assert.ok(teams[1].roster.some((p) => p.id === "vetwr") && !teams[2].roster.some((p) => p.id === "vetwr"));
      for (const pk of t.picks) assert.equal(r.picks.find((q) => q.id === pk.id).owner, 2);
      assert.deepEqual(teams[0].roster.map((p) => p.id), ["u1"], "your team is never involved");
    }
  }
  assert.ok(seen > 0);
});

test("no AI trades after the deadline or in the first weeks", () => {
  for (const week of [1, 2, TRADE_DEADLINE_WEEK + 1, 15]) {
    const r = aiTradeWeek(league(), picks(), 0, { week, pkV, capSpace: () => 50, rand: () => 0 });
    assert.equal(r.trades.length, 0);
  }
});
