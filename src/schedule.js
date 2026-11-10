// The NFL schedule formula: 17 games over 18 weeks, one bye between weeks 5 and 14.
//   6  division games, home and away against each rival
//   4  against one division in the same conference (rotates every 3 years)
//   4  against one division in the other conference (rotates every 4 years)
//   2  against the teams that finished in the same place in the conference's other two divisions
//   1  against a same-place team from a division in the other conference (the 17th game)
// Week 18 is all division games, nobody plays the same team in back-to-back weeks, the two
// games against a division rival are at least three weeks apart, and three straight home
// or road games are kept to a minimum (who hosts is fixed by the formula, so a few remain).
const DIVS = ["East", "North", "South", "West"];
const INTRA = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]; // pairs of division indexes

// teams: [{ id, c: "AFC"|"NFC", d: "East"... }]; place: id -> 0..3 (last season's division finish).
export function nflMatchups(teams, year, place) {
  const div = {};
  for (const t of teams) (div[`${t.c}|${t.d}`] ||= []).push(t.id);
  for (const k of Object.keys(div)) div[k].sort((a, b) => place[a] - place[b]); // index = finish
  const of = (conf, d) => div[`${conf}|${DIVS[d]}`];
  const games = [];
  const add = (h, a) => games.push({ h, a });
  const other = (c) => (c === "AFC" ? "NFC" : "AFC");
  const cycle3 = ((year % 3) + 3) % 3, cycle4 = ((year % 4) + 4) % 4;
  for (const conf of ["AFC", "NFC"]) {
    // Division: each pair twice.
    for (let d = 0; d < 4; d++) {
      const ids = of(conf, d);
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { add(ids[i], ids[j]); add(ids[j], ids[i]); }
    }
    // Same conference, rotating division: every team plays all four, two at home.
    for (const [x, y] of INTRA[cycle3]) {
      const A = of(conf, x), B = of(conf, y);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ((i + j) % 2 ? add(A[i], B[j]) : add(B[j], A[i]));
    }
    // Same-place games against the two divisions not paired this year. Those pairings form a
    // loop of four divisions (a-c-b-d-a); each division hosts the next one round the loop, so
    // every team gets one of these at home and one away. The direction flips every year.
    const [[a, b], [c, d]] = INTRA[cycle3];
    const loop = year % 2 ? [a, c, b, d] : [a, d, b, c];
    for (let k = 0; k < 4; k++) {
      const H = of(conf, loop[k]), A = of(conf, loop[(k + 1) % 4]);
      for (let i = 0; i < 4; i++) add(H[i], A[i]);
    }
  }
  // Other conference: AFC division d plays NFC division (d + cycle4) % 4, two at home each.
  for (let d = 0; d < 4; d++) {
    const A = of("AFC", d), N = of("NFC", (d + cycle4) % 4);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ((i + j) % 2 ? add(A[i], N[j]) : add(N[j], A[i]));
    // The 17th game: same place, another NFC division; AFC hosts in even years.
    const N17 = of("NFC", (d + cycle4 + 2) % 4);
    for (let i = 0; i < 4; i++) (year % 2 === 0 ? add(A[i], N17[i]) : add(N17[i], A[i]));
  }
  return games;
}

const key = (g) => (g.h < g.a ? `${g.h}-${g.a}` : `${g.a}-${g.h}`);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Byes: weeks 5-14, an even number of teams each week. byes: id -> week (or generated).
export function nflByes(ids) {
  const per = [4, 4, 2, 4, 2, 4, 2, 4, 4, 2]; // weeks 5..14, 32 teams
  const order = shuffle([...ids]);
  const out = {};
  let k = 0;
  per.forEach((n, w) => { for (let i = 0; i < n && k < order.length; i++) out[order[k++]] = w + 5; });
  while (k < order.length) out[order[k++]] = 14;
  return out;
}

