import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, gameSetup } from "../src/league.js";
import { createGame, step } from "../src/playsim.js";
import { keyLabel, liveChoice, resultCard } from "../src/livePlays.js";
import { buildPlay } from "../src/playScript.js";

const seeded = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = seeded(7);
const snap = (o) => ({ down: 1, toGo: 10, yard: 25, qtr: 1, clock: 900, k: "run", yards: 3, ...o });

test("key plays are picked from the situation, never the result", () => {
  assert.equal(keyLabel(snap({ down: 3, toGo: 4, yard: 60 })), "3rd & 4");
  assert.equal(keyLabel(snap({ down: 3, toGo: 4, yard: 30 })), null); // a 3rd down deep in his own end, early
  assert.equal(keyLabel(snap({ down: 3, toGo: 4, yard: 30, qtr: 4 })), "3rd & 4");
  assert.equal(keyLabel(snap({ down: 4, toGo: 1, yard: 45 })), "4th & 1");
  assert.equal(keyLabel(snap({ down: 2, toGo: 3, yard: 97 })), "2nd & goal");
  assert.equal(keyLabel(snap({ qtr: 4, clock: 90 }), -3), "Two-minute drill");
  assert.equal(keyLabel(snap({ qtr: 4, clock: 90 }), 21), null); // not close
  assert.equal(keyLabel(snap({ qtr: 5 })), "Overtime");
  // the same snap gets the same banner whatever happens on it
  for (const r of [{ yards: -2 }, { yards: 40, td: true }, { k: "int", turnover: true }]) assert.deepEqual(liveChoice(snap({ down: 3, yard: 70, ...r }), "Key"), { key: "3rd & 10" });
});

test("big plays and the odd ordinary snap play out; kicks and Off don't", () => {
  assert.deepEqual(liveChoice(snap({ k: "sack", yards: -7 }), "Key", 0, 0.9), { key: null });
  assert.deepEqual(liveChoice(snap({ k: "pass", yards: 31 }), "Key", 0, 0.9), { key: null });
  assert.equal(liveChoice(snap({ k: "run", yards: 4 }), "Key", 0, 0.9), null);
  assert.deepEqual(liveChoice(snap({ k: "run", yards: 4 }), "Key", 0, 0.01), { key: null }); // a decoy
  assert.equal(liveChoice(snap({ k: "pass", yards: 60, td: true }), "Off"), null);
  assert.equal(liveChoice({ ...snap(), k: undefined, type: "punt" }, "All"), null);
  assert.deepEqual(liveChoice(snap(), "All", 0, 0.9), { key: null });
});

test("the result card names who made the play, and flags yours", () => {
  const ev = snap({ k: "sack", type: "sack", yards: -8, qb: { id: 1, name: "Patrick Mahomes" }, rusher: { id: 2, name: "Brian Burns" } });
  const c = resultCard(ev, "a", "h", { h: { 2: { sacks: 2 } } });
  assert.equal(c.head, "SACK!");
  assert.equal(c.line, "Brian Burns sacks Patrick Mahomes for an 8-yard loss");
  assert.ok(c.mine);
  assert.equal(c.note, "2nd sack of the game");
  assert.equal(resultCard(ev, "h", "h").mine, false); // his sack against your quarterback
});

test("every play the field acts out ends where the engine says", () => {
  const teams = initTeams();
  const FORM = { off: [["LT", -1.5, -11], ["LG", -1.5, -5.5], ["C", -1.5, 0], ["RG", -1.5, 5.5], ["RT", -1.5, 11], ["TE", -2.5, 16.5], ["WR", -2, -22], ["WR", -2, 22], ["WR", -3.5, -17.5], ["QB", -8, 0], ["RB", -8.5, 7]], def: [["DL", 4.8, -9], ["DL", 4.8, -3], ["DL", 4.8, 3], ["DL", 4.8, 9], ["LB", 9.5, -14], ["LB", 9.5, 0], ["LB", 9.5, 14], ["CB", 8, -22], ["CB", 8, 22], ["S", 15, -9], ["S", 15, 9]] };
  let n = 0;
  for (let i = 0; i < 6; i++) {
    const su = gameSetup(teams[i], teams[i + 10], null, null, "clear");
    const g = createGame(su.home, su.away, { rand: seeded(i + 1) });
    while (!g.done) {
      const ev = step(g);
      if (!ev || !liveChoice(ev, "All")) continue;
      const slots = [...FORM.off.map(([pos, dx, y], j) => ({ key: `o${j}`, side: "off", pos, x: ev.yard + dx, y })), ...FORM.def.map(([pos, dx, y], j) => ({ key: `d${j}`, side: "def", pos, x: ev.yard + dx, y }))];
      const sc = buildPlay(ev, slots, n++);
      // a punt or kickoff with a return runs longer (hang time, then the return)
      assert.ok(sc.T > 0.5 && sc.T < (["punt", "kickoff"].includes(ev.k) ? 10 : 9), `play length ${sc.T}`);
      for (let t = 0; t <= sc.T; t += 0.1) for (const s of slots) assert.ok(sc.f[s.key](t).every(Number.isFinite));
      // the ball carrier's last spot is the yard line the play ended on (a play a flag brought back
      // is shown as it happened)
      const P = ev.pen?.play && !ev.pen.pre ? ev.pen.play : ev;
      if ((ev.k === "run" || ev.k === "pass") && !P.td && ev.type !== "fumble") {
        const b = sc.ball(sc.T);
        assert.ok(b.held, "someone has the ball at the whistle");
        assert.ok(Math.abs(sc.f[b.held](sc.T)[0] - (ev.yard + P.yards)) < 0.01, `${ev.text}`);
      }
      if (P.td) assert.ok(sc.f[sc.ball(sc.T).held](sc.T)[0] >= 100, "a touchdown ends in the end zone");
    }
  }
  assert.ok(n > 300);
});
