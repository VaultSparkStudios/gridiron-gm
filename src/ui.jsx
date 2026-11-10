// Shared look: colors, badges, buttons and faces used across the app.
import React from "react";
import { createPortal } from "react-dom";
import { MOBILE as MOBILE_UI } from "./mobile.js";

export { Face } from "./Face.jsx";
// The one close button every popup uses: round, top-right, same size everywhere. The popup's box
// needs position: relative.
// Phones: popups slide up from the bottom as a sheet (drag the grip down to close).
export const sheetWrap=(m)=>m?{alignItems:"flex-end",justifyContent:"stretch",padding:0}:{};
export const sheetBox=(m)=>m?{width:"100%",maxWidth:"none",borderRadius:"18px 18px 0 0",maxHeight:"92vh",paddingBottom:"calc(16px + env(safe-area-inset-bottom))",animation:"sheetUp .22s ease-out",borderBottom:0}:{};
export function SheetGrip({onClose}){const st=React.useRef(null);return<div onTouchStart={e=>{st.current=e.touches[0].clientY;}} onTouchEnd={e=>{const y=e.changedTouches[0].clientY;if(st.current!=null&&y-st.current>70)onClose();st.current=null;}} style={{display:"flex",justifyContent:"center",padding:"2px 0 10px",margin:"-6px 0 0",touchAction:"none"}} aria-hidden="true"><span style={{width:44,height:5,borderRadius:3,background:"#ffffff40"}}/></div>;}
export const CloseX=({onClick,label="Close",style:st})=><button onClick={onClick} aria-label={label} title={label} style={{position:"absolute",top:10,right:10,zIndex:5,width:36,height:36,borderRadius:18,background:"#000a",color:"#fff",border:"1px solid #ffffff33",fontSize:18,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",...(st||{})}}>✕</button>;
// The type and spacing scale every screen draws from. Sizes: T.xs 12 (captions, tags), T.sm 14
// (secondary text, table cells), T.md 16 (body, rows), T.lg 20 (section titles), T.xl 28 (screen
// titles, big numbers), T.xxl 40 (hero numbers). Space: S[1] 4 … S[6] 32. A size off the scale is a
// bug unless it's a badge's own small print.
export const T = { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, xxl: 40 };
export const S = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 };
export const txt = {
  title: { fontSize: T.xl, fontWeight: 900, lineHeight: 1.1, letterSpacing: -0.4, color: "#fff" },
  section: { fontSize: T.lg, fontWeight: 900, lineHeight: 1.2, color: "#fff" },
  body: { fontSize: T.md, lineHeight: 1.5, color: "#e2e8f0" },
  muted: { fontSize: T.sm, lineHeight: 1.5, color: "#94a3b8" },
  caption: { fontSize: T.xs, fontWeight: 700, color: "#94a3b8" },
};
// The calm card every screen uses: a faint fill, round corners, no border.
export const soft = { background: "#ffffff0d", borderRadius: 18, padding: `${S[3]}px ${S[4]}px` };

// Phone primitives (mobile redo). Sheet: a bottom sheet over everything, tap outside or drag the
// grip down to close. Row: one line, label left, a short value right, tap for more. Segments: a
// pill switch between a few views.
// On a computer the same sheet is a centered dialog (wide: for tables and two-column content).
export function Sheet({ title, onClose, children, wide, z = 450 }) {
  const phone = typeof document === "undefined" || document.documentElement.classList.contains("gm-mobile");
  // drawn at the top of the page, so a sheet opened inside a sticky or stacked block still sits over everything.
  // The grip, title and close button stay put and only the body scrolls, and the sheet is sized to
  // the screen you can actually see (dvh: not the space under a phone browser's address bar), so
  // the ✕ is always in reach.
  return createPortal(
    <div className="keep-dark" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: z, background: "#000000a6", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", fontFamily: C.f, ...(phone ? sheetWrap(true) : { alignItems: "center", justifyContent: "center", padding: 24 }) }}>
      <div role="dialog" aria-label={title} className="gm-sheet" onClick={(e) => e.stopPropagation()} style={{ position: "relative", background: "#0d1424", border: phone ? `1px solid ${C.bd}` : 0, color: C.tx, padding: phone ? `${S[4]}px 0 0` : `${S[4]}px ${S[1]}px 0`, display: "flex", flexDirection: "column", overflow: "hidden", ...(phone ? { ...sheetBox(true), maxHeight: undefined } : { width: wide ? 820 : 560, maxWidth: "100%", maxHeight: "86vh", borderRadius: 22, boxShadow: "0 30px 80px #000c" }) }}>
        <div style={{ flexShrink: 0, padding: `0 ${S[4]}px` }}>
          {phone && onClose && <SheetGrip onClose={onClose} />}
          <div style={{ display: "flex", alignItems: "center", gap: S[3], minHeight: 44, marginBottom: S[2] }}>
            <div style={{ flex: 1, minWidth: 0, ...txt.section, padding: "0 2px" }}>{title}</div>
            {onClose && <CloseX onClick={onClose} style={{ position: "static", width: 40, height: 40, borderRadius: 20, flexShrink: 0 }} />}
          </div>
        </div>
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: phone ? `0 ${S[4]}px` : `0 ${S[4]}px ${S[4]}px` }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
// A decision or a moment, in the sheet's look: a plain title, an optional line under it, the body,
// and its buttons in one row at the bottom. No onClose: it has to be answered (no ✕, no tap-out).
export function Dialog({ title, sub, onClose, children, actions, wide, z = 2000 }) {
  return (
    <Sheet title={title} onClose={onClose} wide={wide} z={z}>
      {sub && <div style={{ ...txt.muted, fontSize: T.md, margin: `2px 2px ${S[3]}px`, lineHeight: 1.5 }}>{sub}</div>}
      {children}
      {actions && <div style={{ display: "flex", gap: S[2], flexWrap: "wrap", marginTop: S[4], paddingBottom: S[1] }}>{actions}</div>}
    </Sheet>
  );
}
// The dialog's buttons: primary (green), danger (red), gold, or quiet (the default).
const DB_TONE = { primary: ["#16a34a", "#fff"], danger: ["#7f1d1d", "#fecaca"], gold: ["#eab308", "#111"], quiet: ["#ffffff14", "#e2e8f0"] };
export function DBtn({ kind = "quiet", onClick, disabled, children, title, grow = true, style }) {
  const [bg, c] = DB_TONE[kind] || DB_TONE.quiet;
  return <button onClick={onClick} disabled={disabled} title={title} style={{ flex: grow ? "1 1 160px" : "0 0 auto", minHeight: 48, padding: "0 18px", borderRadius: 14, border: 0, background: bg, color: c, fontSize: T.md, fontWeight: 800, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, ...(style || {}) }}>{children}</button>;
}
// A soft panel and a quiet label inside a dialog.
export const softBox = { background: "#ffffff0d", borderRadius: 14, padding: `${S[3]}px ${S[4]}px` };

export function Row({ label, value, tone, onClick, first, tour }) {
  return (
    <button onClick={onClick} data-tour={tour} style={{ display: "flex", alignItems: "center", gap: S[3], width: "100%", minHeight: 52, textAlign: "left", background: "transparent", border: 0, borderTop: first ? 0 : "1px solid #ffffff14", padding: "0 4px", color: "#fff", cursor: "pointer" }}>
      <span style={{ fontSize: T.md, fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: T.sm, color: tone || "#94a3b8", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
      <span style={{ fontSize: T.lg, color: "#64748b", lineHeight: 1 }}>›</span>
    </button>
  );
}
// The phone's segmented control: the same white-pill track, full width, big enough to tap.
export function Segments({ items, value, onChange }) {
  return <Pills full items={items} value={value} onChange={onChange} style={{ marginBottom: S[3] }} />;
}
// The phone look (Home's): a full-width hero in the club's colors with one big headline, then big
// section titles over soft cards. Hero: eyebrow, title, a line under it, an optional right side and
// anything below (a button). Section: a title with an optional link on the right.
export function Hero({ clr = "#1e3a8a", eyebrow, title, sub, right, children, compact, logo }) {
  return (
    <div className="keep-dark" style={{ position: "relative", overflow: "hidden", margin: "-6px -8px 0", padding: compact ? `${S[4]}px ${S[4]}px ${S[3]}px` : `${S[5]}px ${S[4]}px ${S[5]}px`, color: "#fff", background: `linear-gradient(180deg, transparent 45%, ${C.bg} 100%), radial-gradient(120% 100% at 0% 0%, ${clr}cc, ${clr}22 70%)` }}>
      {/* the club's mark, big and faint behind the headline */}
      {logo && <LogoMark t={logo} sz={compact ? 150 : 190} style={{ right: -28, top: -18 }} />}
      {eyebrow && <div style={{ fontSize: T.xs, fontWeight: 800, letterSpacing: 0.4, color: "#ffffffb3" }}>{eyebrow}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: S[3], marginTop: S[1] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.xl, fontWeight: 900, lineHeight: 1.05, letterSpacing: -0.5, position: "relative" }}>{title}</div>
          {sub && <div style={{ fontSize: T.sm, color: "#ffffffb3", marginTop: S[2] }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
export function Section({ title, action, onAction, children, style }) {
  return (
    <div style={{ marginTop: S[5], ...(style || {}) }}>
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: S[3], padding: "0 2px" }}>
        <span style={txt.section}>{title}</span>
        {action && <button onClick={onAction} style={{ marginLeft: "auto", background: "transparent", border: 0, color: "#7dd3fc", fontSize: T.sm, fontWeight: 700, cursor: "pointer", padding: "6px 0" }}>{action}</button>}
      </div>
      {children}
    </div>
  );
}
// ---- The shared calm pieces (one source, so no screen drifts from another) ----
// A choice of a few views or filters: white pill for the one that's on, in one soft track.
// `big` for a screen's top-level views; otherwise the compact size used inside a card.
export const pill = (on, big) => ({ border: 0, borderRadius: 99, padding: big ? "8px 16px" : "6px 13px", minHeight: MOBILE_UI ? 38 : undefined, fontSize: big ? 14.5 : 13.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: on ? "#fff" : "transparent", color: on ? "#0b1220" : "#cbd5e1", transition: "background .15s, color .15s" });
export const pillTrack = { display: "inline-flex", alignItems: "center", gap: 2, padding: 3, borderRadius: 99, background: "#ffffff0d", maxWidth: "100%", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 };
// The quieter second tier (positions, groups inside a view): a soft lit pill, no track.
export const quietPill = (on) => ({ border: 0, borderRadius: 99, padding: "6px 11px", minHeight: MOBILE_UI ? 38 : undefined, fontSize: 13.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: on ? "#ffffff1f" : "transparent", color: on ? "#fff" : "#94a3b8", transition: "background .15s, color .15s" });
export function Pills({ items, value, onChange, big, quiet, full, wrap, label, style }) {
  const on = (k) => (typeof value === "function" ? value(k) : value === k);
  const box = quiet ? { display: "flex", gap: 2, flexWrap: wrap === false ? "nowrap" : "wrap" } : full ? { ...pillTrack, display: "flex", width: "100%" } : pillTrack;
  return (
    <div role="tablist" aria-label={label} className="pill-row" style={{ ...box, ...(style || {}) }}>
      {items.filter(Boolean).map(([k, l, title]) => <button key={String(k)} role="tab" aria-selected={on(k)} title={title} onClick={() => onChange(k)} style={{ ...(quiet ? quietPill(on(k)) : pill(on(k), big)), ...(full ? { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" } : null) }}>{l}</button>)}
    </div>
  );
}
// A quiet action (Extend, Restructure, Hire): a soft pill, tinted text for what it does.
export const actBtn = (color = "#e2e8f0", strong) => ({ background: strong ? color : "#ffffff0f", color: strong ? "#fff" : color, border: 0, borderRadius: 99, padding: "7px 14px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" });
// A select or search box: a soft pill, no border.
export const field = { background: "#ffffff0d", color: "#e2e8f0", border: 0, borderRadius: 99, padding: "7px 14px", fontSize: 14, fontWeight: 700, minHeight: MOBILE_UI ? 44 : undefined, outline: "none" };
// A card and its title (the Big Board's look).
export const card = { background: "#111827", borderRadius: 20, padding: "16px 18px" };
export const cardTitle = { fontSize: 17, fontWeight: 800, color: "#fff" };
// The height a full-screen list fits in without the page scrolling (desktop).
export const fitH = { height: "calc(100vh - 290px)", minHeight: 380 };
// A calm row: a soft highlight on hover, and its actions (className "calm-act") quiet until then.
// A whole card can do the same with "calm-card".
if (typeof document !== "undefined" && !document.getElementById("calm-css")) {
  const st = document.createElement("style");
  st.id = "calm-css";
  st.textContent = ".calm-row{border-radius:14px;transition:background .12s}.calm-row:hover{background:#ffffff0a}.calm-row .calm-act,.calm-card .calm-act{opacity:.55;transition:opacity .15s}.calm-row:hover .calm-act,.calm-card:hover .calm-act,.calm-act:focus-within{opacity:1}html.gm-mobile .calm-act{opacity:1}";
  document.head.appendChild(st);
}

// a strip of choices you swipe sideways (positions, filters): one is on
export function Chips({ items, value, onChange }) {
  return <Pills items={items} value={value} onChange={onChange} style={{ display: "flex", width: "fit-content" }} />;
}
// Line icons for the phone chrome (tab bar, header): one stroke weight, so nothing looks like an emoji.
const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9v11h13V9M10 20v-6h4v6",
  roster: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6",
  scout: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21",
  camp: "M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11",
  standings: "M4 20V11M10 20V4M16 20v-7M22 20H2",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4.5a3.5 3.5 0 0 0 3.5 4M16 6h3.5A3.5 3.5 0 0 1 16 10M12 13v4M8 20h8M9.5 17h5",
  pen: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  more: "M4 7h16M4 12h16M4 17h16",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20",
  box: "M9 4h6v3H9zM7 5.5H5V21h14V5.5h-2M8.5 12h7M8.5 16h5",
  forward: "M4 6l7 6-7 6zM12 6l7 6-7 6z",
  play: "M7 6v12M11 6v12M15 8.5l5 3.5-5 3.5z",
  camera: "M4 8h3l2-2h6l2 2h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  pause: "M8.5 5v14M15.5 5v14",
  resume: "M8 5.5v13l10.5-6.5z",
  phone: "M5 3.5h3.5l2 5-2.5 1.6a11 11 0 0 0 5.4 5.4L15 13l5 2v3.5a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
};
export const Icon = ({ k, size = 24, color = "currentColor", w = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[k] || ICONS.more} /></svg>
);
export const C={bg:"#080c14",cd:"#111827",bd:"#1e293b",tx:"#e0e6f0",mt:"#64748b",gn:"#22c55e",bl:"#3b82f6",gd:"#eab308",rd:"#ef4444",f:"'Segoe UI',system-ui,sans-serif"};
export const oC=o=>o>=80?"#22c55e":o>=68?"#84cc16":o>=55?"#eab308":o>=42?"#f97316":"#ef4444";
export const pC=p=>({QB:"#e74c3c",RB:"#3498db",WR:"#f39c12",TE:"#9b59b6",LT:"#1abc9c",LG:"#17a589",C:"#0e8c73",RG:"#17a589",RT:"#1abc9c",DL:"#e67e22",EDGE:"#d35400",DT:"#e67e22",LB:"#2ecc71",CB:"#e91e63",S:"#00bcd4",K:"#795548",P:"#8d6e63"}[p]||"#999");
export const PA_LABELS={coffin:"Coffin Corner",armStr:"Arm Str",accuracy:"Accuracy",pocketAwr:"Pocket",decisions:"Decisions",mobility:"Mobility",touch:"Touch",readDef:"Read Def",vision:"Vision",elusiveness:"Elusive",breakTkl:"Break Tkl",passBlock:"Pass Blk",receiving:"Receiving",burst:"Burst",balance:"Balance",stiffArm:"Stiff Arm",routeRun:"Route Run",catching:"Catching",separation:"Separate",release:"Release",bodyCtrl:"Body Ctrl",yac:"YAC",deepSpd:"Deep Spd",catchTraffic:"Traffic",blocking:"Blocking",redZone:"Red Zone",seaming:"Seaming",toughness:"Toughness",footwork:"Footwork",anchor:"Anchor",awareness:"Awareness",handUse:"Hand Use",reach:"Reach",agility:"Agility",runBlock:"Run Blk",pulling:"Pulling",strength:"Strength",drive:"Drive",snapping:"Snapping",leadership:"Leadrshp",athleticism:"Athletic",power:"Power",passRush:"Pass Rush",runStop:"Run Stop",motor:"Motor",getOff:"Get Off",bullRush:"Bull Rush",swim:"Swim",spin:"Spin",tackling:"Tackling",coverage:"Coverage",blitzing:"Blitzing",runFit:"Run Fit",instincts:"Instinct",pursuit:"Pursuit",shedBlock:"Shed Blk",zoneAwr:"Zone Awr",manCov:"Man Cov",zoneCov:"Zone Cov",press:"Press",ballSkills:"Ball Sklls",recovery:"Recovery",playRec:"Play Rec",range:"Range",runSupport:"Run Supp",ballHawk:"Ball Hawk",comms:"Comms",versatility:"Versatile",legStr:"Leg Str",clutch:"Clutch",distance:"Distance",hangTime:"Hang Time",consistency:"Consist",coldWx:"Cold Wx",pressure:"Pressure"};
export const Bdg=({pos})=><span style={{background:pC(pos),color:"#fff",padding:"1px 5px",borderRadius:3,fontSize:11,fontWeight:800}}>{pos}</span>;
export const Btn=({children,onClick,disabled,bg,c:co,style:st})=><button onClick={onClick} disabled={disabled} style={{background:bg||C.bl,color:co||"#fff",border:"none",padding:"4px 10px",borderRadius:4,fontWeight:700,fontSize:13,cursor:disabled?"default":"pointer",opacity:disabled?.5:1,...(st||{})}}>{children}</button>;
export const PN=({p,setSel,style:st})=><span onClick={e=>{e.stopPropagation();setSel(p);}} style={{cursor:"pointer",fontWeight:600,textDecoration:"none",...(st||{})}} onMouseOver={e=>e.target.style.textDecoration="underline"} onMouseOut={e=>e.target.style.textDecoration="none"}>{p.name}</span>;

// Team logos ship with the game (public/logos, 256px, from ESPN's logo CDN) so they show offline
// too (NFL marks belong to the NFL and its clubs). If one is missing (an expansion club), the
// team's colors and abbreviation stand in.
export const logoUrl = (ab) => `${import.meta.env.BASE_URL}logos/${String(ab || "").toUpperCase()}.png`;
// glow: a thin light outline so dark logos (Giants, Bears, Texans) read on dark or team-color
// backgrounds without sitting on a white tile.
const GLOW = "drop-shadow(0 0 1px #ffffffd9) drop-shadow(0 0 1px #ffffffb3) drop-shadow(0 2px 6px #0008)";
// The club's mark, big and faint behind a headline. Most logos wash to a light silhouette; the two
// drawn on a white disc (Steelers, Titans) would wash to a plain circle, so they keep their shapes
// in gray instead.
const DISC = { PIT: 1, TEN: 1 };
export function LogoMark({ t, sz, opacity = 0.07, style }) {
  if (!t) return null;
  const disc = DISC[String(t.ab || "").toUpperCase()];
  return <span aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", transform: "rotate(-8deg)", ...(style || {}), opacity: disc ? opacity * 1.8 : opacity, filter: disc ? "grayscale(1)" : "grayscale(1) brightness(4)" }}><TeamLogo t={t} sz={sz} glow={false} plain /></span>;
}
// the marks that are mostly navy, black or dark green get the outline everywhere: on a dark screen
// or their own team color they'd disappear without it
const DARK = { NYG: 1, NYJ: 1, CHI: 1, HOU: 1, NE: 1, DAL: 1, BAL: 1, PHI: 1, SEA: 1, LAR: 1, LV: 1, CAR: 1, IND: 1, DEN: 1, TEN: 1 };
export function TeamLogo({ t, sz = 40, glow: glowIn = false, plain = false }) {
  const [bad, setBad] = React.useState(false);
  if (!t) return null;
  const glow = glowIn || (!plain && sz >= 18 && DARK[String(t.ab || "").toUpperCase()]);
  const box = { width: sz, height: sz, flexShrink: 0, borderRadius: Math.round(sz / 5), display: "inline-flex", alignItems: "center", justifyContent: "center" };
  if (bad) return <span style={{ ...box, background: `linear-gradient(135deg,${t.clr},${t.ac})`, fontWeight: 900, fontSize: Math.max(9, Math.round(sz / 3)), color: "#fff" }}>{t.ab}</span>;
  return <img src={logoUrl(t.ab)} alt={`${t.city || ""} ${t.name || t.ab}`.trim()} title={`${t.city || ""} ${t.name || ""}`.trim()} width={sz} height={sz} loading="lazy" onError={() => setBad(true)} style={{ ...box, objectFit: "contain", ...(glow ? { filter: GLOW } : {}) }} />;
}

// "Thu, Sep 10 · 8:20 PM ET" from a real schedule's kickoff time (UTC), or "" without one.
export function kickoff(g) {
  if (!g?.date) return "";
  const d = new Date(g.date);
  if (isNaN(d)) return "";
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  // the league hasn't set it yet (late-season flex games come through as midnight)
  if (time === "12:00 AM") return `${day} · time TBD`;
  return `${day} · ${time} ET`;
}

// A "⋯" button that opens a small menu of rarer, riskier actions (Fire...), each asking first.
// items: [{ label, onClick, confirm?, danger? }]
export function OverflowMenu({ items, label = "More actions" }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)} aria-label={label} title={label} style={{ background: open ? C.bd : "transparent", border: `1px solid ${C.bd}`, color: "#cbd5e1", borderRadius: 6, padding: "2px 8px", fontSize: 15, fontWeight: 900, cursor: "pointer", lineHeight: 1.2 }}>⋯</button>
      {open && <>
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 51, background: "#0d1424", border: "1px solid #334155", borderRadius: 10, padding: 4, minWidth: 170, boxShadow: "0 14px 34px #000c" }}>
          {items.map((it) => (
            <button key={it.label} onMouseEnter={(e) => { e.currentTarget.style.background = "#1e293b"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} onClick={() => { setOpen(false); if (!it.confirm || window.confirm(it.confirm)) it.onClick(); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: 0, color: it.danger ? "#fca5a5" : "#e2e8f0", fontSize: 14, fontWeight: 700, padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}>{it.label}</button>
          ))}
        </div>
      </>}
    </span>
  );
}
