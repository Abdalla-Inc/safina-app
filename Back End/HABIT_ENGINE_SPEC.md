# Safinat Al-Nur engine specification v0.2 — founder review

## Authority, state and purpose
The founder alone reviews this engine. This revision incorporates the founder's later voice decisions recorded in [program rules](PROGRAM_RULES_AND_OPEN_QUESTIONS.md). The original v0.1 25-credit threshold, additive Al-Baqarah recitation, one-calendar-policy-for-all model and default next-day changes are superseded. No app or executable engine was supplied. Questions explicitly marked **open** must remain configuration gates, not guessed code defaults.

Success means sustained real-world Qur’an reading: see current assignment/next unread passage → read → record what actually happened → see factual private progress → leave. No app-open, timer, notification click or Save action proves reading. All actual reading is member-reported. No metric implies piety, protection, or religious standing.

## Member routines
At onboarding, choose any founder-permitted tier; see its **monthly** or **weekly** cadence and realistic burden; optionally set an “after [routine], at [place]” plan and one chosen reminder. A BJ2 member joining on the first reads B once, which fulfils the founder's first-day example; later they see the next group assignment rather than doing math. A BJ5 member sees the current Sunday–Saturday khatma, last logged verse and remaining portion; if they want an extra portion today, their chosen plan can reflect it. Al-Baqarah already read counts toward overlapping weekly coverage once. Logging presents exact actual Surah/Juz/ayah ranges, a partial range, repeated acts and supplemental ranges, then one calm acknowledgement. Next visit shows where *logged coverage* stopped; an unlogged plan never advances actual progress.

After absence the current monthly group position or new weekly Sunday cycle is shown with the previous record intact, not forced backlog. A pause is distinct from no entry; policies for pause are still open. A weekly change is queued until Sunday. A monthly change can happen today and retains readings before the change. Optional private weekly reflection checks whether level fits real life; no forced lower level. Cues default off, once per opted-in day at most, suppress on logged/paused days, no escalation after silence, and one re-entry invitation at most after seven silent unpaused days followed by a 30-day cooldown (frequency is a product hypothesis). Quiet hours, off switch and discreet lock screen copy required.

## Modules and data contracts
| Module | Input → output | Invariant |
|---|---|---|
| Program rule registry | Versioned founder-approved tier definitions, cadence, overlap, February distribution, free-day, change policy → immutable snapshot | No undefined branch can issue a production assignment. |
| Qur’an reference | Pinned 114 Surah/30 Juz verse and word boundaries + edition-specific page map → ordered canonical intervals | No gaps/overlap in a single Qur’an; page number never universal. |
| Commitment | Member-selected tier, cadence, change timestamp/effective cycle, pauses → daily/segment snapshot | Weekly changes next Sunday, monthly same-day segmented; history never overwritten. |
| Assignment engine | Date, IANA zone, cycle policy, tier, group's published month/week schedule, reference → exact ranges, version | Monthly group position independent of individual missed logs; weekly next suggestion grounded in logged coverage. |
| Reading ledger | UUID, actual ranges/act repetition, occurrence date/zone, assignment segment, created/updated time, revisions → active acts | Idempotent; one act logged twice by retry yields one act. |
| Coverage/khatma evaluator | Active acts + cycle ID → interval union, per-act repetitions, actual coverage cursor, completed khatmas | One B act may satisfy overlapping target passage but cannot be multiplied into two readings/khatmas. |
| Daily plan evaluator | Versioned day's segment plans + actual acts → fulfilled fraction `r`, day status | Daily `0≤r≤1`; same-day change cannot double credit. Weekly flexible denominator awaits founder rule. |
| Ship ledger | Day evaluations + correction lineage → credits, 30-credit ship(s), construction state | Full day=1, no day>1; absence never subtracts; correction reverses error. Cross-cycle carry awaits choice. |
| Cue/calendar/insights | Opt-in preferences and private day snapshots → reminders, labeled colored calendar, privacy-conscious aggregates | No public reading quantity by default; color also has text/pattern. |

