import test from "node:test";
import assert from "node:assert/strict";
import { terms, respond, yearlyAsk } from "../src/negotiation.js";

const P = (id, ovr = 80, age = 27) => ({ id, ovr, age, pos: "WR", salary: 10 });

test("offers at the ask sign; near the hidden minimum he counters; lowballs get rejected then he walks", () => {
  const p = P("a"), t = terms(p, { yr: 2026, mode: "resign" });
  const ask = yearlyAsk(p, 2);
  assert.ok(t.minF >= 0.8 && t.minF <= 0.98);
  assert.equal(respond(p, { sal: ask, yrs: 2 }, t).result, "accept");
  const near = respond(p, { sal: Math.round(ask * t.minF * 0.9 * 10) / 10, yrs: 2 }, t);
  assert.equal(near.result, "counter");
  assert.ok(near.counter >= ask * t.minF - 0.1 && near.counter <= ask);
  assert.equal(respond(p, { sal: near.counter, yrs: 2 }, t, { tries: near.tries }).result, "accept", "accepting his counter signs him");
  const low = respond(p, { sal: ask * t.minF * 0.75, yrs: 2 }, t);
  assert.equal(low.result, "reject");
  assert.equal(respond(p, { sal: ask * t.minF * 0.75, yrs: 2 }, t, { tries: 2 }).result, "walk", "third strike");
  assert.equal(respond(p, { sal: ask * 0.4, yrs: 2 }, t).result, "walk", "an insult ends it");
});

test("the hidden minimum is fixed per player and season, not rerolled", () => {
  const p = P("b");
  assert.equal(terms(p, { yr: 2026, mode: "fa" }).minF, terms(p, { yr: 2026, mode: "fa" }).minF);
});

test("in free agency a rival can outbid you, and outbidding the rival wins him", () => {
  let lost = 0, won = 0;
  for (let i = 0; i < 300; i++) {
    const p = P(`fa${i}`, 88, 27), t = terms(p, { yr: 2026, mode: "fa", rivals: [3, 5, 9] });
    if (!t.rival) continue;
    const ask = yearlyAsk(p, 2);
    const low = { sal: Math.round(ask * t.minF * 10 + 1) / 10, yrs: 2 }, first = respond(p, low, t);
    if (first.rivalBid) { assert.equal(first.result, "counter"); if (respond(p, low, t, { tries: 1, last: first }).result === "lost") lost++; }
    if (respond(p, { sal: Math.round(ask * 1.4 * 10) / 10, yrs: 2 }, t).result === "accept") won++;
  }
  assert.ok(lost > 20, `rivals win some (${lost})`);
  assert.ok(won > 100, `big offers win (${won})`);
});

test("re-sign loyalty makes your own players a bit cheaper", () => {
  const p = P("c");
  assert.ok(terms(p, { yr: 2026, mode: "resign", loyalty: 1 }).minF < terms(p, { yr: 2026, mode: "resign", loyalty: 0 }).minF);
});

import { yearlyAsk as ask2, perfFactor } from "../src/negotiation.js";
test("contract-year play counts with his own team; free agency goes by rating", () => {
  const p = { id: "w", pos: "DL", ovr: 95, age: 28 };
  const down = { ...p, perf: { yr: 2026, f: 0.8 } }, big = { ...p, perf: { yr: 2026, f: 1.15 } };
  assert.ok(ask2(down, 3, "resign") < ask2(p, 3, "resign") * 0.85, "a down year costs him on a long deal");
  assert.ok(ask2(down, 1, "resign") > ask2(down, 3, "resign"), "a prove-it year pays closer to full price");
  assert.ok(ask2(big, 3, "resign") > ask2(p, 3, "resign") * 1.1, "a big year earns the big cheque");
  assert.equal(ask2(down, 3, "fa"), ask2(p, 3, "fa"), "on the open market he asks by his rating again");
  assert.equal(perfFactor(p, 2, "resign"), 1);
});

