# Partner work and handoff log

## Authorization
Updated November 1, 2026: Eddie lifted the former folder-only boundary. Partner may edit relevant repository files for Eddie’s requested work and publish when authorized by that work. Root AGENTS.md records the current scope. Earlier entries describe historical permissions. The intern's current assignment and uncommitted work remain unknown.

## Tasks

| Task | Owner | Affected paths | Status | Verification / handoff |
| --- | --- | --- | --- | --- |
| Establish Partner workspace | Partner | My Partner/AGENTS.md, README.md, PROJECT-MAP.md, WORK-LOG.md | Complete | Initial rules, inventory map, and coordination log created. No application files changed. |
| Trace Week 1 end to end | Unassigned | Read-only app review; findings written in My Partner/ | Proposed | Coordinate with Eddie and the intern before implementation. |
| Audit card integration | Unassigned | Read-only cards/ and js/ review; findings in My Partner/ | Proposed | File presence alone does not establish working behavior. |

## Initial inspection record
Inspected repository tree at `e8ec6ef8d3556b466373d24e0eb67af6a29e5f19`; 768 tree entries, including directories. Read index.html, js/app.js, js/weekEngine.js, service-worker.js, and manifest.json. Runtime behavior, manuscript content, live Firebase services, and intern activity were not verified.

## Future entry template
- Date and task:
- Owner:
- Starting commit:
- Paths to read:
- Paths to change (Partner: only My Partner/):
- Status:
- Checks and evidence:
- Result and commit:
- Remaining questions / handoff:

This log supports coordination; it is not a lock and cannot reveal another worker's uncommitted changes. Recheck history and current file revisions before writing.

## October 7, 2026 — Week 1 devotional pilot
- Owner: Partner; authorized by Eddie.
- Starting commit: 4026dea2f062a1fcd3d831ca01cc1438e6dd9cc5.
- Created: devotionals/week-01.md and devotionals/EDITORIAL-NOTES.md within My Partner/.
- Read: data/week1.json, scripture/english/week1.html, commentary/week1.html, workspace instructions and recent history.
- Status: pilot draft complete for Eddie's editorial review; no live app integration.
- Checks: seven complete daily sections; Scripture references align with the selected shared core; conflicting source lists documented separately; no application files changed.
- Pilot commit: 57604d83ba2bdf2bbb07e0d01f5aa0c69db1b082.
- Handoff: review tone and reading alignment before writing additional weeks. Intern activity remains unknown.

## October 8, 2026 — Collaboration introduction
- Owner: Partner; authorized by Eddie.
- Created collaboration/README.md, PROTOCOL.md, INTRODUCTIONS.md, INTERN-RESPONSE.md, and INVITE-INTERN.md.
- Scope: all writes inside My Partner/; no production edits or external messages.
- Status: welcome and draft protocol prepared; awaiting Intern's actual constraints and response. No agreement or direct contact assumed.
- Handoff: Eddie pastes the invitation into the existing Intern session, then asks Partner to read the committed reply.

## October 9, 2026 — Commons first interface prototype
- Owner: Partner; Eddie explicitly authorized creation inside My Partner/.
- Created collaboration/messaging/commons/{index.html,app.js,README.md,QA.md,check.cjs}.
- Local sample-data conversations, spaces, project board, attention inbox, persistence and handoff export. No Firebase writes or existing entry-point changes.
- Verified JavaScript syntax and exact GitHub content readback. Browser test blocked by absent Chromium and failed download; visual and interaction checks remain open.
- Next: Eddie reviews first pass; Intern may review implementation when available. Authenticated privacy, cross-device sync, and notifications are not implemented.

## October 9 — Commons Prayer Map update
Partner updated Commons index.html/app.js and documentation inside My Partner/. Sample prayer requests connect to conversations; local prayer acknowledgment and visibility illustration added. Read existing Firebase initialization, prayer map and repository rules; live deployment not verified. No production Firebase writes or outside-folder edits. JavaScript syntax and GitHub readback checked; browser verification remains blocked. Private prayer storage needs enforced membership rules before integration.

