// The League landing page: a short menu on the left, the week's games with every club's record in
// the middle, and the league leaders on the right (all on one screen, no scrolling). Phones: the
// leaders as cards you swipe, then the week's games one line each.
import React, { useMemo, useState } from "react";
import { C, Face, TeamLogo, Hero, Section, card, cardTitle } from "./ui.jsx";
import { posTag } from "./dline.js";

const LEADERS = [
  ["PASSING", (s) => s.passYds || 0, (p) => p.pos === "QB", [["CMP%", (s) => (s.att ? Math.round((100 * (s.comp || 0)) / s.att) : 0)], ["YDS", (s) => s.passYds || 0], ["TD", (s) => s.passTD || 0]]],
  ["RUSHING", (s) => s.rushYds || 0, () => true, [["ATT", (s) => s.rushAtt || 0], ["YDS", (s) => s.rushYds || 0], ["TD", (s) => s.rushTD || 0]]],
  ["RECEIVING", (s) => s.recYds || 0, () => true, [["REC", (s) => s.rec || 0], ["YDS", (s) => s.recYds || 0], ["TD", (s) => s.recTD || 0]]],
  ["SACKS", (s) => s.sacks || 0, () => true, [["POS", null], ["SCK", (s) => s.sacks || 0], ["TFL", (s) => s.tfl || 0]]],
  ["INTERCEPTIONS", (s) => (s.ints || 0) * 100 + (s.pd || 0), () => true, [["POS", null], ["INT", (s) => s.ints || 0], ["PD", (s) => s.pd || 0]]],
  ["TACKLES", (s) => (s.tkl || 0) + (s.ast || 0), () => true, [["POS", null], ["TKL", (s) => (s.tkl || 0) + (s.ast || 0)], ["TFL", (s) => s.tfl || 0]]],
];
const rec = (t) => `${t.w || 0}-${t.l || 0}${t.t ? `-${t.t}` : ""}`;
const short = (n) => { const a = String(n || "").split(" "); return a.length > 1 ? `${a[0][0]}. ${a.slice(1).join(" ")}` : n; };

