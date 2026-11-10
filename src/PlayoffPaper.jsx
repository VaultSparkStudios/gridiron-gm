// The Gridiron Gazette after each of your playoff games: the story, the star, the numbers, what went
// wrong for the loser and where they build next. Same broadsheet as the championship front page.
import React, { useEffect } from "react";
import { GAZETTE_CSS, GAZETTE_FONTS } from "./ChampionGazette.jsx";
import { LombardiStill } from "./Lombardi.jsx";

const CSS = `
.pp { max-width: 900px; }
.pp-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0; border-top: 1px solid #151310; }
.pp-grid > * { padding: 10px 14px; }
.pp-grid > * + * { border-left: 1px solid #15131055; }
.pp-stats { width: 100%; border-collapse: collapse; font-size: 13px; }
.pp-stats td, .pp-stats th { padding: 3px 4px; border-bottom: 1px dotted #15131044; text-align: right; }
.pp-stats td:first-child, .pp-stats th:first-child { text-align: left; }
.pp-box { border: 1px solid #151310; padding: 8px 10px; margin-top: 10px; background: #ebe4d2; }
.pp-box h5 { margin: 0 0 4px; font-family: 'IM Fell English SC', 'IM Fell English', serif; font-size: 15px; }
.pp-box ul { margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.4; }
.pp-next { position: sticky; bottom: 0; display: flex; justify-content: center; padding: 12px 0 0; }
.pp-next button { font: 900 15px system-ui, sans-serif; padding: 10px 24px; border-radius: 10px; border: none; cursor: pointer; color: #111; background: linear-gradient(180deg, #fde68a, #d4a017); }
/* the editions and game papers are shorter than the championship page: on a computer they read at full size, larger on a big screen */
@media (min-width: 761px) { .pp { zoom: 1; max-width: 1040px; } }
@media (min-width: 1400px) and (min-height: 900px) { .pp { zoom: 1.15; } }
@media (max-width: 760px) { .pp-grid { grid-template-columns: 1fr; } .pp-grid > * + * { border-left: none; border-top: 1px solid #15131055; } }
`;