## October 15, 2026 — Production Messaging label correction
- Owner: Codex, at Eddie’s request to fix the production label.
- Baseline: `b945b743ac63bcc88ec267d5ca89fd20c1eabcde`; latest production startup/cache fixes are preserved.
- Scope: rename visible Commons labels to Messaging in the actual Week 1/2 production module, embedded pilot, and linked communication pages; refresh module/iframe cache URLs.
- Existing Firebase paths, browser keys, postMessage names, messages, and accounts are unchanged. Larger unpublished companion work is excluded from this release.
- Verification: label-only source comparison, script syntax checks, and desktop/mobile tests of the actual production module and embedded page before publication.

## October 15, 2026 — Add production conversation starters
- Owner: Codex, responding to Eddie’s report that Weeks 1 and 2 had no way to start a conversation.
- Baseline: `337923cbf77e988781a0c646f4cf8ddb72b531ea`; existing production behavior and unpublished workspace work are preserved.
- Added Start conversation to the actual embedded production pilot, with a standalone form/helper and existing Firestore starter payload. Drafts are account/week-scoped; failed sends retain them. New threads open after confirmed creation, and the discussion list returns to All recent so the starter is visible.
- Protected composer context from week updates and stale context/membership callbacks. Refreshed script/iframe/helper cache markers to `20261015-compose-1`.
- Verification: Week 1 desktop (1440px) and Week 2 mobile (390px) browser regression checks, syntax checks, exact Firebase request-path/field checks, account isolation, failure recovery, draft reload, and limits. Firebase is doubled; no live test messages, Firebase rules changes, or corpus changes.
- Affected paths: root script cache URL; production integration module/README/check script; embedded pilot and new start-conversation.js; this log and project map.

## October 15, 2026 — Route weekly Messaging to Bible Study
- Owner: Codex, at Eddie’s request that week conversations belong to Bible Studies rather than Kingdom Projects.
- Baseline: `617e4da0ff10f1a657c664b5dfb1255f11170e4a`; larger unpublished workspace work remains excluded.
- Changed the actual Week 1/2 panel’s membership checks, discussion reads, starter/reply writes and full-conversation links to the existing `study` community (Bible Study & Investigation). No automatic enrollment, data migration, Firebase rules changes, or corpus schema additions. Existing Projects posts/drafts remain separate.
- New weekly posts always include the originating week’s reading URL in the existing body field. Default This week filters explicit links within the 20 most recent study posts; All Bible Study includes other topics/unlinked posts; Related passages remains a word-match suggestion.
- Cache markers: `20261015-study-1` in root script, iframe and composer import.
- Verification: actual production module/pilot/helper in Playwright at Week 1 desktop 1440px and Week 2 mobile 390px; study-only membership/read/write and reply paths, correct full-view links, week separation, all-study browsing, pinned drafts, failure recovery and account isolation. Firebase is doubled; no live messages were sent. Signed-in production Firebase behavior remains for user verification.
- Handoff: users must join Bible Study & Investigation if prompted; Projects membership alone does not authorize study discussions. The current-week view is a recent sample, not a complete historical week index.

## October 15, 2026 — Unify existing Messaging screens
- Owner: Codex, at Eddie’s request to make pre-existing Messaging activity match the production floating companion.
- Baseline: `52ad7594ab77f2698477685515fd465bb0ac0253`. Larger unpublished workspace changes remain excluded; only the focused production source is prepared for publication.
- Affected paths: root cache URL; `commons/{messaging-shell.css,messaging-shell.js,index.html,auth/,member/,activity/,directory/,conversations/}`; weekly pilot links; production integration module, tests and notes; this work log and project map.
- Added shared navy/gold/cream styling, responsive controls, consistent live navigation and plain member-facing copy across five existing live screens. The original local preview is themed but retains its explicit sample-data identity. Legacy links no longer route members into that preview.
- Week/community context follows links from the weekly pilot. Explicit destination communities are preserved. A verified same-origin message from the active iframe can close the floating window and restore reading without reloading; drag/minimize/close/reopen remain available. No Firebase paths, rules, account IDs, schemas or stored messages are migrated.
- Verification: syntax checks and browser scenarios at desktop 1440px/mobile 390px, covering the five actual pages, posting/replies/search, enrollment, local drafts, profile update, sign-out and Google/email controls, unread deep links, week/community links, embedded return/sender validation and local-preview persistence. Existing Week 1/2 starter regressions also pass. SDK doubles are used; live signed-in Firebase delivery remains outside this environment’s reach.
- Handoff: full-page conversations retain their existing community/topic browsing; the carried week is the originating study context, not a new corpus filter. Existing production data and local draft keys remain in place.


