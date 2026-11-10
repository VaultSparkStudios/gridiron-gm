// The balance watchdog for long health runs (scripts/health.mjs): each season's league numbers
// checked against NFL-like bands. A number outside its band is a warning; a hard band broken two
// seasons running fails the run (drift that won't correct itself). Drift bands compare against
// the first season measured, so rating inflation or deflation shows up however it starts.
//
// row: health.mjs measure() merged with scoring() for the same season.
export const BANDS = [
  // game scoring (per team per game), from the regular season just played
  { k: "ppg", lo: 19, hi: 25.5, hard: true, what: "points a game" },
  { k: "compPct", lo: 59, hi: 69, hard: true, what: "completion %" },
  { k: "passYds", lo: 185, hi: 265, what: "passing yards a game" },
  { k: "rushYds", lo: 90, hi: 145, what: "rushing yards a game" },
  { k: "homeWin", lo: 48, hi: 62, what: "home win %" },
  { k: "blowout28", lo: 0, hi: 13, what: "% of games decided by 28+" },
  { k: "ties", lo: 0, hi: 4, what: "ties" },
  // the league's players and money
  { k: "avgAge", lo: 25.3, hi: 27.8, hard: true, what: "average age" },
  { k: "n99", lo: 0, hi: 14, what: "players rated 99" }, // development aims for about 8 (TOP_99)
  { k: "overCap", lo: 0, hi: 2, hard: true, what: "AI clubs over the cap" },
  { k: "thinTeams", lo: 0, hi: 2, hard: true, what: "AI clubs missing a QB2, C, K, P or OL starter" },
  { k: "minRoster", lo: 46, hi: 99, hard: true, what: "smallest AI roster" },
  { k: "payAvg", lo: 72, hi: 101, what: "average payroll, % of the cap" },
  { k: "qbTop5", lo: 10, hi: 21, what: "top-5 QB salary, % of the cap" },
];
// change from the first season that counts as drift
export const DRIFT = [
  { k: "avgOvr", max: 2.5, hard: true, what: "average rating" },
  { k: "starterOvr", max: 2.5, hard: true, what: "starters' average rating" },
  { k: "n90", maxPct: 0.5, what: "players rated 90+" },
  { k: "n80", maxPct: 0.35, what: "players rated 80+" },
];

// Flatten the row into the numbers the bands read.
export function balanceStats(row) {
  return { ...row, payAvg: row.payPct?.[1], qbTop5: row.top5Pct?.QB };
}

// One season: [{ k, what, v, band, hard }] for everything out of line. base: the first season's stats.
export function checkSeason(row, base) {
  const s = balanceStats(row), out = [];
  for (const b of BANDS) {
    const v = s[b.k];
    if (typeof v !== "number" || Number.isNaN(v)) continue;
    if (v < b.lo || v > b.hi) out.push({ k: b.k, what: b.what, v, band: `${b.lo}-${b.hi}`, hard: !!b.hard });
  }
  if (base) {
    const b0 = balanceStats(base);
    for (const d of DRIFT) {
      const v = s[d.k], v0 = b0[d.k];
      if (typeof v !== "number" || typeof v0 !== "number") continue;
      const bad = d.max != null ? Math.abs(v - v0) > d.max : v0 > 0 && Math.abs(v - v0) / v0 > d.maxPct;
      if (bad) out.push({ k: d.k, what: `${d.what} drift`, v, band: `${v0} ${d.max != null ? `±${d.max}` : `±${Math.round(d.maxPct * 100)}%`}`, hard: !!d.hard });
    }
  }
  return out;
}

// The whole run: per-season warnings, and the hard ones broken two seasons in a row (the failures).
export function watchRun(rows) {
  const seasons = rows.map((r) => ({ yr: r.yr, flags: checkSeason(r, rows[0]) }));
  const failures = [];
  for (let i = 1; i < seasons.length; i++) {
    for (const f of seasons[i].flags) if (f.hard && seasons[i - 1].flags.some((g) => g.k === f.k)) failures.push({ yr: seasons[i].yr, ...f });
  }
  return { seasons, failures };
}
export const flagText = (f) => `${f.what}: ${f.v} (band ${f.band})${f.hard ? " [hard]" : ""}`;

// Your club against AI clubs that started level with it: the health run picks the AI clubs whose
// starters (best 22) rated closest to yours at the start, then compares win rates every season.
// A big, lasting gap means the game favors the user (or the AI) beyond the rosters.
const strength = (t) => { const r = [...(t.roster || [])].sort((a, b) => b.ovr - a.ovr).slice(0, 22); return r.reduce((a, p) => a + p.ovr, 0) / Math.max(1, r.length); };
export function matchedClubs(teams, ui, n = 3) {
  const me = strength(teams[ui]);
  return teams.map((t, i) => [i, Math.abs(strength(t) - me)]).filter(([i]) => i !== ui).sort((a, b) => a[1] - b[1]).slice(0, n).map(([i]) => i);
}
const wpct = (t) => { const g = (t.w || 0) + (t.l || 0) + (t.t || 0); return g ? ((t.w || 0) + (t.t || 0) / 2) / g : 0; };
// One regular season: your win rate, the matched clubs' average, and the gap (+ = you did better).
export function matchedSeason(teams, ui, match) {
  const user = wpct(teams[ui]), matched = match.reduce((a, i) => a + wpct(teams[i]), 0) / Math.max(1, match.length);
  return { user: +user.toFixed(3), matched: +matched.toFixed(3), gap: +(user - matched).toFixed(3) };
}
// The whole run: the average gap, and a flag when it's past USER_EDGE (about 2.5 wins a season).
export const USER_EDGE = 0.15;
export function matchedRun(seasons) {
  const gap = seasons.length ? seasons.reduce((a, s) => a + s.gap, 0) / seasons.length : 0;
  return { gap: +gap.toFixed(3), wins: +(gap * 17).toFixed(1), flag: Math.abs(gap) > USER_EDGE };
}
