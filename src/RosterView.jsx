// The roster table: one tight row per player, grouped by position in depth-chart order, with every
// column sortable. On a computer the player you pick shows in a card beside it.
import Select from "./Select.jsx";
import { learningFrom } from "./mentor.js";
import React, { useState } from "react";
import { naturalDL, posTag } from "./dline.js";
import { C, oC, Bdg, Face, Sheet, Row, Hero, Section, Chips } from "./ui.jsx";
import { InjTag } from "./InjuryTag.jsx";
import { DevChip } from "./ScoutingUI.jsx";
import { MOBILE } from "./mobile.js";
import RoleTag from "./RoleTag.jsx";

const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
const GROUPS = { ALL: null, OFF: ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT"], DEF: ["DL", "LB", "CB", "S"], ST: ["K", "P"] };
const sel = { background: "#ffffff0a", color: C.tx, border: 0, borderRadius: 12, padding: "9px 12px", fontSize: 14, minHeight: MOBILE ? 44 : undefined };
const POS_NAME = { QB: "Quarterbacks", RB: "Running backs", WR: "Wide receivers", TE: "Tight ends", LT: "Left tackles", LG: "Left guards", C: "Centers", RG: "Right guards", RT: "Right tackles", DL: "Defensive line", LB: "Linebackers", CB: "Cornerbacks", S: "Safeties", K: "Kickers", P: "Punters" };
const htS = (i) => (i ? `${Math.floor(i / 12)}'${i % 12}"` : "—");
// the player picked in the table: who he is, his deal and his best ratings
function SideCard({ p, slot, dev, onOpen }) {
  if (!p) return null;
  const top = Object.entries(p.posAttrs || {}).filter(([, v]) => typeof v === "number").sort((a, b) => b[1] - a[1]).slice(0, 4);
  const lbl = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  const stat = (l, v) => <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: C.mt }}>{l}</div><div style={{ fontSize: 16, fontWeight: 900 }}>{v}</div></div>;
  return (
    <div style={{ position: "sticky", top: 0, background: "#ffffff0a", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "center", border: `2px solid ${oC(p.ovr)}`, borderRadius: 10, padding: "4px 8px" }}><div style={{ fontSize: 28, fontWeight: 900, color: oC(p.ovr), lineHeight: 1 }}>{p.ovr}</div><div style={{ fontSize: 10, fontWeight: 900, color: C.mt }}>OVR</div></div>
        <Face s={p.face} sz={64} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>{p.name}</div>
        <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>{p.num != null ? `#${p.num} ` : ""}{posTag(p)}{slot?.label ? ` · ${slot.label}` : ""}</div>
      </div>
      <div><DevChip dev={dev} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, borderTop: "1px solid #ffffff12", paddingTop: 8 }}>
        {stat("AGE", p.age)}{stat("HT", htS(p.ht_))}{stat("WT", p.wt || "—")}{stat("POT", p.pot || p.ovr)}
      </div>
      <div style={{ fontSize: 14, color: "#cbd5e1" }}>Contract: <b>${(p.salary || 0).toFixed(1)}M</b> a year, {p.contract} year{p.contract === 1 ? "" : "s"} left</div>
      {top.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>{top.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: C.mt }}>{lbl(k)}</span><b style={{ color: oC(v) }}>{v}</b></div>)}</div>}
      <button onClick={onOpen} style={{ background: "#fff", color: "#0b1220", border: 0, borderRadius: 999, padding: "10px 12px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Open player card</button>
    </div>
  );
}
const DEV_RANK = { generational: 4, superstar: 3, star: 2, normal: 1, late: 0 };

