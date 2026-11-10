// The record book: every single-season and career record, who holds it (the NFL's mark until
// someone in your league beats it), the records your league has broken, and who's chasing one.
// One calm list of records, and beside it what's happening now: the chase and what has fallen.
import React, { useMemo, useState } from "react";
import { TeamLogo, Pills, card, cardTitle, fitH } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { RECORD_DEFS, recordWatch, recordValue } from "./records.js";
import { CAREER_DEFS, newCareerBook, careerChasers } from "./careerRecords.js";

const GOLD = "#fde68a";

export default function RecordBook({ book, teams, yr, inSeason, setSel, findPlayer }) {
  const [view, setView] = useState("season");
  const watch = inSeason ? recordWatch(book, teams, { margin: 0.9 }) : [];
  const career = { ...newCareerBook(), ...(book.career || {}) };
  const chase = useMemo(() => (view === "career" ? careerChasers(book, teams) : {}), [view, book, teams]);
  const byAb = (ab) => teams.find((t) => t.ab === ab);
  const open = (pid) => { const p = pid && findPlayer(pid); if (p) setSel(p); };
  const name = (pid, n) => <span onClick={(e) => { e.stopPropagation(); open(pid); }} style={{ fontWeight: 800, color: "#f8fafc", cursor: pid ? "pointer" : "default" }}>{n}</span>;

  // one record: what it is, who holds it (and from when), the mark; a mark set in your league is gold
  const Record = ({ k, label, r, sub }) => {
    const mine = !r.nfl;
    return (
      <div className="calm-row" onClick={() => open(r.pid)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 10px", cursor: r.pid ? "pointer" : "default" }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 800, letterSpacing: 0.3, color: "#94a3b8" }}>{label}{mine && <span style={{ color: GOLD }}> · set in your league</span>}</span>
          <span style={{ display: "block", fontSize: 15.5, lineHeight: 1.35 }}>{name(r.pid, r.name)} <span style={{ color: "#64748b" }}>{r.team}{r.nfl && r.yrs ? `, ${r.yrs}` : r.yr ? `, ${r.yr}` : ""}</span></span>
          {sub}
        </span>
        <span style={{ fontSize: 22, fontWeight: 900, color: mine ? GOLD : "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{recordValue(k, r.val)}</span>
      </div>
    );
  };
  const small = { display: "block", fontSize: 13, color: "#94a3b8", lineHeight: 1.4 };

  const records = view === "career"
    ? CAREER_DEFS.map((d) => { const r = career[d.key], c = chase[d.key]; return <Record key={d.key} k={d.key} label={d.label} r={r} sub={<>
        {!r.nfl && r.prev && <span style={small}>Passed {r.prev.name}'s {recordValue(d.key, r.prev.val)}</span>}
        {c && <span style={small}>Closest active: {name(c.pid, c.name)} {c.team} · <span style={{ color: c.v >= r.val * 0.85 ? "#fcd34d" : "#94a3b8" }}>{recordValue(d.key, r.val - c.v)} to go</span></span>}
      </>} />; })
    : RECORD_DEFS.map((d) => { const r = book.best[d.key]; return <Record key={d.key} k={d.key} label={d.label} r={r} sub={<>
        {!r.nfl && r.prev && <span style={small}>Broke {r.prev.name}'s {recordValue(d.key, r.prev.val)} ({r.prev.yr})</span>}
        {(r.ties || []).map((x, j) => <span key={j} style={{ ...small, color: "#fcd34d" }}>Tied by {name(x.pid, x.name)} {x.team}, {x.yr}</span>)}
      </>} />; });

  const watchCard = view === "season" && watch.length > 0 && (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...cardTitle, marginBottom: 6 }}>Record watch · {yr}</div>
      {watch.slice(0, 6).map((w) => (
        <div key={`${w.key}${w.pid}`} className="calm-row" onClick={() => open(w.pid)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", margin: "0 -8px", cursor: "pointer" }}>
          {byAb(w.team) && <TeamLogo t={byAb(w.team)} sz={24} glow />}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>{w.name}</span>
            <span style={small}>{w.label} · {recordValue(w.key, w.val)} so far · record {recordValue(w.key, w.record.val)}</span>
          </span>
          <span style={{ textAlign: "right" }}><b style={{ fontSize: 17, color: w.pace > w.record.val ? "#86efac" : "#fcd34d" }}>{recordValue(w.key, w.pace)}</b><span style={{ display: "block", fontSize: 12, color: "#64748b" }}>on pace</span></span>
        </div>
      ))}
    </div>
  );
  const fallen = (
    <div style={{ ...card, ...(MOBILE ? null : { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }) }}>
      <div style={{ ...cardTitle, marginBottom: 6 }}>Fallen in your league</div>
      <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
        {[...book.history].reverse().map((h, i) => (
          <div key={i} style={{ fontSize: 14.5, lineHeight: 1.45, padding: "7px 0", borderTop: i ? "1px solid #ffffff0d" : 0, color: "#cbd5e1" }}>
            <b style={{ color: "#64748b", marginRight: 8 }}>{h.yr}</b>{name(h.pid, h.name)} <span style={{ color: "#64748b" }}>{h.team}</span> {h.tie ? <>tied {h.prev.name}'s {h.label.toLowerCase()} record ({recordValue(h.key, h.val)})</> : <>took the {h.career ? "career " : ""}{h.label.toLowerCase()} record from {h.prev.name}: <b style={{ color: GOLD }}>{recordValue(h.key, h.val)}</b></>}
          </div>
        ))}
        {!book.history.length && <div style={{ fontSize: 14.5, color: "#94a3b8" }}>No records have fallen yet.</div>}
      </div>
    </div>
  );

  return (
    <div>
      {MOBILE && <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>Record Book</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Pills items={[["season", "Single season"], ["career", "Career"]]} value={view} onChange={setView} label="Records" />
        {!MOBILE && <span style={{ fontSize: 14, color: "#64748b" }}>Regular season. The NFL's marks stand until someone in your league beats them.</span>}
      </div>
      {MOBILE ? <>
        {watchCard}
        <div style={{ ...card, padding: "8px 8px", marginBottom: 14 }}>{records}</div>
        {fallen}
      </> : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 14, ...fitH }}>
          <div style={{ ...card, padding: "10px 10px", overflowY: "auto", minHeight: 0 }}>{records}</div>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>{watchCard}{fallen}</div>
        </div>
      )}
    </div>
  );
}
