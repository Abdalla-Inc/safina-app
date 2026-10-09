# Program rules, founder decisions, and remaining details — 25 September 2026

## Authority and change history
The founder is the **sole reviewer for this work**. No separate coach review is required. This replaces the first draft's requests for a coach and its assumption that Al-Baqarah is always an additional recitation. Source: founder's voice discussion after v0.1. No program handbook or repository was supplied, so official Arabic names and any practices not explicitly settled here remain unverified. “Founder-confirmed direction” below means the founder chose it in conversation; it does not claim an independent religious ruling.

| Version | Decision from founder | Supersedes |
|---|---|---|
| v0.2 | Read Al-Baqarah **once**; its overlapping verses count toward assigned juz. On a monthly B+2 start day, Al-Baqarah alone completes that day's prescription. | v0.1 additive occurrence assumption. |
| v0.2 | Monthly 30-juz-based cycles restart on the 1st; shorter February distributes the remainder over its available days; 31st is free to rest, catch up, or read voluntarily. | v0.1 undefined February/day 31. |
| v0.2 | Weekly khatma cadence Sunday–Saturday for B+4 or B+5; Sunday starts a **new** khatma even when prior week unfinished. B+5 can finish five juz daily over six days and use Saturday freely; B+4 distributes two extra juz over selected days. | v0.1 monthly mapping for B+4/B+5. |
| v0.2 | Weekly level change starts next Sunday. Monthly level change can take effect the same day; join the new group's **current** position, retain already recorded reading, never duplicate credit. | v0.1 next-day-only change. |
| v0.2 | A fully met day's personal reading commitment earns **one ship credit**, across levels. Thirty credits complete a ship. Khatma is a separate truthful record of whole-Qur’an completion. | v0.1 25-credit hypothesis. |
| v0.2 | Private reading calendar may show tier color/label, actual status, separate khatma mark. | v0.1 optional 7-day pattern only. |

## Tier inventory (founder-described; labels still provisional)
| Key | Reading commitment | Cadence | Important behavior |
|---|---|---|---|
| B | Daily Al-Baqarah | Daily/monthly reflection | One complete B day = one credit. |
| BI | Daily Al-Baqarah and Al-Imran | Daily/monthly reflection | Both surahs recorded as actual reading. |
| BJ1 | Daily B plus monthly one-juz group | Monthly | On calendar day 16 the group's nominal location is J16; B overlap never demands a second read. |
| BJ2 | Daily B plus two-juz group | Monthly | First day B alone may fulfil today's plan; next day continues group sequence. |
| BJ3 | Daily B plus three-juz group | Monthly | Three khatmas/month is the founder's description of this goal. |
| BJ4 | Daily B plus four-juz pace | Weekly Sunday–Saturday | Four daily gives 28; member chooses days for two additional juz. |
| BJ5 | Daily B plus five-juz pace | Weekly Sunday–Saturday | Five per day for six days, Saturday free/catch-up. “Al-maliki” association not verified as an official label. |

