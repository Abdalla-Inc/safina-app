# October connected adapters — implementation hand-back

The backend now advertises **0.5.0** at `/api/v1/health`. Its capabilities enable required country/goal setup, custom Quran reports, absolute daily istighfar counts, and one emoji reaction per viewer/target. These flows are connected in `src/connected/Activity.jsx` and `Pages.jsx`; `activityFacts.js` removes duplicate displayed custom/assigned coverage without granting client-side credit.

The sandbox frontend remains http://127.0.0.1:5178 and its backend runs on port 8766. Explicit fictional acceptance accounts for all seven tiers are recorded in `Back End/local/october-sandbox-access.json`. Preview data is never imported.

Contracts, migration notes, endpoint examples, test coverage, media preparation and outstanding deployment inputs are in `Back End/docs/OCTOBER_DELIVERY.md`, alongside the generated `Back End/contracts/connected.*.json` and 44 consumer fixtures. New tests in `tests/connected-activity.test.js` check display de-duplication and the backend's pending ship fixture.

The connected browser smoke check covered custom juz 1, partial Quran coverage, a partial istighfar count, country/goal changes, a retained historical target, and a saved clap reaction. Both wide and 390 px layouts were checked. The existing ship renderer and preview behavior were preserved.

Ship lifecycle settlement remains explicitly gated by the unresolved rules in the supplied ship handoff. The endpoint returns the frontend's proposed 1.0.0 projection shape with asset 0.5.0, a stable vessel identity, null state and named blockers. Live Supabase/Google/storage setup and approved teaching files/links remain required before launch.

Final verification: 100 backend tests and 97 frontend tests passed; the production build passed. The backend was restarted with the final implementation and left running on port 8766.
