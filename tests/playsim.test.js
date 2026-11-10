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
  // (these games skip the league calibration; in a calibrated league teams score ~22.5 a game, the NFL's ~23)
  assert.ok(mean > 19.5 && mean < 26.5, `points ${mean}`);
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
  // Over 16 seeds this averages about 0.82 and ranges from about 0.74 to 0.90, so a single seed is
  // held to 0.72.
  assert.ok(corr(off, pf.map((x, i) => x / gp[i])) > 0.72, `offense rating predicts points scored (${corr(off, pf.map((x, i) => x / gp[i])).toFixed(3)})`);
  // Points allowed are noisier than points scored: over 24 seeds this averages -0.84 and ranges from
  // about -0.73 to -0.93, so a single seed is held to -0.7.
  assert.ok(corr(def, pa.map((x, i) => x / gp[i])) < -0.7, `defense rating predicts points allowed (${corr(def, pa.map((x, i) => x / gp[i])).toFixed(3)})`);
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
  // the engine averages about 25% for him over hundreds of games; a 120-game sample swings a point or two
  assert.ok(share > 0.23 && share < 0.35, `Chase target share ${share}`);
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

// Down 2 late at their 15 on 4th and 1: a makeable kick takes the lead. A good head coach kicks
// every time; only a shaky one ever gambles, and rarely.
test("late, a field goal that ties or takes the lead is the call", () => {
  const trial = (hcR) => {
    let go = 0;
    for (let i = 0; i < 400; i++) {
      const g = createGame({ ...teams[0].side, hcR }, teams[1].side, { rand, playoff: true });
      Object.assign(g, { koNext: false, poss: "h", qtr: 4, clock: 300, yard: 85, down: 4, toGo: 1, score: { h: 17, a: 19 } });
      const ev = step(g);
      if (ev.type !== "fg" && ev.type !== "fg_miss") go++;
    }
    return go / 400;
  };
  assert.equal(trial(90), 0, "a 90-rated head coach kicks");
  const shaky = trial(55);
  assert.ok(shaky > 0 && shaky < 0.3, `a 55-rated coach gambles now and then (${shaky})`);
});

test("ahead with the clock nearly gone, the offense takes a knee", () => {
  const g = createGame(teams[0].side, teams[1].side, { rand });
  Object.assign(g, { koNext: false, poss: "h", qtr: 4, clock: 70, yard: 40, down: 1, toGo: 10, score: { h: 24, a: 20 }, to: { h: 3, a: 0 } });
  const ev = step(g);
  assert.ok(ev.kneel, `kneels (${ev.text})`);
});

test("with timeouts left, a defense within reach keeps the leader from kneeling it out", () => {
  const g = createGame(teams[0].side, teams[1].side, { rand });
  Object.assign(g, { koNext: false, poss: "h", qtr: 4, clock: 70, yard: 40, down: 1, toGo: 10, score: { h: 24, a: 20 }, to: { h: 3, a: 3 } });
  const ev = step(g);
  assert.ok(!ev.kneel, "not enough to kneel out");
});

test("a team behind late stops the clock with its timeouts", () => {
  let used = 0;
  for (let i = 0; i < 40; i++) {
    const g = createGame(teams[0].side, teams[1].side, { rand });
    Object.assign(g, { koNext: false, poss: "h", qtr: 4, clock: 100, yard: 50, down: 1, toGo: 10, score: { h: 17, a: 20 }, to: { h: 3, a: 3 } });
    const ev = step(g);
    if (ev.timeout === "h") used++;
  }
  assert.ok(used > 10, `uses its timeouts (${used}/40)`);
});

test("overtime: a first-possession field goal gives the other team the ball", () => {
  for (let i = 0; i < 50; i++) {
    const g = createGame(teams[0].side, teams[1].side, { rand, playoff: true });
    Object.assign(g, { koNext: false, poss: "h", qtr: 5, ot: true, otPoss: 1, clock: 800, yard: 80, down: 4, toGo: 8, score: { h: 20, a: 20 } });
    const ev = step(g);
    if (ev.type === "fg") { assert.equal(g.done, false, "the game goes on"); assert.equal(g.poss, "a", "the other team gets the ball"); return; }
  }
  assert.fail("never kicked");
});

test("the play-by-play names the matchup on big catches, and each play carries its personnel and package", async () => {
  const { initTeams, simGame, calibrateLeague } = await import("../src/league.js");
  const T = initTeams(-1); calibrateLeague(T);
  let notes = 0, plays = 0;
  for (let i = 0; i < 3; i++) { const r = simGame(T[i], T[i + 10], null, null, "clear", { dry: true, rec: true }); for (const e of r.game.pl) { plays++; if (/beating (the |CB1)/.test(e.x)) notes++; } }
  assert.ok(notes >= 3 && notes < plays * 0.2, `${notes} of ${plays}`);
});

test("personnel stats add up by grouping and package over a season", async () => {
  const { initTeams, simGame, calibrateLeague, addPersonnelStats } = await import("../src/league.js");
  const T = initTeams(-1); calibrateLeague(T);
  for (let i = 1; i <= 3; i++) simGame(T[0], T[i], null, null, "clear", {});
  const st = T[0].persSt, off = Object.values(st.off), def = Object.values(st.def);
  assert.ok(off.reduce((t, r) => t + r.n, 0) > 120 && def.reduce((t, r) => t + r.n, 0) > 120);
  for (const r of [...off, ...def]) assert.ok(r.ok <= r.n);
  addPersonnelStats(T[0], { persY: { 11: { n: 1, yds: 5, ok: 1 } } }, st.yr + 1);
  assert.deepEqual(T[0].persSt.off, { 11: { n: 1, yds: 5, ok: 1 } }, "a new season starts fresh");
});

test("situational packages: a club's short-yardage and 3rd-and-long calls override its identity on those snaps", async () => {
  const { situationOf } = await import("../src/personnel.js");
  const h = { ...teams[0].side, team: { ...teams[0].side.team, sit: { short: "13", long: "10", longD: "dime", shortD: "base" } } };
  const a = { ...teams[1].side, team: { ...teams[1].side.team, sit: { short: "13", long: "10", longD: "dime", shortD: "base" } } };
  const g = createGame(h, a, { rand });
  let short = 0, long = 0;
  for (let i = 0; i < 400 && !g.done; i++) {
    const s = situationOf({ down: g.down, toGo: g.toGo, yard: g.yard, qtr: g.qtr, clock: g.clock, lead: 1 });
    const ev = step(g);
    if (!ev.pers || s.twoMin) continue;
    if (s.short) { short++; assert.equal(ev.pers, "13"); assert.equal(ev.pkg, "base"); }
    else if (s.long) { long++; assert.equal(ev.pers, "10"); assert.equal(ev.pkg, "dime"); }
  }
  assert.ok(short + long > 3, `${short} short, ${long} long snaps`);
});
