// The record book: every single-season record, who holds it (the NFL's mark until someone in
// your league beats it), the records your league has broken, and who's chasing one right now.
import React from "react";
import { C, TeamLogo } from "./ui.jsx";
import { RECORD_DEFS, recordWatch, recordValue } from "./records.js";

export default function RecordBook({ book, teams, yr, inSeason, setSel, findPlayer }) {
  const watch = inSeason ? recordWatch(book, teams, { margin: 0.9 }) : [];
  const byAb = (ab) => teams.find((t) => t.ab === ab);
  const panel = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 14, marginBottom: 12 };
  const head = { fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#fcd34d", marginBottom: 10 };
  const open = (pid) => { const p = pid && findPlayer(pid); if (p) setSel(p); };
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ fontSize: 26, fontWeight: 900 }}>Record Book</div>
      <div style={{ fontSize: 14, color: C.mt, marginBottom: 12 }}>Single-season records, regular season only. The NFL's marks stand until someone in your league beats them.</div>
      {watch.length > 0 && (
        <div style={{ ...panel, borderColor: "#f59e0b88" }}>
          <div style={head}>📈 RECORD WATCH · {yr}</div>
          {watch.slice(0, 6).map((w) => (
            <div key={`${w.key}${w.pid}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.bd}66` }}>
              {byAb(w.team) && <TeamLogo t={byAb(w.team)} sz={26} />}
              <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}><b onClick={() => open(w.pid)} style={{ cursor: "pointer" }}>{w.name}</b> <span style={{ color: C.mt }}>· {w.label}</span></div>
              <div style={{ fontSize: 14, textAlign: "right" }}>{recordValue(w.key, w.val)} so far · on pace for <b style={{ color: w.pace > w.record.val ? C.gn : "#facc15" }}>{recordValue(w.key, w.pace)}</b> <span style={{ color: C.mt }}>(record {recordValue(w.key, w.record.val)})</span></div>
            </div>
          ))}
        </div>
      )}
      <div style={panel}>
        <div style={head}>SINGLE-SEASON RECORDS</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr>{["RECORD", "MARK", "HELD BY", "SEASON"].map((h) => <th key={h} style={{ textAlign: "left", fontSize: 12, color: C.mt, letterSpacing: 1, padding: "6px 4px", borderBottom: `1px solid ${C.bd}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {RECORD_DEFS.map((d) => {
                const r = book.best[d.key];
                const mine = !r.nfl;
                return (
                  <tr key={d.key} style={{ borderBottom: `1px solid ${C.bd}66`, background: mine ? "#22c55e10" : "transparent" }}>
                    <td style={{ padding: "9px 4px", fontWeight: 700 }}>{d.label}</td>
                    <td style={{ padding: "9px 4px", fontSize: 18, fontWeight: 900, color: mine ? C.gn : "#fff" }}>{recordValue(d.key, r.val)}</td>
                    <td style={{ padding: "9px 4px" }}>
                      <span onClick={() => open(r.pid)} style={{ fontWeight: 800, cursor: r.pid ? "pointer" : "default" }}>{r.name}</span> <span style={{ color: C.mt }}>({r.team})</span>
                      {mine && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 900, color: C.gn }}>SET IN YOUR LEAGUE</span>}
                      {mine && r.prev && <div style={{ fontSize: 12, color: C.mt }}>Broke {r.prev.name}'s {recordValue(d.key, r.prev.val)} ({r.prev.yr})</div>}
                    </td>
                    <td style={{ padding: "9px 4px", color: "#cbd5e1" }}>{r.yr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={panel}>
        <div style={head}>RECORDS BROKEN IN YOUR LEAGUE</div>
        {[...book.history].reverse().map((h, i) => (
          <div key={i} style={{ fontSize: 14, padding: "6px 0", borderBottom: `1px solid ${C.bd}66` }}>
            <b>{h.yr}</b> · <span onClick={() => open(h.pid)} style={{ fontWeight: 800, cursor: "pointer" }}>{h.name}</span> ({h.team}) took the {h.label.toLowerCase()} record from {h.prev.name} ({recordValue(h.key, h.prev.val)})
          </div>
        ))}
        {!book.history.length && <div style={{ fontSize: 14, color: C.mt }}>No records have fallen yet. When one does, it's written here.</div>}
      </div>
    </div>
  );
}