// Little status badges next to a name, so the whole roster reads at a glance.
function Badges({ p, focus, mine, players }) {
  const b = [];
  const mentor = mine && learningFrom(p, players);
  if (mentor) b.push(["LRN", `Learning behind ${mentor.name}: his reads, decisions and ceiling grow while he sits`]);
  const isFocus = focus && ["off", "def"].some((k) => focus[k] != null && String(focus[k]) === String(p.id));
  if (isFocus) b.push(["DEV", "Development focus: can gain a point each regular-season week"]);
  if (mine && (p.contract || 0) === 1 && !p.ext) b.push(["CY", p.cyr?.choice === "bet" ? "Contract year: playing out his deal" : "Contract year: last year of his deal"]);
  if (p.ext) b.push(["EXT", "Extended: his new deal starts next season"]);
  if (p.potRev && p.potRev.stage < 3) b.push(["~", "Unproven: his real ceiling is still coming into focus"]);
  if (p.tradeRequest) b.push(["TR", "Has asked for a trade"]);
  if (p.suspended) b.push(["SUSP", `Suspended${p.suspWksLeft ? ` (${p.suspWksLeft} more game${p.suspWksLeft === 1 ? "" : "s"})` : ""}`]);
  if (!b.length) return null;
  return <span style={{ marginLeft: 6, display: "inline-flex", gap: 3, verticalAlign: "middle" }}>{b.map(([i, t]) => <span key={t} title={t} style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.4, color: "#94a3b8", cursor: "help" }}>{i}</span>)}</span>;
}

