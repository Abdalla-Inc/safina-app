# Safina animation v0.5 integration · 1 October 2026

## Delivered

The exact procedural ship, lighting, ocean, surface maps, spray, damage, weather and moon texture from the founder's `Safina Ship Handoff v0.5` are now bundled in the app. Source integrity was checked against the supplied SHA256 manifest before adaptation. Three.js is pinned to **0.186.1**; no studio globals, controls, data mutations or global CSS were imported.

Runtime source: `src/features/safina/renderer/`. React host: `ShipScene.jsx`. Common calendar: `JourneyCalendar.jsx` and `calendar.js`. The original static Ship component remains available to unrelated screens; Journey uses the new 3D scene.

Only two renderer integration changes were made: the moon asset URL is configurable for the app base path, and pointer orbit is disabled so vertical phone scrolling over the canvas works. Accessible rotate/reset buttons still control the camera. The approved geometry and art remain intact. NASA asset provenance and Three's MIT notice are retained in `public/licenses/`.

The scene loads only when needed, in its own build chunk. Its viewport has a fixed responsive size; first state is applied instantly, later state changes animate, and opening unrelated pages never loads the scene. Controls are Arabic, outside the canvas, and have keyboard/touch labels. Explicit pause and OS/app reduced-motion preferences stop animation. Renderer visibility/intersection handling stops offscreen work; React cleanup disposes the renderer, geometry, materials, listeners, observers and canvas. Import cancellation handles navigation during loading.

## Founder preview versus connected account

- **Local preview:** the initial selection shows the approved complete ship. The compact selector offers empty sea, construction stages 0–30 via slider, local daily build credit, maintenance 91%, repair 94%, critical storm 15%, and 0% condition. These options never modify readings, earned credits or account health. All are labeled visual previews.
- **Old synthetic backend mode:** does not infer a ship from legacy total credits; shows pending visual state.
- **Connected account:** requests `/ship-visual-state` using the existing authenticated same-origin request machinery. Valid responses are checked for schema/asset/policy, phase/range, vessel identity and monotonically increasing revision. Unknown endpoints and pending policy never become healthy default ships. Failed refresh can retain only the same account's last accepted projection with a visible stale warning. Account identity keys and request cancellation prevent showing another member's ship.

Connected refresh runs on mount, corrections, explicit refresh, community-day change, visibility/reconnect and a bounded 30-second visible-page poll. The client never settles health on a timer. Actual maintenance cutoff and authoritative state remain server responsibilities. Backend workstream's account/session v0.4 integration was already present when this task started and was preserved.

**1 October update:** the visual-state endpoint now exists but returns `awaiting_policy` with `state: null` for all members. The connected host is prepared for it but no live health or new lifecycle policy is claimed. Supplied fixtures remain test-only. For first-use empty sea the server must return ready construction step 0; a pending policy is a different state.

## Calendar and consistency

Both Journey variants use one calendar palette across every tier:

| State | Color | Other cue |
|---|---|---|
| Completed | Emerald `#13835f` | Check |
| Partial | Amber `#f8cb65` | Half circle |
| Closed, not completed | Rose `#f4c6ca` | Minus |
| Explicit rest/pause | Slate `#e0e8f1` | Dash |
| Today still open | Neutral | Dashed outline |
| Future / before assignment | Neutral | Accessible label |
| Unknown / pending policy | Neutral stripes | Pending label |

A future day, an unknown result, and a pre-enrollment day are never red misses. Every date has a text/accessible equivalent; status is not color-only. Connected daily details still show canonical ranges, correction controls and proven khatma markers. Data is never rewritten to match a color.

The month header shows completed days and **تتابع هذا الشهر**. This is a bounded view, not a lifetime streak: walk backward through the displayed dates, count complete days, skip explicit rest, allow today's still-open/partial task, and stop on closed partial, unknown or missed days. No new reward policy is introduced. The backend should return authoritative longer-term streak metrics before the UI makes claims outside this displayed month.

Local historical records with a single known B/BI snapshot are evaluated using that stored level; unknown or mixed historical records remain recorded/pending instead of using today's level. Retractions do not restore sample completed marks. The September calendar still contains explicitly labeled examples; current real local entries take precedence.

## Validation and limits

- Handoff SHA256 integrity passed; all eight supplied maintenance arithmetic reference tests passed (reference only, not a new server scheduler).
- All **81 app tests pass**, including supplied renderer progress/weather/storm tests and new integration tests for all visual-state fixtures, invalid values, stale revisions, unexpected vessels, uniform tier colors, non-miss states, bounded streak behavior, month/year and leap dates.
- Production build succeeds. Three/scene is lazy-loaded; Vite reports a 647 kB renderer chunk (~165 kB gzip). It is not included in the initial app chunk.
- Browser checks verified complete and partial construction, storm damage, empty-sea state text, pause/rotate/reset, reduced-motion pause, route cleanup (zero ship canvases after leaving, one on return), calendar day selection and no horizontal overflow at 320px/390px. Desktop rendering and moon loading were visually checked; browser console showed no errors. No physical-phone FPS, battery or WebGL context-loss certification is claimed.

Physical iPhone/Android profiling, reduced GPU quality presets if measured necessary, authenticated end-to-end lifecycle settlement, offline late-day grace, cross-zone mapping, construction-to-maintenance corrections and migration remain joint delivery work from the animation handoff. Do not turn unknown rules into frontend health arithmetic.


See [current ownership and daily construction handoff](FRONTEND_BACKEND_OWNERSHIP.md) for the founder’s one completed daily wird → one construction step requirement and the remaining authoritative lifecycle work. Sandbox accounts now expose an explicitly labelled 0–30 preview even while earned state is pending.
