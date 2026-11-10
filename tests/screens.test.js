import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SCREENS } from "../src/league.js";

// Any tab the app can render must be a known screen, or the app sends you back to Home the moment
// you open it (the Saves screen vanished this way).
test("every rendered tab is a known screen", () => {
  const src = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tabs = new Set([...src.matchAll(/[{(|]tab===["']([a-z]+)["']/g)].map((m) => m[1]));
  tabs.delete("global"); // the leaderboard's own local tab variable, not a screen
  const missing = [...tabs].filter((t) => !SCREENS.has(t));
  assert.deepEqual(missing, []);
});
