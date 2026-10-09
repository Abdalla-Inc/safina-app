# Safinat Al-Nur — backend founder review

28 September 2026 · Local implementation v0.3.0 · Sole reviewer: founder

**The confirmed reading backend now runs. All 47 tests pass.** It stores exact member-reported reading, handles offline retries and corrections, distinguishes ship credit from khatma proof, preserves private historical tiers and explicitly withholds unapproved calculations. No production deployment, paid offer, public group post or full frontend integration has occurred.

The synthetic demo is available at `http://127.0.0.1:8765`; [health](http://127.0.0.1:8765/health) is public, while reading endpoints require a member token. Private synthetic demo credentials are in `local/demo-access.json`. Restart with `python3 -m scripts.run_demo` from this folder. [README](README.md) includes clean setup commands.

## Five concrete journeys

These are synthetic executable examples, not real member activity. Date fixtures use a fixed test clock so the whole September example can be reviewed.

| Journey | What the backend actually returns |
|---|---|
| **BJ2 on 1 September reads B once** | One act, **286 unique verses**, full approved day, **1 credit**. J2 is fully covered; J1 and J3 are only partial. The next factual gap is 1:1. Day two returns `SCHEDULE_NOT_PUBLISHED`, with the recorded B intact. |
| **BJ3 → BJ1 at 14:00 on 16 September** | The new group position is **J16: 18:75–20:135**, alongside B. The morning B act remains. Calendar history keeps both day-16 tier labels and the old labels on earlier dates. Mixed-day credit is **unresolved**, with the exact founder question. |
| **BJ5 incomplete Saturday → Sunday** | Saturday's B remains in its old, incomplete weekly cycle. Sunday 13 September begins a new cycle at **1:1**, with zero logged coverage. Weekly remaining ranges are factual; unapproved daily completion credit stays unresolved. BJ5 Saturday is explicitly free/catch-up. |
| **B-only member completes 30 September days** | **30 approved credits and one ship provable within September**, with **no khatma**. Correct one full act to partial: the total becomes 29 approved credits plus one unresolved partial day; the false completed-ship result disappears. Lifetime/current-ship presentation across periods remains unset. |
| **Member corrects an in-app reader suggestion** | Exposing B creates a provisional suggestion with **zero credit**. The member confirms only 2:1–141, then corrects it to 2:1–100. Original observation and both actual revisions remain auditable. The result is **100 unique verses, partial reading, unresolved fractional credit**. |

Inspect the real responses: [BJ2 day one](contracts/fixtures/bj2-day-one.json), [day-16 switch](contracts/fixtures/bj1-day16-switch.json), [Sunday reset](contracts/fixtures/bj5-sunday-reset.json), [B-only ship](contracts/fixtures/b-only-ship.json), [reader correction](contracts/fixtures/reader-correction.json).

## Working independently now

- Immutable rule/reference registry and published snapshots for confirmed assignments: B, BI, non-February BJ1, BJ2 day-one B, monthly free day 31, weekly cycles and BJ5 free Saturdays.
- Exact inclusive verse ledger; overlap once; explicit repeat acts; manual physical-Mushaf and direct-row reporting; partial continuation; late entries, revisions and undo.
- Server-derived day evaluation, private calendar, khatma proof, full-day credit, ship accounting and deterministic replay. Corrected false progress is removed with a neutral explanation.
- Reader observation/suggestion lifecycle with explicit member confirmation/override. Page-open, audio and elapsed time confer no reading credit.
- Idempotent offline mutations, revision conflicts, original-zone/date retention, version checks and server-verifiable signed snapshot envelopes.
- Separate optional dhikr goals/count revisions; free entitlement response without any guessed price.
- Typed, versioned draft persistence for classroom, content, rights, entitlements and community relationships. These are preparation contracts, not live published features.

The reference has 114 surahs, 30 juz and one explicitly named 604-page edition. All chapter counts and juz/page boundaries were compared against saved provider metadata; a further provider check matched the chapter counts and juz ranges. [Provenance and rights limits](docs/DATA_PROVENANCE.md) distinguish these checks from independent religious verification and asset permission.

## Still gated or absent

| Area | Exact status |
|---|---|
| February, BJ2/BJ3 later grids | `SCHEDULE_NOT_PUBLISHED`; actual reading still saves. |
| Weekly daily target credit, same-day mixed credit, partial fraction | `RULE_NOT_APPROVED`; unresolved credit is `null`, never guessed zero/half/one. |
| Cross-cadence switches, pause/travel credit, multiple khatma attribution, monthly day-31 khatma attribution | Explicit policy gates. Original reading remains recorded. |
| Ship carry and visual period | Ledger credits preserved; `currentShip` and `lifetimeShipCount` remain `null`. |
| Arabic reader text, word-position weights, fonts/audio, other Mushaf editions | Not bundled or served; only exact metadata and the validated edition map are available. |
| Classroom delivery/grading, paid grants/billing, searchable media | Draft schemas/persistence and clear gates; no curriculum, auto-grading, price or rights approval fabricated. |
| Groups, consented publication, feed/chat/reactions/moderation/notifications | Draft contracts only. All live group endpoints are blocked pending policy, including requests with apparent consent. No automatic disclosure. |
| Reminder delivery | Preference storage only; no notifications sent. |
| Production operations | Local bearer-token provisioning, SQLite and bounded history. Production identity, public-key client verification, retention/deletion, scale/pagination and deployment hardening remain engineering work. |

## Evidence and handoff

Actual check: **47 tests in 4.153 seconds — OK, zero failures, zero skipped tests.** [Full test output](docs/TEST_OUTPUT.txt) and [coverage/limitations](docs/TEST_COVERAGE.md). Tests include real HTTP requests, persisted corrections, concurrent retries/edits, two years of calendar properties and randomized bounded-credit/overlap checks. The CI workflow is supplied but has not run remotely.

Live smoke check: `GET /health` returned 200; authenticated BJ2 day-one returned one credit/286 verses; BJ2 day-two returned the correct unpublished-schedule state. The initial sandbox socket restriction was resolved for the HTTP check; no application test remains failing.

Frontend handoff: [API guide](contracts/API_HANDOFF.md), [OpenAPI](contracts/openapi.json), [111 named schemas](contracts/schema.json) and [seven-tier fixtures](contracts/fixtures/today-BJ1.json). Audit: [retained/revised inventory](docs/AUDIT.md). Current authority: [rule registry](data/program_rules.json) and [decision history](docs/DECISION_HISTORY.md).

The next review is [FOUNDER_DECISIONS_NEEDED.md](FOUNDER_DECISIONS_NEEDED.md): twelve specific decisions, each with an option, alternative, effect and worked example. No broad approval is needed to inspect or test the local backend; production schedules and integration must follow those explicit choices.
