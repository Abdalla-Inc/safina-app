# Safinat Al-Nur — founder frontend research review

**Gate 1 · 25 September 2026 · Decision requested: research feedback and access to the latest engine/coach material.** This review stands alone. No final screens, interactive prototype, or app code were produced. No installed-app testing or member interviews occurred. Public product documentation and published images were audited; direct visual claims are restricted to those images.

## What was available and what it means

The design brief establishes the Arabic-first, short daily loop: see exact wird, read in real life, record actual passages, acknowledge effort through a quiet Safina, and leave. A repository, current coach handbook, usable current-screen capture, and approved Qur’an dataset were **not** supplied. The earlier illustrated ship/level screenshot is an unverified attempt, not the design baseline. I found the saved [proposed engine v0.1](HABIT_ENGINE_SPEC.md), [program questions](PROGRAM_RULES_AND_OPEN_QUESTIONS.md) and [engine founder review](FOUNDER_REVIEW.md). They propose occurrence slots, a ledger of actual acts, corrections, overlap handling and versioned ship progression; they expressly say coach rules and 25-credit pacing are **not approved**. The engine team may have progressed since those files were saved.

**Retain as a design principle:** exact canonical passage references, separate assigned and actual reading, revision lineage, and semantic progression data. Verify actual code if a repository arrives. **Do not adopt as a rule:** guessed monthly juz formula, official tier names, whether overlapping Al-Baqarah is a second recitation, 25-credit thresholds, or reader scope.

## Screen examples and annotations

These are links to official published examples, not newly drawn Safinat screens:

