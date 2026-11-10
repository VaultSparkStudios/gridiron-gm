// The offensive line's numbers (the play engine charges sacks and pressures to the blocker who lost
// his man, and credits the linemen whose gap a run went through): sacks and pressures allowed,
// pass-block win rate, and 0-100 pass and run block grades centred on a league-average starter.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const OL_POS = new Set(["LT", "LG", "C", "RG", "RT", "OL"]);

// 0-100 like PFF's (65 an average starter, 12 points a spread, past 83 each step counts for less),
// shared with grades.js.
export const scale = (z) => Math.round(clamp(z <= 1.5 ? 65 + 12 * z : 83 + 16 * (1 - Math.exp(-(z - 1.5) / 1.3)), 30, 99) * 10) / 10;

// Each spot against its own field (a tackle blocks the edge rushers and sees few runs at him; a
// center takes more interior pressure), measured over four simulated seasons of the real league:
// pass: (2 x sacks + pressures allowed) per pass block, [mean, spread, a starter's snaps];
// win / stuff: runs he sprang (4+ yards) and runs stuffed on him (0 or less) per run block [mean, spread];
// rb: a starter's run blocks.
const CAL = {
  T: { pass: [0.0565, 0.0198, 657], win: [0.2787, 0.1101], stuff: [0.0671, 0.0343], rb: 63 },
  G: { pass: [0.0512, 0.0151, 657], win: [0.1777, 0.0781], stuff: [0.0429, 0.0147], rb: 356 },
  C: { pass: [0.0584, 0.0161, 657], win: [0.1959, 0.0763], stuff: [0.0417, 0.0147], rb: 291 },
};
const GROUP = { LT: "T", RT: "T", LG: "G", RG: "G", C: "C" };

// s: a season (or game) line; pos: his spot (a guard's scale if not given). null until he has
// blocked enough to say anything. A short sample is pulled toward average, like every grade.
export function olLine(s, pos) {
  const pb = s?.pbSnp || 0, rb = s?.rbSnp || 0, sk = s?.sackA || 0, pr = s?.presA || 0;
  if (pb + rb < 40) return null;
  const c = CAL[GROUP[pos]] || CAL.G;
  const loss = pb ? (2 * sk + pr) / pb : null;
  const win = rb ? (s.rbWin || 0) / rb : null, stuff = rb ? (s.rbStuff || 0) / rb : null;
  const passZ = loss == null ? null : (-(loss - c.pass[0]) / c.pass[1]) * (pb / (pb + c.pass[2] * 0.3));
  // the two halves of run blocking (springing runs, not getting beaten) count the same; the sum of
  // two such spreads is about 1.6 spreads wide
  const runZ = rb < 15 ? null : (((win - c.win[0]) / c.win[1] - (stuff - c.stuff[0]) / c.stuff[1]) / 1.6) * (rb / (rb + c.rb * 0.3));
  return {
    sacks: sk, pres: pr, pbSnp: pb, rbSnp: rb,
    pbPct: pb ? Math.round(1000 * (1 - (sk + pr) / pb)) / 10 : null,
    passGrade: passZ == null ? null : Math.round(scale(passZ)),
    runGrade: runZ == null ? null : Math.round(scale(runZ)),
  };
}
