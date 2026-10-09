# Safinat Al-Nur — complete backend delivery brief

**Frontend handoff · 29 September 2026 · incorporates the founder’s latest weekly-celebration request**

This is the starting document for the backend developer. It consolidates the current product, distinguishes implemented engine behavior from requested services, and defines the responses and acceptance checks needed to connect the frontend. The frontend is a working Arabic-first, RTL, mobile-first prototype at port 5178. It is not a production account system. Do not import fictional example posts, hearts, course completions or browser-local founder permissions as real records.

Detailed existing mappings remain in [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md), the inspected backend’s `contracts/API_HANDOFF.md`, `contracts/openapi.json`, `contracts/schema.json`, and executable fixtures. In conflicts, the newest founder direction below supersedes older frontend product assumptions; existing server rules must be changed explicitly and versioned, not bypassed in the client.

## 1. Product the backend must support

Five destinations: **اليوم / المصحف / رحلتي / التعلّم / المجتمع**. Learning contains courses and library. Settings are accessed from the top menu/profile. Circles, dhikr and bottom More are not in the current navigation. Preserve their old records; do not spend this release implementing those retired surfaces.

- **Today:** date, only committed reading components as swipeable capsules, assigned partial progress, one reader button. A deliberate crossing is a member’s self-report; undo is a correction. No extra outside-plan reading is added to the daily commitment count.
- **Mushaf:** fixed 604-page Madani edition, 114 surahs, 30 juz, swiping, tap to hide controls, private last page and bookmarks. No automatic recording, microphone tracking or passive reading credit. Automatic following is deferred.
- **Journey:** private calendar, original level colors, actual reading/corrections, engine-owned ship/credit and proven Quran khatmas. Unresolved progress remains unknown, never guessed.
- **Learning:** course catalog (VIP سفينة النور, health course, future courses), weekly modules or a single class, individual course/lesson thumbnails, videos/resources, notes/bookmarks, progress, required questions. Next week is locked until preceding required lessons and submitted answers are complete. Founder preview is unlocked locally; production founder access is server-authorized.
- **Community:** automatic daily reading check-ins, exact stacked completed readings, name/photo/level color, hearts, daily complete-wird member count. No rankings, competition scores, comment composer or manual publication step.
- **Saturday:** celebrate every member with any eligible confirmed reading that week, including partial efforts. One weekly summary per member, not a leaderboard. Whole Quran khatmas, surah completions, juz coverage and partial ranges are distinct facts.
- **أورادي:** replaces مشاركتي. Member’s own record grouped by week, newest first, expandable daily readings, reactions on the original posts, historical colors preserved when level changes. Show the current in-progress week as well as earlier weeks. This is the member’s history, not only today’s completed post.

## 2. What exists, what is still missing

Re-inspected `Back End/safina/api.py` and `contracts/API_HANDOFF.md` for this update; these describe the local service, not a claim about an unseen deployed backend.

| Capability | Observed status | Required work |
|---|---|---|
| Reading ledger, immutable assignments, exact coverage, corrections/retractions, idempotency | Local engine v0.3.0 implements these | Production transport/session binding and frontend write integration |
| `/today`, `/calendar`, `/day-evaluation`, `/ship-progress`, `/khatmas` | Member-scoped service reads exist | Bind screens to authenticated account; retain unknown-rule semantics |
| Tier changes | `/commitment-changes` exists, including queued changes and gated transitions | Expose current/pending/history; integrate settings and effective dates |
| Authentication | Local bearer-token service / synthetic test provisioning | Real registration, sign-in, verification, recovery, sessions, logout and account lifecycle |
| Profile name/photo | Frontend local state only in inspected UI | Persistent profile API and owned avatar assets |
| Daily/weekly shared feeds, counts, hearts, own weekly archive | New local projections and fictional examples | New server projections, endpoints, pagination and reaction service |
| Account replay `/events` | Own-member replay only | Cannot serve as the shared community feed |
| Courses/library | Local frontend examples; inspected backend routes are gated | Content, enrollment, access, progress, answers and media services |
| Reminders | Preference storage, delivery not implemented | Keep honest until actual delivery is built; not required for this release |
| Journey connection | Restricted development bridge reads synthetic `demo-BJ2` data | Production authenticated adapter; never merge synthetic results with local user history |

