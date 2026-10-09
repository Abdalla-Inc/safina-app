# Frontend integration contract — v0.3.0

Use [openapi.json](openapi.json), [schema.json](schema.json) and [fixtures/](fixtures/). These files describe the actual local service; fixtures come from executable service calls. All seven tiers have a Today fixture. BJ3/BJ4/BJ5 fixtures have unresolved daily targets, not fabricated prescriptions.

## Daily flow

1. Authenticate with the member's bearer token. Fetch `GET /program-rules` and `GET /today` (optional historical `date`). Today returns immutable assignment/segment IDs, inclusive `surah:ayah` ranges, component IDs, cycle dates, observed traces, logged evaluation and factual next-unread/remaining coverage.
2. A direct row is a deliberate self-report: send `POST /reading-acts` with `source: component_self_report`, `componentId`, the exact component ranges and a stable `logicalActId`. A gesture is not passive verification. Partial reading uses exact whole-verse ranges with `manual`, `manual_physical` or `reader_confirmed` source; no page or elapsed-time percentage is accepted as reading.
3. Reader exposures/navigation go to `PUT /reading-sessions/{id}/trace`. The observation list is a replacement snapshot of that session's observations, protected by `expectedRevision`. Exposed/navigated ranges are a suggestion; page-open and audio events never become suggested reading or credit. The member may confirm any truthful shorter/longer range using `reader_confirmed` and `traceId`. Trace and actual revisions stay separate.
4. `PATCH /reading-acts/{id}` changes the actual range with `expectedRevision` and a reason. `POST /reading-acts/{id}/retract` undoes an act. Correction of occurrence date, source or assignment requires retraction and a new explicit act; those identity fields are not silently reinterpreted. The correction response includes the recomputed day and ship plus a neutral explanation. Refresh `/khatmas` and `/calendar` after changes.
5. Display `colorToken`/label/pattern from `historicalLevels` separately from `status`. They are tier category identifiers; the frontend owns actual colors. A split day keeps both historical tiers.

Every mutation body is JSON and carries a fresh `mutationId` UUID. Save the logical act ID and mutation UUID before offline sending. Retries of the **identical** operation/body return the original stored receipt, even if a later correction changed the act. Refresh GET endpoints for current derived state; an old receipt is not a current progress snapshot.

## Fields that must not be inferred

| Field/state | Meaning |
|---|---|
| `dayCredit: 1` | All of one approved daily prescription was explicitly reported. |
| `dayCredit: 0` | Resolved no-credit outcome, such as no entry, supplemental-only, or a free day. It removes no earned history. |
| `dayCredit: null`, `creditState: awaiting_policy` | Credit cannot yet be decided. Never convert to zero, half, or complete. |
| `status: partial` | A strict subset of an approved assignment was reported. Fractional rewards are not approved. |
| `status: recorded_awaiting_policy` | Actual reading is saved but schedule or mixed-day accounting remains unresolved. |
| `status: free_day` | Rest/catch-up/voluntary day, never a failure marker. Monthly groups' 31st and BJ5 Saturday are explicit. B/BI remain daily prescriptions. |
| `reader_suggestion` | Provisional observation; has zero credit and no khatma proof. |
| `member_confirmed` | Member self-report, not sensor-verified reading. `manual_physical` remains an explicit source. |
| `uniqueCoverage` vs `repeatedActs` | Union of actual verses versus explicit additional reading acts. Repeated labels never create acts. |
| `assignedFulfilment` | Exact matched verse counts/ranges. These are not word-weight fractions or spiritual measures. |
| `supplementalReading: null` | Cannot classify supplemental reading without an approved target. Empty array means known none. |
| `nextUnreadVerse` | First canonical gap in logged coverage of the current cycle, not last opened page. B alone leaves 1:1 unread. |
| `KhatmaRecord.proofHash` | Proof over pinned reference, active act IDs/revisions/ranges and cycle. Assignment is never evidence. |
| `approvedCredits` | Sum of resolved full-day credits across the ledger, excluding unresolved days. |
| `completedShipsWithinPeriods` | Ships provable from 30 approved credits within the same calendar month; no boundary carry assumption. |
| `currentShip`, `lifetimeShipCount: null` | Cross-period carry/presentation remains open. Do not calculate these independently. |
| `paused` | Reserved contract state. Pause writes are gated until policy approval, so the current service never fabricates a pause. |

Monthly cycle identity is `monthly:YYYY-MM-01`; weekly identity is `weekly:<Sunday-date>`. Responses are member-scoped; do not treat the same textual cycle ID across two members as shared proof. Assignment IDs additionally pin member, date, commitment, rule/reference and schedule template. A schedule's group is its tier and its date. A month's first proven full coverage can establish one khatma; additional simultaneous/repeated khatmas are explicitly unresolved.

## Endpoint behavior

