# Ship progression and simulation — revised after founder discussion

## Settled core and remaining choices
**Founder-confirmed:** one full day of the member’s chosen reading commitment earns **one credit**, regardless of tier; **30 credits complete a ship**. A khatma means the actual complete Qur’an was read within a particular tracked cycle and is recorded separately. A B-only member can finish a ship without a khatma; a weekly reader can finish a khatma without instantly receiving a full ship. Missed days never damage earned construction. **Proposed, not expressly approved:** partial day earns its fulfilled fraction `r∈[0,1]`; credit carries across weekly/monthly boundaries until 30; milestone visuals at 1, 5, 10, 20 and 30 are placeholders. The founder's story frames reading in one period as building a vessel for the next month/week and a fleet over a year. Final temporal presentation of an incomplete vessel is open.

Compute exact `r` from the assignment applicable to the day's recorded segment(s) and actually read, non-duplicated verse/word positions. One Al-Baqarah act covers overlapping assigned juz portions once and may fulfil those requirements. It is not two acts or two volume credits. Reading repetitions remain honest separate acts. For a flexible weekly plan, the agreed day's target and weekly remaining portion must both be displayed; exact plan-lock and credit rule requires founder decision ([rules](PROGRAM_RULES_AND_OPEN_QUESTIONS.md)). Never treat a timer or log tap as reading.

| Candidate | Formula | Evaluation |
|---|---|---|
| A. Chosen daily commitment **selected** | `q=r`, full day 1, partial proposed fraction | Fair ship pace across tiers; simple and aligned with founder's 30-day-credit decision. |
| B. Juz-equivalent volume | `q=actual word count / pinned mean-juz word count` without cap | Makes a B+5 day about five or more times faster; unacceptable as the common ship economy, though actual volume remains private history and khatmas are separately honoured. |
| C. Partial encouragement | `q=.8r+.2min(1,r/.25)`, `q=0` at `r=0`, capped 1 | More immediate boost on small days; formula is opaque and untested, so do not silently replace A. |

### Thirty-day arithmetic sensitivity
For illustration, take exactly 9/18/27 complete days in 30 calendar days, all others with no recorded reading. Under A and C full-day credits equal 9/18/27 for every tier, thus **no completed 30-credit ship** within those 30 days. A perfect 30-day run completes one. If credits carry, expected time to one ship at evenly distributed 90/60/30% adherence is roughly 34/50/100 calendar days. A first 1-credit visual change is around day 2/2/4; 10-credit mid-build around day 12/17/34; these are pacing illustrations, not behavior predictions. Thirty days at half of the target every day yield A=15 and C=18 at every tier.

To expose model B inequity without claiming canonical equal sizes, this **illustrative only** volume normalization sets B=1, Imran=.6, each J=1 component-equivalent. Real word lengths differ. Each row reports A/C credits (same across tiers at full-day adherence) and model B credits:

| Provisional tier | A/C @30/60/90% | B @30/60/90%, illustrative |
|---|---:|---:|
| B | 9 / 18 / 27 | 9 / 18 / 27 |
| BI | 9 / 18 / 27 | 14.4 / 28.8 / 43.2 |
| BJ1 | 9 / 18 / 27 | 18 / 36 / 54 |
| BJ2 | 9 / 18 / 27 | 27 / 54 / 81 |
| BJ3 | 9 / 18 / 27 | 36 / 72 / 108 |
| BJ4 weekly | 9 / 18 / 27 | 45 / 90 / 135 |
| BJ5 weekly | 9 / 18 / 27 | 54 / 108 / 162 |

These B numbers assume the **old additive component simplification**, so they **overstate** actual distinct reading on overlap days; they are a directional stress test, not a simulation of the newly agreed day-one B-only calendar. Implement a pinned word-count simulation once the monthly/weekly grids are approved. Even allowing overlap, B structurally rewards sheer volume at a different ship pace. Model A full-day fairness remains exact for any approved grid, but partial experience depends on that day's assigned denominator.

| Example | Proposed A credit | Khatma ledger |
|---|---:|---|
| B-only day, all B read once | 1 | Only the covered verses, not a whole-Qur’an completion. |
| BJ2 monthly day 1, B only as founder specified | 1 | J1, J2 and the covered part of J3 within this cycle; no duplicate act. |
| BJ5 weekly day with five required juz fully read | 1 | Up to five distinct juz in weekly coverage, with B overlaps counted once. |
| Half an approved day's assigned reading | .5 | Exact actual range; partial weekly/monthly khatma coverage. |
| Saturday free after B+5 weekly cycle completed, chooses rest | 0 | No penalty; a new Sunday cycle begins. |
| Return after long absence and read full target | 1 | Ship retains earned credit; today's cycle coverage counted. |
| Correct erroneous full reading to half | Derived 1→.5 | Recompute coverage and any falsely recorded khatma. |

A khatma requires coverage of all canonical words/verses in one cycle from *logged acts*, with each act attributed once; a mere assigned schedule, elapsed timer, or 30 credit total does not confer a khatma. Weekly Sunday resets cycle at J1 and retains last week's incomplete record; monthly first day resets its group cycle. Concurrent/repeated khatmas require explicit distinct act attribution and are not inferred from overlapping B logs.

### Ship depiction
Construction follows a 30-credit journey, with meaningful early, middle and completion states tuned through member tests. A 30-segment concept can mirror the 30 juz, but for B-only members segments represent **thirty completed personal days**, never thirty distinct juz; actual Juz numbers remain separate in the reading/khatma record. B as an “engine” and Imran as another part are visual ideas, not religious properties. The design team can explore Nuh’s ship and carefully checked relevant ayat above construction/launch after the founder approves exact text and framing. Provide accessible static/reduced-motion alternatives. No destruction, level-locked superior ships, variable rewards, or purchase of credit. A fleet can show dated completed vessels without rating members against each other.

**Pending design policy:** partly built ship at cycle end can (A) continue to 30 while dated construction periods remain visible, recommended for no lost effort, or (B) remain an unfinished dated vessel and start another. The founder has not chosen. Do not implement either as a settled program rule. See [research](HABIT_ENGINE_RESEARCH.md) for evidence and [founder review](FOUNDER_REVIEW.md) for decisions.
