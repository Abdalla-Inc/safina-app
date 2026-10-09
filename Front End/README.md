# Safinat Al-Nur — frontend

Arabic-first, responsive React app with connected accounts and a separate illustrative owner preview. This folder ships with the Python API in `../Back End`; deploy the combined app using [the root deployment guide](../DEPLOYMENT.md). A static frontend upload alone cannot provide working accounts.

Production opens in connected account mode. Verified super admins can also open the isolated example preview and use the ship construction/health controls. Local development exposes the example preview for design review. Neither preview data nor sliders award real reading credit.

The connected app includes registration, email verification/recovery, configured Google sign-in, daily reading and istighfar, custom recurring commitments, custom reading reports, community reactions, weekly celebrations, calendar and ship construction. Public authentication requires the host and Supabase configuration described in the deployment guide. No public deployment or live owner password is implied by this source release.

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

## Interface and local example preview

- Today: dated swipe-to-complete capsules, green strike-through, reversible completion, assigned-only partial ranges and one Mushaf button. History/corrections live in Journey. See [checklist behavior](docs/TODAY_CHECKLIST.md).
- Qur’an: 604 fixed Madani pages, horizontal swiping, tap-to-hide controls, all 114 surahs / 30 juz, page jump, local last position and page bookmarks. No recording prompts or automatic tracking in the reader.
- Journey: private calendar, day details, actual records, revisions, illustrative ship and distinct khatma empty state.
- Learning combines courses and library. Courses: thumbnail-led multi-course catalog, weekly programs or single-class courses, collapsible outlines, lesson thumbnails/player, private notes, bookmarks and submitted end-of-week questions. Founder access stays open; student preview requires prior lessons plus submitted questions.
- Library: topic filters, Arabic/English keyword search (try `istighfar`), saved media, detail, provenance, sample timestamp jump and empty results.
- Community: automatic daily check-ins from completed assigned tasks, one entry per member/day, full-wird people count, heart reactions and complete Quran verses. Mecca-day rollover. Level-colored cards, stacked readings, optional profile photos and an أورادي history view. Local preview includes fourteen clearly labeled fictional members and sample reaction counts; examples can be hidden.
- Settings: personal name, commitment preview, text size, reduced motion, reminder preference, export and reset. Scenario selector for return, offline simulation, error, free day and unresolved policy. Welcome is replayable.

## Connected data and example data

Connected accounts use the server for identity, commitments, evidence, community and ship state. Session/provider credentials are not stored in browser storage. The example preview uses this browser’s `localStorage`, fictional members and illustrative history; those records do not publish to the community. Clearing browser data deletes the local preview records. Offline examples simulate state; this is not yet an installable offline PWA. Push notifications and checkout are not implemented.

Today and Community use the current **Mecca day (`Asia/Riyadh`)** and reset at midnight. Connected construction advances once per fully completed assigned non-Saturday day. Ship maintenance after the 30th earned day still awaits an approved policy and is shown as pending; owner simulation remains available independently. Custom weekly/monthly commitments divide into daily assignments with Saturday rest.

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

رحلتي now includes the approved 3D ship, local visual previews and a shared emerald/amber/rose completion calendar for all levels. The connected account view reads the versioned ship visual-state endpoint and shows a neutral pending state when an earned policy is unresolved. See [integration notes](docs/SHIP_V05_INTEGRATION.md).


## Owner demo / launch (3 October 2026)

Connected launch UI uses contract0.6. See `../Coordination/FRONTEND_STATUS.md` for verified behavior and remaining release dependencies, `../Coordination/BACKEND_STATUS.md` for APIs, and `../DEPLOYMENT.md` for single-origin hosting. Production builds default to authenticated account mode. Only verified super admins can open the isolated illustrative preview; local development also allows it. Google sign-in requires provider configuration; no public service is implied by a successful local build.

## Release verification — 9 October 2026

Production build succeeds and all 104 frontend tests pass. Backend owns the combined GitHub upload and hosting setup. See [the frontend release check](docs/RELEASE_CHECK_2026-10-09.md) for scope and remaining live verification.
