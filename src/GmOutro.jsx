// Retiring as GM: the franchise is over (its save is gone), so the game sends you off properly.
// First the career you retire with, on one full screen in your club's colors; then a quiet last
// frame, and back to the main menu.
import React, { useState } from "react";
import { TeamLogo, LogoMark } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { legacyTier } from "./gmLegacy.js";
import { ACHIEVEMENTS } from "./achievements.js";

// a thin white outline, so a dark logo (the Giants' navy) still reads on the dark backdrop
const OUTLINE = "drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff)";
const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;

export default function GmOutro({ career: c, rank, team, yr, achievements = {}, gone = [], onDone }) {
  const [stage, setStage] = useState(0);
  const clr = team?.clr || "#1e3a8a";
  const first = c.seasons ? yr - c.seasons + 1 : yr;
  const earned = ACHIEVEMENTS.filter((a) => achievements[a.id]);
  const pct = ((c.pct || 0) * 100).toFixed(1);
  const btn = { border: 0, borderRadius: 16, padding: "14px 28px", fontSize: 16, fontWeight: 900, cursor: "pointer" };
  return (
    <div role="dialog" aria-label="Retirement" className="keep-dark" style={{ position: "fixed", inset: 0, zIndex: 5000, overflow: "hidden", color: "#fff", background: `radial-gradient(120% 90% at 50% 0%, ${clr}66, transparent 70%) #05080f`, display: "flex", alignItems: "center", justifyContent: "center", padding: MOBILE ? 18 : 32 }}>
      <style>{"@keyframes goIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes goFade{from{opacity:0}to{opacity:1}}"}</style>
      <LogoMark t={team} sz={MOBILE ? 360 : 620} opacity={0.06} style={{ right: "-6%", bottom: "-12%", transform: "none" }} />

      {stage === 0 && (
        <div key="acc" style={{ position: "relative", width: "100%", maxWidth: 860, animation: "goIn .6s ease-out", maxHeight: "100%", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            {team && <span style={{ display: "flex", filter: OUTLINE }}><TeamLogo t={team} sz={MOBILE ? 52 : 68} /></span>}
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: "#ffffffb3" }}>GENERAL MANAGER · {first}{c.seasons > 1 ? `–${yr}` : ""}</div>
              <div style={{ fontSize: MOBILE ? 26 : 36, fontWeight: 900, lineHeight: 1.1 }}>{team ? `${team.city} ${team.name}` : "Your career"}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: MOBILE ? 16 : 28, padding: MOBILE ? "18px" : "22px 26px", borderRadius: 22, background: "linear-gradient(135deg,#f5c54222,#ffffff0a)", marginBottom: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: MOBILE ? 48 : 64, fontWeight: 900, color: "#fde68a", lineHeight: 1 }}>{c.score}</div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.6, color: "#fcd34d", marginTop: 4 }}>LEGACY</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: MOBILE ? 20 : 26, fontWeight: 900 }}>{legacyTier(c.score, c.seasons)}</div>
              <div style={{ fontSize: 15, color: "#e2e8f0", marginTop: 4 }}>{rank <= 10 ? `The ${ord(rank)} greatest GM of all time` : "Outside the all-time top 10"}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "repeat(3,1fr)" : "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
            {[["Seasons", c.seasons], ["Record", `${c.w}-${c.l}`], ["Win %", `${pct}%`], ["Super Bowls", c.titles.length], ["Playoff trips", c.playoffs]].map(([l, v]) => (
              <div key={l} style={{ background: "#ffffff0d", borderRadius: 16, padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: l === "Super Bowls" && c.titles.length ? "#fde68a" : "#fff" }}>{v}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {c.titles.length > 0 && <div style={{ fontSize: 15, color: "#fde68a", marginBottom: 12 }}>World champions in {c.titles.join(", ")}</div>}

          <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <div style={{ background: "#ffffff0a", borderRadius: 18, padding: "14px 16px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Your best draft picks</div>
              {c.draftees.slice(0, 4).map((d) => (
                <div key={d.id} style={{ display: "flex", gap: 8, fontSize: 14, padding: "4px 0" }}>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><b>{d.name}</b> <span style={{ color: "#94a3b8" }}>{d.pos} · {d.yr}</span></span>
                  <span style={{ color: "#fcd34d", whiteSpace: "nowrap" }}>{d.hof ? "Hall of Fame" : d.ap ? `${d.ap}× All-Pro` : `${d.peak} peak`}</span>
                </div>
              ))}
              {!c.draftees.length && <div style={{ fontSize: 14, color: "#94a3b8" }}>No standouts from your drafts.</div>}
            </div>
            <div style={{ background: "#ffffff0a", borderRadius: 18, padding: "14px 16px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Achievements <span style={{ color: "#94a3b8", fontWeight: 600 }}>{earned.length} of {ACHIEVEMENTS.length}</span></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {earned.map((a) => <span key={a.id} title={a.desc} style={{ fontSize: 13, fontWeight: 700, padding: "5px 11px", borderRadius: 99, background: "#ffffff12", color: "#e2e8f0" }}>{a.name}</span>)}
                {!earned.length && <span style={{ fontSize: 14, color: "#94a3b8" }}>None earned.</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}><button onClick={() => setStage(1)} style={{ ...btn, background: "#fff", color: "#0b1220" }}>Close the book</button></div>
        </div>
      )}

      {stage === 1 && (
        <div key="end" style={{ position: "relative", textAlign: "center", maxWidth: 620, animation: "goFade 1.2s ease-out" }}>
          {team && <div style={{ display: "flex", justifyContent: "center", marginBottom: 22, filter: OUTLINE }}><TeamLogo t={team} sz={MOBILE ? 88 : 120} /></div>}
          <div style={{ fontSize: MOBILE ? 34 : 48, fontWeight: 900, letterSpacing: -0.5 }}>Thank you, GM.</div>
          <div style={{ fontSize: MOBILE ? 16 : 19, color: "#cbd5e1", lineHeight: 1.6, marginTop: 14 }}>
            {c.seasons} season{c.seasons === 1 ? "" : "s"}{c.titles.length ? `, ${c.titles.length} Super Bowl${c.titles.length === 1 ? "" : "s"}` : ""}{c.playoffs ? `, ${c.playoffs} playoff trip${c.playoffs === 1 ? "" : "s"}` : ""}.
            {" "}{team ? `The ${team.name} will remember the years you ran the club.` : ""}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 26 }}>This franchise has been closed{gone.length ? ` and its save${gone.length === 1 ? "" : "s"} deleted (${gone.join(", ")})` : ""}.</div>
          <button onClick={onDone} style={{ ...btn, marginTop: 26, background: "#ffffff14", color: "#fff" }}>Main menu</button>
        </div>
      )}
    </div>
  );
}
