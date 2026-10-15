# Week 1–2 production integration — staged, not deployed

## What is ready
- `commons-week-companion.js`: standalone app-shell module, listens for the actual `weekChanged` event from `js/mainstage.js`, reads `#weekSelect` / `window.currentWeekData`, shows launcher only for Week 1/2, and supplies week context to the embedded Commons pilot.
- `../week-context-pilot/index.html`: supports `?embedded=1&week=1|2`, receiving same-origin week updates.
- `../week-context-pilot/context.js`: reads `data/week1.json` and `data/week2.json` (read-only).
- Same Firestore collections and account/membership checks as prior Commons prototypes; no new Firestore rules.

## Proposed production wiring — intern to review/test/apply
Add this single module script near the end of the root `index.html` body, after the app's DOM elements:
```html
<script type="module" src="My%20Partner/collaboration/messaging/commons/production-integration/commons-week-companion.js"></script>
```
Do not alter `js/mainstage.js`, `data/week1.json`, `data/week2.json`, or Firebase configuration unless independently justified. This module should be disabled or removed easily by removing the one script tag.

## Test checklist before production
1. Verify on published origin (same-origin Firebase auth), Week 1 and Week 2 navigation and exact context, and no launcher on unrelated cards/weeks.
2. Verify user not signed in gets actionable sign-in link, and member missing Kingdom Projects gets community join link.
3. Test pointer/touch drag on actual iPhone Safari and installed PWA; minimize/restore; keyboard open; viewport rotation; scroll underlying study; focus.
4. Test authenticated posts/replies and full Commons links. **Note:** full Commons links currently use relative paths from the embedded pilot and may need to open the top-level page, not inside the iframe.
5. Confirm iframe close preserves draft but does not leak listeners excessively; ensure no duplicate instances on SPA navigation; check page lifecycle and offline behavior.
6. Validate no visual collision with audio player, other excursions, safe areas, or small displays.
7. Confirm Firestore permissions and moderation readiness before broad launch.

## Known limitations
- This is **staged integration**, not a production deployment or verified iPhone fix.
- Discussion relevance still matches text in recent Kingdom Projects posts, not canonical corpus IDs.
- The embedded page's internal Commons navigation may remain within the iframe until handoff behavior is implemented.
- The current module uses a floating iframe to reuse existing Commons UI; later consolidation into a single reusable component is recommended.
- Membership is Kingdom Projects only; no automatic joining.

## Messaging label update — October 15, 2026

Root `index.html` now references the integration module with `?v=20261015-messaging-1`. Visible labels use **Messaging**; the iframe URL has the same release marker to refresh its labels. Internal `commons` IDs, Firebase paths, and the `commonsWeek` message protocol remain unchanged. This release changes branding and cache URLs only; it does not introduce a second communication panel or migrate data.
