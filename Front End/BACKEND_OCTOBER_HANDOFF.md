# Safina — backend implementation handoff, 1 October 2026

This is the current starting point for the backend developer. It supersedes older requirements that excluded custom reading, limited reactions to hearts, or omitted country and daily istighfar. Read it alongside `Back End/contracts/CONNECTED_API_HANDOFF.md` (implemented API v0.4), `BACKEND_PRODUCT_BRIEF.md` (full product), and `docs/SHIP_V05_INTEGRATION.md` (animation contract). Do not rebuild services already delivered.

**Concurrent integration update:** the checked-in OpenAPI now identifies **v0.5.0**, with `/today/custom`, `/today/istighfar`, `/me/istighfar-goal` and custom-group correction/retraction routes. New connected frontend code also handles country setup and those individual writes. Their live end-to-end verification belongs to that integration workstream; the v0.4 status inventory later in this document is the earlier snapshot. **The combined atomic `/today/custom-wird` route below is not present in the inspected v0.5 contract.** Preserve the individual-write integration and extend it, rather than implementing it again.

## Latest review — community restoration and ship ownership

Read **[FRONTEND_BACKEND_OWNERSHIP.md](docs/FRONTEND_BACKEND_OWNERSHIP.md)** first for the current design/integration split, named custom-reading presentation, restored ayah/count, demo entry point, learning catalog state and the 30-day ship requirement. Connected community now uses the approved compact presentation and actual server reactions/counts. The authenticated ship endpoint still returns pending policy with null state; the 0–30 slider is explicitly a visual preview, not earned progress. No backend implementation was changed in this frontend review.

## Latest UI correction — clean Today in connected and preview modes

The founder reviewed the signed-in v0.5 screen and requested restoration of the earlier minimal layout. `ConnectedToday` now matches the quiet preview: date, assigned reading capsules, istighfar capsule, completed custom reading capsules when present, one **إضافة ورد مخصّص** action, and **ابدأ القراءة**. Removed from Today: tier/status toolbar, introductory paragraphs, separate partial/count buttons and raw correction cards. Original-day corrections remain available in Journey/week history. No reading evidence or history was deleted by this layout change.

The **same shared pop-up** now serves both modes. It shows a grid containing all 114 whole surahs, a switch to all 30 selectable juz, one numeric istighfar field with the suffix **مرة**, and one save button. Selection persists between grids. Search, explanatory copy and verse-range controls have been removed from this simple composer at the founder's request; old partial evidence remains supported by the data model/history. The istighfar amount is the absolute actual total for today, not an increment. Its target capsule remains partial below target and complete at/above target in both modes.

**Connected submission works now with v0.5's existing endpoints.** `src/connected/customWird.js` freezes each request's occurrence, mutation UUID and payload; acknowledged requests advance a cursor and are not repeated when resuming. An error keeps the pop-up open, preserves selections, disables editing the partially submitted batch, reports how many writes were confirmed and offers retry. A successful direct retry clears that mutation from the existing member-scoped pending queue. Earlier confirmed items can appear before later ones: this is explicitly a sequential v0.5 fallback, **not an atomic server transaction**. The proposed batch endpoint below remains the backend improvement needed for all-or-nothing publication. Do not replace the working individual endpoints or misrepresent partial confirmation as complete success.

Verification: submitted two full surahs, juz 30 and 20,000 istighfar through the signed-in local sandbox UI; confirmed Today and the community projection; retracted those temporary custom groups and restored the prior count of 50. One transient account-service failure during cleanup recovered on reload/retry. Build and **97 frontend tests** pass, including frozen payload, count replacement and partial-batch retry checks. No backend source was modified.

## Latest refinement: one custom-wird submission

The founder has replaced the two secondary actions with **إضافة ورد مخصّص**. The Today screen now has one composer entry point (the separate assigned-partial shortcut was also folded into it). This update supersedes references below to a separate istighfar editor or single-reading custom form.

