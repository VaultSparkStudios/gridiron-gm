import test from "node:test";
import assert from "node:assert/strict";
import { initTeams, calibrateLeague } from "../src/league.js";
import { depthOrderFor } from "../src/depth.js";
import { scoutReport, edgeWord } from "../src/scoutReport.js";

const T = initTeams(-1); calibrateLeague(T);
const ord = (t) => { const m = {}; return (pos) => (m[pos] ||= depthOrderFor(t.roster, {}, pos)); };
const f = (ab) => T.find((t) => t.ab === ab);

test("the scouting report ranks your identities and leans against this opponent and names matchups", () => {
  const r = scoutReport(f("NYG"), f("DAL"), ord(f("NYG")), ord(f("DAL")));
  assert.equal(r.off.length, 5); assert.equal(r.def.length, 3);
  assert.ok(r.off[0].v >= r.off[4].v && r.def[0].v <= r.def[2].v);
  assert.ok(r.notes.length >= 1 && r.notes.length <= 4);
  for (const n of r.notes) assert.ok(!/\b(II|III|IV|Jr|Sr)\b \(|\b(CB1|nickel|slot) (II|III|Jr|Sr)\b/.test(n.text), `a name suffix used as a last name: ${n.text}`);
  const sh = r.opp.pk; assert.ok(Math.abs(sh.base + sh.nickel + sh.dime - 1) < 1e-6);
});

test("a heavy offense is scouted as heavy, and a weak nickel is flagged against a good slot receiver", () => {
  const det = f("DET"), me = f("SF");
  const heavyDet = { ...det, personnel: "heavy" };
  const r = scoutReport(me, heavyDet, ord(me), ord(heavyDet));
  assert.ok(r.opp.heavy >= 0.5 && r.notes.some((n) => /heavy sets/.test(n.text)));
  // their nickel made weak
  const nbId = ord(det)("CB")[2].id;
  const weak = { ...det, roster: det.roster.map((p) => (p.id === nbId ? { ...p, ovr: 55, posAttrs: Object.fromEntries(Object.entries(p.posAttrs || {}).map(([k, v]) => [k, v - 25])) } : p)) };
  const r2 = scoutReport(me, weak, ord(me), ord(weak));
  assert.ok(r2.notes.some((n) => /attack the slot/.test(n.text)), JSON.stringify(r2.notes));
});

test("edges in words: noise is 'about even'", () => {
  assert.equal(edgeWord(0.01), "about even"); assert.equal(edgeWord(0.05), "a slight edge"); assert.equal(edgeWord(0.2), "a clear edge");
});
