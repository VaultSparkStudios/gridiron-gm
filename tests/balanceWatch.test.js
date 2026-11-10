import test from "node:test";
import assert from "node:assert/strict";
import { checkSeason, watchRun } from "../src/balanceWatch.js";

const ok = { yr: 2027, ppg: 21.8, compPct: 64.5, passYds: 230, rushYds: 115, homeWin: 55, blowout28: 6, ties: 1, avgAge: 26.4, n99: 1, overCap: 0, thinTeams: 0, minRoster: 52, payPct: [80, 92, 100], top5Pct: { QB: 15 }, avgOvr: 68, starterOvr: 78, n90: 40, n80: 300 };

test("a normal season raises nothing", () => {
  assert.deepEqual(checkSeason(ok, ok), []);
});

test("out-of-band numbers and rating drift are flagged", () => {
  const f = checkSeason({ ...ok, ppg: 28, avgOvr: 71.5, n90: 70 }, ok).map((x) => x.k);
  assert.deepEqual(f.sort(), ["avgOvr", "n90", "ppg"]);
});

test("a hard band broken two seasons running fails the run; a one-off doesn't", () => {
  assert.equal(watchRun([ok, { ...ok, yr: 2028, ppg: 27 }, { ...ok, yr: 2029 }]).failures.length, 0);
  const w = watchRun([ok, { ...ok, yr: 2028, ppg: 27 }, { ...ok, yr: 2029, ppg: 27.5 }]);
  assert.equal(w.failures.length, 1);
  assert.equal(w.failures[0].yr, 2029);
  assert.equal(watchRun([ok, { ...ok, yr: 2028, homeWin: 70 }, { ...ok, yr: 2029, homeWin: 70 }]).failures.length, 0, "soft bands only warn");
});
