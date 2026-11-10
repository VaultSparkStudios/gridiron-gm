// Live plays: which snaps of a live game the field acts out, and the card that names what happened.
// The snaps that matter always play out live (third and fourth down, the red zone, a close game's
// last two minutes, overtime) under a KEY PLAY banner that's decided before the result is known, so
// it never gives the result away. A big play anywhere else plays out too, without a banner, and so
// does the odd ordinary snap, so the field starting to move doesn't tell you something big is coming.
export const LIVE_MODES = ["Key", "All", "Off"];
const ACTED = new Set(["run", "pass", "inc", "sack", "int", "fg", "punt", "kneel", "spike"]);
export const acted = (ev) => !!ev && ACTED.has(ev.k);
const nth = (n) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

// The banner for a snap that matters, from the situation before it (ev's down, toGo, yard, qtr,
// clock). lead: the offense's lead before the snap. null for an ordinary snap.
// Every snap of a close finish, fourth downs and goal-to-go; third downs once a drive crosses
// midfield or the game's in the fourth quarter (every third down would be ~26 a game: too many to sit through).
export function keyLabel(ev, lead = 0) {
  // every field goal try is worth watching (there are only a few a game)
  if (ev.k === "fg") return `${ev.dist}-yard field goal try${ev.qtr >= 4 && ev.clock <= 120 && Math.abs(lead) <= 3 ? " · the game on the line" : ""}`;
  if (ev.k === "punt") return null;
  // the kneel-downs that end a game always play out
  if (ev.k === "kneel") return "Victory formation";
  if (ev.k === "spike") return "Clock running · no timeouts";
  const goal = ev.yard + ev.toGo >= 100, close = Math.abs(lead) <= 8;
  const ot = ev.qtr >= 5, finish = ev.qtr === 4 && ev.clock <= 120 && close;
  const third = ev.down === 3 && (ev.yard >= 50 || ev.qtr >= 4 || goal);
  if (!(ot || finish || ev.down >= 4 || third || (goal && ev.down >= 2))) return null;
  const bits = [];
  if (ev.down >= 2 && (ev.down >= 3 || goal)) bits.push(`${nth(ev.down)} & ${goal ? "goal" : ev.toGo}`);
  if (ot) bits.push("Overtime");
  else if (finish) bits.push("Two-minute drill");
  else if (ev.yard >= 80 && !goal) bits.push("Red zone");
  return bits.join(" · ") || "Key play";
}

// Whether to act this play out: null (just the usual slide), or { key } (key: the banner, or null
// for none). mode: "Key" | "All" | "Off". roll: a 0-1 roll for the odd ordinary snap.
export function liveChoice(ev, mode, lead = 0, roll = Math.random()) {
  if (mode === "Off" || !acted(ev)) return null;
  const key = keyLabel(ev, lead);
  if (mode === "All" || key) return { key };
  // every punt plays out (fair catches, touchbacks and the ones downed deep too), like every kickoff
  if (ev.k === "punt") return { key: null };
  const big = (ev.pen && !ev.pen.pre) || ev.td || ev.turnover || ev.k === "int" || ev.k === "sack" || ev.type === "safety" || (ev.yards || 0) >= (ev.k === "run" ? 18 : 25);
  if (big || roll < 0.05) return { key: null };
  return null;
}

