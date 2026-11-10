import test from "node:test";
import assert from "node:assert/strict";
import { primeSlot, seasonPreview } from "../src/seasonPreview.js";

test("primetime slots come from the kickoff time in New York", () => {
  assert.equal(primeSlot({ date: "2026-09-14T00:20:00Z" }), "Sunday Night"); // Sun 8:20 PM ET
  assert.equal(primeSlot({ date: "2026-09-13T17:00:00Z" }), null); // Sun 1:00 PM ET
  assert.equal(primeSlot({}), null);
});

test("the preview: opener, the toughest three-game stretch and a win total", () => {
  const team = (o) => ({ roster: Array.from({ length: 22 }, () => ({ ovr: o })) });
  const teams = [team(80), team(70), team(90), team(90), team(90), team(70)];
  const sched = [1, 2, 3, 4, 5].map((wk) => ({ wk, h: 0, a: wk }));
  const p = seasonPreview(teams, sched, 0);
  assert.equal(p.opener.wk, 1);
  assert.deepEqual([p.stretch.from, p.stretch.to], [2, 4]);
  assert.ok(p.winTotal % 1 === 0.5 && p.winTotal >= 3.5 && p.winTotal <= 13.5);
});
