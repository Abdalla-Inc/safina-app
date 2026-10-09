# Fixed-page Mushaf reader · 29 September 2026

The latest founder screenshots supersede the earlier continuous-text design. Reading is now a quiet, mobile-first book surface with no app sidebar, bottom app navigation, slogans, reading-log prompts, font-mode toolbar or load-more action.

## Behavior

- `#/reader`: searchable index of all 114 surahs, a 30-juz selector, a quiet last-position row, and a bookmark icon. Each row shows the physical starting page. Surahs beginning midway through a leaf open that entire leaf.
- `#/reader/page/50`: original 604-page Madani Hafs layout. Line/verse placement, surah headers and basmala come from the unmodified page image; CSS only scales it uniformly. All pages are packaged locally. No external image request is needed at reading time.
- Swipe right for the next leaf and left for the previous leaf. Up/down motion is not page navigation. Tap the page to hide controls; tap again to restore them. The printed surah/juz running head and folio remain in quiet mode, matching the supplied screenshots. Hidden controls are inert and not in the keyboard/accessibility navigation order.
- Small arrow buttons and keyboard Right/Left provide alternatives to swiping. Escape restores the controls. First/last pages do not wrap. Browser zoom is permitted; no word-following, automatic scrolling or microphone feature is added.
- Bookmark and page-jump tools are discreet. Jump accepts Arabic/Western digits, validates 1–604, and reports invalid input in the sheet. Source information is under More → About, outside the reading surface. No audio placeholder is presented.
- Page changes preserve focus mode and do not change line positions. The page always fits the available viewport; controls occupy reserved margins and do not push the page when hidden. On short landscape displays the whole page becomes smaller; portrait is the intended reading orientation and browser zoom remains available.
- Existing `#/reader/:surah/:ayah` links resolve to the containing physical page. Today’s explicit surah/assignment actions now link directly to those pages. Last position updates quietly, without saving notifications. Previous verse bookmarks remain in storage and are migrated once to their physical page equivalents.

## Content and integration

604 PNGs, each 1260 × 2038, sourced from the official Quran Android Madani image archive v8. Total static page assets: approximately 74.3 MB; the browser loads one page and prefetches only the neighboring two. This is not a claim that the app has a complete offline/PWA cache. See `ASSET_PROVENANCE.md` for original URLs, ownership notice, archive hash and per-image manifest.

The provider’s own 604 page boundaries exactly match the backend's `tanzil-medina-604` reference. Tests verify every one of the 6,236 verses is mapped once, including the three surahs on page 604. Accessible text uses the existing unchanged, separately attributed Quran JSON dataset; it is not used to fake visual pagination.

Reader state stores edition, physical page, compatible first verse, and page bookmarks locally. Opening, turning, bookmarking or leaving a page creates **no reading event or credit**. No backend writes, trace calls or automatic tracking were introduced. Production preference/asset requirements are in `BACKEND_HANDOFF.md`.

## Verification

- All 32 frontend tests and the production build pass, including per-image byte checks, exhaustive verse/page mapping, chapter/juz index consistency, page bounds, search, swipe discrimination and existing course/backend tests.
- Browser checks at 390 × 844: pages 50 and 56 compared with supplied screenshots; tap to hide/reveal; pointer swipes both ways while hidden; vertical drag does not turn a leaf; keyboard page turn; Arabic-digit page jump and invalid input; bookmarked page retained after refresh; 114-surah and 30-juz counts; surah 114 opens page 604; end buttons disabled correctly.
- Desktop layout inspected. These are browser viewport and pointer checks, not a claim of physical iPhone/Safari testing.
