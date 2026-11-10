// The season preview shown at kickoff, and the primetime slots used across the game.

// "Sunday Night" for a game kicking off at 7 PM ET or later (from the real schedule), else null.
export function primeSlot(g) {
  if (!g?.date) return null;
  const d = new Date(g.date);
  if (isNaN(d)) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", hour: "numeric", hour12: false }).formatToParts(d).map((p) => [p.type, p.value]));
  const hr = +parts.hour % 24;
  return hr >= 19 ? `${parts.weekday} Night` : null;
}

// A club's strength: its best 22 by rating.
export const strength = (t) => { const o = (t.roster || []).map((p) => p.ovr || 0).sort((a, b) => b - a).slice(0, 22); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); };

// teams, sched (this season), ui, yr -> { opener, prime: [games], stretch: { from, to, opps }, winTotal, rank }
export function seasonPreview(teams, sched, ui) {
  const mine = sched.filter((g) => typeof g.wk === "number" && g.wk >= 1 && g.wk <= 18 && (g.h === ui || g.a === ui)).sort((a, b) => a.wk - b.wk);
  const opp = (g) => (g.h === ui ? g.a : g.h);
  const str = teams.map(strength);
  const avg = str.reduce((a, b) => a + b, 0) / Math.max(1, str.length);
  const rank = [...str].sort((a, b) => b - a).indexOf(str[ui]) + 1;
  const raw = 8.5 + (str[ui] - avg) * 0.6;
  const winTotal = Math.min(13.5, Math.max(3.5, Math.floor(raw) + 0.5)); // always a half, like a real line
  let stretch = null;
  for (let i = 0; i + 2 < mine.length; i++) {
    const s = (str[opp(mine[i])] + str[opp(mine[i + 1])] + str[opp(mine[i + 2])]) / 3;
    if (!stretch || s > stretch.s) stretch = { s, from: mine[i].wk, to: mine[i + 2].wk, opps: [mine[i], mine[i + 1], mine[i + 2]].map(opp) };
  }
  return { opener: mine[0] || null, prime: mine.filter((g) => primeSlot(g)), stretch, winTotal, rank };
}
