// League drama: the stories that aren't about the score. Every week, written from what happened
// (a four-interception day, a kicker who cost his team the game, a blowout that boils over on the
// sideline) and from what's brewing (a star on a bad team who wants out, a contract standoff, a
// quarterback controversy, a coach on the hot seat). Now and then a player lands in serious
// trouble off the field and the league suspends him, which keeps him off the field.
//
// Off-field incidents (arrests, abuse allegations, PEDs, gambling) only ever involve the game's
// own generated players, never a real person (real NFL players from the Madden rosters or the
// real college prospects in the draft classes).
//
// Each story: { id, kind, team, head, text, mine, breaking }.

const pct = (t) => (t.w + 0.5 * (t.t || 0)) / Math.max(1, t.w + t.l + (t.t || 0));
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const last = (name) => (name || "").split(" ").slice(1).join(" ") || name;
export const isFictional = (p) => !!p && p.src !== "m27" && !p.real;

// Suspensions run down by the weeks played; returns your club's players who are back.
export function serveSuspensions(teams, weeks = 1, ui = -1) {
  const back = [];
  teams.forEach((t, ti) => (t.roster || []).forEach((p) => {
    if (!p.suspended || p.suspWksLeft == null) return;
    p.suspWksLeft = Math.max(0, p.suspWksLeft - weeks);
    if (p.suspWksLeft <= 0) { p.suspended = false; p.suspWksLeft = null; if (ti === ui) back.push(p); }
  }));
  return back;
}

// The off-field incidents, with the league's response (weeks out; 99 = the rest of the season).
const OFF_FIELD = [
  { k: "dv", w: 3, wks: [6, 8], head: (n) => `${n} arrested on domestic violence charges`,
    text: (n, t, pos, wks) => `The ${t.name} say they are "aware of the situation and gathering information." The league has placed the ${pos} on the Commissioner's Exempt List while it investigates; he is out at least ${wks} weeks.` },
  { k: "sa", w: 2, wks: [6, 10], head: (n) => `${n} faces sexual assault allegations; league opens investigation`,
    text: (n, t, pos, wks) => `A civil suit filed this week accuses the ${t.name} ${pos} of sexual assault. He denies the allegations through his attorney. The league has placed him on the Commissioner's Exempt List; he will miss at least ${wks} weeks.` },
  { k: "ped", w: 4, wks: [4, 6], head: (n, wks) => `${n} suspended ${wks} games for PEDs`,
    text: (n, t, pos, wks) => `The ${t.name} ${pos} violated the league's policy on performance-enhancing substances. He says a supplement was to blame, but the suspension stands: ${wks} games without pay.` },
  { k: "gamble", w: 1, wks: [99, 99], head: (n) => `League suspends ${n} indefinitely for gambling`,
    text: (n, t, pos) => `An investigation found the ${t.name} ${pos} bet on NFL games, including some involving his own team. He is out for at least the rest of the season, and his career may be over.` },
  { k: "dui", w: 3, wks: [2, 3], head: (n) => `${n} arrested for DUI`,
    text: (n, t, pos, wks) => `Police stopped the ${t.name} ${pos} early Sunday morning. The league suspended him ${wks} games under the personal conduct policy.` },
  { k: "rules", w: 3, wks: [1, 1], head: (n, wks, t) => `${t.name} bench ${n} for violating team rules`,
    text: (n, t, pos) => `The ${pos} missed meetings and the team flight. He'll sit this week; the coaching staff called it "an internal matter."` },
];

