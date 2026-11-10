// The Front Office's cap picture: where the money is this year and next, what's dead, where it
// goes by position, and the cap advisor's suggestions (restructures, cuts that free real money,
// extensions to get done early, and what to do with room to spare).
import React from "react";
import { C, Bdg, Section, Sheet, cardTitle } from "./ui.jsx";
import { capProjection } from "./capProjection.js";
import { posTag } from "./dline.js";

const GROUPS = [["QB", ["QB"]], ["Skill", ["RB", "WR", "TE"]], ["O-line", ["LT", "LG", "C", "RG", "RT"]], ["D-line", ["DL"]], ["LB", ["LB"]], ["Secondary", ["CB", "S"]], ["Specialists", ["K", "P"]]];
const $ = (v) => `$${(+v || 0).toFixed(1)}M`;

// rows: [{ p, yl (years left), dm (dead money if cut: {total}), rp (restructure plan or null) }]
export function capAdvice({ rows, space, nextRoom, canExtend, starters }) {
  const tips = [];
  for (const r of rows.filter((r) => r.rp).sort((a, b) => b.rp.saved - a.rp.saved).slice(0, 2))
    tips.push({ kind: "restructure", tone: "#38bdf8", p: r.p, title: `Restructure ${r.p.name}`, text: `Turns salary into bonus: ${$(r.rp.saved)} of room this year, spread over the rest of his deal.` });
  for (const r of rows) {
    const save = (r.p.salary || 0) - (r.dm?.total || 0);
    if (save >= 3 && !starters.has(r.p.id) && (r.p.age || 0) >= 27) tips.push({ kind: "cut", tone: "#f87171", p: r.p, save, title: `Release ${r.p.name}?`, text: `A backup at ${$(r.p.salary)}. Cutting him frees ${$(save)} (${$(r.dm?.total || 0)} stays as dead money).` });
  }
  const cuts = tips.filter((t) => t.kind === "cut").sort((a, b) => b.save - a.save).slice(0, 2);
  const ext = rows.filter((r) => canExtend(r.p) && r.p.ovr >= 78 && (r.p.age || 30) <= 29 && !r.p.holdout).sort((a, b) => b.p.ovr - a.p.ovr).slice(0, 2)
    .map((r) => ({ kind: "extend", tone: "#a78bfa", p: r.p, title: `Extend ${r.p.name} now`, text: `${r.p.ovr} OVR at ${r.p.age}, ${r.yl} year${r.yl === 1 ? "" : "s"} left. Deals only get pricier once he's close to the market.` }));
  const out = [...tips.filter((t) => t.kind === "restructure"), ...cuts, ...ext];
  if (space < 0) out.unshift({ kind: "warn", tone: C.rd, title: "You're over the cap", text: `${$(-space)} over. Restructure or release someone before the next game or penalties hit.` });
  else if (space > 40) out.push({ kind: "room", tone: C.gn, title: `${$(space)} of room`, text: "Enough to take on a big contract in a trade, front-load a free agent, or extend a starter early." });
  if (nextRoom < 0) out.push({ kind: "warn", tone: "#f59e0b", title: "Next season is already over the cap", text: `${$(-nextRoom)} short before re-signing anyone. Plan restructures or cuts this year.` });
  return out;
}

