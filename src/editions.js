// The Gazette's other editions: Trade Deadline Day, the Draft Extra and the Hall of Fame page.
// Each is written from what actually happened (the deals, the picks, the careers), with the same
// writer's bank as the championship paper: a seeded pick of headlines, decks and voices, so two
// seasons never read alike. Every edition is a plain object the paper component lays out:
// { kind, yr, round, edition, head, deck, city, byline, story: [...], boxes: [{ title, items }], table }.
import { seeded, curly } from "./gazetteBank.js";
import { boxTotals, lineProse } from "./playoffPaper.js";

const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const n2w = (n) => NUM[n] || String(n);
const nm = (t) => `${t.city} ${t.name}`;
const POS = { QB: "quarterback", RB: "running back", WR: "receiver", TE: "tight end", LT: "left tackle", LG: "guard", C: "center", RG: "guard", RT: "right tackle", DL: "defensive lineman", EDGE: "pass rusher", DT: "defensive tackle", LB: "linebacker", CB: "cornerback", S: "safety", K: "kicker", P: "punter" };
const posName = (p) => POS[p] || p;
const BYLINES = ["By the Gazette Sports Desk", "By a Gazette Correspondent", "By the D'Amours Unlimited Staff", "From Our League Bureau"];
const COLUMNISTS = ["Walter Pembrook", "Eleanor Hask", "Frank Delacorte", "Margaret Oyelaran", "Sam Whitlock", "Dolores Kincaid"];
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const finish = (p) => ({ ...p, head: curly(p.head), deck: curly(p.deck), story: p.story.map(curly), boxes: (p.boxes || []).map((b) => ({ ...b, items: b.items.map(curly) })) });

