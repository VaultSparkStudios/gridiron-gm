// Game-day weather. Clubs under a roof (domes and retractable roofs) always play indoors. Everyone
// else gets the weather of its city for that time of year: rain any week (Seattle the most), snow
// from mid-November on in the cold-weather cities (Buffalo and Green Bay the most), now and then a
// windy day. Rain and snow come light or heavy.
//
// What it does to the game: teams run more, passes are harder to complete and easier to pick off,
// the ball comes out more, footing slows the run game in snow, and kicks get shorter.

export const ROOF = new Set(["ARI", "ATL", "DAL", "DET", "HOU", "IND", "LV", "LAR", "LAC", "MIN", "NO"]);
// late-season snow chance in each open-air city, and its rain chance in any week
const SNOW = { GB: 0.42, BUF: 0.36, CHI: 0.26, CLE: 0.25, DEN: 0.24, NE: 0.23, PIT: 0.2, KC: 0.14, NYG: 0.23, NYJ: 0.23, CIN: 0.15, PHI: 0.12, BAL: 0.09, WAS: 0.07, SEA: 0.04, TEN: 0.04, CAR: 0.02 };
const RAIN = { SEA: 0.28, MIA: 0.15, TB: 0.15, JAX: 0.14, PIT: 0.13, NE: 0.12, PHI: 0.12, NYG: 0.12, NYJ: 0.12, CLE: 0.12, BAL: 0.12, WAS: 0.12, CAR: 0.12, CIN: 0.12, TEN: 0.12, BUF: 0.11, CHI: 0.11, KC: 0.1, SF: 0.1, GB: 0.08, DEN: 0.05 };
const HEAVY = 0.35, WIND = 0.05;

// Each condition: how it shows, and what it does. run: shift toward calling runs; comp: completion
// rate; int: interception rate; fum: fumble multiplier; fg: field-goal odds; runYds: yards per carry.
// What it does to the coaches: kick: yards off the longest field goal they will try; go: how much
// likelier they are to go for it on fourth and short (a bad kicking day makes points scarce).
export const WX = {
  clear: { label: "Clear", icon: "" },
  dome: { label: "Indoors", icon: "" },
  wind: { label: "Windy", icon: "", run: 0.03, comp: -0.02, int: 0.003, fg: -0.06, kick: 6, go: 1.15 },
  lightRain: { label: "Light rain", icon: "", rain: 1, run: 0.05, comp: -0.03, int: 0.004, fum: 1.5, fg: -0.04, kick: 2, go: 1.1 },
  heavyRain: { label: "Heavy rain", icon: "", rain: 2, run: 0.12, comp: -0.07, int: 0.009, fum: 2.3, fg: -0.1, runYds: -0.2, kick: 5, go: 1.3 },
  lightSnow: { label: "Light snow", icon: "", snow: 1, run: 0.07, comp: -0.03, int: 0.004, fum: 1.4, fg: -0.05, runYds: -0.2, kick: 4, go: 1.15 },
  frigid: { label: "Frigid", icon: "", cold: 1, run: 0.03, comp: -0.015, int: 0.002, fum: 1.25, fg: -0.04, kick: 3, go: 1.05 },
  heavySnow: { label: "Heavy snow", icon: "", snow: 2, run: 0.15, comp: -0.07, int: 0.008, fum: 2.0, fg: -0.12, runYds: -0.5, kick: 8, go: 1.4 },
};
export const wxOf = (key) => WX[key] || WX.clear;
export const isWet = (key) => !!(WX[key]?.rain || WX[key]?.snow);

// FNV-1a with a final mix: keys that differ only at the end (the weather roll and the heavy roll)
// must give unrelated numbers, or every wet game comes out heavy
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// How far into snow season a week is: none before November, a little in early November, more by
// Thanksgiving, the most in December and January, and the playoffs most of all (weeks after 18,
// or "P1"-style playoff weeks).
export function snowSeason(wk) {
  const w = typeof wk === "number" ? wk : 19;
  return w > 18 ? 1.5 : w >= 14 ? 1.25 : w >= 11 ? 0.7 : w >= 9 ? 0.3 : 0;
}

// The weather for one game (fixed for that game, so the preview and the game agree).
// g: { wk, h, a, neutral }; homeAb: the home club's abbreviation.
// A playoff game is week 18 plus its round wherever it's asked from ("P3" in the live game, 21 in
// the forecast and the sim), so they all roll the same weather.
const weekOf = (wk) => { const m = /^P(\d)$/.exec(String(wk)); return m ? 18 + +m[1] : wk; };
export function gameWeather(g, yr, homeAb) {
  if (g.neutral) return "clear";
  if (!homeAb || ROOF.has(homeAb)) return "dome";
  const wk = weekOf(g.wk);
  const r = hash(`${yr}|${wk}|${g.h}|${g.a}|wx`), heavy = hash(`${yr}|${wk}|${g.h}|${g.a}|hv`) < HEAVY;
  const snow = (SNOW[homeAb] || 0) * snowSeason(wk), rain = RAIN[homeAb] ?? 0.1;
  if (r < snow) return heavy ? "heavySnow" : "lightSnow";
  if (r < snow + rain) return heavy ? "heavyRain" : "lightRain";
  if (r < snow + rain + WIND) return "wind";
  // a dry day in a cold-weather city from December on is usually a frigid one (January in New York
  // or Green Bay is rarely just "clear")
  if ((SNOW[homeAb] || 0) >= 0.12 && typeof wk === "number" && wk >= 14 && hash(`${yr}|${wk}|${g.h}|${g.a}|cold`) < (wk > 18 ? 0.75 : 0.5)) return "frigid";
  return "clear";
}