`RuleSnapshot {ruleVersion, founderApprovedAt, effectiveFrom, tierDefinitions[], monthlySchedulePolicy, weeklySchedulePolicy, overlapPolicy, creditPolicy}`; `Cycle {cycleId, cadence, localStart, localEnd, groupId, targetKhatmas, status}`; `Assignment {assignmentId, version, cycleId, localDate, segmentStartAt, segmentEndAt?, tier, canonicalTargetRanges[], freeDay, status}`; `ActualAct {actId, clientMutationId, memberId, occurredAt?, occurredLocalDate, IANATimezone, UTCOffset, createdAt, updatedAt, canonicalRanges[], repeatOfActId?, source, assignmentSegmentId?, revisionOf?, revisionReason?, deletedAt?}`; `DayEvaluation {date, assignmentVersions[], matchedTargetWordPositions, targetWordPositions, fraction, credit, actualReadingDay, supplementalRanges, inputHash}`; `KhatmaRecord {cycleId, ordinal, completeCoverageProofHash, completionTime, sourceActIds, revision}`; `ShipLedger {lifetimeCredits, shipIndex, currentCredit, accountingVersion, sourceDayVersions}`. Event examples:
```
MonthSchedulePublished {group:BJ2, month:2026-09, ruleVersion:r2, dayRanges:[...]}
ReadingRecorded {actId:a, date:2026-09-01, ranges:[2:1-2:286], mutationId:u1}
CommitmentChanged {from:BJ3, to:BJ1, effectiveAt:2026-09-16T14:00+10:00,
  oldAssignmentSegment:old, newAssignmentSegment:new, joinGroupDate:2026-09-16}
WeeklyChangeQueued {from:BJ5, to:BJ4, requestedWednesday:2026-09-23,
  effectiveSunday:2026-09-27}
WeeklyCycleStarted {date:2026-09-27, cursor:1:1, previousCycleStatus:incomplete}
ReadingCorrected {revisionOf:a, ranges:[2:1-2:141], reason:member_correction}
```

## Assignment and coverage algorithms
```
issue(date, member, approvedRule, publishedSchedule):
  if paused(date): return PAUSED
  if member.cadence == MONTHLY:
     cycle = calendarMonth(date)
     if day(date)==31: return FREE_DAY(cycle, optionalCatchUp=actualOnly)
     return publishedSchedule[member.group][date]  // immutable group position;
            // day 1 BJ2 must accept B-only as fully assigned
  if member.cadence == WEEKLY:
     cycle = sundayStart(date)..saturdayEnd(date)
     if newSunday: createCycle(start=1:1, priorCycle=preserved)
     return {cycle, expectedWeeklyCoverage:completeQuran,
             suggestedNext:nextUncoveredVerse(loggedActsInCycle),
             suggestedPace:remainingOverRemainingDays,
             memberChosenDayPlan:versionedPlanOrOpenDecision}

coverage(activeActs, cycle):
  actual = unionCanonicalWordPositionsOfDistinctActs(activeActs in cycle)
  // overlap within one act counts once; separate repeat act preserved
  complete = every canonical position of the pinned Quran is in actual
  return {actual, nextUncoveredVerse, complete, repeatActs}

evaluateDay(date, segments, actual):
  // exact same-day switching and flexible weekly plan still need approved policy
  assignedUnion = unionCanonicalPositions(approvedSegmentTargets(segments))
  actualUnion = unionCanonicalPositions(actual matched within date)
  r = clamp(size(actualUnion intersect assignedUnion)/size(assignedUnion),0,1)
  credit = r                            // proportional partial credit proposal
  return {r, credit, unmatchedSupplemental:actualUnion-assignedUnion}

replayCorrections(member):
  resolve active ledger revisions and cycle attribution deterministically
  recompute affected actual coverage, khatma proofs, daily evaluations
  credits = sum(eachDay.credit)          // no damage on untouched days
  fullShips = floor(credits/30)          // if founder approves cross-cycle carry
  emit delta and factual correction notice, never covert bonus or destruction
```
A partial ayah is not inferred from a full ayah selection; capture precise start/end or explicit approximate entry. Word counts are an accounting denominator only, not a judgment about merit or reading difficulty. The `union` evaluator handles overlap for ordinary assignment fulfillment; a second explicit recitation remains an act but should not automatically earn a second daily credit. Same-day switching needs a nonretroactive segment rule so changing from BJ3 to BJ1 after reading is never a loophole or penalty. A group schedule must be previewable, versioned and validated before issue; **no hardcoded day-of-month multiplication** for BJ2/BJ3 until the founder resolves the exact B overlap and short-month grid.