// Four seasons of cap: the room left each year (money already committed against its cap), how
// many players are signed, and whose deals end that year (next year's re-sign calls).
export function CapLongView({ team, cy, onPlayer, mobile, extra = null, room0 = null, rookies = 0, title = "The next four years", note = null }) {
  const yrs = capProjection(team, cy, { extra, room0, rookies });
  return (
    <div style={{ background: "#ffffff0d", borderRadius: 20, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span title="Money already committed against each season's cap. Re-signings, rookies and free agents come out of the room." style={{ ...cardTitle, flex: 1 }}>{title}</span>
        {note && <span style={{ fontSize: 14, color: "#94a3b8" }}>{note}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobile ? 2 : 4},minmax(0,1fr))`, gap: 10 }}>
        {yrs.map((y, i) => {
          const pct = Math.min(100, (y.committed / y.cap) * 100), deadPct = Math.min(pct, (y.dead / y.cap) * 100);
          const tone = y.room < 0 ? C.rd : y.room < y.cap * 0.08 ? C.gd : "#f8fafc";
          const ends = y.expiring.slice(0, 2);
          return (
            <div key={y.yr} style={{ background: i === 0 ? "#ffffff10" : "#ffffff07", borderRadius: 14, padding: "12px 14px", minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: "#94a3b8" }}>{y.yr}{i === 0 ? " · THIS YEAR" : ""}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: tone, lineHeight: 1 }}>{y.room < 0 ? `-${$(-y.room)}` : $(y.room)}</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>room</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#ffffff14", overflow: "hidden", margin: "8px 0", position: "relative" }} title={`${$(y.committed)} committed of ${$(y.cap)}${y.dead > 0 ? `, ${$(y.dead)} of it dead money` : ""}`}>
                <div style={{ width: `${pct}%`, height: "100%", background: y.room < 0 ? C.rd : "#38bdf8" }} />
                {deadPct > 0 && <div style={{ position: "absolute", left: 0, top: 0, width: `${deadPct}%`, height: "100%", background: "#ef4444" }} />}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{y.players} signed{ends.length ? " · ends: " : ""}{ends.map((p, k) => <span key={p.id}>{k ? ", " : ""}<span onClick={() => onPlayer?.(p)} style={{ color: "#e2e8f0", cursor: onPlayer ? "pointer" : "default" }}>{p.name.split(" ").slice(-1)[0]}</span></span>)}{y.expiring.length > 2 ? ` +${y.expiring.length - 2}` : ""}</div>
            </div>
          );
        })}
      </div>
      {extra && <div style={{ fontSize: 12, color: C.mt, marginTop: 6 }}>Includes this offer: {$(extra.sal)} a year for {extra.yrs} year{extra.yrs === 1 ? "" : "s"}.</div>}
    </div>
  );
}

export default function CapOverview({ team, cap, space, nextRoom, dead, deadNext, rows, canExtend, starters, onPlayer, mobile, leagueAvg, onContracts, cy, rookies = 0 }) {
  const [allTips, setAllTips] = React.useState(false);
  const [tip, setTip] = React.useState(null); // phones: the advice behind one line
  const used = cap - space;
  const byGroup = GROUPS.map(([g, ps]) => [g, team.roster.filter((p) => ps.includes(p.pos)).reduce((s, p) => s + (p.salary || 0), 0), leagueAvg ? leagueAvg(ps) : null]);
  const top = [...team.roster].sort((a, b) => (b.salary || 0) - (a.salary || 0)).slice(0, 8);
  const tips = capAdvice({ rows, space, nextRoom, canExtend, starters });
  const card = { background: "#ffffff0d", borderRadius: 18, padding: "16px 18px" };
  const head = { fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 10 };
  const CLR = ["#f59e0b", "#38bdf8", "#22c55e", "#ef4444", "#a78bfa", "#ec4899", "#94a3b8"];
  // phones: the advisor first (what to do), then four seasons you swipe, the biggest hits and where
  // the money goes, in soft cards (the headline numbers are in the hero above)
  if (mobile) {
    const soft = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
    const yrs = cy != null ? capProjection(team, cy, { room0: space, rookies }) : [];
    return (
      <div style={{ marginBottom: 14 }}>
        <Section title="Cap advisor" style={{ marginTop: 18 }} action={tips.length > 3 && !allTips ? `All ${tips.length}` : null} onAction={() => setAllTips(true)}>
          <div style={soft}>
            {!tips.length && <div style={{ fontSize: 14, color: "#94a3b8", padding: "16px 0" }}>Your books are in good shape.</div>}
            {/* one line each; the why is a tap away */}
            {tips.slice(0, allTips ? tips.length : 3).map((t, i) => (
              <button key={i} onClick={() => setTip(t)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 54, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: "8px 0", color: "#fff", cursor: "pointer" }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: t.tone, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                <span style={{ fontSize: 20, color: "#64748b" }}>›</span>
              </button>
            ))}
          </div>
        </Section>
        {tip && <Sheet title={tip.title} onClose={() => setTip(null)}>
          <div style={{ fontSize: 16, color: "#cbd5e1", lineHeight: 1.5, margin: "0 2px 16px" }}>{tip.text}</div>
          {tip.p && <button onClick={() => { const p = tip.p; setTip(null); onPlayer(p); }} style={{ width: "100%", minHeight: 50, borderRadius: 14, border: 0, background: "#ffffff14", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Open his card</button>}
          <div style={{ height: 8 }} />
        </Sheet>}
        {yrs.length > 0 && (
          <Section title="The next four years">
            <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", margin: "0 -8px", padding: "0 8px 4px", scrollPaddingLeft: 8 }}>
              {yrs.map((y, i) => { const pct = Math.min(100, (y.committed / y.cap) * 100); const tone = y.room < 0 ? C.rd : y.room < y.cap * 0.08 ? C.gd : C.gn; return (
                <div key={y.yr} style={{ flex: "0 0 62%", scrollSnapAlign: "start", background: "#ffffff0f", borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.3, color: "#94a3b8" }}>{y.yr}{i === 0 ? " · THIS YEAR" : ""}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: tone, marginTop: 4 }}>{y.room < 0 ? `-${$(-y.room)}` : $(y.room)}</div>
                  <div style={{ height: 6, borderRadius: 3, background: "#ffffff14", overflow: "hidden", margin: "8px 0" }}><div style={{ width: `${pct}%`, height: "100%", background: y.room < 0 ? C.rd : "#38bdf8" }} /></div>
                  <div style={{ fontSize: 14, color: "#94a3b8" }}>{y.players} signed · {y.expiring.length} deal{y.expiring.length === 1 ? "" : "s"} ending</div>
                </div>
              ); })}
            </div>
          </Section>
        )}
        <Section title="Biggest cap hits" action={onContracts ? "All contracts" : null} onAction={() => onContracts?.("all")}>
          <div style={soft}>
            {top.slice(0, 5).map((p, i) => (
              <button key={p.id} onClick={() => onPlayer(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 52, background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: 0, color: "#fff", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 42, flexShrink: 0 }}><Bdg pos={posTag(p)} /></span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                <b style={{ fontSize: 16, color: C.gd }}>{$(p.salary)}</b>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Where the money goes">
          <div style={{ ...soft, padding: "14px" }}>
            <div style={{ height: 12, borderRadius: 6, background: "#ffffff14", overflow: "hidden", display: "flex", marginBottom: 12 }}>{byGroup.map(([g, v], i) => <div key={g} style={{ width: `${(v / cap) * 100}%`, background: CLR[i] }} />)}</div>
            {byGroup.map(([g, v, avg], i) => { const d = avg ? (v - avg) / avg : 0; return (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minHeight: 32 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: CLR[i] }} /><span style={{ flex: 1 }}>{g}</span><b>{$(v)}</b>
                {avg != null && <span style={{ width: 54, textAlign: "right", fontSize: 14, fontWeight: 800, color: d > 0.25 ? C.rd : d < -0.25 ? C.gn : C.mt }}>{d > 0 ? "+" : ""}{Math.round(d * 100)}%</span>}
              </div>
            ); })}
            {byGroup[0][2] != null && <div style={{ fontSize: 12, color: C.mt, marginTop: 6 }}>Against the league's average spend</div>}
          </div>
        </Section>
      </div>
    );
  }
  // computers: the four years, then where the money goes beside what to do about it. The cap space
  // and expiring deals are in the header above; the full list is the Contracts tab.
  const dot = (c) => <span style={{ width: 9, height: 9, borderRadius: 5, background: c, flexShrink: 0, marginTop: 7 }} />;
  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
      {cy != null && <CapLongView team={team} cy={cy} room0={space} rookies={rookies} onPlayer={onPlayer} note={`next season ${$(nextRoom)} of room${dead > 0.05 ? ` · ${$(dead)} dead money` : ""}${deadNext > 0.05 ? ` · ${$(deadNext)} dead next year` : ""}`} />}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 10 }}><span style={{ ...head, marginBottom: 0, flex: 1 }}>Where the money goes</span>{byGroup[0][2] != null && <span style={{ fontSize: 13, color: "#64748b" }}>vs the league average</span>}</div>
          <div style={{ height: 8, borderRadius: 4, background: "#ffffff14", overflow: "hidden", display: "flex", marginBottom: 10 }} title={`${$(used)} used of ${$(cap)}`}>
            {byGroup.map(([g, v], i) => <div key={g} style={{ width: `${(v / cap) * 100}%`, background: CLR[i] }} />)}
          </div>
          {byGroup.map(([g, v, avg], i) => {
            const d = avg ? (v - avg) / avg : 0;
            return (
              <div key={g} title={avg != null ? `League average: ${$(avg)}` : undefined} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, padding: "5px 0" }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: CLR[i] }} />
                <span style={{ flex: 1, color: "#e2e8f0" }}>{g}</span><b style={{ width: 72, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{$(v)}</b>
                <span style={{ width: 56, textAlign: "right", fontSize: 14, fontWeight: 800, color: avg == null ? "#64748b" : d > 0.25 ? "#fca5a5" : d < -0.25 ? "#86efac" : "#64748b" }}>{avg != null ? `${d > 0 ? "+" : ""}${Math.round(d * 100)}%` : `${Math.round((v / cap) * 100)}%`}</span>
              </div>
            );
          })}
        </div>
        <div style={card}>
          <div style={head}>Cap advisor</div>
          {!tips.length && <div style={{ fontSize: 15, color: "#94a3b8" }}>Your books are in good shape. Nothing needs doing right now.</div>}
          {(allTips ? tips : tips.slice(0, 3)).map((t, i) => (
            <div key={i} onClick={() => t.p && onPlayer(t.p)} className={t.p ? "calm-row" : undefined} style={{ display: "flex", gap: 12, padding: "9px 8px", margin: "0 -8px", borderRadius: 12, cursor: t.p ? "pointer" : "default" }}>
              {dot(t.tone)}
              <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>{t.title}</span><span style={{ display: "block", fontSize: 14, color: "#94a3b8", lineHeight: 1.4 }}>{t.text}</span></span>
            </div>
          ))}
          {tips.length > 3 && <button onClick={() => setAllTips((v) => !v)} style={{ background: "transparent", border: 0, padding: "6px 0 0", color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{allTips ? "Show fewer" : `${tips.length - 3} more`}</button>}
        </div>
      </div>
    </div>
  );
}
