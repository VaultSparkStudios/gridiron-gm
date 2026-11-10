import test from "node:test";
import assert from "node:assert/strict";
import {
  newScouting, hireScout, releaseScout, swapScoutRoles, creditWeeks, startScoutingYear, coverage, scoutProspect, prospectRead,
  rankClass, csRank, combineInvites, runCombine, interviewProspect, privateWorkout, PRIVATE_WORKOUTS, pickGrade, classGrade, toggleList, moveOnList, listIds,
  autoPickFrom, aiDraftScore, csScore, kpValue, loadScouting, rollDev, scoutGroup, SCOUT_PTS_START, COMBINE_INVITES, areasOf, uncovered,
} from "../src/scouting.js";

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K"];
const ATTRS = { QB: ["armStr", "accuracy", "pocketAwr", "decisions"], CB: ["manCov", "zoneCov", "press", "ballSkills"] };
let n = 0;
function prospect(pos = POS[n % POS.length], ovr = 60 + (n % 20), pot = ovr + (n % 15)) {
  n++;
  const keys = ATTRS[pos] || ["a1", "a2", "a3", "a4"];
  return {
    id: `p${n}`, name: `Prospect ${n}`, pos, age: 21, ovr, pot, trueOvr: ovr, truePot: pot, spd: 70,
    posAttrs: Object.fromEntries(keys.map((k, i) => [k, ovr + i * 2 - 3])), bio: { college: n % 3 ? "Alabama" : "Toledo" }, scoutLvl: 0, cs: {},
  };
}
const fakeCombine = (p) => ({ fortyYd: 4.4 + (p.id.length % 5) * 0.05, bench: 20, vert: 34, broad: 120, threeCone: 6.9, shuttle: 4.2 });
const teams = [{ ab: "NYG", roster: [{ id: "v1", name: "Vet QB", pos: "QB", ovr: 80, posAttrs: { armStr: 82, accuracy: 79, pocketAwr: 77, decisions: 80 }, spd: 60 }] }];

test("a new staff has two major and two minor scouts covering all six regions, and points to spend", () => {
  const sc = newScouting(2026);
  assert.ok(sc.major && sc.minor && sc.major2 && sc.minor2);
  assert.deepEqual(uncovered(sc), []);
  assert.equal(sc.pts, SCOUT_PTS_START);
  assert.equal(sc.pool.length, 14);
  assert.ok(sc.pool.every((x) => x.group), "every scout has a specialty");
});

test("staff changes only in the preseason and free agency; a new hire takes over the job's regions", () => {
  const sc = newScouting(2026);
  const other = sc.pool[0];
  assert.equal(hireScout(sc, "regular", other.id, "major").ok, false);
  const r = hireScout(sc, "preseason", other.id, "major");
  assert.deepEqual(areasOf(r.sc).major, areasOf(sc).major);
  assert.ok(r.ok);
  assert.equal(r.sc.major.id, other.id);
  assert.ok(r.sc.pool.some((s) => s.id === sc.major.id), "the old scout goes back to the pool");
  assert.equal(releaseScout(r.sc, "freeagency", "minor").sc.minor, null);
  const sw = swapScoutRoles(r.sc, "preseason").sc;
  assert.equal(sw.major.id, r.sc.minor.id);
  assert.equal(areasOf(sw).major[0], areasOf(r.sc).minor[0], "he keeps his region and picks up a second");
  assert.equal(areasOf(sw).minor.length, 1);
});

test("points arrive weekly, catch up after a sim-all, and reset each year", () => {
  let sc = { ...newScouting(2026), major: null, minor: null, major2: null, minor2: null };
  sc = creditWeeks(sc, 3);
  assert.equal(sc.pts, SCOUT_PTS_START + 3);
  sc = creditWeeks(sc, 18);
  assert.equal(sc.pts, SCOUT_PTS_START + 18);
  assert.equal(creditWeeks(sc, 18).pts, sc.pts, "no double credit");
  assert.equal(startScoutingYear(sc, 2027).pts, SCOUT_PTS_START);
});

