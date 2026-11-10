// The coaching screen on a computer, in three calm views: your staff (and the schemes they run),
// the coaches you can hire, and who coaches where around the league. Each coach is one card: face,
// name, what he does, his rating; the money and years in one quiet line; actions quiet until you
// hover. Phones have their own screen (PhoneCoaching.jsx).
import React, { useState } from "react";
import { C, Face, oC, OverflowMenu, TeamLogo, Pills, actBtn, card, cardTitle, fitH } from "./ui.jsx";

const ROLE = { HC: "Head coach", OC: "Offensive coordinator", DC: "Defensive coordinator", ST: "Special teams" };
const SHORT = { HC: "Head coach", OC: "Offense", DC: "Defense", ST: "Special teams" };
const pill = actBtn();

export default function CoachingDesk({ staff, yr, scPts, coachAge, hcTrait, hcStyle, hcNote, hcExtOk, coy = [], hotSeat = [], faCoaches = [], cap, teams, ui, gamePlan, roster = [], onUpgrade, onExtend, onFire, onHire, onMeeting }) {
  const [view, setView] = useState("staff");
  const [role, setRole] = useState("ALL");
  const [lkr, setLkr] = useState(false);
  const meta = (c) => [c.role !== "HC" && `$${c.salary}M`, `${c.contract || "?"} yr${c.contract === 1 ? "" : "s"} left`, `age ${coachAge(c, yr)}`].filter(Boolean).join(" · ");

  const Coach = ({ c, r, wide }) => {
    if (!c) return (
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 14, border: "1px dashed #ffffff26", background: "transparent" }}>
        <span style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{ROLE[r]}</b><span style={{ display: "block", fontSize: 14, color: "#94a3b8", marginTop: 2 }}>Vacant</span></span>
        <button onClick={() => { setRole(r); setView("hire"); }} style={{ ...pill, background: C.gn, color: "#fff" }}>Hire</button>
      </div>
    );
    const hot = hotSeat.includes(r), t = r === "HC" ? hcTrait(c) : null, xp = (c.xp || 0) % 20, leaving = r === "HC" && hcNote;
    const line = r === "HC" ? [c.trait, hcStyle(c)].filter(Boolean).join(" · ") : [c.scheme, c.trait].filter(Boolean).join(" · ");
    return (
      <div className="calm-card" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Face s={c.face} coach={c.name} sz={wide ? 52 : 44} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 900, letterSpacing: 1.1, color: "#94a3b8" }}>{SHORT[r].toUpperCase()}{hot && <span style={{ color: "#fca5a5" }}> · HOT SEAT</span>}{coy.length > 0 && r === "HC" && <span style={{ color: "#fcd34d" }}> · COACH OF THE YEAR {coy.length > 1 ? `×${coy.length}` : coy[0]}</span>}</span>
            <span style={{ display: "block", fontSize: wide ? 20 : 17, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
            <span title={t?.desc || (r === "HC" ? "Game-day style: how often he goes for it on 4th down and tries for two" : undefined)} style={{ display: "block", fontSize: 14, color: "#94a3b8", lineHeight: 1.35 }}>{line}</span>
          </span>
          <span style={{ textAlign: "right" }}><span style={{ display: "block", fontSize: wide ? 30 : 26, fontWeight: 900, color: oC(c.rating), lineHeight: 1 }}>{c.rating}</span><span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: 1 }}>RATING</span></span>
        </div>
        {wide && t && <div style={{ fontSize: 14, color: "#cbd5e1" }}>{t.desc}</div>}
        {leaving && <div style={{ fontSize: 14, color: "#fde68a" }}>{hcNote}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: (c.contract || 0) <= 1 ? "#fca5a5" : "#94a3b8", flex: 1 }}>{meta(c)}</span>
          {r !== "HC" && <span title="A win is 3 XP, a loss 1. Every 20 XP: +1 rating." style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 54, height: 4, borderRadius: 2, background: "#ffffff14", overflow: "hidden" }}><span style={{ display: "block", width: `${(xp / 20) * 100}%`, height: "100%", background: "#38bdf8" }} /></span><span style={{ fontSize: 12, color: "#64748b" }}>{xp}/20</span></span>}
        </div>
        <div className="calm-act" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {r !== "HC" && <button onClick={() => onUpgrade(r)} disabled={scPts < 2 || c.rating >= 95} title="+5 rating" style={{ ...pill, opacity: scPts < 2 || c.rating >= 95 ? 0.45 : 1 }}>Upgrade · 2 SP</button>}
          {(r !== "HC" || hcExtOk) && <button onClick={() => onExtend(r)} disabled={scPts < 1} style={{ ...pill, opacity: scPts < 1 ? 0.45 : 1 }}>Extend</button>}
          <span style={{ marginLeft: "auto" }}><OverflowMenu label={`More for ${c.name}`} items={[{ label: `Fire ${c.name}`, danger: true, confirm: `Fire ${ROLE[r].toLowerCase()} ${c.name}? He goes into the coaching pool, where any club can hire him.`, onClick: () => onFire(r) }]} /></span>
        </div>
      </div>
    );
  };

  const pool = [...faCoaches].filter((c) => role === "ALL" || c.role === role).sort((a, b) => ["HC", "OC", "DC", "ST"].indexOf(a.role) - ["HC", "OC", "DC", "ST"].indexOf(b.role) || (b.rating || 0) - (a.rating || 0));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Pills items={[["staff", "Your staff"], ["hire", `Hire${faCoaches.length ? ` · ${faCoaches.length}` : ""}`], ["league", "League staffs"]]} value={view} onChange={setView} label="Coaching" />
        {view === "staff" && <span style={{ fontSize: 14, color: "#64748b" }}>A better head coach is worth up to a point a game; coordinators run your schemes.</span>}
      </div>

      {view === "staff" && <>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) repeat(3,minmax(0,1fr))", gap: 12, alignItems: "stretch" }}>
          <Coach c={staff.hc} r="HC" wide />
          <Coach c={staff.oc} r="OC" />
          <Coach c={staff.dc} r="DC" />
          <Coach c={staff.st} r="ST" />
        </div>
        <div style={{ marginTop: 14 }}>{gamePlan}</div>
        <div style={{ ...card, marginTop: 14, padding: "12px 18px" }}>
          <div onClick={() => setLkr((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>Locker room <span style={{ color: "#64748b", fontWeight: 600 }}>· player confidence</span></span>
            <button onClick={(e) => { e.stopPropagation(); onMeeting(); }} disabled={scPts < 1} style={{ ...pill, opacity: scPts < 1 ? 0.45 : 1 }} title="Every player's confidence +5">Team meeting · 1 SP</button>
            <span style={{ color: "#64748b" }}>{lkr ? "▴" : "▾"}</span>
          </div>
          {lkr && <div style={{ columns: 3, columnGap: 24, marginTop: 10 }}>
            {[...roster].sort((a, b) => (a.conf || 60) - (b.conf || 60)).map((p) => { const v = p.conf || 60, c = v >= 60 ? "#86efac" : v >= 40 ? "#fcd34d" : "#fca5a5"; return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", breakInside: "avoid" }}>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>{p.name}</span>
                <span style={{ width: 60, height: 4, borderRadius: 2, background: "#ffffff14", overflow: "hidden" }}><span style={{ display: "block", width: `${v}%`, height: "100%", background: c }} /></span>
                <b style={{ width: 24, textAlign: "right", color: c }}>{v}</b>
              </div>
            ); })}
          </div>}
        </div>
      </>}

      {view === "hire" && (
        <div style={{ ...card, ...fitH, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ ...cardTitle, flex: 1 }}>Coaches available</span>
            <Pills items={[["ALL", "All"], ["HC", "Head coach"], ["OC", "OC"], ["DC", "DC"], ["ST", "ST"]]} value={role} onChange={setRole} label="Job" />
          </div>
          <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -8px" }}>
            {pool.map((c) => { const afford = c.role === "HC" || cap >= (c.salary || 0); const sub = [ROLE[c.role], c.role === "HC" ? hcStyle(c) : c.scheme, c.trait, (c.fired || c.expired) && c.from && `${c.fired ? "fired by" : "let go by"} ${c.from}`].filter(Boolean).join(" · "); return (
              <div key={c.id} className="calm-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 10px", borderRadius: 14 }}>
                <Face s={c.face} coach={c.name} sz={40} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>{c.name}{c.real && <span style={{ fontSize: 12, color: "#86efac", fontWeight: 800 }}> · real coach</span>}</span>
                  <span title={c.role === "HC" ? hcTrait(c)?.desc : undefined} style={{ display: "block", fontSize: 13.5, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
                </span>
                <span style={{ width: 90, textAlign: "right", fontSize: 14, color: afford ? "#cbd5e1" : "#fca5a5" }} title={c.role === "HC" ? "Head coaches aren't paid out of the player cap" : undefined}>{c.role === "HC" ? "off the cap" : `$${c.salary}M`}</span>
                <span style={{ width: 44, textAlign: "right", fontSize: 20, fontWeight: 900, color: oC(c.rating) }}>{c.rating}</span>
                <button onClick={() => onHire(c)} disabled={!afford} style={{ ...pill, width: 72, background: afford ? C.gn : "#ffffff0f", color: afford ? "#fff" : "#64748b" }}>Hire</button>
              </div>
            ); })}
            {!pool.length && <div style={{ fontSize: 15, color: "#94a3b8", padding: 10 }}>No coaches available{role !== "ALL" ? " for that job" : ""}. New ones appear every off-season, along with anyone fired or let go.</div>}
          </div>
        </div>
      )}

      {view === "league" && (
        <div style={{ ...card, ...fitH, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 14, padding: "0 10px 8px", fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#64748b" }}><span style={{ width: 150 }}>TEAM</span><span style={{ flex: 1 }}>HEAD COACH</span><span style={{ flex: 1 }}>OFFENSE</span><span style={{ flex: 1 }}>DEFENSE</span></div>
          <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
            {teams.map((t, i) => { const cell = (c) => c ? <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}><Face s={c.face} coach={c.name} sz={24} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>{c.name}</span><b style={{ color: oC(c.rating), fontSize: 13 }}>{c.rating}</b></span> : <span style={{ flex: 1, color: "#64748b" }}>Vacant</span>; return (
              <div key={i} className="calm-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 10px", borderRadius: 12, fontSize: 14, background: i === ui ? "#f5c54210" : "transparent" }}>
                <span style={{ width: 150, display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: i === ui ? C.gd : "#e2e8f0" }}><TeamLogo t={t} sz={22} />{t.name}</span>
                {cell(t.coach?.hc)}{cell(t.coach?.oc)}{cell(t.coach?.dc)}
              </div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
}
