# Community feed and combined learning · 29 September 2026

## Navigation

Five primary destinations: اليوم, المصحف, رحلتي, التعلّم, المجتمع. The bottom More button is removed; the top mobile menu still opens settings/navigation. الذكر and حلقاتي are retired from navigation. Their saved local records are retained. Legacy `#/dhikr` and `#/circles` routes resolve to Today and Community respectively.

Courses and the library share one learning destination. The course catalog has الدورات / المكتبة navigation; the library has the same navigation. Existing course and library detail URLs, saved media, lesson progress, prerequisites and unlocked founder mode remain intact. Library/media routes keep التعلّم selected in primary navigation.

## Automatic daily check-ins

Each explicitly completed, committed reading task creates or updates one local member/day check-in. For BI, completing Baqarah shows that exact surah; completing Al Imran updates the same card to list both. A separate full-wird flag increments the people counter only when the entire assigned wird is complete. No leaderboard, ranking, total-member denominator, comment box or manual publishing button is added.

Cards show name, completed task names, the last meaningful change time in Mecca, full-wird status, and a heart toggle. Repeated readings or overlapping ranges cannot add extra people or duplicate cards. Corrections/retractions/reopening update the card and counter; if nothing remains complete, the card disappears. Reader navigation and partial-uncompleted tasks create no check-in. Old private history is not retroactively published. Existing late-date check-ins can be corrected without moving them into today's feed.

The counter means **people who completed their daily wird**, not proven full-Quran khatmas. Those remain separate backend coverage proofs. Current local assignments are the existing B/BI examples; unpublished juz schedules are not invented.

## Mecca calendar

Today and Community share `Asia/Riyadh`, with midnight boundaries. The frontend refreshes its day at the next Mecca midnight and again on visibility changes. New-day checklist coverage and feed counts therefore reset together. Dates are keyed as civil dates; event timestamps remain UTC instants and render in Mecca time. Old records retain their original dates. Journey opens the current Mecca month/day, and manual corrections allow dates through that day.

`DEMO_DATE` remains the legacy fixture default in standalone model helpers/tests; live Today passes the current Mecca day explicitly. Production must use server time/assignment snapshots, not trust the browser clock, user ID, ranges or completion flag.

## Ayah and local preview

The compact full-width panel above the daily counter displays a complete verse from the unchanged bundled Quran dataset. References 83:26, 3:133 and 57:21 rotate deterministically by Mecca day, never during the day. The surah/reference opens the actual Mushaf. No Quran text is generated or assembled from remembered excerpts.

This is a local frontend preview, labeled معاينة محلية. The founder now requests a populated preview: seven explicitly labeled fictional examples appear by default, one for each existing level. Their illustrated portraits are original SVG assets in `public/community/`; they are not real members or uploaded photos. Example counts and reading summaries are illustrative, not definitions of pending juz schedules. Turning examples off restores the actual local projection. Samples never enter saved reading records, completion evaluation or server requests.

### Level colors and reading cards

Each card has a tinted background, a colored edge, avatar ring and stacked completed-reading labels. No level names or rankings are displayed. A tooltip/accessibility label gives the commitment description; full-wird completion uses a check icon and text independently of level color. All accent text against its tint meets 4.5:1 contrast.

| Engine level | Accent | Tint |
|---|---|---|
| B | `#506c3f` sage | `#f3f6ed` |
| BI | `#216d68` teal | `#eef7f4` |
| BJ1 | `#356a94` blue | `#eff5fa` |
| BJ2 | `#986525` ochre | `#fbf5e9` |
| BJ3 | `#a05266` rose | `#fcf0f3` |
| BJ4 | `#5863a3` indigo | `#f1f2fc` |
| BJ5 | `#764a96` royal purple | `#f7f0fc` |

The purple assignment is a frontend design choice for BJ5, not a verified official royal tier name. Palette tokens are centralized in `src/data/communityLevels.js`. New posts snapshot `tierAtCompletion`; later profile-level changes do not recolor old cards. Legacy B/BI posts derive the level from their stored assignment. Unknown levels use a neutral treatment rather than guessing from the current profile.

### Reactions, own post and photo

The earlier مشاركتي daily filter has now been superseded by the أورادي weekly archive described below. The daily post remains accessible through its day in the archive. Corrections withdraw/update the original card and weekly summary.

