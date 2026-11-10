// Trade Deadline Day: the day as one calm screen. The clock runs 9 AM to the 4 PM ET deadline an
// hour at a time. Your phone (the offers coming in) sits first; beside it the day's feed; then
// who's on the block, and who's buying and who's selling.
import { fillsNeed } from "./needs.js";
import Select from "./Select.jsx";
import React, { useEffect, useRef, useState } from "react";
import { C, oC, Face, TeamLogo, Pills, actBtn, card, cardTitle, fitH, field, Section } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { DEADLINE_HOURS, LAST_HOUR, marketBoard, leagueTradeBlock } from "./deadline.js";
import { posTag } from "./dline.js";
import { evaluateTrade } from "./trade.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const KIND = {
  trade: { tag: "Trade", c: "#fca5a5" },
  rumor: { tag: "Rumor", c: "#fcd34d" },
  news: { tag: "News", c: "#7dd3fc" },
  mine: { tag: "You", c: "#86efac" },
};
const hourOf = (h) => DEADLINE_HOURS[h].replace(":00", "");

// How the offer stacks up for you, on the trade-value scale.
function verdict(o, pickValue) {
  const get = (o.give?.tradeVal || 0) + (o.givePicks || []).reduce((s, pk) => s + pickValue(pk), 0);
  const r = get / (o.want.tradeVal || 1);
  return r >= 1.08 ? { t: "Good value for you", c: "#86efac" } : r >= 0.92 ? { t: "A fair deal", c: "#fde68a" } : { t: "They're asking a lot", c: "#fdba74" };
}

