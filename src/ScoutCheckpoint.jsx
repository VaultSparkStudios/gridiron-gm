// Twice a season the sim stops here, at the trade deadline and after the last regular-season week,
// but only when there's a call to make: your scouts meet on the pick you'd have if the season ended
// today, the way they will on draft day (draftScouts.js). Their five, each one's current overall and
// ceiling, where the board has him and how often he's still there at your pick, and what a report
// or a workup would settle. Board moves show only for players in your range. Mid-sim (simTo set)
// the sim only pauses: closing this, or scouting everyone it lists, picks it back up, and Stop the
// sim ends it where it is.
import React, { useEffect, useMemo, useRef } from "react";
import { C, Face, oC, CloseX, sheetWrap, sheetBox, SheetGrip, actBtn } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { prospectRead, csRank, potGrade, SCOUT_CHECKPOINTS } from "./scouting.js";
import { scoutsPicks, ovrText, currentOvr } from "./draftScouts.js";
import { posTag } from "./dline.js";
import { ScoutButton } from "./ScoutingUI.jsx";

const pct = (v) => `${Math.round(v * 100)}%`;
const tone = (v) => (v >= 0.65 ? "#94a3b8" : v <= 0.25 ? "#fca5a5" : "#fde68a");
const mini = { fontSize: 10, fontWeight: 900, letterSpacing: 0.8, color: "#64748b" };

// the five your scouts would bring for your pick if the draft were today (null if you have no pick)
export function checkpointRoom(g) {
  const cls = g.dc?.[g.yr] || [];
  const picks = (g.draftPicks || []).filter((pk) => pk.yr == null || pk.yr === g.yr).sort((a, b) => a.overall - b.overall);
  const at = picks.findIndex((pk) => pk.owner === g.ui);
  if (at < 0 || !cls.length) return null;
  try { return scoutsPicks({ sc: g.scouting, teams: g.teams, ui: g.ui, picks, pool: cls, at, now: 0, likely: true }); } catch (e) { console.error(e); return null; }
}
// what a report would settle on him: is there one, can you afford it
const needsWork = (sc, p) => prospectRead(sc, p).lvl < 2;

