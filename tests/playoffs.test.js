import test from "node:test";
import assert from "node:assert/strict";
import { nflSeeds, makeBracket, nextRound } from "../src/playoffs.js";

const DIVS = ["East", "North", "South", "West"];
const teams = [];
for (const c of ["AFC", "NFC"]) for (const d of DIVS) for (let i = 0; i < 4; i++) teams.push({ id: teams.length, c, d, w: 0, l: 0, t: 0, pf: 0, pa: 0 });
teams.forEach((t, i) => { t.w = (i * 7) % 17; t.l = 17 - t.w; t.pf = 300 + i; t.pa = 300; });

test("7 seeds per conference: division winners first, then the best wild cards", () => {
  for (const c of ["AFC", "NFC"]) {
    const s = nflSeeds(teams, c);
    assert.equal(s.length, 7);
    assert.equal(new Set(s.slice(0, 4).map((id) => teams[id].d)).size, 4, "seeds 1-4 win different divisions");
    for (const d of DIVS) {
      const div = teams.filter((t) => t.c === c && t.d === d).sort((a, b) => b.w - a.w);
      assert.ok(s.slice(0, 4).includes(div[0].id), `${c} ${d} winner is a top-4 seed`);
    }
  }
});

test("bracket: #1 bye, reseeding, conference title games, Super Bowl, champion", () => {
  const afc = nflSeeds(teams, "AFC"), nfc = nflSeeds(teams, "NFC");
  let pb = makeBracket(afc, nfc);
  assert.equal(pb.m.length, 6);
  assert.ok(!pb.m.flat().includes(afc[0]) && !pb.m.flat().includes(nfc[0]), "#1 seeds on bye");
  assert.deepEqual(pb.m[0], [afc[1], afc[6]]);
  // Lower seeds win every Wild Card game: #1 should then host #7.
  pb = nextRound(pb, pb.m.map(([h, a]) => ({ h, a, hs: 10, as: 20, w: a })));
  assert.equal(pb.rd, 2);
  assert.equal(pb.m.length, 4);
  assert.deepEqual(pb.m[0], [afc[0], afc[6]], "#1 hosts the lowest seed left");
  assert.deepEqual(pb.m[1], [afc[4], afc[5]]);
  pb = nextRound(pb, pb.m.map(([h, a]) => ({ h, a, hs: 20, as: 10, w: h })));
  assert.equal(pb.rd, 3);
  assert.equal(pb.m.length, 2);
  pb = nextRound(pb, pb.m.map(([h, a]) => ({ h, a, hs: 20, as: 10, w: h })));
  assert.equal(pb.rd, 4);
  assert.deepEqual(pb.m, [[afc[0], nfc[0]]]);
  pb = nextRound(pb, [{ h: afc[0], a: nfc[0], hs: 24, as: 21, w: afc[0] }]);
  assert.equal(pb.ch, afc[0]);
  assert.equal(pb.res.length, 6 + 4 + 2 + 1);
});
