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
