# Frontend release check — 9 October 2026

The frontend and backend are one release. Backend owns root packaging, repository upload and hosting; frontend owns the interface and connected API integration. GitHub destination: https://github.com/Abdalla-Inc/safina-app.

## Checked today

- `npm run build` succeeds.
- All 104 frontend tests pass, covering connected activity, custom commitments, Quran navigation, community presentation, completion gestures and ship rendering/state adaptation.
- Production defaults to connected accounts. The local illustrative preview is disabled for ordinary production users; verified server super admins may open it.
- Ship controls consume server permissions and the revisioned admin preview endpoint; they do not change earned reading evidence.
- API requests are same-origin, carry session/CSRF handling and do not store provider credentials in browser storage.
- Existing frontend design and example content are preserved. This release only updates frontend documentation since the 3 October integration checks.

## Requires live configuration and verification

The combined host must proxy `/api/v1` to the backend and serve the frontend at the same HTTPS origin. Follow `../../DEPLOYMENT.md` for persistent storage, Supabase, email verification/recovery, Google OAuth and verified owner permissions.

Before describing the app as publicly working, verify new-account registration and verification, login/logout/recovery, Google callback, the owner role for gubaraabdalla@gmail.com, saving a reading and istighfar, community publication/reactions and persistence after restart on the actual public host.

Local credentials and the sandbox database are excluded from Git and are not live credentials. Sample lessons/library media are illustrative; approved teaching content remains to be supplied. Earned ship maintenance after step30 remains pending policy, while owner construction/health simulation is available.
