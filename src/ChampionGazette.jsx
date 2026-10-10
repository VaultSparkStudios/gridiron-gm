// The morning after you win it all: a broadsheet front page in the style of the great New York
// papers. Blackletter masthead, a banner headline across the page, decks, a lead story written from
// the game, a photo of the Lombardi Trophy, the road to the title and the parade plans.
import React, { useEffect } from "react";
import { LombardiStill } from "./Lombardi.jsx";
import { sbName, sbNumber } from "./data/superbowls.js";

const FONTS = "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap";
const ROUNDS = ["Wild Card", "Divisional Round", "Conference Championship", "Super Bowl"];
const MONTHS = ["JANUARY", "FEBRUARY", "MARCH"];
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const last = (n) => (n || "").split(" ").slice(1).join(" ") || n;
const num = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);

// The Monday after the second Sunday in February of the following year.
function paperDate(yr) {
  const d = new Date(Date.UTC(yr + 1, 1, 1));
  let sundays = 0;
  while (true) { if (d.getUTCDay() === 0 && ++sundays === 2) break; d.setUTCDate(d.getUTCDate() + 1); }
  d.setUTCDate(d.getUTCDate() + 1);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function headlines({ t, o, us, them, titles, repeat, mvp }) {
  const N = t.name.toUpperCase(), O = o ? o.name.toUpperCase() : "", m = us - them;
  let head;
  if (repeat) head = `${N} DO IT AGAIN`;
  else if (titles <= 1) head = `AT LAST: ${N} ARE CHAMPIONS`;
  else if (m >= 17) head = `${N} ROUT ${O} FOR TITLE`;
  else if (m <= 3) head = `${N} SURVIVE ${O} IN A THRILLER`;
  else head = `${N} CAPTURE THE SUPER BOWL`;
  const deck1 = `${t.city} Beats ${o ? o.city : "Its Rival"}, ${us}-${them}${mvp ? `, as ${mvp.name} Is Named Most Valuable Player` : ""}`;
  const deck2 = repeat ? "Back-to-Back Crowns Put a Dynasty Within Reach" : titles <= 1 ? `First Championship in Team History Sets Off a Celebration in ${t.city}` : m >= 17 ? "A Rout From the Opening Drive; the Outcome Was Never in Doubt" : m <= 3 ? "A Game Decided in the Final Minutes Leaves a City Breathless" : "A Complete Performance on Both Sides of the Ball Seals the Title";
  return { head, deck1, deck2 };
}

export default function ChampionGazette({ show, teams, ui, path = [], titles = 1, repeat = false, onNext }) {
  useEffect(() => {
    if (document.getElementById("gz-fonts")) return;
    const l = document.createElement("link"); l.id = "gz-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l);
  }, []);
  const { yr, champ, opp, score, sbmvp, awards = {} } = show;
  const t = teams[champ], o = opp != null ? teams[opp] : null;
  const [us, them] = (score || "0-0").split("-").map(Number);
  const { head, deck1, deck2 } = headlines({ t, o, us, them, titles, repeat, mvp: sbmvp });
  const sb = sbName(sbNumber(yr));
  const rec = `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
  const games = path.map((g, i) => {
    const home = g.h === champ, a = home ? g.hs : g.as, b = home ? g.as : g.hs, other = teams[home ? g.a : g.h];
    return { round: ROUNDS[ROUNDS.length - path.length + i] || "Playoffs", txt: `${home || i === path.length - 1 ? "vs." : "at"} ${other?.name || "?"}`, a, b };
  });
  const bye = path.length < 4;
  const leagueMvp = awards.mvp;
  const ours = (k) => awards[k] && awards[k].ti === champ;
  const vol = `VOL. ${["CLXXV", "CLXXVI", "CLXXVII", "CLXXVIII", "CLXXIX", "CLXXX"][Math.max(0, Math.min(5, yr - 2026))]}`;

  const lead = [
    `${t.city.toUpperCase()} — The ${t.name} are champions of professional football. Before a sellout crowd and a television audience counted in the tens of millions, ${t.city} beat the ${o ? `${o.city} ${o.name}` : "opposition"}, ${us} to ${them}, in ${sb} on Sunday night, ${us - them >= 14 ? "pulling away early and never letting the outcome come into question" : us - them <= 3 ? "surviving a finish that had both sidelines on their knees" : "taking control in the second half and closing it out with poise"}.`,
    sbmvp ? `${sbmvp.name}, the ${sbmvp.pos === "QB" ? "quarterback" : sbmvp.pos}, was named the game's most valuable player${sbmvp.stat ? ` after a night that read ${sbmvp.stat}` : ""}. "This is for everybody who believed in us before anybody else did," ${last(sbmvp.name)} said, a hat with the words SUPER BOWL CHAMPIONS pulled low over his eyes, confetti still falling.` : `It was a victory built on every phase of the game, the kind coaches talk about and rarely see.`,
    `The ${t.name} finished the regular season ${rec}${bye ? " and earned a first-round bye" : ""}, then won ${num(games.length)} playoff game${games.length === 1 ? "" : "s"} to reach this night. ${titles <= 1 ? `It is the first championship in the history of the franchise, and the city that waited for it was ready.` : repeat ? `It is their second straight title, and talk of a dynasty began before the trophy left the stage.` : `It is the ${titles === 2 ? "second" : titles === 3 ? "third" : `${titles}th`} championship in team history.`}`,
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "radial-gradient(ellipse at 50% 30%, #2b2620, #0a0907 75%)", overflowY: "auto", padding: "18px 10px 90px" }}>
      <style>{CSS}</style>
      <article className="gz">
        <div className="gz-ears">
          <div className="gz-ear">"All the Football<br />That's Fit to Print"</div>
          <h1 className="gz-mast">The Gridiron Gazette</h1>
          <div className="gz-ear gz-ear-r"><b>LATE CITY EDITION</b><br />Confetti, then clearing.<br />Tonight, cold. High 34.</div>
        </div>
        <div className="gz-dateline"><span>{vol} . . . No. {61000 + (yr - 2026) * 365 + 42}</span><span>{t.city.toUpperCase()}, {paperDate(yr)}</span><span>$4.00</span></div>

        <h2 className="gz-banner">{head}</h2>
        <div className="gz-grid">
          <section className="gz-main">
            <h3 className="gz-deck1">{deck1}</h3>
            <div className="gz-rule" />
            <h4 className="gz-deck2">{deck2}</h4>
            <div className="gz-byline">By D'AMOURS UNLIMITED STAFF</div>
            <div className="gz-cols">
              {lead.map((p, i) => <p key={i} className={i === 0 ? "gz-drop" : ""}>{p}</p>)}
              <p>Continued on Page D4</p>
            </div>
          </section>
          <figure className="gz-photo">
            <div className="gz-photo-frame"><LombardiStill size={150} /></div>
            <figcaption>The Vince Lombardi Trophy, held aloft by the {t.name} after {sb} on Sunday night. It heads home to {t.city} today. <i>Gazette Photo</i></figcaption>
          </figure>
          <aside className="gz-side">
            <h5>The Road to the Title</h5>
            {bye && <div className="gz-row"><span>Wild Card</span><span>First-round bye</span></div>}
            {games.map((g, i) => <div key={i} className="gz-row"><span>{g.round}</span><span>{g.txt} <b>W {g.a}-{g.b}</b></span></div>)}
            <div className="gz-rule thin" />
            <h5>By the Numbers</h5>
            <div className="gz-row"><span>Regular season</span><b>{rec}</b></div>
            <div className="gz-row"><span>Final score</span><b>{us}-{them}</b></div>
            <div className="gz-row"><span>Titles, all time</span><b>{titles}</b></div>
            <div className="gz-rule thin" />
            <h5>Parade Set for Tuesday</h5>
            <p className="gz-small">The city will hold a victory parade Tuesday at 11 a.m. Officials expect more than a million people along the route; schools have announced they will close for the day.</p>
            {leagueMvp && <><div className="gz-rule thin" /><h5>League Honors</h5><p className="gz-small">{leagueMvp.name}{leagueMvp.ti === champ ? ` of the ${t.name}` : ""} was named the league's Most Valuable Player.{ours("dpoy") ? ` ${awards.dpoy.name} took Defensive Player of the Year.` : ""}{ours("opoy") ? ` ${awards.opoy.name} took Offensive Player of the Year.` : ""} Full list of winners, <b>Sports D2</b>.</p></>}
          </aside>
        </div>
        <div className="gz-index"><b>INSIDE</b> · Awards and the All-Pro team, D2 · How the {t.name} were built, D6 · Letters: "I cried, and I'm not ashamed," A22 · Weather, A24</div>
      </article>
      <div className="gz-next"><button onClick={onNext}>Continue to the awards →</button></div>
    </div>
  );
}

