// The live game's broadcast drive tracker: the play-by-play grouped into drives (who had it, how
// many plays and yards, how long, how it ended), with the current drive on top.
import React from "react";
import { C, TeamLogo } from "./ui.jsx";
import { drivesOf } from "./drives.js";

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

// One line under the field: the current drive so far.
export function DriveStrip({ log, team, mobile }) {
  const ds = drivesOf(log);
  const d = ds[ds.length - 1];
  if (!d || d.over) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: mobile ? 13 : 14, color: "#cbd5e1", padding: "6px 2px" }}>
      {team && <TeamLogo t={team} sz={18} />}
      <b style={{ color: "#fff" }}>Drive</b>
      <span>{d.plays.length} play{d.plays.length === 1 ? "" : "s"}</span><span style={{ color: C.mt }}>·</span>
      <span>{d.yds} yd{Math.abs(d.yds) === 1 ? "" : "s"}</span><span style={{ color: C.mt }}>·</span>
      <span>{mmss(d.t1 - d.t0)}</span>
    </div>
  );
}

// The feed: drives newest first. The current drive is open and shows its plays; finished drives
// are one line each and open on tap.
export function DriveFeed({ log, teams, userSide, max = 40 }) {
  const ds = drivesOf(log).slice(-max).reverse();
  const [open, setOpen] = React.useState(null);
  if (!ds.length) return <div style={{ fontSize: 14, color: C.mt, padding: "6px 2px" }}>{(log || []).length ? log[log.length - 1].text : "Waiting for kickoff."}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {ds.map((d, i) => {
        const live = i === 0 && !d.over, show = live || open === d.t0 + d.poss;
        const t = teams[d.poss], mine = d.poss === userSide;
        return (
          <div key={`${d.t0}${d.poss}`} style={{ background: live ? "#ffffff12" : "#ffffff0a", borderRadius: 12, padding: "8px 10px", boxShadow: mine ? "inset 3px 0 0 #22c55e" : "none" }}>
            <div onClick={() => !live && setOpen(show ? null : d.t0 + d.poss)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: live ? "default" : "pointer" }}>
              {t && <TeamLogo t={t} sz={20} />}
              <b style={{ fontSize: 14 }}>{t?.ab}</b>
              <span style={{ fontSize: 13, color: "#94a3b8", flex: 1, minWidth: 0, whiteSpace: "nowrap" }}>{d.plays.length} play{d.plays.length === 1 ? "" : "s"} · {d.yds} yds · {mmss(d.t1 - d.t0)}</span>
              {live ? <span style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8" }}>ON THE FIELD</span>
                : d.result && <span style={{ fontSize: 12, fontWeight: 800, color: d.result[1] }}>{d.result[0]}</span>}
            </div>
            {show && <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              {[...d.plays].reverse().map((e, k) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.35, color: e.type === "td" ? "#86efac" : e.type === "int" || e.type === "fumble" ? "#fca5a5" : "#cbd5e1" }}>
                  <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums", marginRight: 6 }}>{e.qtr === "OT" ? "OT" : `Q${e.qtr}`} {mmss(e.clock ?? 0)}</span>{e.text}{e.by && <span style={{ color: "#64748b" }}> ({e.by.join(", ")})</span>}
                </div>
              ))}
            </div>}
          </div>
        );
      })}
    </div>
  );
}
