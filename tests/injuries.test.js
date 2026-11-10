import test from "node:test";
import assert from "node:assert/strict";
import { injStatus, injuryReport, hurtPen } from "../src/injuries.js";
import { tickInjuries } from "../src/league.js";

test("injury tags and return weeks", () => {
  assert.equal(injStatus({ injured: true, injWk: 1 }, { wk: 5 }).tag, "D");
  const out = injStatus({ injured: true, injWk: 4 }, { wk: 5 });
  assert.equal(out.tag, "OUT"); assert.equal(out.back, 10);
  const q = injStatus({ hurt: { wks: 1, pen: 5, type: "Ankle" } }, { wk: 5 });
  assert.equal(q.tag, "Q"); assert.equal(q.pen, 5);
  assert.equal(injStatus({ injured: true, injWk: 2, irWk: 5 }, { ir: true, wk: 5 }).back, 10);
  assert.equal(injStatus({}, { wk: 3 }), null);
});

test("playing hurt lowers the rating for a game, then wears off", () => {
  const p = { id: 1, pos: "WR", ovr: 80, hurt: { wks: 1, pen: 5 }, hurtNew: true };
  assert.equal(hurtPen(p), 5);
  const t = { roster: [p], ir: [] };
  tickInjuries([t], 3, 0); // the week he got hurt: still hurt for the next game
  assert.equal(hurtPen(p), 5);
  tickInjuries([t], 4, 0);
  assert.equal(hurtPen(p), 0);
  assert.equal(p.ovr, 80);
});

test("the report lists IR first, then out, doubtful and questionable", () => {
  const team = { roster: [{ id: 1, ovr: 70, hurt: { wks: 1, pen: 3 } }, { id: 2, ovr: 80, injured: true, injWk: 5 }], ir: [{ id: 3, ovr: 75, injured: true, injWk: 6, irWk: 2 }] };
  assert.deepEqual(injuryReport(team, 4).map((r) => r.st.tag), ["IR", "OUT", "Q"]);
});
