import test from "node:test";
import assert from "node:assert/strict";
import { setMarket, askingPrice, marketRating } from "../src/offseason.js";

// A league whose starting receivers average `avg` (96 starters), everything else empty.
const league = (avg) => Array.from({ length: 32 }, (_, i) => ({ roster: [0, 1, 2].map((k) => ({ id: `${i}-${k}`, pos: "WR", ovr: avg + (k - 1) * 3 })) }));

test("an 80 is priced against today's league: when starters get better, the same rating asks less", () => {
  setMarket(league(81.6)); // the 2026 market
  const wr = (ovr) => ({ pos: "WR", ovr, age: 26 });
  const then = askingPrice(wr(80), 300);
  setMarket(league(85.6)); // receivers are 4 points better across the league
  assert.equal(marketRating(wr(80)), 76);
  assert.ok(askingPrice(wr(80), 300) < then * 0.7, "an 80 is now a lesser starter");
  assert.equal(askingPrice(wr(84), 300), then, "an 84 now asks what an 80 did");
});

test("the shift is bounded and positions without enough players are left alone", () => {
  const s = setMarket(league(99));
  assert.equal(s.WR, 8);
  assert.equal(s.QB, undefined);
  setMarket([]);
  assert.equal(marketRating({ pos: "WR", ovr: 80 }), 80);
});
