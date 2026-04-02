# Latest Handoff

Last updated: 2026-04-01 (session — v38.1)

Session Intent: Fix cap space starting over cap, position skill labels showing camelCase, stat tables, live sim forcing page scroll. Added: password gate and website vault.

## Where We Left Off (Session v38.1)
- Shipped: 6 fixes across 3 groups — gameplay bugs (cap space, live sim scroll), UI polish (position skill labels, stat tables), infrastructure (password gate, website vault, .gitignore)
- Tests: N/A — no test suite
- Deploy: deployed to GitHub Pages (both repos) · auto-deploy active · website also pushed

---

## What was completed this session (v37.1 → v38.1)

### Bug fix: Starting cap space $50M over ceiling

`genPlayer` salary was `Math.round((ovr/99)*Rf(2,18)*100)/100` — a 43-player roster averaged ~$312M against a $200M cap. Changed multiplier to `Rf(1,9)`: average roster now lands ~$165M, safely between the $150M floor and $200M ceiling.

### Bug fix: Live sim scroll hijacking page

`useEffect` on `[liveLog]` called `logEndRef.current.scrollIntoView({behavior:"smooth"})` — this scrolled the entire page down to the play-by-play log on every new play. Fixed to scroll only within the log container: `container.scrollTop = container.scrollHeight`.

### UI: Position skill labels

QB `posAttrs` array had both `armStr` and `throwPow` (redundant). Removed `throwPow`. Added `PA_LABELS` constant mapping all 50+ camelCase position skill keys to readable labels (e.g. `pocketAwr` → `"Pocket"`, `readDef` → `"Read Def"`). Display changed from `k.slice(0,8)` to `PA_LABELS[k]||k`.

### UI: Stat table improvements

Season and career stat grid cells: `minmax(44px,1fr)` → `52px`, padding `2px` → `4px 3px`, value font `13` → `14`. Zero-value stats now filtered from season stats display. Labels get `letterSpacing:.3` for readability.

### Infrastructure: Password gate

Both `gridiron-gm/index.html` and `gridiron-gm-play/index.html` now show a full-screen lock screen on load. Password: `vsgm2026`. Correct entry sets `sessionStorage['gm_preview']='1'` and hides the gate. Styled dark/on-brand. Enter key supported.

### Infrastructure: Website vault

`vaultsparkstudios.github.io`:
- `games/gridiron-gm/index.html` — status badge → "Vaulted" (`status-stub`), removed Play Now CTA, hero/feature buttons → Join The Vault, status row → "Vaulted — Returning Soon", demo placeholder → "Currently Vaulted"
- `games/index.html` — game card `data-status` → `vaulted`, badge → "Vaulted", "Play Now" → "Get Early Access"
- `studio-hub/src/data/studioRegistry.js` — `status: "vaulted"`, `statusLabel: "Vaulted"`
- `context/PROJECT_STATUS.json` — `status: "vaulted"`, `health: "yellow"`

### Infrastructure: .gitignore

Added `Vaulted-PW.txt` and `context/.session-lock` to `.gitignore`.

---

## What is mid-flight

Nothing blocking. All pushed and clean.

---

## ⚠️ Human Action Required

| # | Action | Where | Why blocked |
|---|--------|--------|-------------|
| 1 | **Wire Stripe Live** | `.env.local` + GitHub Secrets | Set `VITE_STRIPE_PAYMENT_LINK`; scaffold is live |
| 2 | **Publish itch.io + Reddit** | itch.io / Reddit | Copy ready in docs/; game is vaulted — do after re-release |
| 3 | **Deploy Claude Proxy Worker** | Cloudflare | Set `VITE_CLAUDE_PROXY_URL` |
| 4 | **Supabase Global LB setup** | Supabase dashboard | Create leaderboard table, set env vars |
| 5 | **Re-open public access** | Remove password gate from both index.html files | Once bugs are resolved and build is polished |

---

## What to do next

1. **Continue bug sweep** — now that the game is vaulted, run through all major gameplay flows (new game, full season, draft, playoffs) and log every glitch
2. **[SIL] Dev mode bypass** — add hidden keycode to skip gate for dev testing
3. **[SIL] Stat section grouping** — group player modal stats by phase
4. **[SIL] startGame reset manifest** — 15-min task, long overdue
5. **Re-release** — remove gate, update website back to "Live", announce on itch.io + Reddit

---

## Session score

**Productivity: 9/10** — 6 concrete fixes shipped across gameplay, UI, and infrastructure in a single session. All committed and pushed clean. Website fully updated to reflect vaulted state.
