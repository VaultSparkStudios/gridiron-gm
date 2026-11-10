import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, gameSetup } from "../src/league.js";
import { createGame, step } from "../src/playsim.js";

const seeded = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = seeded(11);
const teams = initTeams();

// Throw every pass you call to one receiver (the offense's second option, so not who the
// quarterback would have looked to anyway), open or covered.
function throwTo(open, n = 30) {
  let to = 0, thrown = 0, comp = 0, ints = 0;
  for (let i = 0; i < n; i++) {
    const su = gameSetup(teams[3], teams[9], null, null, "clear");
    const g = createGame(su.home, su.away, { rand: seeded(i + 1) });
    while (!g.done) {
      if (g.poss !== "h" || g.down === 4) { step(g); continue; }
      const recv = g.sides.h.recvBy["11"], pick = [...recv].sort((a, b) => b[1] - a[1])[1][0];
      const ev = step(g, "pass_medium", 1, { target: pick.id, open });
      if (!ev?.tgt) continue;
      thrown++; if (ev.tgt.id === pick.id) to++;
      if (ev.k === "pass") comp++; if (ev.k === "int") ints++;
    }
  }
  return { share: to / thrown, comp: comp / thrown, int: ints / thrown };
}

test("a pass you call goes to the receiver you picked", () => {
  assert.equal(throwTo(true, 6).share, 1);
});

test("hitting the open man beats forcing it into coverage", () => {
  const open = throwTo(true, 150), covered = throwTo(false, 150);
  assert.ok(open.comp - covered.comp > 0.2, `completion ${open.comp.toFixed(2)} vs ${covered.comp.toFixed(2)}`);
  assert.ok(covered.int > open.int * 2, `interceptions ${open.int.toFixed(3)} vs ${covered.int.toFixed(3)}`);
});
