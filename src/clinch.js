// Clinching, worked out the safe way: a spot is locked only when no tiebreaker could take it away.
// A team "threatens" you if it could still finish with at least your wins (its wins now plus every
// game it has left). Division: no division rival threatens. First seed: no conference team does.
// Playoff berth: the division, or at most two conference teams threaten (then even if both take
// wild cards ahead of you, the third is yours).
const left = (sched, id) => sched.filter((g) => !g.played && typeof g.wk === "number" && g.wk <= 18 && (g.h === id || g.a === id)).length;

export function clinchStatus(teams, sched, ui) {
  const me = teams[ui];
  if (!me) return { berth: false, div: false, top: false };
  const myW = me.w || 0;
  const rivals = teams.map((t, i) => ({ t, i })).filter((x) => x.i !== ui && x.t.c === me.c);
  const threat = (x) => (x.t.w || 0) + left(sched, x.i) >= myW;
  const div = rivals.filter((x) => x.t.d === me.d).every((x) => !threat(x));
  const top = rivals.every((x) => !threat(x));
  const berth = div || rivals.filter(threat).length <= 2;
  return { berth, div, top };
}

// What's newly clinched since `had` ({ berth, div, top }), biggest first.
export const newClinches = (now, had = {}) => ["top", "div", "berth"].filter((k) => now[k] && !had[k]);
