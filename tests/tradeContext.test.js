import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateTrade, fitFor } from "../src/trade.js";

const pl = (id, pos, ovr, age, extra = {}) => ({ id, name: id, pos, ovr, age, tradeVal: 60, salary: 5, contract: 3, ...extra });
const club = (w, l, roster) => ({ id: 1, ab: "XX", w, l, roster });
const pick = () => 30;

test("a rebuilding club prizes youth and shies away from veterans", () => {
  const reb = club(1, 7, [pl("c1", "CB", 70, 27)]);
  assert.ok(fitFor(reb, pl("y", "CB", 75, 23)).m > fitFor(reb, pl("v", "CB", 75, 31)).m);
  assert.ok(fitFor(reb, pl("v", "CB", 75, 31)).why.some((w) => /rebuilding/.test(w)));
});

test("a club pays more for a player who'd start than one who'd sit", () => {
  const deep = club(4, 4, [pl("a", "WR", 90, 26), pl("b", "WR", 88, 26), pl("c", "WR", 86, 26), pl("d", "WR", 84, 26)]);
  const thin = club(4, 4, [pl("e", "WR", 60, 26)]);
  const wr = pl("x", "WR", 80, 26);
  assert.ok(fitFor(thin, wr).m > fitFor(deep, wr).m);
});

test("a deal they can't fit under the cap is off, and says so", () => {
  const them = club(4, 4, [pl("t", "LB", 70, 26, { tradeVal: 10, salary: 1 })]);
  const ev = evaluateTrade({ send: [pl("big", "LB", 85, 26, { tradeVal: 200, salary: 40 })], get: [them.roster[0]], them, pick, capRoom: 10 });
  assert.equal(ev.accept, false);
  assert.match(ev.why, /cap/);
});

test("picks count for more to a rebuilding club", () => {
  const give = pl("g", "S", 72, 26, { tradeVal: 33 });
  const reb = club(1, 7, [give]), con = club(7, 1, [give]);
  const a = evaluateTrade({ sendPk: [{ id: "p" }], get: [give], them: reb, pick, season: true });
  const b = evaluateTrade({ sendPk: [{ id: "p" }], get: [give], them: con, pick, season: true });
  assert.ok(a.gv > b.gv);
});
