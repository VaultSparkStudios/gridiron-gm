// Trade Deadline Day: a whole screen for the day, broadcast style. The clock runs 9 AM to the
// 4 PM ET deadline an hour at a time; the feed breaks every deal and rumor, your phone shows the
// offers coming in, and the board lists who's buying and who's selling.
import React, { useEffect, useState } from "react";
import { C, oC, Bdg, Btn, TeamLogo } from "./ui.jsx";
import { DEADLINE_HOURS, LAST_HOUR, marketBoard, leagueTradeBlock } from "./deadline.js";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const KIND = {
  trade: { tag: "TRADE", c: "#ef4444" },
  rumor: { tag: "RUMOR", c: "#f59e0b" },
  news: { tag: "NEWS", c: "#38bdf8" },
  mine: { tag: "YOUR PHONE", c: "#22c55e" },
};

function Clock({ hour, done }) {
  const left = LAST_HOUR - hour;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 40, fontWeight: 900, letterSpacing: 2, color: done ? "#94a3b8" : "#fff", textShadow: done ? "none" : "0 0 18px #ef444488" }}>{DEADLINE_HOURS[hour]}<span style={{ fontSize: 16, marginLeft: 6, color: "#fca5a5" }}>ET</span></div>
      <div style={{ fontSize: 15, fontWeight: 800, color: done ? "#94a3b8" : "#fecaca" }}>{done ? "THE DEADLINE HAS PASSED" : left === 1 ? "FINAL HOUR" : `${left} HOURS TO THE DEADLINE`}</div>
    </div>
  );
}

function HourTrack({ hour }) {
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
      {DEADLINE_HOURS.map((h, i) => (
        <div key={h} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: 6, borderRadius: 3, background: i < hour ? "#ef4444" : i === hour ? "#fff" : "#ffffff22" }} />
          <div style={{ fontSize: 10, color: i === hour ? "#fff" : "#ffffff66", marginTop: 3, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}>{h.replace(":00", "")}</div>
        </div>
      ))}
    </div>
  );
}

function Ticker({ deals, teams, yr }) {
  if (!deals.length) return null;
  const text = deals.map((d) => `${teams[d.buyer]?.ab} get ${d.player.name} (${d.player.pos} ${d.player.ovr}) from ${teams[d.seller]?.ab}`).join("   •   ");
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", background: "#7f1d1d", borderTop: "1px solid #ef4444", borderBottom: "1px solid #ef4444", padding: "6px 0", fontSize: 14, fontWeight: 800, color: "#fee2e2" }}>
      <style>{"@keyframes dl-tick { from { transform: translateX(0) } to { transform: translateX(-50%) } }"}</style>
      <span style={{ display: "inline-block", paddingLeft: "100%", animation: `dl-tick ${Math.max(18, text.length / 6)}s linear infinite` }}>{`DEADLINE DEALS ${yr}:   ${text}   •   ${text}`}</span>
    </div>
  );
}

// How the offer stacks up for you, on the trade-value scale.
function verdict(o, pickValue) {
  const get = (o.give?.tradeVal || 0) + (o.givePicks || []).reduce((s, pk) => s + pickValue(pk), 0);
  const give = o.want.tradeVal || 1;
  const r = get / give;
  return r >= 1.08 ? { t: "Good value for you", c: C.gn } : r >= 0.92 ? { t: "Fair deal", c: "#facc15" } : { t: "They're asking a lot", c: "#f97316" };
}

