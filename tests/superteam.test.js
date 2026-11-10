import test from "node:test";
import assert from "node:assert/strict";
import { initTeams, simGame, calibrateLeague, setInjuries, top22 } from "../src/league.js";

// A club stacked with the league's best players at every starting spot (what a few seasons of
// great drafting and signings can build) is the best team in football, but not a lock every week:
// like the best real teams it wins about four in five, so 17-0 stays rare.
const POSN = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 3, S: 2, K: 1, P: 1 };
function stack(T, rank) {
  for (const [pos, n] of Object.entries(POSN)) {
    const pool = T.flatMap((t, ti) => t.roster.filter((p) => p.pos === pos).map((p) => ({ p, ti }))).filter((x) => x.ti !== 0).sort((a, b) => b.p.ovr - a.p.ovr);
    const mine = T[0].roster.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
    for (let i = 0; i < n; i++) {
      const get = pool[rank + i * 2], give = mine[mine.length - 1 - i] || mine[i];
      if (!get || !give || give.ovr >= get.p.ovr) continue;
      T[get.ti].roster = T[get.ti].roster.filter((x) => x !== get.p); T[get.ti].roster.push(give);
      T[0].roster = T[0].roster.filter((x) => x !== give); T[0].roster.push(get.p);
    }
  }
}

test("a stacked roster wins most games, not all of them", () => {
  setInjuries(false);
  const T = initTeams(-1); stack(T, 4); calibrateLeague(T);
  const plan = { off: "balanced", def: "balanced" };
  const lg = T.reduce((a, t) => a + top22(t), 0) / 32;
  assert.ok(top22(T[0]) - lg > 8, "the test club is far above the league");
  let w = 0, n = 0;
  for (let k = 0; k < 160; k++) { const o = 1 + (k % 31), home = k % 2 === 0; const r = home ? simGame(T[0], T[o], plan, plan) : simGame(T[o], T[0], plan, plan); const us = home ? r.hsc : r.asc, them = home ? r.asc : r.hsc; n++; if (us > them) w++; else if (us === them) w += 0.5; }
  const pct = w / n;
  assert.ok(pct > 0.68, `still the best team (${pct})`);
  assert.ok(pct < 0.9, `but not a lock: ${pct} (a .90 club goes 17-0 one season in six)`);
  setInjuries(true);
});
