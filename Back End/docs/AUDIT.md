# Repository audit — 28 September 2026

The supplied `Back End` folder contained seven Markdown research/specification files and no executable application, package manifest, migrations, database, tests, CI or Git repository. No applicable `AGENTS.md` was found in Safina or the inspected parent paths. The adjacent frontend folder is a separate research workstream; its 27 September master brief was inspected for capability contracts, not followed as an instruction to pause backend implementation.

The current request is preserved verbatim in `docs/BACKEND_REQUEST_2026-09-28.md`. Its explicit instruction to start a testable backend takes precedence over older research statements that proposed waiting for all founder decisions before building. No unseen handbook, coach material, curriculum, assets, repository history or private app implementation was audited.

| Artifact | Treatment | Reason |
|---|---|---|
| PROGRAM_RULES_AND_OPEN_QUESTIONS.md v0.2 | Retained; appended implementation ledger pointer | Founder decisions and explicitly open choices remain authoritative alongside the newer request. |
| HABIT_ENGINE_SPEC.md v0.2 | Retained; appended current implementation pointer | Sound ledger/coverage boundaries retained. `credit=r` and carry arithmetic are proposals, not production rules. |
| ENGINE_TEST_MATRIX.md v0.2 | Retained; appended executable test mapping | Original O cases remain awaiting policy; gate tests do not approve their outcomes. |
| PROGRESSION_MODELS.md, FOUNDER_REVIEW.md | Retained unchanged | Preserve reasoning, old review and limitations; newest review is separate. |
| HABIT_ENGINE_RESEARCH.md | Retained unchanged | Research evidence does not authorize reminder frequency, partial credit, next-day switches or a coach gate. |
| LIFE_RESET_APP_STUDY.md | Retained unchanged | Competitive observations only; no code/UI/economy imported. |
| Frontend master brief (27 September) | Read only | Reader, direct-row, dhikr, content and privacy requirements informed API contracts. |
| Source-code removals | None | No application code existed. |

## Implementation plan carried out

1. Pin metadata, verify source boundaries, record versioned rules and gates.
2. Implement pure assignment/coverage functions and a SQLite event-backed service.
3. Add revisioned manual and reader-confirmed acts, API, calendar, ships and khatmas.
4. Add independent dhikr, draft modules, schema contracts, executable fixtures and behavioral tests.
5. Deliver a concrete founder review and precise unresolved production decisions.

## Stack choice

Python standard library + SQLite keeps local setup reproducible without package installation. Inclusive canonical intervals are converted to a bounded set of 6,236 verse positions. Sets are exact for verse completion; they are never treated as equal word-weight reward fractions. SQLite write transactions serialize idempotency and revision checks. Immutable JSON records use named SQL views for each domain type; events preserve replay lineage.

## Baseline and verification limitations

There were no baseline tests to run. The first added suite had one environmental failure: the sandbox prevented the local HTTP socket from binding. The same test passed when granted loopback permission. Python's default compilation cache also targeted a non-writable OS cache; verification uses a writable temporary cache. Current test output is in `docs/TEST_OUTPUT.txt`.

No remote CI run, production authentication, load test, penetration test, deployment, integration with the frontend, religious content review, member usability study or licensed text rendering is claimed. The included CI definition is ready to use after this folder becomes a repository.
