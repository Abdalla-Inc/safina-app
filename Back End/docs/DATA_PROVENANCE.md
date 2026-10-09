# Qur’an metadata and asset review

Pinned reference: `hafs-tanzil-1.0-20260928`. Includes 114 surah verse counts, 30 juz starts and 604 page starts for the specifically named `tanzil-medina-604` edition with map version `tanzil-pages-1.0`. The ordered numbering has 6,236 verses. No text, font, translation, word-position map or audio is included.

Primary source: [Tanzil metadata version 1.0](https://tanzil.net/docs/Quran_Metadata), downloaded [XML](https://tanzil.net/res/text/metadata/quran-data.xml) on 28 September 2026. The original XML is preserved in `data/sources/tanzil-metadata-1.0.xml`; its header declares `(C) 2008-2009 Tanzil.info`, `license="cc-by"`, version `1.0`. That metadata header does **not** specify a CC version. Attribution and source linkage are preserved; no inference is made that metadata permission covers fonts, scans or audio.

The separate [Tanzil text license](https://tanzil.net/docs/Text_License) states CC BY 3.0 with verbatim-preservation and attribution requirements for its text. It was reviewed, but no text was downloaded, modified or shipped. Choosing the production text/word/edition package remains an explicit asset decision.

Cross-check: [Al Quran Cloud metadata API](https://api.alquran.cloud/v1/meta), with its response preserved and hashed. All 114 surah counts, all 30 juz starts and all 604 page starts agree. Its [terms](https://alquran.cloud/terms-and-conditions) were reviewed on 28 September; content-specific rights must still be respected. API access does not confer general rights to all associated assets.

Additional provider check: [Quran Foundation chapters](https://api.quran.com/api/v4/chapters?language=en) and [juz metadata](https://api.quran.com/api/v4/juzs). All chapter counts and every juz range matched; the response contained duplicate rows for juz numbers and every duplicate was checked, not counted again. Only comparison results and response hashes are stored in `data/foundation-crosscheck.json`; Foundation text/audio/API payloads are not republished here.

These are separate published provider checks. They are **not proof of independently derived underlying source lineages**; providers may share Tanzil ancestry. The runtime is pinned to the locally validated metadata, not to a live API. `scripts/build_reference.py` reproduces every chapter, juz and page comparison from the saved source files. Source SHA-256 hashes and revision receipts are in `data/reference.json`.

B (2:1–286) includes all J2, part of J1 and part of J3. Missing Al-Fatiha means B alone does not finish J1. J16 is 18:75–20:135. One B act has 286 unique verses regardless of duplicated assignment labels.

The page adapter rejects unknown editions/map versions. It supports this one verified mapping only; tests do not claim to validate another physical Mushaf. There is no universal “20 pages = one juz” conversion. Whole-verse partial reading is supported; partial-word precision remains unavailable until a pinned word map is reviewed.
