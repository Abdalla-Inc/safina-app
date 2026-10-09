# Safinat Al-Nur — expanded contract requests

**28 September 2026 · Research addendum · No API or program rule approved.** The historical engine request is retained below and [archived](research/archive/2026-09-25/ENGINE_DEPENDENCIES.md). Its referenced engine documents are absent from the current workspace. This is a table of UI data needs for owner review, **not an invented backend schema**. Proposed names may be replaced wholesale by approved contracts. No messages were sent to another workstream; this packet is ready for the founder to relay.

## Current authority and boundaries

- Founder-directed: in-app Arabic reader, physical Mushaf path, direct assignment rows, member-correctable suggestions, separate optional dhikr, free ad-free practice, library, proposed paid classroom and consented circles.
- Unavailable: latest engine architecture/current outputs, approved levels/rules, canonical reference/provider selection, curriculum/assessment policy, media rights, entitlements, group/privacy policies.
- Never frontend-owned: assignment calculation, overlap/repetition semantics, official completion, rewards, religious grading, paid eligibility or authorization to publish private logs.

## Requested interface table — engine and reader

| Proposed field / capability | Meaning | Authoritative source | State when absent | Uses |
|---|---|---|---|---|
| `contractVersion`, `ruleVersion`, approval status | Which schema/rules are in force | Engine + coach | Do not describe a fixture as approved | All practice views |
| Level registry, Arabic labels, load, eligibility | Approved choices for public/free and coached members; actual daily burden | Coach + entitlement owner | No invented public level options | Welcome/change commitment |
| `assignmentId`, date/timezone, exact `slotId`/occurrence | Plan identity, ordered component ranges and effective date | Assignment engine | Labeled cached date/version, otherwise assignment unavailable | Today/log/history |
| Canonical passage identity and ordered ranges | Surah/ayah endpoints, inclusive/exclusive meaning, disjoint ranges, repetition identity | Reference/engine owner | Reference-only research fixture; no numeric expansion guessed | Reader/log/correction |
| Edition/script/text/font/metadata versions | Compatible, licensed content combination with attribution and integrity reference | Content owner + reference service | Reader unavailable with physical/manual path if supported | Reader/settings |
| Page-to-ayah/segment mapping and boundary policy | A page position in a named Mushaf; partial-page handling | Reference + engine owners | Use exact references; disable page-based report if no reliable map | Partial row/reader/history |
| Reader start/resume target | Assigned occurrence versus freely chosen surah; canonical last position | Reader contract | Open approved surah navigation, no presumed completion | Reader/Today |
| `observationId`, session and observed intervals/gaps | What the app saw, under a versioned capture/retention policy | Reader/engine + privacy owner | No inferred range; manual reporting remains available | Suggestion review |
| `suggestionId`, inferred ranges, provenance, policy version | Provisional suggestion; explicitly not confirmed reading | Engine-approved suggestion producer | “No suggestion available”; allow member entry | Review/Today |
| Suggestion status and confirmation linkage | Reviewed, corrected, discarded, superseded; linked confirmed entry IDs | Ledger/engine | Prevent blind confirm/retry; preserve draft and explain uncertainty | Review/history |
| Confirmed actual entry + source + revision lineage | Member self-report, reader-confirmed or physical/manual; when it occurred and was entered | Actual-reading ledger | No record is not “no reading”; failed save is not success | Today/history |
| Whole-row report command semantics | Whether one report maps to one/multiple acts; no assumed repeat | Engine + coach | Disable ambiguous quick-report action; precise draft route | Direct-row logging |
| Same-day continuation semantics | Extend/correct an existing act versus additional reading | Engine | Show prior record and ask for exact report, not silent union | Partial continuation |
| Duplicate/overlap/repetition outcome | Idempotent retries versus another deliberate recitation | Engine + coach | Keep ambiguous entries pending review; no double credit | Log/sync/history |
| Revision/delete/late-entry result, allowed actions, conflicts | Expected revision and edit lineage; effect on evaluation and linked posts | Ledger + groups owners | Preserve local edit and show conflict; do not silently overwrite | Correction/history |
| Reading evaluation, supplemental/unique/repeated coverage | Named slot states, explanation, authoritative/provisional status | Engine | Display saved records with evaluation pending, not earned/failed | Today/acknowledgement |
| Safina semantic state/version/change reason | Stable rendering key, prior/current state, milestone and explanation | Progression engine | Last known state labeled; no locally awarded parts | Today/Safina/history |
| Historical level, pause/no-entry, khatma outputs | Facts as of that day; counted khatmas under approved definitions | History/engine + coach | Show recorded entries only; no inferred khatma count | Month/calendar/reflection |
| Commitment change/pause/resume effective date | Preserve historical assignment meaning | Coach/engine | Explain unavailable action, not silent retroactive rewrite | Return/settings |
| Dhikr goal and actual-count ledger, correction | Self-chosen practice/target, count deltas or totals, date boundaries | Dhikr contract owner | Optional goal draft; separate unconfirmed count | Dhikr/history |
| Dhikr evaluation and any combined progression permission | Independent state; whether a shared Safina exists | Coach/founder + engine | Keep dhikr separate; no conversion into reading credit | Dhikr/Safina |
| Listening session, playback resume and evaluation category | Listening fact distinct from reader exposure/self-report | Audio owner + program owner | Later-feature state; no reading credit | Reader/listening/history |
| Reminder eligibility, opt-in and suppression | Private cue, quiet hours, local/server ownership | Reminder service + founder policy | Off/unavailable; no amount on lock screen by default | Settings/return |
| Local persistence, mutation ID, sync/error state | Durable draft vs queued command vs accepted record; retries and stale policy | Backend/engine | Explicit failure or local-only state; no claimed sync | All editable practice views |

