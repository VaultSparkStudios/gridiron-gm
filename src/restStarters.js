// Resting starters: once your club has the No. 1 seed locked up, the last regular-season games
// don't matter, and a star hurt in Week 18 is a playoff run gone. With rest on, your starters play
// about a quarter of each game (the quarterback a series or two) and the backups the rest; a
// player's injury risk follows his snaps, so it falls by about three-quarters. A starter with no
// healthy backup at his spot plays as usual.
import { STARTERS } from "./depth.js";
import { depthOrderFor } from "./depth.js";

export const REST_SNAPS = { QB: 15, default: 25 };

// May rest: the regular season, the No. 1 seed clinched this year, and a game still to play.
export const canRest = ({ sp, clinched, yr, sched, ui }) =>
  sp === "regular" && clinched?.yr === yr && !!clinched?.top && (sched || []).some((g) => !g.played && typeof g.wk === "number" && g.wk <= 18 && (g.h === ui || g.a === ui));

// Snap shares for a rested game: your own settings, with every starter who has a healthy backup
// cut to his rest share.
export function restSnaps(team, depthOrder, playingTime = {}) {
  const healthy = (team?.roster || []).filter((p) => !p.injured && !p.holdout && !p.suspended);
  const out = { ...playingTime };
  for (const [pos, n] of Object.entries(STARTERS)) {
    if (pos === "K" || pos === "P") continue;
    const order = depthOrderFor(healthy, depthOrder, pos, playingTime);
    if (order.length <= n) continue;   // nobody to spell them
    for (const p of order.slice(0, n)) out[p.id] = REST_SNAPS[pos] ?? REST_SNAPS.default;
  }
  return out;
}