export default function ScoutCheckpoint({ g, wk, news = [], targetIds = [], onOpen, onClose, simTo, onStop }) {
  const sc = g.scouting || {};
  const pts = sc.pts || 0, last = wk >= SCOUT_CHECKPOINTS[SCOUT_CHECKPOINTS.length - 1];
  const room = useMemo(() => checkpointRoom(g), [g.yr, g.ui, wk]); // eslint-disable-line react-hooks/exhaustive-deps
  const five = room?.five || [];
  // your projected pick; the odds of lasting to it only mean something when someone picks before you
  const pk = room?.mine, odds = !!room?.upAt;
  const cls = g.dc?.[g.yr] || [];
  const byId = new Map(cls.map((p) => [p.id, p]));
  const moved = new Map(news.map((n) => [n.pid, n]));
  // others your scouts want a look at: near your pick, not in the five
  const inFive = new Set(five.map((x) => x.p.id));
  const others = targetIds.map((id) => byId.get(id)).filter((p) => p && !inFive.has(p.id)).slice(0, 2);
  // board moves in your range only (the rest are in the log)
  const nearMoves = news.filter((n) => !inFive.has(n.pid) && !others.some((o) => o.id === n.pid) && pk && Math.abs(n.to - pk.overall) <= 20).slice(0, 3);
  // the five were worked out when this opened; scouting saves a new copy of each player, so read the current one
  const fresh = (p) => byId.get(p.id) || p;
  const listed = [...five.map((x) => fresh(x.p)), ...others];
  const allDone = listed.length > 0 && listed.every((p) => !needsWork(sc, p));
  const startedDone = useRef(allDone);
  useEffect(() => {
    if (!simTo || !allDone || startedDone.current) return;
    const t = setTimeout(onClose, 1200);
    return () => clearTimeout(t);
  }, [allDone, simTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = (p) => {
    const r = prospectRead(sc, p), m = moved.get(p.id);
    const read = r.lvl === 0 ? "No report yet" : r.lvl === 1 ? "Report filed; a workup makes it exact" : "Worked up";
    if (MOBILE) return <>{posTag(p)} · {r.lvl === 0 ? "No report" : r.lvl === 1 ? "Report" : "Workup"}{m ? <span style={{ color: m.dir > 0 ? "#86efac" : "#fca5a5" }}> · {m.dir > 0 ? "up" : "down"} to #{m.to}</span> : null}</>;
    return <>{read}{m ? <span style={{ color: m.dir > 0 ? "#86efac" : "#fca5a5" }}> · {m.dir > 0 ? "Up" : "Down"} #{m.from} to #{m.to}: real or hype?</span> : null}</>;
  };
  const row = (p, x, i) => {
    const r = prospectRead(sc, p), cur = currentOvr(sc, p);
    return (
      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: MOBILE ? 10 : 14, padding: "8px 0", borderTop: i ? "1px solid #ffffff0a" : 0 }}>
        <Face s={p.face} sz={MOBILE ? 34 : 36} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}{!MOBILE && <span style={{ fontSize: 12.5, fontWeight: 600, color: "#94a3b8" }}> {posTag(p)} · {p.bio?.college}</span>}</span>
          <span style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginTop: 1, whiteSpace: MOBILE ? "nowrap" : undefined, overflow: "hidden", textOverflow: "ellipsis" }}>{status(p)}</span>
        </span>
        {x && <span style={{ width: MOBILE ? 52 : 70, textAlign: "center" }}><b style={{ display: "block", fontSize: 15, color: cur.kind === "estimate" ? "#e2e8f0" : oC(cur.v) }}>{ovrText(cur)}</b><span style={mini}>NOW</span></span>}
        {x && !MOBILE && <span style={{ width: 44, textAlign: "center" }}><b style={{ display: "block", fontSize: 15 }}>{potGrade(x.ceil)}</b><span style={mini}>CEIL.</span></span>}
        {x && !MOBILE && <span style={{ width: 44, textAlign: "center" }}><b style={{ display: "block", fontSize: 15 }}>#{csRank(p)}</b><span style={mini}>BOARD</span></span>}
        {x && pk && odds && <span style={{ width: MOBILE ? 44 : 60, textAlign: "center" }}><b style={{ display: "block", fontSize: 15, color: tone(x.there) }}>{pct(x.there)}</b><span style={mini}>AT #{pk.overall}</span></span>}
        <span style={{ width: MOBILE ? 78 : 92, textAlign: "right" }}><ScoutButton g={g} p={p} read={r} small /></span>
      </div>
    );
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.86)", zIndex: 2200, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, ...sheetWrap(MOBILE) }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Scouting check-in" style={{ position: "relative", width: "100%", maxWidth: 780, maxHeight: "92vh", overflowY: "auto", borderRadius: 22, background: "#0d1424", boxShadow: "0 30px 80px #000c", padding: MOBILE ? "10px 14px 14px" : "18px 20px 16px", color: C.tx, fontFamily: C.f, ...sheetBox(MOBILE) }}>
        {MOBILE && <SheetGrip onClose={onClose} />}
        <CloseX onClick={onClose} />
        <div style={{ paddingRight: 44, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.6, color: "#94a3b8" }}>{last ? "END OF THE SEASON" : "TRADE DEADLINE"} · SCOUTING CHECK-IN</div>
          <div style={{ fontSize: MOBILE ? 19 : 21, fontWeight: 900, marginTop: 2 }}>{pk ? `Your scouts on pick #${pk.overall}` : "Your scouts are back from the road"}</div>
          <div style={{ fontSize: 13.5, color: "#cbd5e1", marginTop: 3, lineHeight: 1.45 }}>
            {pk ? "Where you'd pick if the season ended today, and who they'd bring you for it. " : ""}
            <b style={{ color: pts ? C.gd : "#94a3b8" }}>{pts} point{pts === 1 ? "" : "s"}</b> to spend{last && pts ? <span style={{ color: "#fdba74" }}>; they expire when the playoffs end</span> : ""}.
          </div>
          {simTo && <div style={{ fontSize: 12.5, color: "#7dd3fc", marginTop: 4 }}>{allDone && !startedDone.current ? "All scouted. Back to the sim." : `The sim is paused and carries on to week ${simTo} when you're done.`}</div>}
        </div>

        {five.length > 0 && <div style={{ background: "#ffffff08", borderRadius: 16, padding: "6px 14px", marginBottom: 10 }}>
          {five.map((x, i) => row(fresh(x.p), x, i))}
        </div>}
        {others.length > 0 && <>
          <div style={{ ...mini, fontSize: 11, margin: "8px 4px 2px" }}>THEY ALSO WANT EYES ON</div>
          <div style={{ background: "#ffffff08", borderRadius: 16, padding: "2px 14px", marginBottom: 10 }}>{others.map((p, i) => row(p, null, i))}</div>
        </>}
        {nearMoves.length > 0 && <div style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 4px 10px", lineHeight: 1.5 }}>
          <b style={{ color: "#cbd5e1" }}>Moving near your pick: </b>
          {nearMoves.map((n, i) => <span key={n.pid}>{i ? " · " : ""}{n.name} ({n.pos}) <span style={{ color: n.dir > 0 ? "#86efac" : "#fca5a5" }}>#{n.from} to #{n.to}</span></span>)}
        </div>}

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {simTo && onStop && <button onClick={onStop} style={actBtn("#fca5a5")}>Stop the sim</button>}
          <button onClick={onOpen} style={{ ...actBtn(), marginLeft: "auto" }}>Open scouting</button>
          <button onClick={onClose} style={actBtn("#22c55e", true)}>{simTo ? "Keep simming" : "Back to the season"}</button>
        </div>
      </div>
    </div>
  );
}
