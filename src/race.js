// The playoff race, week by week down the stretch: what this week can clinch for you (a playoff
// spot, the division, the top seed), with a win alone or with one other result, whether a loss
// knocks you out, and the other games that matter to you with who to root for.
import { clinchStatus } from "./clinch.js";

const pct = (t) => { const g = (t.w || 0) + (t.l || 0) + (t.t || 0); return g ? ((t.w || 0) + 0.5 * (t.t || 0)) / g : 0; };
const left = (sched, id) => sched.filter((g) => !g.played && typeof g.wk === "number" && g.wk <= 18 && (g.h === id || g.a === id)).length;

// The league with some of this week's games decided: results = [{ g, winner }].
function after(teams, sched, results) {
  const t2 = teams.map((t) => ({ ...t }));
  const s2 = sched.map((g) => {
    const r = results.find((x) => x.g === g);
    if (!r) return g;
    const loser = r.winner === g.h ? g.a : g.h;
    t2[r.winner].w = (t2[r.winner].w || 0) + 1;
    t2[loser].l = (t2[loser].l || 0) + 1;
    return { ...g, played: true };
  });
  return { t2, s2 };
}

// Out of the playoffs for sure: at least seven conference clubs already have more wins than you
// can reach (a safe, simple check that ignores ties and tiebreakers).
export function eliminated(teams, sched, ui) {
  const me = teams[ui];
  const maxW = (me.w || 0) + left(sched, ui);
  return teams.filter((t, i) => i !== ui && t.c === me.c && (t.w || 0) > maxW).length >= 7;
}

const LABEL = { top: "the No. 1 seed", div: "the division", berth: "a playoff spot" };

// wk: the week about to be played. Returns { lines: [...], games: [{ g, root, why }] } or null
// when there's nothing to say (too early, or the season's decided for you).
export function raceWatch(teams, sched, ui, wk) {
  const me = teams[ui];
  if (!me || wk < 13 || wk > 18) return null;
  const week = sched.filter((g) => g.wk === wk && !g.played);
  const mine = week.find((g) => g.h === ui || g.a === ui);
  const now = clinchStatus(teams, sched, ui);
  const lines = [];
  if (eliminated(teams, sched, ui)) return { lines: ["You're out of the playoff race. Play for pride, and for draft position."], games: [], out: true };
  const others = week.filter((g) => g !== mine);
  const rival = (i) => i !== ui && teams[i]?.c === me.c;
  if (mine) {
    const win = { g: mine, winner: ui };
    for (const k of ["top", "div", "berth"]) {
      if (now[k]) continue;
      const a = after(teams, sched, [win]);
      if (clinchStatus(a.t2, a.s2, ui)[k]) { lines.push(`You clinch ${LABEL[k]} with a win.`); break; }
      // a win plus one other result
      const helper = others.map((g) => [g, rival(g.h) ? g.a : rival(g.a) ? g.h : null]).filter(([, w]) => w != null)
        .find(([g, w]) => { const b = after(teams, sched, [win, { g, winner: w }]); return clinchStatus(b.t2, b.s2, ui)[k]; });
      if (helper) { const [g, w] = helper; const l = w === g.h ? g.a : g.h; lines.push(`You clinch ${LABEL[k]} with a win and a ${teams[l].name} loss.`); break; }
    }
    const loss = after(teams, sched, [{ g: mine, winner: mine.h === ui ? mine.a : mine.h }]);
    if (!lines.length && eliminated(loss.t2, loss.s2, ui)) lines.push("A loss knocks you out of the playoff race.");
  }
  if (now.top) lines.unshift("You've locked up the No. 1 seed.");
  else if (now.div) lines.unshift("You've won the division.");
  else if (now.berth) lines.unshift("You're in the playoffs.");
  // the other games that matter: conference clubs within a game and a half of you
  const close = (i) => rival(i) && Math.abs(pct(teams[i]) - pct(me)) * Math.max(1, (me.w || 0) + (me.l || 0)) <= 1.5;
  const games = [];
  if (!now.top) for (const g of others) {
    const ch = close(g.h), ca = close(g.a);
    if (!ch && !ca) continue;
    // root against the club nearer to you (a division rival counts double)
    const near = (i) => (close(i) ? 1 : 0) * (teams[i].d === me.d && teams[i].c === me.c ? 2 : 1) / (1 + Math.abs(pct(teams[i]) - pct(me)) * 10);
    const root = near(g.h) > near(g.a) ? g.a : g.h, against = root === g.h ? g.a : g.h;
    games.push({ g, root, why: `${teams[against].name} ${teams[against].d === me.d && teams[against].c === me.c ? "are chasing you in the division" : "are in the wild-card race with you"}`, w: near(against) });
  }
  games.sort((a, b) => b.w - a.w);
  if (!lines.length && !games.length) return null;
  return { lines, games: games.slice(0, 4) };
}
