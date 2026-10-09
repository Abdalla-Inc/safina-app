# Backend handoff — Safinat Al-Nur frontend prototype

> Latest 1 October requirements: [BACKEND_OCTOBER_HANDOFF.md](BACKEND_OCTOBER_HANDOFF.md). Country, custom reading, daily istighfar and emoji reactions supersede conflicting older requirements below. API v0.4 currently supports the earlier account/reading/heart flows; new authenticated mutations remain pending backend extension.

**28 September 2026 · Frontend build 0.1.0 · Founder is sole reviewer**

The working frontend is in `Front End/`, served on port 5178. All founder features are unlocked locally. This is not authorization to bypass backend entitlements or authentication in production. There are no backend writes. As of 29 September, Journey includes an optional read-only connection to the existing synthetic local backend account. Frontend records are fixtures/local drafts, never authoritative credit.

## Start here: consolidated product brief

The full backend delivery scope, including accounts/profiles, effective level changes, Saturday celebrations, **أورادي** weekly history, typed reading proofs, reactions, learning, API proposals and acceptance tests, is in [BACKEND_PRODUCT_BRIEF.md](BACKEND_PRODUCT_BRIEF.md). Its latest weekly requirements supersede the earlier today-only own-post filter below. Existing endpoint details in this file remain supporting material.

## 29 September integration update

Journey now reads the actual local service’s calendar, approved credits and khatma records through a restricted development bridge. Select **الخادم · BJ2 تجريبي** in Journey to inspect it. Credentials stay server-side. Local reading records are not uploaded. The reader now uses locally bundled, fixed Madani page images; accessible text remains separately pinned because the server text endpoint remains gated. Full findings and remaining integration work: [Backend connection review](docs/BACKEND_CONNECTION_REVIEW_2026-09-29.md).

## Today checklist · latest founder direction

Today is now a compact date and swipeable checklist of **only assigned components**, plus one Mushaf button and an assigned-only partial-progress form. Crossing a capsule is explicit confirmation of the full assigned range, with no second save step. Partial entries form unique coverage; complete coverage crosses the capsule. Reading outside the selected assignment does not contribute to the day. No partial day/ship credit policy was introduced. UI/mutation details: [Today checklist](docs/TODAY_CHECKLIST.md).

For production, return stable component IDs, Arabic labels, exact assigned range arrays, server-local date and unique covered ranges/counts. A full crossing should create an idempotent confirmed reading act tied to that component and immutable assignment version. Reopening must remove completion consistently even when it came from multiple overlapping acts; agree an atomic component correction operation (or transaction over revision-checked reading-act corrections), preserve unaffected partial/other-component history, and return the re-evaluated Today/ship/khatma projections. Reject unassigned partial ranges. Surface a failed mutation by restoring the capsule and offering retry; never leave a local checked state presented as server acceptance. This frontend remains local-only for these writes.

## Inputs actually read

The latest `Back End/docs/BACKEND_REQUEST_2026-09-28.md`, `PROGRAM_RULES_AND_OPEN_QUESTIONS.md`, `HABIT_ENGINE_SPEC.md`, Life Reset study, and newly available contract fixtures were inspected. `contracts/fixtures/today-BI.json` and `reader-correction.json` declare **contractVersion 0.3.0**, rule version `founder-core-2026-09-28.v1`, reference `hafs-tanzil-1.0-20260928`. Copies for frontend contract tests live in `tests/fixtures/`. These are snapshots, not a live backend integration.

`src/data/model.js` contains deliberately limited demo helpers; replace their output with authoritative assignment/evaluation responses. Do not port the sample ship, calendar, or demo day to server rules.

## Required interface contract