- A searchable checklist contains all 114 surahs; another contains all 30 juz. Multiple, non-contiguous selections are allowed. Switching lists retains selections in both; a single submission may combine them.
- Whole surahs are the default. An optional disclosure allows exact start/end ayahs per selected surah, preserving partial reading without another Today button.
- The same form contains **عدد الاستغفار اليوم**, labelled as the actual **total completed today**, not an increment. It is prefilled from today's latest report. Blank leaves the existing count alone, zero corrects it to zero, and an istighfar-only submission is valid. A wholly unchanged count-only form cannot submit.
- On save, all selected evidence is committed together and the single daily community card updates automatically. The UI returns to Today so members see their crossed-off capsules; it does not force navigation away to the feed.
- Custom reading appears as completed capsules, with the same keyboard/checkmark/swipe undo. If its full coverage already completes an assigned-surah capsule, do not render a duplicate custom capsule for that surah.
- A positive custom istighfar total is shown crossed off as that **reported amount**. Below-target amounts show the original target quietly beneath them. `istighfarComplete` remains count >= target; checking off 45 reported repetitions does **not** claim a 100 target was met.

### Atomic API required for this combined form

Propose `POST /today/custom-wird` (not present in the inspected v0.5 contract), instead of making the browser chain several reading writes followed by an istighfar write. A single member-scoped `mutationId` must cover every selection and the optional total:

```json
{
  "mutationId":"UUID",
  "referenceVersion":"hafs-tanzil-1.0-20260928",
  "expectedReadingRevision":12,
  "expectedIstighfarRevision":2,
  "occurredAt":"2026-10-01T10:30:00+03:00",
  "occurrenceDate":"2026-10-01",
  "timezone":"Asia/Riyadh",
  "utcOffsetMinutes":180,
  "selections":[
    {"kind":"surah","surahId":18,"fromAyah":1,"toAyah":110},
    {"kind":"surah","surahId":55,"fromAyah":1,"toAyah":78},
    {"kind":"juz","juzId":1},
    {"kind":"juz","juzId":3}
  ],
  "istighfarCount":45
}
```

The proposed revision fields require a published day-reading revision in `GET /today`; agree its final name in the revised contract. If istighfar is omitted, do not require or mutate its revision. Reject the entire batch on any invalid selection, stale relevant revision, or persistence failure. Validate all selections before writing; use one transaction for evidence, derived coverage, daily/weekly projections, idempotency receipt and outbox. Return all stable act/group IDs and revisions, saved istighfar, current day and community cursor. Retrying the batch cannot duplicate coverage, total, or cards. The existing single-reading and istighfar routes described below can remain internal/specialist operations; they are insufficient alone for atomic composer submission.

New frontend tests cover mixed multi-select publication, repeat submission, invalid-batch rollback, partial ranges and unchanged/zero istighfar semantics. **93 automated tests pass.**

## Delivery status

The frontend preview at http://127.0.0.1:5178 is working in **المعاينة المحلية** mode. The previously unavailable screen was an account-service connection failure, not a failed Vite server. Preview and authenticated data remain separate. Never import fictional people, reactions, local permissions, or prototype reading into accounts automatically.

Implemented and testable in the local frontend:

- All seven levels in the welcome/setup flow; required country and positive daily istighfar goal. Both preferences also appear in Settings. Founder preview remains unlocked.
- Country name and flag beside each community member's name. 249 ISO country/territory codes with Arabic labels; no inferred location or invented founder country. Existing preview users can use “أضف بلدك”.
- Today: existing assigned-reading sliders, a separate istighfar slider, editable actual istighfar count, and secondary **إضافة قراءة مخصّصة** button below them.
- Custom reading: any of 114 surahs, complete or an exact verse interval; any contiguous range of 30 juz. Canonical juz boundaries expand into per-surah verse ranges, including juz 30 through 114:6. A member may add several reports. Group removal retracts the whole custom report.
- Day-scoped istighfar, target snapshot on first positive report, count correction including zero, and revision history. An old global dhikr counter is not imported as today's work.
- Automatic local daily card for custom reading or positive istighfar, even with an unfinished assigned wird. One member/day card, stable ID. Corrections change that card; removing its last fact withdraws it.
- Weekly أورادي includes explicit custom reading and istighfar; historical Quran coverage is unioned per day and surah. Istighfar-only days are activity days, not Quran reading days.
- Compact community cards; Telegram-inspired emoji/count pills, visible selected reaction, picker, toggle/remove, and one selected emoji per viewer/post. Initial palette: ❤️ 👏 🤲 👍 🔥. Existing preview heart selections migrate without double counting.

