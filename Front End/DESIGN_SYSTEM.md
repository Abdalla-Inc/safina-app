# Safinat Al-Nur — prototype design system

This build responds to the founder’s explicit request to start implementation and deliver a working frontend. One coherent, reversible direction was chosen for this build; it is **not** represented as a previously selected final design. The earlier gate/research documents remain history.

## Direction: a quiet harbour

Warm ivory, forest green and restrained sand tones. An original dhow illustration makes the ship visible without a gamified control panel. The experienced member sees direct assigned rows, one-tap reports and a clear reader entry. On phones, a reader link remains near the top; longer review tasks can scroll. Desktop uses a right sidebar; phone uses Today, Reader, Journey, Classroom plus More for every other section.

No leaderboard, punitive streak, loss animation, fake spiritual claim, ad, paywall, forced share or ship-management chore. All founder lesson weeks are unlocked.

## Tokens and typography

| Token | Value / use |
|---|---|
| Deep ink | `#243f37` body/heading |
| Primary action | `#245348` with white text |
| Canvas | `#f7f8f3` |
| Card | `#fdfefa` |
| Secondary text | `#627257`, revised darker during browser QA |
| Border | `#e3e7de`; reinforced active/focus edges |
| Focus | `#ae8542`, 3px visible ring |
| Warm accent | sand/gold supporting dhikr/classroom states, never rank |
| Spacing | mostly 4/8/12/16/20/24/28/32/40px |
| Radius | 8px controls, 12–17px surfaces, circles only for icons/avatars |
| UI font | local Noto Sans Arabic 400/500/600/700 |
| Scripture/editorial | local Amiri 400; Qur’an default 30px, adjustable 24–46px |

RTL is the document default. Logical inline spacing is used throughout core layout. Arabic-Indic UI counts coexist with canonical Latin API references. Quran text is never normalized; search examples normalize only index strings.

## Components and contracts

- `Heading`, `SectionTitle`, `Button`, `IconButton`, `Pill`, `Empty`, `Modal`, `SaveButton`, `DemoVideo`, `Ship`, direct reading rows, range slider/number fields and entry/revision views.
- Native dialog handles focus containment; Escape/close returns focus. Mobile sidebar becomes a labelled dialog with keyboard containment; hidden navigation is inert. Explicit labels for every form input and icon action. Main route changes reset position and move focus without unintended scrolling.
- Touch targets are generally 44px. The direct completion circle has a larger invisible hit area. Native small calendar cells remain separated. UI is tested at 320px and larger; no reliance on swipe, color or haptic alone.
- Whole-surah check is a deliberate self-report. Partial control is an inclusive ayah endpoint with slider, stepper and exact range inputs. No physical-page counts are invented. Row-wide partial swipe gestures and device-specific haptic validation are future refinements; the accessible equivalent works now.
- Toast acknowledges local save with undo. Corrections keep revision lineage. Undo affects only the record, preserving unrelated later edits and never automatically republishing a revoked post.
- Reader position and provisional trace are separate. Navigation can leave an editable suggestion; no credit from exposure. Sparse/disjoint navigation is not silently treated as continuous observed coverage. Member review can still deliberately change the range.
- Complete and partial states have text/icons. Historical level category has a separate label/token. Sample prior calendar data is explicitly distinguished from actual local records.
- Small, optional motion only; `prefers-reduced-motion` and an in-app option disable transitions. No looping ship animation. All original illustration is SVG/CSS.
- Video uses browser-native controls, captions, speed and local resume. It never auto-completes a lesson or grades understanding.

## Decision register

| Classification | Decision |
|---|---|
| Founder direction | Frontend build now; working prototype; GitHub skills first; all testing unlocked; backend communication file |
| Confirmed backend rule | Full approved day one credit, thirty credits per ship; overlap once; khatma separate; corrections may change derived credit |
| Backend contract inspected | v0.3.0 fixture Today and correction result; explicit null/unresolved policy fields |
| Research transfer | Direct rows and a visible longer journey, with fewer app actions and no destructive motivation |
| Design hypothesis | Quiet harbour palette, expressive ship and Arabic editorial headings create a calm reading entry |
| Local prototype choice | Fixed date, sample history/ship, immediate local commitment preview and all-week access |
| Pending founder/backend | Higher schedule grids, fractional credit, carry/presentation, transition rules, content/rights and production consent/retention |
| Pending validation | Fluent Arabic copy review, assistive-technology session, older-member usability and real low-connectivity testing |

## Arabic copy glossary for founder review

| Arabic | English meaning |
|---|---|
| وقتٌ للقراءة | Time to read |
| سجّل ما قرأت | Record what you read |
| أؤكّد القراءة وأحفظ | I confirm the reading and save |
| راجع ما قرأته فعلًا | Review what you actually read |
| تصحيح قراءتك | Correct your reading |
| قراءة محفوظة. لا نعرض رصيدًا جزئيًا قبل اعتماد قاعدته. | Reading saved. Partial credit is not shown before its rule is approved. |
| أهلًا بعودتك، كما أنت. | Welcome back, as you are. |
| سجلّك يبقى لك. | Your record remains yours. |
| مشاركة باختيارك | Sharing by your choice |
| كل الدروس مفتوحة للتجربة | All lessons are open for testing |

Copy is authored for prototype review, not claimed to be religiously approved. The founder is the decision owner; no separate coach gate is imposed.