export function leagueDrama({ teams, sched, wk, ui, yr, weeks = 1, rand = Math.random }) {
  const out = [], log = [];
  const add = (s) => out.push({ id: `${yr}-${wk}-d${out.length}`, kind: "drama", ...s, mine: s.team === ui });
  const back = serveSuspensions(teams, weeks, ui);
  for (const p of back) log.push(`✅ ${p.name} has served his suspension and is back.`);
  const games = (sched || []).filter((g) => g.wk === wk && g.played);
  const findP = (ti, id) => (teams[ti]?.roster || []).find((p) => p.id === id);
  const onField = [];

  // From the box scores: the interception-riddled game, the kicker who cost his team, the fumbles.
  for (const g of games) for (const [box, ti, oi, us, them] of [[g.boxH, g.h, g.a, g.hs, g.as], [g.boxA, g.a, g.h, g.as, g.hs]]) {
    const t = teams[ti], o = teams[oi], lost = us < them;
    for (const [id, l] of Object.entries(box || {})) {
      if ((l.passInt || 0) >= 3) {
        const qbs = (t.roster || []).filter((p) => p.pos === "QB" && !p.injured).sort((a, b) => b.ovr - a.ovr);
        const me = findP(ti, id), backup = qbs.find((p) => p.id !== id);
        const controversy = lost && me && backup && backup.ovr >= me.ovr - 6;
        onField.push({ s: l.passInt * 5 + (lost ? 6 : 0), team: ti, head: controversy ? `Quarterback controversy in ${t.city}? ${last(l.name)} throws ${l.passInt} picks` : `${l.name} throws ${l.passInt} interceptions${lost ? ` in loss to ${o.name}` : ", survives anyway"}`,
          text: `${l.name} went ${l.comp || 0}/${l.att || 0} with ${l.passInt} interceptions${lost ? ` as the ${t.name} fell ${them}-${us}` : `, but the ${t.name} hung on ${us}-${them}`}.${controversy ? ` Fans are calling for ${backup.name}, and the head coach wouldn't commit to a starter for next week.` : lost ? " The film session won't be pleasant." : ""}` });
      }
      const missed = (l.fgA || 0) - (l.fgM || 0) + (l.xpA || 0) - (l.xpM || 0);
      if (missed >= 2 && lost && them - us <= missed * 3) onField.push({ s: 9 + missed, team: ti, head: `${l.name}'s misses cost the ${t.name}`, text: `The kicker missed ${missed} kicks in a ${them}-${us} loss to the ${o.name}. The ${t.name} are bringing in kickers for a tryout this week.` });
      if ((l.fum || 0) >= 2 && l.pos !== "QB") onField.push({ s: 7 + l.fum, team: ti, head: `Ball security issues for ${l.name}`, text: `${last(l.name)} put the ball on the ground ${l.fum} times against the ${o.name}${lost ? ", and it cost them" : ""}.` });
    }
    // A blowout that boils over on the sideline.
    if (them - us >= 17 && rand() < 0.35) {
      const qb = (t.roster || []).filter((p) => p.pos === "QB" && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
      const wr = (t.roster || []).filter((p) => (p.pos === "WR" || p.pos === "TE") && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
      if (qb && wr) onField.push({ s: 8, team: ti, head: `Tempers flare on the ${t.name} sideline`, text: `Cameras caught ${wr.name} shouting at ${qb.name} late in a ${them}-${us} loss to the ${o.name}. "We're good," ${last(qb.name)} said afterward. Nobody in the locker room looked good.` });
    }
  }
  onField.sort((a, b) => b.s - a.s).slice(0, 2).forEach((s) => add(s));

  // What's brewing: a star who wants out, a contract standoff, a coach on the hot seat.
  const once = (p, k) => { p.drama ||= {}; if (p.drama[k] === yr) return false; p.drama[k] = yr; return true; };
  if (wk >= 5 && rand() < 0.3 * weeks) {
    const cands = teams.flatMap((t, ti) => (pct(t) <= 0.3 ? (t.roster || []).filter((p) => p.ovr >= 86 && p.age >= 26 && (p.contract || 0) >= 2 && !p.drama?.trade).map((p) => ({ p, t, ti })) : []));
    const c = cands[Math.floor(rand() * cands.length)];
    if (c && once(c.p, "trade")) add({ team: c.ti, head: `${c.p.name} requests a trade`, text: `With the ${c.t.name} at ${rec(c.t)}, the ${c.p.pos} has asked to be moved before the deadline, according to people close to him. The team says he's "not going anywhere."` });
  }
  if (wk >= 2 && wk <= 12 && rand() < 0.15 * weeks) {
    const cands = teams.flatMap((t, ti) => (t.roster || []).filter((p) => p.contract === 1 && p.ovr >= 88 && p.age <= 30 && !p.ext).map((p) => ({ p, t, ti })));
    const c = cands[Math.floor(rand() * cands.length)];
    if (c && once(c.p, "contract")) add({ team: c.ti, head: `${c.p.name}: "I'm not negotiating during the season"`, text: `In the last year of his deal, the ${c.t.name} ${c.p.pos} says talks are on hold until the spring. "I know what I'm worth. They know what I'm worth."` });
  }
  if (wk >= 6 && rand() < 0.4) {
    const cold = teams.map((t, ti) => ({ t, ti })).filter(({ t, ti }) => ti !== ui && t.w <= 1 && t.l >= 5);
    const c = cold[Math.floor(rand() * cold.length)];
    if (c) add({ team: c.ti, head: `${c.t.name} owner issues vote of confidence`, text: `At ${rec(c.t)}, the ${c.t.city} owner says the head coach "has my full support." Around the league, that's rarely a good sign.` });
  }

  // Off the field: serious trouble, a league suspension (generated players only; see above).
  if (rand() < 0.3 * weeks) {
    const pool = teams.flatMap((t, ti) => (t.roster || []).filter((p) => isFictional(p) && !p.suspended && p.ovr >= 62).map((p) => ({ p, t, ti })));
    const c = pool[Math.floor(rand() * pool.length)];
    if (c) {
      const tot = OFF_FIELD.reduce((s, e) => s + e.w, 0);
      let x = rand() * tot, ev = OFF_FIELD[0];
      for (const e of OFF_FIELD) { x -= e.w; if (x <= 0) { ev = e; break; } }
      const wks = ev.wks[0] + Math.floor(rand() * (ev.wks[1] - ev.wks[0] + 1));
      c.p.suspended = true; c.p.suspWksLeft = wks;
      (c.p.incidents ||= []).push({ yr, wk, k: ev.k, wks });
      add({ team: c.ti, breaking: ev.k !== "rules", head: ev.head(c.p.name, wks, c.t), text: ev.text(c.p.name, c.t, c.p.pos, wks) });
      if (c.ti === ui) log.push(`🚨 ${c.p.name} (${c.p.pos}) is out ${wks >= 99 ? "for the season" : `${wks} week${wks > 1 ? "s" : ""}`}: ${ev.head(c.p.name, wks, c.t)}.`);
    }
  }
  return { stories: out.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || (b.breaking ? 1 : 0) - (a.breaking ? 1 : 0)).slice(0, 3), log };
}
