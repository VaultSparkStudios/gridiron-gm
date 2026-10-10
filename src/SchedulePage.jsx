// The schedule: your 17 games and bye week as one clean list, the playoff tree under it (live
// once the playoffs start, projected before), and every week's league games in a second tab.
import React, { useState } from "react";
import { C, Btn, TeamLogo, kickoff } from "./ui.jsx";
import PlayoffBracket from "./PlayoffBracket.jsx";
import { nflSeeds, makeBracket } from "./playoffs.js";

const rec = (t) => `${t.w}-${t.l}${t.t ? `-${t.t}` : ""}`;
const tabBtn = (on) => ({ background: on ? `${C.bl}33` : "transparent", color: on ? "#fff" : C.mt, border: `1px solid ${on ? C.bl : C.bd}`, padding: "8px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" });
const panel = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: 12, marginBottom: 12 };

function MySchedule({ g }) {
  const { sched, teams, ui, wk, sp, byeMap, onBox, onPlay, rivalId } = g;
  const me = teams[ui];
  const next = sp === "regular" ? sched.find((x) => !x.played && (x.h === ui || x.a === ui)) : null;
  const rows = Array.from({ length: 18 }, (_, i) => i + 1).map((week) => ({ week, game: sched.find((x) => x.wk === week && (x.h === ui || x.a === ui)) }));
  const td = { padding: "10px 8px", borderBottom: `1px solid ${C.bd}55`, fontSize: 16, verticalAlign: "middle" };
  return (
    <div style={panel}>
      <style>{"@media (max-width: 640px) { .sch-btn { display: none } .sch-t td { padding-left: 4px !important; padding-right: 4px !important; font-size: 15px !important } } @media (min-width: 641px) { .sch-show { display: none } }"}</style>
      <table className="sch-t" style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(({ week, game }) => {
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
                    <TeamLogo t={opp} sz={34} />
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
        <select value={week} onChange={(e) => setWeek(+e.target.value)} aria-label="Week" style={{ background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "8px 12px", fontSize: 16, fontWeight: 700 }}>
          {Array.from({ length: 18 }, (_, i) => <option key={i} value={i + 1}>Week {i + 1}</option>)}
        </select>
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

export default function SchedulePage(g) {
  const [view, setView] = useState("mine");
  const { teams, ui, pb, yr, extras, onBox } = g;
  const me = teams[ui];
  // Before the playoffs: the bracket as it would look if the season ended today.
  const projected = !pb?.seeds && teams.length >= 32 ? makeBracket(nflSeeds(teams, "AFC"), nflSeeds(teams, "NFC")) : null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px 18px", flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><TeamLogo t={me} sz={44} /><span style={{ fontSize: 24, fontWeight: 900 }}>{yr} Schedule</span></span>
        <span style={{ fontSize: 15, color: C.mt }}>Record <b style={{ fontSize: 20, color: "#fff" }}>{rec(me)}</b></span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button onClick={() => setView("mine")} style={tabBtn(view === "mine")}>{me.name} schedule</button>
        <button onClick={() => setView("league")} style={tabBtn(view === "league")}>League schedule</button>
      </div>
      {view === "mine" ? (
        <>
          <MySchedule g={g} />
          <div style={panel}>
            {pb?.seeds
              ? <PlayoffBracket pb={pb} teams={teams} ui={ui} onBox={onBox} />
              : projected && <PlayoffBracket pb={projected} teams={teams} ui={ui} onBox={onBox} title="Playoff picture · if the season ended today" />}
          </div>
          {extras}
        </>
      ) : <LeagueSchedule g={g} />}
    </div>
  );
}
