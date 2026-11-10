// Scouting misses. A drafted player's potential (POT) starts as what was believed on draft day:
// your scouts' read for your own picks (exact only if they nailed him), the public board's for
// everyone else. The truth comes out over his first two seasons, the way it does on a real staff:
// a first read by midseason of his rookie year, most of it by the end of that season, and all of
// it by the end of his second. His real ceiling drives his growth the whole time (truePot); only
// what the club believes (pot) moves. Hidden gems and red-flag busts only show up as such then.
import { publicPot, stream } from "./scouting.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const REVEAL = [0, 0.4, 0.75, 1];

// The POT believed on draft day. read: your scouts' read of him (prospectRead), or null. Without
// a read of your own it's the league's: the public board's ceiling (blind to gems and red flags),
// off by a few points either way, the same few points every time for the same player.
export const PUBLIC_MISS_SD = 4.5;
export function draftedPot(p, read) {
  const v = read?.potV;
  if (v != null) return Math.round(v);
  const miss = clamp(stream(`miss|${p.id}`).gauss(0, PUBLIC_MISS_SD), -10, 10);
  return Math.round(publicPot(p) + miss);
}

// Stamp a freshly drafted player with what's believed (no-op when it's already the truth).
export function tagDraftee(np, believed) {
  if (believed == null || Math.round(believed) === Math.round(np.truePot ?? np.pot)) return np;
  return { ...np, pot: clamp(Math.round(believed), np.ovr || 0, 99), potRev: { from: Math.round(believed), stage: 0 } };
}

// How far along the reveal should be in season yr after week wk. rk: his rookie season.
export function revealStage(rk, yr, wk) {
  if (yr > rk + 1 || (yr === rk + 1 && wk >= 18)) return 3;
  if (yr > rk || (yr === rk && wk >= 18)) return 2;
  if (yr === rk && wk >= 9) return 1;
  return 0;
}

// Move every drafted player's believed POT toward the truth. Mutates the players. Returns the
// news for your club: [{ p, stage, from, to, truth, gap }] (only real misses, 4+ points either way).
export function revealRookies(teams, ui, yr, wk) {
  const news = [];
  teams.forEach((t, ti) => {
    for (const p of [...(t.roster || []), ...(t.ir || [])]) {
      const r = p.potRev;
      if (!r || r.stage >= 3) continue;
      const rk = p.rkYr ?? (p.draftYr != null ? p.draftYr + 1 : null);
      if (rk == null) continue;
      const st = revealStage(rk, yr, wk);
      if (st <= r.stage) continue;
      const truth = p.truePot ?? p.pot, before = p.pot;
      const now = st >= 3 ? truth : Math.round(r.from + (truth - r.from) * REVEAL[st]);
      p.pot = clamp(now, p.ovr || 0, 99);
      p.potRev = { ...r, stage: st };
      const gap = truth - r.from;
      if (ti === ui && Math.abs(gap) >= 4 && p.pot !== before) news.push({ p, stage: st, from: r.from, to: p.pot, truth, gap });
    }
  });
  return news;
}

// One line of news for a reveal.
export function revealLine({ p, stage, from, to, gap }) {
  const up = gap > 0, who = `${p.name} (${p.pos})`;
  if (stage >= 3) return up
    ? `SCOUTING STEAL: ${who} is better than anyone thought. His ceiling is ${to}, not the ${from} your draft-day read had`
    : `SCOUTING MISS: ${who} isn't what the scouts said. His ceiling is ${to}, not the ${from} your draft-day read had`;
  return up
    ? `${who} is showing more than expected: the coaches now see a ceiling around ${to} (draft-day read ${from})`
    : `${who} isn't developing like the scouts said: the coaches now see a ceiling around ${to} (draft-day read ${from})`;
}
