// The playoff bracket: each conference's Wild Card, Divisional and Championship rounds, and
// the Super Bowl in the middle. Played games show scores; the next round shows who's up.
import React from "react";
import { C, Btn, TeamLogo } from "./ui.jsx";
import { ROUND_NAMES, seedLabel } from "./playoffs.js";

function Game({ teams, pb, g, ui, onBox }) {
  if (!g) return <div style={{ border: `1px dashed ${C.bd}`, borderRadius: 8, padding: "10px", color: C.mt, fontSize: 13, textAlign: "center" }}>TBD</div>;
  const played = g.hs != null;
  const row = (id, pts, home) => {
    const t = teams[id];
    const won = played && g.w === id, lost = played && g.w !== id;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", opacity: lost ? 0.5 : 1 }}>
        <TeamLogo t={t} sz={30} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: won ? 900 : 700, color: id === ui ? C.gn : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
          <div style={{ fontSize: 11, color: C.mt }}>{seedLabel(pb, id).split(" ")[1]} · {t.w}-{t.l}{t.t ? `-${t.t}` : ""}{home && !played ? " · home" : ""}</div>
        </div>
        {played && <b style={{ fontSize: 20, color: won ? "#fff" : C.mt }}>{pts}</b>}
      </div>
    );
  };
  return (
    <div onClick={() => played && g.boxH && onBox(g)} style={{ background: C.cd, border: `1px solid ${g.h === ui || g.a === ui ? C.gn : C.bd}`, borderRadius: 8, cursor: played && g.boxH ? "pointer" : "default" }}>
      {row(g.h, g.hs, true)}
      <div style={{ height: 1, background: C.bd }} />
      {row(g.a, g.as, false)}
    </div>
  );
}

export default function PlayoffBracket({ pb, teams, ui, onBox, onSim, onPlay, title }) {
  const conf = (id) => teams[id] && (pb.seeds.AFC.includes(id) ? "AFC" : "NFC");
  const games = (rd, c) => {
    const done = pb.res.filter((r) => r.rd === rd && (!c || conf(r.h) === c));
    if (done.length || pb.rd !== rd) return done;
    return pb.m.filter(([h]) => !c || conf(h) === c).map(([h, a]) => ({ h, a }));
  };
  const col = (title, list, n, extra) => (
    <div style={{ flex: "1 1 200px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.mt }}>{title}</div>
      {extra}
      {[...Array(n)].map((_, i) => <Game key={i} teams={teams} pb={pb} g={list[i]} ui={ui} onBox={onBox} />)}
    </div>
  );
  const bye = (c) => {
    const t = teams[pb.seeds[c][0]];
    return <div style={{ fontSize: 13, color: "#cbd5e1", background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "6px 10px" }}>#1 {t.city} {t.name} <span style={{ color: C.mt }}>· bye</span></div>;
  };
  const mine = pb.ch == null && pb.m.find(([h, a]) => h === ui || a === ui);
  const sb = games(4)[0];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: pb.ch != null ? C.gd : "#fff" }}>{pb.ch != null ? `🏆 ${teams[pb.ch].city} ${teams[pb.ch].name} win the Super Bowl!` : title || `Playoffs · ${ROUND_NAMES[pb.rd]}`}</div>
        {pb.ch == null && onSim && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {mine && <Btn onClick={() => onPlay(mine)} bg={C.gn} style={{ fontSize: 14, padding: "7px 14px" }}>▶ Play your {ROUND_NAMES[pb.rd]} game</Btn>}
            <Btn onClick={onSim} bg={C.gd} c="#000" style={{ fontSize: 14, padding: "7px 14px" }}>Sim {ROUND_NAMES[pb.rd]}</Btn>
          </span>
        )}
      </div>
      {["AFC", "NFC"].map((c) => (
        <div key={c} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{c}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            {col("WILD CARD", games(1, c), 3, bye(c))}
            {col("DIVISIONAL", games(2, c), 2)}
            {col("CONFERENCE", games(3, c), 1)}
          </div>
        </div>
      ))}
      <div style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.gd, marginBottom: 8 }}>SUPER BOWL</div>
        <Game teams={teams} pb={pb} g={sb} ui={ui} onBox={onBox} />
      </div>
    </div>
  );
}
