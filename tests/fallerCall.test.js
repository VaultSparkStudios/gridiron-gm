import { test } from "node:test";
import assert from "node:assert/strict";
import { fallerCall, tradeDownOffers } from "../src/draftTrade.js";

const teams = Array.from({ length: 32 }, (_, i) => ({ city: `City${i}`, name: `Team${i}` }));
const picks = Array.from({ length: 64 }, (_, i) => ({ id: `p${i}`, rd: i < 32 ? 1 : 2, overall: i + 1, owner: i, yr: 2030 }));
picks[17].owner = 0; // you pick at #18
const star = { id: "s", name: "Sliding Star", pos: "EDGE", cons: { final: 4 } };
const other = { id: "o", name: "Other", pos: "WR", cons: { final: 19 } };

test("a team that needs a falling star calls and pays extra for him", () => {
  const needOf = (t, p) => (t === 22 && p.pos === "EDGE" ? 0.8 : 0.1);
  const o = fallerCall({ picks, idx: 17, ui: 0, yr: 2030, teams, board: [other, star], needOf });
  assert.ok(o, "a call comes");
  assert.equal(o.team, 22);
  assert.equal(o.target.id, "s");
  assert.equal(o.fell, 14);
  assert.ok(o.pct >= 10, `a real premium (${o.pct}%)`);
  const normal = tradeDownOffers({ picks, idx: 17, ui: 0, yr: 2030, teams }).find((x) => x.team === 22);
  if (normal) assert.ok(o.pct > normal.pct, "more than an ordinary call");
});

test("no call when nobody fell, or nobody needs him", () => {
  assert.equal(fallerCall({ picks, idx: 17, ui: 0, yr: 2030, teams, board: [other], needOf: () => 1 }), null);
  assert.equal(fallerCall({ picks, idx: 17, ui: 0, yr: 2030, teams, board: [star], needOf: () => 0.1 }), null);
  assert.equal(fallerCall({ picks, idx: 16, ui: 0, yr: 2030, teams, board: [star], needOf: () => 1 }), null, "not your pick");
});
