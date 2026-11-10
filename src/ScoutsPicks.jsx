// Draft day, Package A: your scouts' five for your pick (draftScouts.js), one calm row each.
// Current overall beside his ceiling, where the board has him, whether he'll last to your next
// pick, how many of your scouts are behind him and why. Beside it: what the scouts weighed.
import React from "react";
import { Face, oC, card, cardTitle, actBtn, TeamLogo, pC } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { csRank, potGrade, DEV_TRAITS } from "./scouting.js";
import { ovrText, intelRuns } from "./draftScouts.js";
import { needName } from "./needs.js";
import { posTag } from "./dline.js";

const TONE = { g: "#86efac", y: "#fde68a", dim: "#94a3b8" };
const KIND = { workup: "WORKUP", report: "REPORT", estimate: "ESTIMATE" };
const DEV_C = { generational: "#f472b6", superstar: "#f5c542", star: "#60a5fa", late: "#c4b5fd" };
const pct = (v) => `${Math.round(v * 100)}%`;
const laterTone = (v) => (v >= 0.65 ? "#94a3b8" : v <= 0.2 ? "#fca5a5" : "#fde68a");

function Col({ top, sub, color, w = 92 }) {
  return (
    <span style={{ width: w, textAlign: "center", flexShrink: 0 }}>
      <b style={{ display: "block", fontSize: 17, fontWeight: 900, lineHeight: 1.15, color: color || "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{top}</b>
      <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.8, color: "#64748b", whiteSpace: "nowrap" }}>{sub}</span>
    </span>
  );
}
const Votes = ({ x, n }) => (
  <span title={x.votes.map((s) => s.name).join(", ") || "No votes"} style={{ width: 70, textAlign: "center", flexShrink: 0 }}>
    <span style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 3 }}>{Array.from({ length: n }, (_, i) => <i key={i} style={{ width: 9, height: 9, borderRadius: 5, background: i < x.votes.length ? "#86efac" : "#ffffff1a" }} />)}</span>
    <span style={{ fontSize: 11.5, color: "#64748b" }}>{x.votes.length} of {n}</span>
  </span>
);

// The rest of the board your scouts would flag: a trait they've seen, a player they rate well above
// the board, the biggest ceiling left. Closed until you want it; the line says what's inside.
const NOTE_C = { dev: "#f5c542", gem: "#86efac", ceil: "#7dd3fc" };
function Radar({ room, open, onDraft, canDraft }) {
  const list = room.radar || [];
  if (!list.length) return null;
  const n = (k) => list.filter((x) => x.note[1] === k).length;
  const parts = [n("dev") && `${n("dev")} with a star trait or better`, n("gem") && `${n("gem")} your scouts rate above the board`, n("ceil") && "the biggest ceiling left"].filter(Boolean);
  const atPk = room.upAt || room.next, odds = (x) => (room.upAt ? x.there : x.later);
  return (
    <details style={{ marginTop: MOBILE ? 10 : 4, padding: MOBILE ? "0 14px" : "0 10px", background: MOBILE ? "#ffffff0f" : undefined, borderRadius: MOBILE ? 18 : 0 }}>
      <summary style={{ cursor: "pointer", padding: "10px 0", fontSize: 13.5, color: "#cbd5e1" }}><b style={{ color: "#fff" }}>Also on your scouts' radar</b> <span style={{ color: "#94a3b8" }}>· {parts.join(", ")}</span></summary>
      {list.map((x) => (
        <div key={x.p.id} className="calm-row" onClick={() => open(x.p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderTop: "1px solid #ffffff0a", cursor: "pointer" }}>
          <Face s={x.p.face} sz={30} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.p.name} <span style={{ fontSize: 12.5, fontWeight: 600, color: "#94a3b8" }}>{posTag(x.p)} · #{csRank(x.p)}</span></span>
            <span style={{ display: "block", fontSize: 12.5, color: NOTE_C[x.note[1]] }}>{x.note[0]}</span>
          </span>
          <span style={{ width: 64, textAlign: "center" }}><b style={{ display: "block", fontSize: 14.5, color: x.cur.kind === "estimate" ? "#e2e8f0" : oC(x.cur.v) }}>{ovrText(x.cur)}</b><span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>NOW</span></span>
          {!MOBILE && <span style={{ width: 44, textAlign: "center" }}><b style={{ display: "block", fontSize: 14.5 }}>{potGrade(x.ceil)}</b><span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>CEIL.</span></span>}
          {atPk && !MOBILE && <span style={{ width: 64, textAlign: "center" }}><b style={{ display: "block", fontSize: 14.5, color: laterTone(odds(x)) }}>{pct(odds(x))}</b><span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>AT #{atPk.overall}</span></span>}
          {canDraft && <span onClick={(e) => e.stopPropagation()}><button onClick={() => onDraft(x.p)} style={{ ...actBtn("#86efac"), padding: "6px 14px" }}>Draft</button></span>}
        </div>
      ))}
    </details>
  );
}

