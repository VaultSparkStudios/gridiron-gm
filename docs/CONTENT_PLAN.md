# Content Plan

## Current content (v35.0)

### Teams
- 32 fictional teams across 8 divisions (mirrors NFL structure)
- Each team has: city, name, abbreviation, conference, division, two colors
- Source: `TEAMS[]` constant in `src/App.jsx`

### Players
- Procedurally generated — names from `FN[]`/`LN[]` (210/225), colleges from `COL[]` (102)
- 14 positions: QB, RB, WR, TE, LT, LG, C, RG, RT, DL, LB, CB, S, K
- Physical profiles calibrated per position (height/weight gaussian)
- Combine averages calibrated per position
- 8 position-specific skill attributes per position
- 47 bio facts for player backstories

### Game Data
- 17-week regular season schedule
- 3-round playoffs (QF, SF, Finals)
- 7-round draft, 224 picks per year
- Modern analytics pick value chart (224 values)

## Content gaps / planned additions

### High priority
- App icons as PNG (currently SVG; some platforms prefer rasterized PNGs for PWA)
- Open Graph cover image improvement (cover.png is auto-generated but could be replaced with a designed PNG)

### Medium priority
- Team logos/crests (currently color-coded only — abbreviation badge as placeholder)
- Stadium names
- City/team lore text (home city descriptions for flavor)

### Low priority
- Additional player bio facts (currently 47 — could expand to 80+)
- Additional college names (currently 102 — covers P5 + major G5 + FCS)
- Expanded name tables beyond 210/225 (diminishing returns after ~200)

## Content rules

- All team names and city names are fictional (no real NFL teams or players)
- No real person likenesses
- All player names are procedurally generated from name tables
- Statistical distributions calibrated to approximate real NFL ranges (not exact)

## Real Roster Mode

- `public/rosters/nfl-2025.json` — all 32 NFL teams, 10 key players each, 2025 data
- Accessed via "🏈 Real Rosters" button on splash screen
- Uses actual team names + player names/positions/ratings when loaded
- See `docs/REAL_ROSTER_MODE_SETUP.md`
