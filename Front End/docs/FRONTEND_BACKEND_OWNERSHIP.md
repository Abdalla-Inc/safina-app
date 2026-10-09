# Safina — one product, clear delivery ownership

Updated 1 October 2026 following the founder's community and ship review.

## Why the preview looked different

`src/App.jsx` has a local founder preview and an authenticated account path. Both live in this frontend, but several connected pages were independently implemented with plain service-validation layouts. Switching to the sandbox account therefore changed the design. The approved course/library fixtures were not removed; they live in the local preview. The authenticated catalog currently has no published courses.

The top-bar **المعاينة الكاملة · أمثلة** control now opens the existing complete demo from a sandbox account. **فتح حساب الاختبار** returns to account mode. Demo fixtures, reactions and reading history remain local and separate from server records. Do not import them into real counts or credits. This control is shown for local preview/sandbox, not ordinary production accounts.

## Ownership for the final app

- **Frontend owner (this workspace):** approved screen layouts, Arabic text, navigation, animation host, accessibility, responsive behavior, and integration of authenticated API data/actions into those screens. Keep presentation shared where possible; don’t replace approved views with endpoint-debug screens.
- **Backend owner (`Back End`):** authentication/profiles, assignment snapshots, reading evidence/corrections, custom selections, daily/weekly publication and counts, reaction revisions, permissions, learning catalog/progress/gates, authoritative ship lifecycle, persistence and deployment configuration.
- **Joint release check:** exercise the same approved interface in founder preview and an authenticated account, then verify real writes, reload, undo, permissions and empty/loading/error states. An attractive demo alone is not a completed integration.

API/contract changes should be additive or coordinated. The backend developer should not redesign `src/pages`, `src/components`, styles, or connected presentation while implementing service work. Provide fixtures and contract updates for frontend integration instead. This is a handoff recommendation; no other task has been messaged or reassigned.

## Community contract and presentation

- Daily cards retain the original custom `selection`, `selectionIntact`, canonical `ranges`, completed components, level snapshot, member identity/country/avatar, timestamps and revisioned reactions. Existing v0.5 already delivers these fields.
- The frontend now uses intact selections to show **سورة البقرة**, **سورة يس**, **الجزء الأول**, etc., instead of internal `2:1–2:286` codes or generic counts. Assigned evidence is not repeated as custom evidence. Corrected/overlapping fragments remain honestly labelled **قراءة جزئية**; they must never claim a whole surah was completed.
- No **إبلاغ** control in the community UI. Existing service moderation functionality has not been deleted.
- The compact ayah and daily `completeWirdMemberCount` are restored. Do not substitute card count or include istighfar-only/custom-only participants as completed-assignment members. Weekly `participantCount` celebrates all eligible activity.
- Shared ayah rendering uses canonical pinned Quran text. Daily references: 83:26, 3:133, 57:21, 27:92, 29:45. Weekly references: 53:39, 76:22, 99:7, 18:30. Stable rotation by Mecca day/week avoids changing an ayah mid-reading. The remembered phrase “وأمرت أن أقرأ القرآن” is not inserted as Quran; the full canonical 27:92 is used.
- **أورادي** retains server weekly history and day details. Reactions continue to use the actual server revision/endpoint.

## Ship: requested rule and remaining service work

The existing v0.5 animation supports build stages 0–30. The frontend offers all stages with a slider, plus the complete/damage/repair demo states. Demo controls never write progress.

The inspected authenticated `/ship-visual-state` implementation in `safina/activity.py` currently returns `status: awaiting_policy`, `state: null` and blocked reasons for every member. It cannot yet animate earned construction. This is the concrete blocker, not a missing animation file.

**Founder direction to implement:** one fully completed assigned daily Quran wird earns one construction step; another completed day earns the next; 30 qualifying days produce one fully built ship. Finishing multiple components, resubmitting, reactions or istighfar do not each create extra steps. Custom reading can satisfy overlapping assigned coverage, but unrelated supplemental reading must not invent assignment completion.

Backend delivery:

1. Pin each day's assignment and evaluate canonical union coverage. Use the specified Mecca community day boundary; resolve assignment-local timezone mapping explicitly rather than letting the client guess.
2. Deduplicate by member/qualifying day. Start at stage 0 and return a monotonic versioned projection for the active vessel, capped at stage 30.
3. On completion, Today invalidates/refetches the projection; Journey already fetches on mount and refreshes while visible. The scene transitions when its authoritative `buildStep` changes.
4. Replay corrections/retractions consistently; document vessel boundaries and how a correction crossing completed construction affects maintenance. Do not equate a numeric read total with construction stages.
5. Return valid ready construction state (`phase: construction`, `health: 100`, stages 0–29) once eligible. Stage 30/maintenance must satisfy the existing schema and lifecycle policy. Preserve explicit pending status for genuinely undecided maintenance/repair rules; do not silently manufacture health.
6. Resolve rest-day treatment (Saturday is celebration/rest), legacy activation/backfill, late corrections and post-stage-30 lifecycle against `docs/SHIP_V05_INTEGRATION.md` and the animation handoff. Do not mark these implemented because the demo slider works.

Local demo history no longer starts with 18 invented credits: B/BI records earn at most one stage per completed day and stop at 30. Historical unknown/mixed/BJ assignments remain unresolved locally; authoritative BJ construction belongs to the backend.

## Learning delivery

Original founder course/library examples and unlocked lessons remain available in full preview. Connected catalog now uses the approved learning tabs, thumbnail/card treatment and quieter titles. Real lessons retain server gates and writes. Coach Anas media and approved course records still need to be supplied/published; do not pass demo placeholders off as the real catalog. Connected course/lesson detail parity and final populated-catalog QA remain integration work when those records are available.