| Example | What the owner documents or pictures | Design reading and evidence limit |
|---|---|---|
| [Tarteel Goals and Today's Goals](https://support.tarteel.ai/en/articles/12782033-how-do-i-use-the-goals-feature) and [off-platform session](https://support.tarteel.ai/en/articles/12414408-how-to-add-an-off-platform-session) | Range/portion/schedule goal, Today shortcut to the reading portion, and manual logging after reading outside the app. | Preserve plan vs actual and off-device honesty. Its red missed-state treatment and nested session route need a live inspection and member test before borrowing. |
| [Duolingo illustrated walkthrough](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/) | Published mobile images show separate course, level and reminder choices; path emphasizes next lesson; settings show reminder control. | A short, load-aware commitment choice and one obvious next task transfer. XP, leaderboards, hearts and paid streak repair do not fit the stated worship boundary. Images may predate current app. |
| [Finch home guide](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page) | Owner describes goals energizing a pet, then an adventure, with quests/shop/friends tabs. | A calm, responsive Safina can represent accumulated action; building it must require no extra chores or store. Current mobile interaction was not tested. |
| [Muslim Pro khatam plan](https://support.muslimpro.com/help/en/articles/how-to-plan-my-own-khatam) and [Qur’an widget examples](https://helpdesk.muslimpro.com/help/en/articles/homescreen-updated-widget-android) | Owner supports physical Qur’an reading and a return to last-read ayah in its reader. | Provide a deliberate external-reading route and optional return shortcut; opening the reader never proves reading. Exact logging screen unverified. |
| [Quran.com Growth Journey images](https://quran.com/product-updates/quran-reading-streaks) | Published goal/history examples use surah/juz ranges and daily progress. | Range labels and history are relevant; the old web images do not validate current mobile UI or a timer/streak as fulfillment. |
| [Athkar Arabic listing](https://apps.apple.com/us/app/athkar-%D8%A3%D8%B0%D9%83%D8%A7%D8%B1/id374050672) | Store images and description cover categorized Arabic reading, font settings and reminders. | A starting reference for Arabic density and controls, not a tested flow or approved religious copy. |

Also reviewed [Streaks](https://streaksapp.com/) for short task completion and scheduling and [Quranly](https://apps.apple.com/us/app/quran-by-quranly/id1559233786) for themes/history/community claims. Their current Arabic logging, lapse and accessibility behavior remains unverified. The full per-product and flow evidence ledger is in `COMPETITOR_SCREEN_AUDIT.md`. Product popularity and marketing do not prove effectiveness for this program.

## Transferable patterns and anti-patterns

| Opportunity to explore | Risk to explicitly test or avoid |
|---|---|
| Exact assignment card grouped by component, with clear completed/partial/additional sections | One long multi-juz string, color as the only status signal, or an inferred “done” from opening/timing |
| Quick full-plan log plus precise partial-range entry and a visible correction route | Binary checkbox that conceals partial truth; confusing a repeated recitation with unique coverage |
| Small immediate factual acknowledgement and a text-explained Safina state | Spectacle, ship maintenance chores, spiritual ranking or credit formula recreated in the UI |
| Today-first return, optional sustainable commitment review and private journey | Loss animation, retroactive backlog or public quantity/leaderboards |
| Optional reminders, readable offline pending state, separate sharing consent | Lock-screen reading disclosure, silent sync changes, forced social proof |

These are hypotheses, not findings from Safinat members. Recruit low/high commitment, returning, older/less technical and varied Arabic-fluency participants on small and large iOS/Android phones. Observe their first unassisted Today, partial/repeat log, correction, offline message and months-later return. Interview none until the coach can introduce willing members; no participant result is claimed here.

## Arabic and accessibility guardrails

Use RTL structural layout and isolate mixed verse keys/numerals/Latin strings; test punctuation, diacritics and long labels at 200% text. W3C's [Arabic layout draft](https://www.w3.org/TR/alreq/) and [bidi guidance](https://www.w3.org/International/questions/qa-html-dir) describe the issues; [Apple RTL guidance](https://developer.apple.com/design/human-interface-guidelines/right-to-left) covers mirrored patterns. Meet [WCAG 2.2](https://www.w3.org/TR/wcag/) contrast and target criteria and aim for [Android's 48dp touch guidance](https://developer.android.com/guide/topics/ui/accessibility/apps). Give the ship a meaningful text status and a reduced-motion alternative. Validate VoiceOver/TalkBack with actual Arabic strings. No universal Arabic font, numeral convention or line length has been selected by research alone.

Show no invented scripture. Select a verified edition and permitted source before any verses appear. [Quran Foundation terms](https://api-docs.quran.com/legal/developer-terms/) restrict alteration and redistribution; [Tanzil](https://tanzil.net/download/) has separate attribution/verbatim terms. Page numbers require a Mushaf-specific mapping. A fluent Arabic reviewer checks all interface copy and the coach checks religious language.

## Capability recommendation

1. Read-only, pinned review of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (NextLevelBuilder, MIT, v2.15.0 listed 13 Aug 2026): useful for broad visual exploration; presets do not establish Arabic or devotional fit.
2. Read-only, pinned review of [`ehmo/platform-design-skills`](https://github.com/ehmo/platform-design-skills) (ehmo, MIT, changelog v1.1.1 March 2026): iOS/Android checklist; cross-check scraped and previously corrected claims with current official HIG and Android guidance.
3. Conditional iOS review of [`dadederk/iOS-Accessibility-Agent-Skill`](https://github.com/dadederk/iOS-Accessibility-Agent-Skill) (MIT, no verified release date, work in progress): VoiceOver/text-scaling reminders, paired with Android and human testing.

No third-party pack was installed. Before any adoption, inspect exact commit, license, installer writes, dependencies, hooks, network access and source provenance; founder reviews the choice and access need. [`Community-Access/accessibility-agents`](https://github.com/Community-Access/accessibility-agents) is deferred because installer/hooks and version mismatch add trust work. A React Native component library is premature without a chosen stack. Detailed files and conditions are in `GITHUB_SKILLS_AUDIT.md`.

## Decisions and requests for the engine architect

| Owner | Smallest artifact or answer needed | Why design is blocked |
|---|---|---|
| Coach | Current Arabic tier sheet with actual load, and September 25 examples for 2, 4 and 5 ajza’ | Truthful commitment choice and scannable Today fixture |
| Coach | Does one recitation satisfy both Al-Baqarah and overlapping Juz 2? | Log affordance, repeat explanation and quick-log semantics |
| Coach | February/day 31, cutoff, timezone/travel, pause and return policy | Correct dated assignment and lapse language |
| Engine owner | Latest **approved versus proposed** architecture, assignment/slot and actual-act JSON, error/duplicate/correction contract | Frontend must render exact ranges and permit honest edits without calculating rules |
| Engine owner | Evaluation states, separate unique/repeated/supplemental fields, versioned ship state with explanation, offline provisional/authoritative status | Today, acknowledgement and history cannot make their own awards |
| Founder | Reading route, sharing audience, reminder defaults, Safina pacing and semantic mapping after coach/engine review | Determines experience scope, privacy and visual constraints |

Request fixture responses for a simple day, a dense multi-range day, partial, repeated overlap, extra reading, correction reversing a milestone, paused/no-entry, 60-day return, and offline retry/conflict. `ENGINE_DEPENDENCIES.md` gives the field-by-field table and absent-state behavior. The saved engine v0.1 is useful context, but **please supply the other AI's latest output when ready**; the next design gate reconciles it before any direction is drawn.

## Proposed next phase and gate

After the founder comments on this research **and authorizes design exploration**, reconcile latest engine/coach material; map flows and data states; produce three genuinely different directions on the same Today, logging, Safina and return tasks, with small/large Arabic phones and accessibility/engineering tradeoffs. Pause for founder selection. Only then make an interactive high-fidelity prototype and member-test it. Production implementation needs its own later approval. **This delivery stops at research.**
