# Safinat frontend ↔ habit engine dependencies — gate 1

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
