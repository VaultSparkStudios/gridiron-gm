// The negotiation table: pick the years, set the money, make an offer, and read his answer.
// Used for re-signing your own players, extensions and free agents.
// On a computer it's two columns: the room (his agent's side of the talks, what he wants and
// where the money puts him in his position's market) and your offer (years, money, structure and
// what it does to your cap). On a phone it's one column, the offer first.
import { capProjection } from "./capProjection.js";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { C, oC, Face, CloseX, sheetWrap, sheetBox, SheetGrip, Pills, pill, pillTrack } from "./ui.jsx";
import { MOBILE } from "./mobile.js";
import { yearlyAsk, maxYears, respond } from "./negotiation.js";
import { EXT_BONUS, extStructure } from "./extensions.js";
import { SIGN_BONUS, signingStructure } from "./bonus.js";
import { leagueMin, leagueCap } from "./cap.js";
import { VOID_YEARS, INCENTIVE_SIZES } from "./contractDepth.js";
import { incentiveOptions } from "./league.js";
import { marketLadder } from "./offseason.js";
import { posTag } from "./dline.js";
import RoleTag from "./RoleTag.jsx";

const money = (n) => `$${(+n || 0).toFixed(1)}M`;
const r1 = (x) => Math.round(x * 10) / 10;
const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
const card = { background: "#ffffff0b", borderRadius: 16, padding: "10px 12px", marginBottom: 10 };
const label = { fontSize: 12.5, fontWeight: 700, color: "#94a3b8", marginBottom: 6 };
const TONE = { accept: "#4ade80", pending: "#93c5fd", counter: "#facc15", reject: "#fb923c", walk: "#f87171", lost: "#f87171" };

