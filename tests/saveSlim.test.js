import { test } from "node:test";
import assert from "node:assert/strict";
import { slimSave, KEEP_GAMES } from "../src/saveSlim.js";

test("saves keep what screens show and drop the bulk", () => {
  const gl = Array.from({ length: 17 }, (_, i) => ({ passYds: i }));
  const d = {
    ui: 0, wk: 10,
    teams: [{ roster: [{ id: "a", gl }], ps: [], ir: [] }, { roster: [], ps: [], ir: [] }],
    sched: [
      { wk: 2, h: 0, a: 1, played: true, boxH: { x: 1 }, boxA: { y: 1 } }, // yours: kept
      { wk: 2, h: 1, a: 2, played: true, hs: 20, as: 10, boxH: { x: 1 }, boxA: { y: 1 } }, // old, others: score only
      { wk: 9, h: 1, a: 2, played: true, boxH: { x: 1 }, boxA: { y: 1 } }, // recent: kept
    ],
    draftLog: [{ rd: 1, overall: 1, owner: 0, grade: "A", player: { id: "p", name: "P", pos: "QB", ovr: 70, bio: { long: "x".repeat(500) }, cons: { final: 3 } } }],
  };
  const s = slimSave(d);
  assert.equal(s.teams[0].roster[0].gl.length, KEEP_GAMES);
  assert.equal(s.teams[0].roster[0].gl.at(-1).passYds, 16);
  assert.ok(s.sched[0].boxH && !s.sched[1].boxH && s.sched[1].hs === 20 && s.sched[2].boxH);
  assert.equal(s.draftLog[0].player.bio, undefined);
  assert.equal(s.draftLog[0].player.cons.final, 3);
  assert.equal(d.teams[0].roster[0].gl.length, 17, "the live game isn't changed");
});
