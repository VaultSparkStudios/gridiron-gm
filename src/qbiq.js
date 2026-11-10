// Quarterback IQ: how well he reads a defense and decides where the ball goes. Three ratings make
// it up: Decisions (Madden's awareness), Read Def (diagnosing the coverage) and Pocket (poise when
// the rush gets home). The game engine (playsim.js) uses it on every dropback: a sharp QB finds
// the open man more often and forces it into coverage less, throws fewer interceptions and takes
// fewer sacks; a raw one does the reverse. An average starter plays exactly as before.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Read Def built from what the ratings do measure (Madden's Play Recognition is a defender's rating
// and QBs all sit at 10-30 in it), the same formula as scripts/build-madden27.py.
export const readDefOf = (a) => clamp(Math.round(0.65 * a.decisions + 0.2 * a.pocketAwr + 0.15 * a.accuracy), 30, 99);

// A Read Def that came from Play Recognition sits far below his other mental ratings.
export const brokenReadDef = (a) => !!a && typeof a.readDef === "number" && typeof a.decisions === "number" && a.readDef < a.decisions - 25;

// His IQ on the ratings' scale.
export const qbIQ = (p) => {
  const a = p?.posAttrs || {}, o = p?.ovr ?? 70;
  return 0.45 * (a.decisions ?? o - 4) + 0.3 * (a.readDef ?? o - 3) + 0.25 * (a.pocketAwr ?? o + 6);
};

// The league's average starting QB (the 32 starters in the 2026 data): the zero point.
export const IQ_NORM = 82.4;

// His edge over an average starter, in rating points, capped so no one is untouchable. Burrow sits
// around +11, Mahomes +8; a raw rookie starter around -15.
export const iqEdge = (p) => (p ? clamp(qbIQ(p) - IQ_NORM, -20, 16) : 0);

// What it does on a dropback (the engine's numbers, per point of edge):
//  - his read: how often he finds the open man, and how often he forces it into coverage
//  - interceptions and sacks on top of that (holding the ball, seeing the blitz)
export const readOdds = (edge) => ({ open: clamp(0.3 + edge * 0.012, 0.08, 0.5), forced: clamp(0.09 - edge * 0.004, 0.03, 0.2) });
// his own read counts for less than a throw you aim yourself (READ_WEIGHT of its effect), measured
// from what an average starter's reads come to, so the league's numbers stay where they were
export const READ_WEIGHT = 0.4;
const avgOpen = readOdds(0).open, avgForced = readOdds(0).forced;
export const readComp = (placed) => READ_WEIGHT * ((placed > 0 ? 0.12 : placed < 0 ? -0.18 : 0) - (avgOpen * 0.12 - avgForced * 0.18));
export const readInt = (placed) => READ_WEIGHT * ((placed > 0 ? -0.008 : placed < 0 ? 0.028 : 0) - (avgOpen * -0.008 + avgForced * 0.028));
export const intShift = (edge) => -edge * 0.0005;
export const sackShift = (edge) => -edge * 0.0012;
