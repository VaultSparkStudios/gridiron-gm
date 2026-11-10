import test from "node:test";
import assert from "node:assert/strict";
import { naturalRole, roleOvr, arrangeRoles, roleCard } from "../src/roles.js";
import { depthOrderFor } from "../src/depth.js";
import { offUnits, defUnits, wrOnField } from "../src/gamesim.js";
import { pickPers, pkgOdds, pkgShare, snapShape, OFF_SETS } from "../src/personnel.js";
import { teamNeeds } from "../src/needs.js";

const LB = (id, mpos, o) => ({ id, name: id, pos: "LB", mpos, ovr: 80, wt: o.wt, str: o.str, spd: o.spd, agi: o.agi ?? 78, posAttrs: { tackling: 80, coverage: o.cov, blitzing: 70, runFit: 80, instincts: o.ins ?? 78, pursuit: o.pur ?? 80, shedBlock: o.shed, zoneAwr: o.zone ?? 74 } });
// a 252-lb thumper built for SAM, a 222-lb runner built for WILL
const thumper = LB("sam", "SAM", { wt: 252, str: 86, spd: 80, cov: 58, shed: 86 });
const runner = LB("will", "WILL", { wt: 222, str: 62, spd: 92, cov: 84, shed: 60, pur: 92 });

test("each linebacker rates best at his natural role and loses more the worse his body fits", () => {
  assert.equal(naturalRole(thumper), "SAM");
  assert.equal(roleOvr(thumper, "SAM"), 80);
  assert.ok(roleOvr(thumper, "WILL") < 76, "a slow, heavy thumper is a poor WILL");
  assert.ok(roleOvr(runner, "SAM") < 76, "a light speed backer is a poor SAM");
  assert.ok(roleOvr(runner, "SAM") <= roleOvr(runner, "MIKE"), "the speed backer fits MIKE better than SAM");
});

test("nobody rates above his natural OVR at another role, and old saves without skills don't move", () => {
  for (const p of [thumper, runner]) for (const s of ["SAM", "MIKE", "WILL"]) assert.ok(roleOvr(p, s) <= p.ovr);
  const bare = { id: "x", pos: "LB", ovr: 77 };
  assert.equal(roleOvr(bare, "SAM"), 77);
});

test("the best arrangement puts each linebacker where he fits", () => {
  const mike = LB("mike", "MIKE", { wt: 236, str: 75, spd: 85, cov: 72, shed: 76, ins: 90, zone: 86 });
  const [s, m, w] = arrangeRoles("LB", [runner, mike, thumper]);
  assert.deepEqual([s.id, m.id, w.id], ["sam", "mike", "will"]);
});

test("a depth chart you set keeps your roles; an injured one's role goes to the best fit", () => {
  const mike = LB("mike", "MIKE", { wt: 236, str: 75, spd: 85, cov: 72, shed: 76, ins: 90, zone: 86 });
  const extra = LB("x", "SAM", { wt: 248, str: 84, spd: 81, cov: 60, shed: 84 });
  const roster = [thumper, mike, runner, extra];
  // your call: the speed backer at SAM
  const mine = depthOrderFor(roster, { LB: ["will", "mike", "sam", "x"] }, "LB");
  assert.deepEqual(mine.slice(0, 3).map((p) => p.id), ["will", "mike", "sam"]);
  const hurt = roster.filter((p) => p.id !== "sam");
  const after = depthOrderFor(hurt, { LB: ["sam", "mike", "will", "x"] }, "LB");
  assert.equal(after[0].id, "x", "the other thumper takes the SAM spot");
});