test("the board is in consensus order and scouting never reorders it", () => {
  const cls = rankClass(Array.from({ length: 60 }, () => prospect()));
  const order = cls.map((p) => p.id);
  cls.forEach((p, i) => assert.equal(csRank(p), i + 1));
  let sc = { ...newScouting(2026), pts: 100 };
  const target = cls.find((p) => coverage(sc, p).role === "major") || cls[0];
  const r1 = scoutProspect(sc, "regular", target, teams, 2026, 2026);
  assert.ok(r1.ok);
  cls[cls.indexOf(target)] = r1.p;
  assert.deepEqual(cls.map((p) => p.id), order);
});

test("only the major scout's full workup is exact; the office never is", () => {
  let sc = { ...newScouting(2026), pts: 100 };
  sc.major = { ...sc.major, trait: null };
  sc.areas = { major: ["SEC", "B1G"] };
  const qb = rankClass([{ ...prospect("QB", 70, 85), bio: { college: "Alabama" } }])[0];
  let r = scoutProspect(sc, "regular", qb, teams, 2026, 2026);
  r = scoutProspect(r.sc, "regular", r.p, teams, 2026, 2026);
  assert.equal(r.p.scout.exact, true);
  assert.equal(r.p.scout.eOvr, 70);
  assert.equal(r.p.scout.ePot, 85);
  assert.equal(r.p.scoutLvl, 2);
  assert.ok(r.p.scout.dev, "major workup reveals the development trait");
  assert.equal(r.sc.pts, 97);
  assert.equal(scoutProspect(r.sc, "regular", r.p, teams, 2026, 2026).ok, false, "nothing left to scout");

  const k = rankClass([{ ...prospect("K", 70, 80), bio: { college: "Montana" } }])[0];
  let o = scoutProspect(sc, "regular", k, teams, 2026, 2026);
  o = scoutProspect(o.sc, "regular", o.p, teams, 2026, 2026);
  assert.equal(o.p.scout.exact, false);
  assert.equal(o.p.scoutLvl, 1);
  assert.equal(o.p.scout.dev, null);
});

test("reads: ?? without coverage, a letter grade in covered regions, and stable between calls", () => {
  const sc = newScouting(2026);
  const cls = rankClass([{ ...prospect("QB"), bio: { college: "Georgia" } }, { ...prospect("RB"), bio: { college: "Villanova" } }]);
  const qb = cls.find((p) => p.pos === "QB");
  const rb = cls.find((p) => p.pos === "RB");
  assert.match(prospectRead(sc, qb).pot, /^[A-D]/);
  assert.equal(prospectRead(sc, rb).pot, "??");
  assert.deepEqual(prospectRead(sc, qb), prospectRead(sc, qb));
});

test("scouting only works on the upcoming class and not after the draft", () => {
  const sc = { ...newScouting(2026), pts: 10 };
  const p = rankClass([prospect()])[0];
  assert.equal(scoutProspect(sc, "regular", p, teams, 2027, 2026).ok, false);
  assert.equal(scoutProspect(sc, "freeagency", p, teams, 2026, 2026).ok, false);
});

test("the Combine invites the top of the board, grades by position, and publishes final ranks", () => {
  const cls = rankClass(Array.from({ length: 240 }, () => prospect()));
  const inv = combineInvites(cls);
  assert.equal(inv.size, COMBINE_INVITES);
  for (const p of cls) p.combine = inv.has(p.id) ? fakeCombine(p) : null;
  const sc = newScouting(2026);
  const r = runCombine(sc, cls);
  assert.equal(r.sc.pts, r.bonus, "the season's leftover points expire: only the Combine budget is left");
  assert.equal(r.expired, sc.pts);
  assert.ok(r.sc.interviewsLeft >= 4);
  assert.ok(cls.every((p) => p.cons.final));
  cls.forEach((p, i) => assert.equal(csRank(p), i + 1));
  assert.ok(cls.filter((p) => p.combine).every((p) => /^[A-D]/.test(p.combGrade)));
  assert.ok(cls.filter((p) => !p.combine).every((p) => p.combGrade === null));
  assert.ok(r.buzz.length > 0);

  const invitee = cls.find((p) => p.combine);
  const i1 = interviewProspect(r.sc, "combine", invitee);
  assert.ok(i1.ok);
  assert.equal(i1.sc.interviewsLeft, r.sc.interviewsLeft - 1);
  assert.equal(interviewProspect(i1.sc, "combine", i1.p).ok, false);
  assert.equal(interviewProspect(r.sc, "draft", invitee).ok, false);
});

