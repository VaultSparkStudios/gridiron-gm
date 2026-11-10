// The Legacy Hall around the trophy shelves: championship banners in the rafters, gold jackets
// for the franchise's Hall of Famers, the Ring of Honor and retired numbers, and the franchise
// records wall.
import { MOBILE } from "./mobile.js";
import React from "react";
import { C, Btn, TeamLogo } from "./ui.jsx";
import { CAREER_STATS, ringCandidates, franchiseBoard, teamCareer, normName } from "./history.js";
import { sbName, sbNumber } from "./data/superbowls.js";
import { RECORD_DEFS, recordValue, everyone } from "./records.js";
import goldJacket from "./assets/gold-jacket.webp";
import { RING_OF_HONOR } from "./data/ringOfHonor.js";
import { HALL_OF_FAME } from "./data/hallOfFame.js";
import { posTag } from "./dline.js";

const DIV = { AFC: "AFC", NFC: "NFC" };
const fmt = (n) => Math.round(n).toLocaleString();
const H = ({ children, sub }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "4px 0 10px" }}>
    <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{children}</span>
    {sub && <span style={{ fontSize: 13, color: C.mt }}>{sub}</span>}
  </div>
);

// A banner hanging from the rafters, laid out like the real ones in NFL stadiums: the club's logo,
// what was won on two lines, and the year, on team-color fabric with stitched trim.
function Banner({ team, line1, line2, year, years, gold }) {
  const bg = team.clr || "#1e3a8a", ac = team.ac || "#e5e7eb", trim = gold ? "#e8c45a" : ac;
  return (
    <div className="keep-dark" style={{ position: "relative", flex: "0 0 auto", width: years && years.length > 6 ? 116 : 96, paddingTop: 10 }}>
      <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: 6, borderRadius: 3, background: "linear-gradient(180deg,#e5e7eb,#6b7280)" }} />
      <div style={{ position: "absolute", top: 4, left: 46, width: 4, height: 8, background: "#9ca3af" }} />
      <div style={{ filter: "drop-shadow(0 8px 10px #000b)" }}>
        <div style={{ clipPath: "polygon(0 0,100% 0,100% 88%,50% 100%,0 88%)", background: trim, padding: 3 }}>
          <div style={{ clipPath: "polygon(0 0,100% 0,100% 88%,50% 100%,0 88%)", background: `linear-gradient(100deg, ${bg} 0%, ${bg} 42%, color-mix(in srgb, ${bg} 80%, #fff) 50%, ${bg} 58%, ${bg} 100%)`, minHeight: 170, display: "flex", flexDirection: "column", alignItems: "center", padding: `8px 6px ${years ? 40 : 0}px`, boxSizing: "border-box", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: `1px dashed ${trim}99`, clipPath: "polygon(0 0,100% 0,100% 88%,50% 100%,0 88%)", pointerEvents: "none" }} />
            <div style={{ width: 42, height: 42, borderRadius: 21, background: "#ffffffee", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 2px ${trim}` }}><TeamLogo t={team} sz={34} /></div>
            <div style={{ marginTop: 8, fontSize: 9.5, fontWeight: 900, letterSpacing: 0.8, color: gold ? "#fde68a" : "#fff", textAlign: "center", lineHeight: 1.15, textShadow: "0 1px 2px #0008" }}>{line1}</div>
            <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 1.2, color: gold ? "#fde68a" : "#fff", textAlign: "center", textShadow: "0 1px 2px #0008" }}>{line2}</div>
            {years ? (
              <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: years.length > 6 ? "1fr 1fr" : "1fr", columnGap: 8, rowGap: 1, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: years.length > 6 ? 13 : 15, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px #0009", textAlign: "center" }}>{years.map((y) => <span key={y}>{y}</span>)}</div>
            ) : <div style={{ marginTop: 6, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 26, fontWeight: 900, color: "#fff", textShadow: "0 2px 3px #0009" }}>{year}</div>}
            {gold && <div style={{ color: "#fde68a", fontSize: 14, marginTop: 1 }}>★</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// sbs: [{ yr, n }] Super Bowl wins; titles: [[yr, "NFL" | "AFL" | "AAFC"]] older league titles;
// confs: [[yr, "AFC" | "NFC" | ...]] conference championships; divs: [[yr, "AFC West"]] division titles.
export function Rafters({ team, sbs = [], titles = [], confs = [], divs = [] }) {
  const LG = { NFL: "NFL", AFL: "AFL", AAFC: "AAFC" };
  // three rafters: world championships on their own, then conference titles, then division titles
  // four years to a banner (oldest first), the way clubs hang them
  const champs = [
    ...sbs.map((s) => ({ key: `sb${s.yr}`, yr: s.yr, el: <Banner key={`sb${s.yr}`} team={team} line1={sbName(s.n ?? sbNumber(s.yr)).toUpperCase()} line2="CHAMPIONS" year={s.yr} gold /> })),
    ...titles.map(([y, k]) => ({ key: `l${y}${k}`, yr: y, el: <Banner key={`l${y}${k}`} team={team} line1={`${LG[k] || k}`} line2="CHAMPIONS" year={y} gold /> })),
  ].sort((a, b) => a.yr - b.yr || (a.key < b.key ? -1 : 1));
  const confBanners = [...confs].sort((a, b) => a[0] - b[0]).map(([y, k]) => <Banner key={`c${y}`} team={team} line1={`${k}`.toUpperCase()} line2="CHAMPIONS" year={y} />);
  const groups = {};
  for (const [y, n] of divs) (groups[n] ||= []).push(y);
  const divBanners = Object.entries(groups).sort((a, b) => Math.min(...a[1]) - Math.min(...b[1])).flatMap(([name, ys]) => {
    const sorted = [...ys].sort((a, b) => a - b), out = [];
    for (let i = 0; i < sorted.length; i += 4) out.push(<Banner key={`${name}${sorted[i]}`} team={team} line1={name.toUpperCase()} line2="CHAMPIONS" years={sorted.slice(i, i + 4)} />);
    return out;
  });
  const wall = (label, children) => (
    <div className="keep-dark" style={{ background: "linear-gradient(180deg,#0b0f19,#111827)", borderRadius: 18, overflow: "hidden", padding: "0 12px 14px", position: "relative", marginBottom: 10 }}>
      <div style={{ height: 8, margin: "0 -12px 0", background: "repeating-linear-gradient(90deg,#374151 0 14px,#1f2937 14px 28px)" }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", padding: "8px 2px 0" }}>{label}</div>
      {/* phones hang them a little smaller, four to a row, like a real rafter line */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: MOBILE ? 8 : 12, paddingTop: 2, minHeight: MOBILE ? 150 : 190, alignItems: "flex-start", zoom: MOBILE ? 0.8 : undefined }}>{children}</div>
    </div>
  );
  const nDiv = divs.length, nTitles = sbs.length + titles.length;
  return (
    <div style={{ marginBottom: 22 }}>
      <H sub={`${nTitles} championship${nTitles === 1 ? "" : "s"} · ${confs.length} conference title${confs.length === 1 ? "" : "s"} · ${nDiv} division title${nDiv === 1 ? "" : "s"}`}>The Rafters</H>
      {wall("World champions", champs.length ? champs.map((x) => x.el) : <div style={{ color: C.mt, fontSize: 14, padding: "40px 6px" }}>No championship banners yet. Win the Super Bowl and one goes up here.</div>)}
      {confBanners.length > 0 && wall("Conference champions", confBanners)}
      {divBanners.length > 0 && wall("Division champions", divBanners)}
    </div>
  );
}

// A gold jacket on a hanger.
function GoldJacket({ size = 96 }) {
  return <img src={goldJacket} alt="Hall of Fame gold jacket" width={size} height={Math.round(size * 1.06)} style={{ objectFit: "contain", filter: "drop-shadow(0 8px 12px #000c)" }} />;
}

export function GoldJackets({ team, hofers, yr, onOpen }) {
  // the club's real Hall of Famers (newest class first), and any made in your league
  const real = [...(HALL_OF_FAME[team.ab] || [])].sort((a, b) => b.cls - a.cls || a.n.localeCompare(b.n));
  const total = real.length + hofers.length;
  return (
    <div style={{ marginBottom: 22 }}>
      <H sub={`${total} Hall of Famer${total === 1 ? "" : "s"}: the club's real enshrinees in Canton, and the legends who retire here in your league`}>Gold Jackets</H>
      <div style={{ background: "radial-gradient(ellipse at 50% 0%,#3b2f2455,transparent 70%),#0f0c0a", border: "1px solid #2b211b", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(112px,1fr))", gap: 12 }}>
        {hofers.map((h) => (
          <div key={h.id} onClick={onOpen ? () => onOpen(h) : undefined} title={onOpen ? "Open his player card" : undefined} style={{ textAlign: "center", cursor: onOpen ? "pointer" : "default" }}>
            <GoldJacket size={78} />
            <div style={{ fontWeight: 900, fontSize: 13, marginTop: 4 }}>{h.name}</div>
            <div style={{ fontSize: 11, color: "#fde68a" }}>{h.pos} · Class of {h.hofClass}</div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#f59e0b" }}>{h.hofClass > yr ? `ENSHRINED IN ${h.hofClass}` : "YOUR LEAGUE"}</div>
          </div>
        ))}
        {real.map((h) => (
          <div key={h.n} style={{ textAlign: "center" }} title={`${h.n}: ${h.pos}, ${h.yrs} season${h.yrs === 1 ? "" : "s"} with the club, enshrined ${h.cls}`}>
            <GoldJacket size={64} />
            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 3, lineHeight: 1.2 }}>{h.n}</div>
            <div style={{ fontSize: 11, color: "#d6c7a1" }}>{h.pos}</div>
            <div style={{ fontSize: 11, color: "#a8a29e" }}>Class of {h.cls}</div>
          </div>
        ))}
        {!total && <div style={{ color: "#a8a29e", fontSize: 14, padding: "26px 6px", gridColumn: "1 / -1" }}>No Hall of Famers yet. A legend who retires here gets his gold jacket hung on this wall.</div>}
      </div>
    </div>
  );
}

