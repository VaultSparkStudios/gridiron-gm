import test from "node:test";
import assert from "node:assert/strict";
import {
  newScouting, hireScout, releaseScout, swapScoutRoles, creditWeeks, startScoutingYear, coverage, scoutProspect, prospectRead,
  rankClass, csRank, combineInvites, runCombine, interviewProspect, pickGrade, classGrade, toggleList, moveOnList, listIds,
  autoPickFrom, aiDraftScore, loadScouting, rollDev, scoutGroup, SCOUT_PTS_START, COMBINE_INVITES,
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

test("a new staff has two major and two minor scouts on four different groups, and points to spend", () => {
  const sc = newScouting(2026);
  assert.ok(sc.major && sc.minor && sc.major2 && sc.minor2);
  assert.equal(new Set([sc.major, sc.major2, sc.minor, sc.minor2].map((x) => x.group)).size, 4);
  assert.equal(sc.pts, SCOUT_PTS_START);
  assert.equal(sc.pool.length, 14);
});

test("staff changes only in the preseason and free agency; both scouts can work one group", () => {
  const sc = newScouting(2026);
  const sameAsMinor = sc.pool.find((s) => s.group === sc.minor.group);
  assert.equal(hireScout(sc, "regular", sameAsMinor.id, "major").ok, false);
  const dbl = hireScout(sc, "preseason", sameAsMinor.id, "major");
  assert.ok(dbl.ok, "double coverage is allowed");
  assert.equal(dbl.sc.major.group, dbl.sc.minor.group);
  const other = sc.pool.find((s) => s.group !== sc.minor.group);
  const r = hireScout(sc, "preseason", other.id, "major");
  assert.ok(r.ok);
  assert.equal(r.sc.major.id, other.id);
  assert.ok(r.sc.pool.some((s) => s.id === sc.major.id), "the old scout goes back to the pool");
  assert.equal(releaseScout(r.sc, "freeagency", "minor").sc.minor, null);
  assert.equal(swapScoutRoles(r.sc, "preseason").sc.major.id, r.sc.minor.id);
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
  sc.major = { ...sc.major, group: "QB", trait: null };
  sc.minor = { ...sc.minor, group: "DB", trait: null };
  const qb = rankClass([prospect("QB", 70, 85)])[0];
  let r = scoutProspect(sc, "regular", qb, teams, 2026, 2026);
  r = scoutProspect(r.sc, "regular", r.p, teams, 2026, 2026);
  assert.equal(r.p.scout.exact, true);
  assert.equal(r.p.scout.eOvr, 70);
  assert.equal(r.p.scout.ePot, 85);
  assert.equal(r.p.scoutLvl, 2);
  assert.ok(r.p.scout.dev, "major workup reveals the development trait");
  assert.equal(r.sc.pts, 97);
  assert.equal(scoutProspect(r.sc, "regular", r.p, teams, 2026, 2026).ok, false, "nothing left to scout");

  const k = rankClass([prospect("K", 70, 80)])[0];
  let o = scoutProspect(sc, "regular", k, teams, 2026, 2026);
  o = scoutProspect(o.sc, "regular", o.p, teams, 2026, 2026);
  assert.equal(o.p.scout.exact, false);
  assert.equal(o.p.scoutLvl, 1);
  assert.equal(o.p.scout.dev, null);
});

test("reads: ?? without coverage, a letter grade for covered groups, and stable between calls", () => {
  const sc = newScouting(2026);
  sc.major = { ...sc.major, group: "QB" };
  sc.minor = { ...sc.minor, group: "DB" };
  const cls = rankClass([prospect("QB"), prospect("RB")]);
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
  assert.ok(r.sc.pts > sc.pts);
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
  assert.equal(sc.major.group, "QB");
  assert.notEqual(sc.minor.group, "QB");
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

test("double coverage reads a group sharper than one scout and leaves the rest to the office", async () => {
  const { coverage, scoutEval } = await import("../src/scouting.js");
  const major = { id: "a", group: "DB", eval: 70, trait: null }, minor = { id: "b", group: "DB", eval: 74, trait: "projector" };
  const sc = { major, minor };
  const cb = { pos: "CB", bio: {} }, wr = { pos: "WR", bio: {} };
  const c = coverage(sc, cb);
  assert.equal(c.role, "major"); assert.equal(c.second.id, "b");
  assert.ok(scoutEval(c.scout, cb, c.second) > Math.max(major.eval, minor.eval));
  assert.equal(coverage(sc, wr).role, "office");
});

test("second major and minor scouts: each covers its own group, and stacking three on one group reads sharpest", async () => {
  const { coverage, scoutEval, hireScout } = await import("../src/scouting.js");
  const mk = (id, group, ev) => ({ id, name: id, group, eval: ev, trait: null });
  const sc = { major: mk("a", "QB", 70), major2: mk("b", "DB", 72), minor: mk("c", "OL", 66), minor2: mk("d", "DB", 80) };
  const cb = { pos: "CB", bio: {} };
  assert.equal(coverage(sc, { pos: "QB", bio: {} }).role, "major");
  assert.equal(coverage(sc, { pos: "LT", bio: {} }).role, "minor");
  const c = coverage(sc, cb);
  assert.equal(c.role, "major"); assert.equal(c.scout.id, "b"); assert.equal(c.second.id, "d");
  const three = { ...sc, major: mk("a", "DB", 70) };
  const c3 = coverage(three, cb);
  assert.equal(c3.others.length, 2);
  assert.ok(scoutEval(c3.scout, cb, c3.others) > scoutEval(c.scout, cb, c.others));
  const fresh = newScouting(2026);
  const r = hireScout(fresh, "preseason", fresh.pool[0].id, "minor2");
  assert.ok(r.ok); assert.equal(r.sc.minor2.id, fresh.pool[0].id);
});