export default function RosterTable({ players, depth, setSel, devOf, wk = 0, focus = null, mine = false }) {
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(["pos", 1]);
  const [pick, setPick] = useState(null);
  const slot = (p) => depth?.[p.id];
  const depthNum = (p) => { const l = slot(p)?.label || ""; const m = l.match(/(\d+)$/); return m ? +m[1] : 99; };
  const key = {
    pos: (p) => POS.indexOf(p.pos) * 100 + depthNum(p),
    name: (p) => p.name, age: (p) => p.age, ovr: (p) => p.ovr, pot: (p) => p.pot || p.ovr,
    dev: (p) => DEV_RANK[devOf(p)] ?? 1, sal: (p) => p.salary || 0,
  };
  const rows = players
    .filter((p) => filter === "ALL" || (GROUPS[filter] ? GROUPS[filter].includes(p.pos) : p.pos === filter))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = key[sort[0]](a), y = key[sort[0]](b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort[1] || b.ovr - a.ovr; });
  const th = (k, label, opts = {}) => (
    <th className={opts.hide ? "ro-hide" : undefined} onClick={() => setSort(([s, d]) => [k, s === k ? -d : ["pos", "name"].includes(k) ? 1 : -1])} style={{ padding: "6px 6px", fontSize: 11, fontWeight: 800, letterSpacing: 1, color: sort[0] === k ? "#fff" : C.mt, borderBottom: "1px solid #ffffff14", textAlign: opts.left ? "left" : "center", cursor: "pointer", whiteSpace: "nowrap", position: "sticky", top: 0, background: "#141820" }}>
      {label}{sort[0] === k ? (sort[1] < 0 ? " ▼" : " ▲") : ""}
    </th>
  );
  const td = { padding: "2px 6px", borderBottom: "1px solid #ffffff08", textAlign: "center", fontSize: 14, height: 26 };
  const picked = rows.find((p) => p.id === pick) || rows[0] || null;
  let lastPos = null;
  return (
    <div style={{ background: "#ffffff0d", borderRadius: 18, padding: 14 }}>
      <style>{"@media (max-width: 640px) { .ro-hide { display: none } }"}</style>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Position" style={sel}>
          <option value="ALL">All positions</option><option value="OFF">Offense</option><option value="DEF">Defense</option><option value="ST">Special teams</option>
          {POS.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" aria-label="Search roster" style={{ ...sel, flex: "1 1 160px" }} />
      </div>
      {mine && !MOBILE && <div style={{ fontSize: 12, color: C.mt, margin: "-4px 0 8px" }}><b>DEV</b> development focus · <b>LRN</b> learning behind a veteran QB · <b>CY</b> contract year · <b>EXT</b> extended · <b>~</b> unproven rookie · <b>TR</b> trade request · <b>SUSP</b> suspended</div>}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 12, alignItems: "start" }}>
      <div style={{ maxHeight: "calc(var(--vh, 100vh) - 260px)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{th("name", "PLAYER", { left: true })}{th("pos", "POS")}{th("pos", "DEPTH", { hide: true })}{th("age", "AGE")}{th("ovr", "OVR")}{th("pot", "POT", { hide: true })}{th("dev", "DEV", { hide: true })}{th("sal", "CONTRACT", { hide: true })}</tr></thead>
          <tbody>
            {rows.map((p) => {
              const s = slot(p);
              const groupStart = sort[0] === "pos" && p.pos !== lastPos;
              lastPos = p.pos;
              const on = picked?.id === p.id;
              return (
                <React.Fragment key={p.id}>
                {groupStart && <tr><td colSpan={8} style={{ padding: "14px 6px 4px", fontSize: 14, fontWeight: 800, color: "#fff", borderBottom: "1px solid #ffffff14" }}>{POS_NAME[p.pos] || p.pos}</td></tr>}
                <tr onClick={() => setPick(p.id)} onDoubleClick={() => setSel(p)} style={{ cursor: "pointer", background: on ? "#3b82f62a" : undefined, outline: on ? `1px solid ${C.bl}` : undefined }} onMouseOver={(e) => { if (!on) e.currentTarget.style.background = "#1e293b66"; }} onMouseOut={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ ...td, textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Face s={p.face} sz={22} />
                      <span>
                        <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{p.name}</span>
                        <Badges p={p} focus={focus} mine={mine} players={players} />
                        {p.xf && <span title={`X-Factor: ${p.xf}`} style={{ marginLeft: 6, fontSize: 11, fontWeight: 900, color: "#f472b6" }}>XF</span>}
                        <InjTag p={p} wk={wk} showNote />
                        {p.holdout && <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, color: C.gd }}>Holdout</span>}
                      </span>
                    </span>
                  </td>
                  <td style={td}><Bdg pos={posTag(p)} /></td>
                  <td className="ro-hide" style={{ ...td, fontWeight: 800, color: s?.starter ? C.gn : "#64748b", whiteSpace: "nowrap" }}>{s?.label || "—"}</td>
                  <td style={{ ...td, color: "#cbd5e1" }}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 900, fontSize: 16, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td className="ro-hide" style={{ ...td, color: oC(p.pot || p.ovr) }}>{p.pot || p.ovr}</td>
                  <td className="ro-hide" style={td}><DevChip dev={devOf(p)} /></td>
                  <td className="ro-hide" style={{ ...td, color: "#cbd5e1", whiteSpace: "nowrap", fontSize: 14 }}>${(p.salary || 0).toFixed(1)}M · {p.contract}y</td>
                </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div style={{ padding: 16, color: C.mt, fontSize: 14 }}>Nobody matches.</div>}
      </div>
      <SideCard p={picked} slot={picked && slot(picked)} dev={picked && devOf(picked)} onOpen={() => picked && setSel(picked)} />
      </div>
    </div>
  );
}


// Phones: the roster as its own screen, in the Home screen's look. A hero with the club and its
// rating, one strip of chips for what to show (a side of the ball, the practice squad, IR), then
// the players as clean rows grouped by position. A tap opens his card; practice squad and IR
// players open a sheet with what you can do with them.
const SORTS = [["pos", "Depth chart"], ["ovr", "Overall"], ["pot", "Potential"], ["age", "Age"], ["sal", "Salary"]];
export function PhoneRosterPage({ team, depth, setSel, devOf, wk = 0, focus = null, mine = false, ovr, yr, psActions, irActions, onBack }) {
  const [view, setView] = useState("ALL");
  const [sort, setSort] = useState("pos");
  const [sortOpen, setSortOpen] = useState(false);
  const [pick, setPick] = useState(null);
  // by position, each group shows its starters; its backups open with a tap on the group
  const [openPos, setOpenPos] = useState({});
  const ps = team.ps || [], ir = team.ir || [];
  const list = view === "PS" ? ps : view === "IR" ? ir : team.roster.filter((p) => !GROUPS[view] || GROUPS[view].includes(p.pos));
  const slot = (p) => depth?.[p.id];
  const depthNum = (p) => { const l = slot(p)?.label || ""; const m = l.match(/(\d+)$/); return m ? +m[1] : 99; };
  const key = { pos: (p) => POS.indexOf(p.pos) * 100 + depthNum(p), ovr: (p) => -p.ovr, pot: (p) => -(p.pot || p.ovr), age: (p) => p.age, sal: (p) => -(p.salary || 0) };
  const rows = [...list].sort((a, b) => key[sort](a) - key[sort](b) || b.ovr - a.ovr);
  const grouped = sort === "pos" && view !== "PS" && view !== "IR";
  const acts = (p) => (view === "PS" ? psActions?.(p) : view === "IR" ? irActions?.(p) : null);
  const tap = (p) => (acts(p)?.length ? setPick(p) : setSel(p));
  const side = (p) => {
    const s = slot(p);
    if (view === "IR") return p.irReturnWk ? `Back wk ${p.irReturnWk}` : "IR";
    if (view === "PS") return `Age ${p.age}`;
    return sort === "age" ? `Age ${p.age}` : sort === "sal" ? `$${(p.salary || 0).toFixed(1)}M` : sort === "pot" ? `POT ${p.pot || p.ovr}` : s?.label || "";
  };
  const special = (p) => ["generational", "superstar", "star"].includes(devOf(p));
  let last = null;
  const chips = [["ALL", "All"], ["OFF", "Offense"], ["DEF", "Defense"], ["ST", "Special"], ...(mine ? [["PS", `Practice ${ps.length}`], ["IR", `IR ${ir.length}`]] : [])];
  return (
    <div>
      <Hero clr={team.clr} logo={team} eyebrow={mine ? `${yr || ""} Roster` : "Their roster"} title={team.name}
        sub={`${team.roster.length} players${ps.length ? ` · ${ps.length} practice squad` : ""}${ir.length ? ` · ${ir.length} on IR` : ""}`}
        right={ovr ? <div style={{ textAlign: "right" }}><div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{ovr}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>TEAM OVR</div></div> : null}>
        {onBack && <button onClick={onBack} style={{ marginTop: 14, minHeight: 40, borderRadius: 999, border: 0, padding: "0 16px", background: "#ffffff1f", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>‹ Back to your team</button>}
      </Hero>
      <div style={{ marginTop: 18 }}><Chips items={chips} value={view} onChange={setView} /></div>
      <Section title={{ ALL: "Everyone", OFF: "Offense", DEF: "Defense", ST: "Special teams", PS: "Practice squad", IR: "Injured reserve" }[view]} action={view === "PS" || view === "IR" ? null : `Sort: ${(SORTS.find(([k]) => k === sort) || SORTS[0])[1]}`} onAction={() => setSortOpen(true)} style={{ marginTop: 20 }}>
        <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px" }}>
          {rows.map((p, i) => {
            const head = grouped && p.pos !== last;
            last = p.pos;
            const s = slot(p);
            const inPos = grouped ? rows.filter((x) => x.pos === p.pos) : [];
            const bench = inPos.filter((x) => !slot(x)?.starter);
            const hidden = grouped && !openPos[p.pos] && !s?.starter && inPos.some((x) => slot(x)?.starter);
            return (
              <React.Fragment key={p.id}>
                {head && <button onClick={() => setOpenPos((o) => ({ ...o, [p.pos]: !o[p.pos] }))} style={{ display: "flex", width: "100%", alignItems: "center", background: "transparent", border: 0, cursor: bench.length ? "pointer" : "default", fontSize: 12, fontWeight: 900, letterSpacing: 1.3, color: "#94a3b8", padding: `${i ? 14 : 12}px 0 2px`, textAlign: "left" }}><span style={{ flex: 1 }}>{(POS_NAME[p.pos] || p.pos).toUpperCase()}</span>{bench.length > 0 && <span style={{ letterSpacing: 0.4, fontWeight: 800, color: "#7dd3fc" }}>{openPos[p.pos] ? "Hide backups" : `+${bench.length} backup${bench.length === 1 ? "" : "s"}`}</span>}</button>}
                {!hidden && <button onClick={() => tap(p)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 56, textAlign: "left", background: "transparent", border: 0, borderTop: head || i === 0 ? 0 : "1px solid #ffffff10", padding: "6px 0", color: C.tx, cursor: "pointer", whiteSpace: "normal" }}>
                  <Face s={p.face} sz={36} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f1f5f9" }}>{p.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}><Bdg pos={posTag(p)} /><RoleTag p={p} />{special(p) && <DevChip dev={devOf(p)} />}<Badges p={p} focus={focus} mine={mine} players={team.roster} /><InjTag p={p} wk={wk} />{p.holdout && <span style={{ fontSize: 12, color: C.gd, fontWeight: 800 }}>Holdout</span>}</span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <b style={{ display: "block", fontSize: 20, lineHeight: 1, color: oC(p.ovr) }}>{p.ovr}</b>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 800, marginTop: 4, color: s?.starter && sort === "pos" ? C.gn : "#64748b" }}>{side(p)}</span>
                  </span>
                </button>}
              </React.Fragment>
            );
          })}
          {!rows.length && <div style={{ padding: "18px 0", color: C.mt, fontSize: 14 }}>{view === "PS" ? "Nobody on the practice squad." : view === "IR" ? "Nobody on injured reserve." : "Nobody here."}</div>}
        </div>
      </Section>
      {sortOpen && <Sheet title="Sort" onClose={() => setSortOpen(false)}>{SORTS.map(([k, l], i) => <Row key={k} first={i === 0} label={l} value={sort === k ? "✓" : ""} tone={C.gn} onClick={() => { setSort(k); setSortOpen(false); }} />)}<div style={{ height: 8 }} /></Sheet>}
      {pick && (
        <Sheet onClose={() => setPick(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, paddingRight: 40 }}>
            <Face s={pick.face} sz={60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{pick.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}><Bdg pos={posTag(pick)} /><RoleTag p={pick} /><span style={{ fontSize: 14, color: "#94a3b8" }}>Age {pick.age}</span></div>
            </div>
            <b style={{ fontSize: 40, color: oC(pick.ovr) }}>{pick.ovr}</b>
          </div>
          {(acts(pick) || []).map((a, i) => a.note
            ? <div key={i} style={{ fontSize: 14, color: a.tone || "#94a3b8", padding: "8px 2px" }}>{a.note}</div>
            : <button key={i} disabled={a.disabled} onClick={() => { a.onClick(); setPick(null); }} style={{ width: "100%", minHeight: 50, marginTop: 8, borderRadius: 14, border: 0, background: a.primary ? C.gn : a.danger ? `${C.rd}26` : "#ffffff12", color: a.primary ? "#fff" : a.danger ? "#fca5a5" : "#e2e8f0", fontSize: 16, fontWeight: 900, cursor: a.disabled ? "default" : "pointer", opacity: a.disabled ? 0.5 : 1 }}>{a.label}</button>)}
          <button onClick={() => { setSel(pick); setPick(null); }} style={{ width: "100%", minHeight: 48, marginTop: 8, borderRadius: 14, border: 0, background: "transparent", color: "#7dd3fc", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Player card</button>
          <div style={{ height: 8 }} />
        </Sheet>
      )}
    </div>
  );
}
