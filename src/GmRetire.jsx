// Retire as GM: the whole career on one sheet (record, titles, the best players you drafted, the
// records your teams set) and its legacy score ranked among the greatest GMs in NFL history.
import React from "react";
import { C, TeamLogo, CloseX, sheetWrap, sheetBox, SheetGrip } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { GREATS, legacyRank, legacyTier } from "./gmLegacy.js";
import { ACHIEVEMENTS } from "./achievements.js";

const box = { background: "#ffffff0d", borderRadius: 16, padding: "12px 14px", marginBottom: 10 };
// section titles are plain white now (the color argument is kept so the calls don't change)
const head = () => ({ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 });
const btn = (bg, fg = "#fff") => ({ background: bg, color: fg, border: "none", borderRadius: 14, minHeight: 46, padding: "0 18px", fontWeight: 800, fontSize: 15, cursor: "pointer" });

export default function GmRetire({ career: c, team, gmName, retired, yr, achievements = {}, saves = [], onRetire, onClose }) {
  const [locked, setLocked] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const rank = legacyRank(c.score);
  const board = [...GREATS.map((g) => ({ ...g, you: false })), { name: gmName || "You", club: team ? `${team.city} ${team.name}` : "", yrs: c.seasons ? `${yr - c.seasons + 1}–${yr}` : `${yr}`, score: c.score, titles: c.titles.length, you: true }].sort((a, b) => b.score - a.score || (a.you ? 1 : -1));
  const youAt = board.findIndex((g) => g.you);
  const shown = youAt < 10 ? board.slice(0, 11) : [...board.slice(0, 10), board[youAt]];
  const pct = (c.pct * 100).toFixed(1);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.9)", zIndex: 2300, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, ...sheetWrap(MOBILE) }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="GM career" style={{ position: "relative", width: "100%", maxWidth: 760, maxHeight: "92vh", overflowY: "auto", borderRadius: MOBILE ? undefined : 22, background: "#0d1424", border: 0, boxShadow: "0 30px 80px #000c", padding: MOBILE ? 14 : 20, color: C.tx, fontFamily: C.f, ...sheetBox(MOBILE) }}>
        {MOBILE && <SheetGrip onClose={onClose} />}
        <CloseX onClick={onClose} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingRight: 40 }}>
          {team && <TeamLogo t={team} sz={MOBILE ? 44 : 56} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.mt }}>{retired ? "A career in full" : "Your career so far"}</div>
            <div style={{ fontSize: MOBILE ? 20 : 24, fontWeight: 900 }}>{gmName || "Your"} GM career</div>
            <div style={{ fontSize: 13, color: C.mt }}>{c.seasons} season{c.seasons === 1 ? "" : "s"} · {c.w}-{c.l} ({pct}%){team ? ` · ${team.city} ${team.name}` : ""}</div>
          </div>
        </div>
        <div style={{ ...box, display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#78350f44,#ffffff0d)" }}>
          <div style={{ textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fcd34d" }}>Legacy</div>
            <div style={{ fontSize: MOBILE ? 36 : 44, fontWeight: 900, color: "#fde68a", lineHeight: 1 }}>{c.score}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900 }}>{legacyTier(c.score, c.seasons)}</div>
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>{rank <= 10 ? `#${rank} among the greatest GMs of all time` : "Outside the all-time top 10"}{rank <= 10 && rank > 1 ? `, behind ${GREATS[rank - 2].name}` : rank === 1 ? ", ahead of Bill Belichick" : ""}.</div>
            <div style={{ fontSize: 11, color: C.mt, marginTop: 3 }}>100 per title · 15 per playoff trip · 2 per game over .500 · 4 per season · 25 per Hall of Famer you drafted · 6 per All-Pro season from your picks · 3 per record set</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 6, marginBottom: 10 }}>
          {[["Seasons", c.seasons], ["Record", `${c.w}-${c.l}`], ["Win %", `${pct}%`], ["Super Bowls", c.titles.length], ["Playoffs", c.playoffs], ["Records", c.recordCount]].map(([l, v]) => (
            <div key={l} style={{ ...box, marginBottom: 0, textAlign: "center", padding: "10px 4px" }}><div style={{ fontSize: 20, fontWeight: 900, color: l === "Super Bowls" && c.titles.length ? "#fbbf24" : C.tx }}>{v}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.mt }}>{l}</div></div>
          ))}
        </div>
        {c.titles.length > 0 && <div style={box}><div style={head("#fbbf24")}>Super Bowl titles</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{c.titles.map((y) => <span key={y} style={{ background: "#92400e44", color: "#fde68a", borderRadius: 6, padding: "3px 10px", fontWeight: 800 }}>{y}</span>)}</div></div>}
        {c.best && <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 10 }}>Best season: <b>{c.best.yr}</b>, {c.best.w}-{c.best.l}.</div>}
        <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: 10 }}>
          <div style={box}>
            <div style={head("#38bdf8")}>Great players you drafted</div>
            {c.draftees.length ? c.draftees.map((d) => <div key={d.id} style={{ display: "flex", gap: 6, fontSize: 13, padding: "3px 0", borderBottom: "1px solid #ffffff0d" }}><span style={{ flex: 1, minWidth: 0 }}><b>{d.name}</b> <span style={{ color: C.mt }}>{d.pos} · {d.yr} R{d.rd} #{d.overall}</span></span><span style={{ color: "#fcd34d", whiteSpace: "nowrap" }}>{d.hof ? "HOF · " : ""}{d.ap ? `${d.ap}× AP · ` : ""}{d.pb ? `${d.pb}× PB · ` : ""}{d.peak} peak</span></div>) : <div style={{ fontSize: 13, color: C.mt }}>No drafts yet.</div>}
          </div>
          <div style={box}>
            <div style={head("#a78bfa")}>Records your teams set</div>
            {c.records.length ? c.records.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0", borderBottom: "1px solid #ffffff0d" }}><span style={{ color: C.mt }}>{r.yr}</span> · <b>{r.name}</b> · {r.label} <span style={{ color: "#c4b5fd" }}>{r.val}</span>{r.league && <span style={{ color: "#fcd34d" }}> · NFL record</span>}</div>) : <div style={{ fontSize: 13, color: C.mt }}>No records set yet.</div>}
          </div>
        </div>
        <div style={box}>
          <div style={{ ...head("#34d399"), display: "flex", alignItems: "baseline", gap: 8 }}>Achievements <span style={{ fontSize: 14, color: C.mt, fontWeight: 600 }}>{ACHIEVEMENTS.filter((a) => achievements[a.id]).length} of {ACHIEVEMENTS.length}</span><button onClick={() => setLocked((v) => !v)} style={{ marginLeft: "auto", background: "#ffffff12", border: 0, color: "#e2e8f0", borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{locked ? "Hide locked" : "Show locked"}</button></div>
          {!ACHIEVEMENTS.some((a) => achievements[a.id]) && !locked && <div style={{ fontSize: 14, color: C.mt }}>None yet. Win games, titles and records to earn them.</div>}
          <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
            {ACHIEVEMENTS.filter((a) => locked || achievements[a.id]).map((a) => { const got = achievements[a.id]; return (
              <div key={a.id} title={a.desc} style={{ borderRadius: 12, padding: "8px 10px", background: got ? "#064e3b55" : "#ffffff08", opacity: got ? 1 : 0.6 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: got ? "#a7f3d0" : C.mt, marginTop: 1 }}>{got ? `Earned ${got}` : a.desc}</div>
              </div>
            ); })}
          </div>
        </div>
        <div style={box}>
          <div style={head(C.gd)}>The greatest GMs of all time</div>
          {shown.map((g) => {
            const n = board.indexOf(g) + 1;
            return <div key={g.name + g.you} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 10, background: g.you ? "#22c55e22" : "transparent", fontSize: 14 }}>
              <span style={{ width: 26, fontWeight: 900, color: n <= 3 ? "#fbbf24" : C.mt }}>#{n}</span>
              <span style={{ flex: 1, minWidth: 0 }}><b>{g.name}</b> <span style={{ color: C.mt }}>{g.club} · {g.yrs}</span>{!g.you && !MOBILE && <div style={{ fontSize: 11, color: "#94a3b8" }}>{g.note}</div>}</span>
              <span style={{ color: "#fbbf24", whiteSpace: "nowrap" }}>{g.titles ? `${g.titles} ring${g.titles === 1 ? "" : "s"}` : ""}</span>
              <span style={{ width: 48, textAlign: "right", fontWeight: 900 }}>{g.score}</span>
            </div>;
          })}
          <div style={{ fontSize: 11, color: C.mt, marginTop: 4 }}>Real GMs are scored the same way from approximate totals for the years they ran their clubs.</div>
        </div>
        {/* retiring ends the franchise: say exactly what goes before it does */}
        {!confirm ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btn("#1e293b", C.tx)}>Keep building</button>
          <button onClick={() => setConfirm(true)} style={btn("#b45309")}>Retire as GM</button>
        </div> : <div style={{ ...box, marginBottom: 0, background: "#7f1d1d33" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Retire for good?</div>
          <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.5, marginTop: 4 }}>This ends the franchise. {saves.length ? <>Its save{saves.length === 1 ? " is" : "s are"} deleted and can't be recovered: <b>{saves.join(", ")}</b>.</> : "There's no save of it to delete."} You'll see your career one last time.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={() => setConfirm(false)} style={btn("#1e293b", C.tx)}>Not yet</button>
            <button onClick={onRetire} style={btn("#b91c1c")}>Retire and delete the save</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