// Put the season's games into weeks: one week at a time, each week a full set of matchups for
// every team not on bye, stepping back to re-plan a week when a later one can't be filled.
// Returns [{ wk, h, a }] or null if this attempt runs out of budget.
function placeWeeks(games, byes, teamIds) {
  const pool = games.map((g, i) => ({ ...g, i }));
  const left = new Set(pool.map((g) => g.i));
  // Week 18: one division game for everyone.
  const wk18 = [];
  for (const g of shuffle(pool.filter((x) => x.div))) {
    if (wk18.some((x) => x.h === g.h || x.a === g.h || x.h === g.a || x.a === g.a)) continue;
    wk18.push(g);
  }
  if (wk18.length !== teamIds.length / 2) return null;
  wk18.forEach((g) => left.delete(g.i));
  const opp18 = {};
  for (const g of wk18) { opp18[g.h] = g.a; opp18[g.a] = g.h; }
  const lastMeet = {}; // pair -> week of their latest game so far
  const weekOf = []; // weekOf[wk] = games that week
  let budget = 60000;

  // Where a team played in a given week: "H", "A", or null (bye / before week 1).
  const site = (id, w) => { const g = (weekOf[w] || []).find((x) => x.h === id || x.a === id); return g ? (g.h === id ? "H" : "A") : null; };
  // A full set of matchups for one week (randomised), or null.
  const matchWeek = (wk) => {
    const active = teamIds.filter((id) => byes[id] !== wk);
    const prev = {};
    for (const g of weekOf[wk - 1] || []) { prev[g.h] = g.a; prev[g.a] = g.h; }
    const cand = {};
    for (const id of active) cand[id] = [];
    for (const i of left) {
      const g = pool[i];
      if (!(g.h in cand) || !(g.a in cand)) continue;
      if (prev[g.h] === g.a) continue; // no back-to-back
      const lm = lastMeet[key(g)];
      if (lm != null && wk - lm < 3) continue; // division rematches spread out
      if (wk === 17 && opp18[g.h] === g.a) continue;
      if (g.div && wk >= 16 && opp18[g.h] === g.a) continue;
      cand[g.h].push(g); cand[g.a].push(g);
    }
    // Prefer games that don't give anyone a third straight home or road game.
    const streak = (g) => (site(g.h, wk - 1) === "H" && site(g.h, wk - 2) === "H" ? 1 : 0) + (site(g.a, wk - 1) === "A" && site(g.a, wk - 2) === "A" ? 1 : 0);
    for (const id of active) { shuffle(cand[id]); cand[id].sort((x, y) => streak(x) - streak(y)); }
    const used = new Set();
    const pick = [];
    let steps = 0;
    const dfs = () => {
      if (--budget < 0 || ++steps > 3000) return false;
      let best = null, bestN = Infinity;
      for (const id of active) {
        if (used.has(id)) continue;
        const n = cand[id].reduce((s, g) => s + (used.has(g.h) || used.has(g.a) ? 0 : 1), 0);
        if (n < bestN) { bestN = n; best = id; if (!n) return false; }
      }
      if (best == null) return true;
      for (const g of cand[best]) {
        if (used.has(g.h) || used.has(g.a)) continue;
        used.add(g.h); used.add(g.a); pick.push(g);
        if (dfs()) return true;
        used.delete(g.h); used.delete(g.a); pick.pop();
      }
      return false;
    };
    return dfs() ? pick : null;
  };

  const solve = (wk) => {
    if (wk === 18) return left.size === 0;
    for (let attempt = 0; attempt < 4 && budget > 0; attempt++) {
      const pick = matchWeek(wk);
      if (!pick) return false;
      const saved = pick.map((g) => [key(g), lastMeet[key(g)]]);
      for (const g of pick) { left.delete(g.i); lastMeet[key(g)] = wk; }
      weekOf[wk] = pick;
      if (solve(wk + 1)) return true;
      for (const g of pick) left.add(g.i);
      for (const [k, v] of saved) (v == null ? delete lastMeet[k] : (lastMeet[k] = v));
      weekOf[wk] = null;
    }
    return false;
  };
  if (!solve(1)) return null;
  const out = [];
  for (let wk = 1; wk <= 17; wk++) for (const g of weekOf[wk]) out.push({ wk, h: g.h, a: g.a });
  for (const g of wk18) out.push({ wk: 18, h: g.h, a: g.a });
  return out;
}

// The whole season: matchups by formula, then weeks. place: id -> division finish (0 = first).
export function nflSchedule(teams, year, place, byes) {
  const games = nflMatchups(teams, year, place).map((g) => ({ ...g, div: teams[g.h].c === teams[g.a].c && teams[g.h].d === teams[g.a].d }));
  const ids = teams.map((t) => t.id);
  for (let tries = 0; tries < 60; tries++) {
    const b = byes && tries < 30 ? byes : nflByes(ids);
    const weeks = placeWeeks(games, b, ids);
    if (weeks) return { games: weeks.sort((x, y) => x.wk - y.wk), byes: b };
  }
  throw new Error("Couldn't build a schedule");
}

// Last season's division finish for every team (best record first); with no games yet, by roster.
export function divisionPlaces(teams, strength) {
  const place = {};
  const groups = {};
  for (const t of teams) (groups[`${t.c}|${t.d}`] ||= []).push(t);
  const played = teams.some((t) => t.w + t.l + (t.t || 0) > 0);
  for (const g of Object.values(groups)) {
    g.sort((a, b) => played ? (b.w + (b.t || 0) * 0.5) - (a.w + (a.t || 0) * 0.5) || (b.pf - b.pa) - (a.pf - a.pa) : strength(b) - strength(a));
    g.forEach((t, i) => (place[t.id] = i));
  }
  return place;
}
