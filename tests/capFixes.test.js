import { test } from "node:test";
import assert from "node:assert/strict";
import { capHit } from "../src/league.js";
import { setCapPhase, capFor } from "../src/cap.js";
import { nextYearRoom } from "../src/extensions.js";
import { capProjection } from "../src/capProjection.js";

const team = (roster, ir = []) => ({ roster, ir, coach: {}, deadCap: 0 });

test("injured reserve still counts against the cap", () => {
  setCapPhase(2026, "regular");
  const qb = { id: "q", salary: 50, contract: 3 };
  assert.equal(capHit(team([qb])), capHit(team([], [qb])));
});

test("re-sign week: expiring deals come off, new deals for next season stay", () => {
  const exp = { id: "a", salary: 20, contract: 1 };
  const kept = { id: "b", salary: 10, contract: 3 };
  const newOne = { id: "c", salary: 5, contract: 1, cy: 2027 };
  setCapPhase(2026, "regular");
  assert.equal(capHit(team([exp, kept, newOne])), 35);
  setCapPhase(2026, "resign");
  assert.equal(capHit(team([exp, kept, newOne])), 15);
  setCapPhase(2026, "regular");
});

test("next season's room looks past the league year in force", () => {
  const p = { id: "a", salary: 30, contract: 2 };
  // in season: a 2-year deal is on next season's books
  assert.equal(nextYearRoom(team([p]), 2026, "regular"), Math.round((capFor(2027) - 30) * 10) / 10);
  // free agency (league year 2027 already): that deal ends after 2027, so 2028 is clear
  assert.equal(nextYearRoom(team([p]), 2026, "freeagency"), capFor(2028));
});

test("the long view counts off-season deals for the right years", () => {
  const p = { id: "a", salary: 30, contract: 2 };
  const [y0, y1] = capProjection(team([p]), 2027, { yr: 2026, sp: "resign" });
  assert.equal(y0.committed, 30);
  assert.equal(y1.committed, 0);
});