The frontend has profile settings and level selection, **not yet real accounts or multiuser synchronization**. Account creation/login is part of the requested backend scope and needs matching frontend screens once the session contract is supplied.

## 3. Calendar, Saturdays and effective levels

Use **Asia/Riyadh (Mecca)** for the community civil day and weekly boundaries. Return server time, current day, week start/end, and next rollover instants; device timezone and clock are not authority.

**Week convention implemented in the preview:** Sunday 00:00 through the following Sunday 00:00, end exclusive. Saturday is the celebration day. At Saturday 00:00, summarize confirmed activity from Sunday through Friday; voluntary/catch-up reading on Saturday may update that same week. At Sunday 00:00 a new week begins; the previous week remains in the archive. This does not mean a Saturday-day credit or mandatory task is awarded.

Example: `weekStart=2026-09-27`, `weekEnd=2026-10-03`, interval `[2026-09-26T21:00:00Z, 2026-10-03T21:00:00Z)`, celebration opens `2026-10-02T21:00:00Z`.

**New founder policy to reconcile explicitly:** Saturday is described as rest/celebration with no required new work. The inspected engine currently marks BJ5 Saturdays free but keeps B/BI daily prescriptions. Implement the latest Saturday policy through a new program-rule version and authoritative assignments; preserve past snapshots. Do not retroactively remove earned readings or infer an absence as failure. The community UI switches to celebration on Saturday; this change does not silently rewrite the existing Today engine/assignment prototype. Return program applicability and free-day state so Today can show the correct rest-day UI when connected.

Current engine uses member-specific zones for some assignments. Reconcile these with the founder’s shared Mecca day before enabling production writes. Return `assignmentDay`, occurrence instant/offset and community day explicitly; do not relabel an old act to today on sync.

Seven existing tier IDs: `B`, `BI`, `BJ1`…`BJ5`. No new official tier names are invented. The frontend palette is in `src/data/communityLevels.js` (`level.<id>`). BJ5 uses royal purple as a presentation choice.

- Store immutable tier/commitment segments with effective start/end and rule version.
- Read settings from the effective commitment, plus any scheduled change. A queued change is not already active.
- Existing local contract: nonweekly→nonweekly may apply same day; weekly→weekly queues next Sunday; cross-cadence changes are gated. Preserve authoritative behavior until a rule change is approved.
- Return old and new segments in a split day/week; never repaint old history using today’s tier. Weekly cards can show a latest segment accent and a small change marker, with each day retaining its actual tier(s).
- Return conflict, awaiting-policy and pending-effective-date states distinctly. No guessed schedule or fractional credit for unresolved BJ targets.

## 4. Account, session and profile contract

Proposed route names below are a delivery interface to agree, not existing callable endpoints. Reuse a chosen identity provider rather than create a second user identity system.

| Interface | Data / behavior |
|---|---|
| Registration/sign-in/verification/recovery | Decide supported credentials/provider; Arabic validation/errors; stable account/member ID and verified session. No password or bearer secret in frontend localStorage. |
| `GET /me` | Account ID, display name, avatar URL/version, locale, effective/pending commitment, timezone, permissions, feature flags and account status. |
| `PATCH /me/profile` | Name validation/length, locale/preferences, expected revision; return updated profile. Display names are not identifiers and need not be unique. |
| Avatar upload/replace/delete | Authenticated owned upload flow, supported formats/limits, actual image validation, small rendition, asset URL/version; release old assets per retention policy. Frontend currently accepts JPEG/PNG/WebP ≤10 MiB and stores a local ≤256px JPEG. |
| Session refresh/logout | Consistent expiry, revoked sessions, multi-tab logout, rate limiting; scope offline queues and caches by account. |
| `GET /me/commitment` and `/me/commitment-history` | Effective segment, pending request/effective date, available tiers, allowed transitions, immutable historical segments. |
| Existing `POST /commitment-changes` | Expected current commitment, idempotent mutation, effective-date receipt or precise conflict/gated error. |
| Export/deletion | Member-owned data export and account deletion workflow; define corresponding feed/avatar removal and anonymization behavior. Do not leave inaccessible orphan posts. |