Sample hearts start with illustrative counts. A local viewer heart adds exactly one and can be removed; viewer choices persist across reloads. Actual local cards start at zero, and no real external reactions are claimed. Sample timestamps stay inside the displayed Mecca day and remain stable while the mounted feed is being used.

The camera button opens settings, where a member can select, replace or remove a personal photo. JPG/PNG/WebP files up to 10 MiB are decoded and reduced to at most 256px on the longest side, encoded locally as JPEG and saved with the existing local state. Invalid files show a recoverable message. Profile photos update on own posts without manufacturing reading activity or changing completion timestamps. Missing/broken images fall back to the name initial. No image is uploaded to a server in this prototype.

The current backend contract explicitly has no shared feed: `/events` is own-member replay and group publication remains gated. This update does not bypass those endpoints or send any real publication. The latest founder request authorizes the new automatic product flow and supersedes the earlier per-post manual-share UI. Backend implementation requirements are in `BACKEND_HANDOFF.md`.

## Validation at the previous daily-feed milestone

48 automated tests passed, including seven distinct level palettes and contrast, historical level snapshots, legacy/unknown-level fallback, fictional samples at Mecca-day boundaries, and all previous completion, correction, reader, course and backend-adapter checks. Production build passes. Browser checks verified 320px and 390px phone layouts, desktop layout, no horizontal overflow, heart add/remove and reload persistence, own-post filtering, full-wird automatic update/counter, hiding examples, and photo selection/persistence/removal. No production shared-feed or native-device claim is made.

## Saturday celebration and أورادي · newest update

The former مشاركتي control is now **أورادي**. It shows current and past weeks newest first, expandable into actual daily readings and the original daily post's heart count. Local eligible partial readings are included even when no completed daily task/post exists. Four separately labeled example weeks demonstrate three teal BI weeks and an older sage B week; the transition is marked. Turning off examples leaves only local actual history. Example records never become ledger entries, credit or production records.

Community defaults to the celebration view on Saturday in Mecca time. On other days, **معاينة السبت** previews it without changing the date, reading records or assignment policy; **عرض اليوم** returns to daily posts. The Sunday–Saturday period is shown explicitly. The celebration includes one summary per member with any qualifying recorded reading. Its count is participants, not full-wird completions. At Saturday opening the summary contains Sunday–Friday activity; Saturday voluntary activity may update the same week. At Sunday rollover the new weekly interval begins, while private archive records remain available.

Weekly cards use stacked factual summaries, without ranking or shame for partial activity. The locally computed summary only supports known Baqarah/Al Imran commitment records, per-day union coverage, distinct-day full readings, and one whole surah assembled across partial days. It does not independently prove Quran khatmas, convert ayahs to juz, or award fractional credit. Full-khatma and 15/7-juz cards are fictional demonstrations for the future engine-backed typed facts. Invalid, future, retracted and outside-plan records are excluded. Corrections recompute affected weeks; if no eligible reading remains, the local week disappears.

The shared ayah rotates weekly between complete canonical references 53:39 and 76:22 from the pinned Quran dataset. Confetti is a fixed, non-interactive viewport layer that continues while scrolling. The visible pause button disables it; the app's reduced-motion setting and OS preference suppress it. No flashing fireworks or sound is used. The preference persists in local state, and the layer is removed when leaving the celebration.

Historical colors use each reading's stored level, not the current settings selection. Mixed weeks/days preserve multiple level markers. Unknown historical levels remain neutral. Changing profile photos affects their presentation without changing reading history.

**Backend:** use [BACKEND_PRODUCT_BRIEF.md](../BACKEND_PRODUCT_BRIEF.md) as the consolidated delivery brief. It covers accounts/sessions, profiles/photos, effective level changes, reading writes/proofs, daily/weekly publication and hearts, private archive pagination, Saturday policy/versioning, reader/learning services, offline/errors, migration and acceptance tests. The current engine's Saturday free-day scope differs from the latest founder description and must be reconciled explicitly before production integration.

**Validation for this update:** 57 automated tests pass, including Mecca Saturday/Sunday/year boundaries, partial participation, duplicates/overlap, full-surah coverage across days, corrections/retractions, historical/mixed colors, archive ordering, example separation and pinned ayah references. Production build passes. Mobile browser checks cover the preview, pause/restart, weekly reactions, archive expansion and daily reactions. No real shared service or production accounts are claimed.
