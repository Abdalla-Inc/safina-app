> Launch update (3 October 2026): see root `DEPLOYMENT.md` and `Coordination/BACKEND_STATUS.md` for custom plans, owner controls, earned construction and prepared Docker/Render packaging. The older hosting section below describes the pre-container baseline; no public deployment has been created.

# Run and configure the connected app

The local connected implementation is ready for review. Real Supabase email delivery, Google OAuth, private media, hosting and approved teaching content are not configured. This is not a claim of public production readiness.

## Local review

From `Back End`:

```sh
python3 -m pip install -r requirements.txt
python3 -m safina.connected_cli seed-sandbox
python3 -m safina.connected_cli serve
```

From `Front End` in a second terminal:

```sh
npm run dev
```

Open `http://127.0.0.1:5178/#/account`. Use the generated accounts in `Back End/local/connected-sandbox-access.json` (owner-readable file). They have different levels and no imported fictional reading. A separate `browser-qa@safina.test` account was used for browser verification; its records are local test records only. Do not move this database to a live deployment.

The frontend already had a process on port 5178 during this implementation. Do not start a second one if it is still running. The connected backend uses 8766; the older demo backend can continue on 8765. Requests go through the existing frontend origin, including the HttpOnly session cookie. Prefer `127.0.0.1` consistently; switching to `localhost` requires matching `SAFINA_APP_ORIGIN`.

Sandbox verification/recovery codes are visible only through the local staff command:

```sh
python3 -m safina.connected_cli mailbox member@example.test
```

New registrations still require verification in sandbox. The two explicitly seeded test accounts are preverified. Google shows an honest configuration-required error in sandbox.

## Connect email/password and Google

1. Create or select a Supabase project. Enable email/password and email confirmation. Configure SMTP/email delivery. Set signup/recovery templates to show the OTP (`{{ .Token }}`) because the app's verification/recovery screens accept an email and code. The default link-only template is not the app's recovery flow.
2. Enable Google in Supabase using the Google project's OAuth client configuration. Google redirects to the Supabase callback; Supabase's redirect allowlist must include `https://YOUR_APP/api/v1/auth/google/callback` (and the exact local URL if testing locally). The app uses PKCE and a short-lived HttpOnly browser-flow cookie.
3. Set these **server environment variables**, not frontend Vite variables:

```text
SAFINA_AUTH_MODE=supabase
SAFINA_APP_ORIGIN=https://YOUR_APP
SAFINA_SERVER_KEY=<stable random secret, at least 32 bytes>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=<project publishable/anon key>
```

For approved private video/resources, also set `SUPABASE_STORAGE_SERVICE_KEY` on the server and use **private** storage buckets. That service key must never be sent to the browser. Keep a recoverable encrypted backup of the stable server key; losing it invalidates encrypted provider sessions and local auth flows.

Environment variables are read from the process. `.env.example` is a reference, not an automatically loaded secrets file. Use your host's secret manager or environment configuration. No secret keys need to be posted in chat.

4. Use a **new live database path**, for example `--db /srv/safina/live.sqlite3`. Startup refuses databases containing accounts from a different auth mode. Do not import `local/connected.sqlite3`, the legacy synthetic demo database, browser preview storage, test passwords or generated fixtures.
5. Registration defaults to invitation-only. Add the intended email with `invite` before the person signs up. Set `SAFINA_OPEN_REGISTRATION=1` only when deliberately opening registration.
6. Run a live smoke test of registration, OTP verification, password login, Google returning/new-member login, recovery, expiry/refresh and logout with separate invited test users. Provider tests in this repository use mocks, not a live project.

Official provider references used for the adapter: [password authentication](https://supabase.com/docs/guides/auth/passwords), [session behaviour](https://supabase.com/docs/guides/auth/sessions), [Auth REST specification](https://raw.githubusercontent.com/supabase/auth/master/openapi.yaml), and [signed Storage URLs](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl).

## Staff operations

All commands run from the backend directory with the intended environment/database selected. There is no client-side founder switch in connected mode.

```sh
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 invite member@example.com
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 role founder@example.com founder
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 publish-course approved-course.json
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 publish-library approved-library-item.json
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 enroll member@example.com course-id
python3 -m safina.connected_cli --db /srv/safina/live.sqlite3 rebuild-community
```

`role` requires an existing active account. Never grant founder status from display name, email entered by an unauthenticated client or browser storage. Enrollment can carry `--expires-at` with an offset-aware timestamp. No price, purchase or payment gateway has been invented.

Course input shape is demonstrated in `contracts/connected-fixtures/sandbox-course-input.json`; its `fixture` field is the actual staff input. It is explicitly a test workflow, not approved teaching. Supply real titles, individual thumbnails, modules, required lessons, questions, reviewed content/rights and an approved completion policy. Videos and resources use `{storageBucket, storagePath, rightsReviewed}`. Increase the immutable version to update or withdraw content. The default live catalog stays empty until real approved content is published.

## Database, backup and migration

Migration 003 adds connected accounts, sessions, profiles, reader preferences, community projections/outbox/reactions and learning records. Existing immutable v1 events/snapshots remain intact. Only newly created connected commitments use the new Mecca/Saturday policy. The staff rebuild command repairs projections from source records; it is not a legacy-to-live migration.

Take a SQLite online backup before changing a deployed database. Do not copy only a live `.sqlite3` file while ignoring its WAL. Example using SQLite's backup API:

```python
import sqlite3
with sqlite3.connect('/srv/safina/live.sqlite3') as source:
    with sqlite3.connect('/srv/safina/backups/live-before-upgrade.sqlite3') as backup:
        source.backup(backup)
```

Back up the matching server secret separately in the host's secret manager. Verify restoration to an isolated path with `PRAGMA integrity_check`, replay and tests. Rollback means stopping writes and restoring the matching database/key backup with the previous application version; it must not discard acknowledged newer member data. No destructive down migration or automatic purge is included.

## Hosting boundary and remaining decisions

The supplied threaded Python HTTP server is a loopback local/pilot transport. No internet deployment, TLS certificate, domain, container, managed database, SMTP provider or monitoring service has been created. A public deployment needs a reviewed serving arrangement behind TLS, request/time limits, operational rate limiting, backups/restore checks, logging without sensitive payloads, health monitoring and capacity testing. SQLite transactions serialize writes; this implementation is not a horizontally scaled service.

Still needed before public launch:

- Supabase and Google project configuration, actual mail delivery, live callback tests and hosting choices.
- Real reviewed course/library/video content, thumbnails, entitlements/pricing decisions and lesson-completion policy.
- Quran image/text distribution approval and editorial review of the community ayah slot. Existing local preview assets were preserved; no new claim of distribution rights was made.
- Unresolved program rules listed in the v2 registry, including exact monthly continuation grids, weekly day-credit target, fractional credit, repeat counts, cross-cadence transitions and ship carry. These remain visible as unknown rather than guessed.
- A retention/erasure decision and final purge operations. Current deletion withdraws public material and revokes access immediately, with physical erasure explicitly pending review.

## Verification

```sh
python3 -m scripts.check
python3 -m scripts.build_connected_contracts
python3 -m scripts.build_connected_fixtures
```

The backend check includes HTTP loopback tests, account isolation, origin/CSRF, original occurrence dates, delayed sync, all-level Saturday rest, atomic undo, projection withdrawal, pagination, independent hearts, recovery, avatars, moderation, lesson prerequisites and private-media expiry. Frontend checks: `npm test` and `npm run build`.