**Not connected yet:** current v0.4 registration/profile schemas reject unknown fields; custom readings outside assignment are unsupported; there are no istighfar endpoints; reactions accept only a boolean heart. New local preferences are therefore not silently submitted to v0.4 accounts. Connected signup still uses its existing server-supported level field. Connected cards can display `member.countryCode` when returned, and existing server hearts use the compact visual treatment. Country/istighfar signup and settings, custom logging and multi-emoji writes need the versioned API below and frontend adapter wiring. No backend source was changed in this task.

## Rules that must stay separate

| Fact | Meaning / counting |
|---|---|
| Assigned Quran completion | Only exact coverage of the pinned assignment. Determines the existing Quran streak/ship evaluation. |
| Custom Quran reading | Counts as recorded activity and contributes factual coverage. Eligible overlap may satisfy an assigned component; unrelated verses cannot substitute for it. |
| Istighfar completion | Actual count >= that day's target. Independent from Quran credit, Quran khatmas, and Quran streaks. |
| Community daily counter | Distinct members whose assigned Quran wird is complete. Custom-only/istighfar-only participants are visible but do not inflate this counter. Label it as Quran wird completion if ambiguity arises. |
| Weekly participation | Any positive recorded Quran reading or istighfar participates. Keep `readingDays` and `activityDays` distinct. |
| Repeated coverage | Union canonical ranges; do not sum overlapping surah/juz summaries. A repeated reading is not a new khatma without approved occurrence/cycle policy. |

Use Asia/Riyadh for day boundaries (00:00 Mecca), Sunday–Saturday weeks, and Saturday celebration. Preserve actual occurrence time and original day for offline retries. Saturday rest policy applies to assigned Quran; voluntary reading and daily istighfar may still be logged. No new religious merit or ranking score is requested.

## 1. Accounts and preferences

Extend versioned registration and profile schemas:

```json
{
  "displayName": "example member",
  "countryCode": "SD",
  "tier": "BI",
  "istighfarGoal": 100,
  "communityAcknowledged": true
}
```

The example shows new/domain fields only; existing email/password or Google identity requirements remain. Validate country against ISO alpha-2; store uppercase code, not an arbitrary flag string. Arabic/English display names and Unicode flags are presentation. Do not infer country from IP, GPS, timezone, language or nationality. Explain during setup that the selected country appears beside the public name.

- New accounts, including Google signup, complete country, level, and istighfar target selection.
- Existing accounts with no country get a setup-completion prompt; do not assign a default country.
- `GET /me` should return country, daily goal, profile revision, and setup status.
- Extend `PATCH /me/profile` with country using existing expected revision/idempotency semantics. Profile display is current on historical cards; changing country must not reorder the activity feed.
- Prefer a dedicated versioned `PUT /me/istighfar-goal` with expected revision. For an already reported day, keep the original target. Changes affect unreported days/new days. Do not reinterpret past success.
- Initial frontend bound: integer 1–1,000,000 target, actual 0–1,000,000. This is input validation, not a recommended religious amount. Server should return accepted bounds rather than silently clamp.
- Existing level changes continue through server commitment history and effective-date rules. Changing the UI selection must not rewrite historical assignment or level colors.

## 2. Custom reading

Proposed new route (not present in v0.4): `POST /today/custom`. Keep `/today/partial` for its existing assignment-only contract; do not weaken its checks silently.

