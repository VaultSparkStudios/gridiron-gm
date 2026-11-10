// Calling your own plays in a live game: one card that changes with the moment. Fourth down (punt,
// kick or go for it), the playbook (four runs and four passes), the pre-snap read, then picking
// your receiver. Styled like the rest of the game screen (dark card, team color on the edge).
import React from "react";
import { C, TeamLogo, pill } from "./ui.jsx";

const nth = (n) => ["", "1st", "2nd", "3rd", "4th"][n] || "";
const CALL_NAMES = { run_inside: "Inside Run", run_outside: "Outside Run", run_screen: "Screen", scramble: "QB Scramble", pass_quick: "Quick Pass", pass_medium: "Medium Route", pass_deep: "Deep Shot", pass_rpo: "RPO" };

function Card({ team, title, sub, tone = "#4ade80", children }) {
  return (
    <div style={{ background: C.cd, border: "1px solid #ffffff10", borderLeft: `4px solid ${team?.clr || tone}`, borderRadius: 12, padding: "10px 12px 12px", boxShadow: "0 8px 24px #0006" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {team && <TeamLogo t={team} sz={26} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: tone, letterSpacing: 0.5 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: C.mt, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
// a play or option to pick: a tile with a line under the name
function Tile({ onClick, icon, label, note, tone = "#60a5fa", strong, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ textAlign: "left", cursor: "pointer", color: "#fff", background: strong ? `${tone}22` : "#0b1220", border: `1px solid ${strong ? `${tone}88` : C.bd}`, borderRadius: 10, padding: "9px 11px", minHeight: 58, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, transition: "border-color .15s, background .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = tone; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = strong ? `${tone}88` : C.bd; }}>
      <div style={{ fontSize: 14, fontWeight: 800 }}>{label}</div>
      {note && <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.3 }}>{note}</div>}
      {children}
    </button>
  );
}
const grid = (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 });

// g: { off, def (team records), down, toGo, yard, scheme, runPct }; phase: null (pick a play),
// "presnap" or "passing"; fourth: the fourth-down choice still to make; mobile: narrow screen.
export default function PlayCaller(props) {
  if (props.mobile) return <PhoneCaller {...props} />;
  return <DeskCaller {...props} />;
}
function DeskCaller({ g, phase, fourth, pending, targets = [], mobile, onFourth, onCall, onHike, onAudible, onThrow, pat, onPat, clock, qtr, lead }) {
  const { off, def, down, toGo, yard } = g;
  const situation = `${nth(down)} & ${yard + toGo >= 100 ? "goal" : toGo} · ${yard === 50 ? "midfield" : yard > 50 ? `their ${100 - yard}` : `own ${yard}`}`;
  const cols = mobile ? 2 : 4;
  if (fourth) {
    const k = off.roster.filter((p) => p.pos === "K" && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
    const fgDist = 100 - yard + 17, inRange = yard >= 52;
    return (
      <Card team={off} title="Fourth down: your call" sub={situation} tone="#f87171">
        <div style={grid(mobile ? 1 : 3)}>
          <Tile label="Punt" note="Flip the field and give them the ball deep" tone="#94a3b8" onClick={() => onFourth("punt")} />
          {inRange && k && <Tile label={`Field goal, ${fgDist} yards`} note={`${k.name} (${k.ovr} OVR)`} tone="#facc15" onClick={() => onFourth("fg")} />}
          <Tile label={`Go for it on 4th & ${toGo}`} note="Pick the play next" tone="#4ade80" strong onClick={() => onFourth("go")} />
        </div>
      </Card>
    );
  }
  if (phase === "presnap") {
    const isZone = g.dcScheme === "Cover 2" || g.dcScheme === "Zone Blitz", isBlitz = g.dcScheme === "Zone Blitz" || g.dcScheme === "3-4";
    const pill = (t, c) => <span style={{ fontSize: 12, fontWeight: 700, background: c ? `${c}22` : "#0b1220", color: c || "#cbd5e1", border: `1px solid ${c ? `${c}55` : C.bd}`, borderRadius: 99, padding: "4px 10px" }}>{t}</span>;
    return (
      <Card team={off} title={`PRE-SNAP READ: ${CALL_NAMES[pending] || pending}`} sub={situation} tone="#60a5fa">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {pill(`${def.ab} defense: ${g.dcScheme}`)}{pill(isZone ? "Zone coverage" : "Man coverage")}{isBlitz && pill("Blitz likely", "#f87171")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onAudible} style={{ flex: 1, height: 46, borderRadius: 10, border: "1px solid #ffffff10", background: "#0b1220", color: "#e2e8f0", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>← Change the play</button>
          <button type="button" onClick={onHike} style={{ flex: 2, height: 46, borderRadius: 10, border: 0, background: "#16a34a", color: "#fff", fontSize: 17, fontWeight: 900, letterSpacing: 1, cursor: "pointer", boxShadow: "0 6px 18px #0007" }}>HIKE ▶</button>
        </div>
      </Card>
    );
  }
  if (phase === "passing") {
    return (
      <Card team={off} title="Find your receiver" sub="The ball goes to who you pick. Open: an easy catch with room to run. Covered: a tough throw, picked off more often." tone="#60a5fa">
        <div style={grid(mobile ? 2 : Math.max(2, targets.length))}>
          {targets.map((t) => (
            <Tile key={t.id} onClick={() => onThrow(t)} label={t.name} tone={t.open ? "#4ade80" : "#f87171"} strong note={`${t.pos} · vs ${t.cbName}${t.cbOvr !== "–" ? ` (${t.cbOvr})` : ""}`}>
              <div style={{ fontSize: 12, fontWeight: 900, color: t.open ? "#4ade80" : "#f87171", marginTop: 2 }}>{t.open ? "● OPEN" : "● COVERED"}</div>
            </Tile>
          ))}
        </div>
      </Card>
    );
  }
  const best = (pos) => off.roster.filter((p) => p.pos === pos && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
  const qb = best("QB"), rb = best("RB");
  const RUNS = [["run_inside", "", "Inside Run", `${rb?.name || "Your back"} between the tackles`], ["run_outside", "", "Outside Run", `Get him to the edge: ${rb?.spd ?? "?"} speed`], ["run_screen", "", "Screen", "Let the rush come, dump it to the back"], ["scramble", "", "QB Run", `${qb?.name || "The QB"} keeps it: ${qb?.spd ?? "?"} speed`]];
  const PASSES = [["pass_quick", "", "Quick Pass", "Gets it out fast: rarely picked off"], ["pass_medium", "", "Medium Route", "The balanced throw"], ["pass_deep", "", "Deep Shot", "Big gain or bust: picked off more"], ["pass_rpo", "", "RPO", "He reads it: hand off or throw"]];
  return (
    <Card team={off} title="Your call" sub={`${situation}${g.scheme ? ` · ${g.scheme}, ${g.runPct}% runs` : ""}`}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#facc15", margin: "0 0 5px" }}>Run</div>
      <div style={{ ...grid(cols), marginBottom: 10 }}>{RUNS.map(([id, icon, l, n]) => <Tile key={id} icon={icon} label={l} note={n} tone="#facc15" onClick={() => onCall(id)} />)}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", margin: "0 0 5px" }}>Pass</div>
      <div style={grid(cols)}>{PASSES.map(([id, icon, l, n]) => <Tile key={id} icon={icon} label={l} note={n} tone="#60a5fa" onClick={() => onCall(id)} />)}</div>
      <Extras pat={pat} onPat={onPat} kneel={kneelOk(qtr, clock, lead)} onKneel={() => onCall("kneel")} />
    </Card>
  );
}

// Taking a knee: late in a half, or protecting a lead in the fourth, instead of risking a turnover.
const kneelOk = (qtr, clock, lead) => clock != null && (((qtr === 2 || qtr === 4) && clock <= 120) || (qtr === 4 && lead > 0 && clock <= 300));
// Under the playbook: the victory formation when it's there, and your call on the try after a touchdown.
function Extras({ pat, onPat, kneel, onKneel, compact }) {
  if (!onPat) return null;
  const seg = (v, l) => <button key={l} type="button" onClick={() => onPat(v)} style={pill(pat === v)}>{l}</button>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      {kneel && <button type="button" onClick={onKneel} style={{ height: 34, padding: "0 14px", borderRadius: 99, border: "1px solid #94a3b855", background: "#0b1220", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Kneel (victory formation)</button>}
      <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>After a TD</span>
      <div style={{ display: "flex", background: "#0b1220", borderRadius: 99, padding: 3, boxShadow: "inset 0 0 0 1px #ffffff14" }}>{seg(null, "Coach")}{seg("one", "Kick for 1")}{seg("two", "Go for 2")}</div>
    </div>
  );
}

// Phones: a compact playbook docked at the bottom (the field stays in view above it). One header line
// (the situation, and handing the calls back to your coach), then big plain tiles: four runs and four
// passes, the fourth-down choice, the pre-snap read with HIKE, or your receivers.
function PhoneCaller({ g, phase, fourth, pending, targets = [], onFourth, onCall, onHike, onAudible, onThrow, onCoach, pat, onPat, clock, qtr, lead }) {
  const { off, down, toGo, yard } = g;
  const situation = `${nth(down)} & ${yard + toGo >= 100 ? "Goal" : toGo} · ${yard === 50 ? "midfield" : yard > 50 ? `their ${100 - yard}` : `own ${yard}`}`;
  const best = (pos) => off.roster.filter((p) => p.pos === pos && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
  const qb = best("QB"), rb = best("RB");
  const tile = (key, label, sub, tone, onClick, big) => (
    <button key={key} type="button" onClick={onClick} style={{ minWidth: 0, minHeight: big ? 60 : 54, borderRadius: 12, border: 0, background: `${tone}1f`, color: "#fff", cursor: "pointer", padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: `inset 0 0 0 1px ${tone}44` }}>
      <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.1, textAlign: "center" }}>{label}</span>
      {sub && <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{sub}</span>}
    </button>
  );
  const row = (items, n = 4) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: 6 }}>{items}</div>;
  const head = (title, tone) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 8px" }}>
      <TeamLogo t={off} sz={22} />
      <span style={{ fontSize: 14, fontWeight: 800, color: tone }}>{title}</span>
      <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>{situation}</span>
      {onCoach && <button type="button" onClick={onCoach} style={{ marginLeft: "auto", background: "transparent", border: 0, padding: "4px 0", color: "#7dd3fc", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Coach calls it</button>}
    </div>
  );
  if (fourth) {
    const k = off.roster.filter((p) => p.pos === "K" && !p.injured).sort((a, b) => b.ovr - a.ovr)[0];
    const fgDist = 100 - yard + 17, inRange = yard >= 52;
    return <>{head("4TH DOWN", "#f87171")}{row([tile("p", "Punt", "Flip the field", "#94a3b8", () => onFourth("punt"), true), ...(inRange && k ? [tile("f", `${fgDist}-yd FG`, `${k.name.split(" ").slice(-1)[0]} · ${k.ovr}`, "#facc15", () => onFourth("fg"), true)] : []), tile("g", "Go for it", `4th & ${toGo}`, "#4ade80", () => onFourth("go"), true)], inRange && k ? 3 : 2)}</>;
  }
  if (phase === "presnap") {
    const isZone = g.dcScheme === "Cover 2" || g.dcScheme === "Zone Blitz", isBlitz = g.dcScheme === "Zone Blitz" || g.dcScheme === "3-4";
    return (<>
      {head("PRE-SNAP", "#60a5fa")}
      <div style={{ fontSize: 15, fontWeight: 800, margin: "0 2px 10px" }}>{CALL_NAMES[pending] || pending} <span style={{ color: "#94a3b8", fontWeight: 700 }}>vs {g.dcScheme} · {isZone ? "zone" : "man"}</span>{isBlitz && <span style={{ color: "#f87171", fontWeight: 900 }}> · blitz likely</span>}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onAudible} style={{ flex: 1, minHeight: 56, borderRadius: 14, border: 0, background: "#ffffff12", color: "#e2e8f0", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Change play</button>
        <button type="button" onClick={onHike} style={{ flex: 2, minHeight: 56, borderRadius: 14, border: 0, background: C.gn, color: "#fff", fontSize: 19, fontWeight: 900, letterSpacing: 1.5, cursor: "pointer" }}>HIKE</button>
      </div>
    </>);
  }
  if (phase === "passing") {
    return <>{head("THROW TO", "#60a5fa")}{row(targets.map((t) => tile(t.id, t.name.split(" ").slice(-1)[0], `${t.pos} · ${t.open ? "OPEN" : "covered"}`, t.open ? "#4ade80" : "#f87171", () => onThrow(t), true)), Math.min(4, Math.max(2, targets.length)))}</>;
  }
  const last = (p) => (p ? p.name.split(" ").slice(-1)[0] : "");
  return (<>
    {head("YOUR CALL", "#4ade80")}
    <div style={{ fontSize: 13, fontWeight: 800, color: "#facc15", margin: "0 2px 5px" }}>Run{g.scheme ? <span style={{ color: "#64748b" }}> · {g.scheme}, {g.runPct}% runs</span> : null}</div>
    {row([tile("ri", "Inside", last(rb), "#facc15", () => onCall("run_inside")), tile("ro", "Outside", rb ? `${rb.spd} spd` : "", "#facc15", () => onCall("run_outside")), tile("rs", "Screen", "to the back", "#facc15", () => onCall("run_screen")), tile("qr", "QB Run", last(qb), "#facc15", () => onCall("scramble"))])}
    <div style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", margin: "10px 2px 5px" }}>Pass</div>
    {row([tile("pq", "Quick", "safe", "#60a5fa", () => onCall("pass_quick")), tile("pm", "Medium", "balanced", "#60a5fa", () => onCall("pass_medium")), tile("pd", "Deep", "big or bust", "#60a5fa", () => onCall("pass_deep")), tile("pr", "RPO", "he reads it", "#60a5fa", () => onCall("pass_rpo"))])}
    <Extras compact pat={pat} onPat={onPat} kneel={kneelOk(qtr, clock, lead)} onKneel={() => onCall("kneel")} />
  </>);
}
