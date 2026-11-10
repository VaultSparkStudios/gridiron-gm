// The League > Transactions page: the wire (transactions.js), newest first, filtered by kind, club
// and season, grouped by season and week.
import React, { useState, useMemo } from "react";
import { C, TeamLogo, Pills, card, field, fitH } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import Select from "./Select.jsx";
import { KINDS } from "./transactions.js";

const TAG = { trade: "Trade", sign: "Signing", release: "Release", coach: "Coaching", retire: "Retirement" };
const TONE = { trade: "#c4b5fd", sign: "#86efac", release: "#fca5a5", coach: "#7dd3fc", retire: "#fde68a" };

export default function TransactionsWire({ wire = [], teams = [], ui }) {
  const [kind, setKind] = useState("all");
  const [team, setTeam] = useState("all");
  const seasons = useMemo(() => [...new Set(wire.map((e) => e.y))].sort((a, b) => b - a), [wire]);
  const [season, setSeason] = useState("all");
  const list = wire.filter((e) => (kind === "all" || e.k === kind) && (team === "all" || (e.tm || []).includes(+team)) && (season === "all" || e.y === +season));
  const total = Object.fromEntries(KINDS.map(([k]) => [k, wire.filter((e) => e.k === k).length]));
  const counts = Object.fromEntries(KINDS.map(([k]) => [k, wire.filter((e) => e.k === k && (season === "all" || e.y === +season)).length]));
  // group by "season · when", in wire order (newest first)
  const groups = [];
  for (const e of list.slice(0, 400)) {
    const key = `${e.y} · ${e.when}`;
    if (groups[groups.length - 1]?.key !== key) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push(e);
  }
  const selStyle = { ...field, flex: MOBILE ? 1 : "0 0 auto", minWidth: 0 };
  const filters = (<>
    <Select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Club" style={selStyle}>
      <option value="all">All clubs</option>
      {teams.map((t, i) => <option key={i} value={i}>{t.city} {t.name}{i === ui ? " (you)" : ""}</option>)}
    </Select>
    <Select value={season} onChange={(e) => setSeason(e.target.value)} aria-label="Season" style={selStyle}>
      <option value="all">All seasons</option>
      {seasons.map((y) => <option key={y} value={y}>{y}</option>)}
    </Select>
  </>);
  return (
    <div>
      {MOBILE && <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Transactions</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: MOBILE ? "wrap" : "nowrap" }}>
        <Pills quiet wrap={false} items={[["all", "All"], ...KINDS.filter(([k]) => total[k] || kind === k).map(([k, l]) => [k, <>{l} <span style={{ opacity: 0.55, fontWeight: 700 }}>{counts[k]}</span></>])]} value={kind} onChange={setKind} label="Kind" style={MOBILE ? { overflowX: "auto", width: "100%" } : undefined} />
        {!MOBILE && <span style={{ flex: 1 }} />}
        {filters}
      </div>
      <div style={{ ...card, padding: "10px 16px", ...(MOBILE ? null : { ...fitH, overflowY: "auto" }) }}>
        {!groups.length && <div style={{ color: "#94a3b8", fontSize: 14.5, padding: "6px 0" }}>Nothing on the wire yet. Trades, signings and coaching moves show up here as they happen.</div>}
        {groups.map((g, gi) => (
          <div key={g.key} style={{ marginTop: gi ? 14 : 2 }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#64748b", margin: "0 0 4px" }}>{g.key.toUpperCase()}</div>
            {g.items.map((e, i) => {
              const mine = (e.tm || []).includes(ui);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", margin: "0 -8px", borderRadius: 12, background: mine ? "#22c55e0f" : "transparent" }}>
                  <span style={{ display: "inline-flex", gap: 2, minWidth: MOBILE ? 24 : 48 }}>{(e.tm || []).slice(0, MOBILE ? 1 : 2).map((ti) => teams[ti] && <TeamLogo key={ti} t={teams[ti]} sz={22} glow />)}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: "#e2e8f0", lineHeight: 1.4 }}><b style={{ color: TONE[e.k], fontSize: 13, marginRight: 8 }}>{TAG[e.k]}</b>{e.t}</span>
                </div>
              );
            })}
          </div>
        ))}
        {list.length > 400 && <div style={{ fontSize: 13, color: "#64748b", padding: "10px 0 4px" }}>Showing the latest 400. Filter by club or season to see more.</div>}
      </div>
    </div>
  );
}
