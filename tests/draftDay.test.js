import test from "node:test";
import assert from "node:assert/strict";
import { tradeUpOffers, acceptTradeUp, pickValueTag, chartValue } from "../src/draftTrade.js";

const teams = Array.from({ length: 32 }, (_, i) => ({ city: "C" + i, name: "T" + i }));
const picks = [];
for (let rd = 1; rd <= 7; rd++) for (let n = 1; n <= 32; n++) picks.push({ id: `p${rd}-${n}`, rd, num: n, overall: (rd - 1) * 32 + n, owner: n - 1, orig: n - 1, yr: 2026 });

test("trade-up offers cost more than the pick you get", () => {
  const ui = 20; // picks #21, #53, ...
  const offers = tradeUpOffers({ picks, idx: 5, ui, yr: 2026, teams });
  assert.ok(offers.length > 0);
  for (const o of offers) {
    assert.ok(o.theirPick.overall < 21 && o.theirPick.owner !== ui);
    assert.equal(o.myPick.overall, 21);
    assert.ok(o.give >= o.get * 0.97, `${o.give} vs ${o.get}`);
    assert.ok(o.give >= chartValue(21));
  }
  const o = offers[0];
  const r = acceptTradeUp(picks, [], o, ui);
  assert.equal(r.picks.find((p) => p.id === o.theirPick.id).owner, ui);
  assert.equal(r.picks.find((p) => p.id === o.myPick.id).owner, o.team);
  for (const a of o.extras) if (a.future) assert.ok(r.futures.some((f) => f.id === a.id && f.owner === o.team && f.orig === ui));
  else assert.equal(r.picks.find((p) => p.id === a.id).owner, o.team);
});

test("no trade-up calls when you're on the clock or out of picks", () => {
  assert.deepEqual(tradeUpOffers({ picks: picks.map((p) => ({ ...p, owner: p.owner === 3 ? 4 : p.owner })), idx: 0, ui: 3, yr: 2026, teams }), []);
});

test("steals and reaches", () => {
  assert.equal(pickValueTag(20, 5).kind, "steal");
  assert.equal(pickValueTag(5, 30).kind, "reach");
  assert.equal(pickValueTag(10, 9), null);
  assert.equal(pickValueTag(10, 999), null);
});
