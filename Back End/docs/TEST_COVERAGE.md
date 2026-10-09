# Executable coverage and honest limits

Final local command: `python3 -m scripts.check`. Python 3.9.6/macOS, 47 passing tests, no skipped tests and no current failures. The actual output is preserved in `docs/TEST_OUTPUT.txt`. The runner also rebuilds/validates all pinned surah/juz/page boundaries from the saved source files. No line-coverage percentage is claimed.

| Earlier matrix / requirement | Executable evidence | Limit |
|---|---|---|
| R01–R02 canonical and page map | Full reference partition/primary-crosscheck hashes; 114 counts, 30 juz, 604 page boundaries, wrong-edition rejection | No word map, text integrity validation or second real edition available. |
| C01–C03, M02 overlap/partial/repeat | BJ2 B-only credit; J2 complete but J1/J3 incomplete; exact range union; duplicate/report identity; partial continuation | Partial reward itself remains unresolved. |
| C04–C08, K01–K02 ships/khatmas/corrections | 30 B days prove a ship without khatma; whole weekly Qur’an before ship; corrections remove false ship/khatma; immutable history/reopen/replay | No approved carry or weekly full-day denominator. |
| M01, M03–M08 dates/switches | J1/J16, February 28/29 gates, day31/rest/reset, same-day segments, old offline act retained, post-switch stale assignment rejected | Tests approve gate behavior, not a February/BJ2/BJ3 grid or mixed credit formula. |
| W01–W07 weekly | Sunday reset and incomplete prior week; BJ5 six-day coverage; Saturday free/catch-up; BJ4 28 vs extra two; queued next-Sunday change | No guessed member day-plan minimum or daily reward formula. |
| T01 civil time | Local midnight, Sydney DST entry/exit offsets, Sunday calendar properties, London travel data retained with policy gate | No approved travel/pause transition cutoff; primary member zone cannot be edited yet. |
| C09/C10 reader/offline | Observations/page opens/audio give zero; user overrides/edits/discards; one linked act; UUID retry, logical ID dedupe, stale version, revision conflict | No actual text renderer, exposure-duration algorithm or client public-key verification. |
| Privacy/U01/U02 | Separate member tokens; own-resource reads; correction ownership; no automatic publication; historical tier labels stay stable | Live group posting is intentionally gated, so no claim of successful consented production posting. |
| Broader modules | Dhikr count revision isolation; validated ten-week draft; publication/search/grading gates; null price | Draft scaffolding is not a deployed classroom, search engine, entitlement grant or group service. |
| Property tests | 150 seeded random coverage sets, bounded daily credit, duplicate-union invariance; 730 civil dates across weekly/monthly boundaries | Deterministic randomized tests, not an exhaustive formal proof or a third-party property-testing library. |
| Transaction races | Two real SQLite connections retry the same mutation and compete on one expected revision | Local contention checks, not multi-host stress/load testing. |
| API/contracts | Real loopback HTTP auth/read/write/privacy/error checks; every consumer fixture conforms; schema refs resolve | Contract checker implements the documented JSON Schema subset, not a complete general-purpose validator. |

No frontend usability, Arabic editorial/religious review, production auth security audit, notification outcomes, service load, real network outage or remote CI result is claimed. The first HTTP run failed due to sandbox socket permission; it passed after local loopback access was allowed. These limitations are release work or explicit policy gates, not hidden passing tests.
