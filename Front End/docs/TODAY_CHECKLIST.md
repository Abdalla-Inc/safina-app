# Today checklist · 29 September 2026

Latest founder direction: the Today screen is a date, committed reading capsules, one reading button, and a discreet partial-progress action. Removed the greeting, hero/ship, motivational copy, duplicate activity feed, side cards, repeated completion messages and page footer. History and corrections remain in Journey.

## Interaction

- Swipe a capsule **left to right** to confirm its complete assigned reading. The circular handle follows the finger, a sage fill crosses the capsule, and the title gains a strike-through. A check replaces the arrow. This follows the founder's stated crossing-out preference; it is not a claim that all Arabic readers use that gesture.
- Swipe a completed capsule back to the left to reopen it. Full reports are retracted; earlier partial reports remain. When completion came entirely from several partial reports, reopening retracts those reports as well. Revision history is retained, related published demo entries are invalidated, and other days/tasks remain unchanged.
- Press the handle as a single-pointer alternative, or use Space/Enter on the focused capsule. State is announced as an accessible checkbox and through a quiet live region. Controls are large enough for touch. No actual haptic API is invoked; haptics can be added in the native app later.
- Gestures require a substantial horizontal movement before committing. Short drags, wrong-way swipes, canceled gestures and vertical scrolling do not change the task. Reduced-motion preference removes the transitions.
- “إضافة تقدّم” opens a small form with only the current day's committed surahs and a from/to verse range. Overlap is counted once; adding already covered verses creates no extra act. Partial coverage remains unchecked and shows a small count/progress line. Full union coverage naturally checks the capsule.
- “ابدأ القراءة” opens the Mushaf index. There is no extra completion/submission action or reading-log prompt.

## Scope and state

This remains the unlocked local prototype. Following the community-feed request, Today uses the current Mecca date and resets at midnight together with the feed. The fixed 28 September date remains in legacy test fixtures only. B and BI are the supported local assignments. Unpublished BJ schedules are not guessed or populated with extra tasks; free/policy/error states stay concise. Production must bind the date and assigned ranges to the server's immutable Today response.

Only current committed surahs contribute to Today progress, including the demo evaluation's partial status. Unrelated reading remains elsewhere in the ledger and cannot complete the daily checklist. No fractional day/ship credit is invented for a partial range. Crossings are explicit member self-reports, not evidence inferred from opening the reader. Completed assigned tasks now update the automatic local community feed; see `COMMUNITY_FEED.md`.

The scope guard and mutations live in `src/data/wird.js`; UI in `src/pages/Today.jsx`. Existing Journey correction controls are preserved. Backend requirements are in `BACKEND_HANDOFF.md`.

## Design reference and checks

Consulted Apple's [gestures guidance](https://developer.apple.com/design/human-interface-guidelines/gestures/) and [right-to-left guidance](https://developer.apple.com/design/human-interface-guidelines/right-to-left/). The physical crossing direction here is a deliberate founder preference, while reading text and navigation stay RTL. Gesture alternatives follow the installed web accessibility skill.

37 tests pass, covering scope, gesture thresholds, overlapping partial ranges, idempotent completion, reopening from both full and combined partial reports, revision retention and unrelated-record preservation, plus existing reader/course/backend checks. Production build passes. Desktop and 390px mobile browser checks verify completion/reopening, short/vertical drag protection, assigned-only partial form, keyboard toggling and persisted partial state. This is browser testing, not a physical-device haptics test.