function Offer({ o, teams, pickValue, onAccept, onDecline, setSel, hour }) {
  const t = teams[o.fromTm];
  const v = verdict(o, pickValue);
  const exp = 2 - (hour - o.hour);
  return (
    <div style={{ background: "#0b1220", border: `1px solid ${C.bd}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {t && <TeamLogo t={t} sz={30} />}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 900 }}>{t ? `${t.city} ${t.name}` : "A club"}</div><div style={{ fontSize: 12, color: C.mt }}>{t ? `${t.w || 0}-${t.l || 0}` : ""} · offer good for {exp} more hour{exp === 1 ? "" : "s"}</div></div>
        <span style={{ fontSize: 12, fontWeight: 800, color: v.c }}>{v.t}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
        <div><div style={{ fontSize: 11, fontWeight: 900, color: "#fca5a5", letterSpacing: 1 }}>THEY WANT</div>
          <div onClick={() => setSel(o.want)} style={{ cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}><Bdg pos={o.want.pos} />{o.want.name} <span style={{ color: oC(o.want.ovr) }}>{o.want.ovr}</span></div>
          <div style={{ fontSize: 12, color: C.mt }}>Age {o.want.age} · {money(o.want.salary)}</div></div>
        <div><div style={{ fontSize: 11, fontWeight: 900, color: "#86efac", letterSpacing: 1 }}>YOU GET</div>
          {o.give && <div onClick={() => setSel(o.give)} style={{ cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}><Bdg pos={o.give.pos} />{o.give.name} <span style={{ color: oC(o.give.ovr) }}>{o.give.ovr}</span></div>}
          {o.give && <div style={{ fontSize: 12, color: C.mt }}>Age {o.give.age} · {money(o.give.salary)}</div>}
          {(o.givePicks || []).map((pk) => <div key={pk.id} style={{ fontWeight: 800 }}>{pk.yr ? `${pk.yr} ` : ""}Round {pk.rd} pick{pk.overall ? ` (#${pk.overall})` : ""}</div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => onAccept(o)} bg={C.gn} style={{ flex: 1, fontWeight: 900 }}>Accept</Btn>
        <Btn onClick={() => onDecline(o)} bg="#334155" c="#e2e8f0" style={{ flex: 1 }}>Decline</Btn>
      </div>
    </div>
  );
}

const POSITIONS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DL", "LB", "CB", "S"];

// Roughly what he'd cost, in draft-pick terms.
function costIn(p, pickValue) {
  const v = p.tradeVal || 0;
  for (let rd = 1; rd <= 7; rd++) if (v >= pickValue({ rd, overall: 16 + (rd - 1) * 32 }) * 0.85) return rd === 1 ? "a 1st or more" : `about a ${["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][rd]}`;
  return "a late pick";
}

// The league's trade block: who's available, why, and a button to call about him.
function TradeBlock({ teams, ui, needs, pickValue, onInquire, setSel, closed }) {
  const [needOnly, setNeedOnly] = useState(false);
  const [pos, setPos] = useState("ALL");
  const all = leagueTradeBlock(teams, ui);
  const list = all.filter((x) => (!needOnly || needs.includes(x.p.pos)) && (pos === "ALL" || x.p.pos === pos));
  const btn = (on) => ({ background: on ? `${C.bl}33` : C.bg, border: `1px solid ${on ? C.bl : C.bd}`, color: on ? "#bfdbfe" : "#cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" });
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setNeedOnly((v) => !v)} style={btn(needOnly)} title={`Your needs: ${needs.join(", ") || "none"}`}>Your needs{needs.length ? ` (${needs.slice(0, 4).join(", ")})` : ""}</button>
        <select value={pos} onChange={(e) => setPos(e.target.value)} style={{ ...btn(pos !== "ALL"), padding: "4px 6px" }}>
          <option value="ALL">All positions</option>{POSITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <span style={{ fontSize: 12, color: C.mt, marginLeft: "auto" }}>{list.length} available</span>
      </div>
      <div style={{ maxHeight: 520, overflowY: "auto" }}>
        {list.slice(0, 60).map(({ p, ti, why }) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 2px", borderBottom: `1px solid ${C.bd}66` }}>
            <TeamLogo t={teams[ti]} sz={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 800 }}><Bdg pos={p.pos} /><span onClick={() => setSel(p)} style={{ cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>{needs.includes(p.pos) && <span title="A position you need" style={{ fontSize: 10, color: C.gn, fontWeight: 900 }}>NEED</span>}</div>
              <div style={{ fontSize: 11, color: C.mt }}>{teams[ti].ab} · age {p.age} · {money(p.salary)}{p.contract ? `, ${p.contract} yr${p.contract > 1 ? "s" : ""}` : ""} · {why} · asking {costIn(p, pickValue)}</div>
            </div>
            <b style={{ fontSize: 16, color: oC(p.ovr), minWidth: 24, textAlign: "right" }}>{p.ovr}</b>
            <Btn onClick={() => onInquire(p, ti)} disabled={closed} bg="#1d4ed8" style={{ fontSize: 12, padding: "4px 9px" }}>Inquire</Btn>
          </div>
        ))}
        {!list.length && <div style={{ fontSize: 14, color: C.mt }}>{needOnly ? "Nobody at your positions of need is on the block." : "Nobody's on the block."}</div>}
      </div>
    </>
  );
}

export default function DeadlineDay({ dl, teams, ui, yr, capSpace, pickValue, needs = [], onInquire, onAdvance, onFinish, onAccept, onDecline, onOpenTrade, onClose, setSel }) {
  const [auto, setAuto] = useState(false);
  const me = teams[ui];
  const { buyers, sellers } = marketBoard(teams, ui);
  // Auto-advance the clock, pausing whenever your phone has offers waiting.
  useEffect(() => {
    if (!auto || dl.done || dl.offers.length) return;
    const t = setTimeout(onAdvance, 4500);
    return () => clearTimeout(t);
  }, [auto, dl.hour, dl.done, dl.offers.length]);
  const panel = { background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 12, minWidth: 0 };
  const head = { fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#fca5a5", marginBottom: 8 };
  return (
    <div style={{ margin: "-4px 0 0" }}>
      <div style={{ background: "linear-gradient(120deg,#450a0a,#0b0f19 55%,#1e1b4b)", border: "1px solid #ef444466", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: "#fca5a5" }}>{dl.done ? "DEADLINE DAY · FINAL" : "● LIVE · TRADE DEADLINE DAY"}</div>
            <Clock hour={dl.hour} done={dl.done} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {me && <TeamLogo t={me} sz={40} />}
            <div style={{ fontSize: 13, color: "#cbd5e1" }}><div><b style={{ color: "#fff" }}>{me?.w || 0}-{me?.l || 0}</b> after week 9</div><div>Cap space <b style={{ color: capSpace >= 0 ? C.gn : C.rd }}>{money(capSpace)}</b></div></div>
          </div>
        </div>
        <HourTrack hour={dl.hour} />
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {!dl.done ? (
            <>
              <Btn onClick={onAdvance} bg="#dc2626" style={{ fontWeight: 900, fontSize: 15, padding: "8px 16px" }}>Advance to {DEADLINE_HOURS[dl.hour + 1]} ▸</Btn>
              <Btn onClick={() => setAuto((a) => !a)} bg={auto ? "#7f1d1d" : "#1e293b"} c="#fecaca" style={{ fontSize: 14 }}>{auto ? "⏸ Pause clock" : "▶ Run the clock"}</Btn>
              <Btn onClick={onOpenTrade} bg="#1d4ed8" style={{ fontSize: 14 }}>📞 Make a call (trade screen)</Btn>
              <Btn onClick={onFinish} bg="#1e293b" c="#94a3b8" style={{ fontSize: 13 }}>Sim to 4:00 PM</Btn>
            </>
          ) : <Btn onClick={onClose} bg={C.gn} style={{ fontWeight: 900, fontSize: 15, padding: "8px 18px" }}>Back to the season ▸</Btn>}
        </div>
      </div>
      <Ticker deals={dl.deals} teams={teams} yr={yr} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 10, marginTop: 10 }}>
        <div style={{ ...panel, gridColumn: "span 1" }}>
          <div style={head}>DEADLINE FEED</div>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {dl.feed.map((f) => {
              const k = KIND[f.kind] || KIND.news;
              const t = f.ti != null ? teams[f.ti] : null;
              return (
                <div key={f.id} style={{ display: "flex", gap: 10, padding: "9px 4px", borderBottom: `1px solid ${C.bd}66`, background: f.big ? "#ef444414" : "transparent" }}>
                  <div style={{ width: 52, flex: "0 0 auto", fontSize: 11, color: C.mt, textAlign: "right" }}>{DEADLINE_HOURS[f.hour].replace(":00", "")}</div>
                  {t ? <TeamLogo t={t} sz={26} /> : <span style={{ width: 26 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: k.c, marginRight: 6 }}>{f.big ? "BREAKING" : k.tag}</span>
                    <span style={{ fontSize: f.kind === "trade" ? 15 : 14, fontWeight: f.kind === "trade" ? 700 : 400, color: "#e2e8f0" }}>{f.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={panel}>
          <div style={head}>YOUR PHONE {dl.offers.length > 0 && <span style={{ background: "#dc2626", color: "#fff", borderRadius: 10, padding: "0 7px", marginLeft: 6 }}>{dl.offers.length}</span>}</div>
          {dl.offers.map((o) => <Offer key={o.id} o={o} teams={teams} pickValue={pickValue} onAccept={onAccept} onDecline={onDecline} setSel={setSel} hour={dl.hour} />)}
          {!dl.offers.length && <div style={{ fontSize: 14, color: C.mt, lineHeight: 1.5 }}>{dl.done ? "The phones have gone quiet." : "No offers on the table right now. Calls come in through the day, and put players on the trade block to draw interest. Or pick up the phone yourself with Make a call."}{auto && !dl.done ? " The clock pauses whenever an offer comes in." : ""}</div>}
          {dl.done && (
            <div style={{ marginTop: 12 }}>
              <div style={head}>TODAY'S DEALS ({dl.deals.length})</div>
              {dl.deals.map((d, i) => <div key={i} style={{ fontSize: 14, padding: "5px 0", borderBottom: `1px solid ${C.bd}66` }}><b>{teams[d.buyer]?.ab}</b> get <b>{d.player.name}</b> ({d.player.pos} {d.player.ovr}) from <b>{teams[d.seller]?.ab}</b></div>)}
              {!dl.deals.length && <div style={{ fontSize: 14, color: C.mt }}>A quiet deadline: no trades between other clubs.</div>}
            </div>
          )}
        </div>
        <div style={panel}>
          <div style={head}>TRADE BLOCK</div>
          <TradeBlock teams={teams} ui={ui} needs={needs} pickValue={pickValue} onInquire={onInquire} setSel={setSel} closed={dl.done} />
        </div>
        <div style={panel}>
          <div style={head}>BUYERS</div>
          {buyers.slice(0, 8).map((b) => <div key={b.ti} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}><TeamLogo t={teams[b.ti]} sz={22} /><span style={{ flex: 1, fontSize: 14 }}>{b.name}</span><b style={{ fontSize: 14, color: C.gn }}>{b.rec}</b></div>)}
          {!buyers.length && <div style={{ fontSize: 13, color: C.mt }}>Nobody's clearly in win-now mode.</div>}
          <div style={{ ...head, marginTop: 14 }}>SELLERS</div>
          {sellers.slice(0, 8).map((s) => <div key={s.ti} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}><TeamLogo t={teams[s.ti]} sz={22} /><span style={{ flex: 1, fontSize: 14 }}>{s.name}</span><b style={{ fontSize: 14, color: C.rd }}>{s.rec}</b></div>)}
          {!sellers.length && <div style={{ fontSize: 13, color: C.mt }}>Nobody's clearly selling.</div>}
        </div>
      </div>
    </div>
  );
}
