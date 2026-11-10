// The playoff bracket: each conference's Wild Card, Divisional and Championship rounds, and
// the Super Bowl in the middle. Played games show scores; the next round shows who's up.
import React, { useState } from "react";
import { C, Btn, TeamLogo } from "./ui.jsx";
import { ROUND_NAMES, seedLabel } from "./playoffs.js";
import { MOBILE } from "./mobile.js";
import { sbName, sbNumber } from "./data/superbowls.js";
import lombardi from "./assets/lombardi.webp";

// compact: the phone's narrow columns (logo, abbreviation, seed and score)
function Game({ teams, pb, g, ui, onBox, compact }) {
  if (!g) return <div style={{ border: "1px dashed #ffffff1f", borderRadius: 12, padding: compact ? "14px 6px" : "10px", color: C.mt, fontSize: compact ? 12 : 13, textAlign: "center" }}>TBD</div>;
  const played = g.hs != null;
  const row = (id, pts, home) => {
    const t = teams[id];
    const won = played && g.w === id, lost = played && g.w !== id;
    if (compact) return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 6px", opacity: lost ? 0.5 : 1 }}>
        <TeamLogo t={t} sz={20} />
        <b style={{ fontSize: 13.5, fontWeight: won ? 900 : 800, color: id === ui ? C.gn : "#fff" }}>{t.ab}</b>
        <span style={{ fontSize: 10.5, color: C.mt }}>{seedLabel(pb, id).split(" ")[1]}</span>
        {played && <b style={{ marginLeft: "auto", fontSize: 15, color: won ? "#fff" : C.mt }}>{pts}</b>}
      </div>
    );
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 8px", opacity: lost ? 0.5 : 1 }}>
        <TeamLogo t={t} sz={24} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: won ? 900 : 700, lineHeight: 1.2, color: id === ui ? C.gn : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
          <div style={{ fontSize: 10.5, color: C.mt, lineHeight: 1.2 }}>{seedLabel(pb, id).split(" ")[1]} · {t.w}-{t.l}{t.t ? `-${t.t}` : ""}{home && !played ? " · home" : ""}</div>
        </div>
        {played && <b style={{ fontSize: 18, color: won ? "#fff" : C.mt }}>{pts}</b>}
      </div>
    );
  };
  return (
    <div onClick={() => played && g.boxH && onBox(g)} style={{ background: "#ffffff0d", border: `1px solid ${g.h === ui || g.a === ui ? "#22c55e88" : "transparent"}`, borderRadius: 12, cursor: played && g.boxH ? "pointer" : "default" }}>
      {row(g.h, g.hs, true)}
      <div style={{ height: 1, background: C.bd }} />
      {row(g.a, g.as, false)}
    </div>
  );
}

// The Super Bowl's heading: the Lombardi Trophy over this year's numeral, in silver.
function SbHead({ yr, sz = 54 }) {
  const n = yr ? sbName(sbNumber(yr)).replace("Super Bowl ", "") : "";
  return (
    <div style={{ position: "relative", textAlign: "center", marginBottom: 8 }}>
      {/* a soft spotlight behind the trophy */}
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "46%", width: sz * 1.3, height: sz * 1.1, transform: "translate(-50%, -50%)", background: `radial-gradient(ellipse at center, ${C.gd}38, ${C.gd}10 45%, transparent 70%)`, pointerEvents: "none" }} />
      <img src={lombardi} alt="Super Bowl" style={{ position: "relative", height: sz, objectFit: "contain", filter: "drop-shadow(0 10px 18px #000c) drop-shadow(0 0 14px #fde68a33)" }} />
      {n && <div style={{ position: "relative", fontSize: Math.max(15, Math.round(sz * 0.15)), fontWeight: 900, letterSpacing: Math.max(2, Math.round(sz * 0.03)), lineHeight: 1.1, marginTop: 2, background: "linear-gradient(180deg,#ffffff,#cbd5e1 40%,#94a3b8 60%,#e2e8f0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 2px 3px #000a)" }}>{n}</div>}
    </div>
  );
}

// The phone's AFC / NFC switch over one conference's bracket.
function ConfBracket({ mineConf, render }) {
  const [c, setC] = useState(mineConf);
  return (
    <div>
      <div style={{ display: "flex", background: C.bg, border: "1px solid #ffffff10", borderRadius: 10, padding: 3, marginBottom: 10 }}>
        {["AFC", "NFC"].map((x) => <button key={x} onClick={() => setC(x)} style={{ flex: 1, border: 0, borderRadius: 8, padding: "8px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", background: c === x ? C.cd : "transparent", color: c === x ? "#fff" : C.mt }}>{x}</button>)}
      </div>
      {render(c)}
    </div>
  );
}

