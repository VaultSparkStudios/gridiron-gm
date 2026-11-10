import test from "node:test";
import assert from "node:assert/strict";
import { injStatus, backText } from "../src/injuries.js";

test("a return during the playoffs reads as the round he's back for, not week 19-22", () => {
  assert.equal(backText(9), "wk 9");
  assert.equal(backText(19), "for the Wild Card round");
  assert.equal(backText(20), "for the Divisional round");
  assert.equal(backText(21), "for the Conference Championship");
  assert.equal(backText(22), "for the Super Bowl");
  // hurt in week 18 and out two games (the Wild Card and Divisional rounds): back for the Conference Championship
  const st = injStatus({ injured: true, injWk: 2, injType: "Ankle" }, { wk: 18 });
  assert.equal(backText(st.back), "for the Conference Championship");
});