test("a tight end can split out to receiver: he leaves the tight end chart and plays at a receiver rating", () => {
  const te = { id: "te", name: "TE", pos: "TE", ovr: 90, spd: 86, agi: 80, ht_: 77, wt: 250, jmp: 85, posAttrs: { blocking: 64, receiving: 95, routeRun: 82, redZone: 90, passBlock: 60, yac: 80, seaming: 85, toughness: 85 } };
  const roster = [te, { id: "w1", pos: "WR", ovr: 85 }, { id: "w2", pos: "WR", ovr: 80 }, { id: "t2", pos: "TE", ovr: 70 }];
  const wr = depthOrderFor(roster, { WR: ["w1", "w2", "te"] }, "WR").map((p) => p.id);
  assert.ok(wr.includes("te"));
  assert.deepEqual(depthOrderFor(roster, { WR: ["w1", "w2", "te"] }, "TE").map((p) => p.id), ["t2"]);
  const card = roleCard(te);
  assert.ok(card[0][1] >= 80 && card[0][1] <= 90, `a receiving tight end is nearly as good out wide (${card[0][1]})`);
});

test("in a two-receiver set the best two play, a star slot man moving outside", () => {
  const slot = { id: "s", pos: "WR", ovr: 90, arch: "Slot", spd: 92, agi: 92, acc: 93, jmp: 85, ht_: 72, wt: 200, posAttrs: { routeRun: 92, catching: 90, separation: 92, release: 85, bodyCtrl: 85, yac: 88, deepSpd: 90, catchTraffic: 82 } };
  const x = { id: "x", pos: "WR", ovr: 74, ht_: 75, wt: 215, spd: 88, jmp: 88, posAttrs: { routeRun: 72, catching: 75, separation: 70, release: 78, bodyCtrl: 76, yac: 70, deepSpd: 86, catchTraffic: 80 } };
  const z = { id: "z", pos: "WR", ovr: 78, spd: 93, posAttrs: { routeRun: 78, catching: 78, separation: 80, release: 75, bodyCtrl: 75, yac: 75, deepSpd: 93, catchTraffic: 70 } };
  assert.ok(wrOnField([x, z, slot], 2).some((p) => p.id === "s"), "the 90 slot receiver plays in 12 personnel");
});

test("personnel: heavier groupings come out in short yardage, lighter ones on 3rd and long", () => {
  let seed = 3; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const mix = OFF_SETS.find((s) => s.key === "balanced").mix;
  const count = (sit) => { const c = {}; for (let i = 0; i < 4000; i++) { const p = pickPers(rand, mix, sit); c[p] = (c[p] || 0) + 1; } return c; };
  const short = count({ down: 3, toGo: 1, yard: 50 }), long = count({ down: 3, toGo: 9, yard: 50 });
  assert.ok((short[13] || 0) + (short[12] || 0) > (long[13] || 0) + (long[12] || 0) * 2);
  assert.ok((long[10] || 0) > (short[10] || 0));
});

test("defenses go base against heavy sets and nickel or dime against three and four receivers; NFL-like overall", () => {
  assert.ok(pkgOdds("13")[0] > 0.8 && pkgOdds("11")[1] > 0.7 && pkgOdds("10")[2] > 0.4);
  const s = pkgShare(0);
  assert.ok(s.base > 0.2 && s.base < 0.36 && s.nickel > 0.5 && s.dime > 0.06, JSON.stringify(s));
  assert.ok(pkgShare(0.22).base > s.base && pkgShare(-0.22).nickel > s.nickel, "a base or nickel lean moves snaps");
});

test("a two-tight-end identity plays its TE2 a lot more and its third receiver less", () => {
  const two = snapShape(OFF_SETS.find((s) => s.key === "twoTE").mix), spread = snapShape(OFF_SETS.find((s) => s.key === "spread").mix);
  assert.ok(two.TE[1] > 45 && spread.TE[1] < 20);
  assert.ok(two.WR[2] < 40 && spread.WR[2] > 75);
});

test("a two-tight-end club needs two tight ends and only two receivers", () => {
  const roster = [{ id: "w1", pos: "WR", ovr: 85 }, { id: "w2", pos: "WR", ovr: 84 }, { id: "t1", pos: "TE", ovr: 84 }];
  assert.ok(teamNeeds(roster, "twoTE").score.WR < teamNeeds(roster).score.WR);
  assert.ok(teamNeeds(roster, "twoTE").score.TE > teamNeeds(roster).score.TE);
});

