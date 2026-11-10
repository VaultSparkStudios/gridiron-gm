import { test } from "node:test";
import assert from "node:assert/strict";
import { recordH2H, h2hLine } from "../src/h2h.js";

const g = (wk, h, a, hs, as, played = true) => ({ wk, h, a, hs, as, played });

test("your games against each club count once, across seasons", () => {
  let h = recordH2H({}, [g(1, 0, 5, 27, 20), g(2, 3, 0, 31, 10), g(3, 0, 7, 0, 0, false)], 0, 2027);
  assert.deepEqual([h[5].w, h[5].l, h[3].w, h[3].l, h[7]], [1, 0, 0, 1, undefined]);
  const same = recordH2H(h, [g(1, 0, 5, 27, 20), g(2, 3, 0, 31, 10)], 0, 2027);
  assert.equal(same, h, "nothing new, nothing changes");
  h = recordH2H(h, [g(1, 5, 0, 24, 17)], 0, 2028);
  assert.deepEqual([h[5].w, h[5].l], [1, 1], "a new season counts again");
  assert.deepEqual(h[5].last, { y: 2028, wk: 1, us: 17, them: 24, po: false });
});

test("the preview line", () => {
  assert.equal(h2hLine(null, "Cowboys"), null);
  const h = recordH2H({}, [g(1, 0, 5, 27, 20), g(19, 5, 0, 13, 30)], 0, 2027);
  assert.equal(h2hLine(h[5], "Cowboys"), "You're 2-0 against the Cowboys as GM. Last time: W 30-13 (2027 playoffs).");
});
