# HomeGroups project map

## Conversation-first corrections — November 12, 2026

[PR #50 corrections and validation](../FELLOWSHIP-CONVERSATION-FIRST-FIXES.md) documents lifecycle and membership guards, in-place shared reading, reply pagination, mobile sizing and the existing private-message request flow. Corrections remain on the existing `codex/fellowship-feed-visible-posts` branch. Browser data and rules tests are local/synthetic; no production permissions or records changed. No merge or deployment.

## Fellowship feed styling — November 7, 2026

[Feed presentation review](../FELLOWSHIP-FEED-STYLING.md) adds theme-derived contrast, author bylines/initials and editorial typography only within the existing home feed. No changes to routing, Firebase operations, discussion screens or pilot settings. Screenshots use synthetic posts; physical-device verification remains separate.

## Fellowship home feed — November 7, 2026

The review branch adds [a joined-community home feed](../FELLOWSHIP-HOME-FEED.md) to the existing Fellowship Live shell. It uses current memberships and per-community post queries, existing discussions/composer, global tokens and the UID-scoped context layer. The ordinary Prayer Map and separate read-only test route remain intact. Browser evidence is synthetic; active production authorization and physical-device verification are separate release checks. No production data/rules/pilot configuration or deployment change.

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

These were initial review tasks, not confirmed defects. The November 1, 2026 authorization recorded in root AGENTS.md supersedes the original folder-only write boundary.

## Devotional companion — October 7, 2026
[Week 1 pilot](devotionals/week-01.md) contains seven daily reflections and a weekly closing. [Editorial notes](devotionals/EDITORIAL-NOTES.md) record reading-list discrepancies and draft decisions. Content is awaiting Eddie's review; no app integration or additional weeks have been created.

## Commons messaging prototype — October 9, 2026
[First interface draft](collaboration/messaging/commons/index.html), [integration notes](collaboration/messaging/commons/README.md), and [QA status](collaboration/messaging/commons/QA.md). Local sample data only. Syntax/readback verified; browser verification blocked. Existing application code and Firebase configuration untouched.

## Production communication label — October 15, 2026

The active Week 1/2 app-shell integration is [commons-week-companion.js](collaboration/messaging/commons/production-integration/commons-week-companion.js), loaded by root index.html. Its visible name is now **Messaging**, including the embedded pilot and linked account/community pages. Existing file names, data paths, and message protocol names retain `commons` for compatibility. This label correction preserves the existing production implementation.

## Production Start conversation — October 15, 2026

The Week 1/2 [embedded Messaging pilot](collaboration/messaging/commons/week-context-pilot/index.html) now provides **Start conversation** above its filters. The [composer helper](collaboration/messaging/commons/week-context-pilot/start-conversation.js) uses existing Firebase starter paths and field shapes, retains account/week-scoped drafts, and pins optional study links to the originating week. [Production integration notes and regression checks](collaboration/messaging/commons/production-integration/README.md) distinguish mocked desktop/mobile verification from live Firebase testing.

## Weekly Messaging community routing — October 15, 2026

The [production pilot](collaboration/messaging/commons/week-context-pilot/index.html) now uses the existing Bible Study & Investigation (`study`) community for membership, starters and replies. [New weekly starters](collaboration/messaging/commons/week-context-pilot/start-conversation.js) always include an originating-week reading URL in their existing body. This week shows explicit week links in the latest 20 study posts; All Bible Study includes unlinked and other-week posts. Kingdom Projects conversations are preserved in their existing community. [Regression checks and limits](collaboration/messaging/commons/production-integration/README.md) cover mocked desktop/mobile behavior and distinguish it from live Firebase verification.

## Shared Messaging appearance and navigation — October 15, 2026

The five live [conversation](collaboration/messaging/commons/conversations/), [activity](collaboration/messaging/commons/activity/), [community](collaboration/messaging/commons/directory/), [profile](collaboration/messaging/commons/member/) and [account](collaboration/messaging/commons/auth/) screens share [a common theme](collaboration/messaging/commons/messaging-shell.css) and [navigation module](collaboration/messaging/commons/messaging-shell.js). Their navy/gold/cream appearance matches the Week 1/2 floating companion. Existing Firebase flows remain page-owned, with no collection or content migration. Study-origin links preserve week/community context, and the floating screen can return to the reading without a reload. The original sample-data preview remains separately labeled. [Production notes and checks](collaboration/messaging/commons/production-integration/README.md) document mocked desktop/mobile verification and live-service limits.


## Two Powers investigation page — November 1, 2026

[Production investigation](../investigations/two-powers-in-heaven.html) is registered as #016 in `data/investigations/published-investigations.json`; 17 total records. [Approved preview](investigations/two-powers/two-powers-in-heaven.html) and [integration/verification notes](investigations/two-powers/README.md) remain available. The approved HTML was copied unchanged and the existing loader was preserved. Structural checks passed; rendered browser verification remains pending. Eddie authorized publication and lifted the old folder-only write boundary; root [AGENTS.md](../AGENTS.md) records current task-scoped authorization.


## Commons privacy and security Phase 1 — November 4, 2026

Review-only hardening on codex/commons-privacy-phase1: [scope and handoff](collaboration/messaging/commons/SECURITY-PHASE-1.md). Adds shared DM draft/account isolation, discovery consent reset, email-link identity checks, a consolidated rules proposal and local regression/emulator tests. Production rules/config remain unchanged; live Firebase release reconciliation and real-provider verification are required before deployment.


## Commons Phase 1 verification follow-up — November 4, 2026

PR #29 now includes additional deferred-auth/thread-generation privacy corrections and expanded regressions. [Readiness and exact administrator gates](collaboration/messaging/commons/SECURITY-PHASE-1.md) distinguish local passing tests from blocked live rules/provider verification. [Phase 2 priorities](collaboration/messaging/commons/PHASE-2-PLAN.md) are planning only; no rollout is authorized.

## November 4, 2026 — Fellowship integration draft

On `codex/fellowship-phase1`, based on main `36e3516`: [integration report](collaboration/messaging/commons/FELLOWSHIP-INTEGRATION.md), native `cards/fellowship.html` / `js/fellowship.js`, existing Prayer Map and Commons screen adapters, listener disposal and global-theme inheritance. No new Firestore model, migration, deployment or production mutation. Draft PR #29 remains a security release dependency; it has not been incorporated into this branch. Browser tests use mocked services and a focused HomeGroups host; live rules and provider/device verification remain open.

## November 4, 2026 — Combined Fellowship/security candidate

`codex/fellowship-security-integration` retains both PRs' code and adds explicit async disposal invalidation. [Integration report](collaboration/messaging/commons/FELLOWSHIP-SECURITY-INTEGRATION.md) documents five textual conflicts, semantic auth/lifecycle resolutions, 75 client / 4 DM / 14 emulator / 18 Fellowship results and existing weekly/screen checks. Source PRs stay unchanged drafts. Public location downloads and live-rules/provider/publishing verification remain release gates; no production mutation or deployment.

## Fellowship local visual preview

[Local preview tooling and instructions](../tools/fellowship-preview/README.md) serve the integrated candidate through a loopback-only synthetic adapter. [Readiness](../tools/fellowship-preview/PREVIEW-READINESS.md) distinguishes mocked views and service behavior from production verification. No live hosted environment or Firebase resource was created; original historical data is untouched. A scoped embedded Messages CSS correction addresses the light-theme gradient and mobile layout revealed by preview screenshots.

## Controlled Fellowship release candidate

Separate `codex/fellowship-controlled-testing` branch builds on PR #31, with production entries installing an immutable UI release policy before the shared card runtime. Flag remains false; only bounded read-only fictional fixtures can be enabled for a trusted owner. Public Prayer Map routing/menu are restored. [Release configuration](../CONTROLLED-FELLOWSHIP-RELEASE.md) records public-static-asset limits, owner-confirmed main/root auto-publication, physical-device checks and rollback. No production change is applied.

## Fellowship live-services candidate

Separate codex/fellowship-live-integration from main 487a460 reuses existing Commons services through the native card; the owner-fixture route remains separate. New live pilot configuration is disabled without test UIDs or dates. [Reuse, conditional approved test plan and genuine release blockers](../FELLOWSHIP-LIVE-INTEGRATION.md) distinguish client/emulator coverage from unverified production rules/provider operations. No deployment or production mutation.

November 5: single-account pilot follow-up keeps activation disabled, permits an allowlisted administrator without granting Firebase permissions, and clears the week dock on loading/denied screens. See FELLOWSHIP-LIVE-INTEGRATION.md.

Fellowship live map-first presentation: [UI scope and verification](../FELLOWSHIP-LIVE-UI.md). Existing services/access configuration retained; live-only Menu and temporary week-dock hiding.

## Fellowship context integration

[Unification Phase 1](../FELLOWSHIP-UNIFICATION-PHASE1.md) extends existing HGRoute/card adapters and same-origin Commons bridge. ScriptureAPI owns loaded ref/version/anchor; authorized discussions own post/filter/scroll; existing Leaflet owns map state; Firebase/DM owners retain authorization and private drafts. New js/fellowship-context.js holds only constrained reading preferences and account-scoped ephemeral view metadata, invalidated on identity transitions. No new collection, general Scripture association index or social participation requirement. Read [the approved inventory](collaboration/messaging/commons/FELLOWSHIP-CONTEXT-ACCEPTANCE.md) as historical evidence; current runtime results and release blockers live in the implementation report. No production release is authorized by the report.

PR #36 final hardening: [release proofing and lock procedure](../FELLOWSHIP-PHASE1-RELEASE-LOCK.md) records existing-reader control isolation, request identity/error recovery, authorized focus restoration and clearing cross-community post targets. Exact SHA/test attestation stays on the draft PR; code completeness, external gate completeness and production approval are separate.

## Fellowship content sharing
Commons post and reply forms use js/commons-content.js for canonical Reading links. js/fellowship-shared-reader.js mounts the existing Scripture and weekly study readers within the workspace. Run node tools/check-conflict-markers.cjs to scan tracked files for Git conflict markers.
