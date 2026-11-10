# Handoff: the mobile redo, the desktop redo, the trade market and the game systems

This is the complete record of the redo session that followed `docs/HANDOFF_MOBILE.md` and
`docs/MOBILE_REDO_PLAN.md`. It covers every change, where in the code it lives, how it was
checked, what's left and how the owner likes to work. Read it top to bottom before touching the UI
or the trade code.

Branches: work on `claude/kind-hypatia-n43n55`; **`claude/scouting-overhaul` is the live branch**
(see §10 Deploying). The session's commits run from `41f46d4` (Mobile redo: Home) through the
UI redo, the trade market (`157b235`), the whole-game style sweep, safeties, contracts and head
coach retirement (latest: `75aaeae`); `git log --oneline b42d13f..HEAD` lists them all. Last
updated 2026-10-26.

---

## 1. How the owner works (read this first)

- **The test for every screen:** "Would you want to spend time on that screen? Would you leave
  because it's too busy?" Clean, calm, premium, few taps, no clutter, no desktop-crammed-into-a-phone.
- **No unnecessary scrolling, no poor offset.** A screen that fits should fit: Home and other
  summary screens must not need a scroll at a normal laptop window, and side-by-side cards must line
  up (same header heights, same top edge). Text never clipped. Check scroll height in screenshots.
- **No emoji in the interface.** Menus, buttons, labels and cards use words (and real logos or
  art), never emoji: they cheapen the look. Anything still carrying them from the old game gets
  converted when it's touched.
- **Nothing new may look cheap or tacky.** Every UI change has to match or raise the premium look
  already built: never paste a cut-out graphic on top of a screen. Integrate it (behind the art,
  faded, in the type and color system), explore more than one route, and judge it in a screenshot
  next to the screens around it before it ships.
- **Home is the standard.** The phone Home and the desktop "broadcast" Home are the look every
  other screen should follow: big team-colored hero, soft rounded cards (`#ffffff0d`, radius 18,
  no border), plain white section titles, one clear action.
- Picks between options from **mockups**: when a layout decision is big, render 3–5 static
  mockups (HTML → Playwright screenshots, using the real logos in `public/logos` and the player
  art in `public/players`) and let the owner choose. They chose Home layout "1 · Broadcast" and
  navigation "B · one clean bar".
