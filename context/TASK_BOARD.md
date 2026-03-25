# Task Board

## Done (recent)

- [x] v3.2–v5.6: Full franchise sim + Phaser P1–P27, all core systems
- [x] GM: Player morale events, injury severity tiers
- [x] P27: Pass rush mini-game (BLITZ button, sack/coverage break)
- [x] **P28: Red zone fade route** — 15yd intercept; WR+CB corner; CATCH! button; OVR-based TD chance
- [x] **GM: Salary cap penalties** — over $200M → +$5M dead cap + 3rd-round pick forfeit; red warning banner
- [x] **GM: Coaching contract expiry** — `contract` field on coaches; newSeason decrements; auto-fire to FA; Re-sign +2yr (1SP) button preseason

## In Progress

- (none)

## Backlog — Gameplay

- [x] **P29: Trick play** — 15% chance on run_ calls; NORMAL RUN / TRICK PLAY modal (3s auto); PITCH! button at 650ms; 50/64% big gain 15-34yds, 30/26% medium, 20/10% blown up
- [x] **P30: Two-minute drill** — state._drillMode after warning; auto no-huddle user drives; auto prevent AI; clears at halftime
- [x] **P31: Red zone slant** — 3rd RZ option in _showFadeOption; WR inside cut animation; CB press INT risk; ~70% comp 4-11yds; 38% TD inside 9yd
- [ ] P32: Goal line QB sneak — inside 1yd short yardage option; button mash mini-game

## Backlog — GM Systems

- [x] **GM: Player holdout effect** — `p.holdout=true` from morale event; clears at simWk start; excluded from teamStr + simGame; clears on re-sign
- [x] **GM: Cap forecast improvements** — expiring list (top 6 by OVR) with est. ask; keep-all / cut-all projected space in cap header
- [x] **GM: Trade request resolution** — p.tradeRequest flag; roster banner; Negotiate (1SP) or Find Trade (auto-offer)
- [ ] GM: Player retirement — age 34+ chance at season end; hall of fame log
- [ ] GM: Season awards panel — MVP/DPOY/OROY/DROY from stats; rep bonus for winner's GM

## Backlog — Infrastructure

- [ ] Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
- [ ] Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
