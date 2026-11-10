// Draft recap: after the draft, every pick with his real ratings and development trait revealed,
// so you can see where you (and everyone else) hit or missed. Past drafts stay here, with what
// each pick has become since.
import Select from "./Select.jsx";
import React, { useMemo, useState } from "react";
import { C, TeamLogo, Bdg, Face, Hero, Row, Sheet, Segments, Pills, pill, card as cardBase, cardTitle, fitH } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { DevChip, DEV_STYLE } from "./ScoutingUI.jsx";
import { recapEntry, gradePicks, classGrades, devCounts, VERDICT } from "./draftRecap.js";
import { DEV_TRAITS } from "./scouting.js";
import { posTag } from "./dline.js";

const GRADE_C = { A: "#4ade80", "B+": "#60a5fa", B: "#60a5fa", "C+": "#fbbf24", C: "#fbbf24", D: "#f87171" };

export default function DraftRecap({ teams, ui, yr, draftLog = [], history = {}, current, onNext, setSel, findPlayer }) {
  // The draft just held (this off-season) plus every archived one.
  const years = useMemo(() => {
    const ys = Object.keys(history).map(Number);
    if (current && draftLog.length && !ys.includes(yr)) ys.push(yr);
    return ys.sort((a, b) => b - a);
  }, [history, draftLog.length, current, yr]);
  const [pickYr, setPickYr] = useState(null);
  const [show, setShow] = useState("all");
  const [teamF, setTeamF] = useState(-1);
  const [mode, setMode] = useState("class");
  const view = pickYr ?? years[0];
  const entries = useMemo(() => (view === yr && current && draftLog.length ? draftLog.map(recapEntry) : history[view] || []), [view, yr, current, draftLog, history]);
  // Players still being figured out (see scoutMiss.js) show the club's current read of their
  // ceiling, and no gem or bust call until the truth is out.
  const rows = useMemo(() => gradePicks(entries.map((e) => {
    const live = e.id != null ? findPlayer(e.id) : null;
    return live?.potRev && live.potRev.stage < 3 ? { ...e, pot: live.pot, gem: false, bust: false, pending: true } : e;
  })), [entries, findPlayer]);
  const grades = useMemo(() => classGrades(rows, teams.length), [rows, teams.length]);
  const counts = devCounts(rows);
  const mine = grades[ui];
  const past = view < yr || !current;
  const panel = { background: C.cd, border: "1px solid #ffffff10", borderRadius: 12, padding: 14, marginBottom: 12 };
  const head = { fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 10 };
  const open = (id) => { const p = id != null && findPlayer(id); if (p) setSel(p); };
  const now = (id) => (past ? findPlayer(id) : null);

  if (!years.length && MOBILE) return (
    <Hero compact clr={teams[ui]?.clr} logo={teams[ui]} eyebrow="Draft recap" title={current ? "After the draft" : "No drafts yet"} sub={current ? "Every pick shows up here with his true ratings and development trait once the draft is done." : "After your first draft, every pick shows up here with his true ratings and development trait."} />
  );
  if (!years.length) return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {MOBILE && <div style={{ fontSize: 26, fontWeight: 900 }}>Draft Recap</div>}
      <div style={{ fontSize: 15, color: C.mt, marginTop: 8 }}>No draft has been held in your league yet. After the draft, every pick shows up here with his real ratings and development trait.</div>
    </div>
  );

  const shown = rows.filter((r) => (teamF >= 0 ? r.owner === teamF : true) && (show === "hits" ? ["gem", "jackpot", "hit"].includes(r.verdict) : show === "mine" ? r.owner === ui : true));
  const jackpots = rows.filter((r) => ["gem", "jackpot", "hit"].includes(r.verdict)).sort((a, b) => b.score - a.score || a.overall - b.overall);
  const topClasses = [...grades].filter((g) => g.picks.length).sort((a, b) => a.rank - b.rank);

  if (MOBILE) return <PhoneRecap {...{ teams, ui, view, years, setPickYr, onNext, mine, topClasses, jackpots, counts, rows, shown, show, setShow, open, now, past }} />;
  const face = (id) => findPlayer(id)?.face;
  const best = mine?.picks.filter((r) => r.rd >= 2 && r.score >= 2).sort((x, y) => y.score - x.score || x.overall - y.overall)[0];
  const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  const card = { ...cardBase, minHeight: 0, display: "flex", flexDirection: "column" };
  const h = cardTitle;
  const fit = { ...fitH, minHeight: 400 };
  const dev = (r) => (r.dev && r.dev !== "normal" ? <span style={{ fontSize: 13, fontWeight: 800, color: DEV_STYLE[r.dev]?.[0] }}>{DEV_TRAITS[r.dev]?.name}</span> : null);
  const verdict = (r) => { if (!["gem", "bust"].includes(r.verdict) && r.dev && r.dev !== "normal") return <span style={{ width: 110, textAlign: "right", flexShrink: 0 }}>{dev(r)}</span>;
    const [vt, vc] = VERDICT[r.verdict]; return <span style={{ width: 110, textAlign: "right", fontSize: 13, fontWeight: 800, color: r.verdict === "solid" ? "#64748b" : vc, flexShrink: 0 }}>{vt}</span>; };
  const nums = (r) => { const n = now(r.id); return (
    <span style={{ width: 92, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1.15 }}>
      <b style={{ fontSize: 16, color: "#f8fafc" }}>{r.ovr}</b><span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}> / {r.pot}</span>
      {past && <span style={{ display: "block", fontSize: 12, color: n ? C.gd : "#64748b" }}>{n ? `now ${n.ovr}` : "gone"}</span>}
    </span>
  ); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Pills items={[["class", mine?.picks.length ? "Your class" : "The class"], ["all", "Every pick"]]} value={mode} onChange={setMode} label="Recap" />
        <span style={{ fontSize: 14, color: "#64748b", flex: 1 }}>{past ? "True ratings revealed, and what each pick has become since." : "True ratings and development traits, revealed."}</span>
        {years.length > 1 && <Select value={view} onChange={(e) => setPickYr(+e.target.value)} aria-label="Draft year" style={{ background: C.cd, color: "#e2e8f0", border: "1px solid #ffffff10", borderRadius: 99, padding: "6px 12px", fontSize: 14 }}>{years.map((y) => <option key={y} value={y}>{y + 1} draft</option>)}</Select>}
      </div>

      {mode === "class" ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14, ...fit }}>
          <div style={card}>
            {mine?.picks.length ? <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "2px 4px 12px" }}>
                <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: GRADE_C[mine.grade], width: 70 }}>{mine.grade}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={h}>Your class · {ord(mine.rank)} of {topClasses.length}</div>
                  <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {mine.picks.length} picks · {mine.hits} hit{mine.hits === 1 ? "" : "s"}{best ? <> · best find <b style={{ color: "#e2e8f0" }}>{best.name}</b>, round {best.rd}</> : null}
                  </div>
                </div>
              </div>
              <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -6px" }}>
                {mine.picks.map((r) => (
                  <div key={r.id} className="calm-row" onClick={() => open(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 10px", borderRadius: 14, cursor: "pointer" }}>
                    <span style={{ width: 34, textAlign: "right", fontSize: 16, fontWeight: 900, color: "#64748b", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{r.overall}</span>
                    <Face s={face(r.id)} sz={40} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                      <span style={{ display: "block", fontSize: 13, color: "#94a3b8", marginTop: 1 }}>{posTag(r)} · round {r.rd} · age {r.age}</span>
                    </span>
                    {nums(r)}
                    {verdict(r)}
                  </div>
                ))}
              </div>
            </> : <div style={{ fontSize: 15, color: "#94a3b8", padding: 4 }}>You made no picks in this draft.</div>}
          </div>
          <div style={{ display: "grid", gridTemplateRows: "auto minmax(0,1fr)", gap: 14, minHeight: 0 }}>
            <div style={card}>
              <div style={{ ...h, marginBottom: 6 }}>Best of the class</div>
              {jackpots.slice(0, 5).map((r) => (
                <div key={r.id} className="calm-row" onClick={() => open(r.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", margin: "0 -8px", borderRadius: 12, cursor: "pointer" }}>
                  <span style={{ width: 34, textAlign: "right", fontSize: 13, fontWeight: 800, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{r.overall}</span>
                  {teams[r.owner] && <TeamLogo t={teams[r.owner]} sz={22} />}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: r.owner === ui ? C.gd : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name} <span style={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}>{posTag(r)}</span></span>
                  {dev(r)}
                </div>
              ))}
              {!jackpots.length && <div style={{ fontSize: 14, color: "#94a3b8" }}>No Star-or-better traits in this class.</div>}
            </div>
            <div style={{ ...card, paddingBottom: 8 }}>
              <div style={{ ...h, marginBottom: 6 }}>Class grades</div>
              <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -8px" }}>
                {topClasses.map((c) => (
                  <div key={c.ti} className="calm-row" onClick={() => { setTeamF(c.ti); setShow("all"); setMode("all"); }} title={`${c.picks.length} picks · ${c.hits} hits`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 8px", borderRadius: 12, cursor: "pointer", background: c.ti === ui ? "#f5c54214" : "transparent" }}>
                    <span style={{ width: 22, textAlign: "right", fontSize: 13, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{c.rank}</span>
                    {teams[c.ti] && <TeamLogo t={teams[c.ti]} sz={22} />}
                    <span style={{ flex: 1, fontSize: 15, color: c.ti === ui ? C.gd : "#e2e8f0", fontWeight: c.ti === ui ? 800 : 600 }}>{teams[c.ti]?.city} {teams[c.ti]?.name}</span>
                    <b style={{ width: 30, textAlign: "right", color: GRADE_C[c.grade] }}>{c.grade}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, ...fit }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ ...h, flex: 1 }}>{teamF >= 0 ? `${teams[teamF]?.city} ${teams[teamF]?.name}` : "Every pick"}</div>
            {teamF >= 0 && <button onClick={() => setTeamF(-1)} style={{ ...pill(false), color: "#94a3b8" }}>All teams</button>}
            <Pills items={[["all", "All"], ["mine", "Mine"], ["hits", "Hits"]]} value={show} onChange={setShow} label="Show" />
          </div>
          <div style={{ overflowY: "auto", minHeight: 0, flex: 1, margin: "0 -8px" }}>
            {shown.map((r, i) => (
              <React.Fragment key={r.id}>
                {(i === 0 || shown[i - 1].rd !== r.rd) && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "#64748b", padding: "12px 10px 4px" }}>ROUND {r.rd}</div>}
                <div className="calm-row" onClick={() => open(r.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 10px", borderRadius: 12, cursor: "pointer", background: r.owner === ui ? "#f5c54210" : "transparent", boxShadow: r.owner === ui ? `inset 3px 0 0 ${C.gd}` : "none" }}>
                  <span style={{ width: 34, textAlign: "right", fontSize: 14, fontWeight: 800, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{r.overall}</span>
                  {teams[r.owner] && <TeamLogo t={teams[r.owner]} sz={22} />}
                  <span style={{ width: 40, fontSize: 13, fontWeight: 700, color: r.owner === ui ? C.gd : "#94a3b8" }}>{r.owner === ui ? "You" : teams[r.owner]?.ab}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name} <span style={{ color: "#64748b", fontWeight: 600, fontSize: 13 }}>{posTag(r)} · {r.age}</span></span>
                  {nums(r)}
                  {verdict(r)}
                </div>
              </React.Fragment>
            ))}
            {!shown.length && <div style={{ fontSize: 14, color: "#94a3b8", padding: 10 }}>No picks match.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Phones: your class first (one clean row a pick, the verdict on the right), the best traits in the
// class after it, and the league's grades and the full pick list a tap away.
function PhoneRecap({ teams, ui, view, years, setPickYr, onNext, mine, topClasses, jackpots, counts, shown, show, setShow, open, now, past }) {
  const [sheet, setSheet] = useState(null);
  const soft = { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" };
  const label = { fontSize: 14, fontWeight: 800, color: "#94a3b8", margin: "24px 2px 8px" };
  const me = teams[ui];
  const line = (r, i, sub) => { const [vt, vc] = VERDICT[r.verdict]; const n = now(r.id); return (
    <div key={r.id} onClick={() => open(r.id)} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 62, padding: "6px 0", borderTop: i ? "1px solid #ffffff10" : 0, cursor: "pointer" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 800, minWidth: 0 }}><Bdg pos={posTag(r)} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", marginTop: 4, flexWrap: "wrap" }}>{sub}<DevChip dev={r.dev} /></span>
      </span>
      <span style={{ textAlign: "right", lineHeight: 1.15 }}>
        <b style={{ fontSize: 16 }}>{r.ovr}<span style={{ color: "#94a3b8", fontWeight: 700 }}> / {r.pot}</span></b>
        <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: vc, marginTop: 2 }}>{n ? <span style={{ color: C.gd }}>now {n.ovr} · </span> : null}{vt.replace(/^\S*\p{Extended_Pictographic}\S*\s*/u, "")}</span>
      </span>
    </div>
  ); };
  return (
    <div>
      <Hero compact clr={me?.clr} logo={me} eyebrow={`${view + 1} draft recap`} title={mine?.picks.length ? `Class grade ${mine.grade}` : "Draft recap"}
        sub={mine?.picks.length ? `${mine.picks.length} picks · ${mine.hits} hit${mine.hits === 1 ? "" : "s"} · #${mine.rank} of ${topClasses.length}` : "Every pick with his true ratings revealed"}
        right={onNext ? <button onClick={onNext} style={{ minHeight: 44, padding: "0 16px", borderRadius: 14, border: 0, background: C.gn, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}>Next season ›</button> : null} />
      {years.length > 1 && <div style={{ marginTop: 12 }}><Segments items={years.slice(0, 4).map((y) => [y, `${y + 1}`])} value={view} onChange={(y) => setPickYr(+y)} /></div>}
      {mine?.picks.length > 0 && <><div style={label}>Your class</div><div style={soft}>{mine.picks.map((r, i) => line(r, i, `Rd ${r.rd} · #${r.overall} · age ${r.age} ·`))}</div></>}
      <div style={label}>Best traits in the class</div>
      <div style={soft}>
        {jackpots.slice(0, 5).map((r, i) => line(r, i, <>#{r.overall} {teams[r.owner] && <TeamLogo t={teams[r.owner]} sz={16} />} {teams[r.owner]?.ab} ·</>))}
        {!jackpots.length && <div style={{ padding: "16px 0", color: "#94a3b8", fontSize: 15 }}>No Star-or-better traits in this class.</div>}
      </div>
      <div style={{ ...soft, marginTop: 12 }}>
        <Row first label="League class grades" value={topClasses[0] ? `Best: ${teams[topClasses[0].ti]?.ab} ${topClasses[0].grade}` : ""} onClick={() => setSheet("grades")} />
        <Row label="Every pick" value={`${Object.keys(DEV_TRAITS).filter((k) => k !== "normal").map((k) => `${counts[k] || 0} ${DEV_TRAITS[k].name.toLowerCase()}`).slice(0, 2).join(", ")}`} onClick={() => setSheet("all")} />
      </div>
      {sheet === "grades" && <Sheet title="Class grades" onClose={() => setSheet(null)}>
        <div style={soft}>{topClasses.map((g, i) => <div key={g.ti} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 50, borderTop: i ? "1px solid #ffffff10" : 0, color: g.ti === ui ? C.gn : "#e2e8f0" }}><span style={{ width: 22, color: "#94a3b8" }}>{g.rank}</span>{teams[g.ti] && <TeamLogo t={teams[g.ti]} sz={26} />}<span style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block", fontSize: 15 }}>{teams[g.ti]?.city} {teams[g.ti]?.name}</b><span style={{ fontSize: 12, color: "#94a3b8" }}>{g.picks.length} picks · {g.hits} hits</span></span><b style={{ fontSize: 18, color: GRADE_C[g.grade] }}>{g.grade}</b></div>)}</div>
        <div style={{ height: 10 }} />
      </Sheet>}
      {sheet === "all" && <Sheet title="Every pick" onClose={() => setSheet(null)}>
        <Segments items={[["all", "All"], ["mine", "Mine"], ["hits", "Hits"]]} value={show} onChange={setShow} />
        <div style={soft}>{shown.map((r, i) => line(r, i, <>{r.rd}-{r.overall} {teams[r.owner]?.ab} ·</>))}</div>
        <div style={{ height: 10 }} />
      </Sheet>}
    </div>
  );
}
