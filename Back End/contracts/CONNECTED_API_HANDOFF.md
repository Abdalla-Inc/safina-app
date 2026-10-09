# Connected app API — v0.5.0

Current additions and migration instructions: [October delivery](../docs/OCTOBER_DELIVERY.md). The sections below describe the original v0.4 foundation; the October document supersedes its reading-only/heart-only and old setup descriptions.

The connected service runs at `/api/v1` on the frontend origin. Its local upstream is `127.0.0.1:8766`. The existing bearer-token development API on 8765 and `/api/local` remain separate. Nothing imports browser preview records into connected accounts.

Machine-readable contracts: `connected.openapi.json`, `connected.schema.json`, and `connected-fixtures/`. Legacy `openapi.json`, `schema.json`, and `fixtures/` still describe v0.3. Contract fixtures use disposable synthetic accounts, never live data.

## Identity and transport

- `POST /auth/register`, `/auth/login`, `/auth/verify`, `/auth/recover`, `/auth/reset-password`, `/auth/google`.
- `GET /auth/session` restores an existing session. `POST /auth/refresh` rotates the opaque cookie and CSRF token while retaining the original seven-day absolute limit.
- `POST /auth/logout` revokes all local app sessions for that member. It does not sign the person out of unrelated Google services.
- Successful login/verification returns `{memberId, csrfToken, expiresAt, mode}`. `safina_session` is HttpOnly, SameSite=Lax, scoped to `/api/v1`, and Secure on HTTPS. Passwords and provider tokens never enter browser storage. Supabase access/refresh tokens are encrypted in the server database with the stable server key.
- Every mutation requires the exact configured `Origin`. Authenticated mutations also require `X-CSRF-Token`. Cookie authentication determines ownership; a client-supplied member or founder role grants nothing.
- Domain mutations carry a UUID `mutationId`. Retries must retain the original method, path and exact body. Reusing an ID with a different payload gives `IDEMPOTENCY_CONFLICT`. Profile, learning, bookmark and reaction writes use optimistic revisions. Reading component writes use `expectedInputHash` from Today.
- A 401 means the session must be refreshed or reauthenticated. A 409 is a reconciliation requirement, not permission to replace the expected revision blindly. Errors use `{error:{code,message,...details}}`; browser-facing messages are Arabic. Request limits, verified email, origin/CSRF checks and per-account rate limits are enforced.

In sandbox mode, registration and recovery write only to the local mailbox, available through the staff CLI. They do not send emails. Google explicitly returns `AUTH_PROVIDER_NOT_CONFIGURED`. Live mode uses Supabase email/password and Google PKCE. Provider calls are mocked in tests; live OAuth/email delivery still needs configuration and an actual smoke test.

## Account and reading

| Route | Purpose |
| --- | --- |
| `GET /me` | Own profile, email, server permissions, effective/pending commitment and community scope |
| `PATCH /me` or `/me/profile` | Name, locale, text/motion preferences, community visibility |
| `PUT /me/avatar`, `DELETE /me/avatar` | Expected profile revision; JSON base64 upload, JPEG/PNG/WebP up to 10 MiB, actual image validation and fresh metadata-free JPEG up to 256 px |
| `GET /me/commitment`, `/me/commitment-history` | Current, pending and immutable historical segments |
| `POST /me/commitment` or `/commitment-changes` | Expected commitment ID + pinned rule version; weekly changes queue next Sunday; cross-cadence remains gated |
| `GET /today?date=YYYY-MM-DD` | Pinned assignment, component coverage, day evaluation, rule gates, Mecca day, server time and projection cursor |
| `PUT /today/components/{id}` | Deliberate whole-component report or atomic reopening; original earlier partials retained where possible |
| `POST /today/partial` | Exact canonical ranges within the snapshot's eligible scope; overlaps with existing reports are not duplicated |
| `GET /me/reading-acts?day=YYYY-MM-DD` | Own original acts/revisions, including retracted acts |
| `PATCH /reading-acts/{id}`, `POST /reading-acts/{id}/retract` | Correct a current revision; original day, rule version and occurrence identity remain fixed |
| `GET /calendar?start=...&end=...`, `/ship-progress`, `/khatmas` | Engine results. Null/awaiting-policy is not zero or completion |
| `GET /reader`, `PUT /reader` | Private 604-page resume/bookmarks with revision checks. Never creates a reading act |
| `GET /me/export`, `POST /me/deletion` | Private export and explicit deletion request |

Component completion sends `assignmentId`, `expectedInputHash`, `completed` and, for a positive report, `occurredAt`, original `occurrenceDate`, IANA `timezone`, and `utcOffsetMinutes`. The server derives/checks assignment day in Asia/Riyadh; it never rewrites a delayed report to receipt day. Partial writes use the same occurrence data plus `ranges:[{start:"2:1",end:"2:10"}]`. They store `assignmentDay` and `communityDay` separately from device occurrence date.

The frontend queues only unacknowledged reading mutations after network failure, under a member-specific key. Explicit retry preserves the UUID, original snapshot, range, occurrence and expected input hash. It shows pending/conflict separately from saved reading. Logout/deletion clear connected private queues; preview data stays separate. Session expiry hides private views and retains the member-bound queue for reauthentication. Reader and learning writes currently require connectivity; they show failures instead of claiming success.

