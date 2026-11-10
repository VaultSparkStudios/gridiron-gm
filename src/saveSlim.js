// Saves without the bulk nobody reads back: a save of a few seasons was 6-7 MB, mostly old box
// scores and every player's full game log. Everything a screen shows is kept:
//  - game logs: each player's last 6 games (his card shows the last 5);
//  - box scores: your club's games, and every game from the last two weeks; older games between
//    other clubs keep their scores (and any drive summary);
//  - the draft log: just what the draft recap reads for each pick.
// Returns a new save object; the game's live state isn't touched.
export const KEEP_GAMES = 6;

const lightPick = (p) => p && { id: p.id, name: p.name, pos: p.pos, mpos: p.mpos, ...(p.pos === "DL" ? { posAttrs: p.posAttrs, spd: p.spd } : {}), age: p.age, ovr: p.ovr, pot: p.pot, trueOvr: p.trueOvr, truePot: p.truePot, dev: p.dev, scout: p.scout?.dev ? { dev: p.scout.dev } : undefined, gem: p.gem, bust: p.bust, cons: p.cons ? { final: p.cons.final, mid: p.cons.mid } : undefined };

const trimLog = (p) => (p && Array.isArray(p.gl) && p.gl.length > KEEP_GAMES ? { ...p, gl: p.gl.slice(-KEEP_GAMES) } : p);

export function slimSave(d) {
  if (!d || typeof d !== "object") return d;
  const out = { ...d };
  if (Array.isArray(d.teams)) out.teams = d.teams.map((t) => ({ ...t, roster: (t.roster || []).map(trimLog), ps: (t.ps || []).map(trimLog), ir: (t.ir || []).map(trimLog) }));
  if (Array.isArray(d.fa)) out.fa = d.fa.map(trimLog);
  if (Array.isArray(d.waivers)) out.waivers = d.waivers.map(trimLog);
  if (Array.isArray(d.sched)) {
    const recent = (d.wk || 0) - 1;
    out.sched = d.sched.map((g) => (g && g.played && (g.boxH || g.boxA) && g.h !== d.ui && g.a !== d.ui && (g.wk || 0) < recent ? (({ boxH, boxA, ...rest }) => rest)(g) : g));
  }
  if (Array.isArray(d.draftLog)) out.draftLog = d.draftLog.map((e) => (e?.player ? { ...e, player: lightPick(e.player) } : e));
  return out;
}