test("some early names test poorly and fall; interviews tell a real concern from a fluke", () => {
  let real = 0, fluke = 0, fell = 0, overrated = 0;
  for (let k = 0; k < 6; k++) {
    const cls = rankClass(Array.from({ length: 240 }, () => prospect()));
    const inv = combineInvites(cls);
    for (const p of cls) p.combine = inv.has(p.id) ? fakeCombine(p) : null;
    const r = runCombine(newScouting(2026), cls);
    const dips = cls.filter((p) => p.combDip);
    assert.ok(dips.length >= 3 && dips.length <= 6, `a handful each year (${dips.length})`);
    for (const p of dips) {
      assert.ok(p.cons.mid <= 64, "early names");
      if (p.cons.final > p.cons.mid) fell++;
      const i = interviewProspect({ ...r.sc, interviewsLeft: 9 }, "combine", p);
      if (p.combDip === "real") { real++; assert.ok(i.p.scout.intv.bad[0].startsWith("About the Combine")); assert.ok(csScore(p) > kpValue(p, p.truePot * 0.78 + p.trueOvr * 0.22)); overrated++; }
      else { fluke++; assert.ok(i.p.scout.intv.good[0].startsWith("About the Combine")); }
    }
    // a second run (a reload) doesn't knock them down again
    const before = dips.map((p) => JSON.stringify(p.combine));
    runCombine(newScouting(2026), cls);
    assert.deepEqual(dips.map((p) => JSON.stringify(p.combine)), before);
  }
  assert.ok(real > 0 && fluke > 0);
  assert.ok(fell >= (real + fluke) * 0.7, `most of them slide (${fell}/${real + fluke})`);
});

test("private workouts: Combine week only, a full workup for free, a few a year", () => {
  const cls = rankClass(Array.from({ length: 240 }, () => prospect()));
  const inv = combineInvites(cls);
  for (const p of cls) p.combine = inv.has(p.id) ? fakeCombine(p) : null;
  const r = runCombine(newScouting(2026), cls);
  assert.equal(r.sc.workoutsLeft, PRIVATE_WORKOUTS);
  const p = cls.find((x) => x.combine && (x.scout?.lvl || 0) < 2);
  const w = privateWorkout(r.sc, "combine", p, []);
  assert.ok(w.ok);
  assert.equal(w.p.scout.lvl, 2);
  assert.equal(w.sc.pts, r.sc.pts, "costs no scouting points");
  assert.equal(w.sc.workoutsLeft, PRIVATE_WORKOUTS - 1);
  assert.equal(privateWorkout(w.sc, "combine", w.p, []).ok, false, "already fully scouted");
  assert.equal(privateWorkout(r.sc, "draft", p, []).ok, false, "only during Combine week");
  let sc = r.sc;
  for (const x of cls.filter((q) => q.combine).slice(0, PRIVATE_WORKOUTS + 1)) { const t = privateWorkout(sc, "combine", x, []); if (t.ok) sc = t.sc; }
  assert.equal(sc.workoutsLeft, 0);
});

test("pick grades follow value against the consensus board", () => {
  assert.equal(pickGrade(30, 5), "A+");
  assert.equal(pickGrade(10, 10), "B+");
  assert.equal(pickGrade(5, 60), "D");
  assert.equal(classGrade(["A", "B", "C"]), "B");
});

test("your list: toggle, reorder, and the clock picks from it first", () => {
  const cls = rankClass(Array.from({ length: 5 }, () => prospect()));
  let sc = newScouting(2026);
  sc = toggleList(sc, 2026, cls[3].id);
  sc = toggleList(sc, 2026, cls[4].id);
  sc = moveOnList(sc, 2026, cls[4].id, -1);
  assert.deepEqual(listIds(sc, 2026), [cls[4].id, cls[3].id]);
  assert.equal(autoPickFrom(sc, 2026, cls).id, cls[4].id);
  assert.equal(autoPickFrom(newScouting(2026), 2026, cls).id, cls[0].id);
});

