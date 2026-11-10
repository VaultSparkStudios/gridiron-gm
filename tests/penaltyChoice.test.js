import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, gameSetup } from "../src/league.js";
import { createGame, step } from "../src/playsim.js";

const seeded = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = seeded(5);
const teams = initTeams();

// Pass interference is an automatic first down: on 3rd and long, a catch short of the sticks
// never wins out over the flag (a 20-yard catch on 3rd and 28 takes the interference).
test("the offense takes pass interference over a catch short of the first down", () => {
  let dpi = 0;
  for (let i = 0; i < 1500 && dpi < 150; i++) {
    const su = gameSetup(teams[3], teams[9], null, null, "clear");
    const g = createGame(su.home, su.away, { rand: seeded(i + 1) });
    while (!g.done) {
      const long = g.down === 3 && g.toGo >= 15, togo = g.toGo;
      const ev = long ? step(g, "pass_medium", 1) : step(g);
      if (!long || ev?.pen?.kind !== "dpi") continue;
      dpi++;
      if (!ev.pen.accepted) assert.ok(ev.pen.play.td || ev.pen.play.yards >= togo, `declined interference on 3rd and ${togo} after a ${ev.pen.play.yards}-yard play`);
    }
  }
  assert.ok(dpi > 5, `only ${dpi} interference flags`);
});
