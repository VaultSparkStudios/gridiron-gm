// The front office at a glance: money, morale and the shape of the roster, in big readable cards.
import React from "react";
import { C, oC, Bdg, Face } from "./ui.jsx";
import { depthOrderFor } from "./DepthChart.jsx";
import { capFor } from "./cap.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const card = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
const label = { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: C.mt };
const GROUPS = [["QB", ["QB"], "#f97316"], ["OL", ["LT", "LG", "C", "RG", "RT"], "#3b82f6"], ["WR", ["WR"], "#22c55e"], ["TE", ["TE"], "#a78bfa"], ["RB", ["RB"], "#fbbf24"], ["DL", ["DL"], "#ef4444"], ["LB", ["LB"], "#f472b6"], ["DB", ["CB", "S"], "#06b6d4"], ["ST", ["K", "P"], "#64748b"]];
const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S", "K", "P"];
const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1 };

function Meter({ v, color }) {
  return <div style={{ height: 8, background: C.bg, borderRadius: 4, marginTop: 8 }}><div style={{ width: `${Math.max(0, Math.min(100, v))}%`, height: "100%", background: color, borderRadius: 4 }} /></div>;
}
function Stat({ title, value, color, sub, meter }) {
  return (
    <div style={{ ...card, marginBottom: 0, flex: "1 1 170px", minWidth: 0 }}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: color || "#fff", lineHeight: 1.2, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: C.mt, marginTop: 2 }}>{sub}</div>}
      {meter != null && <Meter v={meter} color={color} />}
    </div>
  );
}

