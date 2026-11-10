import { test } from "node:test";
import assert from "node:assert/strict";
import { initTeams, simGame, setUserLineup } from "../src/league.js";
import { seasonHonors, honorsById, SLOTS } from "../src/honors.js";
import { legacyOf } from "../src/history.js";

test("All-Pro and Pro Bowl teams are picked from a season's play, position by position", () => {
  const teams = initTeams(0); setUserLineup({}, {});
  const plan = { off: "balanced", def: "balanced" };
  for (let w = 0; w < 12; w++) for (let i = 0; i < 16; i++) simGame(teams[(i + w) % 32], teams[(i + w + 16) % 32], plan, plan);
  const h = seasonHonors(teams);
  const total = SLOTS.reduce((s, x) => s + x.all, 0);
  assert.equal(h.ap1.length, total);
  assert.equal(h.ap2.length, total);
  for (const c of ["AFC", "NFC"]) assert.equal(h.pb[c].length, SLOTS.reduce((s, x) => s + x.pb, 0));
  assert.ok(h.pb.AFC.every((e) => teams[e.ti].c === "AFC"));
  const ids = new Set([...h.ap1, ...h.ap2].map((e) => e.pid));
  assert.equal(ids.size, total * 2, "nobody on both All-Pro teams");
  const qb = h.ap1.find((e) => e.slot === "QB"), best = honorsById(h);
  assert.equal(best[qb.pid], "ap1");
});

test("honors count toward a legacy", () => {
  const p = { id: 1, name: "X", pos: "WR", ovr: 85, cs: {}, ss: {}, draftPk: 10, draftYr: 2026 };
  const a = legacyOf(p, { yr: 2030 }).legacy, b = legacyOf({ ...p, honors: [{ yr: 2027, k: "ap1" }, { yr: 2028, k: "pb" }] }, { yr: 2030 }).legacy;
  assert.equal(b - a, 8);
});