// One player in an offer: face, name, what he is.
const Who = ({ p, setSel }) => (
  <button onClick={() => setSel(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent", border: 0, padding: 0, color: "inherit", cursor: "pointer", textAlign: "left" }}>
    <Face s={p.face} sz={34} />
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
      <span style={{ display: "block", fontSize: 13, color: "#94a3b8" }}>{posTag(p)} · {p.age} · {money(p.salary)}</span>
    </span>
    <b style={{ fontSize: 17, color: oC(p.ovr) }}>{p.ovr}</b>
  </button>
);

function Offer({ o, teams, pickValue, onAccept, onDecline, setSel, hour }) {
  const t = teams[o.fromTm];
  const v = verdict(o, pickValue);
  const exp = 2 - (hour - o.hour);
  const lbl = { fontSize: 12, fontWeight: 800, letterSpacing: 0.8, color: "#64748b", margin: "10px 0 6px" };
  return (
    <div style={{ background: "#ffffff0a", borderRadius: 16, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {t && <TeamLogo t={t} sz={30} glow />}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t ? `${t.city} ${t.name}` : "A club"}</span>
          <span style={{ display: "block", fontSize: 13, color: "#94a3b8" }}>{t ? `${t.w || 0}-${t.l || 0} · ` : ""}good for {exp} more hour{exp === 1 ? "" : "s"}</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: v.c, whiteSpace: "nowrap" }}>{v.t}</span>
      </div>
      <div style={lbl}>THEY WANT</div>
      <Who p={o.want} setSel={setSel} />
      <div style={lbl}>YOU GET</div>
      {o.give && <Who p={o.give} setSel={setSel} />}
      {(o.givePicks || []).map((pk) => <div key={pk.id} style={{ fontSize: 15, fontWeight: 800, padding: "3px 0" }}>{pk.yr ? `${pk.yr} ` : ""}round {pk.rd} pick{pk.overall ? <span style={{ color: "#94a3b8", fontWeight: 600 }}> · #{pk.overall}</span> : null}</div>)}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => onAccept(o)} style={{ ...actBtn(C.gn, true), flex: 1, minHeight: MOBILE ? 44 : 36 }}>Accept</button>
        <button onClick={() => onDecline(o)} style={{ ...actBtn("#cbd5e1"), flex: 1, minHeight: MOBILE ? 44 : 36 }}>Decline</button>
      </div>
    </div>
  );
}

// What he'd really cost, in draft-pick terms: the latest round whose pick alone his club would take
// for him today, judged the way your offer will be (their premium for a starter, how a rebuilding
// or contending club values picks). The line on the block is a price they'd actually accept.
const RD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
function costIn(p, team, pickValue) {
  const takes = (rd) => evaluateTrade({ sendPk: [{ rd, overall: 16 + (rd - 1) * 32 }], get: [p], them: team, pick: pickValue, season: true }).accept;
  for (let rd = 7; rd >= 1; rd--) if (takes(rd)) return rd === 7 ? "a late pick" : `a ${RD[rd]}`;
  return "more than a 1st";
}
const POSITIONS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S"];

// The league's trade block: who's available, why, what he'd cost, and a call about him.
function TradeBlock({ teams, ui, needs, pickValue, onInquire, setSel, closed }) {
  const [needOnly, setNeedOnly] = useState(false);
  const [pos, setPos] = useState("ALL");
  const list = leagueTradeBlock(teams, ui).filter((x) => (!needOnly || fillsNeed(needs, x.p)) && (pos === "ALL" || x.p.pos === pos));
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <Pills items={[[false, "Everyone"], [true, "Your needs"]]} value={needOnly} onChange={setNeedOnly} label="Show" />
        <Select value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Position" style={field}>
          <option value="ALL">All positions</option>{POSITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select>
      </div>
      {list.slice(0, 60).map(({ p, ti, why }) => (
        <div key={p.id} className="calm-row" onClick={() => setSel(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px", margin: "0 -8px", cursor: "pointer" }}>
          <Face s={p.face} sz={36} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>{needs.includes(p.pos) && <span style={{ fontSize: 12, color: "#86efac", fontWeight: 800 }}>need</span>}</span>
            <span title={why} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><TeamLogo t={teams[ti]} sz={16} glow />{posTag(p)} · {p.age} · {money(p.salary)} · <span style={{ color: "#cbd5e1" }}>asks {costIn(p, teams[ti], pickValue)}</span></span>
          </span>
          <b style={{ fontSize: 17, color: oC(p.ovr), width: 28, textAlign: "right" }}>{p.ovr}</b>
          {!closed && <span className="calm-act" onClick={(e) => e.stopPropagation()}><button onClick={() => onInquire(p, ti)} style={actBtn("#7dd3fc")}>Call</button></span>}
        </div>
      ))}
      {!list.length && <div style={{ fontSize: 14, color: "#94a3b8", padding: "6px 0" }}>{needOnly ? "Nobody at your positions of need is on the block." : "Nobody's on the block."}</div>}
    </>
  );
}

function Feed({ dl, teams }) {
  return dl.feed.map((f) => {
    const k = KIND[f.kind] || KIND.news;
    const t = f.ti != null ? teams[f.ti] : null;
    return (
      <div key={f.id} style={{ display: "flex", gap: 12, padding: "9px 10px", margin: "0 -8px", borderRadius: 12, background: f.big ? "#ef44440f" : "transparent" }}>
        <span style={{ width: 50, flexShrink: 0, fontSize: 13, color: "#64748b", textAlign: "right", paddingTop: 2, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{hourOf(f.hour)}</span>
        {t ? <TeamLogo t={t} sz={24} glow /> : <span style={{ width: 24, flexShrink: 0 }} />}
        <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.45, color: f.kind === "trade" ? "#f8fafc" : "#cbd5e1", fontWeight: f.kind === "trade" ? 700 : 400 }}>
          <b style={{ color: k.c, fontWeight: 800, marginRight: 6 }}>{f.big ? "Breaking" : k.tag}</b>{f.text}
        </span>
      </div>
    );
  });
}

function Market({ buyers, sellers, teams }) {
  const line = (x, c) => <div key={x.ti} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}><TeamLogo t={teams[x.ti]} sz={22} /><span style={{ flex: 1, minWidth: 0, fontSize: 15, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{teams[x.ti]?.name || x.name}</span><b style={{ fontSize: 14, color: c, fontVariantNumeric: "tabular-nums" }}>{x.rec}</b></div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: MOBILE ? "1fr" : "1fr 1fr", gap: "0 24px" }}>
      <div><div style={{ ...cardTitle, fontSize: 15, margin: "4px 0 6px" }}>Buying</div>{buyers.slice(0, 8).map((b) => line(b, "#86efac"))}{!buyers.length && <div style={{ fontSize: 14, color: "#94a3b8" }}>Nobody's clearly in win-now mode.</div>}</div>
      <div><div style={{ ...cardTitle, fontSize: 15, margin: "4px 0 6px" }}>Selling</div>{sellers.slice(0, 8).map((s) => line(s, "#fca5a5"))}{!sellers.length && <div style={{ fontSize: 14, color: "#94a3b8" }}>Nobody's clearly selling.</div>}</div>
    </div>
  );
}

export default function DeadlineDay({ dl, teams, ui, capSpace, pickValue, needs = [], onInquire, onAdvance, onFinish, onAccept, onDecline, onOpenTrade, onClose, setSel }) {
  const [auto, setAuto] = useState(false);
  const [view, setView] = useState(MOBILE ? "phone" : "block");
  const me = teams[ui];
  const { buyers, sellers } = marketBoard(teams, ui);
  // Auto-advance the clock, pausing whenever your phone has offers waiting.
  // the latest onAdvance (it reads the rosters as they are when the hour ticks over, not 4.5s earlier)
  const advanceRef = useRef(onAdvance);
  useEffect(() => { advanceRef.current = onAdvance; });
  useEffect(() => {
    if (!auto || dl.done || dl.offers.length) return;
    const t = setTimeout(() => advanceRef.current(), 4500);
    return () => clearTimeout(t);
  }, [auto, dl.hour, dl.done, dl.offers.length]);
  const left = LAST_HOUR - dl.hour;
  const status = dl.done ? "The deadline has passed" : left === 1 ? "Final hour" : `${left} hours to go`;

  // the clock: the hour, what's left, the day as a thin line
  const clock = (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.6, color: dl.done ? "#94a3b8" : "#fca5a5" }}>{dl.done ? "DEADLINE DAY · FINAL" : "TRADE DEADLINE DAY"}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: MOBILE ? 30 : 38, fontWeight: 900, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{DEADLINE_HOURS[dl.hour]}<span style={{ fontSize: 15, color: "#94a3b8", marginLeft: 6 }}>ET</span></span>
          <span style={{ fontSize: 15, fontWeight: 700, color: dl.done ? "#94a3b8" : "#fecaca" }}>{status}</span>
        </div>
      </div>
      {!MOBILE && <span style={{ marginLeft: "auto", textAlign: "right", fontSize: 14, color: "#94a3b8" }}>
        <b style={{ color: "#fff", fontSize: 16 }}>{me?.w || 0}-{me?.l || 0}</b> after week 9<br />
        Cap space <b style={{ color: capSpace >= 0 ? "#86efac" : "#fca5a5" }}>{money(capSpace)}</b>
      </span>}
    </div>
  );
  const track = <div style={{ display: "flex", gap: 3, marginTop: 10 }}>{DEADLINE_HOURS.map((h, i) => <div key={h} title={h} style={{ flex: 1, height: 4, borderRadius: 2, background: i < dl.hour ? "#ef4444aa" : i === dl.hour ? "#fff" : "#ffffff1a" }} />)}</div>;
  const actions = !dl.done ? <>
    <button onClick={onAdvance} style={{ ...actBtn("#fff", false), background: "#fff", color: "#0b1220", padding: "9px 18px", fontSize: 14.5 }}>Advance to {DEADLINE_HOURS[dl.hour + 1]}</button>
    <button onClick={() => setAuto((a) => !a)} style={{ ...actBtn("#e2e8f0"), padding: "9px 16px" }}>{auto ? "Pause the clock" : "Run the clock"}</button>
    <button onClick={onOpenTrade} style={{ ...actBtn("#7dd3fc"), padding: "9px 16px" }}>Make a call</button>
    <button onClick={onFinish} style={{ ...actBtn("#94a3b8"), padding: "9px 16px" }}>Sim to 4:00 PM</button>
  </> : <button onClick={onClose} style={{ ...actBtn(C.gn, true), padding: "9px 18px", fontSize: 14.5 }}>Back to the season</button>;

  const phone = (
    <>
      <div style={{ ...cardTitle, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>Your phone{dl.offers.length > 0 && <span style={{ fontSize: 13, fontWeight: 900, color: "#0b1220", background: "#fff", borderRadius: 99, padding: "1px 8px" }}>{dl.offers.length}</span>}</div>
      {dl.offers.map((o) => <Offer key={o.id} o={o} teams={teams} pickValue={pickValue} onAccept={onAccept} onDecline={onDecline} setSel={setSel} hour={dl.hour} />)}
      {!dl.offers.length && <div style={{ fontSize: 14.5, color: "#94a3b8", lineHeight: 1.5 }}>{dl.done ? "The phones have gone quiet." : "No offers right now. Calls come in through the day."}{auto && !dl.done ? " The clock stops when one does." : ""}</div>}
      {dl.done && <>
        <div style={{ ...cardTitle, fontSize: 15, margin: "16px 0 6px" }}>Today's deals · {dl.deals.length}</div>
        {dl.deals.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "4px 0", color: "#cbd5e1" }}>{teams[d.buyer] && <TeamLogo t={teams[d.buyer]} sz={18} />}<span style={{ minWidth: 0 }}><b style={{ color: "#fff" }}>{d.player.name}</b> {d.player.pos} {d.player.ovr} from {teams[d.seller]?.ab}</span></div>)}
        {!dl.deals.length && <div style={{ fontSize: 14, color: "#94a3b8" }}>A quiet deadline: no trades between other clubs.</div>}
      </>}
    </>
  );

  // phones: the clock, then one thing at a time; advancing it is the action bar's job
  if (MOBILE) return (
    <div>
      <div style={{ ...card, padding: "14px 16px", marginBottom: 12 }}>
        {clock}{track}
        {!dl.done && <button onClick={() => setAuto((a) => !a)} style={{ ...actBtn("#e2e8f0"), width: "100%", minHeight: 44, marginTop: 12 }}>{auto ? "Pause the clock" : "Run the clock"}</button>}
      </div>
      <Pills full items={[["phone", `Phone${dl.offers.length ? ` · ${dl.offers.length}` : ""}`], ["feed", "Feed"], ["block", "Block"], ["market", "Market"]]} value={view} onChange={setView} label="Deadline" style={{ marginBottom: 12 }} />
      <div style={{ ...card, padding: "14px 16px" }}>
        {view === "phone" && phone}
        {view === "feed" && <Feed dl={dl} teams={teams} />}
        {view === "block" && <TradeBlock teams={teams} ui={ui} needs={needs} pickValue={pickValue} onInquire={onInquire} setSel={setSel} closed={dl.done} />}
        {view === "market" && <Market buyers={buyers} sellers={sellers} teams={teams} />}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14, background: "radial-gradient(120% 140% at 0% 0%, #7f1d1d44, transparent 60%), #111827" }}>
        {clock}{track}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>{actions}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.15fr)", gap: 14, ...fitH, height: "calc(100vh - 300px)" }}>
        <div style={{ ...card, overflowY: "auto", minHeight: 0 }}>{phone}</div>
        <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ ...cardTitle, marginBottom: 6 }}>The feed</div>
          <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}><Feed dl={dl} teams={teams} /></div>
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Pills items={[["block", "On the block"], ["market", "Buying and selling"]]} value={view} onChange={setView} label="Market" style={{ marginBottom: 10, alignSelf: "flex-start" }} />
          <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
            {view === "market" ? <Market buyers={buyers} sellers={sellers} teams={teams} /> : <TradeBlock teams={teams} ui={ui} needs={needs} pickValue={pickValue} onInquire={onInquire} setSel={setSel} closed={dl.done} />}
          </div>
        </div>
      </div>
    </div>
  );
}
