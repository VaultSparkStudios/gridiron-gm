# Game Loop

## Core loop

- Player action: Manage roster (sign/cut/trade/draft) and choose game simulation mode
- System response: Simulate games, update standings, accumulate player stats and AV
- Reward: Win games, make the playoffs, win the championship, build a dynasty
- Repeat hook: Each season brings a new draft class, retiring veterans, new FA opportunities, and a harder path to repeat

## Season phase flow

```
PRESEASON
  → assemble roster, set depth chart intent
  ↓ "Start Season"

REGULAR SEASON (17 weeks)
  → Sim Week / Sim All / ⚡ Live Sim (user games only)
  ↓ (week 17 complete)

PLAYOFFS
  → QF → SF → Finals ("Sim Round" each step)
  ↓ (champion crowned)

COMBINE
  → All draft prospects get combine/pro day results
  ↓ "→ Combine"

DRAFT
  → 7 rounds, 224 picks, 2-min timer per user pick
  → AI auto-picks for all other teams
  → ⏭ Sim Draft / ⏸ Pause / ▶ Resume available
  ↓ (all picks done)

FREE AGENCY
  → Browse and sign available players
  ↓ "→ Next Season"

PRESEASON (year + 1)
  → players age, contracts tick down, new draft class generated, new schedule
```

## Failure states

- Fail state: Going 0-17, missing playoffs, salary cap violations (future feature)
- Recovery: Release expensive players, draft cheap prospects, rebuild via trade

## Live Sim sub-loop

- Player action: Press ⚡ Live Sim on an unplayed user game
- System response: Play-by-play advances every ~1.1 seconds; SVG field shows ball position
- Reward: Immersive drive-by-drive gameplay with real play types, Player of the Game reveal
- Repeat hook: Every regular season user game can be live-simmed instead of auto-simmed

## Key mechanics

- **Jimmy Johnson pick values** — 224-value chart governs all trade fairness calculations
- **Passer rating** — real NFL formula (8.33 scale) used for QB stat display
- **Approximate Value (AV)** — position-calibrated career value metric, influences trade value
- **Salary/contract** — every player has a salary ($M) and years remaining; drives FA and cap decisions
- **Scouting** — players have hidden `trueOvr`/`truePot`; spending scout points reveals them incrementally
