# Interface contract

> Latest 1 October requirements: [BACKEND_OCTOBER_HANDOFF.md](BACKEND_OCTOBER_HANDOFF.md). Country, custom reading, daily istighfar and emoji reactions supersede conflicting older requirements below. API v0.4 currently supports the earlier account/reading/heart flows; new authenticated mutations remain pending backend extension.

The maintained frontend-to-backend contract is [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md). It maps the actual inspected backend v0.3.0 fixture fields to screens, defines missing-state behavior, and separates reading, content and community publication requirements.

The executable frontend model is **local-only** at `src/data/model.js`. It is not an HTTP adapter or production habit engine. Contract snapshots in `tests/fixtures/` document what was inspected on 28 September 2026; backend changes require deliberate reconciliation.


## Course module update · 28 September 2026

The learning area now requires multi-course enrollment, course and lesson thumbnails, ordered modules and lessons, private per-lesson notes/bookmarks, playback resume, completion and versioned module-question drafts/submissions. Student access requires completion plus submitted required questions in all previous modules; founder preview remains open. See the detailed endpoint and mutation proposal in `BACKEND_HANDOFF.md`, “Course contracts requested”. Frontend state is a local prototype, not a production permission or completion authority.


## 29 September: live read adapter

`src/services/backend.js` validates contract 0.3.0 and loads calendar, ship and khatma projections. Map server `completed` to UI `complete`; never map null credit to zero or unknown status to no-entry. Keep `currentShip: null` and unresolved carry distinct from approved day totals. The synthetic dev bridge is read-only; frontend local writes and production member authentication are not connected. See `docs/BACKEND_CONNECTION_REVIEW_2026-09-29.md`.

## Fixed-page reader · latest founder feedback

Reader now renders 604 original Madani page images, with an index of 114 surahs / 30 juz, horizontal paging and tap-to-hide controls. Image-provider boundaries exactly match backend `tanzil-medina-604`. Production needs edition/versioned assets plus private resume/bookmark preferences, separately from reading coverage. Page navigation never creates observations, reading acts or credit. Recording UI and automatic following are absent by founder direction. See `docs/MUSHAF_READER.md` and the Qur’an reader assets section of `BACKEND_HANDOFF.md`.

## Today swipe checklist · latest founder feedback

Deliberate capsule crossing confirms an assigned component's full range; partial range entry is limited to that day's assignments and counts unique coverage only. Reopening is a correction, including when several partial acts produced completion. Production needs stable component/range IDs, atomic revision-checked correction and authoritative updated projections. No outside reading or fractional credit is added to Today; local mutation behavior and gesture decisions are documented in `docs/TODAY_CHECKLIST.md`.

## Community and learning navigation · latest founder feedback

Learning contains courses and library. Primary navigation is Today / Mushaf / Journey / Learning / Community; dhikr, circles and bottom More are retired. Automatic local check-ins replace manual per-post sharing: completed tasks aggregate to one member/day card, and full assigned-wird completion counts that person once. Today and feed use Mecca midnight boundaries. Corrections update/withdraw cards and counts. Production requires shared-feed, daily-summary, reaction and change-event endpoints; own-member `/events` cannot substitute for a shared feed. Full behavior and backend status: `docs/COMMUNITY_FEED.md` and `BACKEND_HANDOFF.md`.

## Community visual follow-up

Check-ins now consume a historical level snapshot, structured stacked readings, nullable profile avatar and separate aggregate/viewer heart state. The own-post filter needs a member/day lookup independent of feed pagination. Seven labeled samples demonstrate the seven existing levels; these are never production records. Photo selection is local-only. See the follow-up section in `BACKEND_HANDOFF.md`.

## Saturday celebration and أورادي · latest request

Community opens the weekly celebration on Saturdays in Mecca time, with a non-Saturday preview control. Weekly participants include partial confirmed commitment reading; the weekly count is participants, not complete-wird or khatma count. أورادي is now a newest-first weekly archive with expandable daily records and original colors. Daily and weekly reactions have separate stable targets. See [BACKEND_PRODUCT_BRIEF.md](BACKEND_PRODUCT_BRIEF.md) for the consolidated production contract and existing-engine gaps.

## Ship v0.5 and consistent Journey calendar · 1 October

Journey now hosts the approved lazy-loaded 3D renderer and one shared completion-status palette for all tiers. Connected state requires the proposed versioned `/ship-visual-state` route; no health is inferred from `/ship-progress` or calendar gaps. See [docs/SHIP_V05_INTEGRATION.md](docs/SHIP_V05_INTEGRATION.md) and the 1 October section of [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md).
