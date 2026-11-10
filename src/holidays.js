// Holiday games: Halloween, Thanksgiving, Christmas and New Year's. The NFL season opens the Thursday after
// Labor Day, so each holiday falls in a known week: the games that week are the event.
//   Thanksgiving: Detroit and Dallas host (they always have), plus the night game.
//   Christmas: the best matchups of the Christmas week (three of them).
//   Halloween: one marquee night game.
//   New Year's: a New Year's Eve game and a New Year's Day game (the week of January 1).
// A season on the real schedule (it has dates) uses the games actually played on those days.

export const HOLIDAYS = {
  halloween: { key: "halloween", name: "Halloween Night", short: "Halloween", icon: "", c1: "#f97316", c2: "#7c3aed", bg: "#1a0b2e", line: "Under the full moon, a costume-party crowd and a game nobody forgets." },
  thanksgiving: { key: "thanksgiving", name: "Thanksgiving Day", short: "Thanksgiving", icon: "", c1: "#d97706", c2: "#9a3412", bg: "#2a1406", line: "Football and family: the whole country is watching." },
  xmaseve: { key: "xmaseve", theme: "christmas", name: "Christmas Eve", short: "Christmas Eve", icon: "", c1: "#dc2626", c2: "#15803d", bg: "#0b2015", line: "The night before Christmas, and the whole league is watching." },
  christmas: { key: "christmas", name: "Christmas Day", short: "Christmas", icon: "", c1: "#dc2626", c2: "#15803d", bg: "#0b2015", line: "The league's gift to everyone home for the holiday." },
  // New Year's Eve and Day share one look (theme): midnight, gold and silver, fireworks
  nye: { key: "nye", theme: "newyear", name: "New Year's Eve", short: "New Year's Eve", icon: "", c1: "#fbbf24", c2: "#94a3b8", bg: "#0a0b1f", line: "The last game of the year, and the clock runs out at midnight." },
  nyd: { key: "nyd", theme: "newyear", name: "New Year's Day", short: "New Year's Day", icon: "", c1: "#fbbf24", c2: "#94a3b8", bg: "#0a0b1f", line: "A new year, a clean slate, and a game the whole country wakes up to." },
};
// the look a holiday uses (New Year's Eve and Day share one)
export const themeOf = (key) => HOLIDAYS[key]?.theme || key;

const DAY = 86400000;
const utc = (y, m, d) => Date.UTC(y, m, d);
// Labor Day is the first Monday of September; the season kicks off that Thursday.
export function kickoff(yr) {
  const sep1 = new Date(utc(yr, 8, 1)).getUTCDay(); // 0 = Sunday
  const labor = 1 + ((8 - sep1) % 7);
  return utc(yr, 8, labor + 3);
}
// The fourth Thursday of November.
export function thanksgiving(yr) {
  const nov1 = new Date(utc(yr, 10, 1)).getUTCDay();
  return utc(yr, 10, 1 + ((4 - nov1 + 7) % 7) + 21);
}
// The week (Thursday to Wednesday) a date falls in.
export const weekOf = (date, yr) => Math.floor((date - kickoff(yr)) / DAY / 7) + 1;
export function holidayWeeks(yr) {
  return { halloween: weekOf(utc(yr, 9, 31), yr), thanksgiving: weekOf(thanksgiving(yr), yr), christmas: weekOf(utc(yr, 11, 25), yr), newyear: weekOf(utc(yr + 1, 0, 1), yr) };
}

const strength = (t) => { const o = (t?.roster || []).map((p) => p.ovr || 0).sort((a, b) => b - a).slice(0, 22); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); };
// the calendar day a real-schedule game is played on, in New York
const nyDay = (iso) => { const d = new Date(iso); if (isNaN(d)) return null; const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d).map((x) => [x.type, x.value])); return `${+p.month}/${+p.day}`; };

// Tag a season's holiday games (g.holiday). Returns a new schedule; unplayed Thanksgiving games
// in Detroit and Dallas are flipped so they host (with the other meeting flipped too when the two
// clubs play twice, so home games stay even). abOf(i): a club's abbreviation.
// Safe to run again on a tagged season: a holiday that already has its games is left alone.
export const HOLIDAY_TAGS = 3; // bump when a holiday is added, so running seasons pick it up
export function tagHolidays(sched, yr, teams, abOf) {
  const out = sched.map((g) => ({ ...g }));
  const has = (...keys) => out.some((g) => keys.includes(g.holiday));
  const wk = holidayWeeks(yr);
  const reg = (w) => out.filter((g) => g.wk === w && !g.holiday);
  const best = (list, n) => [...list].sort((a, b) => strength(teams[b.h]) + strength(teams[b.a]) - strength(teams[a.h]) - strength(teams[a.a])).slice(0, n);
  const dated = out.some((g) => g.date);
  const on = (md) => out.filter((g) => g.date && nyDay(g.date) === md);
  // Thanksgiving
  let tg = has("thanksgiving") ? [] : dated ? on(`11/${new Date(thanksgiving(yr)).getUTCDate()}`) : [];
  if (!tg.length && !has("thanksgiving")) {
    const list = reg(wk.thanksgiving);
    for (const ab of ["DET", "DAL"]) {
      const g = list.find((x) => abOf(x.h) === ab || abOf(x.a) === ab);
      if (!g || tg.includes(g)) continue;
      if (abOf(g.a) === ab && !g.played) {
        const other = out.find((x) => x !== g && !x.played && x.h === g.a && x.a === g.h);
        [g.h, g.a] = [g.a, g.h];
        if (other) [other.h, other.a] = [other.a, other.h];
      }
      tg.push(g);
    }
    tg.push(...best(list.filter((g) => !tg.includes(g)), 3 - tg.length));
  }
  tg.forEach((g) => { g.holiday = "thanksgiving"; });
  // Christmas
  let xm = has("christmas") ? [] : dated ? on("12/25") : [];
  if (!xm.length && !has("christmas")) xm = best(reg(wk.christmas), 3);
  xm.forEach((g) => { g.holiday = "christmas"; });
  // Christmas Eve: the games actually played on Dec 24 (the real schedule has them)
  if (dated && !has("xmaseve")) on("12/24").forEach((g) => { if (!g.holiday) g.holiday = "xmaseve"; });
  // Halloween: the game on the night itself, or the week's marquee game
  let hw = has("halloween") ? [] : dated ? on("10/31") : [];
  if (!hw.length && !has("halloween")) hw = best(reg(wk.halloween), 1);
  hw.slice(0, 1).forEach((g) => { g.holiday = "halloween"; });
  // New Year's: the games on Dec 31 and Jan 1, or the week's two best (Eve, then Day); a week
  // past the regular season (the playoffs) has none
  const eve = dated && !has("nye", "nyd") ? on("12/31") : [], day = dated && !has("nye", "nyd") ? on("1/1") : [];
  if (!dated && wk.newyear <= 18 && !has("nye", "nyd")) { const two = best(reg(wk.newyear), 2); if (two[0]) eve.push(two[0]); if (two[1]) day.push(two[1]); }
  eve.forEach((g) => { if (!g.holiday) g.holiday = "nye"; });
  day.forEach((g) => { if (!g.holiday) g.holiday = "nyd"; });
  if (out[0]) out[0].holTag = HOLIDAY_TAGS;
  return out;
}
