import { test } from "node:test";
import assert from "node:assert/strict";
import { genTradeOffer, wantsPlayer, clubMode, fairPicks, MAX_OVERPAY } from "../src/tradeOffers.js";
import { playerValue } from "../src/trade.js";

const qb = (id, ovr, age) => { const p = { id, name: id, pos: "QB", ovr, pot: ovr, age }; p.tradeVal = playerValue(p); return p; };

test("a rebuilding club doesn't call about a 32-year-old backup QB; a contender might", () => {
  const jameis = qb("Jameis", 71, 32);
  assert.equal(wantsPlayer({ w: 1, l: 6 }, jameis), false);
  assert.equal(wantsPlayer({ w: 3, l: 3, gmStyle: "rebuilder" }, jameis), false);
  assert.equal(wantsPlayer({ w: 3, l: 3 }, jameis), false);
  assert.equal(wantsPlayer({ w: 6, l: 1 }, jameis), true);
  assert.equal(wantsPlayer({ w: 1, l: 6 }, qb("Young", 72, 24)), true, "a rebuild wants a young QB");
  assert.equal(clubMode({ w: 1, l: 6 }), "rebuild");
});

test("offers never pay more than the player is worth: no first for a backup", () => {
  const firstV = 30, seventhV = 2;
  const pkV = (pk) => (pk.rd === 1 ? firstV : pk.rd === 4 ? 6 : pk.rd === 6 ? 3 : seventhV);
  const picks = [{ id: "a", rd: 1, owner: 1 }, { id: "b", rd: 4, owner: 1 }, { id: "c", rd: 6, owner: 1 }, { id: "d", rd: 7, owner: 1 }];
  const v = qb("Jameis", 71, 32).tradeVal;
  const got = fairPicks(picks, v, pkV);
  assert.ok(got, "some late pick fits");
  assert.ok(!got.some((pk) => pk.rd === 1));
  const sum = got.reduce((s, pk) => s + pkV(pk), 0);
  assert.ok(sum <= v * MAX_OVERPAY, `paid ${sum} for value ${v}`);
  assert.equal(fairPicks([{ id: "a", rd: 1 }], v, pkV), null);
});

test("generated offers stay fair over many calls", () => {
  const mk = (id, pos, ovr, age) => { const p = { id, name: id, pos, ovr, pot: ovr, age }; p.tradeVal = playerValue(p); return p; };
  const pkV = (pk) => [0, 33, 15, 8, 5, 3.5, 2.5, 2][pk.rd];
  let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const user = { w: 4, l: 3, roster: [mk("j", "QB", 71, 32), mk("q2", "QB", 74, 25), mk("q3", "QB", 80, 28), mk("c1", "CB", 75, 30), mk("c2", "CB", 73, 24), mk("c3", "CB", 72, 27)] };
  const ai = (w, l) => ({ w, l, roster: [mk("x" + w, "WR", 70, 26), mk("y" + w, "LB", 66, 27), mk("z" + w, "S", 60, 25)] });
  const teams = [user, ai(1, 6), ai(6, 1), ai(3, 4)];
  const picks = [1, 2, 3].flatMap((o) => [1, 2, 3, 4, 5, 6, 7].map((rd) => ({ id: `${o}-${rd}`, rd, owner: o })));
  let n = 0;
  for (let i = 0; i < 3000; i++) {
    const off = genTradeOffer(teams, 0, picks, pkV, rand);
    if (!off) continue; n++;
    const got = (off.give?.tradeVal || 0) + off.givePicks.reduce((s, pk) => s + pkV(pk), 0);
    assert.ok(got <= off.want.tradeVal * MAX_OVERPAY + 1e-9, `overpay: ${got} for ${off.want.name} (${off.want.tradeVal})`);
    assert.ok(wantsPlayer(teams[off.fromTm], off.want));
  }
  assert.ok(n > 0);
});
