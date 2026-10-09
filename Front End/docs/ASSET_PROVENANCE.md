# Asset provenance

## Qur’an text

- Download: https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json
- Retrieved: 28 September 2026; saved byte-for-byte at `public/data/quran.json`.
- SHA-256: `d8a8adff387f60ce3ff7dbe3238dd9b27120bfe29d8fcb07ad2e89cad37cefd4`.
- Package: Quran JSON 3.1.2 by Risan Bagja Pradana; package declares CC BY-SA 4.0. Complete notice at `public/licenses/quran-json-LICENSE.txt`.
- That exact version’s README declares its Uthmani Qur’an text source as **The Noble Qur’an Encyclopedia (QuranEnc)**. Saved README at `public/licenses/quran-json-README.md`. Do not misattribute this dataset to Tanzil’s Arabic text.
- The text remains unchanged for screen-reader access, without normalization, generated verses or translations. Visual reading now uses the separate fixed-page assets below. All 114 sequential surahs, 6,236 sequential verses and surah lengths were validated. Surah counts independently matched the backend’s cross-checked metadata. This is structural verification, not a claim of scholarly verification of every glyph or full downstream rights audit.
- Production founder approval of text/provider/edition and independent text verification remain necessary. Source and license links appear in the reader.
- Juz start references are copied from the backend’s `hafs-tanzil-1.0-20260928` metadata. Its primary Tanzil metadata source is https://tanzil.net/res/text/metadata/quran-data.xml and cross-check is https://api.alquran.cloud/v1/meta. The backend records possible common ancestry. The fixed-page update below independently matches all 604 backend page starts against the image provider’s own metadata.

## Fonts

- Noto Sans Arabic via `@fontsource/noto-sans-arabic@5.3.0`, UI weights 400/500/600/700.
- Amiri via `@fontsource/amiri@5.3.0`, 400 for Qur’an and editorial headings.
- Local font assets; no Google Fonts runtime requests. SIL OFL notices saved in `public/licenses/`.

## Illustrations, icons and video

- Ship, abstract library artwork and poster are original code-native SVG/CSS for this prototype, no copied screenshots or third-party art.
- Lucide React exact version in package lock; ISC license in dependency. Icons have visible labels or accessible names.
- `public/demo.webm`: original 12-second silent abstract scene generated locally. `demo.vtt` contains a matching Arabic description. No coach, reciter, religious lecture or licensed music is represented. Encoder is a development-only dependency and is not shipped as application code.
- All library/curriculum titles are explicitly illustrative; there are no invented coach attributions, reviews, certificates, prices or interviews.


## Course thumbnails · 28 September 2026

`public/courses/*.svg` are original geometric illustrations created locally for this prototype: a sailboat for the VIP program and leaves for Health Course. Lesson variants have individual asset paths and numbered covers. No Kajabi visual asset or third-party photography is included. Replace these sample illustrations via each course/lesson thumbnail field when approved covers are supplied.

## Fixed Madani Mushaf pages · 29 September 2026

- Official archive: https://android.quran.com/data/zips/images_1260.zip (redirects to https://files.quran.app/hafs/madani/zips/images_1260.zip). Archive contains `.v8`.
- Provider implementation: https://github.com/quran/quran_android/blob/main/pages/madani/src/main/java/com/quran/data/page/provider/madani/MadaniPageProvider.kt; selects image version 8 and the official Android Quran data endpoint.
- 604 PNG files extracted **without modifications** to `public/mushaf/madani-v8/`. Each is 1260 × 2038; approximately 74.3 MB combined. Only the active page and adjacent pages are requested by the reader.
- Downloaded archive SHA-256: `d120aefe217af9f7d2751e6ab06b7a29c2348ceda786dfc0b485f810922365bf`. Each original image’s hash is recorded in `public/mushaf/manifest.json` and checked by the test suite.
- Page/surah/juz metadata extracted from the provider’s own [MadaniDataSource](https://github.com/quran/quran_android/blob/main/pages/data/madani/src/main/kotlin/com/quran/labs/androidquran/pages/data/madani/MadaniDataSource.kt), stored in `src/data/mushaf-metadata.js`. Source snapshot SHA-256: `7bf8de48d28c1a828cf529dd7d899ecd2203d4051a84c4fc8c308fb954e7e53f`. All 604 start references exactly match `Back End/data/reference.json`, edition `tanzil-medina-604`; all chapter and juz starts were also checked.
- Visual comparison against the user’s screenshots: page 50 (3:1–3:9), page 56 (3:46–3:52). Original images preserve calligraphy, verse markers, surah ornaments and line positions; no text is typeset or reconstructed for the visual pages.
- Ownership notice: [Quran.com image generator README](https://github.com/quran/quran.com-images) says its generator code is GPL, while the actual fonts and pages belong to the King Fahd Quran Complex. A copy is retained at `public/licenses/quran-com-images-README.md`. Do not relabel the page assets as GPL, CC BY-SA, or original Safina artwork. Production distribution approval remains part of the content/rights handoff.
- The existing Quran JSON dataset remains the separate accessible text alternative. It is not represented as a transcription certified against every glyph of these images.