test("units by package: base is stouter against the run, nickel better in coverage", () => {
  const P = (pos, n, ovr, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: `${pos}${i}`, pos, ovr, ...extra }));
  const roster = [...P("DL", 4, 80), ...P("LB", 3, 80, { posAttrs: { coverage: 55, zoneAwr: 60, tackling: 80 }, spd: 80 }), ...P("CB", 4, 80, { posAttrs: { tackling: 60 } }), ...P("S", 2, 80)];
  const order = (pos) => roster.filter((p) => p.pos === pos);
  const b = defUnits(order, "base"), n = defUnits(order, "nickel");
  assert.ok(b.runD > n.runD && n.passD > b.passD);
  const off = (pos) => [...P("QB", 1, 80), ...P("RB", 2, 80), ...P("WR", 3, 80), ...P("TE", 2, 80, { posAttrs: { blocking: 80, receiving: 60, passBlock: 70 } }), ...P("LT", 1, 80), ...P("LG", 1, 80), ...P("C", 1, 80), ...P("RG", 1, 80), ...P("RT", 1, 80)].filter((p) => p.pos === pos);
  assert.ok(offUnits(off, "12").run > offUnits(off, "11").run, "an extra tight end blocks for the run game");
});

test("role needs: a hole at nickel shows up as a need, weighted by how much the role plays; the filter finds the role", async () => {
  const { roleNeeds, roleFit, roleFilterMatch } = await import("../src/roleNeeds.js");
  const { snapShape, OFF_SETS } = await import("../src/personnel.js");
  const cb = (id, ovr, extra = {}) => ({ id, name: id, pos: "CB", ovr, ...extra });
  const roster = [cb("c1", 88), cb("c2", 86), cb("c3", 58)];
  const n = roleNeeds(roster);
  assert.ok(n.NB > 0.5 && n.OUT < 0.1, JSON.stringify(n));
  const base = snapShape(OFF_SETS.find((s) => s.key === "balanced").mix, 0.22);
  assert.ok(roleNeeds(roster, base).NB < n.NB, "a base-heavy defense plays its nickel less, so needs him less");
  assert.ok(roleFilterMatch({ pos: "LB", mpos: "SAM", ovr: 70, posAttrs: {} }, "R:SAM") && !roleFilterMatch({ pos: "LB", mpos: "MIKE", ovr: 70, posAttrs: {} }, "R:SAM"));
  assert.ok(roleFit({ pos: "LB", mpos: "SAM", ovr: 70 }, { SAM: 0.6 }) === 0.6);
});

test("role-shaped development: a season at SAM grows a speed backer's block shedding, not his coverage", async () => {
  const { roleGrowth } = await import("../src/roles.js");
  const { growAttrs } = await import("../src/league.js");
  const g = roleGrowth(runner.posAttrs, { SAM: 16 }, 24);
  assert.equal(g.kind, "SAM");
  assert.ok(g.nudge.shedBlock > 1.5 && g.nudge.pursuit < 0, JSON.stringify(g.nudge));
  assert.ok(roleGrowth(runner.posAttrs, { SAM: 16 }, 32).nudge.shedBlock < g.nudge.shedBlock / 2, "veterans adapt less");
  assert.equal(roleGrowth(runner.posAttrs, {}, 24), null);
  // over a few off-seasons at SAM he becomes a better SAM than the same player left at WILL
  let atSam = { ...runner, ss: { rl: { SAM: 17 } } }, atWill = { ...runner, ss: { rl: { WILL: 17 } } };
  for (let i = 0; i < 3; i++) { atSam = { ...atSam, ...growAttrs(atSam, 0, 24) }; atWill = { ...atWill, ...growAttrs(atWill, 0, 24) }; }
  assert.ok(roleOvr(atSam, "SAM") > roleOvr(atWill, "SAM"), `${roleOvr(atSam, "SAM")} vs ${roleOvr(atWill, "SAM")}`);
  assert.equal(atSam.grewAs.slot, "SAM");
});

