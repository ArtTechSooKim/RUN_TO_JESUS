# RUN TO JESUS — Project Summary (for AI assistants)

This file is a self-contained snapshot for any AI tool picking up this codebase without prior context. It reflects the actual current implementation, not the original planning doc (`RUN_TO_JESUS_앱_개발문서.md`, which is outdated — see its own warnings about superseded content).

## What this is

An Expo/React Native event app for **2026 청년연합수련회** (a youth conference, ~300 participants, **24 fixed teams**), event date **2026-07-25**. Teams explore physical "stations" (rooms/games) at the venue, tag an NFC tag or scan a QR code at each to collect letter-fragments that spell "RUN TO JESUS," and see a final animated reveal once all 10 letters are collected. There's also an admin console for staff and a standalone broadcast page for a lobby screen.

## Stack

- **Frontend**: Expo (SDK 57) + Expo Router, TypeScript, `react-native-reanimated` for animation. Runs as a web export (no native build in active use) — see `AGENTS.md`: Expo has changed significantly, check versioned docs before assuming API shape.
- **Backend**: Express (`server/index.js`, `server/routes.js`) + MySQL (`server/db.js`, `mysql2/promise`). One Express process serves BOTH the static Expo web export (`dist/`) and `/api/*` routes, with an SPA fallback for client-side routing.
- **Hosting**: Railway, single service `run-to-jesus` (+ a separate `MySQL-3uIX` database service, referenced via `DATABASE_URL`).
- **No local backend exists.** `src/lib/api.ts`'s `API_BASE_URL` is always the absolute production Railway URL. Running the Expo dev server locally still talks to the real production database — any local testing writes real rows. Always clean up test data (tag_events/game_sessions) after manual verification.

## ⚠️ Critical deploy gotcha

**`git push` does NOT deploy this app.** This Railway service has never been connected to GitHub — every deployment in its history was triggered by the `railway` CLI (`cliCaller: claude_code` in `railway deployment list --json`). After pushing to `main`, you must ALSO run:
```
railway up --service run-to-jesus --detach
```
from the repo root, then poll `railway deployment list --service run-to-jesus --json` (first entry) until `status` is `SUCCESS` — builds take ~2-3 min (full `npx expo export -p web` each time). Forgetting this step means production silently keeps serving the old build while you believe you shipped.

## Screens / routes (`src/app/`)

- `/` (`index.tsx`) — intro/hero screen with a "바통 이어받기" CTA → hyperspace burst animation → `/login` or `/map`.
- `/login` — team number (1–24) + name (≤10 chars), no password. Name "김수" + team "100" bypasses everything and routes straight to `/superadmin`.
- `/map` — primary card-list view of all 9 stations (hall name, keyword badge, description, per-letter progress dots, live "N조 진행중" badge if a session is active there). Links to `/floormap`, `/collection`, `/settings`, `/scan`.
- `/floormap` — SVG floor-plan view (3 floors: `young-10f`, `young-11f`, `fashion-10f`), ported pixel-for-pixel from the Figma Make source's `FloorMapsView.tsx`. Tap a room to see a detail card (with live session status) and a manual-backup button.
- `/station/[id]` — station detail: hero with glow/particles, description, letter chips, NFC/QR scan CTAs, manual-backup fallback.
- `/collection` — the "ending" screen: animated letter-assembly reveal when all 10 letters are collected, Hebrews 12:1 verse, closing message.
- `/scan`, `/nfc-scan`, `/nfc-write` — camera QR scanning, NFC tag reading, NFC tag writing (dev/test tool).
- `/settings` — edit name/team (writes straight to DB, no confirmation step), admin-mode entry (password `saeroun0906`), logout, a near-invisible 7-tap button (bottom-right, opacity 0.08) that also reaches `/superadmin`.
- `/admin` — station-centric staff console: per-station session list (team, remaining time), start/end session controls.
- `/superadmin` — global game-state toggle (`progress`/`ended`, locks every participant screen via `GameEndOverlay` when `ended`), and a password-gated "reset all team progress" button (see below).
- `public/broadcast.html` — **not part of the RN app.** A standalone static HTML/CSS/JS page (no build step), served by the same Express static handler, for a lobby/venue display. Polls `/api/stats/overall`. Deliberately a separate codebase per the original spec (isolate the always-on venue display from the participant app).

## Data model (MySQL, see `server/db.js`)

