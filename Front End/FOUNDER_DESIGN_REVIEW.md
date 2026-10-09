# Founder review — working frontend

**28 September 2026 · Prototype 0.1.0**

Open **[Safinat Al-Nur](http://127.0.0.1:5178/)**. The original app on port 5173 was left untouched. This new build is in `Front End/` and uses its own browser-storage key. All founder test features and all ten classroom weeks are open: no login, payment or subscription expiry. Course gates apply only when you choose student preview.

## What is ready

The responsive Arabic interface connects Today, the full Qur’an reader, recording and corrections, private journey/calendar, optional dhikr, ten classroom weeks, library and circles. Settings provides data export, reset, text size, reduced motion, preferences and test states. [PRODUCT_FLOWS.md](PRODUCT_FLOWS.md) lists every route and a practical walkthrough.

The visual direction uses ivory/forest tones, clear direct reading rows and an original ship illustration. Your instruction to start the build is the authority for this implementation. This is one implemented direction for review, not a fabricated history of three approved design options. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) records design decisions and Arabic/English copy examples.

## Try this first

1. On Today, tap **قرأت من المصحف** and save a partial reading. Correct it or undo it. Whole-surah checkmarks also work.
2. Open **المصحف**, choose a surah/juz or ayah, change text size, navigate and review the suggested record. You can shorten, extend, discard or confirm it.
3. From a saved reading, choose **مشاركة القراءة**. Details start hidden and posting requires a separate checkbox. This creates only a local example. Correct the source reading and its linked update is removed.
4. Open **دوراتي** for the multi-course library. Open the VIP weekly program or single-class Health Course. Use the preview selector to test student gates: finish both first-week samples, mark completion, and submit both questions to unlock week two. Founder mode keeps every lesson open.
5. Search `istighfar` in the library. Save/open the result. Try circle creation, joining with `SAFINA`, reactions and local chat.
6. In Settings, try return/error/offline/free/unresolved scenarios. **إعادة التجربة من البداية** clears local test data after an in-app confirmation.

## Verification performed

- **Production build passed.** React/Vite bundle builds successfully; exact package versions and lockfile are included.
- **14 automated checks passed:** pinned scripture integrity/structure, inclusive-range validation, overlap union, explicit-repeat separation, no credit from trace, limited full-day demo preview, unresolved partial/higher-tier policy, correction lineage/post invalidation, retraction, scoped undo, date separation, bilingual sample search, juz references and backend v0.3 fixture invariants.
- **Browser walkthrough:** manual 1–25 report, correction to 1–20, reload persistence; consent disabled before checkbox; share appeared locally; correction removed it; chat accepted a local message; reader suggestion shortened to 1–8; J3 navigated to 2:253; sample video loaded 12 seconds without media error and played from timestamp 4; speed, notes, MCQ, written work and reviewed marker worked; `istighfar` returned the correct example; dhikr increment/correction produced the expected count; service-error retry restored Today; BJ2 showed unresolved schedule; circle creation and SAFINA joining worked. Final test data was reset.
- **Responsive inspection:** 320px Journey/Reader, 390px Today/menu, 430px Reader, 768px Reader and 1440px Settings layout widths matched their viewport widths. Desktop and phone screenshots were inspected. These are targeted checks, not a claim that every screen/state/device combination has been tested.
- Browser error log was empty after the final walkthrough. A transient preview interruption during a development-server restart was recovered by reopening the local tab. Full-page capture produced compositor artifacts, so final desktop review images use normal viewport captures.
- Secondary text contrast was strengthened, mobile navigation made inert when closed, focus containment/return added, and the phone ship crop/reader entry refined during QA.

Screens: [Today desktop](docs/screenshots/today-desktop.png), [Today phone](docs/screenshots/today-390.png), [Classroom desktop](docs/screenshots/classroom-desktop.png), [Reader phone](docs/screenshots/reader-430.png).

## What is deliberately local or still needed

The browser saves your prototype data locally. There is no live backend, authentication, synchronization, external group publication, coach submission, notification delivery or payment. Offline is a labelled simulation, not a PWA capability. Sample calendar marks/18 ship steps are illustrative; no real credits or khatmas are awarded.

All 114 surahs are available from a byte-pinned, attributed dataset. Its verse counts match the backend reference; source/license declarations and limits are in [ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md). Production text/provider/edition approval, independent glyph verification and a real Mushaf page map are still needed. Native row-wide page swipes/device haptic validation are not implemented; ayah sliders, taps and steppers are working equivalents.

Classroom curriculum, coach notes, real videos, transcript search corpus, rights and assessment/review policy were not supplied. Their shells use clearly labelled samples and an original silent abstract clip. Price is not invented. Higher schedule/transition, partial credit and ship carry decisions stay with the founder/backend. Real paid-access lifecycle and automatic group sharing require server contracts.

No representative-member interviews, Arabic expert review, screen-reader session or mobile hardware haptic test is claimed. Those remain validation work before production.

## Handoff and downloaded skills

**[BACKEND_HANDOFF.md](BACKEND_HANDOFF.md)** is the file to pass to the backend workstream. It maps actual v0.3.0 fixture fields, proposed mutations, error/offline states, reading/ship/khatma separation, reader assets, classroom/media, entitlement boundaries and publication consent. It ends with the smallest useful next backend delivery.

Two GitHub skills were downloaded before application code: pinned UI UX Pro Max and Web Design Guidelines. Their project-local paths, revisions, MIT notices and how they were used are in [SKILLS_INSTALLED.md](SKILLS_INSTALLED.md).

The prototype is ready for your testing. Future feedback can target layout/copy or particular journeys while backend/content decisions progress independently.
