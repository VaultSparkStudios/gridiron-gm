// The new-franchise walkthrough: offered when you start a franchise (skip it, or click through),
// and again from the Menu. Each step opens a screen and, where it helps, spotlights the part of
// the page it's talking about (elements marked data-tour="...").
import React, { useEffect, useLayoutEffect, useState } from "react";
import { C } from "./ui.jsx";

// tab: the screen to show; target: the data-tour mark to spotlight (optional)
export function tourSteps(mobile) {
  // desktop: the broadcast Home and the six-section bar
  if (!mobile) return [
    { tab: "dashboard", target: "promo", title: "This week's game", body: "Home leads with your next game: both clubs, their stars, the line and the weather. Play it live or sim it right from here." },
    { tab: "dashboard", target: "todo", title: "What needs you", body: "Your to-do list: holdouts, injuries, contract years and more. Click one to deal with it; See all has the rest. Development focus is here too: pick one offensive and one defensive player to grow each week." },
    { tab: "dashboard", target: "actions", title: "Moving time forward", body: "Play Week watches your game live; Sim Week skips ahead, and the arrow sims to the trade deadline or the whole season. In the offseason the same spot moves you from the Combine to re-signing, free agency and the draft." },
    { tab: "dashboard", target: "phases", title: "Your season", body: "Your record and where you are in the year. Click it for every week (W or L, your bye, the next game ringed) and the offseason stages ahead." },
    { tab: "depth", target: "nav", title: "Getting around", body: "Six sections: Home, Team (depth chart, roster, coaching), Season (schedule, standings, playoffs, stats, league, Legacy), Draft, Trades & FA, and Front Office. Each section's screens are tabs just under the bar. Search, Save and settings are in the ⋯ menu." },
    { tab: "depth", title: "Depth chart", body: "Click a spot to choose the starter and set snap shares. Your game plan is here too: your coordinators' schemes, how well they fit your roster, and your personnel." },
    { tab: "contracts", title: "Front Office", body: "Your cap and every contract. The Cap Advisor suggests restructures, cuts and extensions, and Where the Money Goes compares your spending with the league. Extend young stars early: deals only get pricier as they near the market." },
    { tab: "coaching", title: "Coaching", body: "Your head coach and coordinators. A better staff is worth points on game day. Extend the good ones, replace the bad ones, and switch schemes to fit the roster you have." },
    { tab: "trade", title: "Trades", body: "Tick players and picks on both sides (picks up to three drafts out) and the summary tells you if they'd take it. The Trade finder suggests deals they'd accept; the Trade block puts your players up for offers. The deadline is after Week 9." },
    { tab: "freeagency", title: "Free agency", body: "Negotiate years, money, a signing bonus and incentives. Players want more than money: a starting job, the right scheme or a winner, and a rival club's offer is leverage. The big market opens after the Combine." },
    { tab: "scouting", title: "Scouting and the draft", body: "Scouting points buy reports on prospects, and area scouts read a whole region at once. Build your own board before the Combine. On draft day every pick has a two-minute clock, so there's time to trade up or down." },
    { tab: "schedule", title: "Schedule, standings and playoffs", body: "Your games (play any of them live), the standings, and during the season the playoff picture: who'd be in if the season ended today." },
    { tab: "trophies", title: "Your Legacy Hall", body: "Banners, trophies, gold jackets and your club's Ring of Honor. Stats has every league leader, and League has the record book and league history." },
    { tab: "dashboard", title: "You're all set", body: "Save, search, light mode and Game Updates are all in the ⋯ menu at the top right, and you can replay this tour from there any time. Good luck, GM." },
  ];
  return [
    { tab: "dashboard", target: "strip", title: "Your franchise at a glance", body: "Record, cap space, roster health, and how the owner and the locker room feel. When something needs a decision from you, Needs Attention shows up first: tap it to see the list. Tap any box to jump to that screen." },
    { tab: "dashboard", target: "devfocus", title: "Development focus", body: "Pick one offensive and one defensive player to work with: each regular-season week a focused player can gain a point, and young players with a strong development trait grow fastest. Above it: the league's top stories and the injury report." },
    { tab: "dashboard", target: "actions", title: "Moving time forward", body: "Everything moves from here. Start Season, then Play Week to watch your game live or Sim Week to skip ahead. Sim to Deadline jumps to Trade Deadline Day; Sim All plays out the season. In the offseason the same spot takes you from the Combine to re-signing, free agency and the draft." },
    { tab: "dashboard", target: "phases", title: "The league year", body: "Preseason, 18 weeks (each box is a week: W or L once it's played, BYE for your week off, the next game ringed), the playoffs, then the Combine, re-sign week, free agency and the draft. Each offseason week asks before moving on, so nothing gets skipped by accident." },
    mobile
      ? { tab: "dashboard", target: "nav", title: "Getting around", body: "The bar at the bottom has the screens you'll use most. More has everything else, plus Save, light mode and settings." }
      : { tab: "depth", target: "nav", title: "Getting around", body: "Every screen lives in this bar. Some hold a few related screens, with tabs across the top: Depth Chart also has your roster, Draft & Scouting has scouting, the draft and its recap, League has the league hub, the record book and league history, and Game Updates has the patch notes and your timeline." },
    { tab: "depth", title: "Depth chart", body: "Tap a spot to choose the starter and set snap shares. Your game plan is here too: your coordinators' schemes, how well they fit your roster, and your personnel." },
    { tab: "contracts", title: "Front Office", body: "Your cap and every contract. The Cap Advisor suggests restructures, cuts and extensions, and Where the Money Goes compares your spending with the league. Extend young stars early: deals only get pricier as they near the market." },
    { tab: "coaching", title: "Coaching", body: "Your head coach and coordinators. A better staff is worth points on game day. Extend the good ones, replace the bad ones, and switch schemes to fit the roster you have." },
    { tab: "trade", title: "Trades", body: "Tick players and picks on both sides (picks up to three drafts out) and the summary tells you if they'd take it. The Trade finder suggests deals they'd accept; the Trade block puts your players up for offers. The deadline is after Week 9." },
    { tab: "freeagency", title: "Free agency", body: "Negotiate years, money, a signing bonus and incentives. Players want more than money: a starting job, the right scheme or a winner, and a rival club's offer is leverage. The big market opens after the Combine." },
    { tab: "scouting", title: "Scouting and the draft", body: "Scouting points buy reports on prospects, and area scouts read a whole region at once. Build your own board before the Combine. On draft day every pick has a two-minute clock, so there's time to trade up or down." },
    { tab: "schedule", title: "Schedule, standings and playoffs", body: "Your games (play any of them live), the standings, and during the season the playoff picture: who'd be in if the season ended today." },
    { tab: "trophies", title: "Your Legacy Hall", body: "Banners, trophies, gold jackets and your club's Ring of Honor. Stats has every league leader, and League has the record book and league history." },
    { tab: "dashboard", title: "You're all set", body: `${mobile ? "Save from More" : "Save from the top bar"}, switch to light mode from the ${mobile ? "More menu" : "Menu"}, and see every change in Game Updates. You can replay this tour from the ${mobile ? "More menu" : "Menu"} any time. Good luck, GM.` },
  ];
}

