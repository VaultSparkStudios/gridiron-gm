// The Development tab: one place to plan and follow your players' growth. Overview (what's worth
// knowing, and who's growing, peaking or declining next summer), the Season plan (focus players,
// camp priority, your young players' roles) and Young players (where each one fits on the depth
// chart, and whether that's helping him grow).
import React, { useMemo, useState } from "react";
import { C, Sheet, Pills } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { posTag } from "./dline.js";
import { devOf, DEV_TRAITS } from "./scouting.js";
import { OFFENSE, DEFENSE, CAMP, inCamp, projShare, projGrowth, roleOf, trendOf, perSeason } from "./development.js";

const ROLE = { starter: "starter", rotation: "rotation", backup: "backup" };
const sign = (g) => (g > 0 ? `+${g}` : `${g}`);
const tone = (g) => (g >= 0.8 ? "#4ade80" : g <= -0.8 ? "#f87171" : "#cbd5e1");

function Tabs({ value, onChange }) {
  return (
    <Pills big items={[["overview", "Overview"], ["plan", "Season plan"], ["young", "Young players"]]} value={value} onChange={onChange} label="Development" style={{ marginBottom: 18 }} />
  );
}
const CAMP_GROUPS_SUB = (camp, n) => (camp && camp !== "balanced" && CAMP[camp] ? `About +0.7 next summer for the ${n} players in the room` : "Even time for every position group");
const H1 = ({ children, sub }) => (
  <div style={{ marginBottom: MOBILE ? 18 : 20 }}>
    <div style={{ fontSize: MOBILE ? 30 : 38, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05 }}>{children}</div>
    {sub && <div style={{ fontSize: MOBILE ? 15 : 18, color: "#94a3b8", marginTop: 8 }}>{sub}</div>}
  </div>
);
const Card = ({ children, style }) => <div style={{ background: C.cd, borderRadius: 18, padding: "4px 22px", border: "1px solid #ffffff0d", ...style }}>{children}</div>;
// A player row: name with age and position beside it, a short note under it, and on the right his
// overall with the expected change next to it (or a plain verdict).
// his development trait in a word, in its color (the same colors as the player card)
const DEV_C = { generational: "#f472b6", superstar: "#f5c542", star: "#60a5fa", late: "#c4b5fd", normal: "#64748b" };
function DevWord({ p }) {
  const d = devOf(p) || "normal";
  return <span title={DEV_TRAITS[d]?.desc} style={{ color: DEV_C[d] || DEV_C.normal, fontWeight: 800 }}> · {DEV_TRAITS[d]?.name || "Normal"}</span>;
}

function Row({ title, meta, sub, right, rightColor, ovr, delta, onClick, last }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: last ? 0 : "1px solid #ffffff10", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}{meta && <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginLeft: 8 }}>{meta}</span>}</div>
        {sub && <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
      </div>
      {ovr != null && <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{ovr}</span>
        {delta != null && <span style={{ minWidth: 44, textAlign: "right", fontSize: 16, fontWeight: 800, color: tone(delta) }}>{sign(delta)}</span>}
      </div>}
      {right != null && <div style={{ fontSize: typeof right === "number" || /^[+-]?\d/.test(right) ? 26 : 15, fontWeight: 900, color: rightColor || "#fff", fontVariantNumeric: "tabular-nums" }}>{right}</div>}
      {onClick && <span style={{ color: "#64748b", fontSize: 18 }}>›</span>}
    </div>
  );
}
const Label = ({ children, right }) => <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 40, fontSize: 15, fontWeight: 700, color: "#94a3b8", margin: "0 4px 10px" }}><span>{children}</span>{right}</div>;

