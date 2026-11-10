import test from "node:test";
import assert from "node:assert/strict";
import { initTeams } from "../src/league.js";
import { faceOf, isFaceOf, clubYears } from "../src/faceOfFranchise.js";
import { openFreeAgency } from "../src/offseason.js";
import { evaluateTrade, closeCall } from "../src/trade.js";

const league = initTeams(0);
const club = (ab) => league.find((t) => t.ab === ab);

test("the real faces of their franchises", () => {
  assert.equal(faceOf(club("KC"))?.name, "Patrick Mahomes");
  assert.equal(faceOf(club("BUF"))?.name, "Josh Allen");
  assert.equal(faceOf(club("PIT"))?.name, "T.J. Watt");
  // one per club at most, never a lineman
  for (const t of league) { const f = faceOf(t); if (f) assert.ok(!["LT", "LG", "C", "RG", "RT", "K", "P"].includes(f.pos)); }
});

test("a league season elsewhere breaks the run; a draftee earns it after five seasons", () => {
  const kc = club("KC"), mahomes = faceOf(kc);
  assert.ok(clubYears(mahomes, "KC") >= 9);
  assert.equal(clubYears({ ...mahomes, sh: [{ y: 2026, tm: "LV" }, { y: 2027, tm: "KC" }] }, "KC"), 1);
  const kid = { id: "k1", name: "Made Up Star", pos: "WR", ovr: 90, age: 26, draftYr: 2027, draftPk: 5, draftTm: "NYG", sh: [2027, 2028, 2029, 2030].map((y) => ({ y, tm: "NYG" })) };
  const nyg = { ab: "NYG", roster: [kid] };
  assert.ok(!isFaceOf(kid, nyg));
  assert.ok(isFaceOf({ ...kid, sh: [...kid.sh, { y: 2031, tm: "NYG" }] }, { ab: "NYG", roster: [{ ...kid, sh: [...kid.sh, { y: 2031, tm: "NYG" }] }] }));
});

test("an aging face is re-signed even when the club is tight against the cap", () => {
  const kc = club("KC"), m = faceOf(kc);
  const old = { ...m, age: 37, ovr: 80, contract: 1, salary: 60, oh: [{ y: 2026, o: 94 }, { y: 2030, o: 85 }] };
  const roster = kc.roster.map((p) => (p.id === m.id ? old : p));
  // squeeze the cap so a normal 80-rated 37-year-old would never be kept
  for (let seed = 1; seed <= 5; seed++) {
    let s = seed; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const teams = league.map((t) => (t.ab === "KC" ? { ...t, roster: roster.map((p) => ({ ...p })) } : { ...t, roster: t.roster.map((p) => ({ ...p })) }));
    const r = openFreeAgency(teams, 0, 2026, rand, { cap: 250 });
    const k = r.teams.findIndex((t) => t.ab === "KC");
    assert.ok(r.teams[k].roster.some((p) => p.id === m.id), `seed ${seed}: Mahomes left Kansas City`);
  }
});

test("prying the face loose takes an overwhelming offer, and no close calls", () => {
  const kc = club("KC"), m = faceOf(kc);
  const fair = { ...m, id: "x", tradeVal: (m.tradeVal || 100) * 1.4 };
  const ev = evaluateTrade({ send: [fair], get: [m], them: kc, pick: () => 0 });
  assert.match(ev.why, /face of their franchise/);
  assert.ok(!ev.accept);
  assert.ok(!closeCall({ ...ev, gap: 1 }, [m], { mode: "rebuild", season: true, hour: 6, key: "k" }).ok);
});

test("an expiring veteran his club won't keep goes cheap in season; not in the offseason, not the face", () => {
  const vet = { id: "v", name: "Old Vet", pos: "WR", ovr: 86, age: 32, contract: 1, tradeVal: 40 };
  const them = { ab: "ZZZ", roster: [vet] };
  const ask = (p, season) => evaluateTrade({ sendPk: [], send: [{ id: "s", pos: "TE", age: 24, ovr: 70, tradeVal: 1 }], get: [p], them, pick: () => 0, season }).ask;
  assert.ok(ask(vet, true) < ask({ ...vet, contract: 3 }, true) * 0.6);
  assert.equal(ask(vet, false), ask({ ...vet, contract: 3 }, false));
  const kc = club("KC"), m = faceOf(kc);
  assert.match(evaluateTrade({ send: [], get: [{ ...m, contract: 1, age: 34 }], them: kc, pick: () => 0, season: true }).why, /face of their franchise/);
});
