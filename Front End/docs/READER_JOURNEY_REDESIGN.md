# Reader and Journey redesign · 29 September 2026

## Reader — latest update

The founder's mobile screenshots supersede the earlier flowing-text design. The current implementation uses fixed Madani pages, horizontal page turning, tap-to-hide controls, and a separate full surah/juz index. No reading-log prompts remain in this surface. Current behavior, source integrity, verification and integration details are maintained in [MUSHAF_READER.md](MUSHAF_READER.md).

## Journey

Removed the large slogan, reassurance paragraphs and long ship explanation. A centered ship, single progress line and Calendar / Log / Khatmas controls form the main view. Additional context is behind the information control. Local correction/revision history remains available.

The source selector separates illustrative/local data from the real local synthetic backend read preview. Backend source does not manufacture current-ship progress when the server returns an unresolved carry policy. See [backend connection review](BACKEND_CONNECTION_REVIEW_2026-09-29.md).