// yr: the season, for the Super Bowl's numeral
export default function PlayoffBracket({ pb, teams, ui, onBox, onSim, onPlay, title, yr, past }) {
  const conf = (id) => teams[id] && (pb.seeds.AFC.includes(id) ? "AFC" : "NFC");
  const games = (rd, c) => {
    const done = pb.res.filter((r) => r.rd === rd && (!c || conf(r.h) === c));
    if (done.length || pb.rd !== rd) return done;
    return pb.m.filter(([h]) => !c || conf(h) === c).map(([h, a]) => ({ h, a }));
  };
  const bye = (c) => {
    const t = teams[pb.seeds[c][0]];
    return <div style={{ fontSize: 13, color: "#cbd5e1", background: "#ffffff08", border: 0, borderRadius: 12, padding: "6px 10px" }}>#1 {t.city} {t.name} <span style={{ color: C.mt }}>· bye</span></div>;
  };
  const mine = pb.ch == null && pb.m.find(([h, a]) => h === ui || a === ui);
  const sb = games(4)[0];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: pb.ch != null ? C.gd : "#fff" }}>{pb.ch != null ? (past ? `Last season: the ${teams[pb.ch].city} ${teams[pb.ch].name} won the Super Bowl` : `${teams[pb.ch].city} ${teams[pb.ch].name} win the Super Bowl!`) : title || `Playoffs · ${ROUND_NAMES[pb.rd]}`}</div>
        {pb.ch == null && onSim && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {mine && <Btn onClick={() => onPlay(mine)} bg={C.gn} style={{ fontSize: 14, padding: "7px 14px" }}>▶ Play your {ROUND_NAMES[pb.rd]} game</Btn>}
            <Btn onClick={onSim} bg={C.gd} c="#000" style={{ fontSize: 14, padding: "7px 14px" }}>Sim {ROUND_NAMES[pb.rd]}</Btn>
          </span>
        )}
      </div>
      {!MOBILE && (() => {
        // desktop: a real bracket, AFC left to right, the Super Bowl in the middle, NFC right to left
        const stack = (title, list, n, extra, color) => (
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: color || "#cbd5e1", marginBottom: 8, textAlign: "center", whiteSpace: "nowrap" }}>{title}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 8 }}>
              {extra}
              {[...Array(n)].map((_, i) => <Game key={i} teams={teams} pb={pb} g={list[i]} ui={ui} onBox={onBox} />)}
            </div>
          </div>
        );
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) minmax(0,1.15fr) repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 4 }}>
              <div style={{ gridColumn: "1 / 4", fontSize: 16, fontWeight: 900, textAlign: "center", borderBottom: "1px solid #ffffff14", paddingBottom: 6 }}>AFC</div>
              <div />
              <div style={{ gridColumn: "5 / 8", fontSize: 16, fontWeight: 900, textAlign: "center", borderBottom: "1px solid #ffffff14", paddingBottom: 6 }}>NFC</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr)) minmax(0,1.15fr) repeat(3,minmax(0,1fr))", gap: 10, alignItems: "stretch", minHeight: 400 }}>
              {stack("Wild card", games(1, "AFC"), 3, bye("AFC"))}
              {stack("Divisional", games(2, "AFC"), 2)}
              {stack("Conference", games(3, "AFC"), 1)}
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                {/* a blank heading the height of the others, so the game lines up with the conference finals */}
                <div aria-hidden style={{ fontSize: 13, fontWeight: 900, marginBottom: 8, visibility: "hidden" }}>SUPER BOWL</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ position: "relative" }}><div style={{ position: "absolute", bottom: "100%", left: 0, right: 0 }}><SbHead yr={yr} sz={190} /></div></div>
                  <div style={{ border: `2px solid ${C.gd}`, borderRadius: 10, padding: 3, boxShadow: `0 0 18px ${C.gd}33` }}><Game teams={teams} pb={pb} g={sb} ui={ui} onBox={onBox} /></div>
                </div>
              </div>
              {stack("Conference", games(3, "NFC"), 1)}
              {stack("Divisional", games(2, "NFC"), 2)}
              {stack("Wild card", games(1, "NFC"), 3, bye("NFC"))}
            </div>
          </div>
        );
      })()}
      {MOBILE && (() => {
        // phone: the Super Bowl up top under the Lombardi, then one conference's bracket at a time
        // (yours first), its three rounds side by side like the desktop's
        const games3 = (title, list, n, extra) => (
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#cbd5e1", marginBottom: 6, textAlign: "center", whiteSpace: "nowrap" }}>{title}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 6 }}>
              {extra}
              {[...Array(n)].map((_, i) => <Game key={i} compact teams={teams} pb={pb} g={list[i]} ui={ui} onBox={onBox} />)}
            </div>
          </div>
        );
        const byeC = (c) => { const t = teams[pb.seeds[c][0]]; return <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#cbd5e1", background: "#ffffff08", border: 0, borderRadius: 12, padding: "5px 6px" }}><TeamLogo t={t} sz={18} /><b>{t.ab}</b><span style={{ color: C.mt }}>#1 · bye</span></div>; };
        return (
          <div>
            <div style={{ textAlign: "center", background: `radial-gradient(ellipse at 50% 0%, ${C.gd}22, transparent 70%)`, border: `1px solid ${C.gd}55`, borderRadius: 14, padding: "10px 12px 12px", marginBottom: 14 }}>
              <SbHead yr={yr} sz={58} />
              <div style={{ border: `2px solid ${C.gd}`, borderRadius: 10, padding: 3, boxShadow: `0 0 18px ${C.gd}33`, textAlign: "left" }}><Game teams={teams} pb={pb} g={sb} ui={ui} onBox={onBox} /></div>
            </div>
            <ConfBracket mineConf={conf(ui) || "AFC"} render={(c) => (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, minHeight: 330 }}>
                {games3("Wild card", games(1, c), 3, byeC(c))}
                {games3("Divisional", games(2, c), 2)}
                {games3("CONF. FINAL", games(3, c), 1)}
              </div>
            )} />
          </div>
        );
      })()}
    </div>
  );
}
