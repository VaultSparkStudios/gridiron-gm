# Mobile redo plan (not started; activate when ready)

Goal: the phone version should feel calm. One job per screen, big touch targets, no walls of chips/badges.

## Principles
- One primary action per screen, pinned in a bottom action bar (Play Week / Sim / Continue / Draft).
- Show less, reveal on tap: summaries first, details in a bottom sheet. Kill helper paragraphs (move to a "?" sheet).
- Max ~3 colors of emphasis per screen; drop most emoji/pills on phone.
- Lists are 1 line per row (name, pos, one number) with tap → sheet. No horizontal tables.
- No stacked popups: toasts at the bottom, one at a time; result cards as a bottom sheet.

## Structure
- Bottom nav with 5 tabs: Home · Team · Draft · League · More. Everything else lives in More.
- Home = "this week" only: next game card, one-line record, 3 inbox items max, the big action button.
- Team = roster (compact rows by position) + depth chart in segmented control.
- Draft = Scouting HQ (picks + 5 targets) / Board / Regions as segments; Regions on phone = map on top, region list with one dropdown each.
- League = this week's games + leaders carousel (swipe between stat categories).
- Live game: field full width, score strip, one row of 3 controls (Pause, Speed, Finish); everything else in a "⋯" sheet.

## How to do it
1. Audit: screenshot every tab at 390x844 (scratch playwright script like _lvm.mjs), list clutter per screen.
2. Build shared phone primitives in ui.jsx: `PhoneScreen` (header + scroll + action bar), `Sheet`, `Row`, `Segments`.
3. Redo screens in order of use: Home → Live game → Roster → Draft/Scouting → League → rest.
4. Each screen: phone-only branch (`MOBILE`) so desktop stays untouched.
5. Smoke test gets a 390px pass; screenshot before/after for the user each step.
