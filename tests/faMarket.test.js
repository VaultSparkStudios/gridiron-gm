// The free-agent market: offers from every club, players decide on their day and take the best.
import test from "node:test";
import assert from "node:assert/strict";
import { decideDay, openMarket, placeBid, bidsFor, committed, resolveDay, aiBids, isOverpay, standing, MARKET_MIN } from "../src/faMarket.js";
import { yearlyAsk } from "../src/negotiation.js";

const pl = (id, ovr, pos = "WR", age = 27) => ({ id, name: `P${id}`, pos, ovr, age });
const club = (roster = [], w = 8) => ({ roster, w, l: 17 - w, coach: {} });

test("depth players decide on day one, stars shop for two or three days", () => {
  assert.equal(decideDay(pl(1, 65), 2027), 1);
  for (let i = 0; i < 40; i++) { const d = decideDay(pl(i, 90), 2027); assert.ok(d === 2 || d === 3); }
  for (let i = 0; i < 40; i++) { const d = decideDay(pl(i, 78), 2027); assert.ok(d === 1 || d === 2); }
});

test("a club's new offer replaces its old one; open offers hold their money", () => {
  let m = openMarket(2027);
  m = placeBid(m, 7, { team: 0, sal: 10, yrs: 2 }); m = placeBid(m, 7, { team: 0, sal: 12, yrs: 3 }); m = placeBid(m, 7, { team: 3, sal: 11, yrs: 2 });
  assert.equal(bidsFor(m, 7).length, 2);
  assert.equal(committed(m, 0), 12);
});

test("he takes the best offer on his day, not the first one", () => {
  const p = pl(42, 80), ask = yearlyAsk(p, 2, "fa");
  const teams = [club(), club(), club()];
  let m = { ...openMarket(2027), day: 3 };
  m = placeBid(m, p.id, { team: 0, sal: +(ask * 1.0).toFixed(1), yrs: 2, day: 1 });
  m = placeBid(m, p.id, { team: 1, sal: +(ask * 1.15).toFixed(1), yrs: 2, day: 2 });
  const r = resolveDay(teams, [p], m);
  assert.equal(r.signings.length, 1); assert.equal(r.signings[0].bid.team, 1);
  assert.equal(bidsFor(r.market, p.id).length, 0);
});

test("nobody decides before his day; a lowball never signs him", () => {
  const star = { ...pl(5, 92), id: [...Array(60).keys()].find((i) => decideDay(pl(i, 92), 2027) === 3) };
  const ask = yearlyAsk(star, 2, "fa");
  let m = placeBid(openMarket(2027), star.id, { team: 0, sal: +(ask * 1.1).toFixed(1), yrs: 2 });
  assert.equal(resolveDay([club()], [star], m).signings.length, 0);
  const cheap = pl(9, 75), m2 = placeBid({ ...openMarket(2027), day: 2 }, cheap.id, { team: 0, sal: +(yearlyAsk(cheap, 2, "fa") * 0.6).toFixed(1), yrs: 2 });
  assert.equal(resolveDay([club()], [cheap], m2, { last: true }).signings.length, 0);
});

test("an extreme overpay is an overpay; a fair offer isn't", () => {
  const p = pl(3, 84), ask = yearlyAsk(p, 3, "fa");
  assert.ok(isOverpay(p, { sal: ask * 1.25, yrs: 3 }));
  assert.ok(!isOverpay(p, { sal: ask * 1.05, yrs: 3 }));
});

test("AI clubs bid on market players they'd start and can pay for", () => {
  const star = pl(1, 88, "QB"), depth = pl(2, MARKET_MIN - 5, "QB");
  const needy = club([pl(10, 70, "QB")]), set = club([pl(11, 95, "QB")]), broke = club([pl(12, 60, "QB")]);
  const space = (t) => (t === broke ? 1 : 200);
  let m = openMarket(2027);
  for (let i = 0; i < 20; i++) m = aiBids([club(), needy, set, broke], [star, depth], 0, m, { capSpace: space });
  const bidders = bidsFor(m, star.id).map((b) => b.team);
  assert.ok(bidders.includes(1)); assert.ok(!bidders.includes(2)); assert.ok(!bidders.includes(3)); assert.ok(!bidders.includes(0));
  assert.equal(bidsFor(m, depth.id).length, 0);
});

test("a player draws only so many suitors; a club that signs at a position drops its other offers there", async () => {
  const { maxSuitors } = await import("../src/faMarket.js");
  const star = pl(1, 90, "WR");
  const teams = [club(), ...Array.from({ length: 31 }, () => club([pl(100, 70, "WR")]))];
  let m = openMarket(2027);
  for (let i = 0; i < 10; i++) m = aiBids(teams, [star], 0, m, { capSpace: () => 300, perTeam: 2 });
  assert.ok(bidsFor(m, star.id).length <= maxSuitors(star));
  const a = pl(21, 84, "CB"), b = pl(22, 80, "CB");
  let m2 = { ...openMarket(2027), day: 3 };
  m2 = placeBid(m2, a.id, { team: 1, sal: +(yearlyAsk(a, 2, "fa") * 1.1).toFixed(1), yrs: 2 });
  m2 = placeBid(m2, b.id, { team: 1, sal: 1, yrs: 2 }); m2 = placeBid(m2, b.id, { team: 2, sal: 1, yrs: 2 });
  const r = resolveDay([club(), club(), club()], [b, a], m2);
  assert.equal(r.signings.length, 1);
  assert.deepEqual(bidsFor(r.market, b.id).map((x) => x.team), [2]);
});

test("an offer he accepted at the table always counts on his day, even under the market's bar", () => {
  const p = pl(77, 80), ask = yearlyAsk(p, 2, "fa");
  const teams = [club(), club()];
  let m = { ...openMarket(2027), day: 3 };
  m = placeBid(m, p.id, { team: 0, sal: +(ask * 0.6).toFixed(1), yrs: 2, day: 1 });
  assert.equal(resolveDay(teams, [p], m).signings.length, 0, "a lowball he never agreed to doesn't sign him");
  m = placeBid(m, p.id, { team: 0, sal: +(ask * 0.6).toFixed(1), yrs: 2, day: 1, ok: true });
  assert.equal(resolveDay(teams, [p], m).signings[0]?.bid.team, 0);
});

test("standing: your offer leads until another club's is better for him", () => {
  const p = pl(88, 82), ask = yearlyAsk(p, 2, "fa");
  const teams = [club(), club()];
  let m = openMarket(2027);
  assert.equal(standing(p, m, teams, 0), null);
  m = placeBid(m, p.id, { team: 0, sal: +ask.toFixed(1), yrs: 2 });
  assert.equal(standing(p, m, teams, 0), "lead");
  m = placeBid(m, p.id, { team: 1, sal: +(ask * 1.3).toFixed(1), yrs: 2 });
  assert.equal(standing(p, m, teams, 0), "behind");
  assert.equal(standing(p, m, teams, 1), "lead");
});
