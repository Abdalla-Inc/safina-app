# Safinat Al-Nur — frontend research, gate 1

**25 September 2026 · Research only.** No member interview, installed-app walkthrough, final screen, interactive prototype, or production frontend was completed. Sources below were reviewed as public documentation or official screen examples. A repository and current coach handbook were not supplied. The existing [proposed engine specification](HABIT_ENGINE_SPEC.md) and [founder engine review](FOUNDER_REVIEW.md) were read from the project files; they are proposals, not coach-approved rules.

## Product frame and decision register

| Class | Current statement | Consequence / owner |
|---|---|---|
| Founder direction | Arabic-first companion; today’s wird → real reading → truthful actual log → quiet Safina acknowledgement → exit. Preserve dignity on partial, missed, paused and returning days. | Use as design acceptance criteria; founder to confirm any change. |
| Confirmed program rule | None independently verified. Examples B, BI and B+1–5 ajza’ appear in founder material but official names, quantities and calendar are pending. | Coach must provide current level sheet and dated examples. |
| Approved engine contract | None. `HABIT_ENGINE_SPEC.md` is explicitly v0.1 proposed. | Prototype later against versioned fixtures, replace after engine owner signs contract. |
| Research finding | Tarteel documents a multi-range goal and off-platform logging; Muslim Pro documents a khatam plan and physical Qur’an reading; Duolingo exposes streak insurance and score/quests. | Learn the assignment/log separation; do not import streak economics. See competitor audit. |
| Design hypothesis | One primary action, scannable passage groups, factual partial acknowledgement, ship as a secondary visual state, and a visible offline pending state reduce uncertainty and pressure. | Test with members; not established effectiveness for Qur’an practice. |
| Open founder/coach decision | Additive overlap, month/day cutoff, official level load, reading route, ship mapping, supplemental reading and privacy controls. | Exact questions in `ENGINE_DEPENDENCIES.md`. |

## Context audit

- The proposed engine has assignment occurrence slots, inclusive surah/ayah intervals, actual-reading acts, revisions, unique coverage, repeated acts, daily evaluation, and progression outputs. Its 25-credit ship and 2/7/15/22/25 milestones are explicitly **unapproved**. Do not show those numbers as actual product settings.
- A selected uploaded screenshot (`IMG_2069.jpeg`) appears to show an earlier illustrated ship/level concept, but OCR is unreliable and image pixels were not available in this review. Treat it solely as evidence that a theatrical ship and tier display were tried; it cannot establish current rules or visual authority. A promotional ship poster (`IMG_2071.jpeg`) likewise cannot verify app UI or policy. No source repository or current screens were supplied, so no code, component, or Qur’an reference implementation could be retained or rejected after inspection.
- Retain the **conceptual separation** of canonical passage identity, planned occurrence and actual act because it supports precise logging and corrections. Verify any future repository’s actual implementation before claiming its code is sound.

## Behavioral and visual opportunities

1. **Make today's assignment actionable.** The first viewport should answer which passages, what has been recorded, and the next action. A dense multi-juz assignment needs groups and exact start/end references, not one long prose string. A separate actual ledger prevents a plan from looking completed because a reader opened.
2. **Make the record truthful without becoming a form.** Offer a quick full-assignment choice and a precise range route; show what will be saved before confirmation, with repetition distinct from overlapping unique verses. A partial range and extra reading should remain legible. Corrections and late entries need a human-readable reason for changed evaluation.
3. **Let the ship acknowledge rather than command.** A still illustration with a short status explanation can accompany the task. An earned change may animate briefly when motion is allowed, but the same state must be conveyed in text and static imagery. Exact parts, thresholds and rendering technology depend on approved engine output.
4. **Protect the return.** The proposed engine says no backlog or ship decay after absence, but this remains an approval-dependent policy. Explore a gentle today-first entry, with optional commitment review, and test whether any historical count triggers guilt.
5. **Keep reading outside the app valid.** Official Tarteel and Muslim Pro materials both describe routes for reading beyond the app. The member should never need a timer or captive reader to receive credit for a self-reported act.

## Arabic, RTL, accessibility and content checks

