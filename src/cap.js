// The salary cap, in real dollars ($M). The NFL's actual caps through 2026 ($301.2M), then it
// keeps rising every league year (5.5-8.5%, about the recent pace). New contracts are priced as
// a share of the cap for the league year they start in, so a star costs the same slice of the cap
// in 2031 as today; existing deals stay fixed in dollars, as real contracts do.
const KNOWN = { 2023: 224.8, 2024: 255.4, 2025: 279.2, 2026: 301.2 };
export const BASE_YEAR = 2026;

// The roster data (and saves made before the cap rose) use a flat $200M cap.
export const DATA_CAP = 200;
export const DATA_TO_DOLLARS = KNOWN[BASE_YEAR] / DATA_CAP;

const hash = (n) => { let h = 2166136261; for (const c of String(n)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const growth = (yr) => 0.055 + (hash(`cap${yr}`) % 31) / 1000;
const r1 = (x) => Math.round(x * 10) / 10;

export function capFor(yr) {
  if (KNOWN[yr]) return KNOWN[yr];
  if (yr < 2023) return KNOWN[2023];
  let c = KNOWN[BASE_YEAR];
  for (let y = BASE_YEAR + 1; y <= yr; y++) c = r1(c * (1 + growth(y)));
  return c;
}
export const capFloor = (yr) => r1(capFor(yr) * 0.75);
export const minSalary = (yr) => r1(Math.max(0.8, capFor(yr) * 0.0033));

// The league year in force. A new league year (and cap) starts with re-sign week in March, so
// from then through the draft it's next season's cap. The app sets this as the season moves.
let leagueYear = BASE_YEAR;
export const setLeagueYear = (yr) => { leagueYear = yr; };
export const getLeagueYear = () => leagueYear;
export const leagueCap = () => capFor(leagueYear);
export const leagueFloor = () => capFloor(leagueYear);
export const leagueMin = () => minSalary(leagueYear);
export const capYearFor = (yr, sp) => (["resign", "freeagency", "draft"].includes(sp) ? yr + 1 : yr);

// The season and phase, so a cap count knows who's still on the books. In re-sign week the cap is
// already next season's, and a deal in its last year is ending: it no longer counts unless it's a
// new deal for next season (cy).
let phase = { yr: BASE_YEAR, sp: "preseason" };
export const setCapPhase = (yr, sp) => { phase = { yr, sp }; };
export const getCapPhase = () => phase;
export const expiringNow = (p) => phase.sp === "resign" && (p?.contract || 0) <= 1 && p?.cy !== phase.yr + 1;

// Rookie wage scale by overall pick, as a share of the cap, from the 2025 class: about $13M a year
// at #1 (Cam Ward, 4.4% of the cap), $3.7M at #32, $2.6M to $1.9M in round 2, $1.6M at the top of
// round 3 and the minimum from late in round 4.
export function rookieSalary(overall, cap = leagueCap()) {
  const share = overall <= 32 ? 0.0437 - (0.0315 * (overall - 1)) / 31 : overall <= 64 ? 0.0093 - (0.0025 * (overall - 33)) / 31 : Math.max(0.0034, 0.0057 - (overall - 65) * 0.00004);
  return r1(cap * share);
}

// Saves from before the cap moved to real dollars kept every salary on a flat $200M cap. Scale
// them once so each deal keeps its share of the cap. Mutates and returns the save.
export function migrateCap(d) {
  if (!d || d.capv >= 2) return d;
  const k = capFor(capYearFor(d.yr || BASE_YEAR, d.sp)) / DATA_CAP;
  const scale = (p) => { if (p && typeof p.salary === "number") p.salary = r1(p.salary * k); };
  for (const t of d.teams || []) {
    for (const list of [t.roster, t.ps, t.ir]) (list || []).forEach(scale);
    for (const c of Object.values(t.coach || {})) scale(c);
    if (t.deadCap) t.deadCap = r1(t.deadCap * k);
  }
  for (const list of [d.fa, d.waivers]) (list || []).forEach(scale);
  d.capv = 2;
  return d;
}