export default function LeagueView({ teams, ui, sched, wk, sp, mobile, onPlayer, onTeam }) {
  const weeks = useMemo(() => [...new Set((sched || []).filter((g) => typeof g.wk === "number" && g.wk <= 18).map((g) => g.wk))].sort((a, b) => a - b), [sched]);
  // in season, the week coming up; otherwise the last week played (or week 1 before the season)
  const def = sp === "regular" ? Math.min(Math.max(wk + 1, 1), weeks[weeks.length - 1] || 18) : (sched || []).some((g) => g.played && g.wk <= 18) ? Math.max(...(sched || []).filter((g) => g.played && g.wk <= 18).map((g) => g.wk)) : weeks[0] || 1;
  const [w, setW] = useState(null);
  const week = w ?? def;
  const games = (sched || []).filter((g) => g.wk === week);
  const byes = teams.filter((t, i) => !games.some((g) => g.h === i || g.a === i)).map((t) => t.ab);
  const leaders = useMemo(() => {
    const all = [];
    teams.forEach((t, ti) => [...t.roster, ...(t.ir || [])].forEach((p) => { if (p.ss && (p.ss.gp || 0) > 0) all.push({ p, t, ti }); }));
    return LEADERS.map(([title, v, ok, cols]) => ({ title, cols, top: all.filter((x) => ok(x.p) && v(x.p.ss) > 0).sort((a, b) => v(b.p.ss) - v(a.p.ss)).slice(0, 3) }));
  }, [teams]);
  const panel = card;
  const head = cardTitle;
  const Side = ({ t, i, s, won }) => (
    <span onClick={() => onTeam?.(i)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 0, opacity: won === false ? 0.55 : 1 }}>
      <TeamLogo t={t} sz={mobile ? 26 : 30} glow />
      <span style={{ lineHeight: 1.1 }}>
        <b style={{ fontSize: 15, color: i === ui ? C.gn : "#fff" }}>{t.ab}</b>
        <span style={{ display: "block", fontSize: 13, color: C.mt }}>{rec(t)}</span>
      </span>
      {s != null && <b style={{ marginLeft: "auto", fontSize: 20, fontVariantNumeric: "tabular-nums", color: won ? "#fff" : "#94a3b8" }}>{s}</b>}
    </span>
  );
  if (mobile) return <PhoneLeague {...{ teams, ui, games, byes, week, weeks, setW, leaders, onPlayer, onTeam, sp }} />;
  // no sidebar: every one of its links is already a tab above or in the main bar
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(360px,1fr)", gap: 12, alignItems: "start" }}>
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={head}>Weekly schedule</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button aria-label="Previous week" disabled={week <= (weeks[0] || 1)} onClick={() => setW(Math.max(weeks[0] || 1, week - 1))} style={{ width: 32, height: 32, borderRadius: 16, background: "#ffffff0f", color: "#fff", border: 0, cursor: "pointer", fontSize: 16 }}>‹</button>
            <b style={{ fontSize: 15, minWidth: 70, textAlign: "center" }}>Week {week}</b>
            <button aria-label="Next week" disabled={week >= (weeks[weeks.length - 1] || 18)} onClick={() => setW(Math.min(weeks[weeks.length - 1] || 18, week + 1))} style={{ width: 32, height: 32, borderRadius: 16, background: "#ffffff0f", color: "#fff", border: 0, cursor: "pointer", fontSize: 16 }}>›</button>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 6 }}>
          {games.map((g, k) => {
            const A = teams[g.a], H = teams[g.h];
            const mine = g.h === ui || g.a === ui;
            return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, background: mine ? "#16a34a1a" : "#ffffff08", borderRadius: 14, padding: "8px 12px" }}>
                <Side t={A} i={g.a} s={g.played ? g.as : null} won={g.played ? g.as > g.hs : undefined} />
                <span style={{ fontSize: 12, color: C.mt, fontWeight: 800 }}>{g.played ? "FINAL" : "AT"}</span>
                <Side t={H} i={g.h} s={g.played ? g.hs : null} won={g.played ? g.hs > g.as : undefined} />
              </div>
            );
          })}
        </div>
        {!games.length && <div style={{ color: C.mt, fontSize: 14 }}>No games this week.</div>}
        {games.length > 0 && byes.length > 0 && <div style={{ fontSize: 12, color: C.mt, marginTop: 8 }}>Bye: {byes.join(", ")}</div>}
      </div>
      <div style={panel}>
        <div style={{ ...head, marginBottom: 6 }}>League leaders</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 22px" }}>
          {leaders.map((b) => (
            <div key={b.title} style={{ minWidth: 0 }}>
              <div style={{ display: "flex", fontSize: 12, fontWeight: 900, letterSpacing: 0.8, color: C.mt, paddingBottom: 4, marginBottom: 2 }}>
                <span style={{ flex: 1 }}>{b.title}</span>
                {b.cols.map(([l]) => <span key={l} style={{ width: 40, textAlign: "right" }}>{l}</span>)}
              </div>
              {b.top.map(({ p, t, ti }) => (
                <div key={p.id} className="calm-row" onClick={() => onPlayer?.(p)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", margin: "0 -6px", cursor: "pointer", fontSize: 14 }}>
                  <Face s={p.face} sz={30} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
                    <b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: ti === ui ? C.gn : "#f1f5f9" }}>{short(p.name)}</b>
                    <span style={{ display: "block", fontSize: 12, color: ti === ui ? C.gn : C.mt, fontWeight: 700 }}>{t.ab}</span>
                  </span>
                  {b.cols.map(([l, f]) => <span key={l} style={{ width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: l === "YDS" || l === "SCK" || l === "INT" || l === "TKL" ? 900 : 600, color: "#e2e8f0" }}>{f ? f(p.ss).toLocaleString() : posTag(p)}</span>)}
                </div>
              ))}
              {!b.top.length && <div style={{ fontSize: 12, color: C.mt, padding: "4px 0" }}>No games yet.</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MAIN = { PASSING: "YDS", RUSHING: "YDS", RECEIVING: "YDS", SACKS: "SCK", INTERCEPTIONS: "INT", TACKLES: "TKL" };
function PhoneLeague({ teams, ui, games, byes, week, weeks, setW, leaders, onPlayer, onTeam, sp }) {
  const shown = leaders.filter((b) => b.top.length);
  const arrow = (on, dir) => ({ width: 44, height: 44, borderRadius: 22, border: 0, background: on ? "#ffffff14" : "transparent", color: on ? "#fff" : "#334155", fontSize: 20, cursor: on ? "pointer" : "default" });
  const first = weeks[0] || 1, lastW = weeks[weeks.length - 1] || 18;
  const Team = ({ i, right, s, won }) => {
    const t = teams[i];
    return (
      <button onClick={() => onTeam?.(i)} style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: right ? "row-reverse" : "row", background: "transparent", border: 0, padding: 0, color: "#fff", cursor: "pointer", minWidth: 0, opacity: won === false ? 0.5 : 1 }}>
        <TeamLogo t={t} sz={28} />
        <b style={{ fontSize: 16, color: i === ui ? C.gn : "#fff" }}>{t.ab}</b>
        {s != null ? <b style={{ fontSize: 20, fontVariantNumeric: "tabular-nums", margin: right ? "0 6px 0 0" : "0 0 0 6px" }}>{s}</b> : <span style={{ fontSize: 14, color: C.mt }}>{rec(t)}</span>}
      </button>
    );
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)" }}>
      <Hero clr="#013369" eyebrow={sp === "regular" ? "This week" : "The league"} title={`Week ${week}`} sub={`${games.length} games${byes.length ? ` · ${byes.length} teams on a bye` : ""}`}
        right={<div style={{ display: "flex", gap: 8 }}><button aria-label="Previous week" disabled={week <= first} onClick={() => setW(Math.max(first, week - 1))} style={arrow(week > first)}>‹</button><button aria-label="Next week" disabled={week >= lastW} onClick={() => setW(Math.min(lastW, week + 1))} style={arrow(week < lastW)}>›</button></div>} />
      {shown.length > 0 && (
        <Section title="Leaders" style={{ marginTop: 18 }}>
          <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", scrollPaddingLeft: 8, margin: "0 -8px", padding: "0 8px 4px" }}>
            {shown.map((b) => { const col = b.cols.find(([l]) => l === MAIN[b.title]); return (
              <div key={b.title} style={{ flex: "0 0 80%", scrollSnapAlign: "start", background: "#ffffff0f", borderRadius: 18, padding: "12px 14px 6px" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: "#94a3b8", marginBottom: 4 }}>{b.title}</div>
                {b.top.map(({ p, t, ti }, k) => (
                  <button key={p.id} onClick={() => onPlayer?.(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 50, background: "transparent", border: 0, borderTop: k ? "1px solid #ffffff10" : 0, padding: 0, color: "#fff", cursor: "pointer", textAlign: "left" }}>
                    <Face s={p.face} sz={32} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: ti === ui ? C.gn : "#f1f5f9" }}>{short(p.name)}</span>
                      <span style={{ display: "block", fontSize: 12, color: C.mt }}>{t.ab} · {posTag(p)}</span>
                    </span>
                    <span style={{ textAlign: "right" }}>
                      <b style={{ display: "block", fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{col ? col[1](p.ss).toLocaleString() : ""}</b>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.mt }}>{col ? col[0] : ""}</span>
                    </span>
                  </button>
                ))}
              </div>
            ); })}
          </div>
        </Section>
      )}
      <Section title="Games">
        <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px" }}>
          {games.map((g, k) => {
            const mine = g.h === ui || g.a === ui;
            return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, minHeight: 52, borderTop: k ? "1px solid #ffffff10" : 0, background: mine ? "#16a34a1a" : "transparent", margin: mine ? "0 -14px" : 0, padding: mine ? "0 14px" : 0 }}>
                <Team i={g.a} s={g.played ? g.as : null} won={g.played ? g.as > g.hs : undefined} />
                <span style={{ fontSize: 11, color: C.mt, fontWeight: 800 }}>{g.played ? "FINAL" : "AT"}</span>
                <span style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}><Team i={g.h} right s={g.played ? g.hs : null} won={g.played ? g.hs > g.as : undefined} /></span>
              </div>
            );
          })}
          {!games.length && <div style={{ color: C.mt, fontSize: 14, padding: "14px 0" }}>No games this week.</div>}
        </div>
        {games.length > 0 && byes.length > 0 && <div style={{ fontSize: 14, color: C.mt, marginTop: 8, padding: "0 2px" }}>Bye: {byes.join(", ")}</div>}
      </Section>
    </div>
  );
}
