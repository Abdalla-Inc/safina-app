# Backend connection review · 29 September 2026

## Inspected

`Back End/README.md`, `contracts/API_HANDOFF.md`, calendar/ship/khatma fixtures, `safina/api.py`, status evaluation in `safina/domain.py`, and the synthetic demo launcher/provisioner. Confirmed the existing service at `127.0.0.1:8765` responds with contract `0.3.0`. No backend implementation or real account data was edited.

## Connected now

The Journey source selector offers **الخادم · BJ2 تجريبي**. It loads the real local service's `/health`, `/calendar`, `/ship-progress` and `/khatmas` for the pre-existing synthetic `demo-BJ2` account. Calendar dates and selected-day ranges, monthly reading log, approved day total, and proven khatma records use those responses. Browser-local prototype readings are neither uploaded nor mixed into those results.

Observed live: 1 approved day; September 1 is `completed`, with coverage `2:1–2:286`. The UI adapter maps `completed` to its `complete` display class. Server `null` credits and unresolved states remain distinct. The current-ship/carry policy is unresolved, so the server view shows the authoritative approved-day total beside a decorative ship, without inventing current-ship progress or lifetime ships.

`server/local-backend.js` is a development-only, read-only Vite bridge. It uses the existing synthetic credential file server-side, refuses non-synthetic credentials, fixes the upstream to loopback, restricts endpoint paths, denies writes and cross-origin requests, and requires a custom request header. No bearer token is sent to browser JavaScript, stored in frontend state, embedded in the production bundle, or printed in logs. The bridge is not installed by production preview/build; a production account/session transport remains required.

The bridge also allows `/today`, `/program-rules` and `/quran/reference` for the next integration slice; these are **not yet bound to the Today/Reader UI**. A server failure displays a retry state, never substituted illustrative data.

## What the backend already supports

- Private member-scoped Today assignments, range-based reading ledger, exact union coverage, revisioned corrections/retractions, idempotency and conflict responses.
- Reader trace observations separate from explicit member confirmations.
- Calendar, approved credits and khatma proof; unresolved rule decisions explicitly marked.
- Separate dhikr goals/counts and reminder preferences (delivery is not implemented).

## Remaining frontend connection work

1. Bind all relevant screens to one authenticated member/session and server civil date. The prototype currently uses a fixed illustrative date and local tier; do not silently attach those records to `demo-BJ2`.
2. Replace local Today evaluation with immutable server assignment IDs, rule/reference versions and authoritative responses.
3. Implement actual reading writes, corrections and retraction using stable logical IDs, mutation UUIDs and expected revisions. Persist identical retry bodies and handle 409 conflicts/possible duplicates without silently creating another act.
4. Reader trace integration is deferred by the latest founder direction. The fixed-page reader has no recording or confirmation UI; opening, swiping and bookmarking never create reading credit.
5. Add explicit account-specific offline queue/reconciliation and a deliberate migration flow if existing browser-local records should be imported.

No write adapter is enabled in this update. Existing manual recording and prototype corrections outside the reader still save locally. Read-only server preview is labeled and separated at the source selector/footer.

## Backend/content work still needed

- Approved Quran text/edition mapping and licensed audio/captions; `/quran/text` is gated. The existing pinned frontend Quran dataset remains unchanged and is not relabeled as backend-approved text.
- Classroom delivery/quiz grading, library rights/search and community publication remain policy-gated; draft schemas do not imply member-ready endpoints. The multi-course requirements in the handoff still apply.
- Ship carry/current-ship presentation, partial-credit and other unresolved policies must remain explicitly unresolved where returned.
- Production authentication/session/transport and deployment configuration.

## Initial redesign verification (before the fixed-page update)

28 frontend tests pass, including text checksum/range integrity, course prerequisites, reader search/window boundaries, backend state vocabulary/nullable values, failed requests, and bridge write/origin/path rejection. Live browser verified calendar selected-day coverage and monthly log. Mobile reader tests verified saved verse, Arabic-number search, juz 2 at `2:142`, jump to `2:255`, and a confirmation dialog with exactly `255–255` before any save.

## Fixed-page reader follow-up

The latest reader uses locally bundled Quran Android Madani v8 pages. Its 604 page-start references were compared directly with `data/reference.json` and match exactly. The backend reference remains a boundary contract, not a replacement for edition-specific page assets. The current reader does not call trace or reading-act endpoints. Resume position and bookmarks remain device-local preferences. See `MUSHAF_READER.md` and the updated `BACKEND_HANDOFF.md` for the new UI and preference/asset needs.