export function ScoutsPicks({ room, g, onDraft, canDraft }) {
  if (!room) return null;
  const { five, next, scouts, upAt } = room;
  // before your pick: will he last to it (or is it worth moving up)? On the clock: will he last to the next one?
  const atPk = upAt || next, odds = (x) => (upAt ? x.there : x.later);
  const oddsWord = (v) => (upAt ? (v >= 0.65 ? "LIKELY THERE" : v <= 0.25 ? "TRADE UP" : "COIN FLIP") : (v >= 0.65 ? "CAN WAIT" : v <= 0.2 ? "TAKE NOW" : "COIN FLIP"));
  const open = (p) => g.setSel?.(p);
  const why = (x) => <><b style={{ color: TONE[x.why.lead[0][1]], fontWeight: 800 }}>{x.why.lead[0][0]}.</b> {x.why.rest ? `${x.why.rest[0].toUpperCase()}${x.why.rest.slice(1)}.` : ""}{x.why.wait && !upAt ? <span style={{ color: "#94a3b8" }}> Can wait.</span> : null}</>;
  const dev = (x) => (x.r.dev && DEV_C[x.r.dev] ? <span style={{ color: DEV_C[x.r.dev] }}>{DEV_TRAITS[x.r.dev]?.name}</span> : null);
  if (MOBILE) return (<>
    <div style={{ background: "#ffffff0f", borderRadius: 18, padding: "0 14px" }}>
      {five.map((x, i) => (
        <div key={x.p.id} style={{ padding: "10px 0", borderTop: i ? "1px solid #ffffff10" : 0 }}>
          <div onClick={() => open(x.p)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Face s={x.p.face} sz={38} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.p.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{posTag(x.p)} · #{csRank(x.p)} · ceiling <b style={{ color: "#e2e8f0" }}>{potGrade(x.ceil)}</b></span>
            </span>
            <span style={{ textAlign: "right" }}><b style={{ display: "block", fontSize: 16, color: x.cur.kind === "estimate" ? "#e2e8f0" : oC(x.cur.v) }}>{ovrText(x.cur)}</b><span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.6, color: "#64748b" }}>CURRENT</span></span>
            {canDraft && <button onClick={(e) => { e.stopPropagation(); onDraft(x.p); }} style={{ ...actBtn("#22c55e", true), minHeight: 40, padding: "0 14px" }}>Draft</button>}
          </div>
          <div style={{ fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.4, margin: "6px 0 2px" }}>{why(x)}</div>
          <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: "#94a3b8" }}>
            <span>{x.votes.length} of {scouts.length} scouts</span>
            {atPk && <span style={{ color: laterTone(odds(x)) }}>There at #{atPk.overall}: {pct(odds(x))}</span>}
          </div>
        </div>
      ))}
    </div>
    <Radar room={room} open={open} onDraft={onDraft} canDraft={canDraft} />
  </>);
  return (
    <div style={{ ...card, padding: "10px 12px 8px" }}>
      <div style={{ display: "flex", gap: 14, padding: "4px 10px 6px 64px", fontSize: 11, fontWeight: 900, letterSpacing: 0.9, color: "#64748b" }}>
        <span style={{ flex: 1 }}>YOUR SCOUTS' FIVE</span>
        <span style={{ width: 92, textAlign: "center" }}>CURRENT OVR</span><span style={{ width: 70, textAlign: "center" }}>CEILING</span><span style={{ width: 70, textAlign: "center" }}>BOARD</span>
        {atPk && <span style={{ width: 92, textAlign: "center" }}>AT #{atPk.overall}</span>}<span style={{ width: 70, textAlign: "center" }}>SCOUTS</span><span style={{ width: 76 }} />
      </div>
      {five.map((x, i) => (
        <div key={x.p.id} className="calm-row" onClick={() => open(x.p)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 10px", cursor: "pointer", background: i === 0 ? "#ffffff08" : undefined }}>
          <span style={{ width: 18, textAlign: "right", fontSize: 16, fontWeight: 900, color: "#64748b" }}>{i + 1}</span>
          <Face s={x.p.face} sz={36} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 17, fontWeight: 800, color: "#f8fafc" }}>{x.p.name} <span style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{posTag(x.p)} · {x.p.bio?.college}</span></span>
            <span style={{ display: "block", fontSize: 13, color: "#cbd5e1", marginTop: 2, lineHeight: 1.4 }}>{why(x)}</span>
          </span>
          <Col top={ovrText(x.cur)} sub={KIND[x.cur.kind]} color={x.cur.kind === "estimate" ? "#e2e8f0" : oC(x.cur.v)} />
          <Col w={70} top={potGrade(x.ceil)} sub={dev(x) || (x.r.potV != null ? "YOUR READ" : "CONSENSUS")} />
          <Col w={70} top={`#${csRank(x.p)}`} sub="RANK" />
          {atPk && <Col top={pct(odds(x))} sub={oddsWord(odds(x))} color={laterTone(odds(x))} />}
          <Votes x={x} n={Math.max(1, scouts.length)} />
          <span style={{ width: 76, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>{canDraft ? <button onClick={() => onDraft(x.p)} style={{ ...actBtn("#22c55e", true), padding: "8px 18px" }}>Draft</button> : null}</span>
        </div>
      ))}
      {!five.length && <div style={{ fontSize: 15, color: "#94a3b8", padding: 12 }}>Nobody left your scouts would take here.</div>}
      <Radar room={room} open={open} onDraft={onDraft} canDraft={canDraft} />
    </div>
  );
}

// What went into the five: the club's needs, who's getting old, the money and the window.
export function ScoutsWeighed({ room }) {
  if (!room) return null;
  const { ctx, next } = room;
  const old = ctx.aging[0];
  const line = (k, v, c) => <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13.5, padding: "5px 0", borderTop: "1px solid #ffffff0a" }}><span style={{ color: "#94a3b8" }}>{k}</span><b style={{ color: c || "#fff", textAlign: "right" }}>{v}</b></div>;
  const win = { win: "Win now", middle: "In the middle", rebuild: "Rebuilding" }[ctx.window];
  return (
    <div style={{ ...card, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ ...cardTitle, fontSize: 16, marginBottom: 4 }}>What the scouts weighed</div>
      {line("Biggest needs", ctx.needs.join(" · ") || "None")}
      {line("Getting old", old ? `${old.p.name}, ${old.p.age}` : "Nobody yet")}
      {ctx.capRoom != null && line("Cap room", `$${ctx.capRoom.toFixed(1)}M`, ctx.capRoom < 25 ? "#fca5a5" : "#86efac")}
      {line("Window", `${win} (${ctx.record})`)}
      <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.45, marginTop: 6 }}>
        {ctx.ready >= 0.4 ? "Today's rating counts for a lot here: they want players who help this season." : ctx.ready <= 0.2 ? "They're looking past this season: ceiling first." : "A balance of who helps now and who gets better."}
        {room.upAt ? ` "At #${room.upAt.overall}" is how often he's still there when you're up, with the other clubs picking the way they see him.` : next ? ` "At #${next.overall}" is how often he's still there for your next pick when the other clubs pick the way they see him.` : ""}
      </div>
    </div>
  );
}

