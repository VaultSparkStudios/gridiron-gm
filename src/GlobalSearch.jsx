// Search everything from anywhere: players (every roster, free agents, this year's draft class),
// teams and screens. Opened from the header's Search button or by pressing "/" (or Ctrl/Cmd+K).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { C, Bdg, TeamLogo, CloseX } from "./ui.jsx";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function GlobalSearch({ open, onClose, teams, ui, fa = [], prospects = [], screens = [], onPlayer, onTeam, onScreen }) {
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const inp = useRef(null);
  useEffect(() => { if (open) { setQ(""); setHi(0); setTimeout(() => inp.current?.focus(), 30); } }, [open]);
  const results = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const out = [];
    for (const s of screens) if (norm(s.label).includes(n)) out.push({ kind: "screen", key: `s-${s.tab}`, s });
    teams.forEach((t, ti) => { if (norm(`${t.city} ${t.name} ${t.ab}`).includes(n)) out.push({ kind: "team", key: `t-${ti}`, t, ti }); });
    const add = (p, where, ti) => { if (norm(p.name).includes(n)) out.push({ kind: "player", key: `p-${where}-${p.id}`, p, where, ti }); };
    teams.forEach((t, ti) => [...(t.roster || []), ...(t.ir || []), ...(t.ps || [])].forEach((p) => add(p, t.ab, ti)));
    fa.forEach((p) => add(p, "FA"));
    prospects.forEach((p) => add(p, "Draft"));
    // exact and starts-with matches first, your own players before others
    const score = (r) => { const nm = norm(r.kind === "player" ? r.p.name : r.kind === "team" ? `${r.t.city} ${r.t.name}` : r.s.label); return (nm.startsWith(n) || nm.split(" ").some((w) => w.startsWith(n)) ? 0 : 1) * 10 + (r.kind === "screen" ? 0 : r.kind === "team" ? 1 : r.ti === ui ? 2 : 3); };
    return out.sort((a, b) => score(a) - score(b)).slice(0, 12);
  }, [q, teams, fa, prospects, screens, ui]);
  if (!open) return null;
  const pick = (r) => { onClose(); if (r.kind === "player") onPlayer(r.p); else if (r.kind === "team") onTeam(r.ti); else onScreen(r.s.tab); };
  const key = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(results.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter" && results[hi]) pick(results[hi]);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3500, background: "rgba(0,0,0,.6)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "70px 12px 12px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(560px, 100%)", background: C.cd, border: "1px solid #ffffff10", borderRadius: 14, boxShadow: "0 20px 60px #000c", overflow: "hidden" }}>
        <CloseX onClick={onClose} style={{ top: 8, right: 8 }} />
        <input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} onKeyDown={key} placeholder="Search players, teams and screens…" aria-label="Search"
          style={{ width: "100%", boxSizing: "border-box", background: C.bg, color: C.tx, border: 0, borderBottom: `1px solid ${C.bd}`, padding: "16px 54px 16px 16px", fontSize: 18, outline: "none" }} />
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {q.trim().length < 2 && <div style={{ padding: 16, color: C.mt, fontSize: 14 }}>Type a name: any player in the league, a free agent, a draft prospect, a team, or a screen like "Front Office". Use ↑ ↓ and Enter.</div>}
          {q.trim().length >= 2 && !results.length && <div style={{ padding: 16, color: C.mt, fontSize: 14 }}>Nothing matches "{q}".</div>}
          {results.map((r, i) => (
            <div key={r.key} onMouseEnter={() => setHi(i)} onClick={() => pick(r)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", background: i === hi ? `${C.bl}26` : "transparent", borderLeft: `3px solid ${i === hi ? C.bl : "transparent"}` }}>
              {r.kind === "player" && <><Bdg pos={r.p.pos} /><b style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.p.name}</b><span style={{ fontSize: 13, color: C.mt }}>{r.where === "FA" ? "Free agent" : r.where === "Draft" ? "Draft prospect" : r.where}{r.p.ovr != null && r.where !== "Draft" ? ` · ${r.p.ovr} OVR` : ""}</span></>}
              {r.kind === "team" && <><TeamLogo t={r.t} sz={24} /><b style={{ flex: 1 }}>{r.t.city} {r.t.name}</b><span style={{ fontSize: 13, color: C.mt }}>{r.ti === ui ? "Your team" : "Team roster"}</span></>}
              {r.kind === "screen" && <><b style={{ flex: 1 }}>{r.s.label}</b><span style={{ fontSize: 13, color: C.mt }}>Screen</span></>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
