// Free agency, laid out like the trade screen: one big sortable table of real free agents, your
// cap and needs up top, and a real negotiation (years and money) when you go to sign someone.
import { fillsNeed } from "./needs.js";
import Select from "./Select.jsx";
import { MOBILE } from "./mobile.js";
import React, { useState } from "react";
import { C, oC, Bdg, Face, Sheet, Hero, Section, Chips, Pills, actBtn, card, cardTitle, fitH, field } from "./ui.jsx";
import { yearlyAsk, maxYears } from "./negotiation.js";
// what the negotiation table opens at: his ask for the default length (two years, or one for a 33+ veteran)
const askingPrice = (p) => yearlyAsk(p, Math.min(2, maxYears(p)), "fa");
import Negotiate from "./Negotiate.jsx";
import { FA_DAYS, MARKET_MIN, bidsFor, committed, decideDay, standing } from "./faMarket.js";
import { posTag } from "./dline.js";
import { devOf, DEV_TRAITS } from "./scouting.js";
import RoleTag from "./RoleTag.jsx";
import { ROLE_FILTERS, roleFilterMatch } from "./roleNeeds.js";


// his development trait as a small tag (normal shows nothing)
const DEV_C = { generational: "#f472b6", superstar: "#f5c542", star: "#60a5fa", late: "#34d399" };
const DevTag = ({ p }) => { const d = devOf(p); return DEV_C[d] ? <span title={DEV_TRAITS[d]?.desc} style={{ fontSize: 12.5, fontWeight: 800, color: DEV_C[d], marginLeft: 8, whiteSpace: "nowrap" }}>{DEV_TRAITS[d]?.name}</span> : null; };

// The market on a player: how many clubs have offered, yours and where it stands if you have, and
// when he decides.
const whenOf = (p, market) => { const dd = Math.max(market.day, decideDay(p, market.yr)); return dd <= market.day ? "decides today" : `decides day ${dd}`; };
function MarketTag({ p, market, ui, teams }) {
  if (!market || p.ovr < MARKET_MIN) return null;
  const bids = bidsFor(market, p.id), mine = bids.find((b) => b.team === ui), others = bids.length - (mine ? 1 : 0);
  const when = whenOf(p, market);
  if (!bids.length) return <span style={{ fontSize: 12, color: C.mt, whiteSpace: "nowrap" }}>No offers · {when}</span>;
  const st = mine ? standing(p, market, teams, ui) : null;
  return (
    <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", color: mine ? "#93c5fd" : "#fca5a5" }}>
      {mine ? <>Your offer ${mine.sal}M <span style={{ color: st === "lead" ? C.gn : "#fbbf24" }}>{st === "lead" ? "leading" : "outbid"}</span></> : ""}{mine && others ? " · " : ""}{others ? `${others} other offer${others > 1 ? "s" : ""}` : ""}{` · ${when}`}
    </span>
  );
}