## Versioned calendar policy

New connected commitments use `founder-community-2026-09-29.v2`. All seven levels rest on Saturday. Sunday starts the week in Mecca; Saturday begins celebration. Original v1 commitments/snapshots retain their rules. No retrospective migration or fictional backfill occurs.

Saturday voluntary eligible coverage may update the same week's facts without day credit. For monthly cycles, normal Saturday catch-up can contribute to coverage; the unresolved day-31 attribution policy remains gated. Removing Saturday requirements does not invent a redistributed monthly grid. BJ2/BJ3 exact continuation grids, fractional credits, some weekly day targets, cross-cadence changes, repeat completion counting and ship carry remain explicitly unresolved.

## Community projections and pagination

`GET /community/context` returns server time, authoritative day/week, timezone, rollover instants, rest policy and projection cursor. Its ayah slot contains references only while text/source approval remains outstanding.

- `GET /community/daily?day=...&cursor=...&limit=20`: completed assigned components only. `completeWirdMemberCount` counts distinct fully complete members; a partial-only participant does not enter that count.
- `GET /community/weekly?weekStart=...&cursor=...&limit=20`: any positive eligible reading participates. Facts discriminate `surah_completion`, `juz_coverage`, and `partial_reading`. Only proven whole-Quran coverage emits `quran_khatma`, with a completion-week attribution note where coverage spans weeks. Overlapping juz/surah facts must not be added together as unrelated reading.
- `GET /me/community/weeks?before=...&limit=12`: own current and historical weeks, newest first. `nextBefore` is an opaque continuation token, not a date.
- `GET /me/community/weeks/{Sunday}/days`: private daily coverage, correction/retraction state and original daily posts.
- `GET /me/community/daily?day=...`: own card, including its withdrawn state.
- `PUT /community/daily/{targetId}/reaction` and the weekly equivalent: one heart per member and target, independent across daily/weekly. Request `reacted` is an absolute boolean, not an increment.
- `GET /community/changes?after=...&limit=50`: durable outbox cursor. Upserts contain current authorized cards; withdrawals contain no private reading payload. Polling clients must remove withdrawn targets and refetch on profile events. The initial frontend uses bounded periodic full refresh, with explicit refresh available.
- Reports and moderation: `POST /community/reports`; staff `GET /moderation/reports`, `POST /moderation/actions`. Staff role comes only from the server. Moderation hides a card without rewriting reading evidence.

Reading writes, current projections, idempotency receipts and outbox events commit in one SQLite transaction. A crash cannot acknowledge an event without its projection. Rebuild is available through `rebuild-community`; it reuses stable card IDs and does not publish duplicate unchanged facts. Corrections/retractions rebuild original days/weeks and withdraw invalid claims. No separate queue broker is required for this single-server implementation.

Pagination creates a viewer- and scope-bound snapshot of card IDs/revisions for 15 minutes. New arrivals do not reshuffle that traversal. A source correction, withdrawal or moderation change invalidating its cards returns `PROJECTION_CHANGED` (409); discard accumulated pages and restart. Profile display and hearts are current at read time; the snapshot revision identifies reading/membership pagination, not a historical snapshot of every heart. Cursor tokens are opaque and cannot be used by another account. No ranking endpoint exists.

## Learning

Published course versions are immutable. Staff publication requires explicit editorial and rights approval; sandbox content is rejected in live mode. The app's existing demo courses/videos are not real catalog entries.

- `GET /learning/courses?cursor=...&limit=20`, `/learning/courses/{courseId}`.
- `GET /learning/courses/{courseId}/lessons/{lessonId}` returns authorized playback, progress, bookmark, private note and resources.
- `PUT .../progress`, `.../note`, `.../bookmark`: UUID, expected revision, course version and exact fields from the schema.
- `PUT /learning/courses/{courseId}/modules/{moduleId}/answers` saves a draft; `POST .../answers/submit` submits. All prior required lessons and submitted required answers are checked server-side for every lesson/resource/write. Reopening progress or replacing a submission with a draft relocks dependent weeks.
- No grades, religious merit or watch-time threshold is inferred. Completion is only enabled if the course's explicit member-confirmation policy has been approved. Founder access bypasses locks for viewing, without fabricating progress or submitted answers.
- `GET /learning/library?q=...&cursor=...&limit=20` searches reviewed titles/tags/transcripts with Arabic normalization and actual access filtering.

Media uses a member-bound five-minute app ticket. Ticket redemption rechecks current version, enrollment and prerequisite access before obtaining a 60-second signed URL from a private Supabase Storage bucket. Revocation blocks new redemptions; a previously issued provider URL can remain usable until its 60-second expiry. No public permanent course-video URL is returned. Videos/resources remain unavailable until private storage and actual reviewed assets are supplied. Thumbnails and library source links are explicitly public content metadata.

## Account removal

Deletion immediately withdraws public cards, removes avatars and the account's hearts, revokes sessions and blocks sign-in. The receipt truthfully says `physicalErasure: pending_retention_review`. Immutable evidence, encrypted auth material, private work and backups are not silently erased under an invented retention policy. The founder must approve retention and the final purge process before a public launch. Export is available before requesting deletion.