**Important distinctions:** page exposure is not an act; confirmed self-report is not independently verified; sync success is not evaluation completion; reading evaluation is not dhikr evaluation; a saved record is not a publication event. A deliberate row action submits a report—the frontend still does not decide assignment satisfaction or ship awards.

## Requested interface table — content, classroom, library and circles

| Proposed field / capability | Meaning | Authoritative source | State when absent | Uses |
|---|---|---|---|---|
| Public/program entitlements, expiry, grace/offline validity | Effective access independent of UI visibility | Founder commercial policy + entitlement service | No invented access/price; free private history remains available per founder direction | Classroom/program/settings |
| Ten-week curriculum/version and prerequisites | Week/lesson ordering, optional versus required activities | Program owner | Labeled sample structure only; no invented ten lessons or deadlines | Classroom |
| Media ID/version/source/rights/capabilities | Authorized host/embed/download, captions, speeds, seek support, availability and expiry | Content/editor + media backend | Specific unavailable state; no substitute source or unauthorized download | Lesson/library/player |
| Ad-free playback capability | Whether chosen delivery meets the free experience promise | Content/backend + founder | Do not advertise guaranteed ad-free playback | Library/classroom |
| Coach notes/version/author/review status + save relation | Approved takeaways, changes since saved; attribution | Coach/editor | No AI summary presented as coach notes | Lesson/saved material |
| Quiz schema/version/attempt policy | MCQ and written response, draft, retry, rubric/reviewer and feedback | Program/assessment owner | Draft/demo only; no auto-grading of religious free text | Lesson/quiz |
| Assignment schema/submission/receipt/review/deadline | Allowed formats, local draft, server receipt, accepted/returned/reviewed | Program + backend | Draft preserved; no false submitted/success state | Classroom/assignments |
| Learning progress and completion criteria | Distinguish watched, attempted, submitted, reviewed and completed | Program owner | Show available activity facts; no certificate/understanding claim | Classroom/history |
| Library item/topic/reference/transcript provenance | Original source, transcript revision, timing, editor-approved labels | Content/index owner | Source-only item or hide unsupported fields; no invented interpretation | Browse/search/detail |
| Search result relevance/match/excerpt/timestamp | Search normalization, reviewed synonyms, typo handling and entitlement filtering | Search owner + editor | Honest empty/error/offline state; no fabricated relevant result | Library |
| Group identity, join/create eligibility, membership and role | Admission, audience, discoverability, approval and exit | Group policy + service | Read-only/unavailable group actions; never assume paid/free creation rules | Circles |
| Sharing consent/version/audience/activity/detail/mode | Explicit member grant, revocation and named scope | Consent service + member choice | Private; no automatic post | Log review/circle/settings |
| Publication ID/status, source entry/revision, consent version | Separately authorized snapshot/event; queued/published/failed/withdrawn | Publication service | Private log succeeds independently; never say shared before receipt | Activity feed/history |
| Correction/delete policy and post update/removal outcome | What happens to linked published/queued posts and notifications | Groups + ledger owners | Show unresolved publication correction, no false deletion guarantee | Corrections/privacy |
| Reactions/feed history bounds/notification preference | Supported reaction set, history visibility and quiet alerts | Groups/notification owner | No invented reactions/counts; disable unavailable actions | Circles |
| Moderation/report/block/remove/appeal, exit effects | Who can act, what is retained and what future members see | Founder policy + group service | No chat launch without adequate controls | Circles/help/settings |
| Optional chat policy and retention | Access, history, attachment permissions, deletion and notifications | Groups/privacy owners | Chat absent or clearly unavailable, not a promised entitlement | Circle chat |