// Your offers on the market, each beside the competition: where you stand (leading or outbid), your
// money against the best rival offer, how many clubs are in, and when he decides. A tap re-opens the
// talks so you can raise it. Leading is about the whole offer (money, years, role, fit), so the money
// alone can trail and still lead.
export function YourOffers({ fa, market, teams, ui, onRaise, phone }) {
  if (!market) return null;
  const mine = fa.map((p) => ({ p, list: bidsFor(market, p.id) })).filter((x) => x.list.some((b) => b.team === ui))
    .map(({ p, list }) => { const me = list.find((b) => b.team === ui), rivals = list.filter((b) => b.team !== ui).sort((a, b) => b.sal - a.sal); return { p, me, rivals, top: rivals[0], st: standing(p, market, teams, ui) }; })
    .sort((a, b) => (a.st === "lead") - (b.st === "lead") || b.p.ovr - a.p.ovr);
  if (!mine.length) return null;
  const lead = mine.filter((x) => x.st === "lead").length;
  return (
    <div title={phone ? undefined : "Leading counts the whole offer (money, years, his role and fit), so less money can still lead. Click one to raise it."} style={phone ? { marginTop: 26 } : { ...card, padding: "14px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: phone ? 10 : 6, padding: phone ? "0 2px" : 0 }}>
        <span style={phone ? { fontSize: 20, fontWeight: 900 } : cardTitle}>Your offers</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: lead === mine.length ? C.gn : "#fbbf24" }}>leading {lead} of {mine.length}</span>
      </div>
      <div style={phone ? { background: "#ffffff0f", borderRadius: 18, padding: "0 14px" } : { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "0 18px" }}>
        {mine.map(({ p, me, rivals, top, st }, i) => {
          const ahead = st === "lead", dd = Math.max(market.day, decideDay(p, market.yr));
          return (
            <button key={p.id} onClick={() => onRaise(p)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 70, textAlign: "left", background: "transparent", border: 0, borderTop: i && (phone || i > 1) ? "1px solid #ffffff10" : 0, padding: "8px 0", color: C.tx, cursor: "pointer", whiteSpace: "normal" }}>
              
              <Face s={p.face} sz={phone ? 40 : 32} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 16 }}><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span><span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>{posTag(p)}</span><b style={{ color: oC(p.ovr), fontSize: 15 }}>{p.ovr}</b></span>
                <span style={{ display: "block", fontSize: 14, color: "#cbd5e1", marginTop: 3 }}>You <b style={{ color: "#fff" }}>{money(me.sal)}</b> × {me.yrs}y · {top ? <>top rival <b style={{ color: top.sal > me.sal ? "#fca5a5" : "#fff" }}>{money(top.sal)}</b> × {top.yrs}y ({teams[top.team]?.ab}){rivals.length > 1 ? ` +${rivals.length - 1}` : ""}</> : "no other offers"}</span>
                <span style={{ display: "block", fontSize: 12, color: C.mt, marginTop: 2 }}>{dd <= market.day ? "Decides today" : `Decides day ${dd}`} · asks {money(askingPrice(p))}</span>
              </span>
              <span style={{ textAlign: "right", flexShrink: 0 }}>
                <b style={{ display: "block", fontSize: 14, color: ahead ? C.gn : "#fbbf24" }}>{ahead ? "Leading" : "Outbid"}</b>
                {!ahead && <span style={{ fontSize: 13, fontWeight: 800, color: "#7dd3fc" }}>Raise</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// the defensive line is two positions here: edge rushers and interior tackles
const POS = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "EDGE", "DT", "LB", "CB", "S", "K", "P"];
// phones show a screenful at a time: twenty, then more on a tap
const PAGE = MOBILE ? 20 : 50;
const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const sel = field;

export default function FreeAgency({ startPos, fa, team, teams, ui, needs, capSpace, setSel, open, extras, sheets, talkFor, termsFor, onTalk, cy, market, onNextDay, sp }) {
  const [pos, setPos] = useState(startPos || "ALL");
  const [q, setQ] = useState("");
  const [find, setFind] = useState(false);
  const [needOnly, setNeedOnly] = useState(false);
  const [sort, setSort] = useState(["ovr", -1]);
  const [n, setN] = useState(PAGE);
  const [offer, setOffer] = useState(null);
  // your open offers hold their money until the player decides
  const out = market ? committed(market, ui) : 0, nOut = market ? Object.values(market.bids).flat().filter((b) => b.team === ui).length : 0;
  const cap = capSpace(team) - out;
  const key = { ovr: (p) => p.ovr, age: (p) => p.age, ask: (p) => askingPrice(p), pos: (p) => POS.indexOf(posTag(p)), name: (p) => p.name };
  const rows = fa
    .filter((p) => pos === "ALL" || posTag(p) === pos || (pos.startsWith("R:") && roleFilterMatch(p, pos)))
    .filter((p) => !needOnly || fillsNeed(needs, p))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => { const x = key[sort[0]](a), y = key[sort[0]](b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort[1]; });
  const th = (k, label, left) => (
    <th onClick={k ? () => setSort(([s, d]) => [k, s === k ? -d : k === "name" || k === "pos" ? 1 : -1]) : undefined} style={{ padding: "8px 6px", fontSize: 12, fontWeight: 800, letterSpacing: 1, color: sort[0] === k ? "#fff" : C.mt, borderBottom: `1px solid ${C.bd}`, textAlign: left ? "left" : "center", cursor: k ? "pointer" : "default", whiteSpace: "nowrap", position: "sticky", top: 0, background: C.cd }}>
      {label}{sort[0] === k ? (sort[1] < 0 ? " ▼" : " ▲") : ""}
    </th>
  );
  const td = { padding: "9px 6px", borderBottom: `1px solid ${C.bd}55`, textAlign: "center", fontSize: 14 };
  const negotiate = () => (<Negotiate note={market && offer.ovr >= MARKET_MIN ? (() => { const o = bidsFor(market, offer.id).filter((b) => b.team !== ui).length, dd = Math.max(market.day, decideDay(offer, market.yr)); const st = standing(offer, market, teams, ui); return `${o ? `${o} club${o > 1 ? "s have" : " has"} made him an offer.` : "No offers yet."}${st === "lead" ? " Your offer is the best one for him right now." : st === "behind" ? " Another club's offer is better for him right now." : ""} He decides ${dd <= market.day ? "at the end of today" : `on day ${dd}`}. He takes the best offer for him: more money, or a club with what he wants. Only a big overpay (20%+ over his ask) signs him on the spot.`; })() : null} team={team} cy={cy} p={offer} mode="fa" cap={cap + (bidsFor(market, offer.id).find((b) => b.team === ui)?.sal || 0)} t={termsFor(offer, "fa")} talk={talkFor(offer)} onResult={(r, o) => onTalk(offer, "fa", r, o)} onClose={() => setOffer(null)} rivalName={(id) => teams[id] && `${teams[id].city} ${teams[id].name}`} />);
  if (MOBILE) return <PhoneFA {...{ sp, fa, rows, n, setN, pos, setPos, needs, q, setQ, find, setFind, sort, setSort, cap, out, nOut, open, market, onNextDay, sheets, extras, teams, ui, talkFor, setSel, offer, setOffer, team }} negotiate={offer && negotiate()} />;
  const head = (k, l, w, left) => (
    <button key={k} onClick={() => setSort(([s, d]) => [k, s === k ? -d : k === "name" || k === "pos" || k === "ask" || k === "age" ? 1 : -1])} style={{ width: w, flex: w ? "none" : 1, textAlign: left ? "left" : "right", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: sort[0] === k ? "#fff" : "#64748b", flexShrink: 0 }}>{l}{sort[0] === k ? (sort[1] < 0 ? " ▾" : " ▴") : ""}</button>
  );
  return (
    <div>
      {/* the Trades & FA header above has the cap and roster; this line has the market */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        {market && <span style={{ fontSize: 18, fontWeight: 800 }}>Day {market.day} <span style={{ color: "#64748b", fontWeight: 600 }}>of {FA_DAYS}</span></span>}
        <span style={{ fontSize: 14, color: "#94a3b8", flex: 1, minWidth: 0 }} title={market ? "Clubs make offers every day. Each player takes the best one on his day: the money, plus the role, scheme and winning he wants. Only a big overpay signs him on the spot." : undefined}>
          {fa.length} free agents{out > 0 ? <> · <b style={{ color: "#fde68a" }}>{money(out)}</b> held in {nOut} open offer{nOut > 1 ? "s" : ""}</> : null}{!open ? " · the main market opens after the Combine" : ""}{market && market.day >= FA_DAYS ? " · last day: everyone still deciding chooses when you finish free agency" : ""}
        </span>
        {market && market.day < FA_DAYS && <button onClick={onNextDay} style={{ ...actBtn(), background: "#fff", color: "#0b1220", padding: "9px 18px" }}>Next day</button>}
      </div>
      {sheets}
      <YourOffers fa={fa} market={market} teams={teams} ui={ui} onRaise={setOffer} />
      <div style={{ ...card, padding: "12px 12px 8px", ...fitH, height: "calc(100vh - 340px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", padding: "0 4px" }}>
          <Pills items={[[false, "Everyone"], [true, `Your needs${needs.length ? `: ${needs.slice(0, 3).join(", ")}` : ""}`]]} value={needOnly} onChange={setNeedOnly} label="Show" />
          <Select value={pos} onChange={(e) => { setPos(e.target.value); setN(PAGE); }} aria-label="Position" style={field}>
            {["ALL", ...POS].map((x) => <option key={x} value={x}>{x === "ALL" ? "All positions" : x}</option>)}
            {ROLE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search free agents" style={{ ...field, marginLeft: "auto", width: 170 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 12px 6px" }}>
          {head("name", "PLAYER", null, true)}{head("age", "AGE", 44)}{head("ovr", "OVR", 44)}<span style={{ width: 44, textAlign: "right", fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#64748b" }}>POT</span>{head("ask", "ASKING", 92)}<span style={{ width: 120, flexShrink: 0 }} />
        </div>
        <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
          {rows.slice(0, n).map((p) => {
            const ask = askingPrice(p), walked = talkFor(p).walked;
            const from = p.formerTeam != null ? teams[p.formerTeam] : null;
            return (
              <div key={p.id} className="calm-row" onClick={() => setSel(p)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "7px 12px", cursor: "pointer", opacity: walked ? 0.5 : 1 }}>
                <Face s={p.face} sz={38} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", fontSize: 16, fontWeight: 800, color: p.formerTeam === ui ? "#86efac" : "#f8fafc", whiteSpace: "nowrap", overflow: "hidden" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span><DevTag p={p} /></span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {posTag(p)}<RoleTag p={p} />{from && <span>· {p.formerTeam === ui ? "your former player" : `last with ${from.ab}`}</span>}
                    {market && p.ovr >= MARKET_MIN && <><span>·</span><MarketTag p={p} market={market} ui={ui} teams={teams} /></>}
                  </span>
                </span>
                <span style={{ width: 44, textAlign: "right", fontSize: 15, color: "#cbd5e1" }}>{p.age}</span>
                <b style={{ width: 44, textAlign: "right", fontSize: 18, color: oC(p.ovr) }}>{p.ovr}</b>
                <span style={{ width: 44, textAlign: "right", fontSize: 15, color: "#94a3b8" }}>{p.pot || p.ovr}</span>
                <span style={{ width: 92, textAlign: "right", fontSize: 15, fontWeight: 700, color: ask <= cap ? "#e2e8f0" : "#fca5a5", fontVariantNumeric: "tabular-nums" }}>{money(ask)}</span>
                <span className="calm-act" style={{ width: 120, textAlign: "right", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {walked ? <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700 }}>Not interested</span> : <button onClick={() => setOffer(p)} style={actBtn("#86efac")}>Negotiate</button>}
                </span>
              </div>
            );
          })}
          {!rows.length && <div style={{ padding: 16, color: "#94a3b8", fontSize: 15 }}>Nobody matches.</div>}
          {rows.length > n && <div style={{ textAlign: "center", padding: 10 }}><button onClick={() => setN(n + PAGE)} style={actBtn("#cbd5e1")}>Show more · {rows.length - n} left</button></div>}
        </div>
      </div>
      {extras}
      {offer && negotiate()}
    </div>
  );
}

// Phones: its own screen, in the Home screen's look. A hero with the money you have to spend, the
// best fits for your needs as cards you swipe, positions as chips, then everyone as clean rows. A tap
// on anyone opens him in a sheet with one big button: make an offer.
const FA_SORTS = [["ovr", "Best"], ["ask", "Cheapest"], ["age", "Youngest"], ["name", "Name"]];
function PhoneFA({ sp, fa, rows, n, setN, pos, setPos, needs, q, setQ, find, setFind, sort, setSort, cap, out, nOut, open, market, onNextDay, sheets, extras, teams, ui, talkFor, setSel, offer, setOffer, negotiate, team }) {
  const [pick, setPick] = useState(null), [sortOpen, setSortOpen] = useState(false);
  const pk = pick && fa.find((p) => p.id === pick);
  const mineOf = (p) => market && p.ovr >= MARKET_MIN && bidsFor(market, p.id).find((b) => b.team === ui);
  // the best player still out there at each of your thinnest spots, then the next best
  const fits = [...fa].filter((p) => fillsNeed(needs, p) && !talkFor(p).walked).sort((a, b) => b.ovr - a.ovr).slice(0, 6);
  const status = (p) => { const mine = mineOf(p); if (!mine) return null; return standing(p, market, teams, ui) === "lead" ? ["Your offer leads", C.gn] : ["You've been outbid", "#fbbf24"]; };
  const card = { background: "#ffffff0f", borderRadius: 18 };
  const tags = (p) => <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><Bdg pos={posTag(p)} /><RoleTag p={p} /><DevTag p={p} /></span>;
  return (
    <div>
      <Hero clr={team?.clr} logo={team} eyebrow={market ? `Day ${market.day} of ${FA_DAYS}` : open ? "The market" : ["preseason", "regular"].includes(sp) ? "In season" : sp === "draft" ? "After the market" : "Before the Combine"} title="Free Agency"
        sub={out > 0 ? `${money(out)} held in ${nOut} open offer${nOut > 1 ? "s" : ""}` : `${fa.length} players available`}
        right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: cap >= 0 ? "#fff" : C.rd }}>{money(cap)}</div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "#ffffffb3", marginTop: 4 }}>TO SPEND</div></div>}>
        {!open && <div style={{ fontSize: 14, color: "#fde68a", marginTop: 12 }}>{["preseason", "regular"].includes(sp) ? "Whoever's still unsigned. Sign him any time." : sp === "draft" ? "What's left after free agency." : "The main market opens after the Combine."}</div>}
        {market && market.day < FA_DAYS && <button onClick={onNextDay} style={{ marginTop: 16, width: "100%", minHeight: 48, borderRadius: 14, border: 0, background: "#ffffff1f", color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>Next day ›</button>}
      </Hero>
      {sheets}
      <YourOffers phone fa={fa} market={market} teams={teams} ui={ui} onRaise={setOffer} />

      {fits.length > 0 && (
        <Section title="Best fits for you">
          <div className="pill-row" style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", margin: "0 -8px", padding: "0 8px 4px", scrollPaddingLeft: 8 }}>
            {fits.map((p) => { const st = status(p); return (
              <button key={p.id} onClick={() => setPick(p.id)} style={{ ...card, flex: "0 0 72%", minWidth: 0, scrollSnapAlign: "start", border: 0, padding: 16, textAlign: "left", color: "#fff", cursor: "pointer", whiteSpace: "normal" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Face s={p.face} sz={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>Age {p.age}</div>
                  </div>
                  <b style={{ fontSize: 28, color: oC(p.ovr) }}>{p.ovr}</b>
                </div>
                <div style={{ marginTop: 10 }}>{tags(p)}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 10, color: st ? st[1] : askingPrice(p) <= cap ? "#e2e8f0" : C.rd }}>{st ? st[0] : `Asks ${money(askingPrice(p))} a year`}</div>
              </button>
            ); })}
          </div>
        </Section>
      )}

      <Section title="Everyone" action={find || q ? "Done" : "Search"} onAction={() => { setFind((v) => !v); if (find) setQ(""); }}>
        {(find || q) && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" aria-label="Search free agents" style={{ ...sel, width: "100%", boxSizing: "border-box", marginBottom: 10, borderRadius: 12, minHeight: 46 }} />}
        <Chips items={[["ALL", "All"], ...POS.map((x) => [x, x])]} value={pos} onChange={(k) => { setPos(k); setN(PAGE); }} />
        <div style={{ display: "flex", justifyContent: "flex-end", margin: "8px 2px 6px" }}>
          <button onClick={() => setSortOpen(true)} style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}>Sorted: {(FA_SORTS.find(([k]) => k === sort[0]) || FA_SORTS[0])[1]} ▾</button>
        </div>
        <div style={{ ...card, padding: "0 14px" }}>
          {rows.slice(0, n).map((p, i) => { const st = status(p), walked = talkFor(p).walked; return (
            <button key={p.id} onClick={() => setPick(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 66, textAlign: "left", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff10" : 0, padding: "8px 0", color: C.tx, cursor: "pointer", opacity: walked ? 0.45 : 1, whiteSpace: "normal" }}>
              <Face s={p.face} sz={40} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: p.formerTeam === ui ? C.gn : "#f1f5f9" }}>{p.name}</span>
                <span style={{ display: "block", marginTop: 3 }}>{tags(p)}</span>
              </span>
              <span style={{ textAlign: "right", flexShrink: 0 }}>
                <b style={{ display: "block", fontSize: 20, lineHeight: 1, color: oC(p.ovr) }}>{p.ovr}</b>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, marginTop: 4, color: st ? st[1] : walked ? C.rd : "#94a3b8" }}>{st ? (st[1] === C.gn ? "Leading" : "Outbid") : walked ? "No" : money(askingPrice(p))}</span>
              </span>
            </button>
          ); })}
          {!rows.length && <div style={{ padding: "18px 0", color: C.mt, fontSize: 14 }}>Nobody here.</div>}
        </div>
        {rows.length > n && <button onClick={() => setN(n + PAGE)} style={{ width: "100%", minHeight: 48, marginTop: 10, borderRadius: 14, border: 0, background: "#ffffff0f", color: "#cbd5e1", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Show more</button>}
      </Section>
      {extras}

      {sortOpen && <Sheet title="Sort" onClose={() => setSortOpen(false)}>{FA_SORTS.map(([k, l], i) => <button key={k} onClick={() => { setSort([k, ["name"].includes(k) ? 1 : k === "ovr" ? -1 : 1]); setSortOpen(false); }} style={{ display: "flex", width: "100%", minHeight: 52, alignItems: "center", background: "transparent", border: 0, borderTop: i ? "1px solid #ffffff14" : 0, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", padding: "0 4px" }}><span style={{ flex: 1, textAlign: "left" }}>{l}</span>{sort[0] === k && <span style={{ color: C.gn }}>✓</span>}</button>)}<div style={{ height: 8 }} /></Sheet>}
      {pk && !offer && (
        <Sheet onClose={() => setPick(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, paddingRight: 40 }}>
            <Face s={pk.face} sz={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{pk.name}</div>
              <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 2 }}>Age {pk.age}{pk.formerTeam != null && teams[pk.formerTeam] ? ` · last with ${pk.formerTeam === ui ? "you" : teams[pk.formerTeam].ab}` : ""}</div>
            </div>
            <b style={{ fontSize: 40, color: oC(pk.ovr) }}>{pk.ovr}</b>
          </div>
          <div style={{ marginBottom: 12 }}>{tags(pk)}</div>
          <div style={{ display: "flex", alignItems: "center", minHeight: 48, fontSize: 16, borderTop: "1px solid #ffffff14" }}><span style={{ color: "#94a3b8" }}>Asking</span><b style={{ marginLeft: "auto", color: askingPrice(pk) <= cap ? "#fff" : C.rd }}>{money(askingPrice(pk))} a year</b></div>
          {market && pk.ovr >= MARKET_MIN && <div style={{ padding: "10px 0", borderTop: "1px solid #ffffff14" }}><MarketTag p={pk} market={market} ui={ui} teams={teams} /></div>}
          {talkFor(pk).walked ? <div style={{ fontSize: 14, color: C.rd, fontWeight: 700, textAlign: "center", padding: "14px 0" }}>He isn't interested in your club.</div>
            : <button onClick={() => { setOffer(pk); setPick(null); }} style={{ width: "100%", minHeight: 54, marginTop: 10, borderRadius: 14, border: 0, background: C.gn, color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer" }}>Make an offer</button>}
          <button onClick={() => { setSel(pk); setPick(null); }} style={{ width: "100%", minHeight: 48, marginTop: 8, borderRadius: 14, border: 0, background: "transparent", color: "#7dd3fc", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Player card</button>
          <div style={{ height: 8 }} />
        </Sheet>
      )}
      {negotiate}
    </div>
  );
}