## November 1, 2026 — Two Powers investigation page
- Owner: Partner, at Eddie’s request to build the actual Investigations page using previous pages as the pattern.
- Baseline inspected: `247c0e3c2590a68a0c7fe2731f68c9789ade6799`; current intern activity remains unknown.
- Created within authorized boundary: `investigations/two-powers/two-powers-in-heaven.html`, `manifest-entry.json`, and `README.md` under My Partner/.
- Prepared HTML page and proposed #016 manifest record. Inspected actual loader/card, manifest/schema, and Son/Father and Jewish-followers investigations. Article styles are scoped; native expandable sections require no script execution.
- Checks: balanced HTML, unique ids, heading-label targets, matching details/summary pairs, link safety attributes, scoped CSS, and manifest fields/id/file/order uniqueness. 16 existing records preserved. Browser visual/runtime verification remains pending: Chromium installation failed.
- Page commit: `a4e1eea15adaeaa4a12c165bfa079764b39934a4`; manifest proposal: `e9ea5f2207ce253e2b6969218dfd64218e65b2a2`; handoff: `d541ad71666aeb50a338bc24801347b8a0961697`.
- Status: reviewable page prepared; no live Investigations-card registration. Eddie’s explicit expansion of write scope is needed for root `investigations/two-powers-in-heaven.html` and `data/investigations/published-investigations.json`. Re-fetch manifest before integration; no loader change proposed.


## November 1, 2026 — Publish approved Two Powers investigation
- Owner: Partner; Eddie explicitly approved the preview for production and requested updating the rules to remove the repeated folder-boundary snag.
- Scope recorded repository-wide in new root AGENTS.md; updated nested AGENTS.md and workspace README. Authorization is for task-related changes, with existing preservation/privacy/verification safeguards retained.
- Published the approved page unchanged at `investigations/two-powers-in-heaven.html`; appended its unique #016 entry in `data/investigations/published-investigations.json` after re-fetching the current manifest. All 16 prior records preserved; 17 total. No additional content or loader changes.
- Page commit: `7fd038ba1534a316fb588f9802fa291521a525a2`; manifest commit: `31e686ee7945c6ce64be593b1ba7a6ca0d88c42c`.
- Updated investigation handoff and project map. Local structural checks from preparation remain applicable because HTML is unchanged. Live delivery verification is being checked separately; no claim of rendered-browser testing.

### Production delivery verification
- GitHub Pages run `41346862778` for `5d2dfb383ce7feecc3c0bd3b2c3656eb7550a184` completed successfully: build, deploy, and report steps all passed.
- Public `https://homegroups.org/investigations/two-powers-in-heaven.html` returned HTTP 200 with the expected article id; delivered SHA-256 `3d2d1467ce8ce19469a96d9544ec58f165537a9f73c760f4815a2ec969e3cb4f`.
- Public published manifest returned HTTP 200 with 17 records and the exact #016 id/file/order registration. Repository readback matched the approved HTML and intended manifest.
- This verifies deployment and public delivery. Browser-rendered interaction testing remains unperformed; Eddie reviewed and approved the page appearance before publication.


