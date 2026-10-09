# Prototype routes and working flows

All routes are hash routes under `http://127.0.0.1:5178/`; browser Back/Forward works. No account or payment needed. Local state persists across reloads.

| Route | Flow / actions | Boundary |
|---|---|---|
| `#/welcome` | Choose B or BI, start; replay from Settings | Other tier previews in Settings; names provisional |
| `#/today` | Exact B/BI rows → full report / reader / manual partial → correct/undo → review saved entries → optional share | Fixed date and local demo evaluation only |
| `#/reader` | Surah/juz picker, ayah jump, text size, previous/next, resume → suggestion review → shorten/extend/confirm/discard | No audio; 5-ayah display blocks, no edition-page claim |
| `#/journey` | Illustrative ship → month calendar/day details → late entry → private record and revision log; separate khatma empty state | Prior marks are samples; no fake full-Qur’an completion |
| `#/dhikr` | Choose phrase/target → +1/+10 → correct actual count → reset/undo | Independent of Qur’an credit |
| `#/classroom` | Search/filter enrolled course cards → course outline or resume lesson | Founder unlocked; compact student-preview selector |
| `#/course/:courseId` | Thumbnail, progress, resume, collapsible modules and lesson thumbnails | Multiple courses; weekly or single-class |
| `#/lesson/:courseId/:lessonId` | Player → completion → weekly questions → next unlocked week; notes and bookmark | Student direct-link guard; all previous lessons + submitted answers required. Old numeric URLs remain aliases. No real coach submission or grading. |
| `#/library` | Search `istighfar`/Arabic → topic filters → saved filter → media detail; empty result reset | Four labeled sample cards, not real source corpus |
| `#/media/:id` | Sample player → save → source description → timestamp jump | Unknown id shows unavailable state |
| `#/circles` | Create/join SAFINA → example reaction → local chat → group settings/quiet preference → report simulation/leave | No external publication; every share reviewed separately |
| `#/settings` | Name, commitment preview, reminders, text size, motion, data export/reset, scenario selector | Reminders preference only, no notification service |

## Material states

- Initial Qur’an load and load error/retry are actual states; local save failure is an alert with export guidance.
- Partial and complete local reports, exact duplicate warning, revised/retracted record, undo, empty history and no khatma.
- Tester settings simulate welcome-back, offline, request failure, free day and awaiting policy. Offline simulation is visibly labelled. True backend pending/conflict queues are not implemented.
- Library empty result, saved-only empty, unknown media unavailable, actual native media controls.
- Groups start with a labelled example. Empty membership, invalid invite, reviewed consent, post deletion, related correction, muted/disabled chat and exit can be tested.
- Real paid enrollment/expiry is described in the handoff; it is not used to lock founder testing.

## Review sequence

1. Record Baqarah 1–25 from a physical Mushaf. Correct to 1–20. Check the private row.
2. Open the reader, navigate, then review and shorten its suggested range. Confirm. Overlap does not double unique coverage.
3. Share a local update with no verse details. Correct its source entry; the linked post disappears.
4. Open any week, play the sample, change speed, write notes, answer the example question, save a written response. Reload and inspect persistence.
5. Search `istighfar`; save/open the result. Count dhikr and correct it. View calendar and try a late date.
6. Select return/error/offline/free/unresolved scenario in Settings. Reset only when you are ready to discard your local test data.
