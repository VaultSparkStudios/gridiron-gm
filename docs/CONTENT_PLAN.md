# Content Plan

## Current content (v3.2)

### Teams
- 32 fictional teams across 8 divisions (mirrors NFL structure)
- Each team has: city, name, abbreviation, conference, division, two colors
- Source: `TEAMS[]` constant in `src/App.jsx`

### Players
- Procedurally generated — names from `FN[]`/`LN[]` (120 each), colleges from `COL[]` (53)
- 10 positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K
- Physical profiles calibrated per position (height/weight gaussian)
- Combine averages calibrated per position
- 8 position-specific skill attributes per position

### Game Data
- 17-week regular season schedule
- 3-round playoffs (QF, SF, Finals)
- 7-round draft, 224 picks per year
- Jimmy Johnson pick value chart (224 values)

## Content gaps / planned additions

### High priority
- OG image for social sharing (`public/images/cover.png`)
- App favicon/icon improvements

### Medium priority
- More college names (currently 53 — could expand)
- More player first/last names (currently 120 each)
- More player bio facts (currently 21)

### Low priority
- Team logos/crests (currently color-coded only)
- Stadium names
- City/team lore text

## Content rules

- All team names and city names are fictional (no real NFL teams or players)
- No real person likenesses
- All player names are procedurally generated from name tables
- Statistical distributions calibrated to approximate real NFL ranges (not exact)