## November 4, 2026 — Commons privacy and security Phase 1
- Owner: Codex; explicitly authorized by Eddie. Baseline/main: 36e3516f4195a050e84b3d176e1e67b7220759bf.
- Review branch: codex/commons-privacy-phase1. No merge, deployment, Firebase configuration change, real message/email, or production data write.
- Prepared shared DM composer isolation for both live/legacy screens; account-scoped discovery consent and stale-callback guards; explicit email-link intent, auth-restoration and UID checks, collision handling and safe return navigation.
- Prepared firebase/commons-phase1.rules.proposed with known root permissions, Commons membership/community, DM participant protection and scoped moderation. Root rules and production Firebase config remain unchanged. The actual deployed rules release has not been exported; production parity remains a release gate.
- Added executable client, rendered DM and Firestore emulator authorization tests; updated existing browser fixtures for current SDK/navigation behavior and portable screenshot output.
- Full scope, test commands, remaining risks and manual provider/rules verification: collaboration/messaging/commons/SECURITY-PHASE-1.md and root tests/commons-security/README.md.
- Intern activity remains unknown; this branch does not overwrite another worker or publish to main.
- Final checks: 29 client tests, 2 rendered DM tests, 14 Firestore emulator authorization groups, both existing screen-suite widths and both weekly-starter scenarios passed. Syntax and whitespace checks passed. Real providers/deployed rules/physical-device behavior remain unverified.


## November 4, 2026 — Phase 1 security verification follow-up
- Owner: Codex; Eddie requested verification and necessary Phase 1 corrections on existing PR #29. Starting head: 1f1a96a7562483d06ef3748f92fac97dbbe7d1ba.
- Access: official Firebase integration is available but unconnected; no usable local CLI login/ADC found. No authenticated production rules export or non-production cloud auth project was available. Exact read-only export/IAM/evidence requirements are recorded in SECURITY-PHASE-1.md. No secrets printed or requested for publication.
- Corrected deferred auth account-generation races, delayed sign-in pre-transition protection, stale same-ID DM observers and invitation/acceptance callbacks, and legacy transcript/recipient cleanup on logout. Shared composer behavior was expanded-tested without changing its implementation in this follow-up.
- Verification: 58 client tests; 4 rendered DM scenarios; 14 loopback Firestore groups; five-screen desktop/mobile suite and Week 1/2 starter scenarios passed. Syntax/whitespace checks passed. Initial parallel browser timeouts resolved on sequential reruns; assertions retained.
- Planning only: PHASE-2-PLAN.md prioritizes abuse controls, delivery/inbox pagination, ordering, request idempotency, unread state, identity clarity, navigation/offline and mobile accessibility. No Phase 2 code.
- Readiness: code is reviewable; retain draft/hold unconditional merge pending active rules reconciliation, real-provider non-production verification and confirmation of main's publishing behavior. No merge, deployment, production configuration/data change, real message or authentication email.


### Firebase installation access recheck — November 4, 2026
- Firebase is now installed/enabled. No Firebase management tools appear in this session’s callable catalog; authenticated homegroups-app access is not established. The server configuration uses npx; local npx/firebase/gcloud and standard login/ADC files were absent. Server environment may differ, so this is not a confirmed startup root cause.
- Updated SECURITY-PHASE-1.md with the narrower remaining connection/login prerequisite and administrator export alternative. No login, credential read, Rules API call, production change, or test/code change. Previous test results remain applicable.


### Authentication completion-side audit
- Starting review head: a7a90fa. Eight newly tested stale-completion paths reproduced status/pending/navigation or stale-render failures before correction.
- Bound completion effects to the initiating generation or its sole expected SDK identity transition. Guarded email-request cleanup, sign-out feedback, email-action restoration/success/cleanup, and stale auth observer renders. Preserved normal linking/sign-in cleanup with explicit controls.
- Expanded client suite: 70 passed, 0 failed/skipped. Changed auth module parsed successfully; desktop/mobile screen compatibility rerun recorded in SECURITY-PHASE-1.md. DM/rules/config and Phase 2 code unchanged. No real emails, messages, production data/settings, merge or deployment.

## November 4, 2026 — Fellowship Integration, Phase 1

