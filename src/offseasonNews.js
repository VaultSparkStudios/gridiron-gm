// Off-season Top Stories. When the season ends we note where every player is (and on what deal)
// and who coaches each club; through the combine, re-sign week, free agency, the draft and the
// preseason, the stories come from what changed since: the big signings, trades, head coaching
// hires, the top of the draft, your own departures, and the best players still on the market.
// Each story: { id, kind, team (index), head, text, mine }, the shape Home's Top Stories shows.

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const full = (t) => `${t.city} ${t.name}`;

// teams: at season's end. Returns a small save-friendly record: player id -> [team, years left].
export function offseasonSnapshot(teams, yr) {
  const p = {};
  teams.forEach((t, ti) => { for (const k of ["roster", "ps", "ir"]) for (const x of t[k] || []) p[x.id] = [ti, x.contract ?? 1]; });
  return { yr, p, hc: teams.map((t) => t.coach?.hc?.name || null) };
}

// snap: from offseasonSnapshot. teams/fa: now. phase: combine | resign | freeagency | draft | preseason.
export function offseasonStories({ snap, teams, fa = [], ui, phase }) {
  if (!snap?.p) return [];
  const out = [];
  const add = (s) => out.push({ id: `off-${snap.yr}-${s.kind}-${s.key}`, ...s });
  const moved = [];
  teams.forEach((t, ti) => { for (const x of t.roster || []) { const was = snap.p[x.id]; if (was && was[0] !== ti) moved.push({ x, ti, from: was[0], left: was[1] }); } });
  // a deal that was running out means he hit the market and signed; one with years left was a trade
  const signings = moved.filter((m) => m.left <= 1).sort((a, b) => (b.x.salary || 0) - (a.x.salary || 0) || b.x.ovr - a.x.ovr);
  const trades = moved.filter((m) => m.left > 1).sort((a, b) => b.x.ovr - a.x.ovr);

  if (phase === "freeagency" || phase === "draft" || phase === "preseason") {
    signings.slice(0, 3).forEach((m, i) => {
      const t = teams[m.ti], old = teams[m.from];
      add({ kind: "sign", key: m.x.id, team: m.ti, mine: m.ti === ui || m.from === ui, breaking: i === 0,
        head: `${m.x.name} (${m.x.pos} ${m.x.ovr}) signs with the ${t.name}`,
        text: `${m.x.contract || 1}-year deal at ${money(m.x.salary)} a year${old ? `, leaving the ${full(old)}` : ""}. ${m.x.age <= 27 ? "In his prime, and paid like it." : m.x.age >= 31 ? `At ${m.x.age}, a win-now bet.` : "A proven starter for a club with room to spend."}` });
    });
    // your players who walked
    const gone = signings.filter((m) => m.from === ui && m.ti !== ui && !out.some((s) => s.key === m.x.id))[0];
    if (gone) add({ kind: "left", key: gone.x.id, team: gone.ti, mine: true, head: `${gone.x.name} leaves for the ${teams[gone.ti].name}`, text: `Your ${gone.x.pos} (${gone.x.ovr} OVR) takes ${money(gone.x.salary)} a year from ${full(teams[gone.ti])}.` });
  }
  trades.slice(0, 2).forEach((m) => {
    const t = teams[m.ti], old = teams[m.from];
    add({ kind: "trade", key: m.x.id, team: m.ti, mine: m.ti === ui || m.from === ui, head: `Traded: ${m.x.name} heads to the ${t.name}`, text: `The ${full(old)} send their ${m.x.pos} (${m.x.ovr} OVR, ${m.x.age}) to ${t.city}.` });
  });
  if (phase === "freeagency") {
    const best = [...fa].filter((p) => (p.ovr || 0) >= 75).sort((a, b) => b.ovr - a.ovr)[0];
    if (best) add({ kind: "market", key: best.id, team: snap.p[best.id]?.[0] ?? ui, mine: false, head: `Still on the market: ${best.name} (${best.pos} ${best.ovr})`, text: `The best player left in free agency${best.age ? `, ${best.age} years old` : ""}. Whoever has the room gets him.` });
  }
  if (phase === "draft" || phase === "preseason") {
    const rookies = teams.flatMap((t, ti) => (t.roster || []).filter((p) => p.draftYr === snap.yr && p.draftPk > 0).map((p) => ({ p, ti })));
    const first = rookies.find((r) => r.p.draftPk === 1);
    if (first) add({ kind: "draft1", key: first.p.id, team: first.ti, mine: first.ti === ui, head: `First overall: the ${teams[first.ti].name} take ${first.p.name}`, text: `The ${first.p.pos} goes No. 1${first.p.college ? ` out of ${first.p.college}` : ""}, and the ${teams[first.ti].city} rebuild has its centerpiece.` });
    const mine = rookies.filter((r) => r.ti === ui).sort((a, b) => a.p.draftPk - b.p.draftPk)[0];
    if (mine && mine !== first) add({ kind: "draftMine", key: mine.p.id, team: ui, mine: true, head: `Your first pick: ${mine.p.name}, ${mine.p.pos}`, text: `Taken No. ${mine.p.draftPk} overall (round ${mine.p.draftRd}). ${mine.p.ovr >= 70 ? "Ready to play now." : "A project with upside."}` });
  }
  if (phase === "preseason") {
    teams.forEach((t, ti) => {
      const now = t.coach?.hc?.name;
      if (now && snap.hc?.[ti] && now !== snap.hc[ti]) add({ kind: "coach", key: ti, team: ti, mine: ti === ui, head: `The ${t.name} hire ${now} as head coach`, text: `${snap.hc[ti]} is out in ${t.city}; ${now} takes over${t.coach.hc.scheme ? ` with a ${t.coach.hc.scheme} system` : ""}.` });
    });
  }
  // the biggest signing leads, then your own news, then the rest of the league
  const rank = (s) => (s.breaking ? 0 : s.mine ? 1 : 2);
  return out.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([s]) => s).slice(0, 7);
}