Use secure authenticated transport, ownership checks and server-authorized roles. A changed client member ID, local founder mode, color token or completion flag must not grant access. Profile updates can change public name/avatar without changing a reading’s historical level or activity timestamp.

## 5. Durable records and projections

| Entity | Minimum fields / invariants |
|---|---|
| Member/profile | Stable ID, identity-provider linkage, name, avatar asset version, locale/preferences, status, revision |
| Commitment segment | Member, tier, effective interval, requested/scheduled status, previous commitment, rule version |
| Assignment snapshot/component | Member, civil day/zone, exact canonical ranges, component IDs, tier segment, cycle, rule/reference versions, free/required/awaiting-policy state |
| Reading act | Logical ID, member, immutable occurrence identity, assignment/component references, explicit source, exact ranges, revision/retraction, repeat provenance; existing engine owns deduplication |
| Daily check-in | Stable `(communityId, memberId, day)` identity, completed component facts, assigned-wird-complete flag, level segments, revision, meaningful event times |
| Weekly summary | Stable `(communityId, memberId, weekStart)` identity, exact period, qualifying days, structured facts with proof references, tier segments, in-progress/celebrating/archived state, revision |
| Reaction | Unique `(memberId, targetType, targetId, heart)`; independent daily vs weekly targets; aggregate count and current viewer state |
| Publication event/outbox | Source mutation/revision, projection version, upsert/withdraw, audience, durable cursor; one logical event despite retries |
| Reader preference | Member, edition/version, resume page/verse, bookmarks, appearance; never a reading act |
| Learning records | Enrollment/access, course/module/lesson versions, progress, drafts/submissions, private notes/bookmarks |

Retain the source reading ledger as authority. A publication is a projection, never an independent editable statement that can contradict the ledger.

## 6. Reading and publication rules

### Daily

After an accepted explicit reading mutation, update Today, Journey and relevant feed projections. A completed assigned component creates/updates the daily card. Remaining unfinished components do not create completed claims. Count a member once only when all required daily components are complete; a card can exist while the daily complete-member count excludes them.

Partial readings remain available in private history and weekly celebration even when they do not qualify for a daily completed-component card. Outside-plan reading does not count toward the committed daily total or this community program’s weekly summary. If future product scope includes supplemental reading, expose it explicitly rather than silently mixing it in.

### Weekly and celebration

- Include each member with **any positive eligible confirmed reading** in the interval. Partial is included; no six-day streak or full-wird threshold is required.
- Counter label means participating readers celebrated that week, not completed khatmas or fully completed weekly prescriptions.
- Keep stable presentation order (e.g. latest meaningful reading timestamp, stable ID tie-breaker); no sorting by volume, hearts, level or completion rank. Paginate without repeating/skipping members.
- Separate metrics: complete Quran khatmas; complete surah readings; complete juz identities/ranges; partial exact readings; active reading days. Show enough provenance to render factual Arabic summaries.
- **A full Quran khatma requires the engine’s full canonical coverage proof**, not 30 labels, 30 days, Baqarah readings or a percentage. Name the proof’s cycle and completed-at week; if a monthly cycle completes during a week, say a khatma completed that week, not that all its reading occurred within the week.
- A surah completion is labeled “قراءة كاملة لسورة …”, never “ختمة كاملة” alone. Count repeat completions only with the engine’s approved repeat semantics. Union overlapping acts; duplicate retries must not inflate any total.
- Juz totals must use canonical boundaries and real coverage, not ayah-count division or task labels. Distinguish additional assigned juz from overlapping surah coverage; do not imply disjoint additive totals when the same verses contributed to both.
- Partial progress uses exact ranges/counts or a neutral effort summary, without shame or assigning fractional rewards.
- Current preview aggregates only known B/BI and Baqarah commitment records, deduplicated per day; it does not calculate real juz totals or Quran khatma proof. Juz/khatma examples are explicitly fictional. The server must supply the full model for all approved programs.