- Owner: Codex, authorized by Eddie; other workers' uncommitted activity remains unknown.
- Base: main `36e3516f4195a050e84b3d176e1e67b7220759bf`; separate feature branch `codex/fellowship-phase1`. No security-branch merge.
- Scope: native Fellowship card and route alias, reused Prayer Map and Commons directory/discussions/DM/account screens, explicit component listener cleanup, global theme bridge, membership filter, map callback/consent protections, integration browser tests.
- Evidence and limitations: [integration report](collaboration/messaging/commons/FELLOWSHIP-INTEGRATION.md) and [test results](../tests/fellowship/README.md). Four public production assets matched the main baseline by read-only HTTP comparison. Firebase operations in tests are in-memory doubles. No production messages, emails, memberships, prayer changes, Firebase rules/configuration changes, merges or deployments.
- Handoff: draft for architecture/security review. PR #29, authoritative live rules verification, historical location consent review, non-production provider checks and full-app/device checks remain release gates.

## November 4, 2026 — Fellowship Phase 2 integration and verification

- Owner: Codex, authorized by Eddie; other contributors' uncommitted work remains unknown. Base main `36e3516`; new branch `codex/fellowship-security-integration`. Source heads #29 `52e4ab2`, #30 `3ebd304` remain unchanged open drafts.
- Resolved five textual conflicts deliberately: preserve #29 security logic and #30 subscription adapters, retain both coordination histories. Added lifecycle invalidation for pending auth/profile/DM work; routed profile/map sign-in through hardened Account.
- Verification: original 70 + 5 new client cases, 4 DM browser cases, 14 emulator groups, original 12 + 6 integrated Fellowship browser cases, existing five-screen desktop/mobile and Week 1/2 starter checks pass. Synthetic/mock operations only.
- Privacy: aggregate historical GeoJSON review found 2,000 coordinate pairs in each copy, 1,998 above two decimals; no repository consent fields. No individual records copied, migrated or deleted. Display rounding is not data minimization.
- [Conflict, evidence and readiness report](collaboration/messaging/commons/FELLOWSHIP-SECURITY-INTEGRATION.md). Unresolved release gates include active rules, real non-production providers, historical consent, device/accessibility checks and administrator confirmation of main's publishing triggers. No merge/deployment, production Firebase configuration/rules/user-data change, actual message/email/membership/prayer write.

## Fellowship isolated preview — November 4, 2026

- Owner: Codex, authorized by Eddie. Starting PR #31 head `48da719`; existing integration review branch retained. Other contributors' uncommitted activity remains unknown.
- Prepared loopback-only synthetic preview under `tools/fellowship-preview/`, using actual card/screens with no production SDK/configuration or historical downloads served. No hosting/deployment or external resources created.
- Visual review found embedded DM light-theme gradient/redundant branding/mobile spacing issues; corrected only Fellowship's embedded CSS, preserving auth/DM logic. Preview tests cover isolation and synthetic interactions; desktop/mobile dark/light screenshots captured.
- [Readiness and limits](../tools/fellowship-preview/PREVIEW-READINESS.md); [approval-gated location correction proposal](../tools/fellowship-preview/PRIVACY-PROPOSAL.md). Original GeoJSON/data/rules/configuration remain unchanged. No real messages, emails, memberships or prayer writes.

## Controlled production-testing candidate — November 4, 2026

- Owner: Codex, authorized by Eddie to implement/verify only; final configuration approval is required before merge/deployment. Base PR #31 `fb357af`; separate branch `codex/fellowship-controlled-testing`. PR #31 remains unchanged. Other contributors' uncommitted work remains unknown.
- Added off-by-default bounded owner-claim UI gate, actual production/compatibility entries, fixture-only native Fellowship rendering, disabled mutation/auth/location actions, late-callback/badge isolation, ordinary Prayer Map/menu compatibility and cache-safe offline denial. Touch themes and mobile week-dock/reading context are preserved.
- Owner confirmed Pages source `main / (root)`: a main merge is a publication trigger. No merge, deployment, Firebase rule/config/claim/data change, real message/email/membership/prayer operation occurred. Static assets remain public; this is explicitly not server-authenticated HTTP delivery.
- [Exact public exposure, test evidence, release checklist and rollback](../CONTROLLED-FELLOWSHIP-RELEASE.md). Physical iPhone testing, actual owner claim and live release gates remain unverified.

Controlled candidate final verification: 43/43 combined checks; follow-up 3/3 visible-week desktop/mobile checks passed. Earlier security/emulator/browser suites remain passing. Flag stays disabled; no merge/deploy or production writes. See CONTROLLED-FELLOWSHIP-RELEASE.md.

