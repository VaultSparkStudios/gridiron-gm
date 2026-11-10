// The Gridiron Gazette's writers: a bank of headlines, decks, ledes, quotes and page furniture, so
// the front page the morning after a title reads differently every year. Each paper is seeded by
// the season and the club, so the same save always prints the same paper (and a reload doesn't
// rewrite it), but no two seasons look alike.
//
// What's picked:
//   format  the page layout: "classic" (story, photo, sidebar), "hero" (the photo across the top
//           of the page), "column" (the news story beside a columnist's take)
//   voice   who wrote the lead story: the wire reporter, the columnist, the feature writer at the
//           scene, or the numbers man
//   and the headline, both decks, the quotes, the ears, the edition, the sidebars and the index.

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
// a small seeded generator: the same seed gives the same paper
export function seeded(seed) {
  let x = hash(String(seed)) || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const n2w = (n) => NUM[n] || String(n);
const ord = (n) => ORD[n] || `${n}th`;
const last = (n) => (n || "").split(" ").slice(1).join(" ") || n;
// Typeset quotes: the old typefaces draw a straight " as a closing mark, so open them properly.
export const curly = (x) => (typeof x !== "string" ? x : x.replace(/(^|[\s(\u2014-])"/g, "$1\u201c").replace(/"/g, "\u201d").replace(/'/g, "\u2019"));
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));

// What kind of night it was (the first that fits).
export function storyKind({ us, them, titles, streak }) {
  const m = us - them;
  if (streak >= 3) return "threepeat";
  if (streak === 2) return "repeat";
  if (titles <= 1) return "first";
  if (m >= 17) return "rout";
  if (m <= 3) return "thriller";
  if (us + them >= 58) return "shootout";
  if (them <= 10) return "defense";
  return "plain";
}

const HEADS = {
  first: ["AT LAST: {N} ARE CHAMPIONS", "{N} REACH THE MOUNTAINTOP", "THE WAIT IS OVER", "{C} HAS ITS CHAMPIONS", "FIRST TITLE FOR {N}", "{N} WIN IT ALL"],
  repeat: ["{N} DO IT AGAIN", "TWICE AS NICE", "{N} REPEAT AS CHAMPIONS", "BACK-TO-BACK", "{N} DEFEND THEIR CROWN"],
  threepeat: ["THREE STRAIGHT", "DYNASTY", "{N} MAKE IT THREE IN A ROW", "THE {N} ERA", "THREE-PEAT"],
  rout: ["{N} ROUT {O} FOR TITLE", "NO CONTEST", "{N} CRUSH {O}, {S}", "A CORONATION, NOT A CONTEST", "{N} ROMP TO THE TITLE"],
  thriller: ["{N} SURVIVE {O} IN A THRILLER", "BY A WHISKER", "{N} EDGE {O}, {S}", "HEART-STOPPER", "{N} HANG ON FOR THE TITLE"],
  shootout: ["{N} WIN A SHOOTOUT, {S}", "POINTS, POINTS AND A TROPHY", "{N} OUTGUN {O}", "A TITLE IN A FIREFIGHT"],
  defense: ["DEFENSE WINS IT FOR {N}", "{N} SMOTHER {O}, {S}", "THE {N} WALL HOLDS", "A TITLE BUILT ON DEFENSE"],
  plain: ["{N} CAPTURE THE SUPER BOWL", "{N} ARE CHAMPIONS", "{N} TOP {O} FOR THE TITLE", "{N} TAKE THE TROPHY HOME", "{N} WIN {SB}"],
};
const DECK1 = [
  "{C} Beats {OC}, {S}{MVPC}",
  "{N2} Defeat {O2} {S} in {SB}{MVPC}",
  "{C} Wins {SB}, {S}, Over {OC}{MVPC}",
  "A {S} Victory Over {OC} Brings the Trophy to {C}{MVPC}",
];
const DECK2 = {
  first: ["First Championship in Team History Sets Off a Celebration in {C}", "A Franchise That Had Never Won It All Finally Has", "Generations of Fans Get the Night They Waited For", "Long-Suffering {C} Can Finally Exhale"],
  repeat: ["Back-to-Back Crowns Put a Dynasty Within Reach", "The Champions Answer Every Challenge, Again", "Second Straight Title Silences the Doubters"],
  threepeat: ["Three in a Row Puts Them Among the Greatest Teams Ever Assembled", "The Rest of the League Is Left Chasing a Dynasty", "History Is Made in a Third Straight Title"],
  rout: ["A Rout From the Opening Drive; the Outcome Was Never in Doubt", "The Biggest Stage, and the Most Lopsided Result in Years", "By Halftime the Celebration Had Already Begun"],
  thriller: ["A Game Decided in the Final Minutes Leaves a City Breathless", "Nobody Sat Down for the Fourth Quarter", "The Last Drive Will Be Talked About for Years"],
  shootout: ["Two Offenses Trade Blows Until the Final Gun", "Neither Defense Could Stop It; One Offense Had the Last Word", "A Track Meet, and a Trophy at the Finish Line"],
  defense: ["A Defense That Gave Nothing Away Takes the Title", "Points Were Precious, and {C} Gave Up Almost None", "Sacks, Stops and Takeaways Seal the Championship"],
  plain: ["A Complete Performance on Both Sides of the Ball Seals the Title", "Every Phase of the Game Pulls Its Weight", "The Better Team All Season Proves It on the Last Night"],
};

const MVP_QUOTES = [
  "This is for everybody who believed in us before anybody else did.",
  "I've dreamed about this since I was seven years old in the backyard. It's better than the dream.",
  "I don't care about the trophy they gave me. I care about the one we won together.",
  "We heard all of it this year. Every word. Tonight we answered.",
  "Ask me tomorrow. Right now I just want to find my mom.",
  "Coach told us at halftime the next thirty minutes would follow us forever. He was right.",
  "Somebody pinch me. Actually, don't. Let me stay right here.",
  "This city deserves this. I just got to be the one holding the ball.",
];
const COACH_QUOTES = [
  "I told them in July this group could be special. They made a liar out of nobody.",
  "We'll enjoy it tonight. Tomorrow we start trying to do it again.",
  "Players win games. I just tried to stay out of their way.",
  "That's the toughest locker room I've ever been a part of.",
  "You don't get many nights like this in a lifetime. I'm going to remember every minute.",
  "Every one of them earned it. Every single one.",
];
const FAN_QUOTES = [
  "I waited my whole life for this. My dad waited his whole life. I'm calling him right now.",
  "I'm not going to work tomorrow. I'm not sure I'm going to work Wednesday.",
  "I cried, and I'm not ashamed.",
  "They can't take this one away from us. Nobody can.",
  "I've had these season tickets for thirty-one years. Worth every penny.",
];

const EARS_L = ['"All the Football<br />That\'s Fit to Print"', '"Without Fear<br />or Favor"', '"The Paper of<br />Record for the Game"', '"Since the<br />Leather Helmet Days"'];
const WEATHER = ["Confetti, then clearing.<br />Tonight, cold. High 34.", "Sunny, with parades likely.<br />High 41. Low 29.", "Clouds giving way to celebration.<br />High 38.", "Snow flurries; spirits high.<br />High 30. Low 22.", "Clear and cold.<br />Champions all week."];
const EDITIONS = ["LATE CITY EDITION", "SPECIAL CHAMPIONSHIP EDITION", "FINAL EDITION", "EXTRA", "CITY FINAL"];
const PRICES = ["$4.00", "$5.00", "$3.50", "$6.00"];
const BYLINES = ["By the D'Amours Unlimited Staff", "By a Gazette Correspondent", "By the Gazette Sports Desk", "From Our Staff at the Stadium"];
const COLUMNISTS = ["Walter Pembrook", "Eleanor Hask", "Frank Delacorte", "Margaret Oyelaran", "Sam Whitlock", "Dolores Kincaid"];
const COLUMN_TITLES = ["Sports of the Times", "The Long View", "On Football", "Press Box", "From the Cheap Seats"];
const INDEX = [
  "Awards and the All-Pro team, D2", "How the {N2} were built, D6", "Letters: \"{FAN}\" A22", "Weather, A24", "The parade route, A3",
  "Photo essay: a night in {C}, D4", "The loser's locker room, D5", "Odds for next season, D8", "The play that decided it, D3", "Obituaries, B9", "Editorial: the city we became, A20",
];

// opts: { t, o, us, them, titles, streak, sb, mvp: { name, pos, prose, stat }, rec, games, bye, coach, yr }
export function writeGazette(opts) {
  const { t, o, us, them, titles, streak = 1, sb, mvp, rec, games = [], bye, coach, yr } = opts;
  const rand = seeded(`gz|${yr}|${t.ab}|${us}-${them}`);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const kind = storyKind({ us, them, titles, streak });
  const m = us - them;
  const v = {
    N: t.name.toUpperCase(), O: o ? o.name.toUpperCase() : "THEIR RIVAL", C: t.city, OC: o ? o.city : "Its Rival", N2: t.name, O2: o ? o.name : "the opposition",
    S: `${us}-${them}`, SB: sb, MVPC: mvp ? pick([`, as ${mvp.name} Is Named Most Valuable Player`, `; ${mvp.name} Is the M.V.P.`, `Behind ${mvp.name}`]) : "",
  };
  if (v.MVPC.startsWith("Behind")) v.MVPC = ` ${v.MVPC}`;
  const head = fill(pick(HEADS[kind]), { ...v, SB: sb.toUpperCase() });
  const deck1 = fill(pick(DECK1), v), deck2 = fill(pick(DECK2[kind]), v);
  const pos = mvp ? (mvp.pos === "QB" ? "quarterback" : mvp.pos === "RB" ? "running back" : mvp.pos === "WR" ? "receiver" : mvp.pos === "TE" ? "tight end" : mvp.pos === "LB" ? "linebacker" : mvp.pos === "CB" ? "cornerback" : mvp.pos === "S" ? "safety" : mvp.pos === "DL" ? "defensive lineman" : mvp.pos) : "";
  const mq = pick(MVP_QUOTES), cq = pick(COACH_QUOTES), fq = pick(FAN_QUOTES);
  const coachName = coach || `the ${t.name}' head coach`;
  const how = m >= 14 ? pick(["pulling away early and never letting the outcome come into question", "taking a commanding lead before halftime and coasting home", "turning a big game into a lopsided one before the crowd had settled in"])
    : m <= 3 ? pick(["surviving a finish that had both sidelines on their knees", "holding on through a final drive that seemed to last an hour", "winning a game that could have gone either way on the last snap"])
      : pick(["taking control in the second half and closing it out with poise", "answering every punch and landing the last one", "building a lead and never giving it back"]);
  const history = titles <= 1 ? "It is the first championship in the history of the franchise, and the city that waited for it was ready."
    : streak >= 3 ? `It is their ${ord(streak)} straight title, a run only a handful of teams in league history have managed.`
      : streak === 2 ? "It is their second straight title, and talk of a dynasty began before the trophy left the stage."
        : `It is the ${ord(titles)} championship in team history.`;
  const road = `The ${t.name} finished the regular season ${rec}${bye ? " and earned a first-round bye" : ""}, then won ${n2w(games.length)} playoff game${games.length === 1 ? "" : "s"} to reach this night.`;
  const mvpLine = mvp ? `${mvp.name}, the ${pos}, was named the game's most valuable player${mvp.prose ? ` after ${mvp.prose}` : mvp.stat ? ` (${mvp.stat})` : ""}.` : "";
  const VOICES = {
    // straight news, the wire way
    wire: () => [
      `${t.city.toUpperCase()} — The ${t.name} are champions of professional football. Before a sellout crowd and a television audience counted in the tens of millions, ${t.city} beat the ${o ? `${o.city} ${o.name}` : "opposition"}, ${us} to ${them}, in ${sb} on Sunday night, ${how}.`,
      mvp ? `${mvpLine} "${mq}" ${last(mvp.name)} said, a hat with the words SUPER BOWL CHAMPIONS pulled low over his eyes, confetti still falling.` : "It was a victory built on every phase of the game, the kind coaches talk about and rarely see.",
      `${road} ${history}`,
    ],
    // a columnist's first person
    column: () => [
      `${t.city.toUpperCase()} — I have covered this team long enough to know better than to believe in nights like this one. ${pick(["Then Sunday happened.", "I believe now.", "Consider me converted."])} The ${t.name} beat the ${o ? o.name : "opposition"}, ${us}-${them}, and ${m >= 14 ? "it was over long before it was over" : m <= 3 ? "nobody breathed until the final whistle" : "they made the hard parts look routine"}.`,
      mvp ? `You will read a lot today about ${mvp.name}${mvp.prose ? `, ${mvp.prose}` : ""}. All of it is true. "${mq}" he told me afterward, and for once a football player said exactly the right thing.` : "There was no single hero, which is the best compliment you can pay a team.",
      `${history} ${pick(["Frame the front page.", "Save this paper.", "Remember where you were."])}`,
    ],
    // the scene, the sights and sounds
    scene: () => [
      `${t.city.toUpperCase()} — The confetti came down in ${t.name} colors, and for a long moment nobody on the field knew what to do with their hands. Then the hugging started. ${t.city} had beaten the ${o ? o.name : "opposition"}, ${us}-${them}, and ${sb} belonged to them.`,
      `In the locker room the music was loud enough to rattle the lockers. ${mvp ? `${mvp.name}, the game's most valuable player, sat in front of his stall holding the trophy like it might float away. "${mq}"` : `"${cq}" ${coachName} said, over the noise.`}`,
      `Outside, a city poured into the streets. "${fq}" one fan said, waving a flag from a lamppost. ${road}`,
    ],
    // the numbers, the analyst's way
    numbers: () => [
      `${t.city.toUpperCase()} — ${us} points. ${them} allowed. ${games.length} playoff win${games.length === 1 ? "" : "s"}. One trophy. The ${t.name} beat the ${o ? `${o.city} ${o.name}` : "opposition"} in ${sb} on Sunday night, ${how}.`,
      mvp ? `The decisive line belonged to ${mvp.name}: ${mvp.stat || mvp.prose}. "${mq}" he said.` : "The box score spread the credit around: no one player dominated it, and everyone mattered.",
      `${road} ${history} By any measure, ${pick(["it was a season for the ages", "the best team won", "the numbers tell the story, and the story ends with a parade"])}.`,
    ],
  };
  const voice = pick(Object.keys(VOICES));
  const lead = VOICES[voice]();
  const format = pick(["classic", "hero", "column"]);
  const columnist = pick(COLUMNISTS);
  // the columnist's piece for the two-story layout (a different voice from the news story)
  const columnPiece = {
    title: pick(COLUMN_TITLES), by: columnist,
    head: pick([`For ${t.city}, a Night Worth the Wait`, `What the ${t.name} Taught Us`, `The Title Nobody Can Take Away`, `A Champion, and Then Some`, `Where This Team Ranks`]),
    paras: [
      pick([`Every championship has a story it tells about itself. This one is about ${titles <= 1 ? "patience" : streak >= 2 ? "refusing to be satisfied" : "a team that got better every week"}.`, `There is a version of this season that ended in October. The ${t.name} never let it.`, `I keep coming back to one moment, and it isn't the last one.`]),
      `"${cq}" ${coachName} said, and he meant it. ${pick(["You could hear it in his voice.", "You could see it on his players' faces.", "It was the most honest thing anyone said all night."])}`,
      pick([`Enjoy it, ${t.city}. They don't come along often, and they never come easy.`, `Next season starts soon enough. Tonight belongs to the champions.`, `The rest of the league will spend the off-season trying to figure out how to beat them. Good luck.`]),
    ],
  };
  const fanQ = pick(FAN_QUOTES);
  const index = [...INDEX].sort(() => rand() - 0.5).slice(0, 4).map((x) => fill(x, { ...v, FAN: fanQ }));
  return {
    kind, format, voice, head, deck1: curly(deck1), deck2: curly(deck2), lead: lead.map(curly),
    byline: voice === "column" ? `By ${columnist}` : pick(BYLINES),
    earL: pick(EARS_L), weather: pick(WEATHER), edition: pick(EDITIONS), price: pick(PRICES),
    column: { ...columnPiece, head: curly(columnPiece.head), paras: columnPiece.paras.map(curly) }, coachQuote: curly(cq), fanQuote: curly(fanQ), index: index.map(curly),
    parade: pick([
      `The city will hold a victory parade Tuesday at 11 a.m. Officials expect more than a million people along the route; schools have announced they will close for the day.`,
      `A parade is set for Wednesday morning, ending with a rally downtown. City Hall asked fans to take public transit; nobody expects them to listen.`,
      `The team plane lands this afternoon. The parade follows Thursday, weather permitting, and probably even if it doesn't.`,
    ]),
  };
}

// The playoff paper's writers: varied headlines and ledes for each playoff game.
const PO_HEADS = {
  rout: ["{W} ROUT {L}", "{W} RUN {L} OUT OF THE BUILDING", "{L} NEVER HAD A CHANCE", "{W} ROLL, {S}"],
  close: ["{W} SURVIVE {L}, {S}", "{W} ESCAPE, {S}", "{W} HOLD ON AGAINST {L}", "NAIL-BITER: {W} {S}"],
  plain: ["{W} TOP {L}, {S}", "{W} MOVE ON", "{W} END {L}' SEASON", "{W} BEAT {L}, {S}"],
};
const PO_HOW = {
  rout: ["a statement from the opening drive", "a game that was decided before halftime", "the kind of win that sends a message to everyone still playing"],
  close: ["a game that was not decided until the final minutes", "a finish nobody in the building will forget", "the margin of a single play"],
  close8: ["pulling away just enough in the fourth quarter", "making the plays that mattered late", "never trailing in the second half"],
  plain: ["in control for most of the afternoon", "a steady, complete performance", "dictating the terms from the first quarter on"],
};
export function playoffHeadline({ W, L, ws, ls, rd, yr }) {
  const rand = seeded(`po|${yr}|${rd}|${W.ab}|${L.ab}|${ws}-${ls}`);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const m = ws - ls, k = m >= 17 ? "rout" : m <= 3 ? "close" : "plain";
  const head = fill(pick(PO_HEADS[k]), { W: W.name.toUpperCase(), L: L.name.toUpperCase(), S: `${ws}-${ls}` });
  const how = pick(m >= 17 ? PO_HOW.rout : m <= 3 ? PO_HOW.close : m <= 8 ? PO_HOW.close8 : PO_HOW.plain);
  return { head, how };
}