const H5 = { margin: "0 0 4px", fontFamily: "'IM Fell English SC', 'IM Fell English', serif", fontSize: 15 };
// The special editions (editions.js): deadline day, the draft extra, the Hall of Fame page.
function Edition({ p, onClose }) {
  return (
    <article className="gz pp" onClick={(e) => e.stopPropagation()}>
      <div className="gz-ears">
        {p.motto ? <div className="gz-ear" dangerouslySetInnerHTML={{ __html: p.motto }} /> : <div className="gz-ear">"All the Football<br />That's Fit to Print"</div>}
        <h1 className="gz-mast" style={p.mast ? { fontSize: "clamp(30px, 6vw, 56px)" } : undefined}>{p.mast || "The Gridiron Gazette"}</h1>
        <div className="gz-ear gz-ear-r"><b>{p.edition}</b><br />{p.yr} season</div>
      </div>
      <div className="gz-dateline"><span>SPORTS</span><span>{String(p.city || "").toUpperCase()} · {p.round.toUpperCase()}</span><span>$2.50</span></div>
      <h2 className="gz-banner" style={{ fontSize: 42 }}>{p.head}</h2>
      <h3 className="gz-deck1" style={{ marginBottom: 8 }}>{p.deck}</h3>
      <div className="pp-grid">
        <section style={{ paddingLeft: 0 }}>
          <div className="gz-byline">{String(p.byline || "").toUpperCase()}</div>
          <div className="gz-cols">{p.story.map((t, i) => <p key={i} className={i === 0 ? "gz-drop" : ""}>{t}</p>)}</div>
        </section>
        <aside style={{ paddingRight: 0 }}>
          {p.boxes.map((b) => <div key={b.title} className="pp-box" style={{ marginTop: 0, marginBottom: 10 }}><h5>{b.title}</h5><ul>{b.items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>)}
          {p.table && <><h5 style={H5}>{p.table.title}</h5><table className="pp-stats"><tbody>{p.table.rows.map(([a, b], i) => <tr key={i}><td>{a}</td><td><b>{b}</b></td></tr>)}</tbody></table></>}
        </aside>
      </div>
      <div className="pp-next"><button onClick={onClose}>Close the paper</button></div>
    </article>
  );
}

export default function PlayoffPaper({ paper: p, onClose }) {
  useEffect(() => {
    if (document.getElementById("gz-fonts")) return;
    const l = document.createElement("link"); l.id = "gz-fonts"; l.rel = "stylesheet"; l.href = GAZETTE_FONTS; document.head.appendChild(l);
  }, []);
  if (p.kind) return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2950, background: "radial-gradient(ellipse at 50% 30%, #2b2620, #0a0907 75%)", overflowY: "auto", padding: "14px 10px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{GAZETTE_CSS + CSS}</style>
      <Edition p={p} onClose={onClose} />
    </div>
  );
  const you = p.youWon ? p.winner : p.loser;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2950, background: "radial-gradient(ellipse at 50% 30%, #2b2620, #0a0907 75%)", overflowY: "auto", padding: "14px 10px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{GAZETTE_CSS + CSS}</style>
      <article className="gz pp" onClick={(e) => e.stopPropagation()}>
        <div className="gz-ears">
          <div className="gz-ear">"All the Football<br />That's Fit to Print"</div>
          <h1 className="gz-mast">The Gridiron Gazette</h1>
          <div className="gz-ear gz-ear-r"><b>PLAYOFF EDITION</b><br />{p.round}{p.sb ? ` · ${p.sb}` : ""}<br />{p.yr} season</div>
        </div>
        <div className="gz-dateline"><span>SPORTS</span><span>{p.city.toUpperCase()} · {p.round.toUpperCase()}</span><span>$2.50</span></div>
        <h2 className="gz-banner" style={{ fontSize: 44 }}>{p.head}</h2>
        <h3 className="gz-deck1" style={{ marginBottom: 8 }}>{p.deck}</h3>
        <div className="pp-grid">
          <section style={{ paddingLeft: 0 }}>
            <div className="gz-byline">By D'AMOURS UNLIMITED STAFF</div>
            <div className="gz-cols">{p.story.map((t, i) => <p key={i} className={i === 0 ? "gz-drop" : ""}>{t}</p>)}</div>
            <div className="pp-box">
              <h5>{p.youWon ? `What went wrong for the ${p.loser}` : `What went wrong for the ${you}`}</h5>
              <ul>{p.wrong.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          </section>
          <aside style={{ paddingRight: 0 }}>
            {p.rd === 4 && <div className="gz-photo-frame" style={{ marginBottom: 8 }}><LombardiStill size={90} /></div>}
            {p.star && <><h5 style={{ margin: "0 0 4px", fontFamily: "'IM Fell English SC', 'IM Fell English', serif", fontSize: 15 }}>Star of the Game</h5><p className="gz-small"><b>{p.star.name}</b> ({p.star.pos}): {p.star.line}.</p><div className="gz-rule thin" /></>}
            <h5 style={{ margin: "0 0 4px", fontFamily: "'IM Fell English SC', 'IM Fell English', serif", fontSize: 15 }}>By the Numbers</h5>
            <table className="pp-stats"><thead><tr><th></th><th>{p.winner}</th><th>{p.loser}</th></tr></thead>
              <tbody><tr><td>Points</td><td><b>{p.ws}</b></td><td>{p.ls}</td></tr>{p.stats.map(([l, a, b]) => <tr key={l}><td>{l}</td><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
            <div className="pp-box">
              <h5>{p.youWon ? `${p.loser}: where they build next` : `Your off-season blueprint`}</h5>
              <ul>{p.build.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
            {p.youWon && p.next && <p className="gz-small" style={{ marginTop: 8 }}><b>Next:</b> the {p.winner} move on to {p.next}.</p>}
          </aside>
        </div>
        <div className="pp-next"><button onClick={onClose}>Close the paper</button></div>
      </article>
    </div>
  );
}
