# Task Board

## Done (recent)

- [x] v3.2–v5.6: Full franchise sim + Phaser P1–P27, all core systems
- [x] GM: Player morale events, injury severity tiers
- [x] P27: Pass rush mini-game (BLITZ button, sack/coverage break)
- [x] P28: Red zone fade route — 15yd intercept; WR+CB corner; CATCH! button; OVR-based TD chance
- [x] GM: Salary cap penalties — over $200M → +$5M dead cap + 3rd-round pick forfeit
- [x] GM: Coaching contract expiry — contract field on coaches; auto-fire; Re-sign +2yr (1SP)
- [x] P29: Trick play — 15% on run_; NORMAL/TRICK modal; PITCH! at 650ms
- [x] P30: Two-minute drill — _drillMode; auto no-huddle user; auto-prevent AI
- [x] P31: Red zone slant — 3-button RZ modal; WR inside cut; CB press INT risk
- [x] GM: Player holdout effect — p.holdout flag; excluded from teamStr/simGame
- [x] GM: Cap forecast improvements — expiring list + keep-all/cut-all projected space
- [x] GM: Trade request resolution — p.tradeRequest flag; Negotiate or Find Trade
- [x] **v6.0 GM: Owner Goals** — adaptive win target; banner in schedule; season reset
- [x] **v6.0 GM: League News** — collapsible log section; generated from sim events
- [x] **v6.0 GM: Training Camp Focus** — 2SP; +1 attribute; trainedThisCamp flag
- [x] **v6.0 GM: Contract Negotiation Modal** — counter/midpoint/walk away in preseason resign
- [x] **v6.0 GM: Draft Scout (1SP)** — lighter accuracy scout on active draft tab
- [x] **P32: Screen pass** — RB flat; THROW! at 520ms; 82% catch 3-10yds
- [x] **P33: Play action pass** — QB fake; CB bites; 10-28yd enhanced pass
- [x] **P34: Fumble risk mechanic** — runs >7yds; TAP! window; taps modify fumble chance
- [x] **P35: Defensive blitz control** — _showDefCall() pre-snap modal confirmed live

## In Progress

- (none)

## Backlog — GM Systems (v6.x)

- [ ] **GM: Fan Satisfaction Meter** — tracks wins/stars/cuts; affects SP gain rate; shown in standings/schedule
- [ ] **GM: Trade Deadline AI Buy/Sell Mode** — wk 10-11 buyer/seller AI classification; realistic deadline offers
- [ ] **GM: Scouting Budget Allocation** — preseason 5SP split across speed/scheme/injury/combine areas; affects grade accuracy
- [ ] **GM: Coaching Hire Market** — FA coach pool with ratings/specialties; hire costs 1-2SP; fired coaches re-enter pool
- [ ] **GM: Stadium Upgrades** — SP-buyable tiers; crowd noise / turf / capacity; home field advantage effects
- [ ] **GM: Practice Squad Call-Up** — in-season emergency call-up (1SP); auto-returns after 3wks
- [ ] **GM: Multi-Year Owner Goal History** — goal results persist across seasons; 3 consecutive met = SP bonus

## Backlog — Phaser Play (P36–P43)

- [ ] **P36: Pick-Six Return** — user controls DB after INT; blockers; tap-to-dodge; TD possible
- [ ] **P37: Onside Kick** — post-score modal; rapid-tap mechanic; 35% base recovery
- [ ] **P38: QB Scramble Spin Move** — SPIN button when defender <40px; 70% break; one per play
- [ ] **P39: Fake Punt / Fake FG** — 4th down FAKE option; fake punt RB carry; fake FG TE flat pass
- [ ] **P40: Goal Line QB Sneak** — toGo<=1; PUSH! mash mechanic (4 presses / 0.8s); OL vs DL
- [ ] **P41: Drive Momentum Meter** — HUD bar fills on big plays; full = +comp bonus; empty = -comp
- [ ] **P42: Challenge Flag** — 1 per game; turnover/close play; "UNDER REVIEW" animation; 45% overturn
- [ ] **P43: 4th Quarter Comeback Mode** — trailing 7+ Q4; WR speed +6%; AI false start +5%; pass window +200ms

## Backlog — Infrastructure

- [ ] Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
- [ ] Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
