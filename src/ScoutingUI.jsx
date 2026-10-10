// Scouting and draft screens: the Big Board (always in consensus order), your own list, the
// Combine, your scouting staff, and the prospect profile. Game state comes in as `g`.
import React, { useState, useMemo } from "react";
import { mockDraft } from "./mockDraft.js";
import { C, oC, PA_LABELS, Bdg, Btn, PN, Face, TeamLogo } from "./ui.jsx";
import {
  prospectRead, scoutProspect, interviewProspect, coverage, csRank, riskLabel, gradeTone,
  SCOUT_GROUPS, SCOUT_ROLES, SCOUT_TRAITS, DEV_TRAITS, COMBINE_TESTS, COMBINE_INVITES, SCOUT_PTS_START, SCOUT_PTS_WEEKLY, SCOUT_PTS_COMBINE,
  staffWindowOpen, SCOUT_SLOTS, slotKind, hireScout, releaseScout, swapScoutRoles, listIds, toggleList, moveOnList, pickTake, classGrade, gradeRank, scoutGroup, isSmallSchool, devOf,
  myBoard, REGIONS, regionOf, regionName, scoutRegion, RTRIP_COST, RPTS_START, RPTS_COMBINE, RPTS_WEEKLY, MAX_TRIPS,
} from "./scouting.js";

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
const TONE = { a: "#22c55e", b: "#60a5fa", c: "#f59e0b", d: "#ef4444", "": "#94a3b8" };
const htS = (i) => `${Math.floor(i / 12)}'${i % 12}"`;
const panel = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 };
const head = { fontSize: 14, fontWeight: 800, color: "#7dd3fc", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
const muted = { fontSize: 13, color: C.mt, lineHeight: 1.5 };
const chipBtn = (on) => ({ background: on ? C.bl + "33" : "transparent", color: on ? "#fff" : C.mt, border: `1px solid ${on ? C.bl : C.bd}`, padding: "5px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" });
const Right = ({ children }) => <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 400, letterSpacing: 0, color: C.mt, fontSize: 13 }}>{children}</span>;

// ---------- Small pieces ----------

// One of your reads: "??" (no idea), "B+" (a scout's general idea), "~72" (a report) or "72" (exact).
export function Read({ label, txt, title }) {
  const kind = txt === "??" ? "unk" : txt.startsWith("~") ? "est" : /^[A-D]/.test(txt) ? "gen" : "exact";
  const color = kind === "unk" ? "#475569" : kind === "gen" ? TONE[gradeTone(txt)] : kind === "exact" ? oC(+txt) : "#cbd5e1";
  return (
    <span title={title} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", minWidth: 36, padding: "1px 5px", borderRadius: 4, background: C.bg, lineHeight: 1.15, border: `1px ${kind === "gen" ? "dashed" : "solid"} ${kind === "exact" ? "#166534" : C.bd}` }}>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.8, color: C.mt }}>{label}</span>
      <b style={{ fontSize: 13, color }}>{txt}</b>
    </span>
  );
}

export function GradeChip({ g, small, title }) {
  if (!g) return null;
  const c = TONE[gradeTone(g)];
  return <span title={title} style={{ display: "inline-block", minWidth: small ? 22 : 28, textAlign: "center", padding: small ? "0 4px" : "1px 6px", borderRadius: 4, fontWeight: 800, fontSize: small ? 10 : 12, background: c + "22", color: c }}>{g}</span>;
}

const DEV_STYLE = { generational: ["#f472b6", "#9d174d"], superstar: ["#f5c542", "#8a6d1d"], star: ["#60a5fa", "#1e3a5f"], normal: ["#94a3b8", C.bd], late: ["#c4b5fd", "#6d5bd0"] };
export function DevChip({ dev, hint = "Development trait unknown. Your major scout reveals it with a full workup." }) {
  if (!dev || !DEV_STYLE[dev] || !DEV_TRAITS[dev]) return <span title={hint} style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: `1px dashed ${C.bd}`, color: "#475569", whiteSpace: "nowrap" }}>Dev ?</span>;
  const [c, b] = DEV_STYLE[dev];
  return <span title={DEV_TRAITS[dev].desc} style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: `1px solid ${b}`, color: c, background: c + "14", whiteSpace: "nowrap" }}>{DEV_TRAITS[dev].name}</span>;
}

export function CovTag({ read }) {
  const role = read.cov;
  const c = role === "major" ? "#f5c542" : role === "minor" ? "#60a5fa" : "#64748b";
  const crew = read.scout ? [read.scout, ...(read.others || [])] : [];
  const title = crew.length > 1 ? `${crew.length} scouts on it: ${crew.map((x) => x.name).join(", ")} all work ${SCOUT_GROUPS[read.scout.group].toLowerCase()}` : read.scout ? `${SCOUT_ROLES[role].name}: ${read.scout.name} (${SCOUT_GROUPS[read.scout.group].toLowerCase()})` : "None of your scouts covers this position group, so your front office's generalists file the reports.";
  return <span title={title} style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, border: `1px solid ${c}66`, color: c, whiteSpace: "nowrap" }}>{role === "office" ? "No scout" : crew.length > 1 ? `${crew.length} scouts` : SCOUT_ROLES[role].short}</span>;
}

function Arrow({ p }) {
  const c = p.cons;
  if (!c?.final || c.final === c.mid) return null;
  const up = c.final < c.mid;
  return <span title={`Preseason #${c.mid} → final #${c.final}`} style={{ display: "block", fontSize: 9, fontWeight: 700, color: up ? C.gn : C.rd }}>{up ? "▲" : "▼"}{Math.abs(c.mid - c.final)}</span>;
}

// On your scouts' board: where the consensus has him, and whether your scouts like him more or less.
function MyDelta({ mine, cons }) {
  const d = cons - mine;
  const c = d >= 10 ? C.gn : d <= -10 ? C.rd : "#64748b";
  return <span title={`Consensus #${cons}; your scouts #${mine}`} style={{ display: "block", fontSize: 9, fontWeight: 700, color: c }}>{Math.abs(d) >= 10 ? (d > 0 ? "▲" : "▼") : ""}cons {cons}</span>;
}

// ---------- Actions ----------

function useActions(g) {
  const swap = (np) => g.setDc((d) => ({ ...d, [np.draftYear]: (d[np.draftYear] || []).map((x) => (x.id === np.id ? np : x)) }));
  return {
    scout: (p) => {
      const r = scoutProspect(g.scouting, g.sp, p, g.teams, p.draftYear, g.yr);
      g.sm(r.msg);
      if (!r.ok) return;
      g.setScouting(r.sc);
      swap(r.p);
    },
    interview: (p) => {
      const r = interviewProspect(g.scouting, g.sp, p);
      g.sm(r.msg);
      if (!r.ok) return;
      g.setScouting(r.sc);
      swap(r.p);
    },
    toggle: (p) => g.setScouting((s) => toggleList(s, p.draftYear, p.id)),
    move: (p, dir) => g.setScouting((s) => moveOnList(s, p.draftYear, p.id, dir)),
  };
}

const canScoutClass = (g, cy) => cy === g.yr && g.sp !== "freeagency";
// Has this class been through the Combine yet? (runCombine grades every prospect in it.)
const tested = (p) => p.combPct !== undefined;

export function ScoutButton({ g, p, read }) {
  const a = useActions(g);
  if (!canScoutClass(g, p.draftYear)) return null;
  const pts = g.scouting?.pts || 0;
  const cost = read.cost;
  const tip = !cost ? "Fully scouted" : read.lvl === 0 ? `File a scouting report (${cost} point)` : read.cov === "major" ? `Full workup (${cost} points): exact ratings and his development trait` : `Full workup (${cost} points): a sharper read`;
  const label = !cost ? "✓ Done" : `${read.lvl === 0 ? "Scout" : "Workup"} (${cost})`;
  return (
    <span title={tip}>
      <Btn onClick={(e) => { e?.stopPropagation?.(); a.scout(p); }} disabled={!cost || pts < cost} bg={cost ? `${C.bl}22` : "transparent"} c={cost ? C.bl : C.mt} style={{ padding: "6px 12px", fontSize: 14, whiteSpace: "nowrap" }}>{label}</Btn>
    </span>
  );
}

// ---------- Big Board ----------

// A rating as you know it, in plain big type: "?" (no idea), "B+" (a scout's general idea),
// "~72" (a report's estimate) or "72" (exact).
function Val({ txt, title }) {
  const unk = txt === "??", gen = /^[A-D]/.test(txt), est = txt.startsWith("~");
  const color = unk ? "#475569" : gen ? TONE[gradeTone(txt)] : est ? "#cbd5e1" : oC(+txt);
  return <b title={title} style={{ fontSize: 18, color, fontVariantNumeric: "tabular-nums" }}>{unk ? "?" : txt}</b>;
}