// ---------- Trade Deadline Day ----------
const DL_HEADS = {
  blockbuster: ["{B} LAND {P} IN DEADLINE BLOCKBUSTER", "{P} TRADED TO {B} AS THE CLOCK RUNS OUT", "THE {B} GO ALL IN: {P} IS THEIRS"],
  busy: ["A DEADLINE DAY TO REMEMBER: {N} DEALS", "{N} TRADES, AND THE RACE IS REDRAWN", "BUYERS AND SELLERS: {N} DEALS BEFORE 4 P.M."],
  quiet: ["A QUIET DEADLINE AS CONTENDERS STAND PAT", "THE PHONES RANG, BUT FEW DEALS WERE DONE", "DEADLINE PASSES WITH HARDLY A RIPPLE"],
};
const DL_DECKS = [
  "Contenders reload for the stretch run while rebuilding clubs collect picks",
  "Front offices race the 4 p.m. bell as the playoff picture comes into focus",
  "Veterans head for contenders; the future heads the other way",
];
// state: the deadline day (deals, feed); teams; ui: your club.
export function deadlineEdition({ state, teams, ui, yr }) {
  const rand = seeded(`dl|${yr}|${(state.deals || []).length}`), pick = (a) => a[Math.floor(rand() * a.length)];
  const deals = [...(state.deals || [])].sort((a, b) => (b.player?.ovr || 0) - (a.player?.ovr || 0));
  const mine = (state.feed || []).filter((f) => f.kind === "mine" && /^You trade/.test(f.text)).map((f) => f.text);
  const n = deals.length + mine.length, big = deals[0];
  const kind = big && big.player.ovr >= 84 ? "blockbuster" : n >= 4 ? "busy" : "quiet";
  const B = big ? teams[big.buyer] : null, S = big ? teams[big.seller] : null;
  const head = fill(pick(DL_HEADS[kind]), { B: B?.name.toUpperCase(), P: big?.player.name.toUpperCase(), N: n2w(n).toUpperCase() });
  const count = {};
  for (const x of deals) { count[x.buyer] = (count[x.buyer] || 0) + 1; }
  const topBuyer = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  const got = (x) => [...x.players.map((p) => `${p.name} (${p.pos} ${p.ovr})`), ...x.picks.map((pk) => (pk.yr && pk.yr !== yr ? `a ${pk.yr} round ${pk.rd} pick` : `a round ${pk.rd} pick`))].join(" and ") || "future considerations";
  const story = [];
  if (big) story.push(`${S.city.toUpperCase()} — ${pick(["With the clock running down on deadline day", "In the busiest hour of deadline day", "Hours before the 4 p.m. deadline"])}, the ${nm(B)} acquired ${big.player.name}, the ${big.player.age}-year-old ${posName(big.player.pos)} rated ${big.player.ovr}, from the ${nm(S)} for ${got(big)}. The ${B.name}, ${B.w || 0}-${B.l || 0}, ${(B.w || 0) > (B.l || 0) ? pick(["made no secret that this season is the one", "are buying for a January run", "added the piece their front office had chased for weeks"]) : pick(["are betting they are closer than their record says", "made a bold play for a club still finding itself"])}.`);
  else story.push(`${pick(["The phones rang all day", "Front offices worked the lines from morning on", "Rumors filled the morning"])}, but when the 4 p.m. deadline passed ${n ? `only ${n2w(n)} deal${n === 1 ? " was" : "s were"} done` : "not a single deal had been made"}. ${pick(["Asking prices were high and contenders blinked.", "Sellers wanted first-round picks; buyers would not pay them.", "This year, the market never found its level."])}`);
  if (deals.length > 1) story.push(`In all, ${n2w(deals.length)} trades crossed the league office's desk${topBuyer && topBuyer[1] >= 2 ? `, ${topBuyer[1]} of them by the ${nm(teams[topBuyer[0]])}, who ${pick(["were the day's busiest buyers", "never stopped dialing", "reshaped their roster in a single afternoon"])}` : ""}. ${pick(["The theme was familiar: veterans to contenders, picks to the rebuilding.", "Contending clubs paid in picks; sellers took the long view.", "Most of the movement came in the final two hours."])}`);
  if (mine.length) story.push(`The ${teams[ui].name} were in the middle of it. ${mine[0]}`);
  else if (teams[ui]) story.push(`The ${teams[ui].name} ${pick(["stood pat, trusting the roster they have", "listened to offers but kept their core together", "let the deadline pass without a move"])}.`);
  return finish({
    kind: "deadline", yr, round: "Trade Deadline", edition: "DEADLINE EDITION", city: (B || teams[ui]).city, byline: pick(BYLINES),
    head, deck: pick(DL_DECKS), story,
    boxes: [
      { title: "Every Deal", items: deals.length ? deals.slice(0, 8).map((x) => `${teams[x.buyer].name} get ${x.player.name} (${x.player.pos} ${x.player.ovr}) from ${teams[x.seller].name} for ${got(x)}.`) : ["No trades between clubs."] },
      ...(mine.length ? [{ title: "Your Moves", items: mine }] : []),
    ],
  });
}

