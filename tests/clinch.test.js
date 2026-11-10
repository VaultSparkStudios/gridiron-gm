import test from "node:test";
import assert from "node:assert/strict";
import { clinchStatus, newClinches } from "../src/clinch.js";

const team = (c, d, w) => ({ c, d, w, l: 0 });
// 4 AFC East teams + 4 AFC North; one game left for everyone (vs a team outside the list)
const mk = (wins) => wins.map((w, i) => team("AFC", i < 4 ? "East" : "North", w));
const sched = (n) => Array.from({ length: n }, (_, i) => ({ wk: 18, h: i, a: 99, played: false }));

test("division, top seed and berth only when nobody can catch you", () => {
  let st = clinchStatus(mk([12, 10, 9, 8, 13, 9, 8, 7]), sched(8), 0);
  assert.equal(st.div, true, "rivals max out at 11");
  assert.equal(st.top, false, "the North leader can still get to 14");
  assert.equal(st.berth, true);
  st = clinchStatus(mk([12, 11, 9, 8, 13, 9, 8, 7]), sched(8), 0);
  assert.equal(st.div, false, "a rival can tie at 12");
  assert.equal(st.berth, true, "only two teams can reach 12");
  st = clinchStatus(mk([10, 11, 9, 8, 13, 12, 8, 7]), sched(8), 0);
  assert.equal(st.berth, false, "four teams can still finish ahead");
  assert.deepEqual(newClinches({ berth: true, div: true, top: false }, { berth: true }), ["div"]);
});
