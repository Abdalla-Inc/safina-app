# Connected frontend integration — 30 September 2026

A separate connected mode now uses `/api/v1` and the backend on loopback port 8766. Vite proxies that prefix to the backend while preserving same-origin cookies. The legacy `/api/local` synthetic bridge and browser-local preview remain intact.

Open `http://127.0.0.1:5178/#/account`. Local test credentials are in `../Back End/local/connected-sandbox-access.json`. Live email/password and Google use the Supabase adapter once the project is configured; local Google attempts explicitly report that the provider is not configured.

Main integration files:

- `src/services/connected.js`: cookie requests, in-memory CSRF, session rotation, stale-account response protection, member-specific pending reading queue.
- `src/connected/Session.jsx` and `context.js`: account/profile/server-day state, cross-tab logout, reauthentication and mode isolation.
- `src/connected/Pages.jsx`: account flows, connected Today, reader preferences, Journey/corrections, community, settings and learning.
- `src/App.jsx`, `src/main.jsx`, `vite.config.js`: provider wiring, mode routing and same-origin development proxy.

Existing Today capsules and the fixed-page Reader are reused. Connected Reader receives its own context: it never reads or writes the demo member's bookmarks. No password, Supabase access/refresh token or opaque session cookie is stored in localStorage. Preview-only fictional posts, courses, hearts and founder permissions are never promoted into connected data.

Unacknowledged reading mutations keep their UUID, body and original occurrence/snapshot. They are visibly pending until explicitly synchronized. Revision conflicts require review. Session expiry hides private views; a later login to the same member can retry its queue. Logout/deletion clear connected private queues. Reader/learning writes currently require connection and display failed-save states.

Backend handoff: `../Back End/contracts/CONNECTED_API_HANDOFF.md`.
Machine contracts: `../Back End/contracts/connected.openapi.json`, `connected.schema.json`, `connected-fixtures/`.
Configuration and remaining external dependencies: `../Back End/docs/CONNECTED_SETUP.md`.

Verification: 63 frontend tests passed, including request/session/queue isolation tests; production build passed. Saved output is in `CONNECTED_FRONTEND_TEST_OUTPUT.txt` and `CONNECTED_BUILD_OUTPUT.txt`. Backend verification passed 78 tests. Browser checks covered login, actual component writes, daily/weekly projections, correction withdrawal, private bookmark reload, catalog empty state, mobile layout and logout. No live identity-provider, email, media-hosting or public-deployment smoke test has been claimed.