## Smallest decisions and artifacts to return

| Owner | Minimum answer/artifact | What it unlocks |
|---|---|---|
| Engine architect | Latest architecture, approval matrix, dated assignment/slot and ledger/evaluation JSON, current open questions | Reconcile exact names and supported actions |
| Coach | Official public/coached levels; one overlapping Al-Baqarah/Juz example; one deliberate repeat; cutoff/timezone, pause/return and khatma definitions | Truthful commitment and logging examples |
| Engine/reference owners | Exact edition/page map and explanation of stopping within a page; continuation/dedup across methods | Founder partial-position interaction |
| Engine/privacy owners | Observation capture, persistence, gaps, resume, deletion/retention, opt-out and suggestion generation policy | Automatic suggestion without false proof |
| Content owner | One approved text/font/metadata manifest; per-recording audio rights; a small coach-media rights inventory | Reader/content feasibility; audio release decision |
| Program owner | Ten-week outline plus one real lesson, approved notes, MCQ, written prompt, assignment and feedback rubric; completion policy | Classroom research fixtures |
| Search/editor owner | Reviewed transcripts/topics plus judged examples for istighfar and Arabic/typo variants | Evaluate relevance instead of inventing ranking success |
| Founder/commercial owner | Confirm or revise US$500/year; itemized entitlements, expiry/retention, regions/payment terms | Program explanation outside Today; no public price yet |
| Groups/privacy owner | Join/create, moderation, audience/history, chat retention, consent and corrected-post rules | Safe group flows beyond screenshots |
| Founder/content/backend | Approved arrangement for ad-free video playback | Resolve ordinary YouTube embed conflict |

## Versioned fixture request pack

Ask owners for input, output, allowed actions, explanation, relevant versions and approved/proposed label for each. These are scenarios, not synthetic approved payloads.

1. Free newcomer versus coached member: eligible commitments and exact daily load.
2. Simple assignment and dense B+5-like **sample** assignment; exact occurrence IDs and ordered/disjoint ranges.
3. Deliberate whole-row report, partial page, mid-page ayah and later same-day continuation.
4. Reader jump/idle exposure with gaps; suggestion shortened, extended, discarded and confirmed.
5. Reader restart and two sessions; physical reading overlapping a pending suggestion; genuine second recitation.
6. Same mutation retried twice; two-device conflict; cached assignment after policy change.
7. Late edit/delete changing evaluation and a previously earned milestone; retained audit lineage.
8. No entry, pause, one missed day and return after months; effective commitment change and khatma history.
9. Dhikr chosen target, count addition/decrement/correction, day rollover and rejected duplicate retry.
10. Listening only, then separately reported reading of the same passage.
11. Lesson resume, buffering, caption unavailable, authorized download interrupted and revoked media.
12. Saved coach note changed by its author; original attribution and current-version behavior.
13. MCQ incorrect/retry, written answer draft/offline/server receipt/pending human review, returned assignment.
14. Quiz prerequisite missing, deadline crossed offline and paid access expired during an activity.
15. Search exact Arabic/Latin/typo query, no results, stale index, offline search and unavailable source.
16. Private log while belonging to multiple groups: **zero publication events**.
17. Review-each-time share versus authorized automatic share to one named audience with minimal detail.
18. Consent revoked while publication is queued; membership removed before delivery; publication retry.
19. Corrected/deleted private record with a published post, delivered notification and pending copy elsewhere.
20. Invite expired, join rejected, report/moderation action, leave group and chat/history retention.

