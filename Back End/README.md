> October update: connected API v0.5 adds country setup, custom Quran reading, daily istighfar and emoji reactions. See [delivery and remaining deployment inputs](docs/OCTOBER_DELIVERY.md).

> **Connected app update (v0.4, 30 September 2026):** The new account API and frontend connection are implemented separately from the legacy local slice documented below. Start with [connected setup](docs/CONNECTED_SETUP.md), [delivery review](docs/CONNECTED_DELIVERY_REVIEW.md), and [connected API handoff](contracts/CONNECTED_API_HANDOFF.md). Live identity/media/hosting still need configuration; no preview data is imported.

# Safinat Al-Nur backend — local slice v0.3.0

Start with [FOUNDER_BACKEND_REVIEW.md](FOUNDER_BACKEND_REVIEW.md). This is a runnable backend with a persistent reading ledger, exact verse coverage and explicit policy gates. It contains no frontend and performs no external publication or deployment.

Python 3.9+ with SQLite JSON support and an IANA timezone database is sufficient. No third-party runtime packages or network calls are needed. Tested locally on Python 3.9.6/macOS; the included Linux/Python 3.9/3.12 CI workflow has not run remotely because this folder has no Git repository.

## Run

From this `Back End` directory:

```sh
python3 -m safina init
python3 -m safina member local-member --tier BJ2 --timezone Australia/Brisbane --start-date 2026-09-01
python3 -m safina serve --port 8765
```

The member command prints a unique bearer token once; save it privately. Re-running the same member ID does not reset or overwrite it. Use `Authorization: Bearer <token>` for every endpoint except `GET /health`. The database defaults to `local/safina.sqlite3`. The CLI uses private file creation permissions. Only loopback binding is allowed.

Use `GET /today?date=2026-09-01` to inspect BJ2's approved day-one assignment, or `GET /today` for the actual current local date. Later BJ2 dates correctly return an assignment with `status: awaiting_policy` and `SCHEDULE_NOT_PUBLISHED`; manual actual reading can still be logged against that snapshot.

Every response is JSON. [contracts/openapi.json](contracts/openapi.json) describes endpoints; [contracts/API_HANDOFF.md](contracts/API_HANDOFF.md) explains offline and conflict handling. Token provisioning is a local development mechanism, not a deployed account system.

For server-verifiable offline snapshots, set `SAFINA_SIGNING_KEY` to a private random secret before starting the service. Keep it stable across restarts. The key never goes to a frontend; this version does not provide client-verifiable public-key signatures. Without a key, the signed snapshot endpoint returns `SIGNING_NOT_CONFIGURED`; ordinary reading works.

## Verify and replay

```sh
python3 -m scripts.check
python3 -m safina replay local-member
python3 -m scripts.build_fixtures
python3 -m scripts.build_contracts
```

`check` writes actual output to `docs/TEST_OUTPUT.txt`. Its HTTP test needs permission to open a temporary loopback port. In restricted macOS environments, set `PYTHONPYCACHEPREFIX=/private/tmp/safina-pycache` if Python attempts to write its cache outside the workspace. No test requires external network access.

The fixture generator uses synthetic members and a fixed test clock. Fixtures are executable scenarios, not real member history. Unapproved outcomes are labeled `awaiting_policy` rather than asserted as approved schedules.

## Modules

- `safina/domain.py`: canonical range algebra, civil cycles, approved assignment templates, fail-closed evaluation.
- `safina/service.py`: member scope, effective commitments, trace confirmation, actual acts/revisions, replay, calendar, credit and khatma proof.
- `safina/store.py`, `migrations/`: transactional append-only events, revisioned records, member authentication and idempotency receipts.
- `safina/api.py`: local HTTP adapter; no cookies, public reading feed, third-party telemetry or reminder delivery.
- `safina/modules.py`: separate dhikr functionality, free entitlement response and validated versioned content/community draft persistence. Paid grants, classroom delivery/grading, search and group publishing remain gated.
- `data/`: pinned metadata, source receipts and rule registry. Qur’an text, word counts, fonts and audio are not bundled.

The database uses one append-only `records` table with named SQL views for typed domain records. This is deliberate for a small local slice, not a claim of full normalized production tables. Domain relationships are validated in the service; schema validation covers draft authoring. Snapshots are reproducible, events authoritative, and corrections append rather than overwrite.

To save a locally reviewed draft for later editorial work, use `python3 -m safina draft ClassroomCourse course-1 path/to/input.json`. Input schemas are in `contracts/schema.json`. This CLI does not make content public or grant paid access.

## Prepared synthetic demo

A local synthetic demo was seeded for all seven tiers, with a BJ2 day-one B act. Run `python3 -m scripts.run_demo`; private tokens are in `local/demo-access.json`, excluded from version control. `GET /health` needs no token. This demo is not real member activity. For a new demo in a fresh checkout, run `python3 -m scripts.seed_demo` first; it will refuse to overwrite an existing demo database.
