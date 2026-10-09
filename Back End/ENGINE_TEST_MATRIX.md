# Engine acceptance matrix v0.2

`D` = founder-decided behavior from voice discussion; `O` = precise expected result waits for founder choice; `P` = engineering invariant. No executable engine or repository was supplied; these are specifications, **not passing tests**. Convert O fixtures into golden cases after founder review. Import and pin licensed canonical text before exact word-level counts. The previous v0.1 P1/additive and 25-credit tests are superseded, not silently retained.

| ID | Fixture | Expected result | Status |
|---|---|---|---|
| R01 | Import reference | 114 surahs, 30 contiguous juz, pinned verse/word counts, J1 1:1–2:141, J2 2:142–252, B 2:1–286 | P, import pending |
| R02 | Same ayah in two Mushaf editions | Verse identity equal; pages tagged by edition/version | P |
| M01 | BJ1 on monthly day 1 and 16 | J1 and J16 group position; a new joiner on 16 gets J16, no backfill | D |
| M02 | BJ2 on first day reads B 2:1–286 once | Day-one prescription fulfilled, no second B/J2 reading required; canonical early-Juz coverage logged once | D; day-two cursor O |
| M03 | BJ2 day two | Show next group passage after day-one B, no duplicate reading demand | D principle, O exact first verse/juz |
| M04 | 28-day February at one khatma/month | Published grid assigns total 30 juz-equivalent distinct coverage by last day, with two extra portions distributed earlier; no surprise on final day | D target, O dates/boundaries |
| M05 | 29-day February, BJ2 | Two additional monthly portions across available days to cover 60 target juz overall | D target, O dates/boundaries |
| M06 | 30th to 31st to next 1st | 31st FREE; optional catch-up/other reading or rest, no miss penalty; new month resets group to J1 | D; optional catch-up attribution O |
| M07 | BJ3→BJ1 at 14:00 on 16th, prior reading logged | Prior acts retained, new group at its 16th-day passage, overlap counted once, daily ship credit≤1 | D; precise segment denominator O |
| M08 | Change to BJ1 from different monthly group on day 16 | Group position is today's J16; no prior-day make-up demand | D |
| W01 | BJ5 starts Sunday with no prior coverage | New weekly cycle J1, suggested next unread verse grounded in ledger | D |
| W02 | BJ5 reads five distinct juz per day Sunday–Friday | Whole 30-juz weekly khatma recorded; Saturday free for rest/catch-up/voluntary reading | D; B overlap exact day plan O |
| W03 | BJ4 reads 4 × 7 = 28 J | Must choose/record two further juz over selected day(s) for khatma; no invented 30-J completion at 28 | D |
| W04 | BJ4 chooses one extra J Sunday after B | Member sees adjusted daily plan and honest weekly remainder; actual log advances cursor, no duplicate overlap | D, daily credit denominator O |
| W05 | Saturday incomplete, Sunday opens | Prior cycle stays incomplete; fresh weekly cycle from J1; no coercive backfill | D |
| W06 | BJ5→BJ4 requested Wednesday | Old tier through Saturday, new tier begins next Sunday | D |
| W07 | Weekly flexible plan says only B all seven days | Calendar records B reading, weekly khatma incomplete; whether each day is “complete” at BJ5 must be resolved without an easy-plan loophole | O |
| C01 | One B act selected under B+J2 overlap | J2 verses only one actual act, satisfy both *overlapping requirements* without separate repetition; unique coverage once | D |
| C02 | Explicit second recitation of J2 | Two honest acts retained, unique coverage still union, no automatic extra daily ship credit | D/P |
| C03 | Half assigned reading, rest not done | Actual range partial; proposed credit .5, ship not damaged | O partial formula |
| C04 | Full approved day's assigned plan at B and BJ5 | Each receives exactly one credit; volume and khatma progress separately differ | D |
| C05 | 30 full days at any tier | 30 credits, one completed ship; this alone does not prove a khatma | D; carry O |
| C06 | 9/18/27 full days in 30 dates at each tier | 9/18/27 credits, none reaches 30; no level-dependent ship speed under A | D/P |
| C07 | One week off, return and read | No lost credits, return day's actual reading evaluated normally; new weekly cycle if Sunday passed | D/P |
| C08 | Correct full entry to half or delete | Recompute 1→.5 or 0 if partial approved; khatma proof and ship derived state corrected with explanation | P/O |
| C09 | Timer, notification tap, empty Save | Zero reading credit and no khatma coverage | P |
| C10 | Same UUID retried offline, separate correction concurrently | Idempotent first; second conflict explicit, no duplicate credit | P |
| C11 | Month/week boundary with 18 earned credits | Existing earned work stays intact; presentation/carry into next ship period per selected policy | D preservation, O display/carry |
| K01 | Read 30 credits of repeated B, no rest of Qur’an | Ship complete, no khatma | D |
| K02 | Complete all canonical verses within one weekly cycle | Khatma mark on completion date; no extra ship credit solely for mark | D |
| V01 | Nuh verse over building/launch | Exact canonical text, surah:ayah and approved contextual copy; no invented protection guarantee | O |
| U01 | Calendar level change on 16th | Earlier cells retain previous tier label/color; 16th may show split; complete/partial/free/pause/no-entry distinguishable without color | D/P |
| U02 | Completed khatma mark | Appears only on coverage proof; private unless separately shared | D/P |
| N01 | Paused, logged, reminder opt-out | No push; suppress/cancel safely; no reading quantity on lock screen | P/F privacy setting |
| T01 | Local midnight, DST and timezone travel | Civil-date snapshot and original zone/offset retained; no double credit for same act | P; timezone authority O |

## Validation before implementation
1. Founder selects exact February grid, day-two cursor after B, flexible weekly daily denominator, same-day switch accounting and unfinished-ship carry/display. Store chosen examples as approved rule fixtures. No coach review gate.
2. Import canonical metadata with rights and verify all juz/surah boundaries and edition-specific pages. Write pure property tests for dates across leap years, Sunday resets and all seven tiers.
3. Run ledger replay tests for same-day level change, B overlap, repeated acts, offline UUID retry, concurrent correction and khatma revocation.
4. Observe Arabic-speaking B/BJ3/BJ5 new and returning members using a low-fidelity research prototype, including older and less technical users; assess comprehension of free days, partial logging, color plus text, screen reader and reduced motion.
5. Pilot reminder and feedback policies on actual self-reported reading and pressure guardrails, not app opens. Full frontend implementation waits for founder review.

## Implementation update — 28 September 2026

Executable coverage now lives in `tests/`, with actual output in `docs/TEST_OUTPUT.txt` and scenario mapping in `docs/TEST_COVERAGE.md`. Earlier open scenarios are tested for policy gates, not falsely marked as approved outcomes. The current request authorizes building the independent core before these decisions are resolved.
