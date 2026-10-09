# Safina launch setup

## GitHub Pages demo

`.github/workflows/pages.yml` publishes only the compiled frontend to https://abdalla-inc.github.io/safina-app/. It sets `VITE_DEMO_ONLY=true`, `VITE_ENABLE_LOCAL_PREVIEW=true` and Vite base `/safina-app/`. Demo mode always opens the illustrative preview, prevents connected login/API operations, and keeps activity in each browser. No backend, private database or generated password is included. Hash routes support direct links and refresh under the repository prefix. A relative web manifest and icons provide home-screen support; no service worker or offline guarantee is included.

The remaining sections describe the separate full account-backed deployment.

The owner demonstration runs locally at http://127.0.0.1:5178/#/account. Owner credentials and 14 example accounts are in `Back End/local/owner-demo-access.json` (private and Git-ignored). Owner email: gubaraabdalla@gmail.com. Use `python3 -m scripts.seed_owner_demo` from `Back End` to prepare or refresh the local examples. Backend: `python3 -m safina.connected_cli serve --port 8766`. Frontend: `npm run dev` from `Front End`.

There is no public deployment yet. GitHub stores the source; a host runs the application. The root Dockerfile builds the approved React interface and runs Caddy plus the loopback Python API. The live database is `/data/live.sqlite3`; keep one instance with a persistent disk. Do not copy the local sandbox database into that disk.

## Public owner demonstration

1. Source repository: https://github.com/Abdalla-Inc/safina-app. Deploy from its main branch after the GitHub checks pass. Local credentials/databases are excluded from the release.
2. Create Supabase and enable email/password plus email confirmation. Configure reliable SMTP. Signup/recovery templates must display `{{ .Token }}` because the app accepts verification codes; default link-only recovery is not this app's flow.
3. Enable Google in Supabase, with the OAuth client configured in Google Cloud. Google must use the callback shown by Supabase. Set Supabase Site URL to the final application HTTPS origin and allow `https://YOUR_APP/api/v1/auth/google/callback` as redirect. New members start from registration and choose country, istighfar goal and standard/custom wird; returning members use login.
4. Choose a Docker host with a persistent disk. `render.yaml` is a prepared option: one web service, disk mounted at `/data`, HTTPS provided by Render. **The disk requires a paid service; the template has not created a service or incurred charges.** Review the host's displayed charges before creating it.
5. Set the following in the host's server environment/secret manager. `.env.example` is documentation only; this app does not automatically load it.

```text
SAFINA_AUTH_MODE=supabase
SAFINA_APP_ORIGIN=https://YOUR_APP
SAFINA_SERVER_KEY=<stable random secret, at least 32 bytes>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=<publishable/anon project key>
SAFINA_SUPER_ADMIN_EMAIL=gubaraabdalla@gmail.com
SAFINA_OPEN_REGISTRATION=1
```

The Render blueprint generates the server key once. Preserve it across redeploys and keep an encrypted backup separately from the database. Never put provider credentials in `VITE_*` variables or Git. For approved private course assets, configure `SUPABASE_STORAGE_SERVICE_KEY` server-side as described in `Back End/docs/CONNECTED_SETUP.md`.

6. Deploy from the repository root with `Dockerfile`; mount persistent `/data`, route the assigned public port to Caddy. `/api/v1/health` must return mode `supabase`, contractVersion `0.6.0`. Production builds hide the local preview bypass. Sign in using the verified owner email to obtain founder privileges; every other account remains a member. No password has been provisioned for the real email or Google account.
7. Verify real email delivery/OTP/recovery, new and returning Google accounts, normal-member denial of admin tools, owner save/reload sliders, custom signup/daily portions, istighfar, daily/weekly community, correction/undo and persistence across a restart. These checks need the actual project/domain; mocked provider tests are not a substitute.

## Data and operations

The 14 fictional members are local examples and never appear as real live contributions. The frontend owner preview retains illustrative content. Live course/library records remain empty until approved content is published; no placeholder is presented as teaching. Ship construction is implemented through qualifying daily evidence; post-construction maintenance remains explicitly pending policy.

This is a single-instance pilot architecture. SQLite serializes writes, and the threaded Python transport is behind Caddy/TLS. Do not enable multiple instances against separate copies of the database. Before larger rollout, measure load and move the store/transport as needed.

Use SQLite's online backup API, not a filesystem copy of an active WAL database:

```python
import sqlite3
with sqlite3.connect('/data/live.sqlite3') as source:
    with sqlite3.connect('/data/backup-before-upgrade.sqlite3') as backup:
        source.backup(backup)
```

Copy encrypted backups off the service through the host's secure tooling; verify restoration to an isolated database with integrity checks before relying on them. Never restore over live acknowledged writes without a deliberate recovery plan. Preserve the matching server key.

## Validation and references

Local Python tests and frontend build/tests are runnable in the included GitHub workflow. Docker is not installed in this workspace; the image build and hosted restart/HTTPS/provider checks remain to be performed after host setup. No public URL is claimed.

Official setup references: [Render Docker](https://render.com/docs/docker), [Render persistent disks](https://render.com/docs/disks), [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