export default function FrontOffice({ team, yr, cap, floor, capSpace, capHit, resignAsk, setSel, depthOrder, snaps, children }) {
  const roster = team.roster || [];
  const space = capSpace(team), payroll = capHit(team);
  const morale = team.morale || 50, chem = team.chemistry || 75, rep = team.gmRep || 50;
  const tone = (v, lo, hi) => (v >= hi ? C.gn : v >= lo ? C.gd : C.rd);
  const tier = rep >= 90 ? "Legend" : rep >= 75 ? "Elite" : rep >= 60 ? "Respected" : rep >= 40 ? "Veteran" : "Rookie";
  const perk = rep >= 90 ? "+2 SP a week, 10% FA discount" : rep >= 75 ? "+1 SP a week" : rep >= 60 ? "Better trade offers" : "Build it by winning";

  const groups = GROUPS.map(([g, ps, color]) => ({ g, color, v: roster.filter((p) => ps.includes(p.pos)).reduce((s, p) => s + (p.salary || 0), 0) }));
  const total = groups.reduce((s, x) => s + x.v, 0) || 1;
  const top = [...roster].sort((a, b) => (b.salary || 0) - (a.salary || 0)).slice(0, 8);
  const committed = [1, 2, 3].map((k) => ({ yr: yr + k, v: roster.filter((p) => (p.contract || 0) > k).reduce((s, p) => s + (p.salary || 0), 0) }));
  const expiring = roster.filter((p) => p.contract === 1).sort((a, b) => b.ovr - a.ovr);
  const order = (pos) => depthOrderFor(roster.filter((p) => !p.injured), depthOrder, pos, snaps);
  const td = { padding: "8px 6px", borderBottom: `1px solid ${C.bd}55`, fontSize: 15 };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat title="CAP SPACE" value={money(space)} color={space >= 0 ? C.gn : C.rd} sub={`${money(payroll)} of ${money(cap)} used${team.deadCap ? ` · ${money(team.deadCap)} dead` : ""}${team.deadNext ? ` · ${money(team.deadNext)} dead next year` : ""}`} meter={(payroll / cap) * 100} />
        <Stat title="TEAM MORALE" value={morale} color={tone(morale, 45, 75)} sub={morale >= 75 ? "Fired up" : morale >= 45 ? "Steady" : "Frustrated"} meter={morale} />
        <Stat title="CHEMISTRY" value={chem} color={tone(chem, 45, 65)} sub={chem >= 65 ? "Gelling" : chem >= 45 ? "Getting there" : "Disjointed"} meter={chem} />
        <Stat title="GM REPUTATION" value={tier} color={tone(rep, 40, 60)} sub={`${rep}/100 · ${perk}`} meter={rep} />
      </div>
      {space < 0 && <div style={{ ...card, borderColor: C.rd, color: "#fca5a5", fontSize: 15, fontWeight: 700 }}>Over the cap by {money(-space)}. Cut or trade salary before the season or you'll be fined.</div>}
      {payroll < floor && <div style={{ ...card, borderColor: C.gd, color: "#fde68a", fontSize: 15, fontWeight: 700 }}>Under the {money(floor)} salary floor by {money(floor - payroll)}.</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ ...card, flex: "1 1 380px", minWidth: 0 }}>
          <div style={label}>WHERE THE MONEY GOES</div>
          <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", margin: "10px 0" }}>
            {groups.filter((x) => x.v > 0).map((x) => <div key={x.g} title={`${x.g}: ${money(x.v)}`} style={{ width: `${(x.v / total) * 100}%`, background: x.color, fontSize: 11, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{x.v / total > 0.07 ? x.g : ""}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: "6px 12px", marginBottom: 14 }}>
            {groups.map((x) => <div key={x.g} style={{ fontSize: 14 }}><span style={{ color: x.color }}>■</span> <b>{x.g}</b> <span style={{ color: "#cbd5e1" }}>{money(x.v)}</span> <span style={{ color: C.mt, fontSize: 12 }}>{Math.round((x.v / total) * 100)}%</span></div>)}
          </div>
          <div style={label}>BIGGEST CONTRACTS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}><tbody>
            {top.map((p) => (
              <tr key={p.id} onClick={() => setSel(p)} style={{ cursor: "pointer" }}>
                <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Face s={p.face} sz={24} /><b>{p.name}</b></span></td>
                <td style={{ ...td, textAlign: "center" }}><Bdg pos={p.pos} /></td>
                <td style={{ ...td, textAlign: "center", fontWeight: 900, color: oC(p.ovr) }}>{p.ovr}</td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>{money(p.salary)} <span style={{ color: C.mt, fontSize: 13 }}>· {p.contract}y</span></td>
              </tr>
            ))}
          </tbody></table>
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={card}>
            <div style={label}>FUTURE CAP</div>
            {committed.map((c) => {
              const capY = capFor(c.yr), free = capY - c.v; // the cap keeps rising each year
              return (
                <div key={c.yr} style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span><b>{c.yr}</b> <span style={{ color: C.mt, fontSize: 13 }}>cap {money(capY)}</span></span><span><span style={{ color: C.mt }}>committed</span> {money(c.v)} · <b style={{ color: free >= 0 ? C.gn : C.rd }}>{money(free)} free</b></span></div>
                  <Meter v={(c.v / capY) * 100} color="#3b82f6" />
                </div>
              );
            })}
          </div>
          <div style={card}>
            <div style={label}>EXPIRING AFTER THIS SEASON ({expiring.length})</div>
            {!expiring.length && <div style={{ fontSize: 15, color: C.mt, marginTop: 8 }}>Nobody — your roster is locked up.</div>}
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}><tbody>
              {expiring.slice(0, 10).map((p) => (
                <tr key={p.id} onClick={() => setSel(p)} style={{ cursor: "pointer" }}>
                  <td style={td}><b>{p.name}</b> <span style={{ color: C.mt, fontSize: 13 }}>{p.age}</span></td>
                  <td style={{ ...td, textAlign: "center" }}><Bdg pos={p.pos} /></td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 900, color: oC(p.ovr) }}>{p.ovr}</td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap", fontSize: 14 }}><span style={{ color: C.mt }}>asks</span> {money(resignAsk(p))}</td>
                </tr>
              ))}
            </tbody></table>
            {expiring.length > 0 && <div style={{ fontSize: 13, color: C.mt, marginTop: 8 }}>Re-sign them in the preseason re-sign window, or get first dibs when free agency opens.</div>}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={label}>POSITION GROUPS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginTop: 10 }}>
          {POS.map((pos) => {
            const o = order(pos), st = o.slice(0, STARTERS[pos]);
            const avg = st.length ? Math.round(st.reduce((s, p) => s + p.ovr, 0) / st.length) : 0;
            const thin = o.length <= STARTERS[pos];
            return (
              <div key={pos} style={{ background: C.bg, border: `1px solid ${thin ? C.gd + "88" : C.bd}`, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Bdg pos={pos} /><b style={{ marginLeft: "auto", fontSize: 20, color: avg ? oC(avg) : C.rd }}>{avg || "—"}</b></div>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st[0]?.name || "Nobody"}</div>
                <div style={{ fontSize: 12, color: thin ? C.gd : C.mt }}>{o.length} on roster{thin ? " · thin" : ""}</div>
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
