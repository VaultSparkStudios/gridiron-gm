// The front of the player card: his render in his team's uniform, his ESPN photo beside his name,
// the OVR ring, his six best ratings and his season in numbers. Flip turns it over to the full card
// (the back). A team without art yet shows his photo large instead.
import React, { useEffect, useMemo, useState } from "react";
import { C, oC, Face, TeamLogo } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import PlayerArt from "./PlayerArt.jsx";
import { jerseyNum } from "./playerArt.js";
import { BLOCK, FONT_CSS } from "./Spotlight.jsx";
import { OvrRing, COLS, loadRealSeasons, realPast } from "./PlayerCard.jsx";
import { olLine, OL_POS } from "./olStats.js";
import { gradesOf, gradeWord, gradeColor, FACETS } from "./grades.js";
import { DevBadge, topRatings } from "./ScoutingUI.jsx";
import { learningFrom } from "./mentor.js";
import { careerStanding } from "./careerRecords.js";
import { recordValue } from "./records.js";
import { posTag } from "./dline.js";

const ht = (i) => (i ? `${Math.floor(i / 12)}'${i % 12}"` : "");
const GROUP = { LT: "OL", LG: "OL", C: "OL", RG: "OL", RT: "OL", OL: "OL", EDGE: "DL", DT: "DL" };
const num = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString("en-US") : v.toFixed(1)) : v);

// his season in numbers: this season if he has played, else his last one (in your league, or his
// last real NFL season before it began)
function seasonTiles(p, yr, real) {
  const past = realPast(p, real).slice(-1)[0];
  const cur = p.ss?.gp ? { ...p.ss, y: yr } : (p.sh || []).slice(-1)[0] || (past && { ...past, y: `${past.y} NFL` });
  if (!cur) return { y: null, tiles: [] };
  // a lineman: what he allowed and how he graded
  if (OL_POS.has(p.pos)) {
    const o = olLine(cur, p.pos);
    if (!o) return { y: cur.y, tiles: cur.gs ? [["GS", cur.gs]] : [] };
    return { y: cur.y, ol: o, cur, tiles: [["GS", cur.gs || 0], ["SK ALW", o.sacks], ["PRES", o.pres], ["PB WIN", o.pbPct != null ? `${o.pbPct}%` : "–"], ["PASS GR", o.passGrade ?? "–"], ["RUN GR", o.runGrade ?? "–"]] };
  }
  const cols = COLS[GROUP[p.pos] || p.pos] || [];
  const tiles = [["GP", cur.gp], ["GS", cur.gs], ...cols.filter(([l]) => l !== "GRADE").map(([l, k]) => [l, typeof k === "function" ? k(cur) : cur[k]])].filter(([, v]) => v != null);
  return { y: cur.y, tiles: tiles.slice(-6), cur };
}

