# Backend decision history

## 2026-09-28 — implementation v0.3.0

Authority: `docs/BACKEND_REQUEST_2026-09-28.md`, incorporating the v0.2 founder decisions in `PROGRAM_RULES_AND_OPEN_QUESTIONS.md`. Machine-readable registry: `data/program_rules.json`, version `founder-core-2026-09-28.v1`. No invented founder approval timestamp is stored.

- Confirmed production calculations in this **local** slice: B, BI, BJ1 non-February calendar positions, BJ2's day-one B fixture, monthly free 31st, weekly Sunday cycles, BJ5 Saturday free/catch-up, exact overlap, full approved day = one credit, 30 credits within a period = a ship, actual coverage proof, private history and explicit self-report.
- Partial rewards and carry remain proposed; flexible weekly targets, same-day mixed credit and the other listed choices remain open. An unresolved value is `null` plus policy state, never a guessed fraction, false completion or a secret default.
- Superseded: additive required B reading, 25-credit ships, monthly cadence for all levels, next-day-only nonweekly changes, and the old requirement to wait for all decisions before implementing independent code. Historical prose and rationale were retained.
- B/BI are daily commitments, not synchronized juz groups: their exact daily prescriptions continue on the 31st. Monthly juz groups have the explicit free 31st. This scope follows the current request's distinction between daily B/BI and monthly groups.
- BJ2's explicit first-day B fixture is available even in February; its remaining February schedule is not published. BJ1's entire February grid is withheld because approving only nominal dates could silently preempt extra-load dates.
- Weekly suggestions mean first uncovered verse of the current cycle, not “the verse after the last page visited.” A Sunday always shows a fresh cycle even if the previous one remains incomplete.
- Monthly day-31 catch-up attribution was explicitly open in v0.2. The act is preserved and flagged but cannot establish a monthly khatma until approved. Weekly Saturday catch-up may establish its current weekly coverage as expressly described.
- First khatma proof uses one actual unique union; additional khatma attribution stays gated. Repeated act history is preserved without allocating the same actual act twice.
- Ship API exposes approved ledger totals and ships provable within one month; lifetime ship count/current build remain unresolved across periods. This is a bounded result, not approval of a visible monthly archive or cross-period carry.
- Engineering choices: Python 3.9+/SQLite standard-library stack, immutable event and record storage, member tokens for loopback development, server-verifiable HMAC snapshots. These are reversible local implementation decisions, not religious/commercial policy.

## Next rule approval

Create a new version; keep this registry and the supplied v0.2 documents. Include founder source, concrete date/verse fixtures and a migration/compatibility policy. Old offline entries must reconcile explicitly rather than change tier or interpretation silently.
