# Safinat Al-Nur — working frontend prototype

Arabic-first, responsive React prototype. **Founder testing is fully unlocked:** all screens and ten lesson weeks are available without login, subscription or payment. This is a local frontend, not a deployed or connected production product.

## Open / run

Local preview: http://127.0.0.1:5178/

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview -- --port 4178
```

Node 22 was used. Dependencies are exact-pinned with `package-lock.json`. The earlier app running on port 5173 is untouched; this prototype uses 5178.

## What you can try

- Today: dated swipe-to-complete capsules, green strike-through, reversible completion, assigned-only partial ranges and one Mushaf button. History/corrections live in Journey. See [checklist behavior](docs/TODAY_CHECKLIST.md).
- Qur’an: 604 fixed Madani pages, horizontal swiping, tap-to-hide controls, all 114 surahs / 30 juz, page jump, local last position and page bookmarks. No recording prompts or automatic tracking in the reader.
- Journey: private calendar, day details, actual records, revisions, illustrative ship and distinct khatma empty state.
- Learning combines courses and library. Courses: thumbnail-led multi-course catalog, weekly programs or single-class courses, collapsible outlines, lesson thumbnails/player, private notes, bookmarks and submitted end-of-week questions. Founder access stays open; student preview requires prior lessons plus submitted questions.
- Library: topic filters, Arabic/English keyword search (try `istighfar`), saved media, detail, provenance, sample timestamp jump and empty results.
- Community: automatic daily check-ins from completed assigned tasks, one entry per member/day, full-wird people count, heart reactions and complete Quran verses. Mecca-day rollover. Level-colored cards, stacked readings, optional profile photos and a مشاركتي filter. Local preview opens with seven clearly labeled fictional members and sample heart counts; examples can be hidden.
- Settings: personal name, commitment preview, text size, reduced motion, reminder preference, export and reset. Scenario selector for return, offline simulation, error, free day and unresolved policy. Welcome is replayable.

## Important boundaries

Records persist in this browser’s `localStorage`. There is **no real account, backend sync, group publication, coach submission, push notification or checkout**. Offline is a state simulation; this is not yet an installable offline PWA. A browser data clear deletes local records; export is provided.

Today and Community use the current **Mecca day (`Asia/Riyadh`)** and reset at midnight. The old 28 September date remains only as a legacy fixture/helper default. Earlier calendar marks and 18 ship steps are illustrative. B/BI full completion previews one additional step; no real credit is awarded. Partial credit and unsettled schedules remain unresolved. Other commitments remain selectable with an honest awaiting-policy state. Real server responses must replace local demonstration evaluation before production.

The classroom titles, quiz and library cards are samples. The 12-second local video is an original silent abstract scene, not a coach lesson. No claim of religious/editorial approval is made. Mushaf visuals are original Quran Android Madani v8 page images; accessible text is verbatim from pinned `quran-json@3.1.2`. Provenance, hashes and ownership/licensing are in [ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md). A production text/edition sign-off remains with the founder.

## Handoff

- [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md) — precise API requirements, existing contract mapping, unresolved dependencies and connection checklist.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — tokens, components and interaction choices.
- [PRODUCT_FLOWS.md](PRODUCT_FLOWS.md) — routes and supported flows.
- [FOUNDER_DESIGN_REVIEW.md](FOUNDER_DESIGN_REVIEW.md) — self-contained review and test evidence.
- [SKILLS_INSTALLED.md](SKILLS_INSTALLED.md) — downloaded GitHub skills, pins, licenses and scope.

The latest instruction to start the build authorizes this implementation. Earlier research-only gate documents remain historical; they have not been overwritten.


### Reader/Journey update — 29 September

The fixed-page reader supports surah/juz search, page bookmarks and deep links (`#/reader/page/50`; legacy `#/reader/2/255` resolves to page 42). See [reader behavior and checks](docs/MUSHAF_READER.md). Journey adds an optional **الخادم · BJ2 تجريبي** source, connected to the existing backend on port 8765 via a read-only development bridge. Default founder/local prototype remains available. The backend token stays server-side. Production preview does not include this dev bridge. See [connection status and remaining work](docs/BACKEND_CONNECTION_REVIEW_2026-09-29.md).

## Latest: Saturday celebration and أورادي

In Community, use **معاينة السبت** to preview the weekly celebration now. On Saturday it opens automatically in Mecca time. **أورادي** shows newest-first weekly history with expandable days, partial progress, reactions and original level colors. Four labeled sample history weeks demonstrate a level change; samples can be hidden. Confetti has a pause control and respects reduced motion.

The complete backend development brief is [BACKEND_PRODUCT_BRIEF.md](BACKEND_PRODUCT_BRIEF.md); start there for accounts, profiles, levels, reading, daily/weekly community services, history, reactions, learning and integration acceptance cases.

## Latest: Safina animation v0.5

رحلتي now includes the approved 3D ship, local visual previews and a shared emerald/amber/rose completion calendar for all levels. The connected account view is prepared for the versioned ship visual-state endpoint; until the backend supplies it, it shows a neutral pending state. See [integration notes](docs/SHIP_V05_INTEGRATION.md).


## Owner demo / launch (3 October 2026)

Connected launch UI uses contract0.6. See `../Coordination/FRONTEND_STATUS.md` for verified behavior and remaining release dependencies, `../Coordination/BACKEND_STATUS.md` for APIs, and `../DEPLOYMENT.md` for single-origin hosting. Production builds default to authenticated account mode. Only verified super admins can open the isolated illustrative preview; local development also allows it. Google sign-in requires provider configuration; no public service is implied by a successful local build.
