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

- [x] **v6.1 GM: Fan Satisfaction Meter** — `fanSat` 0-100; SP rate modifier; color bar in standings/schedule
- [x] **v6.1 GM: Trade Deadline AI Buy/Sell Mode** — wk 10-11 buyer/seller; banner + tags in trade tab
- [x] **v6.1 GM: Scouting Budget Allocation** — 5SP across speed/scheme/injury/combine; accuracy multipliers
- [x] **v6.1 GM: Coaching Hire Market** — `coachMarket` pool; SP-cost hires; fired coaches re-enter
- [x] **v6.1 GM: Stadium Upgrades** — crowd noise / premium turf / expanded capacity
- [x] **v6.1 GM: Practice Squad Call-Up** — 1SP; in-season; auto-returns after 3 wks
- [x] **v6.1 GM: Multi-Year Owner Goal History** — `ownerGoalHistory[]`; dynasty bonus at 3 consecutive
- [x] **P36: Pick-Six Return** — DB WASD run after INT; pursuit AI; TD/tackle resolution
- [x] **P37: Onside Kick** — post-score modal; rapid-tap RECOVER! 1.2s window
- [x] **P38: QB Scramble Spin Move** — SPIN button DL <40px; 70% break; `_spinUsed` per play
- [x] **P39: Fake Punt / Fake FG** — modal before punt/FG; FAKE IT / REAL KICK; 3s auto-dismiss
- [x] **P40: Goal Line QB Sneak** — toGo≤1; PUSH! mash 4 taps/0.8s; QB surge tween
- [x] **P41: Drive Momentum Meter** — ⚡ HUD bar; ±% comp modifier; color-coded
- [x] **P42: Challenge Flag** — 1 per game; 45% overturn; pre-play state snapshot
- [x] **P43: 4th Quarter Comeback Mode** — trailing 7+ Q4; +3% comp; AI false start +5%

## Backlog — Infrastructure

- [ ] Wire analytics endpoint — set VITE_ANALYTICS_URL in .env.local
- [ ] Generate PNG OG image — open scripts/gen-og.html → download → public/images/cover.png
