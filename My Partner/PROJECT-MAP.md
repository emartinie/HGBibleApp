# HomeGroups project map

Initial inspection: October 6, 2026 (America/New_York).
Repository snapshot: `e8ec6ef8d3556b466373d24e0eb67af6a29e5f19` on main.
Scope: recursive file inventory and source reads of index.html, js/app.js, js/weekEngine.js, service-worker.js, and manifest.json. No runtime tests performed.

## Observed structure

| Area | Repository evidence | What is established |
| --- | --- | --- |
| App entry | ../index.html | References mainstage, app, route, player, navigation, and PWA scripts; includes the HomeGroups introduction. |
| Card navigation | ../js/app.js; ../cards/ | Loader fetches card HTML, loads scripts, dispatches initialization/cleanup events, and guards against stale requests. Runtime behavior remains untested. |
| Weekly study | ../data/week1.json through ../data/week52.json; ../js/mainstage.js | All 52 numbered data files exist. Contents, completeness, and rendering need review. |
| Cycle timing | ../js/weekEngine.js | Declares a 52-week cycle, UTC start date, and offset intended to align October 6, 2026 with Week 1. Boundary behavior needs testing. |
| Scripture languages | ../scripture/hebrew/; ../scripture/greek/; ../data/interlinear/ | Hebrew and Greek weekly files and interlinear assets exist. Coverage and integration need review. |
| Covenants and commandments | ../data/covenants/; ../data/commandments/; ../js/covenant-engine.js; ../js/commandments.js | Data and engine files exist; counts and relationships not audited. |
| Relationships | ../data/relationships/; ../js/relationship-engine.js | Schema, data, and engine exist; integration not inspected. |
| Investigations | ../investigations/; ../data/investigations/; ../investigations/topics/content-backlog.json | Published pages, manifest/schema, and backlog assets exist; publication counts and backlog status not verified. |
| Discipleship | ../data/journeys/; ../js/discipleship.js | Journey data and card script exist. |
| Ancient library | ../data/ancient-library/; ../js/ancient-library.js | Catalog and historical text collections exist; sourcing and reader behavior not audited. |
| Audio/media | ../js/orbitFloatingPlayer.js; ../assets/sounds/voice/; ../podcasts/ | Player and audio assets exist. Browser voice selection and playback need runtime checks. |
| Maps and community | ../HomeGroupsMap.geojson; ../js/prayermap.js; ../js/radiomap.js; ../firebase/ | Mapping and Firebase-related assets exist; live services and permissions not tested. |
| PWA | ../manifest.json; ../service-worker.js; ../offline.html; ../js/pwa.js | Manifest requests standalone display. Worker uses shell cache v6, network-first navigation fallback, and refreshes selected cached assets. Full offline study availability is not established. |
| Book | ../BookDraft/ | A manuscript DOCX exists; contents not read in this inspection. |
| Alternate/prototype pages | ../index.dev.html; ../indexV2.html; ../indexV3.html; ../knowledge-module-prototype/ | Alternate entries and prototypes exist; do not assume unused or safe to remove. |

## Recent history observed

These are commit descriptions, not independent verification of outcomes or author attribution:

- `9bd5629`: Prefer available English narration voices and refresh player cache.
- `7912abf`: Fix week rollover and align October 6, 2026 with Week 1.
- `0073dfc`: Update missler.js.
- `e8ec6ef`: Create My Partner folder.

No AGENTS.md files were found in the inspected snapshot. The root README contained only the repository title.

## Suggested next inspection

1. Trace a Week 1 visit from app entry through timing, data loading, scripture, and playback.
2. Build a matrix of selectable cards, HTML files, scripts, and initialization/cleanup behavior.
3. Compare the investigation manifest and backlog with published pages.
4. Review actual offline coverage and update behavior on repeat visits.
5. Reconcile findings with Eddie and the intern before assigning implementation.

These are review tasks, not confirmed defects. Partner documentation stays in this directory; application edits require Eddie to expand the scope.

## Devotional companion — October 7, 2026
[Week 1 pilot](devotionals/week-01.md) contains seven daily reflections and a weekly closing. [Editorial notes](devotionals/EDITORIAL-NOTES.md) record reading-list discrepancies and draft decisions. Content is awaiting Eddie's review; no app integration or additional weeks have been created.
