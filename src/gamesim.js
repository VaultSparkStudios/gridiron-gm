// Unit ratings: each team's starters (from the depth chart) rolled up into passing, running,
// pass defense, run defense, pass rush and O-line. The play-by-play engine (playsim.js) runs
// every game off these.

const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 60);
// Starters' ratings for each unit. order(pos) lists a team's healthy players in depth order.
export function unitRatings(order) {
  const top = (pos, n) => order(pos).slice(0, n).map((p) => p.ovr);
  const ol = avg([...top("LT", 1), ...top("LG", 1), ...top("C", 1), ...top("RG", 1), ...top("RT", 1)]);
  const qb = avg(top("QB", 1)), rb = avg(top("RB", 1));
  const rec = avg([...top("WR", 3), ...top("TE", 1)]);
  const dl = avg(top("DL", 4)), lb = avg(top("LB", 3)), db = avg([...top("CB", 2), ...top("S", 2)]);
  return {
    pass: qb * 0.5 + rec * 0.3 + ol * 0.2,
    run: rb * 0.4 + ol * 0.45 + qb * 0.15,
    passD: db * 0.55 + dl * 0.3 + lb * 0.15,
    runD: dl * 0.45 + lb * 0.4 + db * 0.15,
    rush: dl * 0.7 + lb * 0.3, // pass rush, for sacks
    ol, qb, k: avg(top("K", 1)),
  };
}