test("players weigh fit, not just money: a starting job and the right scheme can beat a bigger offer", async () => {
  const { priorities, teamFit, fitPull } = await import("../src/negotiation.js");
  const te = (id, ovr) => ({ id, ovr, age: 26, pos: "TE" });
  // a club where he'd start in a scheme that features tight ends, and one where he'd back up
  const fits = { roster: [te("x1", 60)], coach: { oc: { scheme: "West Coast" } }, w: 10, l: 7 };
  const buried = { roster: [te("x2", 92), te("x3", 90)], coach: { oc: { scheme: "Air Raid" } }, w: 10, l: 7 };
  let roleSeekers = 0, tookLess = 0;
  for (let i = 0; i < 400; i++) {
    const p = te(`te${i}`, 79);
    const pr = priorities(p);
    if (pr.key !== "role" && pr.key !== "scheme") continue;
    roleSeekers++;
    assert.ok(fitPull(pr, teamFit(p, fits)) > fitPull(pr, teamFit(p, buried)));
    // the rival (where he'd be buried) bids more; you offer his number
    const t = terms(p, { yr: 2026, mode: "fa", rivals: [1], myTeam: fits, teamById: () => buried });
    if (!t.rival) continue;
    const r = respond(p, { sal: yearlyAsk(p, 2), yrs: 2 }, t);
    if (r.result === "accept" && /less/.test(r.msg)) tookLess++;
  }
  assert.ok(roleSeekers > 50, `some players chase snaps or schemes (${roleSeekers})`);
  assert.ok(tookLess > 5, `some take less to start in the right scheme (${tookLess})`);
});

test("the rival's offer is leverage, not a price tag: matching it can still lose him", () => {
  const club = { roster: [], coach: {}, w: 8, l: 9 };
  let leverage = 0, lostAfterMatch = 0;
  for (let i = 0; i < 400; i++) {
    const p = P(`lv${i}`, 88, 27), t = terms(p, { yr: 2026, mode: "fa", rivals: [2], myTeam: club, teamById: () => club });
    if (!t.rival) continue;
    const first = respond(p, { sal: Math.round(yearlyAsk(p, 2) * t.minF * 10 + 1) / 10, yrs: 2 }, t);
    if (!first.rivalBid) continue;
    leverage++;
    assert.ok(first.sal > 0 && first.yrs >= 1 && first.counter > 0);
    if (respond(p, { sal: first.sal, yrs: 2 }, t, { tries: 1, last: first }).result === "lost") lostAfterMatch++;
  }
  assert.ok(leverage > 20, `agents use rival offers (${leverage})`);
  assert.ok(lostAfterMatch > 0, "matching the number isn't a guarantee");
});

test("AI free agency: a player picks the club that fits what he wants, and good fits pay a bit less", async () => {
  const { starterSignings, askingPrice } = await import("../src/offseason.js");
  const te = (id, ovr) => ({ id, ovr, age: 26, pos: "TE", salary: 1 });
  const club = (id, scheme, depth) => ({ id, roster: depth, coach: { oc: { scheme } }, w: 9, l: 8 });
  let toFit = 0, n = 0;
  for (let i = 0; i < 60; i++) {
    const p = te(`fa${i}`, 84);
    const teams = [club(0, "Air Raid", [te("a", 60)]), club(1, "West Coast", [te("b", 60)]), club(2, "Air Raid", [te("c", 60)])];
    const pool = [p];
    const s = starterSignings(teams, pool, 99, { capSpace: () => 100, cy: 2026, rand: () => 0.5 });
    if (!s.length) continue;
    n++;
    if (s[0].team === 1) toFit++;
    assert.ok(s[0].p.salary <= askingPrice(p));
  }
  assert.ok(n > 50);
  assert.ok(toFit > n * 0.3, `scheme-minded players pick the West Coast club (${toFit}/${n})`);
});

test("a loyal player takes 10% less to stay, not to sign elsewhere", async () => {
  const { yearlyAsk } = await import("../src/negotiation.js");
  const p = { pos: "WR", ovr: 84, age: 27, id: 9 };
  const L = { ...p, loyal: true };
  assert.ok(Math.abs(yearlyAsk(L, 3, "resign") - yearlyAsk(p, 3, "resign") * 0.9) < 0.2);
  assert.ok(Math.abs(yearlyAsk(L, 3, "extend") - yearlyAsk(p, 3, "extend") * 0.9) < 0.2);
  assert.equal(yearlyAsk(L, 3, "fa"), yearlyAsk(p, 3, "fa"));
});