- Wants agents to **play-test and find bugs themselves** (screens that point to moved/removed
  places, popups that can't be closed, things that scroll the page behind instead of the popup).
- Pushes go live after every verified round (see Deploying). Report plainly what was checked.
- Mobile and desktop are separate designs: phone changes go behind `MOBILE`; desktop changes
  must be checked on desktop. Both share game logic.
- **Wants realism.** Ratings, contracts and careers should follow real football: safeties rated
  on what a free or strong safety actually does, contracts on the real market, real coaches on
  believable timelines (John Harbaugh "isn't gonna retire 2 years after starting in NY"). Check
  numbers against real data and say what they were calibrated to.
- Changes their mind mid-request sometimes (League as its own section, then into Front Office);
  take the latest word and confirm the file state before re-applying an edit.
- Gives praise and asks for polish ("rework it in a classier way, I trust you"): open-ended design
  asks mean a real redesign with the existing assets, shown in screenshots, not a tweak.

## 2. Where things are (orientation)

- `src/App.jsx` — the whole shell (state, top bar, nav, tabs, every screen's mount). Huge, minified
  style JSX; edit with exact-string replacements. Key landmarks (search for these):
  - `const DESK=[` — the six desktop sections and the screens under each (§4.1).
  - `inboxItems` / `it.push({key:` — Home to-dos and inbox items.
  - `data-tour="phases"` — the team/record button that opens the season dropdown.
  - `SectionHero` — the desktop section header mount (§4.3).
  - `it.push({key:` — every to-do / inbox item and where it sends you (§6).
  - `{/* DRAFT */}` — the draft tab (phone draft room branch inside it).
  - `tab==="livesim"` — the live game screen.
- `src/ui.jsx` — shared primitives. **Phone primitives:** `Sheet` (portal bottom sheet, fixed
  header with grip/title/close, scrolling body sized in `dvh`), `Row`, `Segments`, `Hero`,
  `Section`, `Chips`, `Icon` (line icons; `ICONS` map incl. pause/resume/phone/swap/list).
- `src/mobile.js` — the `MOBILE` flag (`?mobile=1` or the mobile build) and phone CSS (press
  feedback, `.gm-in` fade, `.gm-sheet` height).
- `src/DeskHome.jsx` — **new**: desktop Home (broadcast promo + three cards), `PhaseHero` (no-game
  weeks), `SectionHero` (header for every desktop section).
- `src/HomeScreen.jsx` — Home for both: `PhoneHome` (phone) and the desktop branch that builds
  props for `DeskHome`. The old desktop board layout was **deleted**.
- `src/trade.js` — trade values and AI acceptance (§8).
- Game systems touched later (§7): `roles.js` (positional roles incl. FS/SS), `offseason.js`
  (asking prices, AI re-signs and free agency), `contracts.js` (tag, fifth-year option),
  `negotiation.js` + `Negotiate.jsx` (the table), `cap.js` (cap, rookie scale), `carousel.js`
  (coaches' ages, retirement, firings and hires), `Atmosphere.jsx` (holiday games).

## 3. Mobile (everything behind `MOBILE`)

All phone screens were rebuilt in the Home style. Component → file:

| Screen | Component(s) | File |
|---|---|---|
| Home | `PhoneHome` (game hero, to-do cards, tiles, top story; sheets for dev focus/injuries/needs) | HomeScreen.jsx |
| Week result | `PhoneCard` (final-score card; tap = box score) | WeekResult.jsx |
| Live game | deck toolbar, "On the field" switch, docked `PhoneCaller` play caller, no win probability, no end popup | App.jsx (`livesim`), PlayCaller.jsx, LiveField.jsx |
| Roster / depth | `PhoneRosterPage`; depth chart Segments + option/picker sheets | RosterView.jsx, DepthChart.jsx |
| Scouting | compact Hero; Segments **HQ · Board · Scouts** (Combine leads in combine week); ⋯ sheet for Your list / Mock / Combine | ScoutingUI.jsx `ScoutingPage` |
| Scouts + Regions | **merged** into `PhoneScouts` (scout rows → card sheet, Swap/Let go two-tap; "Scouts for hire" sheet; then `RegionsView`) | ScoutingUI.jsx |
| Prospect page | `PhoneProspectPage` (full screen; tabs Report/Tools/Testing; Testing shows Combine **and** Pro Day with per-position ranks; Free workout + Interview buttons in combine week) | ScoutingUI.jsx |
| Board rows | `PhoneProspect` (OVR + POT always shown; Draft → Confirm two-tap) | ScoutingUI.jsx |
| Combine | phone branch of `CombineView` (points tiles, stock up/down, rows sorted by one test, sort sheet) | ScoutingUI.jsx |
| Mock draft / Your list | phone branches of `MockDraft`, `YourList` | ScoutingUI.jsx |
| Draft room | `PhoneClock` (sticky), `PhoneDraftButtons`, `PhoneLastPick` → `PhoneDraftLog` sheet, `PhoneTradeUp` sheet, `PhoneTradeDown` sheet, `PhoneCall` (inline card) | DraftDay.jsx; mounted in App.jsx draft section |
| Draft recap | `PhoneRecap` (class grade hero, your picks, league grades sheet) in ScoutingUI `DraftGrades`; full recap `PhoneRecap` in DraftRecap.jsx |
| Free agency | `PhoneFA` (+ `YourOffers` list: lead/behind vs top rival bid); phase-aware hero label | FreeAgency.jsx |
| Trade | phone pick screen + `PhoneSide` + pinned deal tray; tiles say BUYING/SELLING | TradeScreen.jsx |
| Front Office | hero + `PhoneContracts` | CapOverview.jsx, PhoneContracts.jsx |
| Coaching | `PhoneCoaching` | PhoneCoaching.jsx |
| Schedule / standings | `PhoneSchedule` (holiday + forecast tags), `PhoneStandings` | SchedulePage.jsx, PhoneStandings.jsx |
| Stats / League / Legacy / Saves / Game Updates | `PhoneStats`, `PhoneLeague`, TrophyRoom phone hero, `PhoneSaves`, GameInfo hero | respective files |
| Training camp | `PhoneCamp` | TrainingCamp.jsx |
| Game plan | phone strip rows + sheets; `GamePlanCard mobile` flat sheet layout | GamePlan.jsx, GamePlanCard.jsx |
| Dev focus | phone `FocusSlot` rows; `Picker` is portaled full screen with a sort Segments | DevFocus.jsx |
| Nav / More | `MobileNav` (icons), grouped `MoreSheet`, `MobileActionBar` (two-tap confirm on Sim to Deadline / Sim All) | MobileShell.jsx |
| New game | AFC/NFC Segments on team select (`pickConf`, session-only) | App.jsx |

Phone-only behaviours worth knowing:
- No "What's at stake" panel/line, no LET'S GO popup, no injury report popup (the Injuries tile
  and Home to-dos carry it), no live-game win probability.
- Start Season only lives on Home's action bar. The action bar shows on Home and the draft only.
- `Spotlight.jsx` (draft pick reveal, awards, records, Canton): on phones the page behind is
  locked, the details scroll inside, the buttons are pinned above the browser bar.
- Popups that used to be trapped inside a sheet's transform are portaled to `document.body`:
  dev focus `Picker`, `Negotiate`, `PhoneProspectPage`, `IncomingCall`. **Any new full-screen
  overlay must portal**, or a sheet's animation will pin it inside the sheet.
- Holiday games and rain/snow/wind/frigid forecasts show on the Home hero and the schedule.

## 4. Desktop

### 4.1 Top bar (navigation "B")
- Left: logo + a button (`data-tour="phases"`) with team name and "2-2 · Week 5 ▾". It opens a
  dropdown with the whole season (18 week boxes W/L/BYE, next ringed, the off-season stages,
  links to Schedule/Standings). The old two-row phase strip under the bar is gone.
- Middle: six sections from `DESK` in App.jsx: **Home · Team (Depth Chart, Roster, Coaching) ·
  Season (Schedule, Standings, Playoffs, Stats) · Draft (Scouting, Draft, Draft Recap) · Trades &
  FA (Trade, Free Agency) · Front Office (Front Office, League, Franchise History, Record Book,
  League History, Transactions, Legacy Hall)**. `deskOf(tab)` finds a tab's section;
  `deskEntry(d)` picks where a section opens (Draft opens the draft room during the draft;
  Trades & FA opens Free Agency during re-sign/FA).
- Right: a Search field (`.hdr-search`, icon only under 1400px; / or Ctrl+K), the Trade Deadline /
  Free Agency pills (§4.4), phase buttons (Play / quiet Sim Week / ⏩ menu, or Finish… in the
  off-season) and one ⋯ menu (Save at its top; the 🔍 💾 🎓 buttons are gone).
- Game Updates keeps its own second row (patch notes / Timeline); the League screens are Front
  Office tabs now. Screens outside the six sections: Saves and Game Updates (⋯ menu),
  Trade Deadline Day (Home banner), live game (Play).

### 4.2 Home (layout "1 · Broadcast") — `src/DeskHome.jsx`
- Game weeks: the promo (both clubs' colors, each club's star = `featuredPlayer` = best healthy
  non-OL/K/P, with name, position, OVR and `headline()` season line; **home star is not
  mirrored**), eyebrow (week, prime slot, division, rivalry, kickoff), tags (holiday, spread,
  weather), Play/Sim right on it. Under it three cards: **To do** (top 3, See all → Inbox,
  Development focus → sheet), **Game plan** (`GamePlanCard bare`: offense/defense grades, scout
  note, Change/Week prep), **Top story**.
- No game (bye week, off-season, season over): `PhaseHero` (team colors + watermark, phase title,
  record / cap / roster / injured, the phase's buttons), middle card = **Biggest needs**, and in
  combine/re-sign/FA/draft the **Build your 53** checklist underneath.
- The FranchiseStrip (four stat tiles) no longer renders on desktop; the old desktop Home board,
  MatchupStakes box, week strip and fit-to-window logic were deleted from HomeScreen.jsx.
- Sheets opened from anywhere: App dispatches `window` event `gm:home` with detail `"dev"` or
  `"injuries"`; DeskHome (`window.__gmDeskHome`) and PhoneHome (`window.__gmPhoneHome`) listen. If
  neither is mounted, the to-do falls back (scroll to dev focus / Schedule injury report).

### 4.3 Section headers — `SectionHero` in DeskHome.jsx
Every desktop section except Home opens on a header in Home's style: club colors and faint mark,
the section name in block letters, a few numbers (Team: record/roster/injured/staff points;
Season: record/points for/against; Draft: your picks/scouting points; Trades & FA: cap/roster and
the deadline/FA status; Front Office: cap/expiring), and the section's screens as tabs. The stats
are built in App.jsx next to the `SectionHero` mount. Titles that repeated it were removed (Front
Office title, "2026 Schedule", "2027 Draft Class" + points box).

### 4.4 Declutter passes (per screen)
- Draft room: header no longer repeats Resume / Sim to my pick on the draft tab; the stage's four
  buttons share one calm style (only Sim to my pick is green); Big Board rows show Draft only when
  it's your pick.
- Coaching: Upgrade/Extend are quiet buttons; coordinator XP is a thin bar on each coach's card
  (the separate XP panel is gone); section titles are plain.
- League: the duplicate left sidebar was removed (the tabs above cover it).
- Front Office: Cap space / Next season's room tiles removed (the long view shows them), the
  remaining tiles compact, Cap Advisor shows 3 tips + "N more suggestions".
- Trade: tiles without borders, tinted for buyers/sellers, muted cap number; **bug fixed**: neutral
  clubs no longer read SELLING (only `buyer`/`seller` modes get a label). Buy/sell modes are by
  record from week 4 to the deadline (`_aiTradeMode` in App.jsx).
- Free agency rows: quiet outline Negotiate. Scouting points badge smaller and calm.
- Soft cards: `panel`/`head` in ScoutingUI.jsx, `card`/`head` in CapOverview.jsx (and its long-view
  year cards), `panel` in SchedulePage.jsx now use the soft card and white titles.
- Roster / Coaching / Free Agency: titles the section header already shows are gone; Coaching is
  soft cards (coach cards, locker room, league staffs, available coaches as rows in one card).
  Roster sub-tabs (Roster / Practice squad / IR) are white-selected chips; the table is one soft
  card with plain group headings ("Quarterbacks") and a soft side card (`RosterView.jsx`).
- Legacy Hall (`TrophyRoom.jsx`, `LegacyHall.jsx`): on desktop the duplicate title row and the six
  stat boxes are replaced by the section chips plus a one-line tally ("4 Super Bowls · 1 MVP").
  Headings plain white (`H`, `Shelf`), rafters walls without borders, record cards soft with a
  quiet "★ Yours", Ring of Honor candidates in soft rows, Gazette years plain.
- Depth Chart (`DepthChart.jsx`): **bug fixed**: the Field/List toggle was pulled up with a
  negative margin and slid under the section header; it's now passed in as `viewToggle` and sits
  on the side-chip row beside "Auto-fill by overall". Side switch is `Chips`, personnel/package
  buttons are quiet pills, the right panel is a soft "Who plays" card. List view: soft position
  cards, plain group titles, soft depth warnings.
- Game plan (`GamePlan.jsx`): the desktop strip is now the same quiet rows as the phone (Offense /
  Defense / Personnel / Coaching specialties) that open their part in a `Sheet`; the old inline
  strip and its `tab()` toggles were removed. Cards/heads are soft and sentence case, also in
  `Personnel.jsx`.
- `GamePlanCard.jsx`: the scouting report block and the full card are soft; headings plain;
  Week prep / Change are quiet pills.
- Stats (`StatsScreen.jsx`): scope and table chips white-selected; leader boards show the top 3
  (was 5) in soft cards with plain titles; the table is a soft card (sticky column `#141820`
  matches the card over `C.bg`); award races and personnel tables soft.
- Standings / Playoffs / Playoff race: soft division cards with plain "AFC East" titles; the
  playoff picture's duplicate title removed; "In the hunt" in sentence case.
- League hub: second tab row (League / Franchise History / Record Book / League History /
  Transactions) is white-selected chips; each of those screens drops its own big title on desktop
  (phones keep it), and their cards/headings are soft and sentence case (`FranchiseHistory.jsx`,
  `RecordBook.jsx`, `LeagueHistory.jsx`, `TransactionsWire.jsx`, `LeagueView.jsx`).
- Inner tab rows without emoji, as white-selected chips: Scouting (HQ / Big Board / ...), Trade
  (Make a trade / Trade finder / Trade block / 3-way trade), Front Office (Overview / Contracts /
  How the cap works), Schedule (team / league). Scouting HQ, Cap overview, Trade ("Targets for your
  needs", "Draft picks") and Draft Recap ("Your class", "Every pick", ...) headings are plain white.
  `scripts/smoke.mjs` accepts either case for the Draft Recap heading.
- Draft room (checked with the draft-day save): Big Board / Mock Draft are white-selected chips,
  your-pick chips are borderless, "Up next" and the board heading are plain white, and
  `chipBtn` in ScoutingUI.jsx (Consensus / Your scouts and the other small toggles) is a quiet pill.
  Free agency's "Day N of 4" banner is a soft card.
- Scouting HQ pick tiles (`PickCabinet` in ScoutingUI.jsx) shrank from big boxes to one row of
  small pills ("R1 #16 #12–26"; the first pick tinted gold, the scouting range on hover too).
  `ScoutButton` is a quiet pill everywhere ("Scout · 1" / "Workup · 2"); the HQ's Regions, Manage,
  Big Board and Your list links are quiet pills.
- Re-sign week (`Resign.jsx`, checked with a re-sign save): one line for cap space and progress
  (on desktop the section header says "Re-sign week"; phones keep the title), one short
  explanation with the tag/option rules folded into a "Tag and fifth-year option" toggle, the
  table / phone cards soft, Tag and Option as tinted pills, Negotiate as the same quiet green
  outline as free agency. The free agency "More" drawer is a soft card. The `mkdraft` audit
  scenario now also dumps `save-resign.txt` (set `STOP=1` to stop there); `rsshot` screenshots it.
- Franchise tag is only offered on your top three unsigned expiring players (by OVR) in Re-sign week.
- Regions (desktop, `RegionsView`): organized by scout now. One card per scout (face, major/minor,
  what he knows, stars, "n of cap regions") with a picker per region slot; each option says what
  the region is deep at, "✓ match" and who has it now. Picking swaps that slot (frees the old
  region, then assigns the new one). Uncovered regions show as one yellow line. The map column is
  narrower, desktop dots are smaller (r 4.5) and the map's scout legend is phone-only; the whole
  screen fits a 900px-tall window. Phones keep the region rows and sheet. The smoke test frees the
  slot holding the SEC (`button[aria-label*=": region "]`).
- Navigation: the League screens (League, Franchise History, Record Book, League History,
  Transactions) and the Legacy Hall moved from Season to **Front Office** (owner's call; briefly a
  seventh "League" section, then moved). They're tabs on the Front Office header; the old hub chip
  row is gone on desktop (only Game Updates keeps a second row). Season is Schedule, Standings,
  Playoffs, Stats.
- Top bar (desktop): Search is a field in the bar (icon only under 1400px wide; still / or Ctrl+K)
  and no longer in the ⋯ menu. Deadline week (`wk === TRADE_DEADLINE_WEEK`) adds a red "Trade
  Deadline" pill (opens Deadline Day, or Trade if the day hasn't been set up); free agency adds a
  blue "Free Agency" pill. The Expansion button is gone (it was the only way into that feature).
- Home: Top story puts the club logo beside the headline and strips a leading emoji; every
  "Biggest needs" row has a reason (needs.js falls back to "<starter> rated N").
- The picks strip (`PickCabinet`) also leads the Big Board and the Combine; the Big Board's info
  line dropped its plain "Your picks" list. Combine headings are plain ("Stock up", ...).
- Position moves: edge rusher <-> defensive tackle (`moveDL` in positions.js) via the player
  card's "Move to". It changes his Madden spot (mpos) and re-rates him with `dlOvrAt`, the same
  out-of-position fit the depth chart uses; moving back restores the exact rating, and an edge who
  came from linebacker keeps that way back (`posFrom.prev`). Tests in tests/positions.test.js.
- The desktop kickoff preview popup at Start Season ("The 2026 season ... LET'S GO") was removed
  at the owner's request (it was already off on phones).

### 4.5 Walkthrough
`tourSteps(mobile)` in Walkthrough.jsx has a desktop branch rewritten for the new layout (targets
`promo`, `todo`, `actions`, `phases`, `nav`). Mobile steps unchanged.

### 4.6 Whole-game sweep (popups and the remaining screens)
- `Sheet` (ui.jsx) is a centered dialog on a computer (560px, `wide` for 820px) and stays a
  bottom sheet on phones; `onClose` is optional (no ✕ or tap-out when a choice is required) and
  `z` sets its layer. New `Dialog({ title, sub, onClose, actions, wide, z })`, `DBtn({ kind:
  primary|danger|gold|quiet })` and `softBox` give every decision the same look.
- App.jsx popups moved onto Dialog with their logic unchanged: training-camp skip, move-on
  confirm, coach extension, cut (dead money) and restructure, suspension, retirement talks,
  rehab plan, bidding war, coordinator offer, pick trade, fired / job offers, coaching openings,
  report card, leaderboard, documentary, dynasty report, ownership offer, pro day, spectator box
  score, practice and injury reports, season champions, the intro. Themed ones kept on purpose:
  the Gazette, the share card, the live-game final (softened frame) and the season recap card
  (team-color header, no colored border). Media day, the parade, the locker-room speech and the
  second compare popup were unreachable (nothing opens them); the next pass removed them.
- Desktop no longer pops the weekly injury card (Home's injury sheet and the rehab to-do carry
  it; the rehab to-do is switched back on for both builds) and uses the calm result card after
  a sim (`PhoneCard` in WeekResult.jsx, 400px, a ✕ instead of the grip).
- Restyled: Training Camp (soft panels, pill buttons, the SP box dropped: the Team header shows
  it), Saves (slots first, then device transfer, offline play, the cap glossary folded), GM
  career (earned achievements only, "Show locked" toggle), Inbox (a tone dot instead of colored
  edges, quiet buttons), Week prep, Deadline Day panels (the live clock header kept), trade
  finder / block / 3-way, the contracts table (quiet Extend and "Restructure +$X"), Negotiate
  (since rebuilt, §7.2),
  Game Updates, the player card back's section titles, the ⋯ menu group labels, the title
  screen (Continue is the green button when a save exists).
- The smoke test and the audit dismiss list also click "Let him go" (the coordinator dialog).

### 4.7 Last old-style pass (scripted, then checked on screen)
- Caps headings with wide letter spacing became sentence case across 26 files (about 60), plus
  an explicit list of caps headings with emoji in front (War room, Market rates, Owner goal,
  Drive log, Player comparison, College stock watch...). Kept on purpose: the header stat
  captions (RECORD, POINTS, TEAM OVR under the big numbers), badges with their own fill
  (BREAKING, BYE), short tags and column heads, the title screen, the draft clock, and the
  themed screens (awards, moments, Super Bowl, newspapers, the card front).
- Slate `${C.bd}` borders became a faint `#ffffff10` hairline; about 60 static bright frames
  became a faint tint of their color (selection borders and accent edges untouched).
- Playoff bracket: soft game boxes (your game outlined green), plain round titles. Live game:
  plain Run / Pass labels, sentence-case card titles and control labels. Scouting checkpoint
  popup in the dialog style.
- **Bugs fixed:** two trade-deadline banners assumed week 10; the deadline is after week 9
  (`TRADE_DEADLINE_WEEK`). The countdown and "deadline passed" banners now use the constant,
  and the purple "trade deadline surge" banner is folded into the one countdown.
- Removed four popups nothing could open (media day, the parade, the locker-room speech, a
  second player comparison) and a switched-off Hall of Fame card; their state stays.
- Live field (`LiveField.jsx`): the yard numbers sat at the sideline edge and a holiday frame
  covered them; they're set in from both sidelines now (`y={H-40}` and `y={54}`, the far ones
  rotated). The bye-week Home screen (`PhaseHero`) was praised by the owner as the bar for others.

## 5. Features added along the way
- Free agency **Your offers** list (`YourOffers` in FreeAgency.jsx): each of your bids vs the top
  rival's, lead/behind, decide day.
- **Combine ranks**: `combineRank(cls, p, t, res)` and `rankColor` in `src/scouting.js`; each
  testing number shows "(4 of 16)" against his position group in the class (Combine or pro day),
  green→red. Both the Combine and the Pro Day are shown when he has both. Test:
  `tests/combineRank.test.js`.
- **Region colors**: `REGION_CLR` in ScoutingUI.jsx (one color per region: SEC, Big Ten, ACC,
  Big 12, Group of Five, Pac-12 & MW); the map, legend and rows use them (desktop and phone).
- To-do "Send your scouts to their regions" opens Regions directly (window event `gm:scouting`
  with the view name; `ScoutingPage` listens).

## 6. Links and to-dos
Every `it.push({key:...})` item in App.jsx was audited: all targets exist. The ones changed:
`devfocus` and `injuries` (open Home sheets via `gm:home`, with fallbacks), `scoutAreas` (Regions
via `gm:scouting`). DeskHome's "See all" calls `onNav("inbox")`.

## 7. Game systems (realism rounds)

### 7.1 Safeties: free (FS) and strong (SS) roles (`roles.js`, like SAM/MIKE/WILL and CB1/CB2/NB)
- FS score: range .25, coverage .2, ball-hawking .15, speed .15, communication .1, jumping,
  versatility, tackling .05 each. SS score: run support .25, tackling .2, coverage .15, size
  (`sSize`, weight around 205 lb) .1, strength .1, blitzing .1, versatility and communication .05.
- Natural role: Madden's `mpos` (77 FS, 78 SS in the 2027 data); generated safeties (no mpos)
  by whichever role they stand out at. BASE / CENTER are medians over the real safeties; a move
  costs 2 (safeties swap more freely than corners). At his natural role a player is his OVR; at
  the other he's re-rated on that role's skills and never above his OVR. Real checks: Kyle
  Hamilton 94 SS / 84 FS, Derwin James 93 / 84, Jessie Bates 94 FS / 92 SS, Julian Love 86 FS /
  78 SS; the Ravens line up Starks FS + Hamilton SS, the Lions Joseph FS + Branch SS.
- Everything that uses roles picks it up: depth slots read FS / SS (was S1 / S2), game sim
  ratings at the slot, injury replacements, off-season role growth (`ROLE_SKILLS`), role
  needs, the FS / SS role tag, "S · Free" and "S · Strong" filters, market pay (equal).
- A corner moved to safety becomes an FS or an SS by his translated skills (positions.js).
- Draft: a real FS/SS prospect's generated skills lean to his label (`shapeSafety` in roles.js,
  run in `genRealDC` after `genPAttrs`); older saves' draft classes are shaped once on load
  (`shapeDCSafeties`, gated by the save's `sfv:1`). Generated prospects get their role from skills.
  `shapeSafety` leans skills up to 30 points (12 missed about 3 in 1000 prospects); every real
  labelled prospect now matches (test in roles.test.js).
- Field spots: on the depth chart the FS is deep in the middle and the SS rolled down on the
  strong side; on the live field the SAM now lines up on the tight end's side (it was on the
  other) with the SS beside him and the FS deep. Tests in tests/roles.test.js.

### 7.2 Contracts and the negotiation table
- **Asking prices** (`askingPrice`, offseason.js) follow the real market by league rank: `MARKET`
  matches each position's 2026 ratings at ranks 1/3/5/10/20/32/50/64/96/128 to 2025 average salaries
  at those ranks (OverTheCap, as shares of the $279.2M 2025 cap), interpolated (`marketShare`),
  times the cap of the deal's league year. EDGE and DT have their own tables (`naturalDL`). Before,
  a single logistic curve paid the top right but the middle far too little (a top-10 WR asked $22M,
  real ~$28M) and LT/guards/LB/TE too much at the top. Age discount starts 4 years later for QBs and
  6 for K/P; `careerAge` does the same for deal length (`faYears`, `maxYears`). AI re-signs use
  `faYears` (stars in their prime get 4-5 years). `marketLadder(p)` lists the league's salaries at
  his market for the negotiation table.
- **Franchise tag** groups positions like the real one (`tagGroup`: every OL together, K+P, EDGE vs
  DT); the floor is an 82-rated player's ask (an 86 put the QB tag at $51M vs the real ~$43M).
- **Rookie scale** (`rookieSalary`) matches the 2025 class: 4.37% of the cap at #1, 1.22% at #32,
  0.93-0.68% in round 2, from 0.57% at #65 to the minimum.
- Health run (6 seasons, `SEASONS=6 node scripts/health.mjs`): AI payrolls 93-97% of the cap from
  year 4 (the old curve: 86-97%), nobody over, top-5 shares QB 17%, EDGE/DL 14%, CB 9%, LT 8.5%.
  The "USER vs MATCHED" warning is the same on the old code. health.mjs now finds chromium-linux64.
- Save fields: `talks[k].log` (the thread) is saved with `talks`. Load-time migrations keyed by
  save flags in `fullSaveData`: `capv:2` (salaries to real dollars, `migrateCap`), `sfv:1` (draft
  safeties shaped once, `shapeDCSafeties`). Add a new flag the same way for any one-time reshape,
  or the smoke test's "reload + Continue changed" check fails.
- **Negotiate.jsx** rebuilt: desktop two columns (left: his agent's thread, what he wants with your
  fit on each, the position's market ladder with your offer in it; right: length chips that show
  each length's ask, the offer with % of cap and total, bonus/void/incentive, cap room by year).
  Phone: one column, offer first. Patience shows as three bars (offers left). The thread comes from
  `talks[k].log` (App `talkLog`, last 8 offers and answers). Offer logic unchanged (hidden minimum
  86-98% of the ask, fit pull, rivals, three tries). Checked with the re-sign save (`negshot`).

### 7.3 Head coaches retire at the end of their contract
- carousel.js: every head coach has an exit age (`hcRetireAge`, 64-72 from a hash of his name;
  `HC_EXIT` sets the veterans: John Harbaugh 73 so he coaches the Giants through 2035, Andy Reid
  71, Sean Payton and Mike McCarthy 68; the owner asked for Harbaugh ~2035). His contract now
  counts down each off-season (it never did); when it ends he retires if he's reached that age
  (`hcRetiring`), otherwise he re-signs for 2-4 years, never past it (AI clubs and yours). He no
  longer retires at random mid-deal (coordinators still do). The off-season he first knows, a
  `lastDeal` move goes on the wire and you get a toast; `coach.hc.lastSeason` keeps it to once.
- App: `hcLeaving(c)` is the notice on the Coaching page (desktop and phone), in the extend dialog
  and as a Home inbox item in his last two seasons (dismissible). `hcExtMax` caps extensions short
  of his exit age; 0 shows "Retiring" instead of Extend, and `extendCoach` refuses it too.
- The carousel runs in `newSeason` (after the draft), so in re-sign/FA/draft `yr` is still the
  finished season and a coach whose deal is up reads "is retiring". Real coaches' starting contract
  lengths are random per game (`realStaff`), so Reid may finish a deal to 2030 before he goes.
- Tests: tests/carousel.test.js (retire at contract end, announce once, renewals stop short).

### 7.4 Holiday game popups (Atmosphere.jsx)
- `HolidayIntro` is a title card (one floating piece, the
  name in Oswald, both clubs in their own color washes, "Tap for kickoff"); `HolidayResult` is a
  `Spotlight` stage: the player of the game in uniform (`pog.p`, found on your roster by name),
  the holiday sky as `backdrop`, the score as the faint background number, a holiday piece as `art`
  when there is no player. Spotlight gained `backdrop` and `art` props.
- Checked in a scratch harness (`_hol.html` + `_hol.jsx` + `_holshot.mjs`, git-ignored): Vite dev
  server at `/gridiron-gm/_hol.html?h=<holiday>&k=intro|result&w=0|1&nop=1`, every holiday on
  desktop and phone, because a holiday game is hard to reach in play.

## 8. The trade market (`src/trade.js`)
Recalibrated against real deadline deals; `tests/tradeMarket.test.js` pins ten of them (each must
go through at about its real price, and a clearly smaller offer must be refused):
Montez Sweat (2023, 2nd), Roquan Smith (2022, 2nd+5th), Jaelan Phillips (2025, 3rd), Jakobi Meyers
(2025, 4th+6th), Amari Cooper (2024, 3rd), Davante Adams (2024, 3rd→2nd), Za'Darius Smith (2024,
5th), DeAndre Hopkins (2024, 5th→4th), Christian McCaffrey (2022, 2nd+3rd+4th+5th), T.J. Hockenson
(2022, 2nd+3rd).

What changed and why:
- `ageMult`: falls off fast after 29 (29 .8, 30 .62, 31 .42, 32 .28, 33 .2, 34+ .16; young bonus
  23 1.25, ≤25 1.15). QBs still age 4 years slower.
- `POS_MULT.RB` 0.6 → 0.52.
- **Rentals:** in season, *any* expiring deal sells for `RENTAL` 0.48 of value (0.40 =
  `RENTAL_GONE` if his club won't keep him, `keepChance` < .5). Before, only 29+ vets his club
  wouldn't keep were discounted, which priced Sweat/Roquan/Phillips at a 1st. `fitFor` applies the
  same when *you* send an expiring player (contenders 0.75).
- **`contractMult(p)`**: salary vs `askingPrice(p)` with years left (0.6–1.15); applied **when a
  trade is weighed** (in `evaluateTrade`), never in `playerValue`/`tradeVal`, because it reads
  this year's cap and a saved value must not change on reload (that broke the smoke test once).
- **`PICK_SCALE` 1.35** in `pickValue`: picks count 1.35x against players (pick-for-pick draft-day
  math in `draftTrade.js` uses its own chart and is unaffected).
- Asking premiums: base 1.1 → 1.05; star (tradeVal ≥ 150) 1.25 → 1.15; contender's starter
  1.2 → 1.15. Franchise QB (1.35) and face of the franchise (1.7) unchanged.
- `tests/trade.test.js`: "a late 2nd isn't enough" for an 82 WR was the behaviour the owner asked
  to change; it now asserts a late 2nd gets him and a 4th doesn't.

Value reference after the change: 1st #16 ≈ 126, 2nd #48 ≈ 48, 3rd #80 ≈ 24, 4th #112 ≈ 14;
QB 90/28 ≈ 207, WR 90/26 ≈ 110, WR 82/27 ≈ 43, DL 85/29 ≈ 53, CB 78/25 ≈ 25, LB 75/30 ≈ 6.

Not yet done on trades: AI-to-AI trades (`aiTrades.js`) and AI offers (`tradeOffers.js`) use
`tradeVal` directly, so they don't see `contractMult`; worth a look if AI deals feel off.

## 9. Checks and tools

Before every push: `npm run lint` (0 errors; 15 warnings are pre-existing), `npm test`,
`npm run build`, `npm run smoke` (17 steps; now clicks the six desktop sections — see the tab list
in `scripts/smoke.mjs`). `tests/saveCoverage.test.js` requires new App state to be saved or listed
in `SESSION_ONLY` (`pickConf`, `dlOpen`, `seasonOpen` were added).

Screenshots / play-testing (local only, git-ignored, not in the repo): `_audit.mjs`, `_audit2.mjs`,
`_audit3.mjs` in the repo root drive the built app with Playwright
(`executablePath: /opt/pw-browsers/chromium`; 390x844@2x phone, or `DESK=1` 1440x900, `VH=` height).
Run as `ONLY=<scenario> node _audit3.mjs <outdir> <tag>`; `SAVE=<file>` loads a dumped autosave and
presses Continue; `SIMWK=n` sims n weeks first. Useful scenarios: `mkdraft` (sims to FA and the
draft and dumps `save-fa.txt` / `save-draft.txt`), `dr` (plays a draft), `tour` (every phone screen
and tab), `dtour` (every desktop section and tab), `navb` (desktop sections, season dropdown, ⋯
menu), `todoall` (clicks every Home to-do), `sweep` (taps up to 30 buttons per screen and checks
for crashes, sideways scroll, stuck close buttons), `rsshot` (re-sign week, with the re-sign save),
`negshot` (opens Negotiate from re-sign week; `NTH=` which player, `LOW=` how many "Less" taps
before offering, to see counters), `coachshot` (Coaching page; on a phone it opens the HC sheet).
Saves dumped by `mkdraft` live in the scratchpad (`save-fa.txt`, `save-draft.txt`,
`save-resign.txt`); they're not in the repo. `_bench*.mjs` (git-ignored) print asking prices,
tags and payroll totals for the opening league. If these scripts are gone, recreate the idea:
build, `vite preview`, Playwright, screenshot, look.

Long run: `SEASONS=6 node scripts/health.mjs` (about 15 minutes, needs a fresh `npm run build`;
don't rebuild while it runs) plays seasons in the browser and prints league numbers (payroll % of
cap, top-5 salaries, ratings, roster health) against `balanceWatch.js` bands. To compare with older
code: `git worktree add <dir> HEAD`, symlink node_modules, build and run it there.

Gotchas: the mobile action bar's Sim All / Sim to Deadline need a second tap ("Tap again..."); a
new phone game taps NFC before picking the Giants; `sleep` in the shell is blocked — use
background commands with `until` loops.

## 10. Deploying
`.github/workflows/deploy-pages.yml` builds with `npm run build:pages:all` and deploys **only from
`main` or `claude/scouting-overhaul`**. After verifying: push the work branch, then
`git push origin HEAD:claude/scouting-overhaul` (fast-forward). Live:
https://evandamours.github.io/27_Gridiron_GM/ and `/mobile/`. Confirm by fetching the live
`assets/index-*.js` and grepping for a string from the change (code comments are stripped, use UI
text). gh-pages / `scripts/publish-pages.sh` is **not** the live source.

## 11. Known gaps / next steps
- Desktop is through every section in the calm style. Still in the older look, by choice or not
  yet reached: the player card itself (a trading-card design, deliberately kept), ceremony screens
  (Season Awards, Moments, Rafters night, documentary), small caps eyebrows inside cards (League
  History plaques, transaction kinds), the Walkthrough eyebrow and the Offline panel.
- AI-to-AI trades ignore `contractMult` (see §8).
- The 15 lint warnings are old `react-hooks/exhaustive-deps` warnings in App.jsx.
- Contracts: the top-5 WR share settles near 10% of the cap (real 12.7%); elite WR asks match the
  real market, so it was left. The health run's "USER vs MATCHED" warning (the scripted user club
  wins ~25% less) predates this session's contract work.
- Head coaches: only `HC_EXIT` coaches have hand-set exit ages; other real veterans (Jim Harbaugh,
  Todd Bowles, Todd Monken) use the hash (64-72), which lands in the mid-2030s.