## Cross-owner questions that must not be hidden by UI

- Does reducing a partial row create a revision or a negative entry? What happens to the previously evaluated coverage and ship state?
- If two occurrences overlap, can one act satisfy both? A quick row check cannot answer this without coach rules.
- Does a page-end control mean “through this page” or “up to this ayah”? Which edition is used after text resizing or switching physical Mushafs?
- Can observation capture be disabled while the reader stays usable? What is stored locally/server-side and for how long?
- On publish, does the server revalidate active consent and membership? How are revoked queued events cancelled? What does an entry correction do to posts already shared?
- Can a free member create a circle or only join? Who moderates public discovery? Are minors in scope? These policies are not inferred from broad public access.
- Which paid learning artifacts remain readable/exportable after expiry, and which media must be removed? Free devotional history must not become a renewal pressure point.

## State coverage required at the later prototype gate

| Area | Material states to cover |
|---|---|
| Commitment/Today/return | Loading, missing/stale assignment, known plan with no entry, partial, additional, paused, correction, offline and welcoming resume |
| Reader/log/ship/history | Content loading/unavailable, observed suggestion, member-confirmed, local pending, overlap conflict, undo/edit, evaluation pending, earned change/no change, no-entry calendar |
| Dhikr/settings | No goal, counting/correction, accidental reset, unsynced count, reminders off, consent change failure, help |
| Classroom | Not enrolled/eligible, loading, resumed/unfinished/completed, draft, rejected submission, received, review pending, feedback, expired access |
| Library | Loading, no query/results, typo, relevant timestamp, offline, stale/withdrawn source, save success/failure |
| Circles | No groups, invite/join pending/denied, private by default, preview consent, queued/published/failed/withdrawn, correction, moderation, exit and optional chat |

**Review gate:** return these requests through the founder. Resolve or explicitly label contracts before design exploration; do not create an approved INTERFACE_CONTRACT.md from these proposals. No frontend or engine code was written.

---

# Historical engine dependency request — 25 September 2026

Statements below about the saved v0.1 apply to the earlier audit only. New requirements and current availability above take precedence.

**Status 25 September 2026:** the project's `HABIT_ENGINE_SPEC.md` is an explicit **proposed v0.1**, not an approved API. `PROGRAM_RULES_AND_OPEN_QUESTIONS.md` reports no independently verified coach program rules. No executable engine or repository was supplied. These are requested data needs and provisional example fields, not a frontend-owned schema.

## Interface-contract request to the engine owner