| UI need / field | Meaning and expected owner | Existing / requested endpoint | When absent |
|---|---|---|---|
| `assignment.id`, rule/reference/schedule version, date, timezone, commitmentId, cycle | Immutable snapshot selected by server, including exact local civil date | `GET /today` | Loading, retry, or saved snapshot marked stale; never fabricate a date’s assignment |
| `assignment.components[].id`, label, ranges | Stable slots with inclusive canonical references; official Arabic display labels needed (B/I currently placeholders) | `GET /today` | Show awaiting-published-schedule state; reader/manual ledger remains available |
| `assignment.status`, `freeDay`, `openPolicies` | Published, free-day or unresolved rule with explanation | `GET /today`, `GET /program-rules` | `RULE_NOT_APPROVED` / `SCHEDULE_NOT_PUBLISHED`; no completion inferred from reader navigation; a deliberate crossing is a member self-report |
| `evaluation.uniqueCoverage`, assigned fulfilment, repeated acts, supplemental reading | Union coverage and distinct actual acts from server | `GET /day-evaluation`, mutation response | Show reported ranges; do not equate raw verse count with authoritative completion |
| Component-level logged state / next unread verse | Return complete/partial/no-entry per stable component, including overlap satisfaction | Proposed addition to Today projection | Derive only display overlap from pinned ranges if agreed; no duplicate recitation demand |
| `readingAct.id`, revision, mutationId, revisionOf, source, traceId, occurrenceDate/time, zone, offset, ranges | Confirmed self-report with optimistic concurrency and idempotency | `POST /reading-acts`, `PATCH /reading-acts/:id`, `POST /reading-acts/:id/retract` | Keep an explicitly local draft; expose conflict, correction and retry separately |
| `readerObservedTrace`, suggestion id/revision, exposed ranges, discarded state | Provisional observation, **zero credit** until member confirms exact reading | Reader session trace endpoints | Local suggestion only. Opening, timer, scrolling or playback does not report reading |
| `dayCredit`, `creditState`, open policy and explanation | Server award or null/unresolved; cap one for approved complete day | Mutation + day evaluation | Partial is recorded without invented fractional award |
| `shipProgress.approvedCredits`, creditsPerShip, presentationStatus/currentShip, ledger | Versioned visual projection separate from khatma | `GET /ship-progress` | Current prototype’s 18 steps are illustrative; do not use as account data |
| Khatma proof, cycle, unique coverage, completion date, ordinal | Proven complete coverage independent of ship | `GET /khatmas` | Neutral empty/unresolved; never infer from ship completion |
| Calendar date, historical level token **and label**, reading status, pause/free state, khatma | Historical snapshot must survive a later tier switch | `GET /calendar` | Unknown/no-entry distinct from failure; show stale state if cached |
| effective date, status, transition explanation | Monthly same-day vs weekly next-Sunday rules, cross-cadence unresolved | `POST /commitment-changes` | Do not fake immediate changes for a production weekly commitment |
| reminder eligibility/timezone/delivery, pause policy | Optional preferences and server scheduling | Preferences endpoints TBD | Save preference only, explicitly no delivery claim |

## Reading mutation payload to agree

Current UI ranges `{surah, from, to}` should adapt to `[{start: "2:1", end: "2:25"}]`. Include `assignmentId`, `referenceVersion`, `ruleVersion`, `occurrenceDate`, occurrence instant, IANA timezone, offset, `mutationId`, source (`manual_physical` or `reader_confirmed`), `traceId` where applicable, `confirmationState: member_confirmed`, and expected revision for a correction. **Please confirm actual accepted source enum values and revision/precondition header.**

Return the active act plus new evaluation, ship projection and neutral correction explanation in one result. On `409` return both revisions and exact affected ranges, not last-write-wins. Reusing a mutation UUID must not create another act. Explicit repeat requires an independent act and repeat linkage; overlap of labels alone cannot create a repeat.

Late recording must retain occurrence date rather than sync date. Support manual physical and reader-confirmed coverage on the same date without doubling it. A corrected/removed record must re-evaluate ship and khatma, and invalidate its separately published group update.

## Qur’an reader assets

The reader is now a fixed, 604-page Madani Hafs Mushaf, using original Quran Android v8 page images and its own page/surah/juz metadata. All 604 starts match your `data/reference.json` (`tanzil-medina-604`, `tanzil-pages-1.0`). The images establish actual printed line placement; page boundaries alone are not used to repaginate arbitrary text. See [asset provenance](docs/ASSET_PROVENANCE.md) and [current reader behavior](docs/MUSHAF_READER.md). The unchanged Quran JSON 3.1.2 text remains available to screen readers, with its separate attribution.

**Current reader state:** `reader.page` (1–604), `reader.edition: "hafs-madani-604"`, compatible `surah` / `from`, and `mushafBookmarks: number[]`. `#/reader` opens the index; `#/reader/page/50` opens a physical page; legacy surah/ayah links still resolve to the containing page. Previous verse bookmarks are retained and mapped to page bookmarks once.