```json
{
  "mutationId": "UUID",
  "referenceVersion": "hafs-tanzil-1.0-20260928",
  "occurredAt": "2026-10-01T10:30:00+03:00",
  "occurrenceDate": "2026-10-01",
  "timezone": "Asia/Riyadh",
  "utcOffsetMinutes": 180,
  "selection": {"kind":"juz","from":1,"to":1},
  "ranges": [{"start":"1:1","end":"1:7"},{"start":"2:1","end":"2:141"}]
}
```

For surah selection use `{kind:"surah",surahId:36,fromAyah:1,toAyah:20}`. Validate/expand the selection server-side and compare any supplied ranges against the pinned canonical reference. Do not trust a displayed label as evidence. An assignment may be absent or awaiting policy; custom evidence should still save without invented assignment credit. Any assignment coverage recomputation must use current authoritative snapshots.

Return stable custom group/act IDs, revisions, canonical ranges, community day, credited intersections if any, current day projection and community cursor. Record distinct report evidence, but derived daily totals union overlap. An exact retry with its UUID returns the original response; identical already-covered ranges never add another coverage credit.

- Correct/retract a custom group atomically with expected revision; keep its original day and audit trail.
- Removing custom coverage must recompute assigned coverage from remaining acts, preserving independently reported assigned reading.
- Reopening an assigned slider must define the intersecting evidence it retracts. Never delete unrelated surahs inside a multi-surah custom group. The local prototype preserves original entries, but production must implement range-aware correction atomically.
- Private history shows exact ranges and correction state; public cards can use concise factual labels. A partially retracted juz must not retain a full-juz claim.
- Pending/conflicted network writes remain visibly pending; do not publish or count before server acknowledgement. Queues retain original occurrence and UUID, scoped to the member as in current v0.4.

## 3. Daily istighfar

Proposed `PUT /today/istighfar` takes an **absolute actual count**, not an increment:

```json
{
  "mutationId":"UUID",
  "day":"2026-10-01",
  "expectedRevision":0,
  "count":150,
  "occurredAt":"2026-10-01T10:30:00+03:00",
  "timezone":"Asia/Riyadh",
  "utcOffsetMinutes":180
}
```

Return `{day,count,target,complete,revision,updatedAt}` and a refreshed community cursor. Add this object to `GET /today`. Server snapshots the valid goal, checks day/occurrence, and serializes concurrent device updates. Swiping complete reports at least the target; the number editor handles actual partial or above-target totals. Reopening sets count to zero, retaining revision history. Repeated same-value writes must not increase totals. Goal edits alone must not create a post.

## 4. Community and history

Extend current daily/weekly projections rather than adding a second feed:

- `member`: `{id,displayName,avatarUrl,countryCode}`. Never expose email.
- Discriminated `facts`: assigned completion, custom canonical coverage, and `istighfar_count` (count/target/complete). Keep existing `completedComponents` during migration.
- `completeWird` is assigned Quran completion, not `facts.length > 0`.
- `istighfarComplete` independent. Weekly `istighfarTotal` sums each day's latest absolute count, not revisions. `activityDays` includes dhikr-only days; `readingDays` does not.
- Stable daily member/day and weekly member/week IDs. Sort by meaningful activity change; profile/country changes are presentation updates, not new reading.
- Custom reports produce feed participation on any day, including Saturday, while assignment credit follows its own policy.
- Avoid showing a completed assigned surah twice if a custom report covers that same surah. Juz and surah facts may overlap; render as coverage descriptions rather than summing them.
- Retractions/corrections refresh original days/weeks, withdraw empty cards, update aggregate counts, and preserve reaction target identity when a card is revised.
- Preserve existing privacy scope, account visibility, moderation, deletion, outbox, snapshot pagination and cross-account protections. Weekly private history must not depend on public visibility.
- No comments, manual public-post composer, ranking, or leaderboard requested.

## 5. Telegram-style reactions

Use current target authorization, optimistic concurrency and idempotency. Extend the existing reaction routes in a new schema version:

```json
{"mutationId":"UUID","expectedRevision":4,"emoji":"👏"}
```