// One choice in a row of them: the shared white pill, with an optional line under it (a price).
function Chip({ on, onClick, disabled, children, sub }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...pill(on), flex: 1, minWidth: 0, minHeight: sub ? 40 : MOBILE ? 36 : 30, padding: "3px 6px", fontSize: 13.5, borderRadius: sub ? 13 : 99, lineHeight: 1.15, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.3 : 1 }}>
      {children}
      {sub && <div style={{ fontSize: 11, fontWeight: 700, opacity: on ? 0.7 : 0.6, marginTop: 1 }}>{sub}</div>}
    </button>
  );
}
const Track = ({ children, round, style }) => <div style={{ ...pillTrack, display: "flex", flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box", borderRadius: round ? 15 : 99, ...(style || {}) }}>{children}</div>;

// Room in each of the next four seasons if he signs this offer (for an extension, the new deal
// starts when his current one ends; for a re-sign, his old deal is replaced).
function FutureRoom({ team, cy, p, mode, sal, yrs, room0 }) {
  if (!team || cy == null) return null;
  const ext = mode === "extend";
  const ys = capProjection(team, cy, { extra: ext ? { sal, yrs, start: p.contract || 0 } : { sal, yrs, skip: mode === "resign" ? p.id : null }, room0 });
  return (
    <div style={card} title="Before re-signings, rookies and free agents in later years">
      <div style={{ ...label, marginBottom: 4 }}>Your cap room with this deal</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${ys.length},1fr)`, gap: 8 }}>
        {ys.map((y) => {
          const tone = y.room < 0 ? C.rd : y.room < y.cap * 0.08 ? C.gd : C.gn;
          return (
            <div key={y.yr} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14.5, fontWeight: 900, color: tone }}>{y.room < 0 ? "-" : ""}${Math.abs(y.room).toFixed(1)}M</div>
              <div style={{ fontSize: 11.5, color: C.mt }}>{y.yr}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Where the money puts him among the league's contracts at his position.
function Ladder({ p, sal }) {
  const rows = React.useMemo(() => marketLadder(p), [p]);
  if (rows.length < 5) return null;
  const at = rows.findIndex((r) => r.sal < sal), idx = at < 0 ? rows.length : at, rank = idx + 1;
  const tag = posTag(p);
  const lo = Math.max(1, Math.min(idx - 2, rows.length - 4)), shown = rows.slice(lo, Math.min(rows.length, lo + 4));
  const Row = ({ r, n }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 27, fontSize: 13 }}>
      <span style={{ width: 26, color: C.mt, fontWeight: 700, textAlign: "right" }}>{n}</span>
      <Face s={r.face} sz={20} />
      <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e2e8f0" }}>{r.name} <span style={{ color: C.mt, fontSize: 12 }}>{r.ab} · {r.ovr}</span></span>
      <span style={{ fontWeight: 800, color: "#cbd5e1" }}>{money(r.sal)}</span>
    </div>
  );
  const Me = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 30, fontSize: 13, background: "#3b82f622", borderRadius: 10, padding: "0 8px", margin: "1px -8px" }}>
      <span style={{ width: 26, color: "#93c5fd", fontWeight: 900, textAlign: "right" }}>{rank}</span>
      <Face s={p.face} sz={20} />
      <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 700 }}>your offer</span></span>
      <span style={{ fontWeight: 900, color: "#fff" }}>{money(sal)}</span>
    </div>
  );
  const list = [];
  if (idx === 0) list.push(<Me key="me" />);
  list.push(<Row key={rows[0].id} r={rows[0]} n={idx === 0 ? 2 : 1} />);
  if (lo > 1 && idx > 0) list.push(<div key="gap" style={{ color: C.mt, fontSize: 11, lineHeight: 1, padding: "0 0 0 34px" }}>⋯</div>);
  shown.forEach((r, k) => { const i = lo + k; if (idx > 0 && i === idx) list.push(<Me key="me" />); list.push(<Row key={r.id} r={r} n={i >= idx ? i + 2 : i + 1} />); });
  if (idx > 0 && idx >= lo + shown.length) list.push(<Me key="me" />);
  return (
    <div style={card}>
      <div style={{ ...label, display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span>The {tag} market</span>
        <span style={{ color: rank <= 5 ? "#facc15" : rank <= 32 ? "#e2e8f0" : C.mt }}>{rank === 1 ? `Highest-paid ${tag}` : `${ord(rank)}-highest-paid ${tag}`}</span>
      </div>
      {list}
    </div>
  );
}

// What he wants besides money, and how your club looks on each.
function Wants({ t }) {
  if (!t.prio) return null;
  const fm = t.fitMe || {};
  const rows = [
    { k: "role", name: "Playing time", w: t.prio.role, txt: fm.roleLabel ? (fm.roleLabel === "starter" ? "He'd start for you" : `He'd be your ${fm.roleLabel}`) : "-", good: fm.role === 1 ? 1 : fm.role > 0.3 ? 0 : -1 },
    { k: "scheme", name: "Scheme", w: t.prio.scheme, txt: fm.schemeName ? (fm.scheme === 1 ? `Your ${fm.schemeName} features him` : `Your ${fm.schemeName} doesn't feature him`) : "No coordinator yet", good: fm.scheme === 1 ? 1 : fm.schemeName ? -1 : 0 },
    { k: "win", name: "Winning", w: t.prio.win, txt: fm.win >= 0.6 ? "You win" : fm.win <= 0.4 ? "You lost a lot last year" : "You're middle of the pack", good: fm.win >= 0.6 ? 1 : fm.win <= 0.4 ? -1 : 0 },
  ];
  const dot = (g) => (g > 0 ? ["✓", "#4ade80"] : g < 0 ? ["✕", "#f87171"] : ["·", "#94a3b8"]);
  return (
    <div style={card}>
      <div style={label} title={t.prio.key !== "money" ? "A club that gives him what he wants can sign him for less" : undefined}>What he wants most: <b style={{ color: "#fff" }}>{t.prio.label}</b></div>
      {rows.map((r) => { const [i, c] = dot(r.good); return (
        <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 24, fontSize: 13 }}>
          <span style={{ width: 88, color: r.k === t.prio.key ? "#fff" : "#94a3b8", fontWeight: r.k === t.prio.key ? 800 : 600 }}>{r.name}</span>
          <span style={{ display: "flex", gap: 3 }}>{[0.15, 0.25, 0.45].map((x) => <span key={x} style={{ width: 6, height: 6, borderRadius: 3, background: r.w >= x ? "#e2e8f0" : "#ffffff22" }} />)}</span>
          <span style={{ flex: 1, minWidth: 0, color: "#cbd5e1" }}><b style={{ color: c, marginRight: 4 }}>{i}</b>{r.txt}</span>
        </div>
      ); })}
    </div>
  );
}

