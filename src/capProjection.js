// The cap's long view: what's already committed for this cap year and the next three, so you can
// see what a deal does to the seasons after this one. A player counts in a year while his deal
// runs (salary, plus any base salary a restructure pushed back), then his extension takes over
// if he has one; dead money lands in the years it was charged to.
import { capFor, getCapPhase } from "./cap.js";
import { yearsLeft } from "./bonus.js";
import { coachPay } from "./extensions.js";

const r1 = (x) => Math.round((+x || 0) * 10) / 10;

// The hit a player carries k years from now (k = 0 is this cap year), and whether it's an extension.
// left: years his deal still runs from this cap year (yearsLeft; in the off-season a deal's
// contract count hasn't ticked down yet).
export function hitIn(p, k, left = p.contract || 0) {
  if (k < left) return { hit: (p.salary || 0) + (k >= 1 ? p.baseBack || 0 : 0), ext: false };
  if (p.ext && k < left + (p.ext.yrs || 0)) return { hit: p.ext.sal || 0, ext: true };
  return null;
}

// cy: the cap year now (the league year a contract signed today counts in first).
// extra: an optional deal being considered, { sal, yrs, start = 0, skip } (counts from cap year
// start; skip: a player id to leave out, e.g. the player whose new deal it is).
// Returns [{ yr, cap, committed, dead, room, players, expiring: [p...] }] for four years.
// room0: this cap year's actual room (the cap screen's figure, which also counts the practice squad
// and other charges); when given, this year is shown with it.
// yr, sp: the season and phase (so off-season deals count the right years); the game's current
// ones unless given.
// rookies: next season's rookie class (until the draft), counted in year 1. Every later year also
// carries the coordinators' salaries, and year 1 the incentives already earned; void-year money
// lands the year after a deal ends. (The same charges the cap screen counts.)
export function capProjection(team, cy, { years = 4, extra = null, room0 = null, yr = getCapPhase().yr, sp = getCapPhase().sp, rookies = 0 } = {}) {
  const all = [...(team.roster || []), ...(team.ir || [])].filter((p) => !extra?.skip || p.id !== extra.skip);
  const lefts = new Map(all.map((p) => [p, yearsLeft(p, yr, sp)]));
  const hitIn_ = (p, k) => hitIn(p, k, lefts.get(p));
  const out = [];
  for (let k = 0; k < years; k++) {
    const dead = k === 0 ? team.deadCap || 0 : k === 1 ? team.deadNext || 0 : 0;
    let committed = dead + (k >= 1 ? coachPay(team) : 0) + (k === 1 ? (team.incNext || 0) + rookies : 0), players = 0;
    for (const p of all) {
      const h = hitIn_(p, k); if (h) { committed += h.hit; players++; }
      if (k >= 1 && p.voidDead && lefts.get(p) === k) committed += p.voidDead;
    }
    const st = extra?.start || 0;
    if (extra && k >= st && k < st + (extra.yrs || 0)) { committed += extra.sal || 0; players++; }
    // starters whose deal (and any extension) ends after this year: next year's re-sign decisions
    const expiring = all.filter((p) => hitIn_(p, k) && !hitIn_(p, k + 1) && (p.ovr || 0) >= 74).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    const cap = capFor(cy + k);
    if (k === 0 && room0 != null && Number.isFinite(room0)) committed = cap - room0;
    out.push({ yr: cy + k, cap, committed: r1(committed), dead: r1(dead), room: r1(cap - committed), players, expiring });
  }
  return out;
}