const STATUS = (read) => (read.lvl >= 2 ? ["Full workup", C.gn] : read.lvl === 1 ? ["Report", "#60a5fa"] : ["—", "#475569"]);

function ProspectRow({ g, p, onDraft, canDraft, myRank }) {
  const a = useActions(g);
  const read = prospectRead(g.scouting, p);
  const listed = listIds(g.scouting, p.draftYear).includes(p.id);
  const [st, stc] = STATUS(read);
  const td = { padding: "10px 6px", borderBottom: `1px solid ${C.bd}66`, verticalAlign: "middle" };
  return (
    <tr onClick={() => g.setSel(p)} style={{ cursor: "pointer" }} onMouseOver={(e) => (e.currentTarget.style.background = "#1e293b55")} onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
      <td style={{ ...td, textAlign: "center", fontWeight: 800, fontSize: 16, color: myRank ? "#fcd34d" : "#94a3b8", width: 36 }}>{myRank || csRank(p)}{myRank ? <MyDelta mine={myRank} cons={csRank(p)} /> : <Arrow p={p} />}</td>
      <td style={{ ...td, width: 26 }}>
        <button onClick={(e) => { e.stopPropagation(); a.toggle(p); }} title={listed ? "Remove from your list" : "Add to your list"} aria-label={listed ? "Remove from your list" : "Add to your list"} style={{ background: "transparent", border: 0, cursor: "pointer", color: listed ? "#f5c542" : "#475569", fontSize: 20, padding: 0, lineHeight: 1 }}>{listed ? "★" : "☆"}</button>
      </td>
      <td style={{ ...td, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{p.name} <span className="sc-show"><Bdg pos={p.pos} /></span>{read.flag && <span title={read.flagWhy || "Your scouts red-flagged him: high bust risk."} style={{ fontSize: 11, fontWeight: 800, color: "#fee2e2", background: "#991b1b", borderRadius: 999, padding: "1px 7px", marginLeft: 6 }}>🚩 red flag</span>}{read.sleeper ? <span title={`${read.who} have seen through the board: he's a sleeper, much better than where he's ranked.`} style={{ fontSize: 11, fontWeight: 800, color: "#fdf2f8", background: "#be185d", borderRadius: 999, padding: "1px 7px", marginLeft: 6 }}>💎 sleeper</span> : read.hunch && <span title={`${read.who} has a hunch there's more to him than the board says. A report will tell.`} style={{ fontSize: 11, fontWeight: 800, color: "#f9a8d4", background: "#831843", borderRadius: 999, padding: "1px 7px", marginLeft: 6 }}>👀 hunch</span>}{read.devEarly && ["generational", "superstar"].includes(read.dev) && <span title={`${read.who} already see a ${read.dev} development trait.`} style={{ fontSize: 11, fontWeight: 800, color: read.dev === "generational" ? "#f472b6" : "#f5c542", border: `1px solid currentColor`, borderRadius: 999, padding: "1px 7px", marginLeft: 6 }}>{read.dev === "generational" ? "Generational" : "Superstar"}</span>}</div>
        <div className="sc-sub" style={{ fontSize: 13, color: C.mt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>{p.bio?.college} ({regionName(regionOf(p))}) · {p.age} yrs · {htS(p.ht_)} {p.wt}</div>
      </td>
      <td className="sc-hide" style={{ ...td, textAlign: "center" }}><Bdg pos={p.pos} /></td>
      <td style={{ ...td, textAlign: "center" }}><Val txt={read.ovr} /></td>
      <td style={{ ...td, textAlign: "center" }}><Val txt={read.pot} title={read.tier ? `Projects as: ${read.tier}` : undefined} /></td>
      <td className="sc-hide" style={{ ...td, textAlign: "center", fontSize: 13, color: stc, whiteSpace: "nowrap" }}>{st}</td>
      <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
        <ScoutButton g={g} p={p} read={read} />
        {onDraft && <Btn onClick={() => onDraft(p)} disabled={!canDraft} bg={C.gn} style={{ padding: "6px 12px", fontSize: 14, marginLeft: 6 }}>Draft</Btn>}
      </td>
    </tr>
  );
}

const sel = { background: C.bg, color: C.tx, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "7px 10px", fontSize: 14 };

export function Board({ g, classYr, fixedYr = false, onDraft, canDraft, title = "Big Board", page = 40 }) {
  const years = Object.keys(g.dc).map(Number).sort((x, y) => x - y);
  const [yrSel, setYrSel] = useState(null);
  const cy = fixedYr ? classYr : years.includes(yrSel) ? yrSel : classYr;
  const [pos, setPos] = useState("ALL");
  const [q, setQ] = useState("");
  const [show, setShow] = useState("all");
  const [n, setN] = useState(page);
  const [mine, setMine] = useState(false);
  const all = g.dc[cy] || [];
  const ranks = useMemo(() => (mine ? myBoard(g.scouting, all) : null), [mine, g.scouting, all]);
  const ids = listIds(g.scouting, cy);
  const list = all
    .filter((p) => pos === "ALL" || p.pos === pos)
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.bio?.college || "").toLowerCase().includes(q.toLowerCase()))
    .filter((p) => {
      if (show === "all") return true;
      if (["flagged", "redflags", "special", "regions"].includes(show)) {
        const r = prospectRead(g.scouting, p);
        return show === "flagged" ? r.sleeper || r.hunch : show === "redflags" ? r.flag : show === "special" ? ["generational", "superstar", "star"].includes(r.dev) : r.trips > 0;
      }
      return show === "scouted" ? p.scout?.lvl > 0 : show === "unscouted" ? !p.scout?.lvl : show === "list" ? ids.includes(p.id) : coverage(g.scouting, p).role !== "office";
    })
    .sort((a, b) => (ranks ? ranks.get(a.id) - ranks.get(b.id) : csRank(a) - csRank(b)));
  const final = all.some((p) => p.cons?.final);
  const climbers = ranks ? all.filter((p) => csRank(p) - ranks.get(p.id) >= 25).length : 0;
  const th = { padding: "6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.mt, borderBottom: `1px solid ${C.bd}`, textAlign: "center" };
  return (
    <div style={panel}>
      <style>{"@media (max-width: 640px) { .sc-hide { display: none } .sc-t td, .sc-t th { padding-left: 3px !important; padding-right: 3px !important } .sc-sub { max-width: 120px !important } .sc-t button { padding: 5px 8px !important; font-size: 13px !important } } @media (min-width: 641px) { .sc-show { display: none } }"}</style>
      <div style={head}>
        {title}
        <Right>
          {[[false, "Consensus"], [true, "Your scouts"]].map(([k, l]) => <button key={l} onClick={() => setMine(k)} style={{ ...chipBtn(mine === k), fontSize: 13, padding: "4px 12px" }}>{l}</button>)}
        </Right>
      </div>
      <div style={{ ...muted, marginBottom: 8 }}>{mine ? `Your scouts' board: everyone ranked on your own scouts' reads (and the development traits they've seen); where they don't know a player, they go with the consensus. ▲ means your scouts like him a lot more than the consensus does, ▼ a lot less.${climbers ? ` They have ${climbers} prospect${climbers > 1 ? "s" : ""} 25+ spots higher than the consensus.` : ""}` : `Consensus ${final ? "final" : "preseason"} rankings: what the league's analysts think. AI teams mostly draft off this board.`}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {!fixedYr && years.length > 1 && (
          <select value={cy} onChange={(e) => { setYrSel(+e.target.value); setN(page); }} aria-label="Draft class" style={sel}>
            {years.map((y) => <option key={y} value={y}>{y + 1} draft</option>)}
          </select>
        )}
        <select value={pos} onChange={(e) => { setPos(e.target.value); setN(page); }} aria-label="Position" style={sel}>
          {["ALL", ...POS].map((x) => <option key={x} value={x}>{x === "ALL" ? "All positions" : x}</option>)}
        </select>
        <select value={show} onChange={(e) => { setShow(e.target.value); setN(page); }} aria-label="Show" style={sel}>
          <option value="all">Everyone</option>
          <option value="covered">Groups my scouts cover</option>
          <option value="scouted">Scouted</option>
          <option value="unscouted">Not scouted yet</option>
          <option value="list">On my list</option>
          <option value="flagged">💎 Sleepers & hunches</option>
          <option value="redflags">🚩 Red flags (bust risks)</option>
          <option value="special">⭐ Special dev traits spotted</option>
          <option value="regions">🗺️ From regions I've scouted</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(page); }} placeholder="Search name or college" aria-label="Search prospects" style={{ ...sel, flex: "1 1 160px" }} />
      </div>
      {cy !== g.yr && <div style={{ ...muted, marginBottom: 8 }}>An early look at a future class: your scouts can only file reports on the {g.yr} class.</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="sc-t" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>#</th><th style={th}></th><th style={{ ...th, textAlign: "left" }}>PLAYER</th><th className="sc-hide" style={th}>POS</th><th style={th}>OVR</th><th style={th}>POT</th><th className="sc-hide" style={th}>SCOUTED</th><th style={th}></th></tr></thead>
          <tbody>{list.slice(0, n).map((p) => <ProspectRow key={p.id} g={g} p={p} onDraft={onDraft} canDraft={canDraft} myRank={ranks?.get(p.id)} />)}</tbody>
        </table>
      </div>
      {!list.length && <div style={{ ...muted, padding: 8 }}>No prospects match.</div>}
      {list.length > n && <div style={{ marginTop: 10, textAlign: "center" }}><Btn onClick={() => setN(n + page)} bg={C.bd} c="#cbd5e1" style={{ fontSize: 14, padding: "6px 14px" }}>Show more ({list.length - n} left)</Btn></div>}
    </div>
  );
}

export function Legend() {
  return <div style={{ ...muted, marginBottom: 10 }}><b style={{ color: "#cbd5e1" }}>Reading the board:</b> <b style={{ color: "#64748b" }}>?</b> not scouted yet · <b style={{ color: TONE.a }}>B+</b> your scout's rough idea · <b style={{ color: "#cbd5e1" }}>~84</b> estimate from a report · <b style={{ color: C.gn }}>84</b> exact. Tap a player for his full profile.</div>;
}

// ---------- Your list ----------

export function YourList({ g, classYr, onDraft, canDraft, compact = false }) {
  const a = useActions(g);
  const ids = listIds(g.scouting, classYr);
  const avail = new Map((g.dc[classYr] || []).map((p) => [p.id, p]));
  const taken = new Map((g.draftLog || []).filter((d) => d.player?.draftYear === classYr).map((d) => [d.player.id, d]));
  const rows = ids.map((id) => ({ id, p: avail.get(id), d: taken.get(id) })).filter((x) => x.p || x.d);
  const shown = compact ? rows.filter((x) => x.p).slice(0, 6) : rows;
  return (
    <div style={{ ...panel, background: "#0d1a0d", border: "1px solid #166534" }}>
      <div style={{ ...head, color: C.gn }}>⭐ YOUR LIST<Right>{rows.filter((x) => x.p).length} available</Right></div>
      {!rows.length && <div style={muted}>Star prospects on the Big Board (☆) to build your own ranking. It stays in the order you set, and if the draft clock runs out you take the top name on it.</div>}
      {shown.map(({ id, p, d }) => {
        const i = ids.indexOf(id);
        const pl = p || d.player;
        const read = p ? prospectRead(g.scouting, p) : null;
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: `1px solid ${C.bd}44`, fontSize: 16, flexWrap: "wrap", opacity: p ? 1 : 0.5 }}>
            <b style={{ minWidth: 28, color: "#fef3c7", fontSize: 18 }}>{i + 1}.</b>
            <Bdg pos={pl.pos} />
            {p ? <PN p={p} setSel={g.setSel} /> : <span>{pl.name}</span>}
            <span style={{ color: C.mt, fontSize: 13 }}>consensus #{csRank(pl)}</span>
            {read && <span style={{ display: "inline-flex", gap: 14, marginLeft: "auto", alignItems: "baseline" }}><span style={{ fontSize: 12, color: C.mt }}>OVR <Val txt={read.ovr} /></span><span style={{ fontSize: 12, color: C.mt }}>POT <Val txt={read.pot} /></span></span>}
            <span style={{ display: "inline-flex", gap: 3, alignItems: "center", marginLeft: read ? 0 : "auto" }}>
              {d ? <span style={{ color: C.mt, fontSize: 11 }}>#{d.overall} {g.teams[d.owner]?.ab}</span> : (
                <>
                  {!compact && <button aria-label="Move up" disabled={i === 0} onClick={() => a.move(pl, -1)} style={{ background: "transparent", color: C.mt, border: "none", cursor: "pointer", fontSize: 20 }}>↑</button>}
                  {!compact && <button aria-label="Move down" disabled={i === ids.length - 1} onClick={() => a.move(pl, 1)} style={{ background: "transparent", color: C.mt, border: "none", cursor: "pointer", fontSize: 20 }}>↓</button>}
                  {onDraft && <Btn onClick={() => onDraft(p)} disabled={!canDraft} bg={C.gn} style={{ padding: "5px 12px", fontSize: 14 }}>Draft</Btn>}
                </>
              )}
              {!compact && <Btn onClick={() => a.toggle(pl)} bg="#7f1d1d22" c="#fca5a5" style={{ fontSize: 14, padding: "4px 9px" }}>✕</Btn>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Scouting staff ----------

function ScoutCard({ scout, role, children }) {
  const rc = role === "pool" ? "#94a3b8" : slotKind(role) === "major" ? "#f5c542" : "#60a5fa";
  return (
    <div style={{ background: role === "pool" ? "#0d1424" : C.cd, border: `1px ${scout ? "solid" : "dashed"} ${C.bd}`, borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: rc }}>{SCOUT_ROLES[role]?.name || "Available"}</span>
        {scout && <b style={{ fontSize: 12 }}>{SCOUT_GROUPS[scout.group]}</b>}
      </div>
      {scout ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Face s={scout.face} sz={26} /><span style={{ fontSize: 15, fontWeight: 800 }}>{scout.name}</span></div>
          <div style={muted}>{scout.age} · {scout.bg}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.mt, width: 62 }}>EVALUATION</span>
            <div style={{ flex: 1, height: 5, background: C.bg, borderRadius: 3 }}><div style={{ width: `${scout.eval}%`, height: "100%", background: oC(scout.eval), borderRadius: 3 }} /></div>
            <b style={{ fontSize: 12, color: oC(scout.eval) }}>{scout.eval}</b>
          </div>
          {scout.trait ? <div style={{ fontSize: 11 }}><span style={{ background: "#4c1d95", color: "#ddd6fe", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{SCOUT_TRAITS[scout.trait].name}</span> <span style={{ color: C.mt }}>{SCOUT_TRAITS[scout.trait].desc}</span></div> : <div style={{ ...muted, color: "#475569" }}>No special trait</div>}
        </>
      ) : <div style={muted}>Vacant. Hire someone from the list below.</div>}
      {children}
    </div>
  );
}

export function ScoutsView({ g }) {
  const s = g.scouting || {};
  const open = staffWindowOpen(g.sp);
  const act = (r) => { g.sm(r.msg); if (r.ok) g.setScouting(r.sc); };
  const pool = [...(s.pool || [])].sort((a, b) => a.group.localeCompare(b.group) || b.eval - a.eval);
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,250px),1fr))", gap: 8, marginBottom: 8 };
  return (
    <div>
      <div style={panel}>
        <div style={head}>SCOUTING POINTS<Right><b style={{ fontSize: 22, color: C.gd }}>{s.pts || 0}</b></Right></div>
        <div style={muted}>Scouting has its own budget, separate from SP. You start each season with {SCOUT_PTS_START}, earn {SCOUT_PTS_WEEKLY} every week of the regular season and get {SCOUT_PTS_COMBINE} more at the Combine. A scouting report costs 1 point and a full workup 2 more. Unused points expire when the next season starts.</div>
      </div>
      <div style={grid}>
        {SCOUT_SLOTS.map((role) => (
          <ScoutCard key={role} scout={s[role]} role={role}>
            <div style={{ ...muted, marginTop: 3 }}>{SCOUT_ROLES[role].desc}</div>
            {open && s[role] && <div><Btn onClick={() => act(releaseScout(s, g.sp, role))} bg="#7f1d1d" c="#fca5a5" style={{ fontSize: 10, padding: "1px 6px", marginTop: 4 }}>Let go</Btn></div>}
          </ScoutCard>
        ))}
      </div>
      {open && SCOUT_SLOTS.some((k) => s[k]) && <div style={{ marginBottom: 8 }}><Btn onClick={() => act(swapScoutRoles(s, g.sp))} bg={C.bd} c="#cbd5e1" style={{ fontSize: 11 }}>⇄ Swap major and minor roles</Btn></div>}
      <div style={panel}>
        <div style={head}>WHAT YOUR SCOUTS CAN TELL YOU</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%", minWidth: 520 }}>
            <thead><tr style={{ color: C.mt, textAlign: "left" }}><th style={{ padding: 4 }}></th><th style={{ padding: 4 }}>Without a report</th><th style={{ padding: 4 }}>Scouting report (1 pt)</th><th style={{ padding: 4 }}>Full workup (+2 pts)</th></tr></thead>
            <tbody style={{ color: "#cbd5e1" }}>
              <tr style={{ borderTop: `1px solid ${C.bd}` }}><td style={{ padding: 4 }}><b>Major scouts' groups</b>{["major", "major2"].filter((k) => s[k]).map((k) => <div key={k} style={{ color: C.mt }}>{SCOUT_GROUPS[s[k].group]}</div>)}</td><td style={{ padding: 4 }}>A general idea of every prospect's ceiling (letter grade)</td><td style={{ padding: 4 }}>Close estimates, tool grades, strengths, an NFL comparable</td><td style={{ padding: 4 }}><b>Exact ratings and his development trait</b></td></tr>
              <tr style={{ borderTop: `1px solid ${C.bd}` }}><td style={{ padding: 4 }}><b>Minor scouts' groups</b>{["minor", "minor2"].filter((k) => s[k]).map((k) => <div key={k} style={{ color: C.mt }}>{SCOUT_GROUPS[s[k].group]}</div>)}</td><td style={{ padding: 4 }}>A rougher general idea of every prospect's ceiling</td><td style={{ padding: 4 }}>Looser estimates and the full write-up</td><td style={{ padding: 4 }}>Sharper estimates (no development trait)</td></tr>
              <tr style={{ borderTop: `1px solid ${C.bd}` }}><td style={{ padding: 4 }}><b>Other groups</b></td><td style={{ padding: 4 }}>Only the consensus ranking</td><td style={{ padding: 4 }}>A rough estimate from the front office</td><td style={{ padding: 4 }}>A slightly better estimate</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ ...muted, marginTop: 6 }}>Spread your four scouts across four groups to see more of the class, or stack them on one group for sharper reads there. A scout's Evaluation rating sets how close his reads are. The Big Board never reorders when you scout: it's always in consensus order, and your own ranking lives in Your list.</div>
      </div>
      <div style={panel}>
        <div style={head}>SCOUTS AVAILABLE</div>
        {!open && <div style={{ background: "#78350f33", border: "1px solid #b4530966", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "#fcd34d", marginBottom: 8 }}>Your scouts are on the road for the season. You can change your staff in free agency or the preseason.</div>}
        <div style={grid}>
          {pool.map((sc) => (
            <ScoutCard key={sc.id} scout={sc} role="pool">
              {open && (
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  {SCOUT_SLOTS.map((role) => (
                    <span key={role} title={`Hire him as your ${SCOUT_ROLES[role].name.toLowerCase()}${s[role] ? ` (replacing ${s[role].name})` : ""}`}>
                      <Btn onClick={() => act(hireScout(s, g.sp, sc.id, role))} bg={`${C.gn}22`} c={C.gn} style={{ fontSize: 10, padding: "1px 6px" }}>Hire as {SCOUT_ROLES[role].short.toLowerCase()}</Btn>
                    </span>
                  ))}
                </div>
              )}
            </ScoutCard>
          ))}
          {!pool.length && <div style={muted}>Nobody's looking for work right now.</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- The Combine ----------

export function BuzzFeed({ g, buzz, limit }) {
  const tag = { up: ["RISING", C.gn], down: ["FALLING", C.rd], best: ["TOP TEST", "#60a5fa"], news: ["NEWS", "#f59e0b"] };
  const open = (pid) => { const p = (g.dc[g.yr] || []).find((x) => x.id === pid); if (p) g.setSel(p); };
  return (
    <div style={{ background: "#0a1020", border: "1px solid #7c3aed44", borderRadius: 5, padding: "5px 8px", marginBottom: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>📡 DRAFT BUZZ</div>
      {(buzz || []).slice(0, limit || 99).map((x, i) => (
        <div key={i} onClick={() => open(x.pid)} style={{ display: "flex", gap: 6, alignItems: "baseline", fontSize: 11, padding: "2px 3px", borderLeft: `2px solid ${(tag[x.kind] || tag.news)[1]}`, marginBottom: 2, cursor: "pointer" }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: (tag[x.kind] || tag.news)[1], minWidth: 52 }}>{(tag[x.kind] || tag.news)[0]}</span>
          <span style={{ color: "#cbd5e1" }}>{x.text}</span>
        </div>
      ))}
      {!buzz?.length && <div style={muted}>No buzz yet.</div>}
    </div>
  );
}

export function CombineView({ g, buzz }) {
  const a = useActions(g);
  const live = g.sp === "combine";
  const rows = (g.dc[g.yr] || []).filter((p) => tested(p) && p.combine).sort((x, y) => csRank(x) - csRank(y));
  const [n, setN] = useState(40);
  const th = { padding: "3px 5px", textAlign: "right", color: C.mt, fontWeight: 700, whiteSpace: "nowrap" };
  const td = { padding: "3px 5px", textAlign: "right", whiteSpace: "nowrap" };
  return (
    <div>
      {live && (
        <div style={{ ...panel, border: "1px solid #7c3aed" }}>
          <div style={{ ...head, color: "#c4b5fd" }}>BEFORE THE DRAFT</div>
          <div style={{ fontSize: 12 }}>Interviews left: <b>{g.scouting?.interviewsLeft || 0}</b> · Scouting points: <b>{g.scouting?.pts || 0}</b></div>
          <div style={{ ...muted, marginTop: 4 }}>Interviews read a prospect's work ethic, which tends to go with how fast he develops. Spend your last scouting points, then head to the draft with "→ Draft".</div>
        </div>
      )}
      <BuzzFeed g={g} buzz={buzz} />
      <div style={panel}>
        <div style={head}>COMBINE RESULTS<Right>{COMBINE_INVITES} invited · consensus final order</Right></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.bd}` }}>
                <th style={{ ...th, textAlign: "left" }}>#</th><th style={{ ...th, textAlign: "left" }}>Player</th><th style={th}>Size</th>
                {COMBINE_TESTS.map((t) => <th key={t.k} style={th} title={`${t.name}${t.unit ? ` (${t.unit})` : ""}${t.lowGood ? ", lower is better" : ""}`}>{t.short}</th>)}
                <th style={th}>Grade</th><th style={th}>Interview</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, n).map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.bd}44` }}>
                  <td style={{ ...td, textAlign: "left", color: "#94a3b8" }}>{csRank(p)}</td>
                  <td style={{ ...td, textAlign: "left" }}><PN p={p} setSel={g.setSel} /> <Bdg pos={p.pos} /></td>
                  <td style={{ ...td, color: C.mt }}>{htS(p.ht_)} {p.wt}</td>
                  {COMBINE_TESTS.map((t) => <td key={t.k} style={{ ...td, color: p.combPcts?.[t.k] >= 0.9 ? C.gn : "#cbd5e1", fontWeight: p.combPcts?.[t.k] >= 0.9 ? 800 : 400 }}>{(+p.combine[t.k]).toFixed(t.dp)}</td>)}
                  <td style={td}><GradeChip g={p.combGrade} small /></td>
                  <td style={td}>
                    {p.scout?.intv ? <span title={p.scout.intv.note} style={{ fontSize: 11 }}>Work ethic <GradeChip g={p.scout.intv.grade} small /></span>
                      : live ? <Btn onClick={() => a.interview(p)} disabled={!(g.scouting?.interviewsLeft > 0)} bg="#7c3aed33" c="#c4b5fd" style={{ fontSize: 10, padding: "1px 6px" }}>Interview</Btn>
                      : <span style={{ color: "#475569" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > n && <div style={{ marginTop: 6 }}><Btn onClick={() => setN(n + 40)} bg={C.bd} c="#cbd5e1" style={{ fontSize: 11, padding: "2px 8px" }}>Show more ({rows.length - n} left)</Btn></div>}
        <div style={{ ...muted, marginTop: 5 }}>Grades compare each prospect's testing with the other invitees at his position. Green results are in the top 10%; the 40, 3-cone and shuttle are timed, so lower is better.</div>
      </div>
    </div>
  );
}

// ---------- Draft day ----------

export function TopProspects({ g }) {
  const top = (g.dc[g.yr] || []).slice(0, 5);
  if (!top.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: "#475569", letterSpacing: 2, marginBottom: 4 }}>📋 TOP OF THE BOARD</div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
        {top.map((p) => {
          const read = prospectRead(g.scouting, p);
          return (
            <div key={p.id} onClick={() => g.setSel(p)} style={{ minWidth: 112, background: "#0d1424", border: "1px solid #1e3a5f", borderRadius: 4, padding: "6px 8px", flexShrink: 0, cursor: "pointer" }}>
              <div style={{ fontSize: 10, color: "#475569" }}>CONSENSUS #{csRank(p)}</div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#e2e8f0" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{p.pos} • {p.bio?.college}</div>
              <div style={{ display: "flex", gap: 3, marginTop: 4, alignItems: "center" }}><Read label="OVR" txt={read.ovr} /><Read label="POT" txt={read.pot} />{p.combGrade && <GradeChip g={p.combGrade} small title="Combine" />}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The analysts' grades for every team's class, once the draft is over.
export function DraftGrades({ g }) {
  const by = {};
  for (const d of g.draftLog || []) if (d.grade) (by[d.owner] ||= []).push(d.grade);
  const rows = Object.entries(by).map(([tid, gs]) => ({ t: g.teams[tid], gr: classGrade(gs) })).filter((x) => x.t && x.gr).sort((a, b) => gradeRank(b.gr) - gradeRank(a.gr));
  if (!rows.length) return null;
  return (
    <div style={panel}>
      <div style={head}>DRAFT GRADES</div>
      <div style={{ ...muted, marginBottom: 6 }}>Instant grades compare where each player went with where the consensus board had him. Analysts don't know what your scouts know.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))", gap: 4 }}>
        {rows.map(({ t, gr }) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderRadius: 4, background: C.bg, boxShadow: t.id === g.ui ? `0 0 0 1px ${C.gn}` : "none" }}>
            <b style={{ fontSize: 12 }}>{t.ab}</b><span style={{ marginLeft: "auto" }}><GradeChip g={gr} small /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- The scouting tab ----------

// Scouting points left, big enough to read at a glance.
export function ScoutPtsBadge({ pts = 0 }) {
  const on = pts > 0;
  return (
    <div title="Spend them on scouting reports and workups" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 16px", borderRadius: 12, background: on ? `linear-gradient(135deg, ${C.gd}33, #0b1220)` : C.cd, border: `2px solid ${on ? C.gd : C.bd}` }}>
      <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: on ? C.gd : C.mt, fontVariantNumeric: "tabular-nums" }}>{pts}</span>
      <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, lineHeight: 1.25, color: on ? "#fde68a" : C.mt }}>SCOUTING<br />POINT{pts === 1 ? "" : "S"} LEFT</span>
    </div>
  );
}

// Your picks in this year's draft, round by round. Picks you've used gray out and show who you took.
export function PickTracker({ g }) {
  const picks = (g.draftPicks || []).filter((pk) => pk.owner === g.ui && (pk.yr == null || pk.yr === g.yr)).sort((a, b) => a.overall - b.overall);
  const made = new Map((g.draftLog || []).map((d) => [d.id, d]));
  const left = picks.filter((pk) => !made.has(pk.id)).length;
  // Before the draft order is set, where each pick projects from the standings (worst record
  // first, the Super Bowl champion last).
  const ts = g.teams || [];
  const ord = ts.map((t, i) => i).sort((a, b) => (a === g.pb?.ch) - (b === g.pb?.ch) || ts[a].w - ts[b].w || (ts[a].pf - ts[a].pa) - (ts[b].pf - ts[b].pa));
  const slot = (pk) => ord.indexOf(pk.orig ?? pk.owner) + 1;
  return (
    <div style={{ ...panel, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 900 }}>Your picks</span>
        <span style={{ fontSize: 15, color: left ? C.gn : C.mt, fontWeight: 800 }}>{left} of {picks.length} left</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((rd) => {
          const mine = picks.filter((pk) => pk.rd === rd);
          const open = mine.filter((pk) => !made.has(pk.id)).length;
          return (
            <div key={rd} style={{ borderRadius: 10, padding: "8px 10px", background: open ? `${C.bl}1f` : "#0b1220", border: `1px solid ${open ? C.bl : C.bd}`, opacity: mine.length ? 1 : 0.55 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, color: open ? "#bfdbfe" : C.mt }}>ROUND {rd}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: open ? "#fff" : C.mt }}>{mine.length}</span>
              </div>
              {!mine.length && <div style={{ fontSize: 13, color: C.mt }}>No pick</div>}
              {mine.map((pk) => {
                const d = made.get(pk.id);
                return (
                  <div key={pk.id} style={{ fontSize: 13, marginTop: 4, color: d ? C.mt : "#e2e8f0", fontWeight: d ? 500 : 800 }}>
                    <span style={{ textDecoration: d ? "line-through" : "none" }}>{g.sp === "draft" ? `#${pk.overall}` : slot(pk) > 0 ? `Proj. pick ${slot(pk)}${pk.orig != null && pk.orig !== g.ui ? ` (${ts[pk.orig]?.ab})` : ""}` : "Pick —"}</span>
                    {d ? <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>✓ {d.player?.name || d.name || "Used"}{d.player?.pos ? ` · ${d.player.pos}` : ""}</div> : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ATHLETIC = { spd: "Speed", acc: "Acceleration", agi: "Agility", str: "Strength", jmp: "Jumping", end: "Endurance" };
// A player's three best ratings: position skills and athletic traits together.
export function topRatings(p, n = 3) {
  const all = [...Object.entries(p.posAttrs || {}).map(([k, v]) => [PA_LABELS[k] || k, v]), ...Object.entries(ATHLETIC).filter(([k]) => typeof p[k] === "number").map(([k, l]) => [l, p[k]])];
  return all.sort((a, b) => b[1] - a[1]).slice(0, n);
}

// The moment you make a pick: who you got, his development trait and his three best ratings.
export function DraftReveal({ pick, team, onClose }) {
  const p = pick.p;
  const dev = devOf(p);
  const [fg, bg] = DEV_STYLE[dev] || DEV_STYLE.normal;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,15,.86)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Your draft pick" style={{ width: "100%", maxWidth: 460, borderRadius: 16, overflow: "hidden", border: `2px solid ${fg}`, background: "#0b1220", boxShadow: `0 0 70px ${fg}44`, animation: "drPop .45s cubic-bezier(.2,.9,.3,1.3) both" }}>
        <style>{"@keyframes drPop { from { opacity: 0; transform: scale(.7) } to { opacity: 1; transform: none } } @keyframes drFlip { from { opacity: 0; transform: rotateX(90deg) } to { opacity: 1; transform: none } }"}</style>
        <div style={{ padding: "16px 20px 12px", background: `linear-gradient(135deg, ${team.clr}cc, #0b1220)`, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#ffffffb0" }}>ROUND {pick.rd} · PICK #{pick.overall}</div>
          <div style={{ fontSize: 13, color: "#ffffffb0", marginTop: 2 }}>The {team.city} {team.name} select</div>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.15, marginTop: 6 }}>{p.name}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 6, fontSize: 15, color: "#e2e8f0" }}><Bdg pos={p.pos} />{p.bio?.college || p.college || ""}{p.age ? ` · Age ${p.age}` : ""}</div>
        </div>
        <div style={{ padding: "14px 20px 18px" }}>
          <div style={{ textAlign: "center", padding: "12px 10px", borderRadius: 12, border: `2px solid ${bg}`, background: `${fg}14`, animation: "drFlip .5s .35s ease-out both" }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: C.mt }}>DEVELOPMENT TRAIT</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: fg, margin: "2px 0" }}>{DEV_TRAITS[dev]?.name || dev}</div>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>{DEV_TRAITS[dev]?.desc}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {topRatings(p).map(([l, v], i) => (
              <div key={l} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 10, background: C.cd, border: `1px solid ${C.bd}`, animation: `drFlip .4s ${0.6 + i * 0.15}s ease-out both` }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: oC(v) }}>{v}</div>
                <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 12, fontSize: 15 }}>
            <span style={{ color: C.mt }}>OVR <b style={{ color: oC(p.ovr), fontSize: 18 }}>{p.ovr}</b></span>
            <span style={{ color: C.mt }}>POT <b style={{ color: C.bl, fontSize: 18 }}>{p.pot}</b></span>
            {pick.grade && <span style={{ color: C.mt }}>Grade <b style={{ color: C.gd, fontSize: 18 }}>{pick.grade}</b></span>}
          </div>
          {pick.take && <div style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 8, fontStyle: "italic" }}>{pick.take}</div>}
          <Btn onClick={onClose} bg={C.gn} style={{ width: "100%", marginTop: 14, fontSize: 16, padding: "10px 0", fontWeight: 900 }}>Continue the draft</Btn>
        </div>
      </div>
    </div>
  );
}

// Who's on the clock and who picks next, so you can see a trade partner coming.
export function DraftQueue({ picks, idx, teams, ui, n = 12 }) {
  const next = picks.slice(idx, idx + n);
  if (!next.length) return null;
  const mine = picks.slice(idx).find((pk) => pk.owner === ui);
  return (
    <div style={{ ...panel, padding: "12px 12px 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, color: "#e2e8f0" }}>UP NEXT</span>
        {mine && <span style={{ marginLeft: "auto", fontSize: 13, color: mine === next[0] ? C.gn : C.mt, fontWeight: 700 }}>{mine === next[0] ? "You're on the clock" : `Your pick in ${picks.indexOf(mine) - idx}`}</span>}
      </div>
      {next.map((pk, i) => {
        const t = teams[pk.owner], me = pk.owner === ui;
        return (
          <div key={pk.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 6px", borderRadius: 8, marginBottom: 2, background: i === 0 ? `${t.clr}55` : me ? `${C.gn}1f` : "transparent", border: `1px solid ${i === 0 ? "#ffffff40" : me ? C.gn : "transparent"}` }}>
            <span style={{ width: 54, fontSize: 12, fontWeight: 800, color: i === 0 ? "#fff" : C.mt, fontVariantNumeric: "tabular-nums" }}>R{pk.rd} #{pk.overall}</span>
            <TeamLogo t={t} sz={24} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: me || i === 0 ? 800 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.city} {t.name}{me ? " (you)" : ""}</span>
            {i === 0 && <span style={{ fontSize: 11, fontWeight: 900, color: "#facc15", letterSpacing: 1 }}>ON THE CLOCK</span>}
            {pk.orig != null && pk.orig !== pk.owner && <span title={`From ${teams[pk.orig]?.name}`} style={{ fontSize: 11, color: C.mt }}>via {teams[pk.orig]?.ab}</span>}
          </div>
        );
      })}
    </div>
  );
}

// The order the next draft would go in today: the live draft from the pick on the clock, or the
// current standings (worst record first) with traded picks going to their owners.
export function projectedOrder(g, rounds = 2) {
  if (g.sp === "draft" && g.curPick) return (g.draftPicks || []).slice(g.draftIdx || 0).filter((pk) => pk.rd <= rounds);
  const order = (g.teams || []).map((t, i) => i).sort((a, b) => g.teams[a].w - g.teams[b].w || (g.teams[a].pf - g.teams[a].pa) - (g.teams[b].pf - g.teams[b].pa));
  const out = [];
  for (let rd = 1; rd <= rounds; rd++) order.forEach((tid, i) => {
    const pk = (g.draftPicks || []).find((x) => x.yr === g.yr && x.orig === tid && x.rd === rd);
    out.push({ id: `m${rd}-${tid}`, rd, overall: (rd - 1) * 32 + i + 1, owner: pk ? pk.owner : tid, orig: tid });
  });
  return out;
}

// The experts' mock draft for this class, with your picks and your list highlighted, and a
// heads-up when someone you want is projected to go before you're up.
export function MockDraft({ g }) {
  const [rounds, setRounds] = useState(1);
  const order = projectedOrder(g, 2);
  const cls = (g.dc?.[g.yr] || []);
  const mock = useMemo(() => mockDraft({ order, cls, teams: g.teams, seed: `${g.yr}:${order[0]?.overall || 0}` }), [cls.length, order.length, order[0]?.id, g.yr]);
  const listed = new Set(listIds(g.scouting, g.yr));
  const myNext = order.find((pk) => pk.owner === g.ui);
  const before = myNext ? mock.filter((m) => listed.has(m.player.id) && m.pick.overall < myNext.overall) : [];
  const td = { padding: "9px 6px", borderBottom: `1px solid ${C.bd}66`, verticalAlign: "middle" };
  return (
    <div>
      <div style={{ ...panel, display: "flex", gap: "6px 16px", flexWrap: "wrap", alignItems: "center", fontSize: 15 }}>
        <span><b>Experts' mock draft</b> <span style={{ color: C.mt }}>· consensus board plus each club's needs{g.sp === "draft" && g.curPick ? ", updated live" : ", in today's draft order"}</span></span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>{[1, 2].map((r) => <button key={r} onClick={() => setRounds(r)} style={{ ...chipBtn(rounds === r), fontSize: 14, padding: "6px 12px" }}>{r === 1 ? "Round 1" : "Rounds 1-2"}</button>)}</span>
      </div>
      {myNext && (
        <div style={{ ...panel, borderColor: before.length ? C.gd : C.bd, fontSize: 15 }}>
          Your next pick: <b>#{myNext.overall}</b>.{" "}
          {before.length ? <>Projected to be gone before then: {before.map((m, i) => <span key={m.player.id}>{i ? ", " : ""}<b style={{ color: C.gd }}>{m.player.name}</b> (#{m.pick.overall} to the {g.teams[m.pick.owner].name})</span>)}. Trade up if you want him.</> : listed.size ? <span style={{ color: C.gn }}>Everyone on your list is projected to still be there.</span> : <span style={{ color: C.mt }}>Star prospects to add them to your list and see where they're projected.</span>}
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ color: C.mt, fontSize: 13, textAlign: "left" }}><th style={{ padding: 6 }}>Pick</th><th style={{ padding: 6 }}>Team</th><th style={{ padding: 6 }}>Projected pick</th><th className="sc-hide" style={{ padding: 6 }}>Also linked</th></tr></thead>
          <tbody>
            {mock.filter((m) => m.pick.rd <= rounds).map(({ pick, player, alts }) => {
              const t = g.teams[pick.owner], mine = pick.owner === g.ui, star = listed.has(player.id);
              return (
                <tr key={pick.id || pick.overall} style={{ background: mine ? `${C.gn}14` : "transparent" }}>
                  <td style={{ ...td, width: 64, fontWeight: 800, color: mine ? C.gn : "#94a3b8", fontVariantNumeric: "tabular-nums" }}>R{pick.rd} #{pick.overall}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><TeamLogo t={t} sz={26} /><span style={{ fontWeight: mine ? 800 : 600 }}>{t.name}{mine ? " (you)" : ""}</span>{pick.orig != null && pick.orig !== pick.owner && <span style={{ fontSize: 12, color: C.mt }}>via {g.teams[pick.orig]?.ab}</span>}</span></td>
                  <td style={{ ...td, cursor: "pointer" }} onClick={() => g.setSel(player)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bdg pos={player.pos} /><span style={{ fontSize: 16, fontWeight: 700 }}>{star ? "★ " : ""}{player.name}</span></div>
                    <div style={{ fontSize: 13, color: C.mt }}>{player.bio?.college} · consensus #{csRank(player)}</div>
                  </td>
                  <td className="sc-hide" style={{ ...td, fontSize: 13, color: "#94a3b8" }}>{alts.map((a) => `${a.name} (${a.pos})`).join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!mock.length && <div style={{ color: C.mt, padding: 12 }}>No draft class yet.</div>}
    </div>
  );
}

// Area scouting: send scouts through a conference for a rough read on everyone there.
export function RegionsView({ g }) {
  const s = g.scouting || {};
  const cls = g.dc[g.yr] || [];
  const trips = s.regionsYr === g.yr ? s.regions || {} : {};
  const rp = s.rpts ?? RPTS_START;
  const open = g.sp !== "freeagency" && g.sp !== "draft";
  const keys = [...Object.keys(REGIONS), "OTH"];
  const rows = keys.map((k) => {
    const ps = cls.filter((p) => regionOf(p) === k);
    const top = [...ps].sort((a, b) => csRank(a) - csRank(b))[0];
    const flagged = ps.filter((p) => { const r = prospectRead(s, p); return r.sleeper || r.hunch; }).length;
    return { k, n: ps.length, top, t: trips[k] || 0, flagged, r1: ps.filter((p) => csRank(p) <= 32).length };
  });
  const send = (k) => { const r = scoutRegion(s, g.sp, k, g.yr, g.yr); g.sm(r.msg); if (r.ok) g.setScouting(r.sc); };
  return (
    <div>
      <div style={panel}>
        <div style={head}>AREA SCOUTING<Right><b style={{ fontSize: 22, color: C.gd }}>{rp}</b><span style={{ fontSize: 12, color: C.mt }}> area pts</span></Right></div>
        <div style={muted}>Your area scouts work conferences, not players. A trip ({RTRIP_COST} area points; you get {RPTS_START} at the start of the season, {RPTS_WEEKLY} every week and {RPTS_COMBINE} more at the Combine: four of the six regions inside out a year) gives you a rough read on <b>every</b> prospect from that region. Each trip back sharpens every read there (up to {MAX_TRIPS} trips), and from the third trip on they start seeing through the board to the region's sleepers. It's volume, not depth: for close estimates, exact ratings and development traits, use your position scouts' reports and workups (regular scouting points).</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.k} style={{ ...panel, marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <b style={{ fontSize: 17, flex: 1 }}>{regionName(r.k)}</b>
              <span title={`${r.t} of ${MAX_TRIPS} trips`} style={{ letterSpacing: 2, color: C.gd }}>{"●".repeat(r.t)}<span style={{ color: "#334155" }}>{"●".repeat(MAX_TRIPS - r.t)}</span></span>
            </div>
            <div style={{ fontSize: 13, color: C.mt, marginBottom: 8 }}>{r.n} prospects · {r.r1} on the board's first round{r.top ? <> · top: <b style={{ color: "#e2e8f0", cursor: "pointer" }} onClick={() => g.setSel(r.top)}>{r.top.name}</b> ({r.top.pos}, #{csRank(r.top)})</> : null}</div>
            {r.flagged > 0 && <div style={{ fontSize: 13, color: "#f9a8d4", marginBottom: 6 }}>💎 {r.flagged} possible sleeper{r.flagged > 1 ? "s" : ""} flagged here</div>}
            {r.k === "OTH" ? <div style={{ fontSize: 12, color: C.mt }}>Independents and FCS schools are too spread out for area trips; scout them one at a time.</div>
              : <Btn onClick={() => send(r.k)} disabled={!open || r.t >= MAX_TRIPS || rp < RTRIP_COST} bg={C.bl} style={{ fontSize: 14, padding: "6px 12px" }}>{r.t >= MAX_TRIPS ? "Fully scouted" : `Send area scouts (${RTRIP_COST} pts)`}</Btn>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoutingPage({ g }) {
  const hasCombine = (g.dc[g.yr] || []).some((p) => tested(p) && p.combine);
  const [view, setView] = useState(g.sp === "combine" ? "combine" : "board");
  const views = [["board", "Big Board"], ["list", `Your list (${listIds(g.scouting, g.yr).length})`], ["mock", "Mock Draft"], hasCombine && ["combine", "Combine"], ["regions", "Regions"], ["scouts", "Scouts"]].filter(Boolean);
  const v = views.some(([k]) => k === view) ? view : "board";
  const myPicks = (g.draftPicks || []).filter((pk) => pk.owner === g.ui && (pk.yr == null || pk.yr === g.yr) && !(g.draftLog || []).some((d) => d.id === pk.id)).sort((a, b) => a.overall - b.overall);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 900 }}>{g.sp === "combine" ? `${g.yr + 1} NFL Combine` : `${g.yr + 1} Draft Class`}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}><span title="Area-scout points for regional trips" style={{ fontSize: 14, padding: "4px 10px", borderRadius: 10, background: "#0c4a6e55", color: "#7dd3fc", fontWeight: 700 }}>🗺️ {g.scouting?.rpts ?? RPTS_START} area</span><ScoutPtsBadge pts={g.scouting?.pts || 0} /></span>
        {g.sp === "combine" && <span style={{ fontSize: 14, padding: "4px 10px", borderRadius: 10, background: "#7c3aed33", color: "#c4b5fd", fontWeight: 700 }}>Interviews: {g.scouting?.interviewsLeft || 0}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {views.map(([k, label]) => <button key={k} onClick={() => setView(k)} style={{ ...chipBtn(v === k), fontSize: 15, padding: "8px 16px" }}>{label}</button>)}
      </div>
      {v === "board" && (
        <>
          <div style={{ ...panel, display: "flex", gap: "8px 24px", flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
            <span><span style={{ color: C.mt }}>Your scouts: </span>{SCOUT_SLOTS.map((r) => g.scouting?.[r] ? <b key={r} style={{ marginRight: 10 }}>{SCOUT_GROUPS[g.scouting[r].group]} <span style={{ color: C.mt, fontWeight: 400 }}>({SCOUT_ROLES[r].short.toLowerCase()})</span></b> : null)}{!SCOUT_SLOTS.some((r) => g.scouting?.[r]) && <span style={{ color: C.mt }}>none</span>}<Btn onClick={() => setView("scouts")} bg={C.bd} c="#cbd5e1" style={{ fontSize: 12, padding: "3px 10px" }}>Manage</Btn></span>
            <span><span style={{ color: C.mt }}>Your picks: </span><b>{myPicks.length ? myPicks.map((pk) => `R${pk.rd}${g.sp === "draft" ? ` #${pk.overall}` : ""}`).join(", ") : "none"}</b></span>
          </div>
          <Legend />
          <Board g={g} classYr={g.yr} />
        </>
      )}
      {v === "list" && <YourList g={g} classYr={g.yr} />}
      {v === "combine" && <CombineView g={g} buzz={g.buzz} />}
      {v === "mock" && <MockDraft g={g} />}
      {v === "regions" && <RegionsView g={g} />}
      {v === "scouts" && <ScoutsView g={g} />}
    </div>
  );
}

// ---------- Prospect profile ----------

function explain(read, p) {
  const grp = SCOUT_GROUPS[scoutGroup(p.pos)].toLowerCase();
  const pm = (sd) => `usually within ±${Math.max(1, Math.round(sd))}`;
  if (read.lvl >= 2) return read.exact ? "Full workup: these are his exact ratings." : `Full workup: estimates are ${pm(read.sd)}. Only a major scout gets to exact numbers.`;
  if (read.lvl === 1) {
    const next = read.cov === "major" ? "A full workup (2 points) gives exact ratings and his development trait." : read.cov === "minor" ? "A full workup (2 points) sharpens the estimates." : "A follow-up (2 points) sharpens the estimates a little.";
    return `Scouting report: estimates are ${pm(read.sd)}. ${next}`;
  }
  if (read.regional) return `${read.who} have been through his region ${read.trips} time${read.trips > 1 ? "s" : ""}: a rough ${read.pot} ceiling. More trips sharpen every read there; a report (1 point) on him is still the way to close estimates.`;
  if (read.cov !== "office" && read.devEarly) return `${read.who} already have a strong read on him: a ${read.pot} ceiling and a ${read.dev} development trait. A report (1 point) gives close estimates.`;
  if (read.cov === "major") return `Your major scout's general idea of him is a ${read.pot} ceiling. A report (1 point) gives close estimates; a full workup (2 more) gives exact ratings and his development trait.`;
  if (read.cov === "minor") return `Your minor scout's general idea of him is a ${read.pot} ceiling. A report (1 point) gives estimates and a workup (2 more) sharpens them. Minor scouts don't see development traits.`;
  return `None of your scouts covers ${grp}. Your front office can still file a rough report (1 point) and a follow-up (2 more), but never exact numbers or a development trait.`;
}

const COL_KEYS = ["gp", "comp", "att", "passYds", "passTD", "passInt", "rushAtt", "rushYds", "rushTD", "rec", "recYds", "recTD", "tkl", "sacks", "tfl", "ints", "pd", "fgM", "fgA"];

export function ProspectProfile({ g, p }) {
  const a = useActions(g);
  const read = prospectRead(g.scouting, p);
  const s = p.scout || {};
  const live = g.sp === "draft" && !!g.curPick;
  const onClock = live && g.curPick.owner === g.ui && p.draftYear === g.yr;
  const listed = listIds(g.scouting, p.draftYear).includes(p.id);
  const box = { background: C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 10 };
  const lab = { fontSize: 13, fontWeight: 800, letterSpacing: 1, marginBottom: 6 };
  const col = p.colStats || {};
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", borderRadius: 6, background: C.bg, border: `1px solid ${C.bd}` }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.mt, letterSpacing: 0.8 }}>CONSENSUS</span>
          <b style={{ fontSize: 28, lineHeight: 1 }}>#{csRank(p)}</b>
          <span style={{ fontSize: 10, color: C.mt }}>{p.cons?.final ? `final · preseason #${p.cons.mid}` : "preseason"}</span>
        </div>
        <div style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.6, flex: 1, minWidth: 0 }}>
          <div><span style={{ color: C.mt }}>College:</span> {p.bio?.college} ({p.colYrs} yr{p.colYrs === 1 ? "" : "s"}){isSmallSchool(p) ? <span style={{ color: C.mt }}> · small school</span> : null}</div>
          <div><span style={{ color: C.mt }}>Size:</span> {htS(p.ht_)}, {p.wt} lbs · age {p.age}</div>
          <div><span style={{ color: C.mt }}>Draft class:</span> {p.draftYear}</div>
        </div>
      </div>

      <div style={{ ...box, border: `1px solid ${C.bd}` }}>
        <div style={{ ...lab, color: C.gn, display: "flex", alignItems: "center", gap: 6 }}>YOUR READ <span style={{ marginLeft: "auto" }}><CovTag read={read} /></span></div>
        <div style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: C.mt }}>OVR <Val txt={read.ovr} /></span>
          <span style={{ fontSize: 13, color: C.mt }}>POT <Val txt={read.pot} /></span>
          <DevChip dev={read.dev} />
          {read.tier && <span style={{ fontSize: 15 }}>Projects as <b>{read.tier}</b></span>}
          {read.lvl > 0 && <span style={{ fontSize: 12, background: C.bd, borderRadius: 3, padding: "1px 6px", color: "#cbd5e1" }}>{riskLabel(s.eOvr, s.ePot)}</span>}
        </div>
        <div style={{ ...muted, margin: "6px 0" }}>{explain(read, p)}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <ScoutButton g={g} p={p} read={read} />
          <span style={{ fontSize: 17, fontWeight: 900, color: (g.scouting?.pts || 0) > 0 ? C.gd : C.mt }}>{g.scouting?.pts || 0} scouting point{g.scouting?.pts === 1 ? "" : "s"} left</span>
        </div>
      </div>

      {read.lvl > 0 && s.skills && Object.keys(s.skills).length > 0 && (
        <div style={box}>
          <div style={{ ...lab, color: C.bl, display: "flex" }}>SCOUTING REPORT<span style={{ marginLeft: "auto", fontWeight: 400, color: C.mt }}>by {s.who}</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: "2px 12px" }}>
            {Object.entries(s.skills).map(([k, sk]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, padding: "4px 0", borderBottom: `1px solid ${C.bd}66` }}>
                <span style={{ color: "#94a3b8" }}>{PA_LABELS[k] || k}</span><GradeChip g={sk.g} small />
              </div>
            ))}
          </div>
          <div style={{ ...muted, fontSize: 10, marginTop: 3 }}>Tools graded at his projected NFL level.</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
            {s.notes?.flag && <div style={{ color: "#fca5a5", fontWeight: 800 }}>{s.notes.flag}</div>}
            {s.notes?.gem && <div style={{ color: "#f9a8d4", fontWeight: 700 }}>{s.notes.gem}</div>}
            {s.notes?.strengths?.map((x) => <div key={x} style={{ color: "#86efac" }}>✅ {x}</div>)}
            {s.notes?.weaknesses?.map((x) => <div key={x} style={{ color: "#f97316" }}>⚠️ {x}</div>)}
          </div>
          {s.comp && (
            <div style={{ fontSize: 14, marginTop: 8 }}>
              NFL comparable: <b style={{ color: "#fbbf24", cursor: g.findPlayer?.(s.comp.pid) ? "pointer" : "default" }} onClick={() => { const c = g.findPlayer?.(s.comp.pid); if (c) g.setSel(c); }}>{s.comp.name}</b> <span style={{ color: C.mt }}>({s.comp.ab})</span>
            </div>
          )}
        </div>
      )}

      {tested(p) && (p.combine || p.proDay) && (
        <div style={box}>
          <div style={{ ...lab, color: C.gd, display: "flex", alignItems: "center", gap: 6 }}>{p.combine ? "NFL COMBINE" : "PRO DAY (not invited to the Combine)"}{p.combGrade && <GradeChip g={p.combGrade} small />}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
            {COMBINE_TESTS.map((t) => {
              const v = (p.combine || p.proDay)[t.k];
              const pct = p.combPcts?.[t.k];
              return (
                <div key={t.k} style={{ background: C.cd, borderRadius: 3, padding: "3px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.mt }}>{t.short.toUpperCase()}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: pct >= 0.9 ? C.gn : "#cbd5e1" }}>{(+v).toFixed(t.dp)}{t.unit === "s" ? "s" : t.unit === "in" ? '"' : ""}</div>
                  {pct != null && <div style={{ height: 3, background: C.bg, borderRadius: 2, marginTop: 2 }}><div style={{ width: `${Math.round(pct * 100)}%`, height: "100%", background: oC(40 + pct * 50), borderRadius: 2 }} /></div>}
                </div>
              );
            })}
          </div>
          {p.combine && p.proDay && <div style={{ ...muted, fontSize: 10, marginTop: 3 }}>Bars show where he ranked among Combine invitees at his position.</div>}
          {s.intv ? (
            <div style={{ marginTop: 6, fontSize: 12 }}>Your interview: work ethic <GradeChip g={s.intv.grade} small /> <i style={{ color: "#94a3b8" }}>"{s.intv.note}"</i>{s.intv.flag && <div style={{ color: "#fca5a5", fontWeight: 800, marginTop: 4 }}>{s.intv.flag}</div>}</div>
          ) : g.sp === "combine" && p.combine && p.draftYear === g.yr && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
              <Btn onClick={() => a.interview(p)} disabled={!(g.scouting?.interviewsLeft > 0)} bg="#7c3aed33" c="#c4b5fd" style={{ fontSize: 11, padding: "2px 8px" }}>Interview him</Btn>
              <span style={muted}>{g.scouting?.interviewsLeft || 0} left. Work ethic tends to go with how fast a player develops.</span>
            </div>
          )}
        </div>
      )}

      {Object.keys(col).length > 0 && (
        <div style={box}>
          <div style={{ ...lab, color: "#fb923c" }}>COLLEGE CAREER</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(64px,1fr))", gap: 4 }}>
            {COL_KEYS.filter((k) => col[k] > 0).map((k) => (
              <div key={k} style={{ background: C.cd, borderRadius: 3, padding: "2px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.mt }}>{g.sL ? g.sL(k) : k}</div><div style={{ fontSize: 16, fontWeight: 700, color: "#fdba74" }}>{Number.isInteger(col[k]) ? col[k] : col[k].toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(p.bio?.backstory || p.bio?.fact) && (
        <div style={{ fontSize: 14, marginBottom: 10 }}>
          {p.bio.backstory && <div style={{ color: "#7dd3fc", padding: "4px 6px", background: "#0c1a2a", borderRadius: 4, lineHeight: 1.4 }}>📖 {p.bio.backstory}</div>}
          {p.bio.fact && <div style={{ color: C.mt, marginTop: 3, fontStyle: "italic" }}>📝 {p.bio.fact}</div>}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Btn onClick={() => a.toggle(p)} bg={listed ? "#b4530944" : C.bd} c={listed ? "#fef3c7" : "#cbd5e1"} style={{ fontSize: 14, padding: "6px 12px" }}>{listed ? "★ On your list" : "☆ Add to your list"}</Btn>
        {live && p.draftYear === g.yr && <span title={onClock ? "" : "Wait until you're on the clock"}><Btn onClick={() => { g.makePick(p); g.setSel(null); }} disabled={!onClock} bg={C.gn} style={{ fontSize: 14, padding: "6px 12px" }}>Draft {p.name}</Btn></span>}
      </div>
    </div>
  );
}

export function ProspectModal({ g, p, onClose }) {
  const read = prospectRead(g.scouting, p);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cd, borderRadius: 14, padding: 16, maxWidth: 600, width: "100%", maxHeight: "88vh", overflowY: "auto", border: `1px solid ${C.bd}` }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
          <Face s={p.face} sz={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{p.name}</div>
            <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}><Bdg pos={p.pos} /><span style={{ fontSize: 13, padding: "2px 8px", borderRadius: 10, background: `${C.bl}22`, color: "#93c5fd", fontWeight: 700 }}>{p.draftYear} draft prospect</span></div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 30, fontWeight: 900, color: read.exact ? oC(read.ovrV) : "#94a3b8" }}>{read.ovr === "??" ? "?" : read.ovr}</div><div style={{ fontSize: 10, color: C.mt }}>OVR</div></div>
        </div>
        <ProspectProfile g={g} p={p} />
        <Btn onClick={onClose} bg={C.bd} style={{ marginTop: 10, width: "100%" }}>Close</Btn>
      </div>
    </div>
  );
}

// For screens outside scouting: what your scouts make of a prospect's ceiling, in one short string.
export const potText = (sc, p) => prospectRead(sc, p).pot;