// The back-and-forth with his agent.
function Thread({ p, talk, ask, yrs, rivalName }) {
  const first = String(p.name || "").split(" ")[0] || "He";
  const log = talk.log?.length ? talk.log : talk.last ? [{ r: talk.last }] : [];
  const reply = (r) => r.result === "lost" ? `He signed with the ${rivalName?.(r.team) || "other club"}: ${money(r.sal)} a year${r.why ? ` (${r.why})` : ""}.`
    : r.rivalBid ? <>"We have <b>{money(r.sal)} a year for {r.yrs} years</b> from the {rivalName?.(r.team) || "another club"}{r.why ? ` (${r.why})` : ""}. Give him a reason to choose you." <span style={{ display: "block", fontSize: 12.5, color: "#cbd5e1", marginTop: 3, fontWeight: 600 }}>About {money(r.counter)} would make it close. Even then it's his call.</span></>
    : r.msg;
  const bubble = (mine, children, tone) => (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <div style={{ maxWidth: "90%", padding: "6px 11px", borderRadius: mine ? "13px 13px 4px 13px" : "13px 13px 13px 4px", background: mine ? "#2563eb" : "#ffffff12", color: mine ? "#fff" : tone || "#e2e8f0", fontSize: 13.5, fontWeight: mine ? 800 : 600, lineHeight: 1.4 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ ...card, paddingBottom: 6 }}>
      <div style={label}>His agent</div>
      {bubble(false, <>"{first} is looking for about <b>{money(ask)}</b> a year on a {yrs}-year deal."</>)}
      {log.map((e, i) => (
        <React.Fragment key={i}>
          {e.sal != null && bubble(true, `${money(e.sal)} a year · ${e.yrs} yr${e.yrs === 1 ? "" : "s"}`)}
          {bubble(false, reply(e.r), TONE[e.r.result])}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Negotiate({ p, mode, cap, nowRoom = Infinity, t, talk = {}, onResult, onClose, rivalName, note, team, cy }) {
  const [share, setShare] = useState(0);
  const [voidYrs, setVoidYrs] = useState(0);
  const [incSize, setIncSize] = useState(0);
  const incOpts = incentiveOptions(p.mpos === "EDGE" ? "DL" : p.pos);
  const [incLabel, setIncLabel] = useState(incOpts[0]);
  const ext = mode === "extend";
  // extensions spread a bonus from this season; new deals turn part of year one into bonus
  const shape = (amount) => { if (ext) return extStructure(amount, yrs, share); const st = signingStructure(amount, yrs, share, { minSal: leagueMin(), cap: leagueCap(), voidYrs }); return { hit: st.hitNow, later: st.hitLater, nowAdd: 0, pr: st.add, bonus: st.bonus, voidDead: st.voidDead, voidYrs: st.voidYrs }; };
  // This season's room only matters for money that lands this season (an extension's signing
  // bonus); a plain extension starts next year, so being tight or over the cap now doesn't block it.
  const fits = (amount) => { const sh = shape(amount); return cap - sh.hit >= 0 && (sh.nowAdd <= 0 || nowRoom - sh.nowAdd >= 0); };
  const [yrs, setYrs] = useState(Math.min(2, maxYears(p)));
  const ask = yearlyAsk(p, yrs, mode);
  const f = p.perf?.f ?? 1;
  const perfNote = mode !== "fa" && Math.abs(f - 1) >= 0.05 ? (f > 1 ? `Coming off a big season: he's asking about ${Math.round((f - 1) * 100)}% more than his rating alone would get.` : `Coming off a down season: he'd take about ${Math.round((1 - f) * 100)}% less on a multi-year deal, or bet on himself with a 1-year prove-it deal near full price.`) : null;
  const [sal, setSal] = useState(r1(ask * 0.9));
  const done = talk.walked || talk.signed;
  // a signed deal closes the table: the toast (and, for a star, the signing-day card) says the rest
  useEffect(() => { if (talk.signed) onClose(); }, [talk.signed]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = talk.last;
  const offer = (amount) => {
    const s = shape(r1(amount));
    const inc = !ext && incSize ? { label: incLabel, amt: r1(amount * incSize) } : null;
    const o = { sal: r1(amount), yrs, share: yrs >= 2 ? share : 0, ...(ext ? { hit: s.hit, pr: s.pr, bonus: s.bonus } : { hitNow: s.hit, bonus: s.bonus, voidYrs: s.voidYrs || 0, inc }) };
    onResult(respond(p, o, t, talk), o);
  };
  const big = ask >= 15;
  const step = (d) => setSal((s) => Math.max(0.8, r1(s + d)));
  const cur = shape(sal);
  const after = cap - cur.hit;
  const tries = talk.walked ? 3 : Math.min(3, talk.tries || 0);
  const lo = Math.max(0.8, r1(ask * 0.5)), hi = r1(ask * 1.4 + 1);
  const askAt = ((ask - lo) / (hi - lo)) * 100;
  const capPct = (sal / leagueCap()) * 100;
  const tag = posTag(p);
  const eyebrow = mode === "resign" ? "Re-sign" : ext ? "Contract extension" : "Free agent";

  // who he is, what he's asking and how many offers he'll still hear, in one block
  const header = (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, paddingRight: 44 }}>
      <Face s={p.face} sz={MOBILE ? 50 : 54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: MOBILE ? 19 : 21, fontWeight: 900, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
          <b style={{ fontSize: 17, color: oC(p.ovr) }}>{p.ovr}</b>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "#94a3b8", marginTop: 1 }}>
          <span>{eyebrow} · {tag} · {p.age}{(mode === "resign" || ext) && p.salary ? ` · now ${money(p.salary)}${ext ? ` · ${p.contract} yr${p.contract === 1 ? "" : "s"} left` : ""}` : ""}</span><RoleTag p={p} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px 14px", flexWrap: "wrap", fontSize: 13, color: "#94a3b8", marginTop: 3 }}>
          <span>Asking <b style={{ color: "#fff" }}>{money(ask)}</b> a year</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="He walks away after three offers he doesn't like">
            <span style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 14, height: 5, borderRadius: 3, background: i < 3 - tries ? (tries >= 2 ? C.rd : tries === 1 ? C.gd : C.gn) : "#ffffff18" }} />)}</span>
            {done ? (talk.signed ? "Signed" : "Talks are over") : `${3 - tries} offer${3 - tries === 1 ? "" : "s"} left`}
          </span>
          {t.rival && mode === "fa" && !done && <span style={{ color: "#fca5a5" }}>Other clubs are calling</span>}
        </div>
      </div>
    </div>
  );

  const notes = (perfNote || note) && <div style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 2px 10px", lineHeight: 1.45 }}>
    {perfNote && <span style={{ color: f > 1 ? "#fde68a" : "#bfdbfe" }}>{perfNote} </span>}
    {note}
  </div>;

  const futureRoom = <FutureRoom team={team} cy={cy} p={p} mode={mode} sal={sal} yrs={yrs} room0={ext ? nowRoom - (cur.nowAdd || 0) : after} />;
  // one row of a structure choice: its name on the left, the choices beside it
  const opt = (name, hint, track) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: MOBILE ? "wrap" : "nowrap" }}>
      <span title={hint} style={{ width: MOBILE ? "100%" : 92, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: "#94a3b8" }}>{name}</span>
      {track}
    </div>
  );
  const builder = !done && (
    <>
      <Track round style={{ marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((y) => <Chip key={y} on={yrs === y} disabled={y > maxYears(p)} onClick={() => { setYrs(y); setSal(r1(yearlyAsk(p, y, mode) * 0.9)); }} sub={y > maxYears(p) ? "-" : money(yearlyAsk(p, y, mode))}>{y} yr{y > 1 ? "s" : ""}</Chip>)}
      </Track>

      <div style={{ ...card, padding: "10px 12px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => step(big ? -1 : -0.5)} aria-label="Less" style={{ width: 38, height: 38, borderRadius: 19, border: 0, background: "#ffffff14", color: "#fff", fontSize: 20, cursor: "pointer" }}>−</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 29, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1, color: sal >= ask ? "#4ade80" : "#fff" }}>{money(sal)}<span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: 0 }}> a year</span></div>
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>{capPct.toFixed(1)}% of the cap · {money(sal * yrs)} total</div>
          </div>
          <button onClick={() => step(big ? 1 : 0.5)} aria-label="More" style={{ width: 38, height: 38, borderRadius: 19, border: 0, background: "#ffffff14", color: "#fff", fontSize: 20, cursor: "pointer" }}>+</button>
        </div>
        <div style={{ position: "relative", margin: "8px 2px 16px" }}>
          <input type="range" min={lo} max={hi} step={0.1} value={sal} onChange={(e) => setSal(+e.target.value)} aria-label="Offer per year" style={{ width: "100%", accentColor: C.bl, margin: 0 }} />
          <div style={{ position: "absolute", left: `${askAt}%`, top: 20, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>his ask</div>
        </div>
        {(team == null || cy == null) && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.mt }}>
          <span>{ext ? "Next year's cap after" : "Cap room after"}</span>
          <b style={{ color: after >= 0 ? C.gn : C.rd }}>{money(after)}</b>
        </div>}
      </div>

      {!ext && <div style={{ ...card, paddingTop: 4 }}>
        {yrs >= 2 && opt("Signing bonus", `Part of year one, spread over ${Math.min(5, yrs)} years. Guaranteed money is worth a little more to him; cut him early and the rest is dead money.`, <Track>
          {SIGN_BONUS.map((b) => <Chip key={b} on={share === b} onClick={() => setShare(b)}>{b ? `${Math.round(b * 100)}%` : "None"}</Chip>)}
        </Track>)}
        {yrs >= 2 && share > 0 && yrs < 5 && opt("Void years", "Fake years that spread the bonus thinner; what's left hits your cap as dead money when the deal ends", <Track>
          {VOID_YEARS.filter((v) => yrs + v <= 5).map((v) => <Chip key={v} on={voidYrs === v} onClick={() => setVoidYrs(v)}>{v ? `+${v}` : "None"}</Chip>)}
        </Track>)}
        {opt("Incentive", "Paid only if he earns it, on next year's cap", <Track>
          {INCENTIVE_SIZES.map((v) => <Chip key={v} on={incSize === v} onClick={() => setIncSize(v)}>{v ? money(sal * v) : "None"}</Chip>)}
        </Track>)}
        {incSize > 0 && <div style={{ marginTop: 6 }}><Pills quiet items={incOpts.map((o) => [o, o])} value={incLabel} onChange={setIncLabel} label="Incentive" /></div>}
        <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.45, marginTop: 6 }}>
          {yrs >= 2 && share ? <>Bonus <b style={{ color: "#fff" }}>{money(cur.bonus)}</b> · this year <b style={{ color: C.gn }}>{money(cur.hit)}</b>, then <b style={{ color: C.gd }}>{money(cur.later)}</b> a year{cur.voidYrs > 0 ? <> · <b style={{ color: C.rd }}>{money(cur.voidDead)}</b> dead money when the deal ends</> : null}</> : yrs >= 2 ? "A signing bonus lowers this year's hit for a little more later." : "One year: no bonus to spread."}
        </div>
      </div>}

      {ext && <div style={{ ...card, paddingTop: 4 }}>
        {opt("Signing bonus", `Spread over ${Math.min(5, yrs + 1)} years from this season`, <Track>
          {EXT_BONUS.map((b) => <Chip key={b} on={share === b} onClick={() => setShare(b)}>{b ? `${Math.round(b * 100)}%` : "None"}</Chip>)}
        </Track>)}
        <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.45, marginTop: 6 }}>
          Cap hit each new year: <b style={{ color: "#fff" }}>{money(cur.hit)}</b>{share ? <> (vs {money(sal)} with no bonus) · this season's hit goes up <b style={{ color: nowRoom - cur.nowAdd >= 0 ? C.gd : C.rd }}>{money(cur.nowAdd)}</b>{nowRoom !== Infinity ? ` (room now ${money(nowRoom)})` : ""} · bonus {money(cur.bonus)}, dead money if he's cut</> : <>. A signing bonus lowers it, so the deal fits next year's cap.</>}
        </div>
      </div>}

      {futureRoom}
    </>
  );

  // phones: once talks have started, his agent's last word sits above your next offer
  const talking = MOBILE && (talk.log?.length || talk.last);
  const thread = <Thread p={p} talk={talk} ask={ask} yrs={yrs} rivalName={rivalName} />;
  const room = <>
    {!talking && thread}
    {!done && <Wants t={t} />}
    {!done && <Ladder p={p} sal={sal} />}
  </>;

  const btn = (bg, c) => ({ flex: "2 1 160px", minHeight: MOBILE ? 48 : 42, borderRadius: 14, border: 0, background: bg, color: c, fontSize: 15, fontWeight: 900, cursor: "pointer" });
  const footer = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "sticky", bottom: MOBILE ? -14 : -16, background: "#0d1424", padding: "8px 0 6px", marginBottom: -6, boxShadow: "0 -12px 18px -8px #0d1424" }}>
      <button onClick={onClose} style={{ ...btn("#ffffff14", "#e2e8f0"), flex: "1 1 100px", fontWeight: 800 }}>{done ? "Close" : "Not now"}</button>
      {!done && last?.result === "counter" && <button onClick={() => offer(last.counter)} disabled={!fits(last.counter)} style={{ ...btn("#facc15", "#111"), opacity: fits(last.counter) ? 1 : 0.5 }}>{last.rivalBid ? "Offer" : "Accept"} {money(last.counter)}</button>}
      {!done && <button onClick={() => offer(sal)} disabled={!fits(sal)} style={{ ...btn("#16a34a", "#fff"), opacity: fits(sal) ? 1 : 0.5 }}>{fits(sal) ? `Offer ${money(sal)} × ${yrs}` : after < 0 ? (ext && share < EXT_BONUS[EXT_BONUS.length - 1] ? "Not enough cap: add a bonus" : "Not enough cap") : "Not enough room this season"}</button>}
    </div>
  );

  // drawn on the page itself, so opening it from a sheet never traps it inside the sheet
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000b3", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 1000, fontFamily: C.f, color: C.tx, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, ...sheetWrap(MOBILE) }}>
      <div role="dialog" aria-label={`Negotiate with ${p.name}`} onClick={(e) => e.stopPropagation()} style={{ position: "relative", background: "#0d1424", boxShadow: "0 30px 80px #000c", borderRadius: 22, padding: MOBILE ? "10px 14px 14px" : 16, width: "100%", maxWidth: MOBILE ? 520 : 900, maxHeight: "94vh", overflowY: "auto", ...sheetBox(MOBILE) }}>
        {MOBILE && <SheetGrip onClose={onClose} />}
        <CloseX onClick={onClose} />
        {header}
        {notes}
        {MOBILE ? <>{talking && thread}{builder}{room}</> : (
          <div style={{ display: "grid", gridTemplateColumns: done ? "1fr" : "minmax(0,1fr) minmax(0,1.1fr)", gap: 12, alignItems: "start" }}>
            <div>{room}</div>
            {!done && <div>{builder}</div>}
          </div>
        )}
        {footer}
      </div>
    </div>
  , document.body);
}