| Field / output requested | Meaning and source | State when absent | Screens that need it |
|---|---|---|---|
| `ruleVersion`, `referenceVersion`, approval status | Coach-approved policy snapshot and pinned Qur’an reference from engine | Show “assignment unavailable; try again” or a clearly labeled demo fixture; never infer today's passage | Welcome, Today, history, offline |
| `levelId`, Arabic label, plain description, components and estimated load | Coach level registry; load estimate needs member calibration | No public level picker; labeled sample choices for research only | Welcome, change commitment |
| `assignmentId`, local date/zone, `slots[]` with occurrence ID, component label, exact inclusive surah/ayah ranges and order | Assignment engine response, not frontend date arithmetic | Retain safely cached version with date/source badge or empty/error; no computed substitute | Today, prepare, log, history |
| Reading route, target reference URL or licensed in-app resource | Product scope plus verified Qur’an content provider | Generic “prepare to read” path; do not imply an embedded reader exists | Today, read/prepare |
| `actualActs[]` with IDs, date/zone, ordered ranges, distinct repetition, source, revision lineage, sync state | Member-reported ledger from engine; actual is not observed reading | “No reading recorded” distinct from “no reading”; pending offline records visible | Today, record, history |
| Create/correct/delete/late-entry command, idempotency key, conflict and validation errors | Engine mutation contract | Disable authoritative submission and use a non-saving research fixture | Log, correction, offline |
| `evaluation`: assigned slots matched, partial/full/none/paused state, unique coverage, repeated acts, supplemental reading, explanation | Engine evaluation, with explicit version and provisional/authoritative flag | Show recorded act and “progress being calculated”; do not derive completion from UI or timer | Today, acknowledgement, history |
| `progression`: version, current ship ID/state, semantic milestone, change reason and prior state | Engine's evaluated progression output; rendering maps a semantic state to graphic/text | Static neutral Safina placeholder with “progress unavailable”; never award local parts | Today, acknowledgement, Safina, history |
| `commitment`: effective date, change/pause/resume eligibility and history | Approved policy and engine state | Explain pending decision; never silently rewrite old assignment | Welcome, return, settings |
| `reminderEligibility`, opt-in state, suppression/quiet hours | Cue service | Off by default until confirmed; no guilt or reading amount on lock screen | Welcome, settings, return |
| `sharingPolicy`, audience, retention/deletion and coach visibility | Founder privacy and backend policy | Private display only, sharing disabled; no inferred community post | History, settings, share |
| Offline cache permission, sync queue, conflict resolution, stale-policy outcome | Engine/server sync contract | Show offline unavailability; no fake success or duplicate credit | Today, log, history, settings |

## Smallest decisions to return to coach and architect

1. **Official levels and burden:** supply current Arabic names, component descriptions, allowed entry/change tiers and examples of real daily load. Research examples B, BI, BJ1–BJ5 are provisional.
2. **Overlap and repetition:** on an Al-Baqarah + Juz 2 assignment, does one reading of 2:142–252 satisfy both components or is a separate recitation required? Provide an approved example of one act and two acts.
3. **Dated assignments:** give BJ2, BJ4 and BJ5 actual targets for 25 September; February 28/29, day 31 and month transition examples; state Gregorian/Hijri basis, cutoff, program/member timezone, travel and pause policy. The proposed P1 sequential calendar is not a real assignment rule.
4. **Entry/evaluation:** exact inclusive range payload, repetition flag/act semantics, whole-assignment quick-log expansion, duplicate handling, additional reading, partial evaluation, late/corrected entry and server explanation. Supply a stable error taxonomy and localized display metadata.
5. **Progression:** confirm model, stage thresholds, ship/fleet semantic states and what a corrected historical entry changes. Proposed 25 credits and parts are unapproved; ship visual mapping must consume the versioned result without calculating award client-side.
6. **Reading, privacy and offline:** external/in-app scope, approved text/edition, initial reminder defaults, coach access and community audience, offline caching and authoritative resync rules.

## Contract examples to request as fixtures

Ask the architect for versioned JSON examples, each with input, response and explanation: (a) new B member, (b) BJ5 multi-range Today, (c) partial B, (d) Juz overlap with and without an explicit repeat, (e) extra reading, (f) no recorded reading versus paused date, (g) late entry and correction that reverses a milestone, (h) two offline retries with same mutation ID, (i) sync conflict after policy change, (j) return after 60 days and commitment adjustment. Use these fixtures in later prototype; sample data must carry an unmistakable **DEMO / قواعد غير معتمدة** label.

## Reconciliation note

The proposed engine spec says offline local evaluation may be provisional, while authoritative evaluation and ship state are server-calculated after sync. A visual acknowledgement can immediately confirm **the saved local record**; it must not claim an earned ship change until an authoritative response or an explicitly labeled provisional state is returned. The proposed engine also distinguishes unique verse coverage from repeated acts; the UI must display those concepts separately where overlap matters. Resolve whether whole-assignment quick log means a single act or several separate occurrence acts before making it one tap.

The separate engine workstream may have newer outputs than the saved v0.1. At the next gate, request its latest architecture, API examples, signed coach decisions and current open-question list; compare them field by field to this request and revise this document. No final contract has been accepted.
