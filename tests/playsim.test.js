import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeSide, createGame, step, playGame, LEAGUE } from "../src/playsim.js";
import { teamSnaps } from "../src/snaps.js";

const M = JSON.parse(readFileSync(new URL("../src/data/madden27.json", import.meta.url)));
const SP = JSON.parse(readFileSync(new URL("../src/data/special.json", import.meta.url)));
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const teams = M.teams.map((t, ti) => {
  const roster = [...t.roster, ...SP.punters.filter((p) => p.team === t.ab).slice(0, 1)].map((p, i) => ({ ...p, id: `${ti}-${i}`, ...(p.pos === "P" ? { posAttrs: p.attrs } : {}) }));
  const order = (pos) => roster.filter((p) => p.pos === pos).sort((a, b) => (a.dk ?? 99) - (b.dk ?? 99) || b.ovr - a.ovr);
  return { ab: t.ab, roster, side: makeSide({ team: t, order, snaps: teamSnaps(order, {}) }) };
});
const play = (h, a, opts = {}) => playGame(createGame(teams[h].side, teams[a].side, { rand, ...opts }));

// A league's worth of games, everyone against everyone.
const games = [];
for (let r = 0; r < 4; r++) for (let h = 0; h < 32; h++) for (let k = 1; k <= 8; k++) games.push([h, (h + k * 3 + r) % 32 === h ? (h + 1) % 32 : (h + k * 3 + r) % 32, play(h, (h + k * 3 + r) % 32 === h ? (h + 1) % 32 : (h + k * 3 + r) % 32)]);

test("league numbers look like the NFL", () => {
  const pts = games.flatMap(([, , g]) => [g.score.h, g.score.a]);
  const n = pts.length, mean = pts.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(pts.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
  const per = (k) => games.reduce((s, [, , g]) => s + g.stats.h[k] + g.stats.a[k], 0) / n;
  const ties = games.filter(([, , g]) => g.score.h === g.score.a).length / games.length;
  const home = games.filter(([, , g]) => g.score.h > g.score.a).length / games.length;
  assert.ok(mean > 19.5 && mean < 25, `points ${mean}`);
  assert.ok(sd > 8 && sd < 12.5, `spread ${sd}`);
  assert.ok(ties < 0.025, `ties ${ties}`);
  assert.ok(home > 0.5 && home < 0.62, `home ${home}`);
  assert.ok(per("passYds") > 200 && per("passYds") < 260, `pass ${per("passYds")}`);
  assert.ok(per("rushYds") > 100 && per("rushYds") < 135, `rush ${per("rushYds")}`);
  assert.ok(per("ints") > 0.5 && per("ints") < 1.1 && per("sacks") > 1.8 && per("sacks") < 3.2);
  assert.ok(per("passAtt") + per("rushAtt") + per("sacks") > 56 && per("passAtt") + per("rushAtt") + per("sacks") < 70, "about 63 offensive plays");
});

test("better offenses score more; better defenses allow less", () => {
  const pf = Array(32).fill(0), pa = Array(32).fill(0), gp = Array(32).fill(0);
  for (const [h, a, g] of games) { pf[h] += g.score.h; pa[h] += g.score.a; pf[a] += g.score.a; pa[a] += g.score.h; gp[h]++; gp[a]++; }
  const off = teams.map((t) => t.side.u.pass * 0.6 + t.side.u.run * 0.4), def = teams.map((t) => ((t.side.u.passD - LEAGUE.passD[0]) / LEAGUE.passD[1]) * 0.6 + ((t.side.u.runD - LEAGUE.runD[0]) / LEAGUE.runD[1]) * 0.4); // in the engine's units (spreads above average)
  const corr = (xs, ys) => { const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; let c = 0, vx = 0, vy = 0; xs.forEach((x, i) => { c += (x - mx) * (ys[i] - my); vx += (x - mx) ** 2; vy += (ys[i] - my) ** 2; }); return c / Math.sqrt(vx * vy); };
  assert.ok(corr(off, pf.map((x, i) => x / gp[i])) > 0.85, "offense rating predicts points scored");
  assert.ok(corr(def, pa.map((x, i) => x / gp[i])) < -0.85, "defense rating predicts points allowed");
});

test("the box score adds up to the score", () => {
  for (const [, , g] of games.slice(0, 60)) {
    for (const s of ["h", "a"]) {
      const lines = Object.values(g.box[s]), o = s === "h" ? "a" : "h";
      const sum = (k) => lines.reduce((t, l) => t + (l[k] || 0), 0);
      const st = g.stats[s];
      assert.equal(sum("passYds"), st.passYds); assert.equal(sum("recYds"), st.passYds); assert.equal(sum("rushYds"), st.rushYds);
      assert.equal(sum("rec"), st.comp); assert.equal(sum("comp"), st.comp); assert.equal(sum("passInt"), st.ints);
      assert.equal(Object.values(g.box[o]).reduce((t, l) => t + (l.ints || 0), 0), st.ints, "the other defense has the picks");
      assert.equal(sum("passTD"), sum("recTD"));
      const tds = sum("passTD") + sum("rushTD") + sum("krTD") + sum("prTD");
      const kicks = sum("fgM") * 3 + sum("xpM");
      const extra = g.score[s] - tds * 6 - kicks; // two-point tries and safeties
      assert.ok(extra >= 0 && extra % 2 === 0, `score ${g.score[s]} vs ${tds} TD and ${kicks} kicking points`);
    }
  }
});

test("stars get a star's share of the ball", () => {
  const cin = teams.findIndex((t) => t.ab === "CIN"), chase = teams[cin].roster.find((p) => p.name === "Ja'Marr Chase");
  let tgt = 0, all = 0;
  for (let i = 0; i < 120; i++) { const g = play(cin, (cin + 1 + (i % 31)) % 32); for (const l of Object.values(g.box.h)) all += l.tgt || 0; tgt += g.box.h[chase.id]?.tgt || 0; }
  const share = tgt / all;
  assert.ok(share > 0.25 && share < 0.35, `Chase target share ${share}`);
});

test("live play-by-play: calls work, games end, playoff games never tie", () => {
  const g = createGame(teams[0].side, teams[1].side, { rand });
  const calls = ["run_inside", "run_outside", "pass_quick", "pass_medium", "pass_deep", "run_screen", "pass_rpo", "scramble"];
  let n = 0;
  while (!g.done && n++ < 400) { const ev = step(g, g.poss === "h" ? calls[n % calls.length] : undefined); assert.ok(ev && ev.text); }
  assert.ok(g.done, "the game finishes");
  for (let i = 0; i < 300; i++) { const p = play(i % 32, (i * 5 + 3) % 32 === i % 32 ? (i + 1) % 32 : (i * 5 + 3) % 32, { playoff: true }); assert.notEqual(p.score.h, p.score.a); }
});

test("benching a starter at 0% hands his snaps to the next man up", async () => {
  const { positionSnaps, snapOrdered } = await import("../src/snaps.js");
  const qbs = [{ id: "w" }, { id: "m" }, { id: "d" }];
  assert.deepEqual(positionSnaps("QB", qbs, { w: 0 }), { w: 0, m: 100, d: 0 });
  assert.deepEqual(snapOrdered("QB", qbs, { d: 100 }).map((p) => p.id), ["d", "w", "m"]);
  assert.deepEqual(snapOrdered("QB", qbs).map((p) => p.id), ["w", "m", "d"]);
});
