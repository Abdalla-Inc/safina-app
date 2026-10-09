# Backend launch status — 3 October 2026

Implemented connected contract 0.6.0. Frontend owns all interface code; backend owns services, evidence, roles, schedules, root deployment packaging. Communicate through the existing FRONT END task and this directory.

## Owner demo

Local API: http://127.0.0.1:8766. App: http://127.0.0.1:5178/#/account.
Owner: gubaraabdalla@gmail.com. Generated local password is in ignored, owner-readable `Back End/local/owner-demo-access.json`; never copy into Git or these notes. This is a local sandbox identity, not a verified real Google account. The same file contains 14 fictional example members, labelled مثال, with country, distinct daily/weekly reading and istighfar. Example 03 uses monthly CUSTOM; example 06 uses weekly CUSTOM. Seeding is idempotent and rejects live mode.

Owner permissions come from the server's stored founder role. Live `SAFINA_SUPER_ADMIN_EMAIL` promotes only after verified identity sign-in and matching verified/provider and stored emails. Client profile patches cannot set roles. Production never imports local accounts, passwords or fictional evidence.

## Admin preview

`GET /admin/ship-preview` → `{revision,enabled,buildStep,health,celebration}`. Initial: revision0, enabledfalse, buildStep0, health100, celebrationfalse.

`PUT /admin/ship-preview` body `{mutationId,expectedRevision,buildStep,health,celebration}`. Integer stage0–30, health0–100; celebration boolean. `DELETE` body `{mutationId,expectedRevision}` disables preview. Responses are the same flat shape, revision increments; writes/retries are atomic. Every route checks founder permission including retried mutations. Preview is per-owner presentation state only; no reading events, credits, counts or real vessel changes.

`/me.permissions` includes `founder`, `moderate`, `superAdmin`, `shipPreview`.

## Custom recurring commitment

Confirmed founder choice: **divide the period into daily assignments**, retaining Saturday rest. Input:

```json
{"period":"weekly","selections":[{"surahId":36,"fromAyah":1,"toAyah":83}],"verseTarget":83}
```

`period`: daily/weekly/monthly. `verseTarget` optional; defaults to union of all selected verses. Overlaps are deduplicated. If smaller, the first N unique verses in canonical Quran order become the period target. Repeat this same selected target each period. No automatic completion from passive reader observation.

Signup and Google signup accept `tier:"CUSTOM"` and `customWird:<input>` with all existing profile/acknowledgement fields. Google login `{}` only signs in an existing onboarded member; new Google identity returns to `/?authError=ONBOARDING_REQUIRED#/account`, so registration can collect choices. Other callback failures redirect with allowlisted `AUTH_FAILED` only.

`PUT /me/custom-wird` body `{mutationId,expectedCommitmentId,customWird}` returns the ordinary commitment view. Changes begin next Mecca midnight; today and past snapshots remain unchanged. Only one future change may be queued. Effective/pending/history entries contain `customWird`. Switching from CUSTOM to a standard tier uses existing POST `/me/commitment` with the active custom ruleVersion; effective next Mecca day.

Weekly periods Sunday–Saturday; monthly calendar months including day31 when not Saturday. Initial midperiod signup divides only across remaining Sunday–Friday dates. Quotient plus remainder distributes consecutive canonical verses, earliest days first. Small targets can produce zero-assignment rest days. A Saturday signup starts portions on the next eligible day/period. Rule pinned as `custom-daily-distribution-2026-10-03.v1`.

`/today` uses ordinary assignment/components with `tier:CUSTOM`, one `CUSTOM` component when work is assigned, otherwise free day. Adds `customWird:{period,periodStart,periodEnd,ranges,targetVerseCount,coveredVerseCount,complete,dailyTargetVerseCount,dailyCoveredVerseCount,distribution:"daily_except_saturday"}`. Period progress counts each day's assigned intersection, not portions for future dates read early. Standard completion/partial/custom-report/correction APIs apply and rebuild community views.

## Earned construction

One completed assigned non-Saturday day = one step, max30, stable vessel ID. Canonical union reading proves completion; multiple components/retries/reactions/istighfar do not add steps. Existing factual connected v2 records replay; legacy v1 accounts remain explicitly pending activation. Unknown/mixed assignment credits do not advance.

Stages0–29 return ready construction, health100, Mecca timezone, null settlement dates. Corrections replay source evidence, can reduce stage, and always increase projection revision when proof/state changes. Stage30 returns pending maintenance (`state:null`, `earnedBuildStep:30`); no settlement timing/decay/repair invented. Correction below30 returns to construction on the same vessel. Owner simulation remains separately available at every stage/health.

## Files and deployment

Strict schema/OpenAPI0.6 and four generated launch fixtures are in `Back End/contracts`. v0.5 schemas archived; old v0.3/v0.4 files retained. Migrations006/007 add preview and vessel projections.

Root Dockerfile/Caddyfile build the actual frontend and serve it alongside loopback backend; persistent `/data/live.sqlite3`. Optional Render blueprint provided (paid disk required; no purchase/service created). Secrets only server environment, public registration enabled in the blueprint, owner email configured. See `DEPLOYMENT.md`. Docker unavailable here, so container build/host smoke tests remain outstanding. GitHub URL, hosting account, Supabase/email/Google configuration and live smoke tests still pending. Approved live teaching content remains to be supplied.

## Verification result
108 backend tests passed, including loopback HTTP, origin/CSRF, role denial, callback redirects, custom distribution, leap month, idempotency, corrections, vessel stage30 gate, legacy tests and strict fixtures. Four service-generated launch fixtures validated. Runtime restarted with contract0.6.0. Docker image not built locally (Docker unavailable).