// roster: your players; gp: games your club has played this season; focus/setFocus: the two
// focus players; camp/setCamp: the camp priority; planYr/setPlanYr: the year the plan was locked
export default function DevelopmentScreen({ roster, yr, sp, wk, gp = 0, focus, setFocus, camp = "balanced", setCamp, planYr, setPlanYr, setSel, onDepth }) {
  const [view, setView] = useState("overview");
  const [trend, setTrend] = useState("growing");
  const [focusOpen, setFocusOpen] = useState(false);
  const [campOpen, setCampOpen] = useState(false);
  const pre = sp !== "regular" && sp !== "playoffs";
  const weeksLeft = sp === "regular" ? Math.max(0, 18 - (wk || 1)) : pre ? 17 : 0;
  const isFocus = (p) => focus && (String(focus.off) === String(p.id) || String(focus.def) === String(p.id));
  const rows = useMemo(() => roster.filter((p) => p.pos !== "K" && p.pos !== "P").map((p) => {
    const share = projShare(p, roster, gp);
    return { p, share, role: roleOf(share), g: projGrowth(p, share, { camp, focused: isFocus(p), weeksLeft }) };
  }), [roster, gp, camp, focus, weeksLeft]); // eslint-disable-line react-hooks/exhaustive-deps
  const focusRows = rows.filter((r) => isFocus(r.p));
  const young = rows.filter((r) => r.p.age <= 24).sort((a, b) => b.g - a.g);
  const buried = young.filter((r) => r.role === "backup" && (r.p.truePot ?? r.p.pot ?? 0) - r.p.ovr >= 8).sort((a, b) => (b.p.pot || 0) - (a.p.pot || 0));
  const fading = rows.filter((r) => r.g <= -2).sort((a, b) => b.p.ovr - a.p.ovr);
  const name = (p) => p.name;

  const worth = [
    ...focusRows.map((r) => ({ k: `f${r.p.id}`, title: name(r.p), meta: `${r.p.age} · ${posTag(r.p)}`, ovr: r.p.ovr, delta: r.g, sub: "Focus player", p: r.p })),
    ...buried.slice(0, 2).map((r) => ({ k: `b${r.p.id}`, title: name(r.p), meta: `${r.p.age} · ${posTag(r.p)}`, ovr: r.p.ovr, delta: r.g, sub: "Backup: needs snaps to grow", p: r.p })),
    ...fading.slice(0, 2).map((r) => ({ k: `d${r.p.id}`, title: name(r.p), meta: `${r.p.age} · ${posTag(r.p)}`, ovr: r.p.ovr, delta: r.g, sub: "Expect a drop", p: r.p })),
  ].slice(0, 5);
  const list = rows.filter((r) => trendOf(r.g) === trend).sort((a, b) => (trend === "declining" ? a.g - b.g : trend === "growing" ? b.g - a.g : b.p.ovr - a.p.ovr));
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? list : list.slice(0, 5);
  const locked = planYr === yr;

  const wrap = { maxWidth: view === "plan" ? 1160 : 1240, margin: "0 auto", padding: MOBILE ? "6px 2px 30px" : "10px 12px 40px", color: C.tx };
  return (
    <div style={wrap}>
      <Tabs value={view} onChange={setView} />
      {view === "overview" && <>
        <H1 sub={pre ? "Set the plan, then watch them grow." : "How your players are coming along."}>{pre ? "Your season starts here." : `Week ${wk || 1}: the growth report.`}</H1>
        <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: MOBILE ? 22 : 36, alignItems: "start" }}>
          <div>
            <Label>Worth knowing {pre ? "this preseason" : "this week"}</Label>
            <Card>{worth.length ? worth.map((w, i) => <Row key={w.k} title={w.title} meta={w.meta} sub={w.sub} ovr={w.ovr} delta={w.delta} onClick={() => setSel?.(w.p)} last={i === worth.length - 1} />)
              : <Row title="Nothing needs you" sub="Pick focus players in the Season plan to get the most out of your best young talent." last />}</Card>
          </div>
          <div>
            <Label right={<Pills items={[["growing", "Growing"], ["peak", "Peak"], ["declining", "Declining"]]} value={trend} onChange={(k) => { setTrend(k); setShowAll(false); }} label="Trend" />}>Next summer</Label>
            <Card>{shown.length ? shown.map((r, i) => <Row key={r.p.id} title={name(r.p)} meta={`${r.p.age} · ${posTag(r.p)}`} sub={ROLE[r.role][0].toUpperCase() + ROLE[r.role].slice(1)} ovr={r.p.ovr} delta={trend === "peak" ? null : Math.round(r.g * 10) / 10} onClick={() => setSel?.(r.p)} last={i === shown.length - 1} />)
              : <Row title="Nobody here" last />}</Card>
            {list.length > 5 && <button onClick={() => setShowAll((v) => !v)} style={{ background: "transparent", border: 0, color: "#cbd5e1", fontSize: 15, fontWeight: 700, padding: "12px 4px", cursor: "pointer" }}>{showAll ? "Show fewer" : `All ${list.length} ${trend === "peak" ? "at their peak" : trend} →`}</button>}
          </div>
        </div>
      </>}

      {view === "plan" && <>
        <div style={{ textAlign: "center" }}><H1 sub={locked ? "Locked in. You can still change it any time." : "Set them before the season starts."}>Plan your season.</H1></div>
        {(() => {
          const card = (n, label, title, sub, act, on, x = {}) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 16, background: C.cd, border: "1px solid #ffffff0d", borderRadius: 18, padding: MOBILE ? "14px 16px" : "18px 22px", minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: "#ffffff12", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>{n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: MOBILE ? 18 : 21, fontWeight: 900, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}{x.meta && <span style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginLeft: 8 }}>{x.meta}</span>}</div>
                <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 3 }}>{sub}</div>
              </div>
              {x.ovr != null && <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}><span style={{ fontSize: 26, fontWeight: 900 }}>{x.ovr}</span><span style={{ fontSize: 16, fontWeight: 800, color: tone(x.delta) }}>{sign(x.delta)}</span></div>}
              <button onClick={on} style={{ border: 0, borderRadius: 99, background: "#ffffff14", color: "#fff", padding: "10px 18px", fontSize: 15, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>{act}</button>
            </div>
          );
          const fp = (side) => roster.find((p) => focus?.[side] != null && String(p.id) === String(focus[side]));
          const fcard = (n, side, label) => { const p = fp(side); return card(n, label, p ? p.name : "Nobody yet", "Extra coaching every week", p ? "Change" : "Choose", () => setFocusOpen(side), p ? { meta: `${p.age} · ${posTag(p)}`, ovr: p.ovr, delta: perSeason(p) } : {}); };
          const nCamp = rows.filter((r) => inCamp(camp, r.p)).length;
          return <>
            <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>{fcard(1, "off", "Offensive focus player")}{fcard(2, "def", "Defensive focus player")}</div>
            <div style={{ display: "grid", gap: 14 }}>
              {card(3, "Camp priority", CAMP[camp] || "Balanced", CAMP_GROUPS_SUB(camp, nCamp), "Change", () => setCampOpen(true))}
              {card(4, "Young players", `${young.filter((r) => r.role !== "backup").length} playing · ${buried.length} stuck behind someone`, buried[0] ? `Most to gain from snaps: ${name(buried[0].p)} (${posTag(buried[0].p)})` : "Every young player with upside is getting snaps", "Review", () => setView("young"))}
            </div>
          </>;
        })()}
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button onClick={() => setPlanYr?.(yr)} disabled={locked} style={{ border: 0, borderRadius: 99, background: locked ? "#ffffff14" : "#16a34a", color: "#fff", padding: "16px 46px", fontSize: 18, fontWeight: 900, cursor: locked ? "default" : "pointer" }}>{locked ? "Plan locked in" : "Lock in the plan"}</button>
        </div>
      </>}

      {view === "young" && <>
        <H1 sub={`${young.length} players 24 and under. Snaps are what grow them.`}>Where your young players play.</H1>
        {(() => {
          const nc = MOBILE ? 1 : young.length > 10 ? 3 : 2, per = Math.ceil(young.length / nc);
          const rowOf = (r, i, arr) => {
            const st = r.role === "starter" || r.g >= 2 ? ["Growing", "#4ade80"] : r.role === "rotation" || r.g >= 1 ? ["On track", "#e2e8f0"] : (r.p.truePot ?? r.p.pot ?? 0) - r.p.ovr >= 8 ? ["Needs snaps", "#facc15"] : ["Long shot", "#f87171"];
            return <Row key={r.p.id} title={name(r.p)} meta={`${r.p.age} · ${posTag(r.p)}`} sub={<><span style={{ color: st[1], fontWeight: 700 }}>{st[0]}</span>{` · ${ROLE[r.role]}${isFocus(r.p) ? " · focus player" : ""}`}<DevWord p={r.p} /></>} ovr={r.p.ovr} delta={Math.round(r.g * 10) / 10} onClick={() => setSel?.(r.p)} last={i === arr.length - 1} />;
          };
          const cols = Array.from({ length: nc }, (_, k) => young.slice(k * per, (k + 1) * per)).filter((c) => c.length);
          return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, gap: 16, alignItems: "start" }}>{cols.map((c, k) => <Card key={k}>{c.map((r, i) => rowOf(r, i, c))}</Card>)}</div>;
        })()}
        {onDepth && buried.length > 0 && <div style={{ textAlign: "center", marginTop: 18 }}><button onClick={onDepth} style={{ border: 0, borderRadius: 99, background: "#ffffff14", color: "#fff", padding: "12px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Give them snaps on the depth chart</button></div>}
      </>}

      {focusOpen && (() => {
        const side = focusOpen, list = roster.filter((p) => (side === "off" ? OFFENSE : DEFENSE).includes(p.pos) && !p.injured).sort((a, b) => perSeason(b) - perSeason(a) || b.ovr - a.ovr);
        const cur = focus?.[side];
        return <Sheet title={side === "off" ? "Offensive focus player" : "Defensive focus player"} onClose={() => setFocusOpen(false)}>
          <div style={{ fontSize: 14, color: "#94a3b8", margin: "2px 2px 10px" }}>Extra coaching every week. Young players with a high development trait gain the most.</div>
          {list.map((p, i) => { const on = String(cur) === String(p.id), d = devOf(p); return (
            <div key={p.id} onClick={() => { setFocus((f) => ({ ...f, [side]: on ? null : p.id })); setFocusOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: on ? "#ffffff14" : "transparent", borderTop: i && !on ? "1px solid #ffffff0d" : 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}<span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginLeft: 8 }}>{p.age} · {posTag(p)}</span></div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{on ? "Your focus player" : d && d !== "normal" ? (DEV_TRAITS?.[d]?.label || d[0].toUpperCase() + d.slice(1)) : "Normal development"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}><span style={{ fontSize: 22, fontWeight: 900 }}>{p.ovr}</span><span style={{ minWidth: 40, textAlign: "right", fontSize: 15, fontWeight: 800, color: tone(perSeason(p)) }}>{sign(perSeason(p))}</span></div>
            </div>); })}
        </Sheet>;
      })()}
      {campOpen && <Sheet title="Camp priority" onClose={() => setCampOpen(false)}>
        {Object.entries(CAMP).map(([k, l]) => (
          <button key={k} onClick={() => { setCamp?.(k); setCampOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: camp === k ? "#ffffff14" : "transparent", border: "1px solid #ffffff12", borderRadius: 14, padding: "12px 16px", marginBottom: 8, color: "#fff", cursor: "pointer" }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{l}</div><div style={{ fontSize: 14, color: "#94a3b8", marginTop: 3 }}>{k === "balanced" ? "Even time for every position group" : `${rows.filter((r) => inCamp(k, r.p)).length} players get extra work: about +0.7 each next summer`}</div>
          </button>
        ))}
      </Sheet>}
    </div>
  );
}

// The strip along the bottom of Home: the development plan, one tap away.
export function DevStrip({ yr, sp, planYr, focusNames, onOpen }) {
  const pre = sp !== "regular" && sp !== "playoffs";
  const line = pre && planYr !== yr ? "Plan your season" : focusNames.length ? `Focus: ${focusNames.join(" · ")}` : "Pick your focus players";
  return (
    <div onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 16, background: C.cd, border: "1px solid #ffffff0d", borderRadius: 14, padding: "8px 10px 8px 20px", marginTop: 12, cursor: "pointer" }}>
      <span style={{ fontSize: 15, color: "#94a3b8", fontWeight: 700 }}>Development</span>
      <span style={{ fontSize: 17, fontWeight: 800, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</span>
      <span style={{ background: "#ffffff14", borderRadius: 99, padding: "6px 16px", fontSize: 14, fontWeight: 800 }}>Open</span>
    </div>
  );
}