**Requested production support:** edition/versioned asset manifest with immutable URLs, page count/dimensions/checksums and canonical first/last verse references; authenticated private resume-position and bookmark preferences, separate from reading acts. Do not treat a page bookmark or resume position as coverage. Confirm the approved distribution rights and independently validate the selected edition before production. No new backend code or writes were added.

**Latest founder direction supersedes the prior reader-confirmation UI:** no recording prompts, timers, automatic scrolling, microphone following, or reading-act submission in the reader. Page swipes and taps only navigate. Automatic following is a later feature and requires its own agreed behavior; existing reader-trace endpoints are not called. Manual recording and corrections elsewhere remain unchanged.

No audio is bundled; reciter/provider rights and listening evaluation remain open.

## Content, media and entitlement module

The course experience now uses **catalog → course → ordered modules/weeks → lessons**, replacing the former flat ten-lesson screen. Multiple enrollments and single-class courses are required. Demo courses: `safina-vip` (10 weeks; first week has two lessons) and `health` (one class). These are sample structures, not approved teaching content. See `docs/COURSE_REDESIGN.md` and `src/data/courses.js`.

### Course contracts requested

| Interface | Required response / behavior |
|---|---|
| `GET /me/courses` | Enrolled courses with stable id, Arabic title, format (`weekly` or `single_class`), thumbnail asset, enrollment status, progress, resume lesson id. Pagination and published/withdrawn state. |
| `GET /courses/:id` | Ordered modules with stable ids, titles, ordered lessons and **individual lesson thumbnails**, duration, required/optional flag, access status, prerequisite reason, question set/version. Single-class course uses one module. |
| `GET /courses/:id/lessons/:lessonId` | Authorized playback URL/expiry, poster, captions, transcript, approved lesson content/resources, bookmark, private note, playback position, completion state. Deny locked direct requests, not merely navigation clicks. |
| `PUT /courses/:id/lessons/:lessonId/progress` | Persist resume position separately from member-confirmed completion. Agree required watch policy; current prototype requires a playback-ended event in student preview, then explicit completion confirmation. This is a local interaction demonstration, not proof of full viewing. |
| `PUT /courses/:id/lessons/:lessonId/note` and bookmark mutation | Private, course-scoped records with revision and ownership. No sharing by default. |
| `PUT /courses/:id/modules/:moduleId/answers/draft` | Save question-versioned partial answers separately from submitted answers. |
| `POST /courses/:id/modules/:moduleId/answers/submit` | Validate all required lesson completions and every required answer; return accepted submission, module completion, course progress and newly accessible modules. Idempotency key + expected revision; return explicit stale-version/locked/validation errors. |

**Founder-confirmed progression rule:** a learner cannot open the next week until every required lesson in all preceding weeks is completed **and** those weeks’ required questions are answered and submitted. No passing-score requirement was requested, so the prototype does not invent one or grade reflective answers. No calendar-based drip schedule. Course completion includes final-week questions, including for a single-class course.

The prototype recomputes access when completion is undone or submitted answers are edited (editing makes them drafts). Please implement/confirm the production correction/resubmission policy and return authoritative access. A later week completed during founder preview never bypasses an incomplete earlier week in student preview.

Every course and lesson needs an independently addressable thumbnail asset (16:9 preferred, responsive sizes and Arabic-safe crop). Every video needs real duration, licensed source/host, expiry, download/transcription rights and captions. Current 12-second silent clip and locally drawn SVG covers are placeholders. Production content and quiz wording still need approval.

**Founder access:** the original prototype defaults to `learningMode: founder`; all lessons can be opened without changing progress. A compact dropdown switches to `learner` to test gates. Production must authorize founder/test access on the server; a local dropdown is never an entitlement. Preview tests are independent of the Qur’an practice engine and must not award reading credit.

New local records are namespaced by `courseId:lessonId` and `courseId:moduleId`. Existing prototype data is retained; old VIP lesson notes remain readable as a fallback. Legacy `lessonDone`/quiz values are preserved but not converted into completed weeks, because they do not prove the new multi-lesson/question prerequisites. `#/lesson/1` through `#/lesson/10` remain aliases for the corresponding VIP lesson. New links use `#/course/:courseId` and `#/lesson/:courseId/:lessonId`.

Library search needs reviewed title/topic/keywords/refs, transcript hits and timestamps, relevance explanation, source/provenance, public/paid flags, unavailable-source errors and approved Arabic normalization. Prototype `istighfar` search uses four labeled examples, not a real coach corpus or AI interpretation.