Every logged range uses a pinned canonical verse map; J1=1:1–2:141, J2=2:142–252, J3=2:253–3:92, B=2:1–286. Thus B alone includes all of J2 and part of J1/J3; a full juz is not inferred merely from touching it. A separate later rereading can be logged as a separate act, but there is no required duplicate to satisfy overlap. Source metadata: [Quran Foundation juz mapping](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/list-juzs/), cross-check [Al Quran Cloud](https://alquran.cloud/juzs). Edition-specific pages remain separate.

### Monthly policies and open implementation choices
Confirmed: month starts at J1; a one-juz group reads J1 on the 1st and J16 on the 16th. Each group is synchronized by calendar position rather than by an individual’s missed logs. The month aims at 30 juz per khatma; BJ2/BJ3 aim at two/three khatmas. February must distribute the final portions *ahead of the last day*, not silently omit J29–30 or surprise the member at the end. On a 28-day month the nominal additional load is two juz per khatma over the month; on a 29-day month one juz per khatma. A 31st has no mandatory group assignment; any reading remains truthfully logged, including catch-up, without calling rest a failure. Month 1 restarts at J1, without retroactively crediting unfinished prior cycles.

**Open: precise month grid.** The founder specified the principle, not which February dates carry the extras or which contiguous passage follows the day-one B overlap for BJ2/BJ3. Proposal for founder review: generate a previewable monthly group schedule distributing extras near evenly across earlier dates, with explicit B overlap and no same-act double credit; publish/version this schedule before the month, and permit founder overrides. A day-one BJ2 B-only prescription is a golden example and must survive schedule generation. Do not deploy the old `k×(day−1)` modulo formula: it presumes fixed juz chunks and can conflict with the founder's B-only start.

### Weekly policies and open implementation choices
Confirmed: Sunday creates a new `weeklyKhatmaId` at J1 even if the previous week ended incomplete; preserve the previous week as an honest incomplete record. A member's logged end verse determines the **suggested next unread verse** within the current weekly cycle; the suggestion is not a claim they read unlogged text. For B+4, the member can choose when to read more than four and log what happened. For B+5, six full five-juz days can finish the khatma, then Saturday may be used for catch-up, other reading or rest. Daily B is read once and overlap can contribute to the current khatma's coverage. A chosen daily plan and weekly remainder should be shown together.

**Open: exact daily completion denominator for weekly flexible pacing.** A member may choose an extra juz on Sunday after B; the app should not penalize the choice. Proposal: lock a member-chosen day's honest plan before or during reading and award up to one day credit for that plan, while separately showing progress toward the 30-juz weekly goal. Avoid a loophole where B-only plans every day show seven “complete BJ5 days” with an unfinished weekly khatma; test clear wording or a weekly plan-fit summary, and seek founder approval before shipping. A late edit must never retroactively create “easy” full-day credits without a visible plan revision.

### Level changes and dates
Monthly change effective **same local day** when chosen. Save a `CommitmentChanged` timestamp and a new assignment segment/version; preserve actual acts under the old segment, then present the new group's current passages. Matched verses from earlier that day count once as actual reading and can satisfy overlapping new passages without a second read. Daily ship credit is capped at one across both segments. The exact same-day denominator and whether a completed old plan earns the full credit before switching are open implementation decisions; proposal: keep earned fraction, compute the remainder from the new segment, cap at 1, never reduce earned credit due solely to switching. Weekly change queues for next Sunday. Across cadence changes (monthly↔weekly), proposed effective date follows the **destination** cadence, but founder confirmation is needed. Pause and travel/cutoff policies were not finalized in voice discussion; preserve honest absence and original local date/timezone.

## Decision register for sole founder review
| Label | Decision or remaining smallest question |
|---|---|
| Founder-confirmed direction | All decisions in v0.2 change history above. |
| Research-supported recommendation | Optional when/where cue, factual self-monitoring, nonpunitive return ([research](HABIT_ENGINE_RESEARCH.md)); not proven for this program. |
| Design hypothesis | Partial credits proportional to true assigned portion; progress carries across cycles; colors are category identifiers, never rank. |
| Open decision — founder | For February, which dates carry additional portions, and does the preview use a uniform distribution or member-selected heavier dates? |
| Open decision — founder | After B covers early juz on monthly day one, where exactly should BJ2/BJ3 group cursor start on day two: next unread **verse** or next whole juz? A verse-level cursor preserves the partial J3 reading. |
| Open decision — founder | How to treat same-day segment fulfillment on a monthly level switch and daily completion of flexible weekly plans without rewarding a trivial plan. |
| Open decision — founder | Does unfinished ship construction carry across month/week boundaries, or does a partly built ship become a dated unfinished vessel while a new one begins? The 30-credit ship rule itself is confirmed. |
| Open decision — founder | Confirm proportional partial credit, khatma coverage attribution on repeated B across multiple khatmas, exact category palette, pause/travel cutoffs and whether private streak is shown. |
| Open decision — founder | Approve exact Arabic quotation/verse reference, translation/context and placement from Nuh’s ship story; the metaphor must not promise spiritual protection or assign religious function to a surah. |

No other reviewer is assumed. Decisions not answered here remain explicitly configurable and must not be invented in implementation.

## Implementation update — 28 September 2026

The runnable confirmed core and policy registry are now in `data/program_rules.json` (`founder-core-2026-09-28.v1`). See `FOUNDER_BACKEND_REVIEW.md` and `docs/DECISION_HISTORY.md`. The older reasoning above is preserved; proposed fractional rewards/carry remain unapproved.
