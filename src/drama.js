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
import { posTag } from "./dline.js";

const pct = (t) => (t.w + 0.5 * (t.t || 0)) / Math.max(1, t.w + t.l + (t.t || 0));
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const last = (name) => (name || "").split(" ").slice(1).join(" ") || name;
export const isFictional = (p) => !!p && p.src !== "m27" && !p.real;

// Suspensions count games, like the NFL's: each week, every player serving one on a club that
// played that week has one fewer game to go (a bye doesn't count). played: the clubs (indexes)
// that played; returns your club's players who are back.
export function serveSuspensions(teams, played, ui = -1) {
  const back = [];
  teams.forEach((t, ti) => {
    if (!played.has(ti)) return;
    for (const p of [...(t.roster || []), ...(t.ir || [])]) {
      if (!p.suspended || p.suspWksLeft == null) continue;
      p.suspWksLeft = Math.max(0, p.suspWksLeft - 1);
      if (p.suspWksLeft <= 0) { p.suspended = false; p.suspWksLeft = null; if (ti === ui) back.push(p); }
    }
  });
  return back;
}

// The off-field incidents, with the league's response (games out).
export const OFF_FIELD = [
  { k: "dv", w: 3, wks: [6, 8], head: (n) => `${n} arrested on domestic violence charges`,
    text: (n, t, pos, wks) => `The ${t.name} say they are "aware of the situation and gathering information." The league has placed the ${pos} on the Commissioner's Exempt List while it investigates; he is out at least ${wks} weeks.` },
  { k: "sa", w: 2, wks: [6, 10], head: (n) => `${n} faces sexual assault allegations; league opens investigation`,
    text: (n, t, pos, wks) => `A civil suit filed this week accuses the ${t.name} ${pos} of sexual assault. He denies the allegations through his attorney. The league has placed him on the Commissioner's Exempt List; he will miss at least ${wks} weeks.` },
  { k: "ped", w: 4, wks: [4, 6], head: (n, wks) => `${n} suspended ${wks} games for PEDs`,
    text: (n, t, pos, wks) => `The ${t.name} ${pos} violated the league's policy on performance-enhancing substances. He says a supplement was to blame, but the suspension stands: ${wks} games without pay.` },
  { k: "gamble", w: 1, wks: [17, 17], head: (n) => `League suspends ${n} indefinitely for gambling`,
    text: (n, t, pos) => `An investigation found the ${t.name} ${pos} bet on NFL games, including some involving his own team. He is banned for at least a full year (17 games, into next season if need be), and his career may be over.` },
  { k: "dui", w: 3, wks: [2, 3], head: (n) => `${n} arrested for DUI`,
    text: (n, t, pos, wks) => `Police stopped the ${t.name} ${pos} early Sunday morning. The league suspended him ${wks} games under the personal conduct policy.` },
  { k: "rules", w: 3, wks: [1, 1], head: (n, wks, t) => `${t.name} bench ${n} for violating team rules`,
    text: (n, t, pos) => `The ${pos} missed meetings and the team flight. He'll sit this week; the coaching staff called it "an internal matter."` },
];

// What each incident is, for the suspension decision and the player card. legal: a court case comes
// with it (criminal charges or a civil lawsuit), open for the season it happened and the next.
export const INCIDENT_INFO = {
  dv: { label: "Arrested on domestic violence charges", legal: "Criminal case: domestic violence charges" },
  sa: { label: "Sexual assault allegations", legal: "Civil lawsuit: sexual assault allegations" },
  ped: { label: "Suspended for performance-enhancing drugs" },
  gamble: { label: "Banned for betting on NFL games" },
  dui: { label: "Arrested for DUI", legal: "Criminal case: DUI charge" },
  rules: { label: "Benched for violating team rules" },
};
export const legalCases = (p, yr) => (p?.incidents || []).filter((i) => INCIDENT_INFO[i.k]?.legal && yr - i.yr <= 1);
// One incident, weighted like the real league's (PEDs and DUIs most often, gambling rarely).
export function pickIncident(rand = Math.random) {
  const tot = OFF_FIELD.reduce((s, e) => s + e.w, 0);
  let x = rand() * tot;
  for (const e of OFF_FIELD) { x -= e.w; if (x <= 0) return e; }
  return OFF_FIELD[0];
}