### Corrections, late sync and reactions

Recompute affected original days/weeks when a range is corrected, reopened or retracted. Remove invalid completion/khatma claims and adjust counts atomically. Withdraw the weekly card if no qualifying activity remains. Keep stable card IDs so surviving cards retain reactions; if restored, follow a documented reaction-retention policy. Corrections are not a new public achievement at today’s date.

Saturday is a presentation milestone, not an immutable accounting freeze. Archive the week at Sunday rollover but allow versioned later corrections/offline sync to its original occurrence week. Background projection jobs must be idempotent, recoverable and monotonic by source revision. Ignore stale events; out-of-order delivery must not resurrect retracted reading. Return projection revision/state to avoid mixing a new count with old cards.

The founder’s automatic app-community flow supersedes the initial manually reviewed group-share design. Private notes, course answers, dhikr and unrelated readings remain private. Production onboarding/settings must explain the automatic community scope; implement visibility/removal and account lifecycle without adding a per-post send button.

## 7. Feed, weekly history and reaction API

| Proposed endpoint | Response contract |
|---|---|
| `GET /community/context` | Server time, Mecca day, week start/end, celebration status/start, next rollover, scoped community, approved ayah reference/text version, applicable rest-day policy |
| `GET /community/check-ins?day=&cursor=&limit=` | Daily cards + cursor, day/scope/projection revision; existing proposal retained |
| `GET /community/days/:day/summary` | Unique complete-wird count; not all partial participants |
| `GET /community/weeks/:weekStart?cursor=&limit=` | Weekly participant cards, participant count, in-progress/celebrating/archived status, cursor and projection revision |
| `GET /me/wird-weeks?before=&limit=` | Private newest-first archive with weekly summaries, level segments, own weekly reaction state and a next cursor; current week included |
| `GET /me/wird-weeks/:weekStart/days` | Descending dates, canonical completed/partial readings, level segments, original daily post IDs/reactions, corrected/retracted state as appropriate |
| `GET /community/check-ins/me?day=` | Own daily post independent of public-feed pagination, or explicit no-post state |
| `PUT /community/reactions/:targetType/:targetId` | `{ reacted: true/false, mutationId }`; authenticate viewer, authorize visible target, return canonical `heartCount`, `viewerReacted`, revision. Target type is `daily` or `weekly`. |
| Change stream or cursor polling | Upsert/withdraw/count/reaction changes, monotonic resumable cursor, reconnect/deduplication behavior |

All lists need bounded limits and opaque cursors, stable tie-breakers, no ranking. Fetching one’s archive is private; membership checks still apply to public reaction targets. Include empty, unavailable, loading/retry, expired-session and withdrawn-target responses. No error may be replaced by fabricated sample data in production.

### Example weekly response shape (illustrative schema, not real proof)

