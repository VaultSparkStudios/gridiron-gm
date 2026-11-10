// The schedule: your 17 games and bye week (two columns on a computer), and every week's league
// games in a second tab. The playoff tree has its own tab.
import Select from "./Select.jsx";
import React, { useState } from "react";
import { C, Btn, TeamLogo, kickoff, Hero, Pills, Segments } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { HOLIDAYS } from "./holidays.js";
import { gameWeather, wxOf } from "./weather.js";

const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const panel = { background: "#ffffff0d", borderRadius: 18, padding: 14, marginBottom: 12 };

function MySchedule({ g }) {
  const { sched, teams, ui, wk, sp, byeMap, onBox, onPlay, rivalId } = g;
  const me = teams[ui];
  const next = sp === "regular" ? sched.find((x) => !x.played && (x.h === ui || x.a === ui)) : null;
  const rows = Array.from({ length: 18 }, (_, i) => i + 1).map((week) => ({ week, game: sched.find((x) => x.wk === week && (x.h === ui || x.a === ui)) }));
  const td = { padding: "7px 8px", borderBottom: `1px solid ${C.bd}55`, fontSize: 15, verticalAlign: "middle" };
  // desktop: weeks 1-9 and 10-18 side by side, so the whole season fits on one screen
  const halves = typeof window !== "undefined" && window.innerWidth >= 1000 ? [rows.slice(0, 9), rows.slice(9)] : [rows];
  return (
    <div style={panel}>
      <style>{"@media (max-width: 640px) { .sch-btn { display: none } .sch-t td { padding-left: 4px !important; padding-right: 4px !important; font-size: 15px !important } } @media (min-width: 641px) { .sch-show { display: none } }"}</style>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${halves.length}, minmax(0, 1fr))`, gap: 14 }}>
      {halves.map((half, hi) => (
      <table key={hi} className="sch-t" style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {half.map(({ week, game }) => {
            if (!game) {
              return (
                <tr key={week} style={{ background: "#7c3aed14" }}>
                  <td style={{ ...td, color: C.mt, fontWeight: 800, width: 64 }}>WK {week}</td>
                  <td style={{ ...td, color: "#a78bfa", fontWeight: 800 }} colSpan={3}>BYE WEEK</td>
                </tr>
              );
            }
            const home = game.h === ui;
            const opp = teams[home ? game.a : game.h];
            const us = home ? game.hs : game.as, them = home ? game.as : game.hs;
            const res = game.played ? (us > them ? ["W", C.gn] : us < them ? ["L", C.rd] : ["T", C.gd]) : null;
            const isNext = next && game === next;
            return (
              <tr key={week} onClick={() => game.played && (game.boxH || game.boxA) && onBox(game)} style={{ background: isNext ? `${C.gn}14` : "transparent", cursor: game.played ? "pointer" : "default" }}>
                <td style={{ ...td, color: isNext ? C.gn : C.mt, fontWeight: 800, width: 64, whiteSpace: "nowrap" }}>WK {week}</td>
                <td style={td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: C.mt, fontWeight: 700, width: 22 }}>{game.neutral ? "vs" : home ? "vs" : "@"}</span>
                    <TeamLogo t={opp} sz={28} />
                    <span>
                      <span style={{ fontWeight: 800 }}>{opp.city} {opp.name}</span>
                      <span style={{ display: "block", fontSize: 13, color: C.mt }}>
                        {rec(opp)}{opp.c === me.c && opp.d === me.d ? " · Division" : ""}{rivalId === opp.id ? " · Rival" : ""}{game.intl ? ` · ${game.city}` : ""}{!game.played && game.date ? ` · ${kickoff(game)}` : ""}
                      </span>
                    </span>
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  {res ? <span><b style={{ color: res[1], fontSize: 18 }}>{res[0]}</b> <span style={{ fontWeight: 700 }}>{us}-{them}</span></span>
                    : isNext ? <><span className="sch-btn" style={{ fontSize: 13, fontWeight: 800, color: C.gn, letterSpacing: 1 }}>NEXT GAME</span>{onPlay && <span className="sch-show"><Btn onClick={() => onPlay(game)} bg={C.gn} style={{ fontSize: 14, padding: "6px 10px" }}>▶ Play</Btn></span>}</> : null}
                </td>
                <td className="sch-btn" style={{ ...td, textAlign: "right", whiteSpace: "nowrap", width: 1 }} onClick={(e) => e.stopPropagation()}>
                  {game.played && (game.boxH || game.boxA) && <Btn onClick={() => onBox(game)} bg={C.bd} c="#e2e8f0" style={{ fontSize: 14, padding: "6px 12px" }}>Box score</Btn>}
                  {isNext && onPlay && <Btn onClick={() => onPlay(game)} bg={C.gn} style={{ fontSize: 14, padding: "6px 12px" }}>▶ Play live</Btn>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      ))}
      </div>
    </div>
  );
}

function LeagueSchedule({ g }) {
  const { sched, teams, ui, wk, onBox, onWatch, sp } = g;
  const [week, setWeek] = useState(Math.min(18, Math.max(1, wk + (sp === "regular" ? 1 : 0))));
  const games = sched.filter((x) => x.wk === week);
  const playing = new Set(games.flatMap((x) => [x.h, x.a]));
  const byes = teams.filter((t) => !playing.has(t.id));
  const side = (id, pts, won) => {
    const t = teams[id];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
        <TeamLogo t={t} sz={30} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: won ? 900 : 600, color: id === ui ? C.gn : won === false ? C.mt : "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.city} {t.name} <span style={{ fontSize: 13, color: C.mt, fontWeight: 400 }}>{rec(t)}</span></span>
        {pts != null && <b style={{ fontSize: 20, color: won ? "#fff" : C.mt }}>{pts}</b>}
      </div>
    );
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Btn onClick={() => setWeek((w) => Math.max(1, w - 1))} disabled={week <= 1} bg={C.bd} c="#e2e8f0" style={{ fontSize: 16, padding: "7px 14px" }}>‹</Btn>
        <Select value={week} onChange={(e) => setWeek(+e.target.value)} aria-label="Week" style={{ background: C.bg, color: C.tx, border: "1px solid #ffffff10", borderRadius: 6, padding: "8px 12px", fontSize: 16, fontWeight: 700 }}>
          {Array.from({ length: 18 }, (_, i) => <option key={i} value={i + 1}>Week {i + 1}</option>)}
        </Select>
        <Btn onClick={() => setWeek((w) => Math.min(18, w + 1))} disabled={week >= 18} bg={C.bd} c="#e2e8f0" style={{ fontSize: 16, padding: "7px 14px" }}>›</Btn>
        {byes.length > 0 && <span style={{ fontSize: 14, color: C.mt }}>Bye: {byes.map((t) => t.ab).join(", ")}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,330px),1fr))", gap: 10 }}>
        {games.map((x, i) => {
          const hw = x.played ? x.hs > x.as : null, aw = x.played ? x.as > x.hs : null;
          const mine = x.h === ui || x.a === ui;
          return (
            <div key={i} style={{ ...panel, marginBottom: 0, borderColor: mine ? C.gn : C.bd }}>
              {side(x.a, x.played ? x.as : null, aw)}
              {side(x.h, x.played ? x.hs : null, hw)}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: C.mt }}>
                <span>{x.played ? "FINAL" : x.date ? kickoff(x) : `@ ${teams[x.h].name}`}{x.intl ? ` · ${x.city}` : ""}</span>
                <span style={{ marginLeft: "auto" }}>
                  {x.played && (x.boxH || x.boxA) && <Btn onClick={() => onBox(x)} bg={C.bd} c="#e2e8f0" style={{ fontSize: 13, padding: "5px 10px" }}>Box score</Btn>}
                  {!x.played && !mine && sp === "regular" && week === wk + 1 && onWatch && <Btn onClick={() => onWatch(x)} bg={C.bd} c="#7dd3fc" style={{ fontSize: 13, padding: "5px 10px" }}>Watch</Btn>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Phones: a hero with the record, then the season as clean rows in one soft card (the week, who,
// when or the result; the next game has Play). Around the league is a tap away.
function PhoneSchedule({ g, view, setView }) {
  const { sched, teams, ui, yr, sp, wk, onBox, onPlay, onWatch, rivalId, extras } = g;
  const me = teams[ui];
  const [week, setWeek] = useState(Math.min(18, Math.max(1, wk + (sp === "regular" ? 1 : 0))));
  const next = sp === "regular" ? sched.find((x) => !x.played && (x.h === ui || x.a === ui)) : null;
  const card = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
  const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 50, textAlign: "left", background: "transparent", border: 0, padding: "5px 0", color: C.tx };
  const arrow = (on) => ({ width: 44, height: 44, borderRadius: 22, border: 0, background: on ? "#ffffff14" : "transparent", color: on ? "#fff" : "#334155", fontSize: 22, cursor: on ? "pointer" : "default" });
  return (
    <div>
      <Hero clr={me.clr} logo={me} eyebrow={`${yr} season`} title="Schedule" sub={next ? `Next: week ${next.wk} ${next.h === ui ? "vs" : "at"} ${teams[next.h === ui ? next.a : next.h].name}` : null}
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{rec(me)}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>RECORD</div></div>} />
      <div style={{ margin: "12px 0 10px" }}><Segments items={[["mine", "Your games"], ["league", "Around the league"]]} value={view} onChange={setView} /></div>
      {view === "mine" ? (<>
        <div style={card}>
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w, i) => {
            const game = sched.find((x) => x.wk === w && (x.h === ui || x.a === ui));
            const top = i ? "1px solid #ffffff10" : 0;
            if (!game) return <div key={w} style={{ ...row, minHeight: 38, borderTop: top }}><span style={{ width: 34, fontSize: 13, fontWeight: 900, color: C.mt }}>{w}</span><span style={{ fontSize: 15, fontWeight: 800, color: "#a78bfa" }}>Bye week</span></div>;
            const home = game.h === ui, opp = teams[home ? game.a : game.h];
            const us = home ? game.hs : game.as, them = home ? game.as : game.hs;
            const res = game.played ? (us > them ? ["W", C.gn] : us < them ? ["L", C.rd] : ["T", C.gd]) : null;
            const isNext = next && game === next;
            // a holiday game says so all season; the forecast only for the game coming up
            const hol = HOLIDAYS[game.holiday], wx = isNext ? wxOf(gameWeather(game, yr, teams[game.h]?.ab)) : null;
            const tags = [hol && `$${hol.short}`, wx && (wx.rain || wx.snow || wx.cold || wx.label === "Windy") && `$${wx.label}`, opp.c === me.c && opp.d === me.d && "Division", rivalId === opp.id && "Rival", game.intl && game.city].filter(Boolean).join(" · ");
            return (
              <button key={w} onClick={() => game.played && (game.boxH || game.boxA) && onBox(game)} style={{ ...row, borderTop: top, cursor: game.played ? "pointer" : "default", background: isNext ? `${C.gn}14` : "transparent", margin: isNext ? "0 -14px" : 0, padding: isNext ? "5px 14px" : "5px 0", width: isNext ? "calc(100% + 28px)" : "100%" }}>
                <span style={{ width: 34, fontSize: 13, fontWeight: 900, color: isNext ? C.gn : C.mt }}>{w}</span>
                <TeamLogo t={opp} sz={28} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span style={{ color: C.mt, fontWeight: 700 }}>{home || game.neutral ? "vs" : "@"}</span> {opp.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: C.mt, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[!game.played && game.date ? kickoff(game).replace(" ET", "") : rec(opp), tags].filter(Boolean).join(" · ")}</span>
                </span>
                {res ? <span style={{ whiteSpace: "nowrap", fontSize: 16 }}><b style={{ color: res[1] }}>{res[0]}</b> <b>{us}-{them}</b></span>
                  : isNext && onPlay ? <span onClick={(e) => { e.stopPropagation(); onPlay(game); }} style={{ background: C.gn, color: "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontWeight: 900 }}>Play</span> : null}
              </button>
            );
          })}
        </div>
        {extras}
      </>) : (() => {
        const games = sched.filter((x) => x.wk === week);
        const playing = new Set(games.flatMap((x) => [x.h, x.a]));
        const byes = teams.filter((t) => !playing.has(t.id));
        const side = (id, pts, won, right) => { const t = teams[id]; return <span style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: right ? "row-reverse" : "row", opacity: won === false ? 0.5 : 1, minWidth: 0 }}><TeamLogo t={t} sz={28} /><b style={{ fontSize: 16, color: id === ui ? C.gn : "#fff" }}>{t.ab}</b>{pts != null ? <b style={{ fontSize: 18, margin: right ? "0 6px 0 0" : "0 0 0 6px" }}>{pts}</b> : <span style={{ fontSize: 13, color: C.mt }}>{rec(t)}</span>}</span>; };
        return (<>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button aria-label="Previous week" disabled={week <= 1} onClick={() => setWeek((x) => Math.max(1, x - 1))} style={arrow(week > 1)}>‹</button>
            <span style={{ fontSize: 20, fontWeight: 900 }}>Week {week}</span>
            <button aria-label="Next week" disabled={week >= 18} onClick={() => setWeek((x) => Math.min(18, x + 1))} style={arrow(week < 18)}>›</button>
          </div>
          <div style={card}>
            {games.map((x, i) => { const mine = x.h === ui || x.a === ui; const canWatch = !x.played && !mine && sp === "regular" && week === wk + 1 && onWatch; return (
              <button key={i} onClick={() => (x.played && (x.boxH || x.boxA) ? onBox(x) : canWatch ? onWatch(x) : null)} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, width: "100%", minHeight: 54, background: mine ? "#16a34a1a" : "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: 0, color: "#fff", cursor: "pointer" }}>
                {side(x.a, x.played ? x.as : null, x.played ? x.as > x.hs : undefined)}
                <span style={{ fontSize: 11, fontWeight: 800, color: canWatch ? "#7dd3fc" : C.mt }}>{x.played ? "FINAL" : canWatch ? "WATCH" : "AT"}</span>
                <span style={{ display: "flex", justifyContent: "flex-end" }}>{side(x.h, x.played ? x.hs : null, x.played ? x.hs > x.as : undefined, true)}</span>
              </button>
            ); })}
          </div>
          {byes.length > 0 && <div style={{ fontSize: 13, color: C.mt, marginTop: 8 }}>Bye: {byes.map((t) => t.ab).join(", ")}</div>}
        </>);
      })()}
    </div>
  );
}

export default function SchedulePage(g) {
  const [view, setView] = useState("mine");
  const { teams, ui, yr, extras } = g;
  const me = teams[ui];
  if (MOBILE) return <PhoneSchedule g={g} view={view} setView={setView} />;
  return (
    <div>
      {/* the section header above has the season and record */}
      <Pills big items={[["mine", `${me.name} schedule`], ["league", "League schedule"]]} value={view} onChange={setView} label="Schedule" style={{ marginBottom: 12 }} />
      {view === "mine" ? (
        <>
          <MySchedule g={g} />
          {extras}
        </>
      ) : <LeagueSchedule g={g} />}
    </div>
  );
}