// The morning paper on an off-field incident: headline, what happened, and what it means for him
// and his club (games, pay, the legal case, his job and his value). inc: a story's inc payload.
const GAME_CHECKS = 18;
export function incidentArticle(inc) {
  const { k, wks, name, pos, age, ovr, salary, contract, city, club, prior = 0, yr, wk } = inc;
  const ln = last(name), lost = Math.round((salary * wks / GAME_CHECKS) * 100) / 100;
  const star = ovr >= 80, vet = age >= 30, repeat = prior > 0;
  const W = (n) => `${n} game${n === 1 ? "" : "s"}`;
  const A = {
    dv: { head: `${name} ARRESTED`, dek: `${club} ${pos} faces domestic violence charges; league hands down ${W(wks)} suspension`,
      body: [`${city} police arrested ${name} early this week on domestic violence charges, according to court records. He was released on bond and is due in court next month.`, `The league placed him on its exempt list and then suspended him ${W(wks)} under the personal conduct policy. The ${club} said only that they are "aware of the situation and gathering information."`],
      legal: `The criminal case runs on its own clock. A conviction could bring further league discipline, and a plea deal could be months away.` },
    sa: { head: `LAWSUIT ROCKS ${club.toUpperCase()}`, dek: `${name} named in civil suit alleging sexual assault; ${W(wks)} suspension`,
      body: [`A civil lawsuit filed this week accuses ${name} of sexual assault. His attorney called the allegations "false and financially motivated."`, `The league opened an investigation and suspended the ${pos} ${W(wks)} while it continues. More plaintiffs could come forward.`],
      legal: `Civil suits like this often drag on for a year or more before a settlement or trial. Each new filing tends to bring the story back.` },
    ped: { head: `${ln.toUpperCase()} FLAGGED`, dek: `${club} ${pos} suspended ${W(wks)} for performance-enhancing drugs`,
      body: [`${name} tested positive for a banned substance and has been suspended ${W(wks)} without pay, the league announced.`, `In a statement, ${ln} said he "never knowingly took anything banned" and blamed a supplement. He will not appeal.`],
      legal: null },
    gamble: { head: `BETTING SCANDAL`, dek: `${name} banned ${W(wks)} for wagering on NFL games`,
      body: [`The league suspended ${name} ${W(wks)} after an investigation found he placed bets on NFL games, a violation of the gambling policy.`, `Investigators found no evidence he bet on his own team's games, a league source said, which kept the ban from being indefinite.`],
      legal: null },
    dui: { head: `${ln.toUpperCase()} CHARGED WITH DUI`, dek: `${club} ${pos} arrested; out ${W(wks)}`,
      body: [`${name} was arrested for driving under the influence after a traffic stop in the early morning hours, police said. No one was hurt.`, `The league suspended him ${W(wks)}. "${ln} made a bad decision and he knows it," a team spokesman said.`],
      legal: `The DUI charge is expected to be resolved with a plea in the coming months; a second offense would carry a much longer ban.` },
    rules: { head: `${ln.toUpperCase()} BENCHED`, dek: `${club} sit their ${pos} ${W(wks)} for violating team rules`,
      body: [`The ${club} have benched ${name} ${W(wks)} for what the head coach called "a violation of team rules," declining to give details.`, `Teammates said ${ln} missed meetings this week. "He's got to be where he's supposed to be," one veteran said.`],
      legal: null },
  }[k] || { head: `${ln.toUpperCase()} SUSPENDED`, dek: `${club} ${pos} out ${W(wks)}`, body: [`${name} has been suspended ${W(wks)}.`], legal: null };
  const fallout = [
    `Out ${W(wks)}${k === "rules" ? " (a team benching)" : ", unpaid"}${k !== "rules" && lost > 0 ? `: about $${lost.toFixed(2)}M in lost game checks` : ""}.`,
    A.legal && `Legal: ${A.legal}`,
    contract > 1 ? `His deal runs ${contract} more season${contract > 1 ? "s" : ""}. Teams can void guarantees for conduct, and he'll be an easy cut if he struggles when he returns.` : `He's in the last year of his deal. This could be the end of his time in ${city}.`,
    star ? `As ${/^(8|11|18)/.test(String(ovr)) ? "an" : "a"} ${ovr}-rated starter, his absence is a real hit for the ${club}, and his trade value takes a dent until it's behind him.` : `The ${club} have depth to cover him, and he'll have to earn his spot back.`,
    repeat ? `It's not his first incident. Repeat offenders get longer bans, and clubs run out of patience.` : `It's his first incident. Players who stay clean usually come back without lasting damage.`,
    ["dv", "sa"].includes(k) ? `Expect sponsors to pull back and fans to call for his release.` : vet ? `At ${age}, he doesn't have many second chances left.` : `He's young enough to put this behind him.`,
  ].filter(Boolean);
  return { head: A.head, dek: A.dek, body: A.body, fallout, dateline: `${city.toUpperCase()} · ${yr}${wk ? ` · WEEK ${wk}` : ""}` };
}