```json
{
  "id": "weekly:member-123:2026-09-27",
  "weekStart": "2026-09-27",
  "weekEnd": "2026-10-03",
  "timeZone": "Asia/Riyadh",
  "status": "celebrating",
  "member": { "id": "member-123", "displayName": "اسم العضو", "avatarUrl": null },
  "levelSegments": [
    { "tierId": "BI", "colorToken": "level.BI", "effectiveFrom": "2026-09-27T00:00:00+03:00", "effectiveTo": null }
  ],
  "readingDays": 3,
  "facts": [
    { "kind": "surah_completion", "surahId": 2, "count": 2, "proofRefs": ["coverage-a", "coverage-b"] },
    { "kind": "partial_reading", "ranges": [{ "from": "3:1", "to": "3:35" }], "uniqueVerseCount": 35 }
  ],
  "quranKhatmas": [],
  "heartCount": 12,
  "viewerReacted": false,
  "revision": 4,
  "updatedAt": "2026-10-02T20:30:00Z"
}
```

A `quran_khatma` fact requires a real `KhatmaRecord` reference/proof and completion timestamp. A `juz_completion` fact requires explicit juz IDs, canonical reference version and coverage proof. Return human-readable Arabic labels from approved content or let the frontend derive them from these typed facts; never derive proof from display text.

## 8. Reader, Journey and settings integration

- Pin the edition/reference/map versions used by all ranges, fixed page images and navigation. Frontend currently bundles original fixed-page assets; verify production hosting/rights and cache/version behavior.
- Private resume/bookmark endpoints save position independently of actual reading. Opening a page, swiping, listening, idle time and scroll do not post to reading acts or award credit.
- Bind Journey’s calendar/ship/khatma data to the same authenticated member and server revisions as Today. Keep `null` credit/carry values distinct from zero. Do not implement unknown carry rules in UI.
- Persist name/avatar, level requests, reduced motion, text size and notification preferences per account. Confetti can be disabled locally immediately and should follow saved motion preference across devices. OS reduced-motion wins.
- The Saturday ayah changes once per week from approved full references. Preview uses 53:39 and 76:22 from the pinned Quran dataset. Do not generate or truncate scripture; return approved references and versioned text. It is a shared ayah, not a personalized claim about divine reward.

## 9. Learning and library services

Use the detailed course request table in `BACKEND_HANDOFF.md` as the endpoint specification. Required scope:

1. Published catalog and member enrollments, weekly/single-class format, course and lesson thumbnails, ordered modules, access state and resume destination.
2. Authorized video playback URL/expiry, captions/transcript/resources, real durations, published/withdrawn versions and licensed assets.
3. Separate resume position from completion. Authoritative lesson/watch policy; the current demo’s ended-event is not production proof.
4. Private notes/bookmarks, versioned question drafts, required answer submission. No invented quiz score/pass threshold for reflective questions.
5. Next module requires all preceding required lessons and submitted answers. Reject direct API access to locked lessons; do not rely on hidden links. Define how editing answers or reopening prior lessons recalculates access.
6. Search library titles/topics/transcripts with approved metadata, source attribution and entitlement checks. No hallucinated answers or transcript hits.
7. Production founder role grants test access without fabricating lesson or reading completion. Reading/private history remain available if paid-course access expires.

Real trainer content, final questions, pricing/payment-provider decisions and media rights remain product/content dependencies. Do not ship sample silent videos as actual course content.

## 10. Failure, offline and security behavior

- Reuse the engine’s `mutationId`, stable logical act IDs and expected revisions. Persist identical retry payloads; a retry cannot be a new reading or extra heart. Return current projections after a historical stored receipt.
- Partition queue/cache by authenticated member; log out locks access and prevents another account’s pending mutations being sent under the new session. Synthetic founder data is never auto-migrated.
- Accepted-but-not-yet-projected, offline-pending and server-rejected states must be distinguishable. Roll back or reconcile optimistic capsules/hearts on failure and offer retry.
- Reconnect fetches authoritative state/cursors and handles 409 conflicts without silent overwrite. Late acts preserve validated original occurrence identity.
- Validate all ownership, visibility, upload contents, assignment versions and ranges on the server. Rate-limit authentication, writes and reactions. No credentials or private reading ranges in routine logs.
- Add shared-content removal/report handling and staff authorization appropriate to the closed app community. No public unauthenticated archive or user enumeration by guessed IDs.
- Define storage/backups, restore procedures, asset cleanup, monitoring and support diagnostics before launch. These are production backend tasks, not features implemented by the local preview.

