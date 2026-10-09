# Safina · سفينة النور

Arabic Quran wird and community application with email/Google identity integration, daily istighfar, custom recurring reading plans, community summaries, and a ship that reflects completed assigned days.

- `Front End/`: React/Vite interface and the ship renderer.
- `Back End/`: Python API, SQLite event history, immutable assignments and projections.
- `Coordination/`: frontend/backend delivery notes and current verification status.
- `deploy/`, `Dockerfile`, `render.yaml`: prepared single-instance deployment.

## Shareable mobile demo

The GitHub Pages workflow publishes the isolated demo to https://abdalla-inc.github.io/safina-app/. It opens without a password, uses fictional examples, and stores changes only in the visitor’s browser. It does not create real accounts or share activity between visitors. Open the link on mobile; use the browser’s Add to Home Screen option for a standalone shortcut. Offline use is not promised.

This static demo is separate from the production backend deployment below.

## Local owner demonstration

From `Back End`, install `requirements.txt`, run `python3 -m scripts.seed_owner_demo`, then `python3 -m safina.connected_cli serve --port 8766`.

From `Front End`, run `npm ci` and `npm run dev`. Open http://127.0.0.1:5178/#/account. The generated owner login and 14 fictional example accounts are stored privately in `Back End/local/owner-demo-access.json`. Never commit or deploy the local database/credentials.

The owner can simulate ship build stage, health and Saturday celebration separately from actual reading progress. Custom weekly/monthly commitments divide chosen verses across daily assignments, with Saturday rest. Normal members have no owner permissions.

## Deploy and verify

Read [DEPLOYMENT.md](DEPLOYMENT.md) before creating the public service. A real Supabase project, Google/email setup and HTTPS host are required; GitHub alone does not run the app. The Render template requires a paid persistent disk. No hosting service has been created by these files.

Backend checks: `python3 -m unittest discover -s tests -q` from `Back End`.
Frontend checks: `npm test` and `npm run build` from `Front End`.
The included GitHub workflow runs these checks. Current API schemas and service-generated examples are in `Back End/contracts`; launch changes are documented in [BACKEND_STATUS.md](Coordination/BACKEND_STATUS.md).

Actual construction advances once per qualifying assigned day, capped at 30. Maintenance/repair policy after construction remains explicit and pending. Approved live teaching content must be supplied before publishing a populated learning catalog. Demo material remains labelled and separate from live evidence.