export function leagueDrama({ teams, sched, wk, ui, yr, weeks = 1, offField = [], rand = Math.random }) {
  const out = [], log = [];
  const add = (s) => out.push({ id: `${yr}-${wk}-d${out.length}`, kind: "drama", ...s, mine: s.team === ui });
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

  out.push(...offField);
  return { stories: out.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || (b.breaking ? 1 : 0) - (a.breaking ? 1 : 0)).slice(0, 3), log };
}

// One week off the field, run right after that week's games (so a suspension keeps a player out of
// the next ones, even in Sim to Deadline / Sim All): suspensions served, then maybe new trouble.
// Returns { stories, log, mine } (mine: your players' new incidents); pass the stories on to leagueDrama as offField.
export function offFieldWeek({ teams, sched, wk, ui, yr, rand = Math.random }) {
  const out = [], log = [], mine = [];
  const add = (s) => out.push({ id: `${yr}-${wk}-o${out.length}`, kind: "drama", ...s, mine: s.team === ui });
  const played = new Set();
  for (const g of sched || []) if (g.wk === wk && g.played) { played.add(g.h); played.add(g.a); }
  for (const p of serveSuspensions(teams, played, ui)) log.push(`${p.name} has served his suspension and is back.`);
  // Off the field: serious trouble, a league suspension (generated players only; see above).
  if (rand() < 0.3) {
    const pool = teams.flatMap((t, ti) => (t.roster || []).filter((p) => isFictional(p) && !p.suspended && p.ovr >= 62).map((p) => ({ p, t, ti })));
    const c = pool[Math.floor(rand() * pool.length)];
    if (c) {
      const ev = pickIncident(rand);
      const wks = ev.wks[0] + Math.floor(rand() * (ev.wks[1] - ev.wks[0] + 1));
      c.p.suspended = true; c.p.suspWksLeft = wks;
      (c.p.incidents ||= []).push({ yr, wk, k: ev.k, wks });
      const prior = c.p.incidents.length - 1;
      add({ team: c.ti, breaking: ev.k !== "rules", head: ev.head(c.p.name, wks, c.t), text: ev.text(c.p.name, c.t, c.p.pos, wks),
        // the full newspaper write-up (tap the story)
        inc: { k: ev.k, wks, yr, wk, pid: c.p.id, name: c.p.name, pos: posTag(c.p), age: c.p.age, ovr: c.p.ovr, salary: c.p.salary || 0, contract: c.p.contract || 0, city: c.t.city, club: c.t.name, prior } });
      // yours: you decide whether he stays (the suspension popup shows why)
      if (c.ti === ui) mine.push({ pid: c.p.id, k: ev.k, wks, head: ev.head(c.p.name, wks, c.t), text: ev.text(c.p.name, c.t, c.p.pos, wks) });
      if (c.ti === ui) log.push(`${c.p.name} (${c.p.pos}) is out ${wks} game${wks > 1 ? "s" : ""}: ${ev.head(c.p.name, wks, c.t)}.`);
    }
  }
  return { stories: out, log, mine };
}