## Cycle, ship and calendar separation
Monthly one-juz group day 16 points to J16; someone changing into it that day joins there. Earlier reading on the same day stays in the actual ledger and can satisfy overlap once. Weekly B+4 and B+5 each start fresh J1 on Sunday irrespective of Saturday's unfinished cursor. Weekly khatma coverage is per cycle; old incomplete cycles remain visible, while Saturday catch-up reading still belongs to that ending cycle. On the monthly 31st a rest day earns 0 without a miss label; optional actual reading may be applied to an unfinished current month cycle if allowed by founder policy, and is always logged. February requires published distribution of remaining portions, not after-the-fact compression. A khatma is recorded only for fully covered canonical Qur’an within its cycle, independent of 30 ship credits. A ship represents accumulated commitment fulfilled; its unfinished-period treatment is open.

Private calendar day stores `localDate, originalTierLabel/colorToken, finalTierLabel/colorToken if changed, actualStatus {complete, partial, supplementalOnly, noEntry, paused, free}, optionalKhatmaMark, correctedFlag`; a split cell may show same-day tier change. Historical colors do not change when a tier changes. Color must have label/pattern; never encode spiritual rank or make B look intrinsically inferior. Headline factual count such as “22 reading days, 5 partial” with date/definition; streak optional and secondary, not a punitive reset. Display completed khatma symbol only after coverage proof; no volume leaderboard.

## Sync, privacy and evaluation
Client caches signed rule/reference/schedule snapshots and may preview assignments, log offline acts and provisional credits. Server owns approved version, assignment segments, canonical matching, cycle proof, correction replay, ship total. Unique mutation UUID returns same server result on retry; concurrent revisions conflict rather than last-write-wins. Preserve local occurrence date and zone/offset through travel; createdAt is server time; DST uses civil calendar arithmetic, never `+24 hours`. Corrections can retract a false khatma or ship with a neutral explanation and visible history. No coach account is required by the review process; define any future community moderation access separately. Reading history and ship private by default, sharing separately opt-in, revocable, no exact quantities required.

Outcomes: actual member-reported reading days, return after lapse, weekly/monthly cycle completion, plan sustainability, ease/meaning surveys; guardrails: notification opt-outs, guilt/pressure, implausible edits (not accusations), tier disparity, abandoned plans and accessibility. Pre-register reminder/reflection tests with consenting new/returning and low/high tiers for ≥8 weeks, follow through 12 weeks, stop for elevated pressure or opt-outs; app opens are not reading outcomes. Research and transfer limits: [research](HABIT_ENGINE_RESEARCH.md). Scenario assertions: [test matrix](ENGINE_TEST_MATRIX.md).

## Implementation update — 28 September 2026

A local executable backend now implements the independently approved slice; see `README.md` and `contracts/API_HANDOFF.md`. Earlier pseudocode `credit=r` is not the production credit policy. Partial/mixed/flexible cases fail closed with explicit unresolved states. Word-level accounting is not implemented without a pinned word map.