## November 4, 2026 — Fellowship live-services integration

- Owner: Codex, requested by Eddie. Separate codex/fellowship-live-integration worktree from current main 487a460; existing controlled route/activation preserved. Other contributors’ uncommitted activity remains unknown.
- Reuse: existing Commons directory/membership, discussions/replies, direct-live/shared composer, auth/profile and Prayer Map. No new Firebase model or privileged access. Added an independent disabled two-standard-test-account pilot entry, read-only map mode, exact route/week preservation, in-flow week dock and pending membership/disposal protections.
- Eddie confirmed physical iPhone testing of the earlier controlled interface and approved preparation of a conditional two-account production verification plan. Exact accounts/community, deployed rules export, cleanup/retention and execution/release approval remain pending. No live operation, rule/config/claim/data change, email, merge or deployment occurred.
- Firebase plugin is installed but no management tools or standard CLI/ADC login are available. Stopped production verification before any live reads/writes. [Implementation and exact prerequisites](../FELLOWSHIP-LIVE-INTEGRATION.md). Final automated evidence recorded there before draft handoff.

- Final evidence: all 62 Fellowship cases verified (one accurate permission-copy correction/targeted rerun); 75 client and 14 emulator groups passed; 4 DM rendered cases verified with one timeout-only rerun; both existing five-screen widths and Week 1/2 starter suites passed. Thirteen script/module sources parsed and whitespace/protected-file checks passed. Windows interruption was recovered; no production operations were executed.

## November 5, 2026 — Single-account pilot and week overlap
- Codex: scoped request on codex/fellowship-single-account from main 344e879. Allowlisted one supplied UID (including administrator), kept activation false and existing Firebase authorization unchanged. Reserved week-dock space for live loading/denied screens. Focused gate/mobile checks only; no broad suites, production operations, merge or deployment. Other contributors’ activity remains unknown.

## November 5, 2026 — Fellowship live map-first UI
- Codex: requested presentation/navigation only, branch codex/fellowship-map-first from main 502fbfb. Reuses existing navigation/map nodes; one collapsed Menu, hidden/restored live-only week dock and larger map before introductory text. No service/data/pilot configuration changes, production operations, merge or deployment. Other contributors’ activity remains unknown. See FELLOWSHIP-LIVE-UI.md for verification and limits.
- Verified 9 targeted cases (3 presentation, 4 read-only/ordinary-map compatibility, 2 existing live flows), two module parses and whitespace/protected-source comparisons. No broad suite rerun; Firebase/Leaflet were doubled. Manual physical-device/real-tile/provider checks remain.

## November 6–7, 2026 — Fellowship Unification Phase 1
- Owner: Codex, approved implementation from main 786550e on dedicated codex/fellowship-unification-phase1 worktree. Other contributors’ uncommitted work remains unknown and preserved.
- Scope: B1/B2 route repairs; existing ScriptureAPI/discussion/map/DM context connections; validated explicit John 1:5 link; UID/epoch-scoped private mementos and disposal guards. Existing shell, Firebase services, Menu and themes retained. No new schema/dependencies/rules/pilot/source-data changes.
- User clarification: no verified real test discussion/account was supplied or established by repository fixtures. Use synthetic study/older-post, alice and bob1234567890123; final real discussion authorization remains separate. No production lookup, write, email, merge or deployment.
- Evidence and handoff: [Phase 1 implementation/readiness](../FELLOWSHIP-UNIFICATION-PHASE1.md), [approved historical architecture baseline](collaboration/messaging/commons/FELLOWSHIP-CONTEXT-ACCEPTANCE.md). Final journey/context run: 21/21; existing regressions: 145/145 verified with four launch-only DM retries using installed Edge; local emulator proposal: 14/14. Existing five-screen checks at both widths and Week 1/2 checks pass. Desktop/mobile reader screenshots inspected. Production/manual criteria remain unverified. Stop at Eddie’s explicit production release approval checkpoint; Pages main/root publishes on merge.