test("AI teams mostly follow the board", () => {
  const cls = rankClass(Array.from({ length: 100 }, () => prospect()));
  const best = [...cls].sort((a, b) => aiDraftScore(b) - aiDraftScore(a))[0];
  assert.ok(csRank(best) <= 25, `AI took consensus #${csRank(best)}`);
});

test("old saves get a staff, ranks, and keep their old reports", () => {
  const p1 = { ...prospect("QB", 72, 88), scoutLvl: 2, scoutedOvr: 73, scoutedPot: 86 };
  const p2 = { ...prospect("CB", 65, 75), scoutLvl: 1, scoutedOvr: 63, scoutedPot: 77 };
  const p3 = prospect("RB");
  const d = { yr: 2026, wk: 5, sp: "regular", teams, dc: { 2026: [p1, p2, p3] }, myScout: { name: "Old Scout", evaluation: 80, accuracy: 70, trait: "Eye for QBs" } };
  const sc = loadScouting(d);
  assert.equal(sc.major.name, "Old Scout");
  const roadWarrior = [sc.major, sc.major2, sc.minor, sc.minor2].some((x) => x?.trait === "workhorse");
  assert.ok(sc.major2 && sc.minor2, "old saves get the second major and minor scouts");
  assert.equal(sc.pts, SCOUT_PTS_START + 5 + (roadWarrior ? 1 : 0));
  const [a, b, c] = ["p", "p", "p"].map((_, i) => d.dc[2026].find((x) => x.id === [p1, p2, p3][i].id));
  assert.equal(a.scout.exact, true);
  assert.equal(a.scout.ePot, 88);
  assert.equal(b.scout.lvl, 1);
  assert.equal(b.scout.exact, false);
  assert.equal(c.scout.lvl, 0);
  assert.ok(d.dc[2026].every((p) => p.cons?.mid && p.dev));
});

test("development traits are fixed per player and position groups map correctly", () => {
  assert.equal(rollDev("abc", 80), rollDev("abc", 80));
  assert.equal(scoutGroup("TE"), "REC");
  assert.equal(scoutGroup("RG"), "OL");
  assert.equal(scoutGroup("S"), "DB");
  assert.equal(scoutGroup("K"), "ST");
});

test("doubling up on a region reads it sharper than one scout and leaves the rest to the office", async () => {
  const { coverage, scoutEval } = await import("../src/scouting.js");
  const mk = (id, ev) => ({ id, name: id, eval: ev, trait: null });
  const sc = { major: mk("a", 70), minor: mk("b", 74), areas: { major: ["SEC", "B1G"], minor: ["SEC"] } };
  const bama = { pos: "CB", bio: { college: "Alabama" } }, osu = { pos: "WR", bio: { college: "Ohio State" } };
  const c = coverage(sc, bama);
  assert.equal(c.role, "major"); assert.equal(c.second.id, "b");
  assert.ok(scoutEval(c.scout, bama, c.second) > Math.max(70, 74));
  assert.equal(coverage(sc, osu).role, "major");
  assert.equal(coverage(sc, osu).second, undefined);
  assert.equal(coverage(sc, { pos: "QB", bio: { college: "Clemson" } }).role, "office", "the empty jobs' regions go to the office");
});

test("points no longer cap out mid-season", () => {
  const sc = creditWeeks({ pts: 8, wkPaid: 0 }, 17);
  assert.equal(sc.pts, 25);
});

test("the college stock watch moves the board once per checkpoint", async () => {
  const { stockWatch } = await import("../src/scouting.js");
  const cls = Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, name: `P ${i}`, pos: "WR", truePot: 70 + (i % 20), trueOvr: 60, bio: { college: "State" }, cons: { score: 80 - i * 0.3, mid: i + 1 } }));
  const news = stockWatch(cls, 2027, 4);
  assert.equal(news.length, 10);
  assert.ok(news.every((n) => n.from !== undefined && n.to >= 1));
  assert.ok(cls.every((p) => p.cons.now >= 1 && p.cons.mid >= 1));
  assert.equal(stockWatch(cls, 2027, 4).length, 0); // not twice for the same week
});
