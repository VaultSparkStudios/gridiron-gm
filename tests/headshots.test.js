import test from "node:test";
import assert from "node:assert/strict";
import { espnIdOf, withHeadshot, headshotUrl } from "../src/headshots.js";

test("real players get their ESPN photo id; generated players keep the drawn face", () => {
  assert.equal(espnIdOf({ src: "m27", name: "Josh Allen", pos: "QB" }), 3918298);
  assert.equal(espnIdOf({ src: "m27", name: "Patrick Mahomes II", pos: "QB" }), 3139477);
  assert.equal(espnIdOf({ name: "Josh Allen", pos: "QB" }), null); // a generated namesake
  const p = withHeadshot({ src: "m27", name: "Saquon Barkley", pos: "RB", face: { sk: "#000" } });
  assert.equal(p.face.espn, 3929630);
  assert.equal(p.face.sk, "#000");
  assert.match(headshotUrl(3929630), /headshots\/nfl\/players\/full\/3929630\.png/);
});