const CSS = `
.gz { max-width: 980px; margin: 0 auto; background: #f3eee2; color: #151310; padding: 22px 28px 18px; box-shadow: 0 30px 80px #000c; font-family: 'Old Standard TT', Georgia, 'Times New Roman', serif;
  background-image: radial-gradient(ellipse at 20% 10%, #fffaf0 0%, transparent 55%), radial-gradient(ellipse at 90% 90%, #e2d9c4 0%, transparent 50%); }
.gz-ears { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
.gz-ear { font-size: 11px; line-height: 1.3; border: 1px solid #151310; padding: 5px 8px; max-width: 160px; font-style: italic; }
.gz-ear-r { justify-self: end; font-style: normal; text-align: left; }
.gz-mast { margin: 0; text-align: center; font-family: 'UnifrakturMaguntia', 'Old English Text MT', serif; font-weight: 400; font-size: 66px; line-height: 1; letter-spacing: 0.5px; white-space: nowrap; }
.gz-dateline { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; padding: 4px 0; border-top: 3px double #151310; border-bottom: 1px solid #151310; font-size: 11px; letter-spacing: 1px; }
.gz-banner { margin: 14px 0 10px; text-align: center; font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 900; font-size: 54px; line-height: 1.02; letter-spacing: -0.5px; text-transform: uppercase; }
.gz-grid { display: grid; grid-template-columns: 1.35fr 1fr 0.8fr; gap: 0; border-top: 1px solid #151310; }
.gz-grid > * { padding: 10px 14px; }
.gz-grid > * + * { border-left: 1px solid #15131055; }
.gz-main { padding-left: 0; }
.gz-side { padding-right: 0; }
.gz-deck1 { margin: 0; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 21px; line-height: 1.15; text-align: center; }
.gz-deck2 { margin: 0; font-weight: 400; font-style: italic; font-size: 15px; line-height: 1.25; text-align: center; }
.gz-rule { height: 1px; background: #151310; margin: 8px 30%; }
.gz-rule.thin { margin: 10px 0; opacity: .5; }
.gz-byline { margin: 8px 0; text-align: center; font-size: 10.5px; letter-spacing: 1.5px; }
.gz-cols { column-count: 2; column-gap: 16px; column-rule: 1px solid #15131033; font-size: 13.5px; line-height: 1.42; text-align: justify; hyphens: auto; }
.gz-cols p { margin: 0 0 8px; }
.gz-drop::first-letter { float: left; font-family: 'Playfair Display', serif; font-weight: 900; font-size: 46px; line-height: .85; padding: 4px 6px 0 0; }
.gz-photo { margin: 0; display: flex; flex-direction: column; align-items: center; }
.gz-photo-frame { width: 100%; display: flex; justify-content: center; background: radial-gradient(ellipse at 50% 40%, #6b6b6b, #1d1d1d 80%); filter: grayscale(1) contrast(1.15) sepia(.12); border: 1px solid #151310; padding: 14px 0 10px; }
.gz-photo figcaption { font-size: 11.5px; line-height: 1.35; margin-top: 6px; }
.gz-photo figcaption i { display: block; text-align: right; font-size: 10px; margin-top: 2px; }
.gz-side h5 { margin: 0 0 6px; font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; }
.gz-row { display: flex; justify-content: space-between; gap: 6px; font-size: 12.5px; padding: 2px 0; border-bottom: 1px dotted #15131044; }
.gz-small { margin: 0; font-size: 12.5px; line-height: 1.4; }
.gz-index { margin-top: 10px; padding-top: 6px; border-top: 3px double #151310; font-size: 11.5px; text-align: center; }
.gz-next { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px; display: flex; justify-content: center; background: linear-gradient(transparent, #000c 40%); }
.gz-next button { font: 900 17px system-ui, sans-serif; letter-spacing: .5px; padding: 12px 28px; border-radius: 10px; border: none; cursor: pointer; color: #111; background: linear-gradient(180deg, #fde68a, #d4a017); box-shadow: 0 6px 20px #d4a01766; }
@media (max-width: 760px) {
  .gz { padding: 14px 12px; }
  .gz-ears { grid-template-columns: 1fr; } .gz-ear { display: none; }
  .gz-mast { font-size: 34px; white-space: normal; }
  .gz-dateline { font-size: 9px; letter-spacing: .3px; } .gz-dateline span:first-child { display: none; }
  .gz-banner { font-size: 32px; }
  .gz-grid { grid-template-columns: 1fr; } .gz-grid > * { padding: 10px 0; } .gz-grid > * + * { border-left: none; border-top: 1px solid #15131055; }
  .gz-cols { column-count: 1; }
}
`;
