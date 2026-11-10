import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, gameSetup } from "../src/league.js";
import { createGame, playGame, defStyle } from "../src/playsim.js";

const seeded = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = seeded(2026); // everything else that rolls dice (roster setup, injuries) the same every run
// Play n games with your club (home) on a given defensive plan; totals for its defense.
function run(def, n = 120, dcPatch = {}) {
  const teams = initTeams();
  const me = { ...teams[2], isUser: true, coach: { ...teams[2].coach, dc: { ...(teams[2].coach?.dc || {}), ...dcPatch } } };
  const t = { blitz: 0, box: 0, cover: 0, dropbacks: 0, plays: 0, sacks: 0, rushYds: 0, rushAtt: 0, passYds: 0, comp: 0, att: 0 };
  for (let i = 0; i < n; i++) {
    const su = gameSetup(me, teams[5], { off: "balanced", def, auto: false }, null, "clear");
    const g = playGame(createGame(su.home, su.away, { rand: seeded(i + 1) })); // the same games for every plan
    const d = g.stats.h, o = g.stats.a; // our defense's calls; their offense
    t.blitz += d.blitz; t.box += d.box; t.cover += d.cover; t.dropbacks += d.dropbacks; t.plays += o.passAtt + o.rushAtt + o.sacks;
    t.sacks += o.sacks; t.rushYds += o.rushYds; t.rushAtt += o.rushAtt; t.passYds += o.passYds; t.comp += o.comp; t.att += o.passAtt;
  }
  return t;
}

test("the defensive plan changes the calls on the field, not just a number", () => {
  const blitz = run("aggressive", 250), cover = run("coverage", 250), box = run("run_stop", 250);
  const rate = (t, k) => t[k] / t.plays;
  assert.ok(rate(blitz, "blitz") > rate(cover, "blitz") * 2, `blitz rate ${rate(blitz, "blitz")} vs ${rate(cover, "blitz")}`);
  assert.ok(blitz.sacks / blitz.dropbacks > cover.sacks / cover.dropbacks * 1.2, "blitzing gets home more often");
  assert.ok(box.rushYds / box.rushAtt < cover.rushYds / cover.rushAtt - 0.2, "a loaded box takes away the run");
  assert.ok(rate(box, "box") > 0.35 && rate(cover, "cover") > 0.35);
});

test("the coordinator's scheme and specialty add to it", () => {
  const plain = defStyle({ coach: { dc: { scheme: "4-3" } } }, { def: "aggressive" });
  const blitzer = defStyle({ coach: { dc: { scheme: "Zone Blitz", spec: "Blitz Pkg" } } }, { def: "aggressive" });
  assert.ok(blitzer.blitz >= plain.blitz + 0.14);
  assert.ok(defStyle({ coach: { dc: { scheme: "Cover 2", spec: "Zone Cov" } } }, { def: "coverage" }).cover > 0.55 - 1e-9);
  const zb = run("aggressive", 80, { scheme: "Zone Blitz", spec: "Blitz Pkg" }), base = run("aggressive", 80, { scheme: "4-3", spec: null });
  assert.ok(zb.blitz / zb.plays > base.blitz / base.plays + 0.08);
});
