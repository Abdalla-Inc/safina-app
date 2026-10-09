# Connected backend delivery review — 30 September 2026

The frontend now has a separate connected account mode using a persistent backend, alongside the preserved local preview. Open the account entry in the app header, or `http://127.0.0.1:5178/#/account`.

Implemented and locally verified:

- Email/password registration, verification, recovery and opaque-cookie sessions; Supabase adapter for both password and Google PKCE. Isolated local sandbox accounts and mailbox.
- Owned profile/avatar/preferences, server-owned roles, private exports and an explicit deletion workflow.
- Connected Today components, exact partial reading, atomic undo/corrections, immutable original occurrence metadata and Mecca assignment days.
- Versioned Saturday rest for all seven tiers, preserving legacy rules/history and unresolved credit rules.
- Automatic daily/weekly community projections, proven fact types, independent hearts, counts, private weekly archive/day detail, cursor pagination, outbox/rebuild, reports and staff moderation.
- Private Mushaf page/bookmarks without reading credit, server calendar/credit history, effective and pending level changes.
- Published course/library services, enrollments, prerequisite locks, private notes/bookmarks/progress/answers, founder viewing without fabricated completion and short-lived private-media access. The live catalog is empty until approved content is supplied.
- Separate v0.4 OpenAPI/schema/fixtures, migration 003, operation commands and live configuration guide.

Verification at delivery: 78 backend tests passed; 63 frontend tests passed; frontend production build passed. The Quran reference check still validates 114 surahs, 6,236 verses, 30 juz and 604 page boundaries. Browser checks confirmed sandbox sign-in, a BI component posting without a full-wird count, weekly summary, and a bookmark surviving reload. Browser review also confirmed original-day correction withdrawing a daily card, the honest empty course catalog, the connected phone layout, and logout. A hot-reload context issue and same-member refresh race were fixed during verification.

The live services are not configured or deployed. Google and email delivery were verified at the adapter boundary with mocked provider responses. See `CONNECTED_SETUP.md` for the exact remaining external configuration, content and policy decisions. Deletion does not claim completed physical erasure; it returns a pending-retention-review status.