| Endpoints | Permission, errors and offline behavior |
|---|---|
| `/program-rules`, `/quran/reference`, `/quran/page` | Authenticated read. Reference/page edition and version are pinned. Unknown page mappings return `PAGE_MAP_NOT_AVAILABLE`. Text is gated. |
| `/today`, `/calendar`, `/day-evaluation`, `/ship-progress`, `/khatmas` | Private member-only read; server computes authoritative state. Calendar is bounded to 366 dates. Current Today uses member's IANA zone. No server today assignment can be requested for a future date. |
| `POST /commitment-changes` | `expectedCommitmentId` prevents conflicting changes. Nonweekly → nonweekly is same day; weekly → weekly queues next Sunday. One pending change at a time. Cross-weekly-cadence changes return `RULE_NOT_APPROVED`. |
| `POST /reading-acts` | Member owns snapshot/trace/repeat origin. Required occurrence date/instant/zone/offset must agree. Future acts, empty ranges and stale/incompatible snapshots are rejected. Unresolved schedules still permit exact actual logging. |
| `PATCH`, `/retract`, `GET /reading-acts/{id}` | Own act only. Range corrections/retraction are revision-checked; GET includes revision history. Retraction is terminal for that logical act. |
| Reader trace PUT/GET/discard | Private, revision-checked. One trace can be linked to one actual act; subsequent changes use that act's revision. Discarding a trace never retracts a confirmed act. |
| `/offline-snapshot`, `/offline-snapshot/verify` | Private HMAC envelope pins rules/reference/assignment. Server-only integrity verification; no public-key offline client verification in this slice. Normal POST logging checks server snapshot ownership and versions independently. |
| `/dhikr`, `/dhikr/goals`, `/dhikr/counts` | Separate member goals and absolute actual counts with revisions. Never adds reading/ship credit. No hard-coded religious target. |
| `/entitlements` | Reading/calendar/ship/dhikr free; paid capability state and price are unset. No billing. |
| `/reminder-preference` | Saves opt-in preference only. Delivery is `not_implemented`; no guessed frequency/retention behavior. |
| `/events` | Own replay events only. Not a shared feed. Local slice is unpaginated; production pagination is outstanding. |
| Group consent/membership/publication, pauses, classroom grading, library search | `409 RULE_NOT_APPROVED` with a specific question. No side effect, even if the client supplies an apparent consent. For gated POST endpoints send `{}` as the JSON body. |

## Conflicts and errors

Errors have `{"error":{"code":"…","message":"…",…}}`. Invalid JSON is 400; missing/invalid token 401; cross-member signed envelope 403; inaccessible own-resource lookup 404; policy/snapshot/revision/idempotency conflict 409; unsupported media 415; field/date/range validation 422; missing signing configuration 503. Body size is limited to 128 KiB. Unknown request properties are rejected on active mutations.

A same UUID/different body gives `IDEMPOTENCY_CONFLICT`; concurrent edits give `REVISION_CONFLICT`. `ACT_ALREADY_EXISTS` protects the stable logical ID across manual/reader retries. An identical same-day range with another logical ID gives `POSSIBLE_DUPLICATE`; the member must choose the existing act or explicitly identify a real repeat. Partial overlapping acts remain separate truthful reports but unique coverage and daily credit are unioned. No content-matching heuristic can know whether a human actually repeated a reading.

An old segment's late offline act is accepted only if its occurrence instant falls in that segment. An act occurring after a switch against the old assignment gets `STALE_ASSIGNMENT`. Versions get `INCOMPATIBLE_SNAPSHOT` rather than silent migration. Client previews cannot authorize new production schedules.

## Time and replay

Occurrence date is distinct from sync/created time. Civil month/week boundaries use IANA dates, including 23/25-hour DST days. Zone/offset contradictions fail validation. A member's primary zone is fixed for this local slice; a truthful report in another zone is retained with credit/khatma attribution gated by `pause_travel`. Timezone changes are not silently implemented. Corrections keep the original identity/date and rebuild affected derived records from active revisions.

All private write transactions atomically append events, immutable record revisions, derived snapshots and the idempotency receipt. Derived reads can be regenerated from events with `python3 -m safina replay <member>`. Earlier proof/evaluation snapshots remain auditable; current responses use active revisions, never the historical mistaken proof.

## Draft module boundary

The local `draft` CLI accepts versioned schemas for ten-week courses, ordered lessons, source video/rights review, authored/versioned notes, saved notes, quiz questions, written responses, assignments, feedback, resumable progress, media provenance/rights/transcript review, entitlement drafts, circles, opt-in memberships, consent, publications, reactions and moderation events. All remain `draft`, `publicationStatus: blocked`.

These records support independent content preparation. They are **not** a working learning platform, public search index, paid-access grant system or group feed. There is no member publication endpoint that bypasses the founder policy gate. Sharing correction/retraction/retention behavior must be approved before any private act can produce a real group publication.
