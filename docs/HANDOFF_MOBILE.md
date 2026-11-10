# Handoff: mobile redo

Read `docs/MOBILE_REDO_PLAN.md` first (the what). This file is the how.

## Ground rules
- Phone only. Every change goes behind the `MOBILE` flag (`src/mobile.js`); desktop must look identical before/after.
- One screen per commit, in the plan's order (Home → Live game → Roster → Draft/Scouting → League → rest).
- Don't touch game logic (`src/playsim.js`, `src/scouting.js`, `src/league.js` etc.) — this is layout work.
- Work on a branch; don't publish/deploy. Leave it for the owner to review.

## Checks before every commit (all must pass)
- `npx eslint src/` (0 errors)
- `npm test`
- `npm run build`
- `npm run smoke` (headless playthrough; Chromium is at /opt/pw-browsers in the cloud env)

## Seeing the phone version
- `npm run build` then preview with `?mobile=1` at a 390x844 viewport (Playwright). New game flow: NEW GAME → pick a team → "START YOUR … CAREER" → dismiss popups.
- Screenshot each screen before and after; show the owner.

## Where things are
- `src/App.jsx`: shell, tabs, header, mobile bottom nav and "More" sheet, live game screen (search `tab==="livesim"`).
- `src/HomeScreen.jsx`: home. `src/RosterView.jsx`: roster. `src/LeagueView.jsx`: league front page.
- `src/ScoutingUI.jsx`: all scouting/draft screens (HQ, Board, Regions + map, Scouts, Combine, prospect page).
- `src/ui.jsx`: shared bits (C colors, Btn, Bdg, Face, CloseX, sheetWrap/sheetBox for bottom sheets). Put new phone primitives here.
- `src/WeekResult.jsx`: weekly/playoff result card.

## Owner's taste (from feedback)
- Hates clutter, long helper paragraphs, scrolling to reach main buttons, popups that cover controls.
- Likes EA/Madden-style clean layouts: big headers, simple tables, one clear action.
