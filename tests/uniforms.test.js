import { test } from "node:test";
import assert from "node:assert/strict";
import { UNIFORMS, teamKey, uniformFor } from "../src/teamUniforms.js";
import REAL from "../src/data/madden27.json" with { type: "json" };

test("all 32 clubs have a uniform, keyed by the game's own abbreviations", () => {
  assert.equal(Object.keys(UNIFORMS).length, 32);
  for (const t of REAL.teams) assert.ok(UNIFORMS[teamKey(t)], t.ab);
});

test("teams are found by abbreviation, alias, name or object; unknown teams fall back to their colors", () => {
  assert.equal(teamKey("NYG"), "NYG");
  assert.equal(teamKey("New York Giants"), "NYG");
  assert.equal(teamKey("49ers"), "SF");
  assert.equal(teamKey("OAK"), "LV");
  assert.equal(teamKey({ ab: "GB", name: "Packers" }), "GB");
  assert.equal(teamKey("Nobody"), null);
  assert.equal(uniformFor({ ab: "XXX", clr: "#123456", ac: "#abcdef" }).jersey, "#123456");
  assert.ok(uniformFor(null).jersey);
});

test("Giants, Chiefs, Packers and Cowboys look different; road jerseys are white", () => {
  const j = ["NYG", "KC", "GB", "DAL"].map((k) => uniformFor(k).jersey + uniformFor(k).helmet);
  assert.equal(new Set(j).size, 4);
  assert.equal(uniformFor("NYG", { away: true }).jersey, "#f4f4f2");
  assert.notEqual(uniformFor("DAL", { away: true }).jersey, "#f4f4f2", "Dallas is white at home, color on the road");
});