test("games record which role each starter played", async () => {
  const { initTeams, simGame, calibrateLeague } = await import("../src/league.js");
  const T = initTeams(-1); calibrateLeague(T);
  for (let i = 0; i < 4; i++) simGame(T[i], T[i + 4], null, null, "clear", {});
  const lbs = T.slice(0, 8).flatMap((t) => t.roster).filter((p) => p.ss?.rl);
  const roles = new Set(lbs.flatMap((p) => Object.keys(p.ss.rl)));
  for (const r of ["SAM", "MIKE", "CB1", "NB", "X", "SLOT"]) assert.ok(roles.has(r), `${r} in ${[...roles]}`);
});

test("coordinators: running the OC's favorite identity helps, one outside his system costs; auto defense is the DC's call", async () => {
  const { coordFit } = await import("../src/personnel.js");
  const t = { coach: { oc: { scheme: "Power Run" }, dc: { scheme: "Cover 2" } } };
  assert.ok(coordFit(t, "heavy").off > 0.5 && coordFit(t, "spread").off < 0);
  assert.ok(coordFit(t, "twoTE").off > 0 && coordFit(t, "twoTE").off < 0.5);
  assert.ok(coordFit(t, "heavy").def > 0.5, "auto: he plays his nickel");
  assert.ok(coordFit({ ...t, defPkg: "base" }, "heavy").def < 0);
  assert.equal(coordFit({}, "heavy").off, 0, "no coordinator, no effect");
});

test("contract value by role: a SAM and a slot corner ask less than a MIKE and an outside corner of the same rating", async () => {
  const { askingPrice } = await import("../src/offseason.js");
  const sam = { ...thumper, age: 26, ovr: 84 }, mike = LB("m", "MIKE", { wt: 236, str: 75, spd: 85, cov: 72, shed: 76, ins: 90, zone: 86 });
  const m = { ...mike, age: 26, ovr: 84 };
  assert.ok(askingPrice(sam) < askingPrice(m) * 0.85, `${askingPrice(sam)} vs ${askingPrice(m)}`);
  const { naturalRole } = await import("../src/roles.js");
  const slotCB = { id: "n", pos: "CB", ovr: 84, age: 26, ht_: 69, agi: 95, acc: 95, spd: 89, jmp: 82, posAttrs: { zoneCov: 92, footwork: 92, playRec: 88, tackling: 85, manCov: 70, press: 55, recovery: 70, ballSkills: 70 } };
  const outCB = { id: "o", pos: "CB", ovr: 84, age: 26, ht_: 74, agi: 84, acc: 88, spd: 95, jmp: 92, posAttrs: { zoneCov: 74, footwork: 75, playRec: 72, tackling: 60, manCov: 92, press: 90, recovery: 88, ballSkills: 86 } };
  assert.deepEqual([naturalRole(slotCB), naturalRole(outCB)], ["NB", "OUT"]);
  assert.ok(askingPrice(slotCB) < askingPrice(outCB));
  const qb = { pos: "QB", ovr: 84, age: 26 };
  assert.equal(askingPrice(qb), askingPrice({ ...qb }), "other positions unchanged");
});

