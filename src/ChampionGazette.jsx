// The morning after you win it all: a broadsheet front page in the style of the great New York
// papers. Blackletter masthead, a banner headline across the page, decks, a lead story written from
// the game, a photo, the road to the title and the parade plans. The words and the layout come from
// the paper's bank of writers (gazetteBank.js): a different headline, voice and front page each
// year. Set in old letterpress type throughout (IM Fell, cut in the 1680s), with a blackletter flag.
import React, { useEffect, useState } from "react";
import { ConfettiRain } from "./SuperBowlWin.jsx";
import { LombardiStill } from "./Lombardi.jsx";
import { primeArt } from "./playerArt.js";
import { sbName, sbNumber } from "./data/superbowls.js";
import { writeGazette } from "./gazetteBank.js";

const FONTS = "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=IM+Fell+Double+Pica:ital@0;1&display=swap";
const ROUNDS = ["Wild Card", "Divisional Round", "Conference Championship", "Super Bowl"];
// the Road to the Title box is narrow: short names there
const SHORT = { "Divisional Round": "Divisional", "Conference Championship": "Conf. Championship" };
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

export default function ChampionGazette({ show, teams, ui, path = [], titles = 1, repeat = false, streak, onNext, cta = "Continue to the awards →" }) {
  useEffect(() => {
    if (document.getElementById("gz-fonts")) return;
    const l = document.createElement("link"); l.id = "gz-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l);
  }, []);
  const { yr, champ, opp, score, sbmvp, awards = {} } = show;
  const t = teams[champ], o = opp != null ? teams[opp] : null;
  const [us, them] = (score || "0-0").split("-").map(Number);
  // the Super Bowl MVP's portrait (none for kickers and punters: the trophy takes the photo slot)
  // (his own player render, when he has one)
  const [mvpSrc, setMvpSrc] = useState(null);
  useEffect(() => {
    const p = sbmvp && sbmvp.ti === champ ? teams[champ]?.roster?.find((r) => String(r.id) === String(sbmvp.pid)) : null;
    if (!p) return;
    let live = true;
    primeArt(p, teams[champ].ab).then((u) => { if (live && u) setMvpSrc(u); }).catch(() => {});
    return () => { live = false; };
  }, [sbmvp?.pid, champ]); // eslint-disable-line react-hooks/exhaustive-deps
  const sb = sbName(sbNumber(yr));
  const rec = `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
  const games = path.map((g, i) => {
    const home = g.h === champ, a = home ? g.hs : g.as, b = home ? g.as : g.hs, other = teams[home ? g.a : g.h];
    return { round: ROUNDS[ROUNDS.length - path.length + i] || "Playoffs", txt: `${home || i === path.length - 1 ? "vs." : "at"} ${other?.name || "?"}`, a, b };
  });
  const bye = path.length < 4;
  const gz = writeGazette({ t, o, us, them, titles, streak: streak || (repeat ? 2 : 1), sb, mvp: sbmvp, rec, games, bye, coach: t.coach?.hc?.name, yr });
  const { head, deck1, deck2, lead } = gz;
  const leagueMvp = awards.mvp;
  const ours = (k) => awards[k] && awards[k].ti === champ;
  const vol = `VOL. ${["CLXXV", "CLXXVI", "CLXXVII", "CLXXVIII", "CLXXIX", "CLXXX"][Math.max(0, Math.min(5, yr - 2026))]}`;

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "radial-gradient(ellipse at 50% 30%, #2b2620, #0a0907 75%)", overflowY: "auto", padding: "18px 10px 90px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{GAZETTE_CSS}</style>
      {/* confetti still falling while you read the paper (it never blocks a click) */}
      <ConfettiRain colors={[t.clr || "#1e3a8a", t.ac || "#f59e0b", "#fbbf24", "#fde68a", "#ffffff"]} count={60} z={3001} />
      <article className="gz">
        <div className="gz-ears">
          <div className="gz-ear" dangerouslySetInnerHTML={{ __html: gz.earL }} />
          <h1 className="gz-mast">The Gridiron Gazette</h1>
          <div className="gz-ear gz-ear-r"><b>{gz.edition}</b><br /><span dangerouslySetInnerHTML={{ __html: gz.weather }} /></div>
        </div>
        <div className="gz-dateline"><span>{vol} . . . No. {61000 + (yr - 2026) * 365 + 42}</span><span>{t.city.toUpperCase()}, {paperDate(yr)}</span><span>{gz.price}</span></div>

        <h2 className={`gz-banner gz-${gz.kind}`}>{head}</h2>
        {/* the photo, sized for the layout */}
        {(() => {
          const photo = (big) => (
            <figure className={`gz-photo${big ? " gz-photo-hero" : ""}`}>
              {mvpSrc ? (
                <>
                  <div className="gz-photo-frame gz-mvp"><img src={mvpSrc} alt={`${sbmvp.name}, Super Bowl MVP`} width="360" height="360" /></div>
                  <figcaption>{sbmvp.name} of the {t.name}, the most valuable player of {sb}, after the final whistle on Sunday night. <i>Gazette Photo</i></figcaption>
                  {!big && <><div className="gz-photo-frame gz-inset"><LombardiStill size={120} /></div><figcaption>The Lombardi Trophy heads home to {t.city} today.</figcaption></>}
                </>
              ) : (
                <>
                  <div className="gz-photo-frame"><LombardiStill size={big ? 190 : 150} /></div>
                  <figcaption>The Vince Lombardi Trophy, held aloft by the {t.name} after {sb} on Sunday night. It heads home to {t.city} today. <i>Gazette Photo</i></figcaption>
                </>
              )}
            </figure>
          );
          const story = (cols = 2) => (
            <section className="gz-main">
              <h3 className="gz-deck1">{deck1}</h3>
              <div className="gz-rule" />
              <h4 className="gz-deck2">{deck2}</h4>
              <div className="gz-byline">{gz.byline}</div>
              <div className="gz-cols" style={{ columnCount: cols }}>
                {lead.map((p, i) => <p key={i} className={i === 0 ? "gz-drop" : ""}>{p}</p>)}
                <p>Continued on Page D4</p>
              </div>
            </section>
          );
          const side = (
            <aside className="gz-side">
              <h5>The Road to the Title</h5>
              {bye && <div className="gz-row"><span>Wild Card</span><span>First-round bye</span></div>}
              {games.map((g, i) => <div key={i} className="gz-row"><span>{SHORT[g.round] || g.round}</span><span style={{ whiteSpace: "nowrap" }}>{g.txt} <b>W {g.a}-{g.b}</b></span></div>)}
              <div className="gz-rule thin" />
              <h5>By the Numbers</h5>
              <div className="gz-row"><span>Regular season</span><b>{rec}</b></div>
              <div className="gz-row"><span>Final score</span><b>{us}-{them}</b></div>
              <div className="gz-row"><span>Titles, all time</span><b>{titles}</b></div>
              <div className="gz-rule thin" />
              <h5>Parade Plans</h5>
              <p className="gz-small">{gz.parade}</p>
              {leagueMvp && <><div className="gz-rule thin" /><h5>League Honors</h5><p className="gz-small">{leagueMvp.name}{leagueMvp.ti === champ ? ` of the ${t.name}` : ""} was named the league's Most Valuable Player.{ours("dpoy") ? ` ${awards.dpoy.name} took Defensive Player of the Year.` : ""}{ours("opoy") ? ` ${awards.opoy.name} took Offensive Player of the Year.` : ""} Full list of winners, <b>Sports D2</b>.</p></>}
            </aside>
          );
          // a columnist beside the news story
          const column = (
            <section className="gz-column">
              <div className="gz-kicker">{gz.column.title}</div>
              <h3 className="gz-col-head">{gz.column.head}</h3>
              <div className="gz-byline">By {gz.column.by}</div>
              {gz.column.paras.map((p, i) => <p key={i} className={`gz-small${i === 0 ? " gz-drop" : ""}`}>{p}</p>)}
              <div className="gz-rule thin" />
              <h5>Heard on the Streets</h5>
              <p className="gz-small gz-q">“{gz.fanQuote}”</p>
            </section>
          );
          if (gz.format === "hero") return (
            <div className="gz-hero">
              {photo(true)}
              <div className="gz-grid gz-grid-hero">{story(3)}{side}</div>
            </div>
          );
          if (gz.format === "column") return <div className="gz-grid gz-grid-col">{story(2)}{column}{side}</div>;
          return <div className="gz-grid">{story(2)}{photo(false)}{side}</div>;
        })()}
        <div className="gz-index"><b>INSIDE</b> · {gz.index.join(" · ")}</div>
      </article>
      <div className="gz-next"><button onClick={onNext}>{cta}</button></div>
    </div>
  );
}

export const GAZETTE_FONTS = FONTS;
export const GAZETTE_CSS = `
.gz { max-width: 980px; width: 100%; box-sizing: border-box; margin: 0 auto; background: #f3eee2; color: #151310; padding: 22px 28px 18px; box-shadow: 0 30px 80px #000c; font-family: 'IM Fell English', 'Old Standard TT', Georgia, 'Times New Roman', serif;
  background-image: radial-gradient(ellipse at 20% 10%, #fffaf0 0%, transparent 55%), radial-gradient(ellipse at 90% 90%, #e2d9c4 0%, transparent 50%); }
.gz-ears { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; }
.gz-ear { font-family: 'IM Fell English SC', 'IM Fell English', serif; font-size: 11.5px; line-height: 1.3; border: 1px solid #151310; padding: 5px 8px; max-width: 160px; font-style: italic; }
.gz-ear-r { justify-self: end; font-style: normal; text-align: left; }
.gz-mast { margin: 0; text-align: center; font-family: 'UnifrakturMaguntia', 'Old English Text MT', serif; font-weight: 400; font-size: 66px; line-height: 1; letter-spacing: 0.5px; white-space: nowrap; }
.gz-dateline { font-family: 'IM Fell English SC', 'IM Fell English', serif; display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; padding: 4px 0; border-top: 3px double #151310; border-bottom: 1px solid #151310; font-size: 11px; letter-spacing: 1px; }
.gz-banner { margin: 14px 0 10px; text-align: center; font-family: 'IM Fell Double Pica', 'IM Fell English', serif; font-weight: 400; font-size: 58px; line-height: 1; letter-spacing: 0; text-transform: uppercase; -webkit-text-stroke: .9px #151310; }
.gz-grid { display: grid; grid-template-columns: 1.35fr 1fr 0.8fr; gap: 0; border-top: 1px solid #151310; }
.gz-grid > * { padding: 10px 14px; }
.gz-grid > * + * { border-left: 1px solid #15131055; }
.gz-main { padding-left: 0; }
.gz-side { padding-right: 0; }
.gz-deck1 { margin: 0; font-family: 'IM Fell Double Pica', 'IM Fell English', serif; font-weight: 400; -webkit-text-stroke: .35px #151310; font-size: 22px; line-height: 1.15; text-align: center; }
.gz-deck2 { margin: 0; font-family: 'IM Fell English', serif; font-weight: 400; font-style: italic; font-size: 16px; line-height: 1.25; text-align: center; }
.gz-rule { height: 1px; background: #151310; margin: 8px 30%; }
.gz-rule.thin { margin: 10px 0; opacity: .5; }
.gz-byline { margin: 8px 0; text-align: center; font-family: 'IM Fell English SC', 'IM Fell English', serif; font-size: 12px; letter-spacing: 1px; }
.gz-cols { column-count: 2; column-gap: 16px; column-rule: 1px solid #15131033; font-size: 14.5px; line-height: 1.38; text-align: left; hyphens: auto; -webkit-hyphens: auto; }
.gz-cols p { margin: 0 0 8px; }
.gz-drop::first-letter { float: left; font-family: 'IM Fell Double Pica', serif; font-weight: 400; font-size: 50px; line-height: .8; padding: 5px 6px 0 0; -webkit-text-stroke: .6px #151310; }
.gz-photo { margin: 0; display: flex; flex-direction: column; align-items: center; }
.gz-photo-frame { width: 100%; display: flex; justify-content: center; background: radial-gradient(ellipse at 50% 40%, #6b6b6b, #1d1d1d 80%); filter: grayscale(1) contrast(1.15) sepia(.12); border: 1px solid #151310; padding: 14px 0 10px; }
.gz-mvp img { display: block; width: min(100%, 300px); height: auto; aspect-ratio: 1; object-fit: contain; }
.gz-inset { margin-top: 10px; width: 100%; padding: 10px 0 8px; }
.gz-photo figcaption { font-size: 11.5px; line-height: 1.35; margin-top: 6px; }
.gz-photo figcaption i { display: block; text-align: right; font-size: 10px; margin-top: 2px; }
.gz-side h5, .gz-column h5 { margin: 0 0 6px; font-family: 'IM Fell English SC', 'IM Fell English', serif; font-size: 16px; font-weight: 400; letter-spacing: .3px; }
.gz-row { display: flex; justify-content: space-between; gap: 6px; font-size: 12.5px; padding: 2px 0; border-bottom: 1px dotted #15131044; }
.gz-small { margin: 0; font-size: 12.5px; line-height: 1.4; }
.gz-index { font-family: 'IM Fell English SC', 'IM Fell English', serif; margin-top: 10px; padding-top: 6px; border-top: 3px double #151310; font-size: 11.5px; text-align: center; }
.gz-next { position: fixed; left: 0; right: 0; bottom: 0; padding: 14px; display: flex; justify-content: center; background: linear-gradient(transparent, #000c 40%); }
.gz-next button { font: 900 17px system-ui, sans-serif; letter-spacing: .5px; padding: 12px 28px; border-radius: 10px; border: none; cursor: pointer; color: #111; background: linear-gradient(180deg, #fde68a, #d4a017); box-shadow: 0 6px 20px #d4a01766; }
/* a computer screen: the whole front page in view, no scrolling */
@media (min-width: 761px) { .gz { zoom: .8; } .gz-mvp img { width: min(100%, 230px); } }
@media (min-width: 761px) and (max-height: 860px) { .gz { zoom: .7; } }
@media (min-width: 1400px) and (min-height: 1000px) { .gz { zoom: .95; } }
/* the photo-led page: the picture across the top, the story in three columns under it */
.gz-hero .gz-photo-hero { border-top: 1px solid #151310; padding: 10px 0 4px; }
.gz-photo-hero .gz-photo-frame { padding: 8px 0 6px; }
.gz-photo-hero .gz-mvp img { width: min(100%, 200px); }
.gz-photo-hero figcaption { text-align: center; max-width: 640px; }
.gz-grid-hero { grid-template-columns: 2.6fr 1fr; }
/* the two-story page: the news story, a columnist's take, the box */
.gz-grid-col { grid-template-columns: 1.4fr 1fr .85fr; }
.gz-column .gz-small { margin: 0 0 7px; font-size: 13.5px; line-height: 1.4; }
.gz-kicker { font-family: 'IM Fell English SC', serif; font-size: 13px; letter-spacing: 1.5px; border-bottom: 1px solid #151310; padding-bottom: 2px; margin-bottom: 6px; }
.gz-col-head { margin: 0 0 4px; font-family: 'IM Fell Double Pica', serif; font-style: italic; font-weight: 400; font-size: 21px; line-height: 1.12; }
.gz-q { font-style: italic; }
.gz-banner.gz-threepeat, .gz-banner.gz-first { font-size: 64px; }
@media (max-width: 760px) {
  .gz { padding: 14px 12px; }
  .gz-ears { grid-template-columns: 1fr; } .gz-ear { display: none; }
  .gz-mast { font-size: 34px; white-space: normal; }
  .gz-dateline { font-size: 9px; letter-spacing: .3px; } .gz-dateline span:first-child { display: none; }
  .gz-banner, .gz-banner.gz-threepeat, .gz-banner.gz-first { font-size: 34px; }
  .gz-grid { grid-template-columns: 1fr; } .gz-grid > * { padding: 10px 0; } .gz-grid > * + * { border-left: none; border-top: 1px solid #15131055; }
  .gz-cols { column-count: 1; }
}
`;
