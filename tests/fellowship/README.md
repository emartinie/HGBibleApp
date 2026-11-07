# Fellowship browser regression tests

Install Node.js and the pinned dev dependency from this directory with `npm install`. Run `npm test`. Tests launch installed Microsoft Edge at its usual Windows path. Set `BROWSER_PATH` to a Chromium executable on other systems; no browser download is required if one is installed. Optionally set `ARTIFACT_DIR` to save desktop/mobile parchment previews outside the repository.

Tests use actual repository scripts/screens with mocked Firebase, Leaflet and time loading. Every unrecognized external network request is blocked and fails the test. Test membership writes stay in memory. No real messages, emails, memberships or prayer requests are sent.

November 4, 2026 final run: **12 passed, 0 failed**, 91.7 seconds, headless installed Microsoft Edge at 1440×1000 and 390×844. JavaScript syntax checks passed for six affected JS modules and nine inline scripts; Git whitespace checks passed. Desktop/mobile parchment previews were visually inspected; Sapphire and diagnostic inheritance were also checked automatically. The runtime used existing locally installed Playwright 1.56.1 via NODE_PATH; a fresh dependency install was not tested. The tests do not verify live rules, actual authentication providers, Firestore offline delivery, full production boot or physical mobile browsers. See the [integration report](../../My%20Partner/collaboration/messaging/commons/FELLOWSHIP-INTEGRATION.md).

## Integrated security candidate

The combined implementation passes all original 12 scenarios plus six integrated authentication/disposal cases (18 total, 159.0 seconds). SDK doubles now model auth restoration and before-auth transitions. New cases verify the hardened Account flow inside Fellowship, UID-preserving linking and collision handling, disposed popups, stale parent callbacks, profile-to-Account navigation and prohibition of independent Prayer Map sign-in. Actual providers and production authorization remain unverified. See [integration readiness](../../My%20Partner/collaboration/messaging/commons/FELLOWSHIP-SECURITY-INTEGRATION.md).

## Controlled production-entry candidate

Run `npm test` here for both the preserved 18-case PR #31 component suite and the new controlled-policy suite, sequentially. `npm run test:controlled` runs only the release checks. The component harness explicitly imports `component-entry.js` with SDK doubles; production HTML and legacy app entry both use `homegroups-entry.js` and cannot select that test harness through a URL flag. Production policy coverage is separate, uses actual index markup and mocks unrelated shell boot/services. See [release configuration and rollback](../../CONTROLLED-FELLOWSHIP-RELEASE.md).

## Live-services integration candidate

Run `node --test --test-concurrency=1 --test-timeout=60000 tests/fellowship/live.test.cjs` from the repository root with the same NODE_PATH/browser prerequisites. The default suite includes preserved integration, controlled and live cases. `harness.cjs` shares the original SDK-double harness, with production-entry mode loading actual index/policy/loader and targeting the exact Fellowship iframe. Other study/audio boot is omitted; external styles/images and Firebase are fixtures.

Live cases cover separate off-by-default test-account gating, real existing directory/membership/discussion/DM/account adapters, exact recipient and week routing, mobile dock geometry, themes, read-only map, duplicate joins, late work/disposal, account switching and stable-token refresh/drafts. No actual Firebase operation occurs. The existing read-only activation inherited from main is validated as bounded fixture mode rather than incorrectly requiring that already-approved activation to be false. [Prerequisites and production test plan](../../FELLOWSHIP-LIVE-INTEGRATION.md).

## Map-first live presentation

Run `node --test --test-concurrency=1 --test-timeout=90000 tests/fellowship/presentation.test.cjs` from the root with existing NODE_PATH/browser setup, or `npm run test:presentation` here. Three focused cases cover map-first desktop/mobile navigation, all existing destinations/discussions/recipient links, collapsed/keyboard menu behavior, theme/layout, zero SDK writes, denied-state week hiding, and restoration on study/ordinary Prayer Map. Firebase and Leaflet are doubled; screenshots have a blank mock map region. Pilot configuration and production behavior are not verified by these fixtures. See [UI report](../../FELLOWSHIP-LIVE-UI.md).

November 5 map-first verification: 3 presentation cases, 4 selected controlled/legacy cases and 2 existing live desktop/mobile flow cases passed (9 targeted checks). Both changed modules parsed; whitespace/protected-file checks passed. Screenshots inspected in desktop/mobile light/dark fixtures; real tiles, providers and physical Safari remain manual checks.

## Unification Phase 1

Run `npm test` for the existing suites plus `context.test.cjs` and `unification.test.cjs`. Focused run from the root: `node --test --test-concurrency=1 --test-timeout=120000 tests/fellowship/context.test.cjs tests/fellowship/unification.test.cjs`. Use the installed browser prerequisites above; `ARTIFACT_DIR` optionally saves desktop/mobile reader and mock-map screenshots outside the repository. No dependency was added.

The local association is study/older-post → John 1:5 / NASB, with synthetic Alice and Test B. An authorized fixture discussion seeds the per-account/per-visit association; no production record or general Scripture index is created. Tests cover older targets, denied/deleted targets, reader ref/version/visible-anchor return, map state, discussion/invitation/accepted-DM round trips, account A-B-A, private-state exclusion, stale asynchronous reply/profile callbacks and repeated teardown. The harness marks reader readiness after layout/restoration rather than assuming inserted HTML has finished restoring.

The checked-in live flag test now validates the inherited bounded pilot shape instead of incorrectly requiring an earlier disabled/single-UID configuration. The configuration file itself is unchanged. The live-disposal baseline includes one deliberate singleton account-context observer in addition to the root launcher, with no retained child subscriptions. See [implementation, evidence and release gates](../../FELLOWSHIP-UNIFICATION-PHASE1.md).

November 7 final evidence: 21 new unit/journey cases passed; two focused canonical-share follow-ups passed. Across client/DM/Fellowship plus unchanged rules emulator: 180 unique test cases/groups verified, with the initial four launch-only DM failures corrected by CHROMIUM_PATH. Existing legacy five-screen checks at both widths and weekly study checks also passed. Physical iPhone/real-provider/deployed-authorization certification remains outstanding.