// Offered when a franchise starts: take the tour or skip it.
export function TourOffer({ team, onStart, onSkip }) {
  const [never, setNever] = useState(false);
  const skip = () => { if (never) { try { localStorage.setItem("gm_tour_never", "1"); } catch { /* private mode */ } } onSkip(); };
  return (
    <div onClick={skip} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1424", borderRadius: 22, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 30px 80px #000c" }}>
        
        <div style={{ fontSize: 28, fontWeight: 900, textAlign: "center", margin: "6px 0 4px" }}>Welcome to the {team}, GM</div>
        <div style={{ fontSize: 14, color: "#cbd5e1", textAlign: "center", lineHeight: 1.5, marginBottom: 18 }}>Want a quick tour of where everything is? About two minutes, and you can leave it any time.</div>
        <button onClick={onStart} style={{ width: "100%", background: C.gn, color: "#fff", border: 0, borderRadius: 14, padding: "13px 0", fontSize: 16, fontWeight: 900, cursor: "pointer", marginBottom: 8 }}>Show me around</button>
        <button onClick={skip} style={{ width: "100%", color: "#cbd5e1", border: 0, background: "#ffffff12", borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Skip the tour</button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 12, fontSize: 14, color: C.mt, cursor: "pointer" }}>
          <input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} /> Don't offer this on new franchises
        </label>
      </div>
    </div>
  );
}

// The tour itself: the card at the bottom, and a spotlight on the step's target.
export default function Walkthrough({ steps, step, setStep, onClose, mobile }) {
  const s = steps[step];
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    setRect(null);
    if (!s?.target) { const t = setTimeout(() => scrollTo(0, 0), 60); return () => clearTimeout(t); }
    let alive = true;
    const find = () => {
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (!el || !alive) return;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    // the screen renders first; then bring the target into view and measure it
    const t1 = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      const top = el?.getBoundingClientRect().top;
      if (el && (top < 0 || top > innerHeight * 0.5)) el.scrollIntoView({ block: "center" });
      find();
    }, 180);
    const t2 = setTimeout(find, 500);
    addEventListener("resize", find); addEventListener("scroll", find, true);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); removeEventListener("resize", find); removeEventListener("scroll", find, true); };
  }, [step, s?.target]);
  useEffect(() => {
    const key = (e) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") setStep((n) => Math.min(steps.length - 1, n + 1)); else if (e.key === "ArrowLeft") setStep((n) => Math.max(0, n - 1)); };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [steps.length, onClose, setStep]);
  if (!s) return null;
  const last = step === steps.length - 1, pad = 6;
  return (
    <>
      {/* blocks clicks on the page while the tour is up; dims everything but the spotlight */}
      <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: rect ? "transparent" : "rgba(0,0,0,.45)" }} />
      {rect && <div style={{ position: "fixed", left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2, borderRadius: 10, border: `3px solid ${C.gd}`, boxShadow: "0 0 0 9999px rgba(0,0,0,.6)", zIndex: 3001, pointerEvents: "none", transition: "all .25s ease" }} />}
      <div role="dialog" aria-label="Tour" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: mobile ? 84 : 24, zIndex: 3002, width: "min(94vw, 480px)", background: C.cd, borderRadius: 18, padding: "14px 16px", boxShadow: "0 12px 40px #000c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.gd }}>Tour · {step + 1} of {steps.length}</span>
          <div style={{ flex: 1, height: 4, background: C.bd, borderRadius: 2 }}><div style={{ width: `${((step + 1) / steps.length) * 100}%`, height: "100%", background: C.gd, borderRadius: 2, transition: "width .25s" }} /></div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5 }}>{s.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ background: "transparent", border: 0, color: C.mt, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "8px 4px" }}>{last ? "Close" : "Skip tour"}</button>
          <span style={{ flex: 1 }} />
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ background: C.bg, color: "#e2e8f0", border: "1px solid #ffffff10", borderRadius: 8, padding: "9px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back</button>}
          <button onClick={() => (last ? onClose() : setStep(step + 1))} style={{ background: C.gn, color: "#fff", border: 0, borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>{last ? "Let's go" : "Next →"}</button>
        </div>
      </div>
    </>
  );
}
