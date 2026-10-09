# Safina connected backend — October delivery, v0.5.0

The 1 October handoff is implemented for local connected accounts. The frontend at **http://127.0.0.1:5178/#/account** uses the API at `/api/v1`, proxied to `127.0.0.1:8766`. Preview remains separate. No browser prototype history or fictional people are imported into accounts.

## Delivered behavior

- Country and daily istighfar goal are required for email and Google onboarding. Countries use the same pinned 249-code allowlist as the frontend and are stored uppercase. Missing preferences on existing accounts produce `setupStatus: required`; there is no inferred/default country.
- Country/name/avatar changes update current display on historical cards and emit refresh events without changing activity order. Profile and goal writes use the account revision.
- Custom surah intervals and contiguous juz selections become canonical, per-surah ranges. A group is one logical, revisioned act containing all its ranges, so its correction/retraction is atomic. Separate deliberate reports remain evidence; coverage is unioned. Reopening a component subtracts only its intersecting verses from custom evidence. Juz labels are valid only while `selectionIntact` is true.
- Daily istighfar uses an absolute count, separate from Quran credit/streaks/khatmas. First positive acceptance pins the then-current valid goal for that day. Zero retains the target and history. Goal changes apply to unreported/new days; unchanged count writes do not increment the revision. Concurrent stale writes receive 409.
- Daily cards include assigned completion, custom coverage, and positive istighfar. Weekly totals use each day's latest count. `readingDays` counts Quran days, `activityDays` counts any positive activity, and completed-wird counts remain assigned Quran only.
- Existing daily/weekly IDs, pagination snapshots, corrections, privacy, moderation, deletion, and member-scoped retry receipts remain in use. A withdrawn target keeps its identity and stored reactions for a later factual reappearance. Hidden/withdrawn targets reject reactions.
- Reactions support ❤️ 👏 🤲 👍 🔥, one selected emoji per viewer/target. Replacement/removal is atomic. Legacy boolean requests remain supported; migrated heart rows are not counted twice.
- Connected signup/settings, setup completion, custom entries/removal, count editor, past-day count correction, factual community cards and emoji controls now use server acknowledgements. Reading/count network failures retain the original UUID and occurrence in the existing member-scoped queue; logout clears that queue.

## Contract and routes

`contracts/connected.openapi.json` is v0.5.0, with 65 paths. `contracts/connected.schema.json` has 168 definitions. The 44 generated fixtures include all seven tiers, mixed/custom-only/dhikr-only activity, corrections, withdrawals, long names, country, no avatar, level history, reactions and pending ship state. Previous connected schema/OpenAPI are preserved in `contracts/v0.4/`; legacy v0.3 files are unchanged.

| Method and path | Contract |
| --- | --- |
| `GET /health` | Public mode, contract version and capabilities |
| `GET /capabilities` | Authenticated flags, count bounds and emoji palette |
| `GET /me` | Country, goal, profile revision, setup status and capabilities |
| `PATCH /me/profile` | `mutationId`, `expectedRevision`, optional `countryCode` and existing preferences |
| `PUT /me/istighfar-goal` | `mutationId`, profile `expectedRevision`, `istighfarGoal` |
| `POST /today/custom` | `mutationId`, reference, original occurrence, selection; optional ranges must match |
| `PATCH /custom-readings/{groupId}` | `mutationId`, group `expectedRevision`, `referenceVersion`, corrected ranges, reason |
| `POST /custom-readings/{groupId}/retract` | `mutationId`, group `expectedRevision`, reason |
| `PUT /today/istighfar` | `mutationId`, day, daily `expectedRevision`, absolute count, original occurrence |
| `PUT /community/{daily\|weekly}/{targetId}/reaction` | `mutationId`, reaction `expectedRevision`, emoji or null |
| `GET /ship-visual-state` | Stable vessel identity, explicit awaiting-policy projection |

All authenticated mutations retain cookie/CSRF/exact-Origin requirements. Each idempotency key belongs to one member and one exact method/path/body. A conflict is reconciled against refreshed state, never retried with a silently replaced revision. The new frontend checks capabilities before exposing writes to an older server. Registration on v0.5 requires the new fields; existing v0.4 registration clients must upgrade.

Custom example (replace the UUID and occurrence with the actual original report):

```json
{
  "mutationId": "11111111-1111-4111-8111-111111111111",
  "referenceVersion": "hafs-tanzil-1.0-20260928",
  "occurredAt": "2026-10-01T10:30:00+03:00",
  "occurrenceDate": "2026-10-01",
  "timezone": "Asia/Riyadh",
  "utcOffsetMinutes": 180,
  "selection": {"kind": "juz", "from": 1, "to": 1}
}
```

The result contains `groupId`, `actId`, revision, canonical ranges, selection integrity, original community day, assigned intersections, the day projection and community cursor. Juz 1 returns exactly `1:1–1:7` and `2:1–2:141`. Unresolved assignments can retain custom evidence without granting unapproved credit. The previous `/today/partial` validation is unchanged.