// The Ring of Honor and retired numbers. ring: inducted ids; nums: retired numbers. candidates:
// notable players who retired here (history entries).
export function RingOfHonor({ team, retired, hall, onInduct, onRetireNum, onOpen, onPass }) {
  const ring = retired.filter((r) => hall.ring.includes(r.id));
  // candidates: this club's own retired greats (they hung it up here), not the whole league's
  const cands = ringCandidates(retired, team, hall).slice(0, 8);
  const taken = new Set(hall.nums.map((n) => n.num));
  const numPass = new Set(hall.numPass || []);
  const real = RING_OF_HONOR[team.ab] || { name: null, members: [] };
  const trim = team.ac || "#e5e7eb", bg = team.clr || "#1e3a8a";
  // retired numbers: the club's real ones, then any retired in this league
  const nums = [...real.members.filter((m) => m.ret && m.num != null).map((m) => ({ num: m.num, name: m.n })), ...(real.fans12 ? [{ num: 12, name: "The 12s (fans)" }] : []), ...hall.nums.filter((n) => !real.members.some((m) => m.ret && m.num === n.num)).map((n) => ({ ...n, mine: true }))].sort((a, b) => a.num - b.num);
  const plaques = [...real.members.map((m) => ({ key: m.n, name: m.n, num: m.num, pos: m.pos, yrs: m.yrs, ind: m.ind, ret: m.ret })), ...ring.map((r) => ({ key: r.id, name: r.name, num: r.num, pos: r.pos, ind: r.retYr, mine: true, r }))];
  return (
    <div style={{ marginBottom: 22 }}>
      <H sub={real.name ? `${team.city} ${team.name} ${real.name}${real.members.length ? `, ${plaques.length} members` : ""}` : "Honor the greats who played here"}>{real.name || "Ring of Honor"} & retired numbers</H>
      {nums.length > 0 && (
        <div className="keep-dark" style={{ background: "#ffffff0d", borderRadius: 18, padding: "14px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Retired numbers</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {nums.map((n) => (
              <div key={`${n.num}${n.name}`} title={n.name} style={{ width: 92, textAlign: "center" }}>
                <div style={{ clipPath: "polygon(0 0,100% 0,100% 86%,50% 100%,0 86%)", background: trim, padding: 3 }}>
                  <div style={{ clipPath: "polygon(0 0,100% 0,100% 86%,50% 100%,0 86%)", background: bg, padding: "10px 4px 20px" }}>
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 38, fontWeight: 900, lineHeight: 1, color: "#fff", textShadow: "0 2px 3px #0009" }}>{n.num}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginTop: 4, lineHeight: 1.2 }}>{n.name}{n.mine && <span style={{display: "block", fontSize: 10, color: "#fde68a" }}>Retired in your league</span>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="keep-dark" style={{ background: `linear-gradient(180deg,${bg},#0b1220)`, borderRadius: 12, padding: "12px 14px", border: `2px solid ${trim}` }}>
        {!plaques.length && <span style={{ color: "#fffa", fontSize: 14 }}>{real.name === null ? "The club has never had a Ring of Honor. Start one: induct a retired great below." : "The Ring of Honor is empty. Induct a retired great below."}</span>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
          {plaques.map((m) => (
            <div key={m.key} onClick={m.r && onOpen ? () => onOpen(m.r) : undefined} title={m.r && onOpen ? "Open his player card" : undefined} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0006", border: `1px solid ${m.mine ? "#fde68a" : trim + "66"}`, borderRadius: 8, padding: "7px 10px", cursor: m.r && onOpen ? "pointer" : "default" }}>
              <div style={{ minWidth: 38, height: 38, borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center", background: m.ret ? "#fde68a" : "#fff", color: m.ret ? "#3b2a0a" : bg, fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 17 }}>{m.num ?? "★"}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 14, letterSpacing: 0.5, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: "#fffb" }}>{[m.pos, m.yrs, m.ind && `inducted ${m.ind}`].filter(Boolean).join(" · ")}{m.mine && <b style={{ color: "#fde68a" }}> · your league</b>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {(cands.length > 0 || ring.some((r) => r.num != null && !taken.has(r.num) && !numPass.has(r.id))) && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 8, marginTop: 8 }}>
        {cands.map((r) => (
          <div key={r.id} style={{ background: "#ffffff0d", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div onClick={onOpen ? () => onOpen(r) : undefined} title={onOpen ? "Open his player card" : undefined} style={{ flex: 1, minWidth: 0, cursor: onOpen ? "pointer" : "default" }}><div style={{ fontWeight: 800, fontSize: 14, textDecoration: onOpen ? "underline dotted #ffffff55" : "none" }}>{r.name} {r.hof && <span style={{ color: "#fde68a", fontSize: 11 }}>HOF</span>}</div><div style={{ fontSize: 12, color: C.mt }}>{posTag(r)} · retired {r.retYr} · legacy {r.legacy}</div></div>
            <Btn onClick={() => onInduct(r)} bg="#b45309" style={{ fontSize: 12, padding: "4px 10px" }}>Yes, induct</Btn>
            {onPass && <Btn onClick={() => onPass(r)} bg="transparent" c={C.mt} style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #ffffff10" }} title="He won't be offered again">No</Btn>}
          </div>
        ))}
        {ring.filter((r) => r.num != null && !taken.has(r.num) && !numPass.has(r.id)).map((r) => (
          <div key={`n${r.id}`} style={{ background: "#ffffff0d", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{r.name}</div><div style={{ fontSize: 12, color: C.mt }}>Ring of Honor · wore #{r.num}</div></div>
            <Btn onClick={() => onRetireNum(r)} bg="#1e3a5f" c="#7dd3fc" style={{ fontSize: 12, padding: "4px 10px" }}>Retire #{r.num}</Btn>
            {onPass && <Btn onClick={() => onPass(r, "num")} bg="transparent" c={C.mt} style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #ffffff10" }} title="Keep the number in circulation">No</Btn>}
          </div>
        ))}
      </div>}
    </div>
  );
}

// Record cards: the app's dark cards, a colored edge for what kind of mark it is (gold: set in your
// league; slate: the club's real history; green: held by an active player), the number big and
// plain, everything else in quieter type underneath.
const recCard = { background: "#ffffff0d", borderRadius: 14, padding: "10px 12px 11px", minWidth: 0 };
const recLabel = { fontSize: 13, fontWeight: 700, color: "#94a3b8" };
const recValue = { fontSize: 28, fontWeight: 900, lineHeight: 1.1, color: C.tx, marginTop: 3, fontVariantNumeric: "tabular-nums" };
const recWho = { fontSize: 14, fontWeight: 800, color: C.tx, marginTop: 1 };
const recNote = { fontSize: 12, color: C.mt, marginTop: 2, lineHeight: 1.35 };

// Franchise records: the club's all-time career leaders (its real history through 2025 plus
// everything done in your league) and the league records your players hold.
export function RecordsWall({ team, retired, book, teams = [], allRetired = retired }) {
  const ctx = { teams, retired: allRetired };
  const rows = CAREER_STATS.map((c) => {
    const board = franchiseBoard(team.ab, c.key, ctx, 10);
    // the best on this year's roster, and where he stands
    let mine = null;
    for (const p of everyone(team)) { const v = teamCareer(p, team.ab, team.ab)[c.key]; if (v > 0 && (!mine || v > mine.v)) mine = { name: p.name, v }; }
    const rank = mine ? board.findIndex((r) => normName(r.name) === normName(mine.name)) + 1 : 0;
    return { ...c, board, mine, rank };
  }).filter((r) => r.board.length);
  const held = Object.entries(book?.best || {}).filter(([, b]) => b.team === team.ab && !b.nfl).map(([k, b]) => ({ ...b, label: RECORD_DEFS.find((d) => d.key === k)?.label || k }));
  // the club's single-season marks (real history, plus any set in your league), and who on this
  // year's roster is closest to each
  const fr = book?.franchise?.[team.ab] || {};
  const season = RECORD_DEFS.filter((d) => fr[d.key]).map((d) => {
    let lead = null;
    for (const p of everyone(team)) { const v = p.ss?.[d.key] || 0; if (v > 0 && (!lead || v > lead.v)) lead = { name: p.name, v }; }
    return { ...d, rec: fr[d.key], lead };
  });
  return (
    <div style={{ marginBottom: 22 }}>
      {season.length > 0 && <>
        <H sub="The club's best single seasons, through 2025 and in your league. Beat one and it's yours.">Single-season records</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10, marginBottom: 18 }}>
          {season.map((r) => {
            const mine = !r.rec.real, pct = r.lead ? Math.min(100, (r.lead.v / r.rec.val) * 100) : 0;
            return (
              <div key={r.key} style={recCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={recLabel}>{r.label}</span>
                  {mine && <span title="Set in your league" style={{ marginLeft: "auto", whiteSpace: "nowrap", fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>★ Yours</span>}
                </div>
                <div style={recValue}>{recordValue(r.key, r.rec.val)}</div>
                <div style={recWho}>{r.rec.name}<span style={{ color: C.mt, fontWeight: 600 }}>{r.rec.yr ? ` · ${r.rec.yr}` : " · tied"}</span></div>
                {(r.rec.ties || []).map((x, j) => <div key={j} style={recNote}>Tied by {x.name} ({x.yr})</div>)}
                {r.rec.prev && mine && <div style={recNote}>Broke {r.rec.prev.name}'s {recordValue(r.key, r.rec.prev.val)}{r.rec.prev.yr ? ` (${r.rec.prev.yr})` : ""}</div>}
                {r.lead && !(mine && r.rec.name === r.lead.name) && <div style={{ marginTop: 8 }}>
                  <div style={{ height: 6, background: "#ffffff14", borderRadius: 3 }}><div style={{ width: `${pct}%`, height: "100%", background: pct >= 90 ? "#ef4444" : "#3b82f6", borderRadius: 3 }} /></div>
                  <div style={{ ...recNote, marginTop: 4 }}>This season: <b style={{ color: C.tx }}>{r.lead.name}</b>, {recordValue(r.key, r.lead.v)} <span style={{ color: pct >= 90 ? "#fca5a5" : C.mt }}>({Math.round(pct)}%)</span></div>
                </div>}
              </div>
            );
          })}
        </div>
      </>}
      <H sub="Each stat's all-time leaders with the club: its real history through 2025, plus everything done in your league.">Franchise career leaders</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
        {rows.length ? rows.map((r) => {
          const top = r.board[0], tenth = r.board[r.board.length - 1];
          return (
            <div key={r.key} style={recCard}>
              <div style={recLabel}>{r.label}</div>
              <div style={recValue}>{recordValue(r.key, top.v)}</div>
              <div style={recWho}>{top.name}{top.active ? <span style={{ color: "#4ade80", fontWeight: 800 }}> · active</span> : null}</div>
              <div style={{ marginTop: 7, borderTop: "1px solid #ffffff12", paddingTop: 5 }}>
                {r.board.slice(1, 5).map((b, i) => (
                  <div key={b.name} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.6, color: b.active ? "#86efac" : "#cbd5e1", fontWeight: b.active ? 800 : 500 }}>
                    <span style={{ width: 16, color: C.mt, fontWeight: 700 }}>{i + 2}</span><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}{b.active ? " ●" : ""}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{recordValue(r.key, b.v)}</span>
                  </div>
                ))}
              </div>
              {r.mine && r.rank !== 1 && (
                <div style={{ marginTop: 7, fontSize: 13, background: "#3b82f61a", color: "#bfdbfe", borderRadius: 8, padding: "5px 9px", fontWeight: 700, lineHeight: 1.35 }}>
                  {r.rank > 0
                    ? <>{r.mine.name}: #{r.rank}, {recordValue(r.key, top.v - r.mine.v)} behind {top.name}</>
                    : <>{r.mine.name}: {recordValue(r.key, r.mine.v)} · {recordValue(r.key, tenth.v - r.mine.v + 1)} from the top 10</>}
                </div>
              )}
            </div>
          );
        }) : <div style={{ color: C.mt, fontSize: 14, padding: 10 }}>No records yet.</div>}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.mt }}>● still playing. Real players carry what they did here before 2026; anyone who passes #1 makes the news.</div>
      {held.length > 0 && <div style={{ marginTop: 8, fontSize: 13, color: "#fde68a" }}>League records held: {held.map((b) => `${b.label}: ${b.name}, ${b.yr}`).join(" · ")}</div>}
    </div>
  );
}