Production entitlement enforcement must come from the server. Founder test access should be a separately authorized test identity/environment. Free reading, private history and permitted public library use must survive paid-access expiry. Request enrollment, expired, cancelled and missing-content fixtures without blocking the founder’s current prototype.

## Daily community feed — latest founder direction supersedes manual sharing

The latest request replaces circles and reviewed per-post sharing with an app-community daily feed. Dhikr and circles are removed from current navigation; retain their data for possible future use. Learning now combines courses and library under one navigation destination.

**Automatic trigger:** after an explicitly confirmed reading mutation, evaluate completed assigned components and upsert one check-in per `(memberId, assignmentDay)` in `Asia/Riyadh`. Publish clear Arabic completed-task labels and canonical ranges, never an inferred reading trace. A check-in can list a completed task while the rest of the day's wird is unfinished; count the person once only when **all** required components are complete. Subsequent tasks update the same card. This is the newly authorized product behavior; do not keep the old manual Share button or per-post review step as a dependency.

**Day contract:** Mecca midnight to midnight, UTC+03 via IANA `Asia/Riyadh`. Return the current community day, authoritative server time, zone and next rollover instant. Keep occurrence day separate from publication/update timestamp. Backdated edits must correct their historical day rather than inflate today. Current frontend Today and feed use Mecca time; stored historical fixture dates are unchanged. Reconcile this requested shared day with existing member-specific schedule timezone policy in the backend.

**Needed endpoints (proposal, not currently callable):**

| Interface | Required behavior |
|---|---|
| `GET /community/check-ins?day=YYYY-MM-DD&cursor=…` | Authenticated community scope, stable check-in ID, member ID/display name, assignment ID/version/day, completed component IDs/Arabic labels/exact ranges, full-wird flag, created/updated instants, revision, heart count and viewer reaction; stable pagination and withdrawn events. Newest meaningful update first, no ranking. |
| `GET /community/days/:day/summary` | Unique count of members with complete daily assignments, day/zone/server time/next midnight, projection revision matching the feed. No denominator. Do not label daily wirds as Quran khatmas. |
| `PUT /community/check-ins/:id/reaction` | Authenticated idempotent heart on/off; one per member/post. Return canonical count and viewer state; no duplicate increments under retries. |
| Feed change stream or polling cursor | Upsert, revision and removal events for completion, correction/retraction, membership visibility and reactions; recount atomically with changes. |

Create/update publication as a backend projection of accepted reading acts, with durable idempotent processing. Never trust a client `complete: true`, client clock or supplied member ID. On correction remove invalid task claims, decrement the full-wird total when necessary, and withdraw an empty card. A retry, overlapping range, repeat or reload cannot create another person/day count. Keep publication revision separate from private ledger revisions while preserving provenance. Do not automatically republish unrelated old private history when this feature is enabled.

The shared audience is the app community specified by the founder. Return only the requested name, completed assigned reading and timestamp; no private notes, unrelated readings, dhikr or device data. Production needs the actual authenticated member/community visibility contract and moderation/removal handling. No chat or comment functionality is requested.

**Current status:** reviewed `Back End/contracts/API_HANDOFF.md`: `/events` is own-member replay, not a shared feed; group publication is policy-gated and draft records are not live APIs. Frontend implements the flow locally and labels it accordingly. It makes no publication/reaction requests. Founder-requested behavior is captured here for backend implementation; no backend gate or private account boundary has been bypassed. See [Community feed](docs/COMMUNITY_FEED.md).

## Offline / errors / security

Return clear network/policy/auth/entitlement/conflict/rights error codes. Publish safe cached snapshots and expiry rules. Real offline queue must use stable mutation IDs, revision preconditions and visible pending/sync/conflict states. Current “offline” switch is a simulation; there is no backend queue or service worker. Avoid silently accepting stale rules.

Before integration supply auth/session/CORS/CSRF choice, local development base URL, test identities, allowed origin `http://127.0.0.1:5178`, OpenAPI/schema, representative fixtures and an integration sandbox. No secrets belong in Vite client variables. No analytics or external publishing are enabled in the prototype.

## Highest-priority next delivery

