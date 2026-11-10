// The coaching carousel and your owner's patience, both settled in the off-season.
//
// Carousel: a struggling AI club fires the coordinator whose side of the ball let it down (a
// bottom-ten offense costs the OC his job more often than not), now and then a weak special teams
// coach, and every club fills its open jobs (firings and expired contracts) from the coaching
// market. New hires bring their own scheme and rating, so a club's identity changes with them.
//
// Owner patience (0-100): winning, the playoffs and titles build it; losing seasons drain it.
// Below 35 the owner issues an ultimatum; at 5 or less he fires you.
import { genCoach } from "./league.js";
import { BORN } from "./data/coachAges.js";

// Coaches age too. A real coach's age comes from his birth year; anyone else gets a believable one for
// his job (the same every time for the same coach). From 62 on, each off-season may be his last.
const hash = (s) => { let h = 0; for (const ch of String(s || "")) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
export function coachAge(c, yr) {
  if (typeof c?.age === "number") return c.age;
  if (BORN[c?.name]) return yr - BORN[c.name];
  const base = { HC: 52, OC: 45, DC: 47, ST: 47 }[(c?.role || "").toUpperCase()] ?? 48;
  return base + (hash(c?.id || c?.name) % 13) - 6;
}
export const coachRetireChance = (age) => (age >= 71 ? 0.5 : age >= 68 ? 0.3 : age >= 65 ? 0.15 : age >= 62 ? 0.06 : 0);

// A head coach doesn't walk away mid-deal: he plans his exit. Each has the age he'll step away at
// (64-72, the same every time for the same coach), and when his contract runs out at or past it,
// he retires instead of signing again. You hear it as soon as his current deal will take him there,
// and he won't sign an extension that runs past it.
// yr: the season being played (or just finished, before the new league year).
// The league's veteran head coaches step away about when you'd expect (the last season in brackets):
// John Harbaugh just took the Giants job (2035), Andy Reid (2029), Sean Payton and Mike McCarthy (2031).
const HC_EXIT = { "John Harbaugh": 73, "Andy Reid": 71, "Sean Payton": 68, "Mike McCarthy": 68 };
export const hcRetireAge = (c) => HC_EXIT[c?.name] ?? 64 + (hash(`${c?.name || c?.id}:exit`) % 9);
// the last season of his contract
export const hcEndYear = (c, yr) => yr + Math.max(1, c?.contract || 1) - 1;
const ageIn = (c, yr, s) => coachAge(c, yr) + (s - yr);
// He retires when this contract ends (null if not).
export const hcRetiring = (c, yr) => (c && ageIn(c, yr, hcEndYear(c, yr)) >= hcRetireAge(c) ? hcEndYear(c, yr) : null);
// The most years an extension can add before he'd rather retire.
export const hcExtMax = (c, yr) => (c ? Math.max(0, hcRetireAge(c) - 1 - ageIn(c, yr, hcEndYear(c, yr))) : 0);

const ROLE = { hc: "HC", oc: "OC", dc: "DC", st: "ST" };
const TITLE = { hc: "head coach", oc: "offensive coordinator", dc: "defensive coordinator", st: "special teams coordinator" };
const pct = (t) => ((t.w || 0) + 0.5 * (t.t || 0)) / Math.max(1, (t.w || 0) + (t.l || 0) + (t.t || 0));

// coachTeams: the clubs whose coaches change (this off-season's copies); perf: last season's
// standings (w/l/pf/pa) by the same index. pool: coaches on the market. Returns { moves, pool };
// mutates coachTeams[i].coach for AI clubs.
export function coachingCarousel(coachTeams, perf, ui, { pool = [], rand = Math.random, yr = 2026 } = {}) {
  const moves = [];
  const n = perf.length;
  const rank = (key, low) => perf.map((t, i) => [i, t[key] || 0]).sort((a, b) => (low ? a[1] - b[1] : b[1] - a[1])).map(([i]) => i);
  const offRank = rank("pf"), defRank = rank("pa", true); // best first
  const bottom = (order, i) => order.indexOf(i) >= n - 10;
  let market = [...pool];
  coachTeams.forEach((t, i) => {
    const coach = { ...(t.coach || {}) };
    // a year older, and maybe done (your staff too: the job opens on your Coaching page)
    for (const role of ["hc", "oc", "dc", "st"]) {
      const c = coach[role];
      if (!c) continue;
      const age = coachAge(c, yr) + 1;
      if (role === "hc") {
        // a head coach's deal counts down too; when it ends he retires if he's reached his age,
        // otherwise he signs on again (2-4 years, never past his exit)
        const left = (c.contract || 3) - 1;
        if (left <= 0 && hcRetiring(c, yr)) { moves.push({ ti: i, role, kind: "retired", name: c.name, age }); coach.hc = null; continue; }
        if (left > 0) { coach.hc = { ...c, age, contract: left }; continue; }
        const room = Math.max(0, hcRetireAge(c) - 1 - age);
        const yrs = Math.max(1, Math.min(room + 1, 2 + Math.floor(rand() * 3)));
        coach.hc = { ...c, age, contract: yrs };
        moves.push({ ti: i, role, kind: "renewed", name: c.name, yrs });
        continue;
      }
      if (rand() < coachRetireChance(age)) { moves.push({ ti: i, role, kind: "retired", name: c.name, age }); coach[role] = null; }
      else coach[role] = { ...c, age };
    }
    // the head coach who now knows his deal is his last says so
    // (once: the season he's said is stamped on him)
    if (coach.hc) { const end = hcRetiring(coach.hc, yr + 1); if (end != null && coach.hc.lastSeason !== end) { coach.hc = { ...coach.hc, lastSeason: end }; moves.push({ ti: i, role: "hc", kind: "lastDeal", name: coach.hc.name, end, age: coachAge(coach.hc, yr + 1) }); } }
    if (i === ui) { t.coach = coach; return; }
    const p = pct(perf[i]);
    const fire = (role, why) => { const c = coach[role]; if (!c) return; moves.push({ ti: i, role, kind: "fired", name: c.name, why }); market.push({ ...c, contract: 2, fired: true, from: t.ab }); coach[role] = null; };
    // a losing season can cost the head coach his job too (rarely a great one)
    if (p < 0.3 && coach.hc && rand() < (coach.hc.rating >= 88 ? 0.08 : 0.35)) fire("hc", `a ${perf[i].w}-${perf[i].l} season`);
    if (p < 0.4 && bottom(offRank, i) && rand() < 0.65) fire("oc", `a bottom-ten offense in a ${perf[i].w}-${perf[i].l} season`);
    if (p < 0.4 && bottom(defRank, i) && rand() < 0.65) fire("dc", `a bottom-ten defense in a ${perf[i].w}-${perf[i].l} season`);
    if (p < 0.5 && coach.st && coach.st.rating < 55 && rand() < 0.3) fire("st", "special teams that kept costing games");
    for (const role of ["hc", "oc", "dc", "st"]) {
      if (coach[role]) continue;
      // The market's best fits, plus a couple of fresh names; a better job (winning club) lands a better coach.
      const fresh = [genCoach(ROLE[role]), genCoach(ROLE[role])];
      // never the coach this club just let go
      const options = [...market.filter((c) => (c.role || "").toUpperCase() === ROLE[role] && !(c.from === t.ab && (c.fired || c.expired))), ...fresh];
      const appeal = (c) => c.rating + rand() * 12 + p * 8;
      const pickC = options.sort((a, b) => appeal(b) - appeal(a))[0];
      market = market.filter((c) => c.id !== pickC.id);
      const { fired: _f, expired: _e, from: _fr, ...hired } = pickC;
      coach[role] = { ...hired, role: ROLE[role], contract: 2 + Math.floor(rand() * 3), xp: 0 };
      moves.push({ ti: i, role, kind: "hired", name: pickC.name, scheme: pickC.scheme, rating: pickC.rating });
    }
    t.coach = coach;
  });
  // the market ages with everyone else; past 70, a coach between jobs has coached his last
  market = market.map((c) => ({ ...c, age: coachAge(c, yr) + (c.age == null ? 0 : 1) })).filter((c) => c.age < 70);
  return { moves, pool: market.slice(-24) };
}

export const describeMove = (m, teams) => {
  const t = teams[m.ti];
  if (m.kind === "retired") return `${t.city} ${t.name} ${TITLE[m.role]} ${m.name} retires at ${m.age}.`;
  if (m.kind === "renewed") return `The ${t.city} ${t.name} sign head coach ${m.name} to a ${m.yrs}-year extension.`;
  if (m.kind === "lastDeal") return `${t.city} ${t.name} head coach ${m.name} (${m.age}) says ${m.end} will be his last season.`;
  return m.kind === "fired"
    ? `The ${t.city} ${t.name} fire ${TITLE[m.role]} ${m.name} after ${m.why}.`
    : `The ${t.city} ${t.name} hire ${m.name} as ${TITLE[m.role]}${m.scheme && m.role !== "st" ? ` (${m.scheme})` : ""}, rated ${m.rating}.`;
};

// The owner's verdict on your season. Returns { patience, verdict, msg }.
// noFire: the franchise setting that turns firing off (the owner still reacts, but never fires
// you or issues an ultimatum).
export function ownerReview(patience, team, { madePlayoffs = false, champion = false, wonDivision = false, noFire = false } = {}) {
  const p = pct(team);
  let d = (p - 0.5) * 50 + (madePlayoffs ? 12 : 0) + (wonDivision ? 5 : 0) + (champion ? 30 : 0);
  if (!madePlayoffs && p < 0.42) d -= p < 0.35 ? 10 : 6;
  const next = Math.max(0, Math.min(100, Math.round((patience ?? 70) + d)));
  const rec = `${team.w || 0}-${team.l || 0}${team.t ? `-${team.t}` : ""}`;
  const aRec = `${/^(8|11|18)-/.test(rec) ? "an" : "a"} ${rec}`; // "an 8-9 season", "a 10-7 season"
  if (noFire && next < 35) return { patience: Math.max(next, 10), verdict: "warning", msg: `The owner is furious about ${aRec} season, but you can't be fired in this franchise.` };
  if (next <= 5) return { patience: 0, verdict: "fired", msg: `After ${aRec} season the owner has seen enough: you've been fired.` };
  if (next < 35) return { patience: next, verdict: "ultimatum", msg: `Owner's ultimatum: after going ${rec}, things have to turn around next season or you're gone.` };
  if (d <= -10) return { patience: next, verdict: "warning", msg: `The owner isn't happy with ${aRec} season. His patience is wearing thin.` };
  return { patience: next, verdict: "fine", msg: champion ? "The owner is thrilled: champions!" : madePlayoffs ? `The owner is pleased with ${aRec} playoff season.` : `The owner noted ${aRec} season.` };
}

// Teams that would hire you after a firing: the clubs that just had the worst seasons.
export const jobOffers = (teams, ui, n = 3) => teams.map((t, i) => [t, i]).filter(([, i]) => i !== ui).sort((a, b) => pct(a[0]) - pct(b[0])).slice(0, n).map(([, i]) => i);
