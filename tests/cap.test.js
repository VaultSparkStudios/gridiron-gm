import test from "node:test";
import assert from "node:assert/strict";
import { capFor, rookieSalary, migrateCap, DATA_TO_DOLLARS } from "../src/cap.js";
import { askingPrice } from "../src/offseason.js";

test("the cap is real through 2026, then rises every year", () => {
  assert.equal(capFor(2025), 279.2);
  assert.equal(capFor(2026), 301.2);
  let prev = capFor(2026);
  for (let y = 2027; y <= 2040; y++) { const c = capFor(y); assert.ok(c > prev * 1.05 && c < prev * 1.09, `${y}: ${c}`); prev = c; }
});

test("contracts are a share of the cap: same share as the cap grows", () => {
  const dart = { pos: "QB", ovr: 88, age: 24 };
  const now = askingPrice(dart, capFor(2026)), later = askingPrice(dart, capFor(2031));
  assert.ok(now >= 55 && now <= 66, `88 QB asks ${now}`);
  assert.ok(Math.abs(now / capFor(2026) - later / capFor(2031)) < 0.002);
  assert.ok(askingPrice({ pos: "QB", ovr: 99, age: 27 }, 301.2) > askingPrice({ pos: "WR", ovr: 99, age: 27 }, 301.2));
  assert.ok(askingPrice({ pos: "RB", ovr: 60, age: 25 }, 301.2) <= 1.1, "depth players get about the minimum");
  assert.ok(rookieSalary(1, 301.2) > 11 && rookieSalary(32, 301.2) < 4 && rookieSalary(200, 301.2) < 1.2);
});

test("old saves are scaled once onto the real cap", () => {
  const d = { yr: 2026, sp: "regular", teams: [{ roster: [{ salary: 20 }], ps: [], ir: [], coach: { oc: { salary: 2 } }, deadCap: 4 }], fa: [{ salary: 1 }] };
  migrateCap(d);
  assert.equal(d.teams[0].roster[0].salary, +(20 * DATA_TO_DOLLARS).toFixed(1));
  assert.equal(d.capv, 2);
  migrateCap(d);
  assert.equal(d.teams[0].roster[0].salary, +(20 * DATA_TO_DOLLARS).toFixed(1), "never twice");
});
