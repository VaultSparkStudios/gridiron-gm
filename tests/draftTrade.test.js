import test from "node:test";
import assert from "node:assert/strict";
import { tradeDownOffers, acceptOffer, applyFutures, chartValue, pickChartValue } from "../src/draftTrade.js";

const teams = Array.from({ length: 32 }, (_, i) => ({ city: `C${i}`, name: `T${i}`, ab: `T${i}` }));
const draft = () => { const p = []; for (let rd = 1; rd <= 7; rd++) for (let i = 0; i < 32; i++) p.push({ id: `${rd}-${i}`, rd, num: i + 1, overall: (rd - 1) * 32 + i + 1, owner: i, orig: i, yr: 2027 }); return p; };

test("draft-day offers only move you down and pay you for it", () => {
  const picks = draft();
  let total = 0;
  for (const ui of [3, 10, 20]) {
    const idx = ui; // the user's first-round pick is on the clock
    const offers = tradeDownOffers({ picks, idx, ui, yr: 2027, teams });
    for (const o of offers) {
      total++;
      assert.ok(o.theirPick.overall > picks[idx].overall, "always a later pick");
      assert.ok(o.extras.length >= 1 && o.extras.length <= 3, "plus compensation");
      assert.ok(o.get >= o.give * 0.85, `value ${o.get} for ${o.give}`);
      assert.ok(o.get <= o.give * 1.4);
    }
  }
  assert.ok(total >= 3, "clubs call");
});

test("accepting swaps the picks and future picks carry into next year's order", () => {
  const picks = draft();
  const [o] = tradeDownOffers({ picks, idx: 3, ui: 3, yr: 2027, teams, bump: {} }).concat([]);
  assert.ok(o);
  const fut = { ...o, extras: [...o.extras.filter((a) => !a.future), { id: "fut-x", rd: 2, yr: 2028, owner: o.team, orig: o.team, future: true }] };
  const r = acceptOffer(picks, [], fut, 3);
  assert.equal(r.picks.find((p) => p.id === picks[3].id).owner, o.team);
  assert.equal(r.picks.find((p) => p.id === o.theirPick.id).owner, 3);
  const next = applyFutures(teams.map((_, i) => i), 2028, r.futures);
  assert.equal(next.find((p) => p.rd === 2 && p.orig === o.team).owner, 3);
  assert.equal(pickChartValue({ rd: 1, yr: 2028 }, 2027), chartValue(48));
});
