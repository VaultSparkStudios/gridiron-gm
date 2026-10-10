import test from "node:test";
import assert from "node:assert/strict";
import { playerValue, pickValue, evaluateTrade } from "../src/trade.js";

// The game's pick chart, roughly: #1 = 4000 falling to 1500 at #32, 1400 at #33.
const chart = [0, ...Array.from({ length: 32 }, (_, i) => 4000 - i * 80.6), ...Array.from({ length: 32 }, (_, i) => 1400 - i * 22)];
const pick = (pk) => pickValue(chart, pk);
const P = (o) => ({ id: o.name, ...o, tradeVal: playerValue(o, o.dev) });

const caleb = P({ name: "Caleb", pos: "QB", ovr: 91, pot: 99, age: 24, dev: "generational", xf: "Brick Wall" });
const burns = P({ name: "Burns", pos: "DL", ovr: 89, age: 28, dev: "star" });
const backupQB = P({ name: "Backup", pos: "QB", ovr: 70, age: 31 });
const bears = { roster: [caleb, backupQB, P({ name: "WR", pos: "WR", ovr: 84, age: 26 })] };

test("value climbs steeply with rating and favours premium positions and youth", () => {
  assert.ok(playerValue({ pos: "WR", ovr: 95, age: 26 }) > 2 * playerValue({ pos: "WR", ovr: 85, age: 26 }));
  assert.ok(playerValue({ pos: "QB", ovr: 88, age: 27 }) > 1.5 * playerValue({ pos: "RB", ovr: 88, age: 27 }));
  assert.ok(playerValue({ pos: "CB", ovr: 88, age: 24 }) > playerValue({ pos: "CB", ovr: 88, age: 31 }));
  assert.ok(playerValue({ pos: "QB", ovr: 90, age: 31 }) > playerValue({ pos: "WR", ovr: 90, age: 31 }) * 1.5, "QBs age slower");
});

test("a young franchise QB costs the farm", () => {
  const no = evaluateTrade({ send: [burns], sendPk: [{ rd: 1, overall: 4 }], get: [caleb], them: bears, pick });
  assert.equal(no.accept, false, "Burns + #4 isn't close");
  assert.ok(no.gap > 150);
  const farm = evaluateTrade({ send: [burns], sendPk: [1, 2, 3, 4, 33].map((o) => ({ rd: o > 32 ? 2 : 1, overall: o })), get: [caleb], them: bears, pick });
  assert.equal(farm.accept, true, "four top-4 picks, a 2nd and a star gets it done");
});

test("a pile of depth doesn't add up to a star", () => {
  const depth = Array.from({ length: 6 }, (_, i) => P({ name: `d${i}`, pos: "LB", ovr: 80, age: 26 }));
  const r = evaluateTrade({ send: depth, get: [burns], them: { roster: [burns] }, pick });
  assert.ok(depth.reduce((s, p) => s + p.tradeVal, 0) > burns.tradeVal * 0.9 ? !r.accept : true);
});

test("a fair deal for an ordinary starter goes through", () => {
  const wr = P({ name: "WR2", pos: "WR", ovr: 82, age: 27 });
  assert.equal(evaluateTrade({ sendPk: [{ rd: 1, overall: 20 }], get: [wr], them: { roster: [wr] }, pick }).accept, true, "a 1st for a good WR2");
  assert.equal(evaluateTrade({ sendPk: [{ rd: 2, overall: 50 }], get: [wr], them: { roster: [wr] }, pick }).accept, false, "a late 2nd isn't enough");
});
