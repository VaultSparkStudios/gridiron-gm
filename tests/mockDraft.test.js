import test from "node:test";
import assert from "node:assert/strict";
import { mockDraft, needBonus } from "../src/mockDraft.js";

test("mock draft: best on the board, nudged by need, each prospect once", () => {
  const cls = Array.from({ length: 80 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, pos: ["QB", "WR", "DL", "CB", "LT", "K"][i % 6], cons: { final: i + 1 } }));
  const strong = { roster: ["QB", "WR", "WR", "WR", "DL", "DL", "DL", "DL", "CB", "CB", "LT"].map((pos) => ({ pos, ovr: 88 })) };
  const needsQB = { roster: strong.roster.map((p) => (p.pos === "QB" ? { pos: "QB", ovr: 65 } : p)) };
  const teams = Array.from({ length: 32 }, (_, i) => (i === 1 ? needsQB : strong));
  const order = Array.from({ length: 40 }, (_, i) => ({ id: i, rd: i < 32 ? 1 : 2, overall: i + 1, owner: i % 32 }));
  const m = mockDraft({ order, cls, teams });
  assert.equal(m.length, 40);
  assert.equal(new Set(m.map((x) => x.player.id)).size, 40, "nobody twice");
  assert.ok(m.every((x) => x.player.pos !== "K" || x.pick.rd > 1), "no kickers in round 1");
  assert.equal(m[1].player.pos, "QB", "a QB-needy club takes a QB");
  assert.ok(needBonus(needsQB, "QB") > needBonus(strong, "QB"));
});