test("injury replacements by role: options are rated at the hurt starter's role, a receiving tight end can fill in at receiver", async () => {
  const { replacementOptions } = await import("../src/injuryCall.js");
  const mike = LB("mike", "MIKE", { wt: 236, str: 75, spd: 85, cov: 72, shed: 76, ins: 90, zone: 86 });
  const backupSam = LB("bsam", "SAM", { wt: 250, str: 85, spd: 79, cov: 58, shed: 85 });
  const backupWill = { ...LB("bwill", "WILL", { wt: 220, str: 60, spd: 93, cov: 85, shed: 58, pur: 92 }), ovr: 81 };
  const team = { roster: [{ ...thumper, injured: true }, mike, runner, { ...backupWill }, { ...backupSam, ovr: 77 }] };
  const o = replacementOptions(team, { pid: "sam", pos: "LB", slot: 0, role: "SAM" }, {}, null);
  assert.ok(!o.roster.some((p) => ["mike", "bwill"].includes(p.id)), "the other starters aren't options");
  assert.equal(o.role, "SAM");
  const s = o.roster.find((p) => p.id === "bsam"), w = o.roster.find((p) => p.id === "will");
  assert.ok(s.roleR > w.roleR, `the backup thumper (${s.roleR}) is a better SAM than the speed backer (${w.roleR})`);
  const te = { id: "te", name: "TE", pos: "TE", ovr: 90, spd: 86, agi: 80, ht_: 77, wt: 250, jmp: 85, posAttrs: { blocking: 64, receiving: 95, routeRun: 82, redZone: 90, passBlock: 60, yac: 80, seaming: 85, toughness: 85 } };
  const wr = (id, ovr) => ({ id, name: id, pos: "WR", ovr });
  const r = replacementOptions({ roster: [wr("w1", 85), wr("w2", 80), { ...wr("w3", 82), injured: true }, wr("w4", 62), te] }, { pid: "w3", pos: "WR", slot: 2, role: "SLOT" }, {}, null);
  assert.ok(r.roster.some((p) => p.id === "te") && r.bestId === "te", JSON.stringify(r.roster.map((p) => [p.id, p.roleR])));
});

// ---------- safeties: FS and SS ----------
// Derwin James's build (a 215-lb box safety who hits) and Jessie Bates's (a rangy centerfielder)
const SAF = (id, mpos, o) => ({ id, name: id, pos: "S", mpos, ovr: o.ovr, wt: o.wt, str: o.str, spd: o.spd, jmp: 88, posAttrs: { range: o.spd, runSupport: o.run, coverage: o.cov, tackling: o.tkl, ballHawk: o.hawk, blitzing: o.blitz, comms: 80, versatility: 80 } });
const box = SAF("box", "SS", { ovr: 92, wt: 216, str: 72, spd: 88, run: 92, cov: 74, tkl: 86, hawk: 62, blitz: 78 });
const deep = SAF("deep", "FS", { ovr: 92, wt: 198, str: 60, spd: 93, run: 72, cov: 90, tkl: 72, hawk: 90, blitz: 45 });

test("safeties have free and strong roles, rated on what each asks for", () => {
  assert.equal(naturalRole(box), "SS"); assert.equal(naturalRole(deep), "FS");
  // each is his own OVR at home, and a lot worse at the job he isn't built for
  assert.equal(roleOvr(box, "SS"), 92); assert.equal(roleOvr(deep, "FS"), 92);
  assert.ok(roleOvr(box, "FS") <= 88, `box safety deep: ${roleOvr(box, "FS")}`);
  assert.ok(roleOvr(deep, "SS") <= 86, `centerfielder in the box: ${roleOvr(deep, "SS")}`);
  // a safety with no Madden label is placed by his skills
  assert.equal(naturalRole({ ...box, mpos: undefined }), "SS");
  assert.equal(naturalRole({ ...deep, mpos: undefined }), "FS");
});

test("the depth chart puts each safety where he fits: FS first, then SS", () => {
  // given in the wrong order, they're arranged by fit
  const [fs, ss] = arrangeRoles("S", [box, deep]);
  assert.equal(fs.id, "deep"); assert.equal(ss.id, "box");
  const order = depthOrderFor([box, deep], {}, "S");
  assert.equal(order[0].id, "deep");
  assert.deepEqual(roleCard(box).map(([k]) => k), ["SS", "FS"]);
});

test("draft: a real free or strong safety prospect's skills match his label", async () => {
  const { genRealDC, REAL_DC_YEARS } = await import("../src/league.js");
  for (const yr of REAL_DC_YEARS) for (const p of genRealDC(yr)) {
    if (p.pos !== "S" || !p.real || !p.mpos) continue;
    assert.equal(naturalRole({ ...p, mpos: undefined }), p.mpos, `${yr} ${p.name}`);
  }
});
