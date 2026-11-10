// This week's matchup, with stakes: what the game means in the standings and the playoff race,
// how both teams are playing, a betting line, who's hurt, and the matchups that decide it.
import React, { useState } from "react";
import { C, TeamLogo } from "./ui.jsx";
import { nflSeeds } from "./playoffs.js";
import { injuryReport } from "./injuries.js";
import { h2hLine } from "./h2h.js";

const pct = (t) => (t.w + 0.5 * (t.t || 0)) / Math.max(1, t.w + t.l + (t.t || 0));
const better = (a, b) => pct(b) - pct(a) || (b.pf - b.pa) - (a.pf - a.pa);
const gb = (lead, t) => ((lead.w - t.w) + (t.l - lead.l)) / 2;
const fmtGb = (g) => (g === 0.5 ? "half a game" : `${g % 1 ? g : g.toFixed(0)} game${g === 1 ? "" : "s"}`);
const ord = (n) => ["1st", "2nd", "3rd", "4th"][n] || `${n + 1}th`;
const healthy = (t) => (t.roster || []).filter((p) => !p.injured && !p.holdout && !p.suspended);
const best = (t, pos) => healthy(t).filter((p) => pos.includes(p.pos)).sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0];

// The last few results for a team: ["W", "L", ...], oldest first.
function form(sched, ti, n = 3) {
  return sched.filter((g) => g.played && (g.h === ti || g.a === ti) && typeof g.wk === "number").sort((a, b) => a.wk - b.wk).slice(-n)
    .map((g) => { const us = g.h === ti ? g.hs : g.as, them = g.h === ti ? g.as : g.hs; return us > them ? "W" : us < them ? "L" : "T"; });
}
const streak = (f) => { if (!f.length) return ""; const l = f[f.length - 1]; let n = 0; for (let i = f.length - 1; i >= 0 && f[i] === l; i--) n++; return n >= 2 ? `${l}${n}` : ""; };

// What the game means for you: up to three short lines, most important first.
export function stakesLines({ teams, ui, opp, wk, playoff }) {
  const me = teams[ui], o = teams[opp];
  if (playoff) return [`Win or go home. The loser's season ends today.`];
  const lines = [];
  const div = teams.filter((t) => t.c === me.c && t.d === me.d).sort(better);
  const place = div.indexOf(me), lead = div[0];
  const played = me.w + me.l + (me.t || 0);
  const sameDiv = o.c === me.c && o.d === me.d;
  if (sameDiv) {
    const oPlace = div.indexOf(o);
    if (played === 0) lines.push(`Division game: an early edge in the ${me.c} ${me.d}.`);
    else if (place === 0 && oPlace === 1) lines.push(`First place in the ${me.c} ${me.d} is on the line: a win puts you ${fmtGb(gb(me, o) + 1)} clear.`);
    else if (oPlace === 0 && place > 0) lines.push(`They lead the ${me.c} ${me.d}${gb(o, me) ? ` by ${fmtGb(gb(o, me))}` : ""}. A win ${gb(o, me) - 1 <= 0 ? "pulls you level or better" : `cuts it to ${fmtGb(gb(o, me) - 1)}`}.`);
    else lines.push(`Division game: these count double in the ${me.c} ${me.d} race.`);
  } else if (played > 0) {
    lines.push(place === 0 ? `You lead the ${me.c} ${me.d}${div[1] && gb(me, div[1]) ? ` by ${fmtGb(gb(me, div[1]))}` : " (tied on record)"}.` : `${ord(place)} in the ${me.c} ${me.d}, ${fmtGb(gb(lead, me))} back of the ${lead.name}.`);
  }
  if (played >= 4) {
    const seeds = nflSeeds(teams, me.c), seed = seeds.indexOf(me.id ?? ui);
    if (seed >= 0) lines.push(`If the season ended today you'd be the #${seed + 1} seed${seed === 0 ? " with the only bye" : ""}.`);
    else {
      const seventh = teams[seeds[6]];
      const back = seventh ? gb(seventh, me) : 0;
      lines.push(wk >= 13 && back <= 2 ? `Must-win: ${fmtGb(back)} out of the last playoff spot with ${18 - wk} to play.` : `Outside the playoff picture, ${fmtGb(back)} behind the #7 seed.`);
    }
  }
  if (o.c !== me.c && !sameDiv && lines.length < 3) lines.push("Non-conference game: it won't touch most tiebreakers.");
  return lines.slice(0, 3);
}

// A Vegas-style point spread from the two teams' ratings (home field is worth 1.5).
export function pointSpread(ra, rh, neutral) {
  const s = (rh.ovr - ra.ovr) * 0.6 + (rh.off - ra.def + rh.def - ra.off) * 0.12 + (neutral ? 0 : 1.5);
  const r = Math.round(Math.abs(s) * 2) / 2;
  return { home: s >= 0, pts: r };
}

function Pill({ r }) {
  const c = r === "W" ? C.gn : r === "L" ? C.rd : C.gd;
  return <span style={{ display: "inline-block", width: 20, textAlign: "center", fontSize: 12, fontWeight: 900, borderRadius: 4, padding: "1px 0", background: `${c}33`, color: c, border: `1px solid ${c}66` }}>{r}</span>;
}