- `users(person_id UUID PK, name, team_id)` — created on first login (no signup step, no validation against a roster). Name collisions get an auto-incrementing suffix (김수 → 김수2 → 김수3, via `dedupedName()`).
- `stations(station_id PK, name, hall_name, duration_minutes, concurrent_capacity, letters JSON, is_active)` — seeded from a hardcoded mirror of `src/constants/stations.ts` (`STATION_SEED` in `db.js`; **keep both in sync manually**).
- `tag_events(person_id, team_id, station_id, fragment_letter, tagged_at)` — one row per letter per scan (multi-letter stations insert several rows). **This is the single source of truth for team progress** — never per-person.
- `fragment_reveal_log` — stats-only, best-effort, not used for correctness.
- `game_sessions(id, station_id, team_id, started_at, expected_end_at, status, ended_at, ended_by, started_by_name)` — "who's currently doing this station." Auto-completed lazily (`autoCompleteExpiredSessions()`) whenever `GET /sessions` is called, not via a background timer.
- `app_state(id=1, game_state)` — single-row global toggle (`progress`/`ended`).

## Key business decisions (don't relitigate these)

- **Team-level truth, not person-level.** `GET /teams/:team_id/fragments` returns `DISTINCT station_id` for the team; `collectedLetters` is derived from that, client-side, in `use-station-progress.tsx`. A team of 3 and a team of 15 are weighted identically — `stats/overall`'s denominator is hardcoded `24 * activeStationCount`, not based on actual signups.
- **No roster validation.** Registration finalizes late and headcount changes day-of; the app deliberately never blocks login against an official list. Team/name are self-reported and editable anytime in Settings (writes straight to DB).
- **RAHAB merge.** 사무엘홀 and 다니엘홀 were originally two separate escape-room sessions; a 2026-07-05 decision merged them into one station (`RAHAB`, letters R/U/N together). Physical NFC/QR tags for "NOAH" and "ABEL" were already printed before that decision, so `STATION_ALIASES` (`src/constants/stations.ts`) redirects those tag IDs into `RAHAB` — this is unrelated to the actual `NOAHROOM`/`ABELROOM` mini-game stations, which are separate, letter-less stations that happen to share similar Korean names (노아방/아벨방) by coincidence.
- **노아방 (NOAHROOM) confirmed at 플레이그라운드** (2026-07-06). **아벨방 (ABELROOM)'s location is still unconfirmed** — Figma's stale mock guesses "그레이스홀" but that was never confirmed by the user, so the floor map deliberately shows it as a non-interactive, location-pending room, not a clickable station.
- **Admin password (`saeroun0906`) is intentionally simple**: checked client-side only for the regular `/admin` gate and the settings-screen entry (accepted simplicity tradeoff, small-scale event). The one exception is the super-admin **reset-all-progress** endpoint (`POST /admin/reset-progress`), which also checks the password server-side, since its blast radius is the whole event's data rather than one row.
- **Super admin bypass** (name="김수", team="100") skips the real login API entirely — pure client-side special case in `use-auth.tsx`.
- **"Team truth vs. device reveal."** Each device keeps its own AsyncStorage record (`rtj_seen_fragments_team_{id}`) of which fragments it has already shown the "획득!" animation for, so it can replay that reveal once for a teammate's discovery it hasn't seen yet, without re-showing it for fragments it already animated. This cache self-heals (drops stale entries) when server-reported progress no longer matches it — e.g. after a super-admin reset.

## Figma source

Figma Make file `ACEHFzIJJGx6ZzAGI2Vn50` ("Define User Flow") is the visual/UX reference, fetched via the Figma MCP server (`get_design_context` with `nodeId: "0:1"` for Make files, then individual component files via `ReadMcpResourceTool` on `file://figma/make/source/ACEHFzIJJGx6ZzAGI2Vn50/...` URIs). Its `App.tsx` mock `SPACES` data (Daniel/Samuel/Isaac/Timothy/Joseph/Newgen/Noah/Abel character names, Unsplash hero images, per-character Bible verses/core-questions) is **stale placeholder content** — real station data lives in `src/constants/stations.ts` and should never be overwritten by the Figma mock. The **structural/visual design** (card-list map, station-detail hero treatment, letter-collection ending animation, floor-plan SVG coordinates, dashboard header) has been ported faithfully; the **narrative content** (verses, core questions per station) has not, because it doesn't match the real station games and would require fabricating theological content — don't invent it without the user's input.

## Current feature status

Done: login/settings edit (DB-synced), map (card list + floor SVG), station detail with real NFC/QR scanning + manual-backup fallback, letter-collection ending animation, admin session console, super-admin game-lock + progress-reset, live "N조 진행중" status on both map views, standalone broadcast page.

Known gaps / recommended next steps (not yet built as of this doc): a team-centric admin dashboard (current admin view is station-centric only — no at-a-glance "which of the 24 teams are stuck" view), a way to cancel/undo a wrong tag event, and a progress-percentage indicator for in-progress sessions (elapsed/duration).