// The kickoff after a score the field just acted out (playsim.js kickoff() puts it on ev.ko): the
// play to act out next ({ k: "ko", ... }), or null when it isn't worth one. Only the scoring side's
// kick (the field still has them on offense) and only one that's returned: every return in "All",
// in "Key" a big one, a muff or a touchdown, and now and then an ordinary one.
export function kickoffPlay(ev, offSide, mode) {
  const ko = ev?.ko;
  if (!ko || mode === "Off" || ko.side !== offSide) return null;
  if (ko.onside) return { k: "ko", yard: 35, qtr: ev.qtr, clock: ev.clock, kicker: ko.kicker, onside: true, recovered: !!ko.recovered, spot: ko.spot, kickAb: null };
  // a touchback: it comes down in the end zone and he takes a knee there
  if (ko.tb) return { k: "ko", yard: 35, qtr: ev.qtr, clock: ev.clock, kicker: ko.kicker, kr: null, catchAt: -4, spot: 35, tb: true, muff: false, td: false, ret: 0 };
  const ret = (ko.spot ?? 0) - (ko.catchAt ?? 0);
  return { k: "ko", yard: 35, qtr: ev.qtr, clock: ev.clock, kicker: ko.kicker, kr: ko.kr, catchAt: ko.catchAt, spot: ko.spot, muff: !!ko.muff, td: !!ko.td, ret };
}

// The try after a touchdown (playsim.js puts it on ev.pat), to act out next: the extra point
// from the 15 (the field goal unit), or the two-point play from the 2. null in "Off".
export function patPlay(ev, mode) {
  const p = ev?.pat;
  if (!p || mode === "Off") return null;
  const base = { qtr: ev.qtr, clock: ev.clock, down: 1, toGo: 2 };
  if (!p.two) return { ...base, k: "fg", xp: true, yard: 85, dist: 33, made: p.good, player: p.kicker, holder: p.holder };
  const keeper = !!p.player && p.player === p.qb;
  if (p.style === "run") return { ...base, k: "run", two: true, yard: 98, yards: p.good ? 2 : 0, td: p.good, player: p.player, qb: p.qb, keeper, good: p.good };
  return p.good ? { ...base, k: "pass", two: true, yard: 98, yards: 2, td: true, player: p.player, tgt: p.player, qb: p.qb, good: true }
    : { ...base, k: "inc", two: true, yard: 98, yards: 0, tgt: p.player, qb: p.qb, good: false };
}