1. Stable v0.3 schema and runnable sandbox for B/BI Today → confirmed reading → evaluation → correction; exact field/enumeration differences documented.
2. Official Arabic component/commitment labels, approved text relationship and component-level status/next unread.
3. Clear ship visual projection or explicit pending presentation field. Fractional/carry and unresolved calendar decisions remain founder-owned.
4. Published content plus rights/entitlement fixtures; shared community check-in/count/reaction contract.
5. Consumer tests covering trace-zero-credit, duplicate retry, correction, late/offline date, overlapping plans, BJ2 day one, unresolved later days, monthly switch and next-Sunday weekly change.

The frontend can be reviewed now. Production connection must replace the local demo state, not layer authoritative claims over it.

## Community level colors, profiles and reactions · 29 September follow-up

The founder now requests level-colored posts, optional profile photos, stacked readings, seeded preview examples, and a quick own-post view. See `docs/COMMUNITY_FEED.md` for the palette and implemented local behavior.

- Extend each check-in with an immutable commitment snapshot (`tierAtCompletion`, `colorToken: level.<id>`, assignment/version). Use the completion-era level for historical colors, not the member's current profile. Frontend owns color values; unknown tokens render neutral. Confirm authoritative semantics if a current-day assignment is replaced after its first posted task.
- Return structured `completedTasks` with stable component IDs, canonical surah/juz/range details and approved Arabic display labels. Render each component on a separate line. Sample “البقرة + خمسة أجزاء” summaries do not authorize an unapproved assignment schedule.
- Return profile `displayName` and nullable `avatarUrl`/asset version. Supply an authenticated upload/replace/delete flow, supported formats/size, authorized storage URL and small display variants. The local preview accepts JPEG/PNG/WebP up to 10 MiB and stores a <=256px JPEG in browser state; this is not a server upload or security boundary.
- Return `heartCount` and `viewerReacted` separately. Reaction PUT/DELETE must be idempotent for the authenticated viewer, return the authoritative count, and update the feed/own-post view. Never trust a submitted count or accept duplicate hearts on retries. Frontend sample seed counts are strictly fictional and must never migrate into production.
- Allow fetching the authenticated member's check-in for a given Mecca day (e.g. `GET /community/checkins/me?day=YYYY-MM-DD`) even when it lies outside the first feed page. `مشاركتي` should return the same card and live reaction totals, or an explicit not-yet-posted state. Daily total remains all unique completed members regardless of this filter.

The prototype shows seven labeled examples by default as requested. There is no real multiuser publication/reaction service connected yet; retain that distinction when implementing the shared feed.


## 1 October 2026 — animation v0.5 and completion calendar

The approved renderer from `Safina Ship Handoff v0.5` is integrated into both Journey implementations. See [SHIP_V05_INTEGRATION.md](docs/SHIP_V05_INTEGRATION.md) for exact frontend changes, contract behavior and validation.

**New visual-state dependency:** connected accounts call proposed `GET /api/v1/ship-visual-state` through the existing cookie/CSRF/session client. Until supplied, 404/pending produces a neutral pending view, never a default complete ship or zero-health penalty. The host validates schema `1.0.0-proposed`, asset `0.5.0`, policy `founder-ship-lifecycle-2026-10-01.v1`, ranges/phase and vessel revision. Keep `/ship-progress` compatible. Return versioned state from the handoff schema/fixtures; reading mutations remain the existing endpoints, not client-set health.

The handoff confirms ±3 maintenance health per resolved day, clamped 0–100, on the member's saved timezone. Initial 30 approved-day build/carry/phase-transition, rest-day eligibility, late changes and account migration still need explicit registered lifecycle rules. Community remains Mecca-based; do not silently change its dates to the maintenance zone. The browser performs no health settlement or guessed inactivity penalty. Preserve confirmed construction at 30 during maintenance damage.

**Calendar direction supersedes level colors in Journey:** complete = emerald, partial = amber, closed uncompleted = rose, rest = slate, future/open/unassigned = neutral. Unknown/pending data is patterned neutral. Every level uses the same palette. Tier metadata remains available for audit but does not color Journey dates. Today's unfinished obligation is not yet a miss, and a missing response is not proof of absence. Calendar receives explicit statuses and must not deduce misses from sparse ledger gaps.

The displayed consistency value is explicitly scoped to the loaded month, counts completed obligation days, skips explicit rest days, and does not end a run just because today's still open. Past partial/unknown/no-entry dates end this local display. Supply an authoritative lifetime/current/longest streak with its date window, rest-day policy, timezone and revision if the product should replace this bounded indicator. It is not new ship credit or health evidence.