// ---------- The Draft Extra ----------
const DR_HEADS = ["{T} TAKE {P} FIRST OVERALL", "IT'S {P}: {T} OPEN THE DRAFT", "NO. 1: {P} HEADS TO {C}"];
const DR_DECKS = ["Seven rounds, 257 names and the steals and reaches that will define them", "Where every club went, and who won the weekend", "The board, the surprises and the grades"];
const GRADE_ORDER = ["D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
const gpts = (g) => GRADE_ORDER.indexOf(g);
// log: the draft's picks ({ overall, rd, owner, player, grade }); teams; ui: your club.
export function draftEdition({ log, teams, ui, yr }) {
  const rand = seeded(`dr|${yr}|${log.length}`), pick = (a) => a[Math.floor(rand() * a.length)];
  const picks = [...log].filter((d) => d.player).sort((a, b) => a.overall - b.overall);
  const first = picks[0], T = teams[first.owner];
  const head = fill(pick(DR_HEADS), { T: T.name.toUpperCase(), P: first.player.name.toUpperCase(), C: T.city.toUpperCase() });
  const steals = picks.filter((d) => d.grade === "A+" && d.rd <= 4).slice(0, 3);
  const reaches = picks.filter((d) => /^[CD]/.test(d.grade || "") && d.rd <= 2).slice(0, 2);
  // each club's class on the curve
  const byTeam = {};
  for (const d of picks) if (GRADE_ORDER.includes(d.grade)) (byTeam[d.owner] ||= []).push(gpts(d.grade));
  const cls = Object.entries(byTeam).map(([ti, g]) => ({ ti: +ti, v: g.reduce((a, b) => a + b, 0) / g.length })).sort((a, b) => b.v - a.v);
  const letter = (v) => GRADE_ORDER[Math.round(v)] || "C";
  const winner = cls[0], mineCls = cls.find((c) => c.ti === ui), myPicks = picks.filter((d) => d.owner === ui);
  const story = [
    `${T.city.toUpperCase()} — The ${nm(T)} opened the ${yr} draft by taking ${first.player.name}, the ${posName(first.player.pos)} out of ${first.player.college || "college"}, with the first overall pick. ${pick(["The pick was in almost before the commissioner reached the podium.", "Few on the board were surprised.", "It is a selection the franchise has been building toward for months."])}`,
    `${picks.slice(1, 3).map((d) => `${d.player.name} (${d.player.pos}) went No. ${d.overall} to the ${teams[d.owner].name}`).join(", and ")}${picks.length > 2 ? "." : ""} ${steals.length ? `The steal of the weekend may be ${steals[0].player.name}, a consensus top talent who lasted to No. ${steals[0].overall}${steals[0].rd > 1 ? ` in round ${steals[0].rd}` : ""}.` : ""}`,
    winner ? `By the scouts' consensus boards the best haul belonged to the ${nm(teams[winner.ti])} (grade ${letter(winner.v)}). ${reaches.length ? `The biggest reach: ${reaches[0].player.name} at No. ${reaches[0].overall}.` : ""}` : "",
    myPicks.length ? `The ${teams[ui].name} came away with ${n2w(myPicks.length)} pick${myPicks.length === 1 ? "" : "s"}, led by ${myPicks[0].player.name} (${myPicks[0].player.pos}) at No. ${myPicks[0].overall}${mineCls ? `. The Gazette grades the class ${letter(mineCls.v)}` : ""}.` : "",
  ].filter(Boolean);
  return finish({
    kind: "draft", yr, round: "Draft Extra", edition: "DRAFT EXTRA", city: T.city, byline: `By ${pick(COLUMNISTS)}`,
    head, deck: pick(DR_DECKS), story,
    boxes: [
      { title: "The First Round", items: picks.filter((d) => d.rd === 1).slice(0, 12).map((d) => `${d.overall}. ${teams[d.owner].ab} · ${d.player.name}, ${d.player.pos}${d.grade ? ` (${d.grade})` : ""}`) },
      ...(myPicks.length ? [{ title: "Your Class", items: myPicks.slice(0, 8).map((d) => `Rd ${d.rd}, No. ${d.overall}: ${d.player.name}, ${d.player.pos}${d.grade ? ` · ${d.grade}` : ""}`) }] : []),
    ],
    table: cls.length ? { title: "Best and Worst Classes", rows: [...cls.slice(0, 3), ...cls.slice(-2)].map((c) => [nm(teams[c.ti]), letter(c.v)]) } : null,
  });
}

// ---------- The Hall of Fame page ----------
const HOF_HEADS = ["CANTON CALLS {P}", "{P} BOUND FOR THE HALL", "A GOLD JACKET FOR {P}", "THE HALL OPENS ITS DOORS TO {P}"];
const HOF_DECKS = ["The Class of {Y} is set, and a generation of Sundays goes with it", "Careers measured in seasons, rings and the respect of rivals", "The voters have spoken: the Class of {Y}"];
// entries: this year's Hall of Fame retirees (history.js retireEntry); teams for names; abName(ab) -> "City Name".
export function hofEdition({ entries, yr, abName = (ab) => ab, mineAb }) {
  const rand = seeded(`hof|${yr}|${entries.map((e) => e.id).join(",")}`), pick = (a) => a[Math.floor(rand() * a.length)];
  const list = [...entries].sort((a, b) => (b.legacy || 0) - (a.legacy || 0));
  const top = list[0], Y = top.hofClass || yr + 5;
  const rest = list.slice(1);
  const line = (e) => `${e.name}, ${posName(e.pos)}, ${e.seasons ? `${e.seasons} season${e.seasons === 1 ? "" : "s"}` : "a long career"}${e.rings ? `, ${n2w(e.rings)} ring${e.rings > 1 ? "s" : ""}` : ""}, peak ${e.peak}`;
  const story = [
    `${top.name}, the ${posName(top.pos)} who ${pick(["defined an era", "made the hard plays look routine", "never seemed to have an off Sunday", "was the measuring stick at his position for a decade"])}, retired this off-season and will be enshrined with the Class of ${Y}. He leaves the game at ${top.age}${top.peak ? `, having peaked at a ${top.peak} rating` : ""}${top.rings ? ` with ${n2w(top.rings)} Super Bowl ring${top.rings > 1 ? "s" : ""}` : ""}.`,
    pick([`"${pick(["You don't replace a player like that", "He was the first one in and the last one out", "Every coach in this league game-planned for him"])}," said a rival coach.`, `Teammates called him ${pick(["the standard", "the professor", "the engine", "the one who made everyone better"])}.`]),
    rest.length ? `${cap(n2w(rest.length))} more join him: ${rest.map((e) => `${e.name} (${e.pos})`).join(", ")}.` : `He enters alone, the only Hall of Famer to retire this year.`,
    mineAb && list.some((e) => e.team === mineAb || e.tc?.[mineAb]) ? `For ${abName(mineAb)}, it is a proud day: ${list.filter((e) => e.team === mineAb || e.tc?.[mineAb]).map((e) => e.name).join(" and ")} wore their colors.` : "",
  ].filter(Boolean);
  return finish({
    kind: "hof", yr, round: "Hall of Fame", edition: "HALL OF FAME EDITION", city: "CANTON", byline: pick(BYLINES),
    head: fill(pick(HOF_HEADS), { P: top.name.toUpperCase() }), deck: fill(pick(HOF_DECKS), { Y }), story,
    boxes: [{ title: `The Class of ${Y}`, items: list.map(line) }],
    table: { title: "Last Team", rows: list.map((e) => [e.name, abName(e.team)]) },
  });
}

// ---------- The rival's paper ----------
// After a bad loss (by 17 or more, or by a touchdown to a division rival), the winner's hometown
// paper has its fun with you: their masthead, their headline, their columnist.
const RV_MASTS = ["The {C} Courier", "The {C} Clarion", "The {C} Morning Bugle", "The {C} Evening Ledger", "The {C} Herald-Tribune"];
const RV_HEADS = {
  rout: ["{W} BURY {L}, {S}", "NOT EVEN CLOSE: {W} {S}", "{W} RUN {L} OUT OF THE BUILDING", "A LESSON FOR {L}: {S}"],
  rival: ["{W} PUT {L} IN THEIR PLACE", "BRAGGING RIGHTS STAY IN {C}", "{W} 'WIN' THE DIVISION GRUDGE MATCH, {S}", "{L} SENT HOME QUIET"],
};
const RV_JABS = [
  "Somewhere, the {L} front office is drafting an explanation.",
  "The {L} came to town talking. They left in a hurry.",
  "If the {L} have a plan, it was not on display.",
  "Our advice to the {L}: keep the receipts on that roster.",
  "Fans in {LC} are welcome to keep watching. We'll be here.",
];
// g: the game ({ h, a, hs, as, boxH, boxA }); ui: your (losing) club; wk.
export function rivalEdition({ g, teams, ui, yr, wk }) {
  const youHome = g.h === ui, us = youHome ? g.hs : g.as, them = youHome ? g.as : g.hs;
  const W = teams[youHome ? g.a : g.h], L = teams[ui], m = them - us;
  const rand = seeded(`rv|${yr}|${wk}|${W.ab}`), pick = (a) => a[Math.floor(rand() * a.length)];
  const div = W.c && W.c === L.c && W.d === L.d;
  const wBox = youHome ? g.boxA : g.boxH, lBox = youHome ? g.boxH : g.boxA;
  const wt = boxTotals(wBox), lt = boxTotals(lBox);
  const star = Object.values(wBox || {}).map((l) => ({ ...l, s: (l.passYds || 0) / 25 + (l.rushYds || 0) / 10 + (l.recYds || 0) / 10 + ((l.passTD || 0) + (l.rushTD || 0) + (l.recTD || 0)) * 6 + (l.sacks || 0) * 4 + (l.ints || 0) * 5 })).sort((a, b) => b.s - a.s)[0];
  const v = { W: W.name.toUpperCase(), L: L.name.toUpperCase(), S: `${them}-${us}`, C: W.city.toUpperCase() };
  const head = fill(pick(RV_HEADS[m >= 17 ? "rout" : "rival"]), v);
  const story = [
    `${W.city.toUpperCase()} — ${pick([`The ${W.name} made it look easy on ${youHome ? "the road" : "their own field"}`, `It was over early`, `The ${W.name} did whatever they wanted`])}, beating the ${L.city} ${L.name} ${them}-${us} in week ${wk}${div ? " and keeping the division in its proper order" : ""}.`,
    star ? `${star.name} ${pick(["was the best player on the field", "had his way with the visitors", "put on a show"])}: ${lineProse(star)}. The ${W.name} out-gained the ${L.name} ${wt.pass + wt.rush} yards to ${lt.pass + lt.rush}${lt.giveaways >= 2 ? ` and took the ball away ${n2w(lt.giveaways)} times` : ""}.` : `The ${W.name} out-gained them ${wt.pass + wt.rush} yards to ${lt.pass + lt.rush}.`,
    fill(pick(RV_JABS), { L: L.name, LC: L.city }),
  ];
  return finish({
    kind: "rival", yr, wk, round: `Week ${wk}`, motto: pick(["\"Home of the<br />Home Team\"", "\"Our Town,<br />Our Team\"", "\"First With the<br />Final Score\""]), edition: `${W.city.toUpperCase()} SPORTS FINAL`, mast: fill(pick(RV_MASTS), { C: W.city }), city: W.city,
    byline: `By ${pick(COLUMNISTS)}, ${W.city} Sports`, head, deck: pick([`${W.city} fans enjoy every minute of a ${m}-point win`, `The ${L.name} have questions; the ${W.name} have answers`, youHome ? `A quiet walk to the parking lots in ${L.city}` : `${L.city} has a long ride home to think about it`]), story,
    boxes: [{ title: "By the Numbers", items: [`Points: ${W.name} ${them}, ${L.name} ${us}`, `Passing: ${wt.pass} to ${lt.pass}`, `Rushing: ${wt.rush} to ${lt.rush}`, `Turnovers: ${wt.giveaways} to ${lt.giveaways}`] }],
  });
}
export const rivalWorthy = (g, teams, ui) => {
  if (!g || !g.played || (g.h !== ui && g.a !== ui)) return false;
  const us = g.h === ui ? g.hs : g.as, them = g.h === ui ? g.as : g.hs, o = teams[g.h === ui ? g.a : g.h], me = teams[ui];
  return them - us >= 17 || (them - us >= 7 && o?.c === me?.c && o?.d === me?.d);
};