## 11. Delivery order and definition of done

### A. Identity and authoritative reading

Deliver an account/session sandbox, `/me`, profile/avatar flow, current/pending commitment and effective-date fixtures. Bind Today to approved assignments and implement reading/correction writes. Demonstrate two separate members, session expiry, cross-account isolation, overlapping ranges, repeat retry, retraction and Saturday policy responses.

### B. Daily community

Implement durable projection/outbox, unique full-wird counts, shared daily cards, hearts and own-post lookup. Demonstrate real updates across two browsers and correction/count propagation. Replace sample/local projection only after this passes.

### C. Saturday and أورادي

Implement typed weekly facts, eligible partial participants, Saturday activation, archive pagination, daily drill-down, historical level segments and weekly hearts. Demonstrate a full khatma proof, a surah-only reader, a partial reader, a level change and a late correction. No member is omitted just because their week is incomplete.

### D. Learning and final app connection

Supply actual licensed content, course permissions, module gates, note/progress/answer APIs and reader preferences. Connect Journey and settings to the same account. Preserve founder test access in the authorized environment.

### Acceptance cases to deliver as executable tests and fixtures

- Friday 23:59:59 → Saturday 00:00 and Saturday → Sunday in Mecca, including month/year boundaries and device in Brisbane.
- Partial-only member appears in Saturday participants and own archive but not the daily fully-complete counter.
- Two completed components create one daily person/card, not two; week participant count also remains one.
- Same-day overlapping ranges, retries and duplicate events do not inflate complete surahs/juz/khatmas. Approved explicit repeats remain distinguishable.
- Baqarah alone never becomes a full Quran khatma. A cross-week cycle khatma is attributed to its completion week without claiming all reading occurred there.
- Retraction downgrades/removes the right original daily/weekly facts and corrects counters; no stale khatma remains. Reacted surviving cards retain identity.
- Level change preserves earlier colors and includes split-day/week segments. Pending next-Sunday change never colors Saturday history early.
- Newest-first cursor pagination has no missing/duplicate weeks or members under concurrent updates. Own post is retrievable beyond public page one.
- Heart on/off retry is idempotent across devices; aggregate + viewer state reconcile on reconnect; daily/weekly reactions are independent.
- Zero activity yields a neutral empty state; rest Saturday is not failure. Missing policy/proof is explicitly unknown, not zero or complete.
- Profile photo replacement/removal propagates without creating a reading event or changing its time. Expired upload/playback URLs recover safely.
- Account logout/switch, unauthorized post/reading access, direct locked lesson access and malicious client founder/tier/count overrides are rejected.
- Reader page opening/swiping creates no reading record; course completion cannot award Quran credit.
- Course prerequisite and required-question enforcement survive direct requests, revisions and retries.

Deliver an updated OpenAPI/schema, sample fixtures with no personal data, migration notes, sandbox accounts, an environment/config guide, stable error codes, and automated test results. The frontend needs those concrete contracts to replace local state screen by screen.

## 12. Remaining decisions to resolve without blocking independent work

- Apply/version the latest Saturday rest-day policy across the intended program tiers and reconcile it with existing engine prescriptions and historical snapshots.
- Confirm production identity provider/login method, community membership boundary, and deployment/session environment.
- Approve any still-unresolved tier schedules, cadence changes, repeat-khatma semantics and ship carry policy; keep unknown states until then.
- Supply approved course content, entitlements/prices if sold, media rights and assets.
- Decide any migration of existing local browser records explicitly; do not silently publish/import founder test history.

The weekly window above and motion style are working frontend choices. The app remains a local prototype until real identity, writes, shared projections and content are connected and tested.