## November 7, 2026 — PR #36 final hardening and release proofing
- Owner: Codex; approved candidate 5bd4ae23, main 786550e (no intervening main commits). Preserve other worktrees/commits; no production release authorization. Review actual approved diff and scoped corrections for reader control ownership, interrupted/API error/storage handling, focus/status and cross-community post context.
- Added 11 hardening browser cases and one anonymous-state context case; full final-commit verification/lock is recorded on PR #36. [Release proofing, exact administrator/test/device procedures and rollback](../FELLOWSHIP-PHASE1-RELEASE-LOCK.md).
- No available Firebase management tools, CLI login/ADC or designated non-production project. Active rules/provider/real-account/device gates remain unverified. Historical static copies measured at 2,000 records each, 1,998 with >2 coordinate decimal digits and no embedded consent evidence; no datasets/records modified. Pilot enabled flag remains inherited but its window is expired. No merge, deploy, rule/configuration/data change or production operation. Other contributors’ uncommitted work remains unknown.

## November 7, 2026 — Fellowship unified home feed
- Owner: Codex, requested by Eddie; separate `codex/fellowship-unified-feed` branch from main `4ab3824`. Other contributors' uncommitted work remains unknown and preserved.
- Scope: live-only default feed over existing joined-community posts; existing discussion/reply/composer entry points; content-free UID/epoch-scoped return position; compact existing Menu and global tokens. Ordinary Prayer Map and synthetic test entry behavior retained. No new data model or dependencies.
- Verification and screenshot evidence: [home-feed report](../FELLOWSHIP-HOME-FEED.md). Synthetic browser operations only. Production release identity/provider/device checks remain separate. No production records, Firebase rules, pilot configuration, merge or deployment changes.
- Final evidence: 72/72 selected checks, final 17/17 feed confirmation, and 4/4 isolated-read-only/ordinary-map checks (78 distinct checks; 15 repeated). Three affected module parses and protected-file/whitespace comparisons passed. Four desktop/mobile light/dark synthetic screenshots inspected. The feature remains subject to the existing live gate and explicit release approval.

## November 7, 2026 — Fellowship feed creative styling
- Owner: Codex, requested by Eddie, new `codex/fellowship-feed-styling` branch from main `ffe914c`. Other contributors' uncommitted activity remains unknown and preserved.
- Scope: feed-only contrast, warm paper/slate surfaces, author initials/bylines, serif post titles, readable body text and existing action styling. No new actions, queries, profile/image fetches, dependencies or data fields. Discussion screens, global theme definitions, navigation and Firebase behavior remain unchanged.
- [Design interpretation, screenshots and verification](../FELLOWSHIP-FEED-STYLING.md). Synthetic browser checks only; no production operations, pilot/rules/authentication changes, merge or deployment.
- Final evidence: 20/20 focused cases and 3/3 final styling/screenshot confirmation passed. Sampled contrast minimum 6.56:1 dark / 5.00:1 light; hover remains readable. Four desktop/mobile light/dark screenshots inspected. Syntax, whitespace and protected-file comparisons passed. Physical iPhone/Safari and assistive-technology review remain unverified.

## November 8, 2026 — Weekly study handoff to Fellowship
- Codex prepared a focused review branch from main 39d27e5. The weekly companion opens the selected Commons discussion in Fellowship using the same post ID and the current study week.
- URL checks and two synthetic browser routing regressions passed. The live two-member acceptance test remains pending.

## November 8, 2026 — Main Stage discussion entry
- The Main Stage exposes Discuss This Week beneath its Scripture action. It reuses the existing Bible Study & Investigation companion for the three supported studies and explains when no linked discussion is available.
- Stable study links reuse the canonical app route and existing post-body link format. The community board and companion open the same stored discussions. Existing week-number links are recognized for the original pilot studies. No new collections or production operations.

## November 10, 2026 — Fellowship workspace pilot
- Main Stage opens an Excursion over the study through a separate pilot button. The existing Fellowship workspace, joined-community feed, conversations, Firebase account and rollout checks are reused. The pilot feed expands posts in place and opens their existing discussion.
- The checked-in live pilot window had expired at development time. Browser checks use synthetic data. Live verification requires an authorized build and a current owner-approved window.
