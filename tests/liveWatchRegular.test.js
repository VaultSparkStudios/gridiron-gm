import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Single-season records and season milestones count regular-season games only, so the live game's
// Record Watch and Milestone Watch must not run in the playoffs (a playoff yard can't break one).
test("the live record and milestone watches only run in regular-season games", () => {
  const src = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(src, /const _regLive=liveSim&&!liveSim\.playoff&&sp==="regular"\?_myLive:null;/);
  assert.match(src, /const _mw=_regLive&&/);
  assert.match(src, /const _rc=_regLive&&/);
});