// team: { ab, clr, ac, city, name } or null (a free agent). dev: his trait if known. onFlip: show the back.
// lastTeam: a free agent's last club; he's drawn in its uniform (his look as last seen).
// league: every player in the league (for where his career ranks all-time).
export default function CardFront({ p, team, lastTeam, ovr, pot, dev, label, yr, onFlip, league }) {
  const kit = team || lastTeam, clr = kit?.clr || "#334155", jn = jerseyNum(p);
  const [real, setReal] = useState(null);
  useEffect(() => { if (p?.src === "m27" && !p.ss?.gp && !p.sh?.length) loadRealSeasons().then(setReal).catch(() => {}); }, [p?.src, p?.ss?.gp, p?.sh?.length]);
  const { y, tiles, ol, cur } = seasonTiles(p, yr, real);
  const grade = gradesOf(cur, p.pos);   // his own play, graded against the league (grades.js)
  const rat = topRatings(p, 6);
  const career = useMemo(() => careerStanding(p, league || []), [p, league]);
  const artW = MOBILE ? 176 : 255;
  const photo = <div style={{ borderRadius: "50%", padding: 2, background: `linear-gradient(135deg, ${kit?.ac || "#94a3b8"}, ${clr})`, flexShrink: 0 }}><Face s={p.face} sz={MOBILE ? 46 : 58} /></div>;
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.bd}`, background: "#0b1220", animation: "cfIn .4s ease-out" }}>
      <style>{FONT_CSS + "@keyframes cfIn{from{opacity:0;transform:perspective(900px) rotateY(-70deg)}to{opacity:1;transform:none}}"}</style>
      {/* the top: who he is, and him */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: MOBILE ? 230 : 340, background: `radial-gradient(ellipse at 78% 40%, ${clr}cc, transparent 62%), linear-gradient(135deg, ${clr}55, #0b1220 70%)` }}>
        {jn != null && <div aria-hidden style={{ position: "absolute", right: MOBILE ? 6 : 60, top: -10, fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 200 : 320, lineHeight: 1, color: "#ffffff0c", pointerEvents: "none" }}>{jn}</div>}
        <div style={{ position: "absolute", right: MOBILE ? -6 : 40, bottom: 0 }}>
          <PlayerArt p={p} ab={kit?.ab} width={artW} crop={MOBILE ? 0.7 : 0.75} style={{ filter: `drop-shadow(0 0 30px ${clr}66) drop-shadow(0 16px 20px #000b)` }} fallback={null} />
        </div>
        <div style={{ position: "relative", padding: MOBILE ? "16px 14px" : "22px 26px", maxWidth: MOBILE ? "62%" : "56%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: MOBILE ? 10.5 : 12.5, fontWeight: 900, letterSpacing: MOBILE ? 1.2 : 2, color: "#cbd5e1", textTransform: "uppercase" }}>
            {team && <TeamLogo t={team} sz={MOBILE ? 22 : 30} />}<span>{label || (team ? `${team.city} ${team.name}` : "Free agent")} · {posTag(p)}{jn != null ? ` · #${jn}` : ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: MOBILE ? 10 : 14, marginTop: MOBILE ? 8 : 12 }}>
            {photo}
            <div style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 32 : 50, lineHeight: 0.98, textTransform: "uppercase", color: "#fff", minWidth: 0 }}>{p.name}</div>
          </div>
          <div style={{ fontSize: MOBILE ? 12.5 : 15, color: "#cbd5e1", marginTop: 8 }}>{[p.age && `Age ${p.age}`, p.ht_ && `${ht(p.ht_)} ${p.wt} lbs`, p.bio?.college || p.college].filter(Boolean).join(" · ")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {p.xf && <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999, border: "1px solid #8a6d1d", color: "#fde68a", background: "#f5c54214" }}>{p.xf}</span>}
            {(p.injured || p.hurt) && <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 9px", borderRadius: 999, background: p.injured ? "#7f1d1d" : "#78350f", color: p.injured ? "#fecaca" : "#fde68a" }}>{p.injured ? `OUT · ${String(p.injType || "Injury").replace(/ \(.*\)$/, "")} · ${p.injWk > 0 ? `${p.injWk} wk${p.injWk === 1 ? "" : "s"}` : "day to day"}${p.irWk ? " · IR" : ""}` : `PLAYING HURT · ${p.hurt.type || "injury"}`}</span>}
            {p.contract > 0 && !p.retiredYr && <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999, border: `1px solid ${C.bd}`, color: "#e2e8f0" }}>Contract: {p.contract} yr{p.contract === 1 ? "" : "s"}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: MOBILE ? 10 : 14 }}>
            <OvrRing ovr={ovr} size={MOBILE ? 64 : 80} />
            <div style={{ fontSize: MOBILE ? 12.5 : 14, color: "#cbd5e1", lineHeight: 1.5 }}>
              {/* his development trait, big: what matters most about a young player */}
              {!p.retiredYr && <div style={{ marginBottom: 6 }}><DevBadge dev={dev} size={MOBILE ? "md" : "lg"} hint="Development trait unknown: only known for your own players, free agents and prospects your scouts fully worked up." /></div>}
              {pot != null && <div>POT <b style={{ color: oC(pot) }}>{pot}</b></div>}
              {/* a young QB learning the position behind a veteran (mentor.js) */}
              {!p.retiredYr && (() => { const m = learningFrom(p, team?.roster, yr); const done = p.mentored?.yrs > 0; return m || done ? <div title="A young quarterback who sits behind a veteran starter learns his reads, decisions and pocket feel, and his ceiling rises." style={{ color: "#fcd34d" }}>{m ? `Learning behind ${m.name}` : `Learned behind ${p.mentored.by.join(" and ")}`}{done ? ` · ${p.mentored.yrs} season${p.mentored.yrs === 1 ? "" : "s"}` : ""}</div> : null; })()}
              {y && ol && <div>{y}: {ol.sacks} sack{ol.sacks === 1 ? "" : "s"} allowed · {ol.pres} pressures{ol.passGrade != null ? ` · ${ol.passGrade} pass grade` : ""}</div>}
              {!MOBILE && y && !ol && tiles.length > 0 && <div>{y}: {tiles.slice(-3).map(([l, v]) => `${num(v)} ${l.toLowerCase()}`).join(" · ")}</div>}
              {/* his grade: how well he played, not how good the team around him is */}
              {grade && <div title="Graded play by play against an average player in the same spot (same teammates, line, coverage and call): how well he played, not how good his team is." style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 22 : 26, lineHeight: 1, color: gradeColor(grade.overall) }}>{grade.overall.toFixed(1)}</span>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#cbd5e1", textTransform: "uppercase" }}>{y} grade · {gradeWord(grade.overall)}</span>
                {Object.keys(grade.facets).length > 1 && <span style={{ fontSize: 12, color: "#94a3b8" }}>{Object.entries(grade.facets).map(([f, v]) => `${FACETS[f]} ${v.toFixed(1)}`).join(" · ")}</span>}
              </div>}
            </div>
          </div>
        </div>
      </div>
      {/* his NFL career: the real one (before your league too), and where it ranks all-time */}
      {/* a first-year career is just this season: phones show it once, in the season numbers below */}
      {career.length > 0 && !(MOBILE && career.every((c) => !c.rank && tiles.some(([, v]) => v === c.val))) && <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: MOBILE ? 12 : 26, padding: MOBILE ? "10px 14px" : "11px 26px", borderTop: `1px solid ${C.bd}`, background: "#0e172b" }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.8, color: "#fcd34d", lineHeight: 1.2 }}>NFL<br />CAREER</div>
        {career.map((c) => (
          <div key={c.key} style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: BLOCK, fontWeight: 700, fontSize: MOBILE ? 22 : 26, color: "#fff", lineHeight: 1 }}>{recordValue(c.key, c.val)}</span>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}>{c.label}</span>
              {c.rank && <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.8, padding: "1px 7px", borderRadius: 999, color: c.rank <= 10 ? "#1c1206" : "#e2e8f0", background: c.rank <= 10 ? "linear-gradient(90deg,#fbbf24,#fde68a)" : "#334155" }}>#{c.rank} ALL-TIME</span>}
            </div>
            {/* the chase: the man he passes next, or (closing in on the list) how far he has to go; a young career just shows its numbers */}
            {(c.rank || c.toList <= c.val / 3) && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{c.rank === 1 ? "The most in NFL history" : c.next ? `Next: ${c.next.name} (${recordValue(c.key, c.next.v)})` : `${recordValue(c.key, c.toList)} from the all-time top 25`}</div>}
          </div>
        ))}
      </div>}
      {/* the bottom: his best ratings and his season */}
      <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: MOBILE ? 14 : 28, padding: MOBILE ? "14px" : "16px 26px", borderTop: `1px solid ${C.bd}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {rat.map(([l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ width: MOBILE ? 92 : 110, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: "#1e293b" }}><div style={{ width: `${Math.max(4, v)}%`, height: "100%", borderRadius: 4, background: oC(v) }} /></div>
              <b style={{ width: 26, textAlign: "right", color: "#e2e8f0" }}>{v}</b>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${MOBILE ? Math.min(5, Math.max(3, tiles.length)) : 3}, 1fr)`, gap: MOBILE ? 6 : 10, alignContent: "center" }}>
          {tiles.map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: MOBILE ? 19 : 24, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{num(v)}</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#64748b" }}>{l}</div>
            </div>
          ))}
          {!tiles.length && <div style={{ gridColumn: "1 / -1", textAlign: "center", color: C.mt, fontSize: 13 }}>No games played yet.</div>}
          {y && tiles.length > 0 && <div style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 11, color: "#64748b" }}>{y} season</div>}
        </div>
      </div>
      <button onClick={onFlip} style={{ display: "block", width: "100%", background: "#111a2e", color: "#93c5fd", border: 0, borderTop: `1px solid ${C.bd}`, padding: "11px 0", fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: "pointer" }}>↻ FLIP FOR THE FULL CARD</button>
    </div>
  );
}