## Upgrade and local operation

SQLite migrations 004 and 005 add the independent daily-count projection, migrate hearts once, and track the community projection version. Server startup rebuilds older cards transactionally before serving the new contract. Account preferences remain missing until the member supplies them. Original assignment/rule snapshots and immutable evidence are preserved. Back up the database before deployment; use a separate live database and server key.

From `Back End`:

```sh
python3 -m safina.connected_cli serve --port 8766
python3 -m scripts.seed_october_sandbox
python3 -m scripts.build_connected_contracts
python3 -m scripts.build_connected_fixtures
python3 -m scripts.build_october_fixtures
python3 -m unittest discover -s tests -q
```

Explicit fictional October accounts are in `local/october-sandbox-access.json` (owner-only file). The seeder refuses live mode and preserves existing accounts. These credentials are only for the loopback sandbox. Original accounts without the new preferences will see setup completion on sign-in.

## Media delivery

Owner-supplied uploads can be prepared through the staff CLI:

```sh
python3 -m safina.connected_cli prepare-media /absolute/source.mp4 /absolute/new-private-output --ffmpeg /absolute/ffmpeg --rights-reviewed --captions /absolute/reviewed.vtt
```

The input is a local MP4/MOV/MKV/WebM up to 2 GiB. Restricted demuxers and file-only protocols avoid network/playlist inputs. Full decoding/transcoding produces a normalized MP4, a thumbnail, checked duration, checksums and an explicit processing/ready/failed manifest. Outputs remain private and unpublished. Captions are optional reviewed UTF-8 WebVTT. A failed preparation cannot be published as a ready uploaded video. Existing v0.4 reviewed private-storage references remain compatible.

Upload the prepared artifacts into the configured private storage bucket, then publish an editorially reviewed course version through the existing staff command. Use `kind: upload`, storage bucket/path, `rightsReviewed`, `processingState: ready`, `mimeType: video/mp4`, `sizeBytes`, `sha256`, and `durationSeconds` for new video metadata. Course/lesson thumbnails can be private asset objects; captions use `{id,language,label,asset}`. Thumbnail/caption/resource routes recheck enrollment and lesson prerequisites, then issue short signed storage access. No storage key or object path is exposed in member lesson responses.

YouTube sources use `{kind: youtube, url, rightsReviewed, embeddable, sourceTitle, sourceAuthor, reviewedAt}`. The server restricts hosts and canonicalizes the video ID, watch URL and embed URL. `embeddable` is a required owner/editorial review result; it is not guessed from a URL or automatically rechecked against YouTube. If embedding is unavailable, the frontend offers the original source link. No YouTube videos are downloaded or rehosted. YouTube playback does not invent watched progress or Quran credit. Technical references: [YouTube embedding](https://developers.google.com/youtube/player_parameters), [FFmpeg protocol restrictions](https://www.ffmpeg.org/ffmpeg-protocols.html), [MP4 fast-start](https://www.ffmpeg.org/ffmpeg-all.html).

A synthetic one-second clip was processed locally to verify the real converter and thumbnail output. No Coach Anas teaching content was supplied, fabricated or published. Real uploads, editorial review, storage configuration and live playback verification remain deployment inputs.

## Ship and live-service boundaries

`/ship-visual-state` matches the prepared frontend contract and returns `state: null`, `status: awaiting_policy`, stable vessel identity and named blockers. The confirmed closed-day ±3 arithmetic and chronological clamping are implemented and tested separately. It is deliberately not activated as a settlement job.

The supplied ship policy still requires decisions on construction-day counting, Saturday exemptions, member-timezone/Mecca mapping, late/corrected reports, existing-member activation, zero-health recovery and repair timing. There is no invented starting health, retroactive penalty, calendar carry rule, active maintenance ledger or scheduled settlement. Those require a ratified policy followed by activation/migration work.

Email/password and Google provider paths are implemented and mock-tested, including country/goal persistence through Google onboarding. Live Supabase project configuration, Google setup, email delivery and a real provider smoke test remain outstanding. Sandbox sign-in is working; it sends no email and cannot authenticate with Google.

## Verification

Final run: **100 backend tests passed**, **97 frontend tests passed**, and the production frontend build passed.

Automated checks cover legacy behavior plus canonical juz partitioning (6,236 verses), overlap, range-aware correction, independent evidence, counts 50→150→0, pinned goals, midnight/rest/week transitions, concurrent devices, reaction revisions, hidden/deleted participation, provider intents, HTTP contracts, media access and gated ship arithmetic. Frontend checks include de-duplicated activity labels and acceptance of the server ship fixture.

Browser verification used an explicitly fictional local account: sign-in, a saved partial count, juz 1 with exact boundaries, partial assigned coverage, zero completed-wird participants, emoji selection, country/goal update and retention of the old daily goal. Mobile layout was checked at 390 px. Production frontend build passes; the pre-existing lazy ship chunk size advisory remains.