| Concern | Design/research action | Evidence and limit |
|---|---|---|
| Direction and mixed strings | Establish RTL base direction and semantic reading order; isolate verse keys, Latin account text and inline numerals; test `البقرة ٢:١–٢٨٦`, `Juz 25`, dates, punctuation and long surah names at narrow width. Mirror navigation/progress direction where it represents reading, not inherently directional content. | [W3C Arabic layout draft](https://www.w3.org/TR/alreq/), [W3C bidi guidance](https://www.w3.org/International/questions/qa-html-dir), [Apple RTL HIG](https://developer.apple.com/design/human-interface-guidelines/right-to-left). The W3C Arabic document is a draft, not a prescribed font or numeral choice. |
| Typography | Test Arabic UI font at small and 200% scale with diacritics, ascenders/descenders and multi-line buttons. Measure line length and density with members; do not invent a universal Arabic character count. Select Arabic-Indic or European digits with audience/locale testing. | [Apple Design for Arabic](https://developer.apple.com/videos/play/wwdc2022/110441/), [W3C Arabic layout](https://www.w3.org/TR/alreq/). No member preference data yet. |
| Touch and contrast | Design mobile controls around at least 48dp touch areas; verify WCAG 2.2 contrast (normal text 4.5:1, large text and nontext UI 3:1) and target-size criteria. Test high contrast, keyboard and screen reader focus. | [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps), [WCAG 2.2](https://www.w3.org/TR/wcag/). Native platform rules differ from CSS pixels. |
| Motion, ship and status | Reduced-motion state uses no essential animation; screen reader announces factual change once. Ship has a concise semantic state and separate passage/evaluation description. | [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Apple reduced motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria). Test VoiceOver and TalkBack later. |
| Qur’anic content | Prototype with references only until an authorized edition/script, verified text source and page map are chosen. Do not synthesize verses. Visually separate scripture from interface copy; Arabic reviewer and coach validate religious phrasing. | [Quran Foundation API and terms](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/content-apis/), [developer terms](https://api-docs.quran.com/legal/developer-terms/), [Tanzil terms](https://tanzil.net/download/). Page numbers vary by Mushaf edition. |
| Offline | Cache a versioned assignment, mark unsynced actual entries clearly, let the member inspect conflict/correction, and label any local evaluation provisional until server confirmation. | Proposed engine contract only; offline technology and final reconciliation remain unspecified. |

## Member research plan, not completed evidence

Recruit through the coach with consent: at least two lower-commitment members, two higher-commitment members, two returning after a lapse, and two older/less technical members, with overlap allowed. Include differing Arabic reading fluency, iOS/Android and small/large phones. Observe unprompted comprehension of a multi-range Today assignment, logging half a passage, separate repeat versus overlapping Juz, a backdated correction, offline pending state, and return after months. Ask what ship imagery communicates without presuming the answer. Record task success, wrong credit assumptions, time in app, accessibility barriers, and pressure/comfort language. Do not present simulated answers as interviews. Recruit an independent fluent Arabic reviewer for copy and coach review for religious wording.

### Provisional microcopy for comprehension testing

| Arabic draft | English gloss | Constraint |
|---|---|---|
| `ورد اليوم` | Today's reading assignment | Use only when today's assignment is an approved engine response. |
| `سجّل ما قرأته` | Record what you read | A tap opens a truthful entry flow; it does not itself earn credit. |
| `قرأت جزءًا من ورد اليوم` | I read part of today's assignment | Let the member specify exact passage; never assume intent or merit. |
| `قراءة أخرى للمقطع نفسه` | Another reading of the same passage | Show only if the coach confirms repetition semantics. |
| `حُفظ التسجيل على هذا الجهاز، ولم تتم مزامنته بعد` | Your entry was saved on this device and has not synced yet | No authoritative ship award until sync state is clear. |
| `مرحبًا بعودتك. ابدأ بورد اليوم عندما يناسبك` | Welcome back. Begin today's assignment when it suits you | Conditional on the coach approving no automatic backlog. |

These strings are **machine-drafted interface examples**, not final Arabic and not religiously approved. A fluent reviewer should check register, dialect reach, numerals, diacritics and screen-reader pronunciation; the coach should approve devotional wording.

## Design phase proposal after this gate

1. Obtain the newest engine owner contract and coach approval record. Reconcile field names, evaluation states, and offline/correction examples in an interface table.
2. Map information architecture and each member journey with explicit empty, partial, error, offline and return states. Use only labeled fixture passages.
3. Draw three different directions on identical Today, logging, Safina and return tasks: restrained editorial, atmospheric spatial, and warm tactile are **exploration prompts**, not mandated styles. Compare readability, emotional effect, motion and build cost on small and large phones.
4. Obtain founder direction selection, then prototype, test with members, revise, and seek separate implementation approval.

See `COMPETITOR_SCREEN_AUDIT.md`, `GITHUB_SKILLS_AUDIT.md`, `ENGINE_DEPENDENCIES.md`, and the self-contained `FOUNDER_RESEARCH_REVIEW.md`.
