// The face of a franchise: a star who has spent his career with one club (Mahomes in Kansas City,
// Allen in Buffalo, Watt in Pittsburgh). AI clubs keep him to the end: they re-sign him every time
// his deal is up (cutting others to fit him), never shop or cap-cut him, and only an overwhelming
// offer pries him loose, so in almost every league he retires where he played.
import { draftPedigree, clubsOf } from "./history.js";

const LEAGUE_START = 2026;

// Seasons he has been with club ab without a break, counting back from now: his league seasons
// there, and for a real player drafted there who never played anywhere else, his years before
// the league too.
export function clubYears(p, ab) {
  const sh = p?.sh || [];
  let n = 0;
  for (let i = sh.length - 1; i >= 0 && sh[i].tm === ab; i--) n++;
  if (n < sh.length) return n;   // he played for someone else in the league: just this stint
  const d = draftPedigree(p), clubs = clubsOf(p.name);
  if (d?.tm === ab && d.yr < LEAGUE_START && clubs.every((c) => c === ab)) n += LEAGUE_START - d.yr;
  return n;
}

const OL = new Set(["LT", "LG", "C", "RG", "RT", "OL"]);
const peakOf = (p) => Math.max(p.ovr, ...(p.oh || []).map((h) => h.o || 0));
// Could he be the face: a star (88+ at his best, still a player) five years or more with the
// club? Not a lineman, kicker or punter: the face is who the fans buy the jersey of.
const candidate = (p, ab) => p && !OL.has(p.pos) && p.pos !== "K" && p.pos !== "P" && p.ovr >= 70 && peakOf(p) >= 88 && clubYears(p, ab) >= 5;

// The club's face: its one such star, the best of them (a quarterback first), or null.
export function faceOf(t) {
  if (!t?.ab) return null;
  let best = null, bs = -1;
  for (const p of t.roster || []) {
    if (!candidate(p, t.ab)) continue;
    const s = peakOf(p) + (p.pos === "QB" ? 8 : 0) + Math.min(clubYears(p, t.ab), 12) * 0.3;
    if (s > bs) { best = p; bs = s; }
  }
  return best;
}
export const isFaceOf = (p, t) => !!p && faceOf(t)?.id === p.id;
