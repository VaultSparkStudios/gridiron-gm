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
    if (respond(p, { sal: Math.round(ask * t.minF * 10 + 1) / 10, yrs: 2 }, t).result === "lost") lost++;
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
