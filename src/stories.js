// The league's top stories, written fresh after every week from what actually happened: upsets,
// blowouts and thrillers, the week's big individual games, streaks, the standings, and a look at
// your own club. Each story: { id, kind, team (index), head, text, mine }.

const pct = (t) => (t.w + 0.5 * (t.t || 0)) / Math.max(1, t.w + t.l + (t.t || 0));
const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (arr, seed) => arr[hash(seed) % arr.length];
const nth = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
const last = (name) => name.split(" ").slice(1).join(" ") || name;

// The record a team had going into this week's game.
const before = (t, won, tied) => ({ w: t.w - (won ? 1 : 0), l: t.l - (!won && !tied ? 1 : 0), t: (t.t || 0) - (tied ? 1 : 0) });

// teams: after the week. sched: with this week's results and box scores. wk: the week just played.
export function weeklyStories({ teams, sched, wk, ui, yr }) {
  const games = sched.filter((g) => g.wk === wk && g.played);
  const out = [];
  const add = (s) => out.push({ id: `${yr}-${wk}-${out.length}`, ...s });
  const name = (i) => `${teams[i].city} ${teams[i].name}`;
  const used = new Set();

  // Results: the upset, the thriller, the blowout.
  const res = games.map((g) => {
    const hw = g.hs > g.as, tie = g.hs === g.as;
    const w = hw ? g.h : g.a, l = hw ? g.a : g.h;
    const ws = Math.max(g.hs, g.as), ls = Math.min(g.hs, g.as);
    const bw = before(teams[w], !tie, tie), bl = before(teams[l], false, tie);
    return { g, w, l, ws, ls, tie, margin: ws - ls, gap: pct(bl) - pct(bw), bw, bl };
  });
  const upset = res.filter((r) => !r.tie && wk >= 3 && r.gap >= 0.3).sort((a, b) => b.gap - a.gap)[0];
  if (upset) {
    used.add(upset.w); used.add(upset.l);
    add({ kind: "upset", team: upset.w, head: pick([`Shock in Week ${wk}: ${teams[upset.w].name} stun ${teams[upset.l].name}`, `${teams[upset.w].name} pull off the upset of the week`, `Nobody saw this coming: ${teams[upset.w].name} ${upset.ws}, ${teams[upset.l].name} ${upset.ls}`], `${yr}${wk}up`),
      text: `The ${name(upset.w)} (${rec(upset.bw)} coming in) took down the ${rec(upset.bl)} ${teams[upset.l].name} ${upset.ws}-${upset.ls}. ${upset.gap >= 0.5 ? "It's the kind of result that reshuffles every power ranking in the league." : "A statement win, and a warning to the rest of the conference."}` });
  }
  const thriller = res.filter((r) => r.margin <= 3 && !used.has(r.w)).sort((a, b) => (pct(teams[b.w]) + pct(teams[b.l])) - (pct(teams[a.w]) + pct(teams[a.l])) || b.ws - a.ws)[0];
  if (thriller) {
    used.add(thriller.w); used.add(thriller.l);
    add({ kind: "thriller", team: thriller.w, head: thriller.tie ? `${teams[thriller.w].name} and ${teams[thriller.l].name} can't be separated` : pick([`${teams[thriller.w].name} survive a thriller`, `Instant classic: ${teams[thriller.w].name} edge ${teams[thriller.l].name}`, `Down to the wire in ${teams[thriller.g.h].city}`], `${yr}${wk}th`),
      text: thriller.tie ? `Sixty minutes and more weren't enough: ${thriller.ws}-${thriller.ls}.` : `The ${teams[thriller.w].name} (${rec(teams[thriller.w])}) beat the ${teams[thriller.l].name} ${thriller.ws}-${thriller.ls} in the game of the week.` });
  }
  const blowout = res.filter((r) => r.margin >= 24 && !used.has(r.w)).sort((a, b) => b.margin - a.margin)[0];
  if (blowout) {
    used.add(blowout.w);
    add({ kind: "blowout", team: blowout.w, head: pick([`${teams[blowout.w].name} roll ${teams[blowout.l].name} by ${blowout.margin}`, `No contest: ${teams[blowout.w].name} ${blowout.ws}, ${teams[blowout.l].name} ${blowout.ls}`], `${yr}${wk}bl`),
      text: `The ${name(blowout.w)} were never threatened. ${blowout.ls <= 7 ? "The defense smothered everything." : "It was over by halftime."}` });
  }

  // Big individual games, from the box scores.
  const lines = [];
  for (const g of games) for (const [box, ti, opp] of [[g.boxH, g.h, g.a], [g.boxA, g.a, g.h]]) for (const l of Object.values(box || {})) lines.push({ l, ti, opp });
  const perf = [];
  for (const { l, ti, opp } of lines) {
    const n = l.name, o = teams[opp].name;
    if ((l.passYds || 0) >= 330 || (l.passTD || 0) >= 4) perf.push({ s: (l.passYds || 0) / 25 + (l.passTD || 0) * 4, ti, head: `${n} carves up the ${o}`, text: `${n} went ${l.comp || 0}/${l.att || 0} for ${l.passYds || 0} yards and ${l.passTD || 0} touchdown${l.passTD === 1 ? "" : "s"}.` });
    if ((l.rushYds || 0) >= 140) perf.push({ s: (l.rushYds || 0) / 10 + (l.rushTD || 0) * 4, ti, head: `${n} runs wild`, text: `${last(n)} piled up ${l.rushYds} rushing yards${l.rushTD ? ` and ${l.rushTD} TD` : ""} against the ${o}.` });
    if ((l.recYds || 0) >= 140) perf.push({ s: (l.recYds || 0) / 10 + (l.recTD || 0) * 4, ti, head: `${n} can't be covered`, text: `${last(n)} caught ${l.rec || 0} passes for ${l.recYds} yards${l.recTD ? ` and ${l.recTD} TD` : ""} against the ${o}.` });
    if ((l.sacks || 0) >= 3) perf.push({ s: l.sacks * 6, ti, head: `${n} lives in the backfield`, text: `${last(n)} sacked the ${o} quarterback ${l.sacks} times.` });
    if ((l.ints || 0) >= 2) perf.push({ s: l.ints * 7, ti, head: `${n} picks off ${l.ints} passes`, text: `${last(n)} had the ${o} offense seeing ghosts.` });
  }
  perf.sort((a, b) => b.s - a.s).slice(0, 2).forEach((p) => add({ kind: "performance", team: p.ti, head: p.head, text: p.text }));

  // Streaks and the unbeaten / winless.
  const hot = teams.map((t, i) => ({ t, i })).filter(({ t }) => Math.abs(t.streak || 0) >= 4 || (wk >= 4 && (t.l === 0 || t.w === 0)));
  hot.sort((a, b) => Math.abs(b.t.streak || 0) - Math.abs(a.t.streak || 0));
  for (const { t, i } of hot.slice(0, 2)) {
    const s = t.streak || 0;
    if (t.l === 0 && wk >= 4) add({ kind: "streak", team: i, head: `The ${t.name} are still perfect`, text: `${rec(t)} and counting. Every week the ${t.city} spotlight gets brighter.` });
    else if (t.w === 0 && wk >= 4) add({ kind: "streak", team: i, head: `Still searching in ${t.city}`, text: `The ${t.name} are ${rec(t)}, and the questions about the front office are getting louder.` });
    else if (s > 0) add({ kind: "streak", team: i, head: `${t.name} have won ${s} straight`, text: `At ${rec(t)}, ${t.city} is one of the hottest teams in football.` });
    else add({ kind: "streak", team: i, head: `${t.name} have dropped ${-s} in a row`, text: `The ${rec(t)} ${t.name} need answers fast.` });
  }

  // The standings, from midseason on.
  if (wk >= 6) {
    for (const c of ["AFC", "NFC"]) {
      const top = teams.map((t, i) => ({ t, i })).filter(({ t }) => t.c === c).sort((a, b) => pct(b.t) - pct(a.t) || (b.t.pf - b.t.pa) - (a.t.pf - a.t.pa))[0];
      if (top && !out.some((s) => s.team === top.i)) { add({ kind: "standings", team: top.i, head: `${top.t.name} lead the ${c}`, text: `The ${name(top.i)} sit atop the conference at ${rec(top.t)} with a ${top.t.pf - top.t.pa >= 0 ? "+" : ""}${top.t.pf - top.t.pa} point differential.` }); break; }
    }
  }

  // Your club.
  const me = teams[ui];
  const mg = games.find((g) => g.h === ui || g.a === ui);
  const conf = teams.map((t, i) => ({ t, i })).filter(({ t }) => t.c === me.c).sort((a, b) => pct(b.t) - pct(a.t));
  const seed = conf.findIndex((x) => x.i === ui) + 1;
  if (mg) {
    const us = mg.h === ui ? mg.hs : mg.as, them = mg.h === ui ? mg.as : mg.hs, opp = teams[mg.h === ui ? mg.a : mg.h];
    const box = mg.h === ui ? mg.boxH : mg.boxA;
    const star = Object.values(box || {}).sort((a, b) => ((b.passYds || 0) / 3 + (b.rushYds || 0) + (b.recYds || 0) + (b.sacks || 0) * 40) - ((a.passYds || 0) / 3 + (a.rushYds || 0) + (a.recYds || 0) + (a.sacks || 0) * 40))[0];
    const result = us > them ? `beat the ${opp.name} ${us}-${them}` : us < them ? `fell to the ${opp.name} ${them}-${us}` : `tied the ${opp.name} ${us}-${them}`;
    add({ kind: "mine", team: ui, mine: true, head: `${me.name} ${us > them ? "win" : us < them ? "lose" : "tie"} in Week ${wk}`,
      text: `Your ${me.name} ${result} and are ${rec(me)}, ${nth(seed)} in the ${me.c}${seed <= 7 ? " and in playoff position" : ", outside the playoff picture for now"}.${star ? (us >= them ? ` ${star.name} led the way.` : ` Bright spot: ${star.name}.`) : ""}` });
  }
  // Mine first, then the league's biggest stories; six at most.
  return out.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0)).slice(0, 6);
}