// The league intel: the clubs picking before you (before your next pick, when you're on the clock),
// what each is likely to take, played out the way they really pick. Read it to judge a trade up:
// three clubs ahead of you after a corner means the corner you want won't last.
export function AheadOfYou({ room, teams, ui, n = 9 }) {
  const intel = room?.intel, to = room?.intelTo;
  if (!intel || !to) return null;
  const runs = intelRuns(intel, room.ctx.needs).slice(0, 4);
  const rows = intel.picks.slice(0, n);
  const more = intel.picks.length - rows.length;
  return (
    <div style={{ ...card, padding: "14px 16px 10px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...cardTitle, fontSize: 16 }}>{room.upAt ? "Ahead of you" : "Before your next pick"}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#94a3b8" }}>to #{to.overall} · {intel.picks.length} pick{intel.picks.length === 1 ? "" : "s"}</span>
      </div>
      {runs.length > 0 && <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.45, margin: "6px 0 4px" }}>
        {runs.map((r, i) => <span key={r.g}>{i ? (i === runs.length - 1 ? " and " : ", ") : ""}<b style={{ color: r.mine ? "#fde68a" : "#fff" }}>{r.n} {r.n === 1 ? "club" : "clubs"}</b> after {r.n === 1 ? `a ${needName(r.g)}` : `${needName(r.g)}s`.replace("ys", "ies")}</span>)}.
        {runs.some((r) => r.mine) ? <span style={{ color: "#94a3b8" }}> Yellow is one of your needs.</span> : null}
      </div>}
      {rows.map((x) => {
        const t = teams[x.pk.owner], [g, sh] = x.pos[0] || [], [who, wsh] = x.who[0] || [];
        const mine = room.ctx.needs.includes(g);
        return (
          <div key={x.pk.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderTop: "1px solid #ffffff0a" }}>
            <span style={{ width: 34, fontSize: 12.5, fontWeight: 800, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>#{x.pk.overall}</span>
            <TeamLogo t={t} sz={24} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t?.name}</span>
              {who && wsh >= 0.3 && <span style={{ display: "block", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Likely {who.name}</span>}
            </span>
            {g && <span style={{ textAlign: "right", whiteSpace: "nowrap" }}><b style={{ fontSize: 13.5, color: mine ? "#fde68a" : pC(g) }}>{g}</b> <span style={{ fontSize: 12.5, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{pct(sh)}</span></span>}
          </div>
        );
      })}
      {more > 0 && <div style={{ fontSize: 12.5, color: "#64748b", paddingTop: 6, borderTop: "1px solid #ffffff0a" }}>{more} more pick{more === 1 ? "" : "s"} before #{to.overall}</div>}
    </div>
  );
}
