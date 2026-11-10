import test from "node:test";
import assert from "node:assert/strict";
import { offseasonSnapshot, offseasonStories } from "../src/offseasonNews.js";

const team = (name, roster, hc) => ({ city: "City", name, roster, coach: { hc: { name: hc } } });
const pl = (id, o) => ({ id, name: `Player ${id}`, pos: "QB", ovr: 80, age: 28, contract: 1, salary: 10, ...o });

test("signings, trades, departures and hires come from what changed since the season ended", () => {
  const teams = [team("A", [pl(1, { salary: 30 }), pl(2, { contract: 3 }), pl(3)], "Coach A"), team("B", [], "Coach B")];
  const snap = offseasonSnapshot(teams, 2026);
  // free agency: 1 (expiring) signs with B, 2 (under contract) is traded to B
  const now = [team("A", [pl(3)], "Coach A"), team("B", [pl(1, { salary: 30, contract: 4 }), pl(2, { contract: 3 })], "Coach New")];
  const fa = [pl(9, { ovr: 88 })];
  const st = offseasonStories({ snap, teams: now, fa, ui: 0, phase: "freeagency" });
  assert.equal(st[0].kind, "sign");
  assert.match(st[0].head, /Player 1 .* signs with the B/);
  assert.ok(st.some((s) => s.kind === "trade" && /Player 2/.test(s.head)));
  assert.ok(st.some((s) => s.kind === "market" && /Player 9/.test(s.head)));
  assert.ok(!st.some((s) => s.kind === "coach"), "coaching news waits for the preseason");
  const pre = offseasonStories({ snap, teams: now, ui: 0, phase: "preseason" });
  assert.ok(pre.some((s) => s.kind === "coach" && /Coach New/.test(s.head)));
  assert.equal(new Set(pre.map((s) => s.id)).size, pre.length, "ids are unique");
});

test("the draft: number one overall and your first pick", () => {
  const teams = [team("A", [], "x"), team("B", [], "y")];
  const snap = offseasonSnapshot(teams, 2026);
  teams[1].roster.push(pl(5, { draftYr: 2026, draftPk: 1, draftRd: 1 }));
  teams[0].roster.push(pl(6, { draftYr: 2026, draftPk: 12, draftRd: 1 }));
  const st = offseasonStories({ snap, teams, ui: 0, phase: "draft" });
  assert.ok(st.some((s) => s.kind === "draft1" && /Player 5/.test(s.head)));
  assert.ok(st.some((s) => s.kind === "draftMine" && s.mine));
  assert.deepEqual(offseasonStories({ snap: null, teams, ui: 0, phase: "draft" }), []);
});
