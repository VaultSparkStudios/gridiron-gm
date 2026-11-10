// The trade market, calibrated against real NFL deadline deals: each one has to go through at
// (about) its real price in the game, and a clearly smaller offer has to be turned down. Ratings
// are what those players would carry in the game at the time; picks sit mid-round.
import test from "node:test";
import assert from "node:assert/strict";
import { playerValue, evaluateTrade, contractMult } from "../src/trade.js";
import { pkV } from "../src/league.js";

const pick = (rd, o = 16) => ({ rd, overall: (rd - 1) * 32 + o });
// a seller in the middle of the pack (neither rebuilding nor contending changes its prices)
const seller = (p) => ({ id: 9, w: 4, l: 4, roster: [p, { id: "qb", pos: "QB", ovr: 78, age: 28 }] });
const mk = (o) => { const p = { id: o.name, pot: o.ovr, contract: 2, ...o }; p.tradeVal = playerValue(p); return p; };
const price = (p, picks) => evaluateTrade({ sendPk: picks, get: [p], them: seller(p), pick: pkV, season: true });

// [what happened, the player, the real return, an offer a round or more short]
const DEALS = [
  ["Montez Sweat to the Bears, 2023: a 2nd", mk({ name: "Sweat", pos: "DL", ovr: 86, age: 27, contract: 1, salary: 2.5 }), [pick(2, 7)], [pick(3, 20)]],
  ["Roquan Smith to the Ravens, 2022: a 2nd and a 5th", mk({ name: "Roquan", pos: "LB", ovr: 88, age: 25, contract: 1, salary: 9.7 }), [pick(2, 12), pick(5)], [pick(4)]],
  ["Jaelan Phillips to the Eagles, 2025: a 3rd", mk({ name: "Phillips", pos: "DL", ovr: 82, age: 26, contract: 1, salary: 13 }), [pick(3)], [pick(5)]],
  ["Jakobi Meyers to the Jaguars, 2025: a 4th and a 6th", mk({ name: "Meyers", pos: "WR", ovr: 80, age: 29, contract: 1, salary: 11 }), [pick(4), pick(6)], [pick(7)]],
  ["Amari Cooper to the Bills, 2024: a 3rd", mk({ name: "Cooper", pos: "WR", ovr: 84, age: 30, contract: 1, salary: 20 }), [pick(3)], [pick(6)]],
  ["Davante Adams to the Jets, 2024: a 3rd that could become a 2nd", mk({ name: "Adams", pos: "WR", ovr: 89, age: 31, contract: 2, salary: 36 }), [pick(2, 28)], [pick(5)]],
  ["Za'Darius Smith to the Lions, 2024: a 5th", mk({ name: "ZSmith", pos: "DL", ovr: 83, age: 32, contract: 1, salary: 11.5 }), [pick(5)], [pick(7, 28)]],
  ["DeAndre Hopkins to the Chiefs, 2024: a 5th that became a 4th", mk({ name: "Hopkins", pos: "WR", ovr: 80, age: 32, contract: 1, salary: 12 }), [pick(5)], [pick(7, 28)]],
  ["Christian McCaffrey to the 49ers, 2022: a 2nd, 3rd, 4th and 5th", mk({ name: "CMC", pos: "RB", ovr: 92, age: 26, contract: 4, salary: 16 }), [pick(2, 28), pick(3, 28), pick(4, 28), pick(5)], [pick(2, 28)]],
  ["T.J. Hockenson to the Vikings, 2022: a 2nd and a 3rd", mk({ name: "Hockenson", pos: "TE", ovr: 85, age: 25, contract: 2, salary: 5 }), [pick(2), pick(3)], [pick(3)]],
];

for (const [what, p, real, short] of DEALS) {
  test(`deadline market: ${what}`, () => {
    const r = price(p, real);
    assert.equal(r.accept, true, `${what}: asks ${r.ask}, the real return is worth ${r.gv}`);
    // and not for nothing: well short of it isn't enough
    assert.equal(price(p, short).accept, false, `${what}: ${short.length} pick(s) worth ${price(p, short).gv} shouldn't land a player asking ${r.ask}`);
  });
}

test("a 2nd gets a solid starter on an expiring deal at the deadline", () => {
  const p = mk({ name: "LB", pos: "LB", ovr: 82, age: 27, contract: 1, salary: 8 });
  assert.equal(price(p, [pick(2)]).accept, true);
});

test("a contract far above market costs value; a rookie deal adds it", () => {
  const base = { pos: "WR", ovr: 88, age: 26, pot: 88, contract: 3 };
  assert.ok(contractMult({ ...base, salary: 40 }) < contractMult({ ...base, salary: 18 }) * 0.8);
  assert.ok(contractMult({ ...base, salary: 3 }) > contractMult({ ...base, salary: 18 }));
  // and it's never part of the saved value (that would change on a reload)
  assert.equal(playerValue({ ...base, salary: 40 }), playerValue({ ...base, salary: 3 }));
});

import { contractMult as cm } from "../src/trade.js";
test("contract value: a depth player near the minimum isn't priced like an albatross; an old star on a big deal is", () => {
  assert.ok(cm({ pos: "DL", ovr: 66, age: 24, salary: 2.3, contract: 3 }) > 0.85);
  assert.ok(cm({ pos: "LT", ovr: 88, age: 34, salary: 30, contract: 4 }) < 0.8);
});
