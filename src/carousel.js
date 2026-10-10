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

const ROLE = { oc: "OC", dc: "DC", st: "ST" };
const TITLE = { oc: "offensive coordinator", dc: "defensive coordinator", st: "special teams coordinator" };
const pct = (t) => ((t.w || 0) + 0.5 * (t.t || 0)) / Math.max(1, (t.w || 0) + (t.l || 0) + (t.t || 0));

// coachTeams: the clubs whose coaches change (this off-season's copies); perf: last season's
// standings (w/l/pf/pa) by the same index. pool: coaches on the market. Returns { moves, pool };
// mutates coachTeams[i].coach for AI clubs.
export function coachingCarousel(coachTeams, perf, ui, { pool = [], rand = Math.random } = {}) {
  const moves = [];
  const n = perf.length;
  const rank = (key, low) => perf.map((t, i) => [i, t[key] || 0]).sort((a, b) => (low ? a[1] - b[1] : b[1] - a[1])).map(([i]) => i);
  const offRank = rank("pf"), defRank = rank("pa", true); // best first
  const bottom = (order, i) => order.indexOf(i) >= n - 10;
  let market = [...pool];
  coachTeams.forEach((t, i) => {
    if (i === ui) return;
    const p = pct(perf[i]);
    const coach = { ...(t.coach || {}) };
    const fire = (role, why) => { const c = coach[role]; if (!c) return; moves.push({ ti: i, role, kind: "fired", name: c.name, why }); market.push({ ...c, contract: 2 }); coach[role] = null; };
    if (p < 0.4 && bottom(offRank, i) && rand() < 0.65) fire("oc", `a bottom-ten offense in a ${perf[i].w}-${perf[i].l} season`);
    if (p < 0.4 && bottom(defRank, i) && rand() < 0.65) fire("dc", `a bottom-ten defense in a ${perf[i].w}-${perf[i].l} season`);
    if (p < 0.5 && coach.st && coach.st.rating < 55 && rand() < 0.3) fire("st", "special teams that kept costing games");
    for (const role of ["oc", "dc", "st"]) {
      if (coach[role]) continue;
      // The market's best fits, plus a couple of fresh names; a better job (winning club) lands a better coach.
      const fresh = [genCoach(ROLE[role]), genCoach(ROLE[role])];
      const options = [...market.filter((c) => (c.role || "").toUpperCase() === ROLE[role]), ...fresh];
      const appeal = (c) => c.rating + rand() * 12 + p * 8;
      const pickC = options.sort((a, b) => appeal(b) - appeal(a))[0];
      market = market.filter((c) => c.id !== pickC.id);
      coach[role] = { ...pickC, role: ROLE[role], contract: 2 + Math.floor(rand() * 3), xp: 0 };
      moves.push({ ti: i, role, kind: "hired", name: pickC.name, scheme: pickC.scheme, rating: pickC.rating });
    }
    t.coach = coach;
  });
  return { moves, pool: market.slice(-24) };
}

export const describeMove = (m, teams) => {
  const t = teams[m.ti];
  return m.kind === "fired"
    ? `🔥 The ${t.city} ${t.name} fire ${TITLE[m.role]} ${m.name} after ${m.why}.`
    : `🤝 The ${t.city} ${t.name} hire ${m.name} as ${TITLE[m.role]}${m.scheme && m.role !== "st" ? ` (${m.scheme})` : ""}, rated ${m.rating}.`;
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
  if (noFire && next < 35) return { patience: Math.max(next, 10), verdict: "warning", msg: `The owner is furious about a ${rec} season, but you can't be fired in this franchise.` };
  if (next <= 5) return { patience: 0, verdict: "fired", msg: `After a ${rec} season the owner has seen enough: you've been fired.` };
  if (next < 35) return { patience: next, verdict: "ultimatum", msg: `Owner's ultimatum: after going ${rec}, things have to turn around next season or you're gone.` };
  if (d <= -10) return { patience: next, verdict: "warning", msg: `The owner isn't happy with a ${rec} season. His patience is wearing thin.` };
  return { patience: next, verdict: "fine", msg: champion ? "The owner is thrilled: champions!" : madePlayoffs ? `The owner is pleased with a ${rec} playoff season.` : `The owner noted a ${rec} season.` };
}

// Teams that would hire you after a firing: the clubs that just had the worst seasons.
export const jobOffers = (teams, ui, n = 3) => teams.map((t, i) => [t, i]).filter(([, i]) => i !== ui).sort((a, b) => pct(a[0]) - pct(b[0])).slice(0, n).map(([, i]) => i);