const SHOW_KEY = "gm_matchup_details";
export default function MatchupStakes({ teams, ui, game, sched, wk, ra, rh, playoff, neutral, h2h }) {
  // the details (form, line, injuries, key matchups) fold away; the choice is remembered
  const [more, setMore] = useState(() => { try { return localStorage.getItem(SHOW_KEY) === "1"; } catch { return false; } });
  const toggle = () => setMore((m) => { try { localStorage.setItem(SHOW_KEY, m ? "0" : "1"); } catch { /* private mode */ } return !m; });
  if (!game) return null;
  const home = teams[game.h], away = teams[game.a];
  const oppI = game.h === ui ? game.a : game.h, me = teams[ui], opp = teams[oppI];
  const series = h2hLine(h2h?.[oppI], opp?.name);
  const stakes = stakesLines({ teams, ui, opp: oppI, wk, playoff });
  const lines = [...stakes, ...(series ? [series] : [])];
  const line = ra && rh ? pointSpread(ra, rh, neutral) : null;
  const fav = line && (line.home ? home : away);
  const hurt = (t) => injuryReport(t, wk).filter((r) => ["OUT", "IR", "D"].includes(r.st.tag) && (r.p.ovr || 0) >= 72).slice(0, 3);
  const theirHurt = hurt(opp), myHurt = hurt(me);
  const keys = [];
  const myWr = best(me, ["WR", "TE"]), theirCb = best(opp, ["CB"]);
  if (myWr && theirCb) keys.push([myWr, theirCb, "Your top target vs their top corner"]);
  const theirRush = best(opp, ["EDGE", "DL", "DT"]), myLt = best(me, ["LT"]);
  if (theirRush && myLt) keys.push([myLt, theirRush, "Your left tackle vs their best rusher"]);
  const theirQb = best(opp, ["QB"]), mySafety = best(me, ["S", "CB"]);
  if (keys.length < 2 && theirQb && mySafety) keys.push([mySafety, theirQb, "Your secondary vs their QB"]);
  const box = { background: "#00000040", border: "1px solid #ffffff1a", borderRadius: 10, padding: "10px 12px", minWidth: 0 };
  const head = { fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "#94a3b8", marginBottom: 6 };
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {/* the stakes and the details toggle share one row */}
      <div style={{ ...box, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", ...(lines.length ? { border: `1px solid ${C.gd}55`, background: `${C.gd}12`, padding: "8px 12px" } : { background: "transparent", border: 0, padding: 0 }) }}>
        {lines.length > 0 && <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ ...head, color: C.gd, marginBottom: 2 }}>{stakes.length ? "WHAT'S AT STAKE" : "THE SERIES"}</div>
          {lines.map((l, i) => <div key={i} style={{ fontSize: i ? 13.5 : 15, fontWeight: i ? 600 : 800, color: i ? "#cbd5e1" : "#fff", lineHeight: 1.35 }}>{l}</div>)}
        </div>}
        <button onClick={toggle} title="Form, the line, injuries, key matchups" style={{ background: "#00000033", border: `1px solid #ffffff2a`, color: "#cbd5e1", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{more ? "▲ Less on this matchup" : "▼ More on this matchup"}</button>
      </div>
      {more && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
        <div style={box}>
          <div style={head}>FORM</div>
          {[away, home].map((t) => { const f = form(sched, teams.indexOf(t)); const s = streak(f); return (
            <div key={t.ab} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 3 }}>
              <TeamLogo t={t} sz={20} /><b style={{ width: 38 }}>{t.ab}</b>
              {f.length ? f.map((r, i) => <Pill key={i} r={r} />) : <span style={{ color: C.mt, fontSize: 13 }}>No games yet</span>}
              {s && <span style={{ fontSize: 12, color: C.mt, marginLeft: "auto" }}>{s}</span>}
            </div>
          ); })}
        </div>
        {line && (
          <div style={box}>
            <div style={head}>THE LINE</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{line.pts < 0.5 ? "PICK 'EM" : `${fav.ab} -${line.pts}`}</div>
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>{line.pts < 0.5 ? "Too close to call." : fav === me ? "You're favored." : `You're the underdog${line.pts >= 7 ? " by more than a touchdown" : ""}.`}</div>
          </div>
        )}
        <div style={box}>
          <div style={head}>INJURIES</div>
          {[[opp, theirHurt], [me, myHurt]].map(([t, list]) => (
            <div key={t.ab} style={{ fontSize: 13, marginBottom: 3, color: "#cbd5e1" }}>
              <b style={{ color: "#fff" }}>{t.ab}</b>{" "}
              {list.length ? list.map((r) => `${r.p.name.split(" ").slice(-1)[0]} (${r.p.pos}, ${r.st.tag})`).join(", ") : <span style={{ color: C.mt }}>no key players out</span>}
            </div>
          ))}
        </div>
      </div>
      {keys.length > 0 && (
        <div style={box}>
          <div style={head}>KEY MATCHUPS</div>
          {keys.map(([a, b, l]) => {
            const d = (a.ovr || 0) - (b.ovr || 0);
            return (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "3px 0", flexWrap: "wrap" }}>
                <span style={{ color: C.mt, fontSize: 12, flex: "1 1 100%" }}>{l}</span>
                <b>{a.name}</b><span style={{ color: C.mt }}>{a.pos} {a.ovr}</span>
                <span style={{ color: C.mt }}>vs</span>
                <b>{b.name}</b><span style={{ color: C.mt }}>{b.pos} {b.ovr}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 900, color: d >= 3 ? C.gn : d <= -3 ? C.rd : C.gd }}>{d >= 3 ? "EDGE: YOU" : d <= -3 ? `EDGE: ${opp.ab}` : "EVEN"}</span>
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}
