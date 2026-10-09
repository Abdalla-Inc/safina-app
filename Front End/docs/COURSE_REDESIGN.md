# Course redesign · 28 September 2026

## Design basis

The founder requested a lightweight Kajabi-style learning area: multiple courses, weekly programs or single long classes, thumbnails at both course and lesson level, sequential weeks gated by completion and submitted questions, and less explanatory page copy.

Official sources reviewed:
- [Kajabi course building and template overview](https://www.kajabi.com/blog/how-to-build-an-online-course-on-kajabi): describes modules, lessons, quizzes; Premier’s visual lesson navigation and Momentum’s restrained outline/progress navigation.
- [Kajabi module lock rules](https://help.kajabi.com/en/articles/12695117-how-to-lock-content-in-your-course-product): prerequisite lessons and quiz submission/passing are distinct policies.
- [Cohort template documentation](https://help.kajabi.com/articles/products/courses/how-to-customize-the-template-for-a-cohort-based-course): search-indexed official documentation describes course home, sidebar outline, session page and recordings. Direct retrieval returned 404, so this was not a signed-in Kajabi UI inspection.

Adapted the information architecture, not Kajabi branding or templates. No Kajabi images or code were copied.

## Implemented

- `دوراتي`: searchable course cards with illustrated thumbnails, progress, resume and outline actions; all/in-progress/completed filters.
- `سفينة النور — البرنامج الخاص` (VIP): 10 example weeks, two lessons in week one, one in each later week.
- `دورة الصحة`: one example class with end questions. No health advice is supplied.
- Course overview: modest thumbnail/title summary and collapsible weeks; no marketing hero.
- Lesson workspace: 16:9 poster/player, outline with lesson thumbnails, completion, private notes, bookmark, weekly questions and next lesson.
- Illustrations are original SVG assets in `public/courses/`; replace with approved cover photography or actual lesson stills through the thumbnail fields.
- Founder preview is unlocked by default. Student preview guards both links and the routed player. All earlier weeks must satisfy every lesson and submitted required answers.
- Student preview enables completion after the sample playback ends; founder preview can mark completion immediately. Actual backend viewing policy remains to agree; an ended event is not secure watch verification.
- Questions persist as drafts; submitting empty answers fails. Editing a submitted answer returns it to draft and recomputes later access. Final questions count toward course completion.
- Course and lesson data are isolated; existing local prototype records retained. Notes from legacy VIP lessons still display. New progress does not claim that old review flags satisfied new prerequisites.

## Scope

Local prototype only. Sample lesson titles, questions and 12-second silent clip are not the actual course curriculum. No answers are sent to instructors. Backend contracts, entitlement enforcement, content approval and media delivery are specified in `BACKEND_HANDOFF.md`.

## Verification

`npm test`: 23 tests including nine progression tests covering direct-access rules, founder bypass, all-lessons-plus-questions requirements, invalid answers, only-next-week unlock, earlier prerequisites, correction relocking, course isolation and resume behavior.

Browser checks use an isolated `localhost` origin so the founder’s `127.0.0.1` test records remain untouched. See the final review notes below for observed UI results.

### Observed browser results

- Desktop course outline and lesson player inspected; mobile catalog and player inspected at 372px with no horizontal overflow and loaded thumbnails.
- Student direct URL to week two was blocked before prerequisites. Both first-week clips were played through; completion alone kept week two locked. Draft answers survived moving between the two lessons. Whitespace submission showed validation; valid submission unlocked week two, left week three locked, and survived reload.
- Health Course remained independent at 0%; founder completion bypass worked and automatically opened its questions. After submission it reached 100% and appeared under completed courses.
- Empty search and all/completed filters checked. New notes stayed local. User’s original origin remains in unlocked founder mode; tests used separate localhost data.
- Captures: `docs/screenshots/courses-mobile.png`, `course-lesson-mobile.png`, `courses-desktop.png`.
