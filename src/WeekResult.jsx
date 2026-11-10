// The big result card shown after you sim: did you win, the score, your record and
// standing, who starred, and the rest of the week's scores. It closes itself after 6 seconds (a bar
// along the bottom counts down); hovering pauses it, and clicking anything in it keeps it up. On
// phones it's a final-score card above the action bar: tap it for the box score, swipe it down to
// dismiss.
import React, { useEffect, useRef, useState } from "react";
import { WinProbChart } from "./GameRecap.jsx";
import { C, Btn, TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { isScorigami } from "./scorigami.js";
import { sbSite } from "./data/superbowls.js";

const fmtRec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const pct = (t) => (t.w + t.t * 0.5) / Math.max(1, t.w + t.l + t.t);

// Division place, 1st to 4th.
function divPlace(teams, me) {
  const div = teams.filter((t) => t.c === me.c && t.d === me.d).sort((a, b) => pct(b) - pct(a) || (b.pf - b.pa) - (a.pf - a.pa));
  const i = div.findIndex((t) => t.id === me.id);
  return `${["1st", "2nd", "3rd", "4th"][i] || `${i + 1}th`} in the ${me.c} ${me.d}`;
}

// The best few lines from one side's box score.
function topLines(box) {
  const lines = [];
  for (const s of Object.values(box || {})) {
    const cand = [
      [s.passYds || 0, `${s.comp || 0}/${s.att || 0}, ${s.passYds} yds, ${s.passTD || 0} TD${s.passInt ? `, ${s.passInt} INT` : ""}`],
      [(s.rushYds || 0) * 1.6, `${s.rushAtt || 0} car, ${s.rushYds} yds${s.rushTD ? `, ${s.rushTD} TD` : ""}`],
      [(s.recYds || 0) * 1.6, `${s.rec || 0} rec, ${s.recYds} yds${s.recTD ? `, ${s.recTD} TD` : ""}`],
      [(s.sacks || 0) * 60 + (s.ints || 0) * 70 + (s.tkl || 0) * 8, [s.tkl ? `${s.tkl} tkl` : "", s.sacks ? `${s.sacks} sk` : "", s.ints ? `${s.ints} INT` : ""].filter(Boolean).join(", ")],
    ].sort((a, b) => b[0] - a[0])[0];
    if (cand[0] > 0 && cand[1]) lines.push({ score: cand[0], name: s.name, pos: s.pos, line: cand[1] });
  }
  return lines.sort((a, b) => b.score - a.score).slice(0, 3);
}

function Others({ list, teams, onBox }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.bd}` }}>
      <div style={{fontSize: 13, fontWeight: 800, color: C.mt, marginBottom: 6 }}>Around the league</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.map((x, i) => {
          const hw = x.hs > x.as, aw = x.as > x.hs;
          return (
            <button key={i} onClick={() => onBox(x)} style={{ background: C.bg, border: "1px solid #ffffff10", borderRadius: 6, padding: "4px 8px", fontSize: 13, color: C.tx, cursor: "pointer" }}>
              <span style={{ fontWeight: aw ? 800 : 400, color: aw ? "#fff" : C.mt }}>{teams[x.a]?.ab} {x.as}</span>
              <span style={{ color: C.mt }}> @ </span>
              <span style={{ fontWeight: hw ? 800 : 400, color: hw ? "#fff" : C.mt }}>{teams[x.h]?.ab} {x.hs}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SHOW_MS = 6000;
export default function WeekResult(props) {
  const { result, onClose } = props;
  const [hover, setHover] = useState(false);
  const [kept, setKept] = useState(false);
  const startY = useRef(null); // phones: swipe the card down to dismiss it
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // one timer, not a re-render every tick (that made the card stutter): it pauses while you hover,
  // and the bar below runs as a CSS animation that pauses with it
  const left = useRef(SHOW_MS), since = useRef(0);
  useEffect(() => { left.current = SHOW_MS; setKept(false); }, [result]);
  useEffect(() => {
    if (!result || hover || kept) return;
    since.current = Date.now();
    const t = setTimeout(() => closeRef.current(), left.current);
    return () => { clearTimeout(t); left.current = Math.max(0, left.current - (Date.now() - since.current)); };
  }, [result, hover, kept]);
  if (!result) return null;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClickCapture={() => setKept(true)}
      onTouchStart={MOBILE ? (e) => { startY.current = e.touches[0].clientY; } : undefined}
      onTouchEnd={MOBILE ? (e) => { if (startY.current != null && e.changedTouches[0].clientY - startY.current > 60) onClose(); startY.current = null; } : undefined}
      style={MOBILE ? { position: "fixed", left: 10, right: 10, bottom: "calc(126px + env(safe-area-inset-bottom))", zIndex: 392, animation: "sheetUp .25s ease-out", boxShadow: "0 -10px 36px #000c", borderRadius: 18 } : { position: "fixed", bottom: 16, right: 16, width: "min(400px, calc(100% - 32px))", maxHeight: "50vh", overflowY: "auto", zIndex: 380, animation: "sheetUp .25s ease-out", boxShadow: "0 14px 44px #000d", borderRadius: 18 }}>
      <style>{"@keyframes wrBar{from{width:100%}to{width:0%}}"}</style>
      <Card {...props} />
      {!kept && <div style={{ position: "absolute", left: MOBILE ? 18 : 12, right: MOBILE ? 18 : 12, bottom: 1, height: 3, borderRadius: 2, background: "#ffffff14", overflow: "hidden", pointerEvents: "none" }}>
        <div key={String(result?.wk ?? "") + String(result?.round ?? "")} style={{ height: "100%", background: hover ? "#64748b" : "#94a3b8", animation: `wrBar ${SHOW_MS}ms linear forwards`, animationPlayState: hover ? "paused" : "running" }} />
      </div>}
    </div>
  );
}

// A final never seen in NFL history (or in this league before).
const Scorigami = ({ us, them, compact }) => (
  <div style={{ marginTop: compact ? 4 : 8, background: "linear-gradient(90deg,#7c3aed33,#db277733)", border: "1px solid #a855f72e", borderRadius: 8, padding: compact ? "3px 8px" : "6px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <b style={{fontSize: compact ? 13 : 15, color: "#e9d5ff" }}>Scorigami</b>
    <span style={{ fontSize: compact ? 12 : 13, color: "#ddd6fe" }}>{Math.max(us, them)}-{Math.min(us, them)} has never been a final score in NFL history</span>
  </div>
);

// Phones: every result is one card in the Home screen's style: a top line saying what happened,
// a scoreboard (or one big line), your star, and one action: tap the card (it closes as it opens
// the box score). Swipe down to dismiss.
function PhoneCard({ result, teams, ui, sgLog, yr, onClose, onBox, onPaper, onRecap }) {
  const me = teams[ui];
  let col = "#94a3b8", top, hint = null, tap = null, body, foot = null;
  const big = (t, sub) => <><div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15, marginTop: 6 }}>{t}</div>{sub && <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}</>;
  const Line = ({ t, pts, win, sub }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, opacity: win ? 1 : 0.55 }}>
      <TeamLogo t={t} sz={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
        {sub && <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{pts}</span>
    </div>
  );
  const g = result.game;
  if (result.season) {
    col = C.gd; top = "Regular season complete";
    body = big(`${me.name} ${fmtRec(me)}`, `${divPlace(teams, me)} · ${result.playoffs ? "Playoff bound" : "Missed the playoffs"}`);
    if (onRecap) { tap = onRecap; hint = "Recap ›"; }
  } else if (!g && result.playoff) {
    const champ = result.champ != null ? teams[result.champ] : null;
    const sb = champ && (result.others || []).find((x) => x.h === result.champ || x.a === result.champ);
    top = result.round;
    if (sb) {
      col = C.gd; top = "Super Bowl · Final"; tap = () => onBox(sb); hint = "Box score ›";
      const loser = teams[sb.h === result.champ ? sb.a : sb.h];
      body = <><Line t={champ} pts={sb.h === result.champ ? sb.hs : sb.as} win /><Line t={loser} pts={sb.h === result.champ ? sb.as : sb.hs} /></>;
    } else if (result.bye || champ || !(result.others || []).length) body = big(result.bye ? "First-round bye" : champ ? `The ${champ.name} win it all` : "Playoff results", result.bye ? "Rested and waiting on the next round" : null);
    else body = (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 8 }}>
        {result.others.map((x, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); onBox(x); onClose(); }} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 6, background: "transparent", border: 0, padding: "2px 0", color: "#fff", cursor: "pointer", fontSize: 15, textAlign: "left" }}>
            {[[x.a, x.as, x.as > x.hs], [x.h, x.hs, x.hs > x.as]].map(([id, pts, win]) => <React.Fragment key={id}><TeamLogo t={teams[id]} sz={20} /><span style={{ fontWeight: win ? 800 : 500, color: win ? "#fff" : "#64748b" }}>{teams[id]?.ab}</span><b style={{ color: win ? "#fff" : "#64748b", fontVariantNumeric: "tabular-nums" }}>{pts}</b></React.Fragment>)}
          </button>
        ))}
      </div>
    );
    if (result.bye) col = "#a78bfa";
  } else if (!g) {
    col = "#a78bfa"; top = `Week ${result.wk}`;
    body = big("Bye week", `${fmtRec(me)} · ${divPlace(teams, me)}`);
  } else {
    const home = g.h === ui, us = home ? g.hs : g.as, them = home ? g.as : g.hs;
    const outcome = us > them ? "Win" : us < them ? "Loss" : "Tie";
    const champs = result.playoff && result.champ === ui;
    col = champs ? C.gd : outcome === "Win" ? C.gn : outcome === "Loss" ? C.rd : C.gd;
    top = champs ? "Super Bowl champions" : result.playoff && outcome === "Loss" ? `Eliminated · ${result.round}` : `${outcome} · ${result.playoff ? result.round : `Week ${result.wk}`}`;
    tap = () => onBox(g); hint = "Box score ›";
    const away = teams[g.a], homeT = teams[g.h], mine = `${fmtRec(me)} · ${divPlace(teams, me)}`;
    body = <><Line t={away} pts={g.as} win={g.as >= g.hs} sub={!home ? mine : null} /><Line t={homeT} pts={g.hs} win={g.hs >= g.as} sub={home ? mine : null} /></>;
    const star = topLines(home ? g.boxH : g.boxA)[0];
    if (star || (result.paper && onPaper)) foot = (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 10, borderTop: "1px solid #ffffff14", fontSize: 13 }}>
        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#cbd5e1" }}>{star && <><b style={{ color: "#fff" }}>{star.name}</b> {star.line}</>}</span>
        {result.paper && onPaper && <button onClick={(e) => { e.stopPropagation(); onPaper(result.paper); onClose(); }} style={{ background: "transparent", border: 0, padding: 0, color: "#fcd34d", fontSize: 14, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Paper ›</button>}
      </div>
    );
    if (isScorigami(g, sgLog, yr)) foot = <>{foot}<Scorigami us={us} them={them} compact /></>;
  }
  return (
    <div onClick={tap ? () => { tap(); onClose(); } : undefined} role={tap ? "button" : undefined} style={{ background: `linear-gradient(135deg, ${col}30, #0f172a00 62%), #0f172a`, border: `1px solid ${col}55`, borderRadius: 18, padding: "8px 16px 14px", color: "#fff", cursor: tap ? "pointer" : "default" }}>
      {MOBILE ? <div style={{ display: "flex", justifyContent: "center", paddingBottom: 6 }}><span style={{ width: 36, height: 4, borderRadius: 2, background: "#ffffff33" }} /></div> : <div style={{ height: 6 }} />}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{top}</span>
        {hint && <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{hint}</span>}
        {!MOBILE && <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Dismiss result" style={{ marginLeft: hint ? 4 : "auto", background: "transparent", border: 0, color: "#64748b", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>}
      </div>
      {body}
      {foot}
    </div>
  );
}

function Card(props) {
  // computers use the same calm card (the old desk card is kept for a result with no team to show)
  if (props.result && props.teams[props.ui]) return <PhoneCard {...props} />;
  return <DeskCard {...props} />;
}

function DeskCard({ result, teams, ui, sched, sgLog, yr, onClose, onBox, onTeam, onPaper, onRecap }) {
  const [showOthers, setShowOthers] = useState(false);
  if (!result) return null;
  const me = teams[ui];
  if (!me) return null;
  const card = { background: "linear-gradient(135deg,#0f172a,#111827)", border: "1px solid #ffffff10", borderRadius: 12, padding: MOBILE ? "8px 10px" : "12px 14px", position: "relative" };
  const close = <button onClick={onClose} aria-label="Dismiss result" style={{ position: "absolute", top: 10, right: 12, background: "transparent", border: 0, color: C.mt, fontSize: 20, cursor: "pointer" }}>✕</button>;

  if (result.season) {
    return (
      <div style={{ ...card, borderColor: C.gd }}>
        {close}
        <div style={{fontSize: 13, fontWeight: 800, color: C.gd }}>Regular season complete</div>
        <div style={{ fontSize: MOBILE ? 22 : 34, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{me.city} {me.name} {fmtRec(me)}</div>
        <div style={{ fontSize: MOBILE ? 13 : 16, color: "#cbd5e1", marginTop: 4 }}>{divPlace(teams, me)} · {result.playoffs ? "Playoff bound!" : "Missed the playoffs"}</div>
        {onRecap && <Btn onClick={onRecap} bg={C.bd} c="#7dd3fc" style={{ fontSize: 13, padding: "6px 12px", marginTop: 8 }}>Season recap card</Btn>}
      </div>
    );
  }

  const g = result.game;
  if (!g && result.playoff) {
    const champ = result.champ != null ? teams[result.champ] : null;
    // the Super Bowl: a final scoreboard (the bracket below already names the champion)
    const sb = champ && (result.others || []).find((x) => x.h === result.champ || x.a === result.champ);
    if (sb) {
      const loser = teams[sb.h === result.champ ? sb.a : sb.h];
      const ws = sb.h === result.champ ? sb.hs : sb.as, ls = sb.h === result.champ ? sb.as : sb.hs;
      const side = (t, sc, win) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: win ? 1 : 0.6 }}>
          <TeamLogo t={t} sz={MOBILE ? 30 : 40} />
          <span style={{ fontSize: MOBILE ? 15 : 18, fontWeight: 800 }}>{t.city} {t.name}</span>
          <span style={{ fontSize: MOBILE ? 24 : 32, fontWeight: 900, color: win ? C.gd : C.mt, marginLeft: 4 }}>{sc}</span>
        </div>
      );
      return (
        <div style={{ ...card, borderColor: C.gd }}>
          {close}
          <div style={{fontSize: 13, fontWeight: 800, color: C.gd, marginBottom: 6 }}>Super Bowl · final</div>
          <div style={{ display: "flex", alignItems: "center", gap: MOBILE ? 10 : 22, flexWrap: "wrap" }}>
            {side(champ, ws, true)}<span style={{ color: C.mt, fontWeight: 800 }}>–</span>{side(loser, ls, false)}
            <Btn onClick={() => onBox(sb)} bg={C.bd} c="#7dd3fc" style={{ fontSize: 13, padding: "6px 12px", marginLeft: "auto" }}>Box score</Btn>
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...card, borderColor: champ ? C.gd : C.bd }}>
        {close}
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.mt }}>{result.round.toUpperCase()}</div>
        <div style={{ fontSize: MOBILE ? 20 : 30, fontWeight: 900, color: result.bye ? "#a78bfa" : "#cbd5e1" }}>{result.bye ? "FIRST-ROUND BYE" : champ ? `${champ.city} ${champ.name} win it all` : "Playoff results"}</div>
        {(result.others || []).length > 0 && <Others list={result.others} teams={teams} onBox={onBox} />}
      </div>
    );
  }
  if (!g) {
    return (
      <div style={card}>
        {close}
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.mt }}>WEEK {result.wk}</div>
        <div style={{ fontSize: MOBILE ? 20 : 32, fontWeight: 900, color: "#a78bfa" }}>BYE WEEK</div>
        <div style={{ fontSize: MOBILE ? 13 : 16, color: "#cbd5e1" }}>{fmtRec(me)} · {divPlace(teams, me)}</div>
      </div>
    );
  }
  const home = g.h === ui;
  const us = home ? g.hs : g.as, them = home ? g.as : g.hs;
  const opp = teams[home ? g.a : g.h];
  const outcome = us > them ? "WIN" : us < them ? "LOSS" : "TIE";
  const col = outcome === "WIN" ? C.gn : outcome === "LOSS" ? C.rd : C.gd;
  const stars = topLines(home ? g.boxH : g.boxA);
  const others = result.others || (sched || []).filter((x) => x.wk === result.wk && x.played && x !== g && x.h !== ui && x.a !== ui);
  const champs = result.playoff && result.champ === ui;
  const sg = isScorigami(g, sgLog, yr);
  const Side = ({ t, pts, win }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <TeamLogo t={t} sz={32} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.mt, whiteSpace: "nowrap" }}>{t.city}</div>
        <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: "nowrap" }}>{t.name}</div>
      </div>
      <span style={{ marginLeft: "auto", fontSize: 30, fontWeight: 900, color: win ? "#fff" : "#64748b", fontVariantNumeric: "tabular-nums" }}>{pts}</span>
    </div>
  );
  return (
    <div style={{ ...card, borderColor: col, boxShadow: `0 0 0 1px ${col}55, 0 10px 30px #0008` }}>
      {close}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.mt }}>{result.playoff ? result.round.toUpperCase() : `WEEK ${result.wk}`} · {result.round === "Super Bowl" && sbSite(yr) ? sbSite(yr).city.toUpperCase() : result.round === "Super Bowl" || g.neutral ? `NEUTRAL SITE${g.intl ? ` · ${(g.city || "").toUpperCase()}` : ""}` : home ? "HOME" : "AWAY"}</span>
        <span style={{ fontSize: 15, color: "#cbd5e1" }}>{fmtRec(me)} · {divPlace(teams, me)}</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
        <div style={{ fontSize: champs ? 28 : 36, fontWeight: 900, fontStyle: "italic", color: champs ? C.gd : col, lineHeight: 1, minWidth: 120 }}>{champs ? "SUPER BOWL CHAMPIONS" : result.playoff && outcome === "LOSS" ? "ELIMINATED" : outcome}</div>
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <Side t={me} pts={us} win={us >= them} />
          <Side t={opp} pts={them} win={them >= us} />
        </div>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.mt, marginBottom: 4 }}>{g.gd?.top ? "TOP PERFORMERS" : "YOUR STARS"}</div>
          {(g.gd?.top || stars).map((s) => <div key={s.name} style={{ fontSize: 14, padding: "1px 0" }}><b>{s.name}</b> <span style={{ color: C.mt, fontSize: 12 }}>{s.pos}{s.side ? ` · ${teams[s.side === "h" ? g.h : g.a]?.ab}` : ""}</span> <span style={{ color: "#cbd5e1" }}>{s.line}</span></div>)}
          {!(g.gd?.top || stars).length && <div style={{ color: C.mt }}>No standout performances.</div>}
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}><Btn onClick={() => onBox(g)} bg={C.bl} style={{ fontSize: 13 }}>{g.gd ? "Game recap & box score" : "Box score"}</Btn>{result.paper && onPaper && <Btn onClick={() => onPaper(result.paper)} bg="#d4a017" c="#111" style={{ fontSize: 13, fontWeight: 800 }}>Read the Gazette</Btn>}</div>
        </div>
      </div>
      {sg && <Scorigami us={us} them={them} />}
      {/* league scores a tap away (the win probability lives in the game recap) */}
      {others.length > 0 && <button onClick={() => setShowOthers((v) => !v)} style={{ marginTop: 8, background: "transparent", color: C.mt, border: "1px solid #ffffff10", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Scores around the league {showOthers ? "▴" : "▾"}</button>}
      {showOthers && <Others list={others} teams={teams} onBox={onBox} />}
    </div>
  );
}