`emoji:null` removes the viewer's selection. Allow only the agreed palette initially. One selected emoji per member/target is the prototype policy; choosing another atomically replaces the first. Return `reactions:[{emoji,count}]`, `viewerReaction`, `reactionRevision`. Counts cannot be negative. Legacy `reacted:true` maps to ❤️ and legacy hearts must migrate once. Daily and weekly targets remain independent. A reaction must never alter reading completion or reorder posts. Deleted accounts' reactions must be removed as in the existing deletion flow.

Frontend reference: [Telegram reactions](https://telegram.org/blog/reactions-spoilers-translations?setln=en) and [Telegram API reactions](https://core.telegram.org/api/reactions). The prototype reproduces the familiar pill/count and emoji picker interaction, not Telegram accounts, assets, paid reactions, or Premium rules.

## 6. Remaining whole-app connection work

| Area | Existing / next backend delivery |
|---|---|
| Auth and profiles | v0.4 cookie/CSRF/session, verification, Google configuration, avatars, export/deletion exist. Extend required setup above; verify live provider delivery. |
| Today and Quran engine | Existing pinned assignments and partial/component writes; add custom and istighfar, preserve unresolved policy gates. |
| Mushaf | Existing resume/bookmarks. Fixed page renderer is frontend. Opening/swiping/listening never counts as completed reading. |
| Ship and calendar | Integrate `/api/v1/ship-visual-state` per `docs/SHIP_V05_INTEGRATION.md`, including maintenance/health lifecycle. All levels share completion-state calendar colors; no guessed health or credit. |
| Community | Extend existing transactional projections, context, pagination, moderation and reactions as above. |
| Courses/library | Existing v0.4 course/module/prerequisite APIs; add actual reviewed Coach Anas uploads/YouTube sources when owner supplies them. Preserve founder server permission, required answers and prior-week gates. |
| Video delivery | For uploads: validated media, processing state, thumbnails for courses/lessons, captions/resources, signed playback and access checks. For free YouTube content: canonical video ID/URL, embeddability and source metadata; do not download/rehost without rights. |
| Rollout | Publish revised OpenAPI/schema/fixtures and capability/version information. Wire frontend signup/settings, custom/day count forms and emoji requests only after that contract is available. No silent local success in authenticated mode. |

## Acceptance and hand-back checklist

1. Register and Google-onboard with required country, level, target; sign back in on another device and verify persistence.
2. Member changes country; existing daily/weekly cards show the new country without changing activity time. Unknown country shows a setup prompt, never a fabricated flag.
3. Read 36:1–20 while B is assigned: activity appears, B remains unfinished, complete-wird counter unchanged.
4. Report juz 1: exact 1:1–7 and 2:1–141; repeat/overlap does not double count. All 30 juz partition exactly 6,236 verses once.
5. Correct/retract a multi-surah custom act atomically; other reading stays intact and incomplete juz labels disappear.
6. Target 100; report 50, then 150, then zero: correct status and weekly total each time. No Quran credit. Changing target to 200 does not rewrite a previously logged day's target.
7. Test 23:59:59 → 00:00:00 Mecca, delayed retry, Saturday, next Sunday, and two devices racing on old revisions.
8. Custom-only and istighfar-only members appear in daily/weekly activity but not assigned-completion count. Hidden participation remains private.
9. Heart → clap → remove, retry identical mutation, concurrent reactions, hidden/deleted target: exact nonnegative counts, one viewer selection.
10. Validate profile/card privacy, pagination invalidation, outbox refresh, revision conflicts, logout queue clearing and no fictional preview imports.
11. Provide fixture accounts/cards covering every level, long names/countries, no photo, incomplete assignment, mixed Quran/istighfar, historical level changes and withdrawals.
12. Return updated machine contracts, endpoint examples, migration notes and a running sandbox URL. Frontend then switches the prepared local feature flows onto authenticated adapters and runs end-to-end tests.

Frontend verification for this delivery: production build passes; 93 automated tests pass, including ten daily activity/country/reaction tests. Mobile browser checks cover custom reading, actual istighfar count, country selection, local persistence, reaction selection and weekly history. Ship animation remains lazy-loaded; its existing large-chunk advisory is unchanged.