const nm = (p, fb) => p?.name || fb;
const an = (n) => (/^8/.test(String(n)) || n === 11 || n === 18 ? "an" : "a");
const lastNm = (p, fb) => (p?.name ? p.name.split(" ").slice(1).join(" ") || p.name : fb);
// The result over the field once the play's done. side: the offense ("h"/"a"); userSide: yours;
// box: the game's box score after the play, for "2nd sack of the game". Returns { head, line, tone,
// star: the player it's about, mine: he's yours, note } — head is "" for a routine play.
export function resultCard(ev, side, userSide, box = {}) {
  const def = side === "h" ? "a" : "h", Y = ev.yards || 0, k = ev.k;
  const qb = nm(ev.qb, "The quarterback"), carrier = nm(ev.player, "The runner");
  let head = "", line = "", tone = "", star = null, starSide = side, count = null;
  const nTimes = (s, id, key) => (id != null ? box[s]?.[id]?.[key] || 0 : 0);
  if (ev.xp) {
    head = ev.made ? "" : "NO GOOD!"; tone = ev.made ? "green" : "red"; line = `${nm(ev.player, "The kicker")}'s extra point is ${ev.made ? "good" : "no good"}`; star = ev.player;
  } else if (ev.two) {
    head = ev.good ? "TWO-POINT CONVERSION!" : "NO GOOD!"; tone = ev.good ? "gold" : "red";
    line = ev.good ? (k === "pass" ? `${qb} finds ${nm(ev.player, "his receiver")} for two` : `${carrier} punches in the two-point try`) : `The two-point try ${k === "inc" ? `for ${lastNm(ev.tgt, "his receiver")} falls incomplete` : "is stuffed at the line"}`;
    star = ev.good ? ev.player : null;
  } else if (k === "spike") {
    line = `${qb} spikes it to stop the clock`; tone = "grey";
  } else if (k === "kneel") {
    line = `${qb} takes a knee`; tone = "grey";
  } else if (k === "ko") {
    // side: the kicking team
    if (ev.onside) { head = ev.recovered ? "ONSIDE KICK RECOVERED!" : ""; tone = ev.recovered ? "gold" : "grey"; line = ev.recovered ? "The kicking team comes up with the onside kick" : "The onside kick is recovered by the hands team"; starSide = ev.recovered ? side : def; }
    else if (ev.tb) { line = `${nm(ev.kicker, "The kicker")} boots it into the end zone: touchback`; tone = "grey"; star = ev.kicker; }
    else if (ev.td) { head = "TOUCHDOWN!"; tone = "gold"; line = `${nm(ev.kr, "The returner")} takes the kickoff all the way back`; star = ev.kr; starSide = def; }
    else if (ev.muff) { head = "FUMBLE!"; tone = "red"; line = `${nm(ev.kr, "The returner")} coughs up the kickoff, and the kicking team recovers`; }
    else { star = ev.kr; starSide = def; if (ev.ret >= 35) { head = "BIG RETURN!"; tone = "green"; } line = `${nm(ev.kr, "The returner")} brings it back ${ev.ret} yards to the ${ev.spot > 50 ? `${100 - ev.spot}` : ev.spot}`; }
  } else if (k === "fg") {
    head = ev.made ? "IT'S GOOD!" : "NO GOOD!"; tone = ev.made ? "green" : "red"; star = ev.player;
    line = ev.made ? `${nm(ev.player, "The kicker")} from ${ev.dist} yards` : `${nm(ev.player, "The kicker")}'s ${ev.dist}-yard try is wide`;
  } else if (k === "punt") {
    star = ev.pr; starSide = def;
    if (ev.retTD) { head = "TOUCHDOWN!"; tone = "gold"; line = `${nm(ev.pr, "The returner")} takes the punt all the way back`; }
    else if (ev.muff) { head = "MUFFED!"; tone = "red"; line = `${nm(ev.pr, "The returner")} drops it, and the kicking team recovers`; star = ev.punter; starSide = side; }
    else if ((ev.ret || 0) >= 20) { head = "BIG RETURN!"; tone = "green"; line = `${nm(ev.pr, "The returner")} brings it back ${ev.ret} yards`; }
    else { star = ev.punter; starSide = side; line = ev.tb ? `Punt into the end zone: touchback` : `Punt, ${ev.gross} yards${ev.returned ? `, returned ${ev.ret}` : ev.downed || (ev.spot ?? 0) >= 90 ? `, downed at the ${100 - ev.spot}` : ", fair catch"}`; }
  } else if (ev.td) {
    head = "TOUCHDOWN!"; tone = "gold";
    if (k === "pass") { line = `${qb} hits ${nm(ev.player, "his receiver")} for ${an(Y)} ${Y}-yard score`; star = ev.player; count = ["recTD", "TD"]; }
    else { line = `${carrier} runs it in from ${Y === 1 ? "a yard" : `${Y} yards`} out`; star = ev.player; count = ["rushTD", "TD"]; }
  } else if (k === "int") {
    head = "INTERCEPTED!"; tone = "red"; star = ev.db; starSide = def; count = ["ints", "interception"];
    line = `${nm(ev.db, "The defense")} picks off ${qb}`;
  } else if (k === "sack") {
    star = ev.rusher; starSide = def;
    if (ev.type === "fumble") { head = "STRIP SACK!"; tone = "red"; line = `${nm(ev.rusher, "The rush")} strips ${qb}, and the defense recovers`; }
    else { head = "SACK!"; tone = "red"; line = `${nm(ev.rusher, "The rush")} sacks ${qb} for ${an(-Y)} ${-Y}-yard loss`; count = ["sacks", "sack"]; }
  } else if (ev.type === "fumble") {
    head = "FUMBLE!"; tone = "red"; star = ev.tkl; starSide = def;
    line = ev.tkl ? `${nm(ev.tkl)} knocks it loose from ${lastNm(ev.player, "the runner")}` : `${carrier} coughs it up`;
  } else if (ev.type === "safety") {
    head = "SAFETY!"; tone = "red"; star = ev.tkl; starSide = def;
    line = `${nm(ev.tkl, "The defense")} drops ${lastNm(ev.player, "him")} in the end zone`;
  } else if (ev.downs) {
    head = "STOPPED!"; tone = "red"; star = ev.tkl; starSide = def;
    line = k === "inc" ? `${qb}'s pass falls incomplete: turnover on downs` : `${nm(ev.tkl, "The defense")} holds on fourth down`;
  } else if (k === "inc") {
    head = ev.down >= 3 ? "INCOMPLETE" : ""; tone = "grey"; star = ev.db; starSide = def;
    line = ev.db ? `${nm(ev.db)} breaks up ${lastNm(ev.qb, "the")}'s pass for ${lastNm(ev.tgt, "his receiver")}` : `${qb}'s pass for ${lastNm(ev.tgt, "his receiver")} falls incomplete`;
  } else {
    const what = k === "pass" ? `${qb} to ${nm(ev.player, "his receiver")}` : carrier;
    star = ev.player;
    if (k === "pass" && Y >= 20) { head = "BIG PLAY!"; tone = "green"; line = `${what} for ${Y} yards`; }
    else if (k === "run" && Y >= 15) { head = "BREAKAWAY!"; tone = "green"; line = `${carrier} rips off ${Y} yards`; }
    else if (ev.firstDown && ev.down >= 3) { head = "MOVES THE CHAINS"; tone = "green"; line = `${what} for ${Y} on ${nth(ev.down)} down`; }
    else if (!ev.firstDown && ev.down >= 3 && Y < ev.toGo) { head = "SHORT!"; tone = "grey"; line = `${what} for ${Y}, ${ev.toGo - Y} short`; star = ev.tkl || star; starSide = ev.tkl ? def : side; }
    else line = `${what} for ${Y === 0 ? "no gain" : Y < 0 ? `a loss of ${-Y}` : `${Y} yard${Y === 1 ? "" : "s"}`}`;
  }
  // a flag on the play: an accepted penalty that undid it is the story; one tacked on or declined is a note
  let flagNote = "";
  if (ev.pen && !ev.pen.pre) {
    const pe = ev.pen, by = pe.player ? `${lastNm(pe.player)}, ${pe.side === "off" ? "offense" : "defense"}` : pe.side === "off" ? "offense" : "defense";
    if (pe.accepted && !pe.tack && !pe.onKick) {
      head = `FLAG: ${pe.label.toUpperCase()}`; tone = "gold"; star = pe.player; starSide = pe.side === "off" ? side : def; count = null;
      line = pe.side === "off" ? `On ${by}. ${pe.play?.td ? "The touchdown comes off the board" : "The play comes back"}: ${Math.abs(ev.yards)}-yard penalty, replay the down` : pe.kind === "dpi" ? `On ${by}. Ball spotted ${Math.abs(ev.yards)} yards downfield, first down` : `On ${by}. ${Math.abs(ev.yards)} yards and an automatic first down`;
    } else if (pe.tack) {
      // a personal foul at the end of the play: the play stands, plus 15
      head = `FLAG: ${pe.label.toUpperCase()}`; tone = "gold"; line = `${line}, plus 15 yards on ${by}`;
    } else flagNote = `Flag: ${pe.label} (${by}). ${!pe.accepted ? "Declined" : "Enforced on the kickoff"}`;
  }
  const mine = !!star && starSide === userSide;
  let note = "";
  if (mine && count) {
    const n = count[0] === "rushTD" || count[0] === "recTD" ? nTimes(starSide, star.id, "rushTD") + nTimes(starSide, star.id, "recTD") : nTimes(starSide, star.id, count[0]);
    if (n >= 2) note = Number.isInteger(n) ? `${nth(n)} ${count[1]} of the game` : `${n} ${count[1]}s in the game`;
  }
  if (flagNote) note = note ? `${note} · ${flagNote}` : flagNote;
  return { head, line, tone, star: star ? { id: star.id, name: star.name } : null, mine, note };
}
