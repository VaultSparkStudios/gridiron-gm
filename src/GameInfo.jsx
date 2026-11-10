// Game Updates: the patch notes, newest first, with a search box. Only the latest 15 show at
// first; older ones render when you open the dropdown (a search looks through all of them).
import React, { useState } from "react";
import { C, Hero } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { PATCH_NOTES } from "./patchNotes.js";

const RECENT = 15;
const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function GameInfo() {
  const [q, setQ] = useState("");
  const [older, setOlder] = useState(false);
  const all = [...PATCH_NOTES].reverse();
  const needle = q.trim().toLowerCase();
  const found = needle ? all.filter((p) => `${p.title} ${p.notes.join(" ")}`.toLowerCase().includes(needle)) : all;
  const shown = needle || older ? found : found.slice(0, RECENT);
  const hidden = found.length - shown.length;
  return (
    <div style={{ maxWidth: 900 }}>
      {MOBILE && <><Hero eyebrow={`Version ${all[0].v}`} title="Game Updates" sub="Every change, newest first" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patch notes" aria-label="Search patch notes" style={{ background: "#ffffff0f", color: C.tx, border: 0, borderRadius: 12, padding: "12px 14px", fontSize: 16, width: "100%", boxSizing: "border-box", margin: "16px 0 12px" }} /></>}
      <div style={{ display: MOBILE ? "none" : "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, color: C.mt }}>Patch notes: every change to Football GM, newest first. Current version {all[0].v}.</div>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patch notes" aria-label="Search patch notes"
          style={{ background: "#ffffff10", color: C.tx, border: 0, borderRadius: 999, padding: "9px 14px", fontSize: 14, minWidth: 0, width: 240, maxWidth: "100%" }} />
      </div>
      {shown.map((p, i) => (
        <div key={p.v} style={{ background: MOBILE ? "#ffffff0f" : "#ffffff0d", borderRadius: 18, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>v{p.v}</span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{p.title}</span>
            {!needle && i === 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#0b1220", background: "#4ade80", borderRadius: 999, padding: "2px 8px" }}>Latest</span>}
            <span style={{ marginLeft: "auto", fontSize: 12, color: C.mt }}>{fmtDate(p.date)}</span>
          </div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.5, color: "#cbd5e1" }}>
            {p.notes.map((n, j) => <li key={j}>{n}</li>)}
          </ul>
        </div>
      ))}
      {!needle && all.length > RECENT && (
        <button onClick={() => setOlder(!older)} style={{ width: "100%", background: "#ffffff0d", color: C.tx, border: 0, borderRadius: 18, padding: "14px 16px", fontSize: 15, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
          {older ? "Hide older updates" : `Older updates (${hidden})`}
        </button>
      )}
      {!shown.length && <div style={{ color: C.mt, fontSize: 14 }}>No patch notes match "{q}".</div>}
    </div>
  );
}
