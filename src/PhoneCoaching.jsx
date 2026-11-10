// Coaching on phones, in the Home screen's look: a hero with your staff points, your staff as clean
// rows (a tap opens a coach with what you can do: upgrade, extend, fire), the game plan, the locker
// room in one line, and the coaches you could hire.
import React, { useState } from "react";
import { C, oC, Bdg, Face, Sheet, Hero, Section, Segments } from "./ui.jsx";
import { posTag } from "./dline.js";

const ROLE_NAME = { HC: "Head coach", OC: "Offensive coordinator", DC: "Defensive coordinator", ST: "Special teams" };
const tag = (t, c) => <span style={{ fontSize: 11, fontWeight: 800, color: c, background: `${c}22`, borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap" }}>{t}</span>;

export default function PhoneCoaching({ hcNote, hcExtOk = true, staff, yr, scPts, coachAge, hcTrait, hcStyle, hotSeat = [], roster = [], faCoaches = [], cap, gamePlan, clr, logo, onUpgrade, onExtend, onFire, onHire, onMeeting }) {
  const [pick, setPick] = useState(null); // ["HC" | "OC" | ...] or { hire: coach }
  const [room, setRoom] = useState(false);
  // the coaches you could hire, one role at a time (its best four), so the list never runs long
  const [hireRole, setHireRole] = useState("OC");
  const roles = ["HC", "OC", "DC", "ST"];
  const coachOf = (r) => staff[r.toLowerCase()];
  const conf = roster.map((p) => p.conf || 60);
  const avg = conf.length ? Math.round(conf.reduce((a, b) => a + b, 0) / conf.length) : 60;
  const low = conf.filter((c) => c < 40).length;
  const soft = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
  const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 66, textAlign: "left", background: "transparent", border: 0, padding: "8px 0", color: C.tx, cursor: "pointer", whiteSpace: "normal" };
  const big = (bg, c) => ({ width: "100%", minHeight: 50, marginTop: 8, borderRadius: 14, border: 0, background: bg, color: c, fontSize: 16, fontWeight: 900, cursor: "pointer" });
  const sel = typeof pick === "string" ? coachOf(pick) : null;
  const pool = [...faCoaches].sort((a, b) => roles.indexOf(a.role) - roles.indexOf(b.role) || (b.rating || 0) - (a.rating || 0));
  const hr = pool.some((c) => c.role === hireRole) ? hireRole : roles.find((r) => pool.some((c) => c.role === r));
  return (
    <div>
      <Hero clr={clr} logo={logo} eyebrow="Coaching" title="Your staff" sub={staff.hc ? `${staff.hc.name} · ${hcStyle(staff.hc)} on game day` : "No head coach"}
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: "#93c5fd" }}>{scPts}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>STAFF POINTS</div></div>} />
      <Section title="Staff" style={{ marginTop: 18 }}>
        <div style={soft}>
          {roles.map((r, i) => { const c = coachOf(r); return (
            <button key={r} onClick={() => c && setPick(r)} style={{ ...row, borderTop: i ? "1px solid #ffffff10" : 0, cursor: c ? "pointer" : "default" }}>
              {c ? <Face s={c.face} coach={c.name} sz={40} /> : <span style={{ width: 40, height: 40, borderRadius: 20, border: "2px dashed #475569" }} />}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: c ? "#f1f5f9" : C.mt }}>{c ? c.name : "Vacant"}{hotSeat.includes(r) && <span style={{ color: "#fca5a5", fontSize: 12, marginLeft: 6 }}>hot seat</span>}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>{tag(r, "#60a5fa")}{c && r !== "HC" && c.scheme && tag(c.scheme, "#a78bfa")}{c && r === "HC" && hcTrait(c) && tag(c.trait, "#fbbf24")}{c && (c.contract || 0) <= 1 && <span style={{ fontSize: 12, color: C.rd }}>last year</span>}</span>
              </span>
              {c && <b style={{ fontSize: 20, color: oC(c.rating) }}>{c.rating}</b>}
            </button>
          ); })}
        </div>
      </Section>
      {gamePlan && <Section title="Game plan">{gamePlan}</Section>}
      <Section title="Locker room">
        <button onClick={() => setRoom(true)} style={{ ...soft, ...row, padding: "8px 14px", width: "100%" }}>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>Team confidence {avg}</span><span style={{ display: "block", fontSize: 14, color: low ? "#fca5a5" : "#94a3b8", marginTop: 2 }}>{low ? `${low} player${low > 1 ? "s" : ""} running low` : "Everyone's in a good place"}</span></span>
          <span style={{ fontSize: 20, color: "#64748b" }}>›</span>
        </button>
      </Section>
      {pool.length > 0 && (
        <Section title="Hire a coach">
          <div style={{ marginBottom: 10 }}><Segments items={roles.filter((r) => pool.some((c) => c.role === r)).map((r) => [r, r])} value={hr} onChange={setHireRole} /></div>
          <div style={soft}>
            {pool.filter((c) => c.role === hr).sort((a, b) => b.rating - a.rating).slice(0, 4).map((c, i) => (
              <button key={c.id} onClick={() => setPick({ hire: c })} style={{ ...row, borderTop: i ? "1px solid #ffffff10" : 0 }}>
                <Face s={c.face} coach={c.name} sz={40} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>{tag(c.role, "#60a5fa")}{c.scheme && c.role !== "HC" && tag(c.scheme, "#a78bfa")}{c.real && tag("REAL", "#86efac")}<span style={{ fontSize: 12, color: "#94a3b8" }}>{c.role === "HC" ? "off cap" : `$${c.salary}M`}</span></span>
                </span>
                <b style={{ fontSize: 20, color: oC(c.rating) }}>{c.rating}</b>
              </button>
            ))}
          </div>
        </Section>
      )}

      {sel && (
        <Sheet onClose={() => setPick(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, paddingRight: 40 }}>
            <Face s={sel.face} coach={sel.name} sz={60} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{sel.name}</div><div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{ROLE_NAME[pick]} · age {coachAge(sel, yr)}</div></div>
            <b style={{ fontSize: 40, color: oC(sel.rating) }}>{sel.rating}</b>
          </div>
          {pick === "HC" && hcTrait(sel) && <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.45, marginBottom: 6 }}><b style={{ color: "#fbbf24" }}>{sel.trait}</b> · {hcTrait(sel).desc}</div>}
          {[["Scheme", pick !== "HC" ? sel.scheme : null], ["Style", pick !== "HC" ? sel.trait : hcStyle(sel)], ["Salary", `$${sel.salary}M`], ["Contract", `${sel.contract || "?"} year${sel.contract === 1 ? "" : "s"} left`]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", minHeight: 44, borderTop: "1px solid #ffffff14", fontSize: 16 }}><span style={{ color: "#94a3b8" }}>{l}</span><b style={{ marginLeft: "auto" }}>{v}</b></div>
          ))}
          {pick !== "HC" && <div style={{ borderTop: "1px solid #ffffff14", padding: "10px 0 4px" }}><div style={{ display: "flex", fontSize: 14, color: "#94a3b8", marginBottom: 6 }}><span>Experience</span><span style={{ marginLeft: "auto" }}>{(sel.xp || 0) % 20}/20 to +1</span></div><div style={{ height: 6, background: "#ffffff14", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.round((((sel.xp || 0) % 20) / 20) * 100)}%`, height: "100%", background: "#3b82f6" }} /></div></div>}
          {pick !== "HC" && <button disabled={scPts < 2 || sel.rating >= 95} onClick={() => { onUpgrade(pick); setPick(null); }} style={{ ...big("#1e3a5f", "#bfdbfe"), opacity: scPts < 2 || sel.rating >= 95 ? 0.5 : 1 }}>Upgrade +5 · 2 SP</button>}
          {pick === "HC" && hcNote && <div style={{ background: "#78350f33", borderRadius: 14, padding: "10px 14px", margin: "10px 0 2px", fontSize: 14, color: "#fde68a", lineHeight: 1.5 }}>{hcNote}</div>}
          {(pick !== "HC" || hcExtOk) && <button disabled={scPts < 1} onClick={() => { onExtend(pick); setPick(null); }} style={{ ...big("#14532d", "#bbf7d0"), opacity: scPts < 1 ? 0.5 : 1 }}>Extend his contract</button>}
          <button onClick={() => { if (window.confirm(`Fire ${sel.name}? He goes into the coaching pool, where any club can hire him.`)) { onFire(pick); setPick(null); } }} style={big("transparent", "#fca5a5")}>Fire {sel.name.split(" ").slice(-1)[0]}</button>
          <div style={{ height: 8 }} />
        </Sheet>
      )}
      {pick?.hire && (() => { const c = pick.hire, ok = c.role === "HC" || cap >= (c.salary || 0); return (
        <Sheet onClose={() => setPick(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, paddingRight: 40 }}>
            <Face s={c.face} coach={c.name} sz={60} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{c.name}</div><div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{ROLE_NAME[c.role]}{(c.fired || c.expired) && c.from ? ` · ${c.fired ? "fired by" : "let go by"} ${c.from}` : ""}</div></div>
            <b style={{ fontSize: 40, color: oC(c.rating) }}>{c.rating}</b>
          </div>
          {[["Scheme", c.role !== "HC" ? c.scheme : null], ["Style", c.trait], ["Salary", c.role === "HC" ? "Off the player cap" : `$${c.salary}M`]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", minHeight: 44, borderTop: "1px solid #ffffff14", fontSize: 16 }}><span style={{ color: "#94a3b8" }}>{l}</span><b style={{ marginLeft: "auto" }}>{v}</b></div>
          ))}
          <button disabled={!ok} onClick={() => { onHire(c); setPick(null); }} style={{ ...big(ok ? C.gn : "#ffffff14", ok ? "#fff" : "#64748b"), minHeight: 54, marginTop: 12 }}>{ok ? `Hire as ${c.role}` : "Not enough cap room"}</button>
          <div style={{ height: 8 }} />
        </Sheet>
      ); })()}
      {room && (
        <Sheet title="Locker room" onClose={() => setRoom(false)}>
          <button disabled={scPts < 1} onClick={() => { onMeeting(); }} style={{ ...big(`${C.bl}33`, "#bfdbfe"), marginTop: 0, opacity: scPts < 1 ? 0.5 : 1 }}>Hold a team meeting · 1 SP (+5 confidence)</button>
          <div style={{ marginTop: 10 }}>
            {[...roster].sort((a, b) => (a.conf || 60) - (b.conf || 60)).map((p, i) => { const v = p.conf || 60, col = v >= 60 ? C.gn : v >= 40 ? C.gd : C.rd; return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, borderTop: i ? "1px solid #ffffff10" : 0 }}>
                <span style={{ width: 42, flexShrink: 0 }}><Bdg pos={posTag(p)} /></span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                <span style={{ width: 70, height: 6, borderRadius: 3, background: "#ffffff14", overflow: "hidden" }}><span style={{ display: "block", width: `${v}%`, height: "100%", background: col }} /></span>
                <b style={{ width: 26, textAlign: "right", color: col }}>{v}</b>
              </div>
            ); })}
          </div>
        </Sheet>
      )}
    </div>
  );
}
