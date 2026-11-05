# Fellowship browser regression tests

Install Node.js and the pinned dev dependency from this directory with `npm install`. Run `npm test`. Tests launch installed Microsoft Edge at its usual Windows path. Set `BROWSER_PATH` to a Chromium executable on other systems; no browser download is required if one is installed. Optionally set `ARTIFACT_DIR` to save desktop/mobile parchment previews outside the repository.

Tests use actual repository scripts/screens with mocked Firebase, Leaflet and time loading. Every unrecognized external network request is blocked and fails the test. Test membership writes stay in memory. No real messages, emails, memberships or prayer requests are sent.

November 4, 2026 final run: **12 passed, 0 failed**, 91.7 seconds, headless installed Microsoft Edge at 1440×1000 and 390×844. JavaScript syntax checks passed for six affected JS modules and nine inline scripts; Git whitespace checks passed. Desktop/mobile parchment previews were visually inspected; Sapphire and diagnostic inheritance were also checked automatically. The runtime used existing locally installed Playwright 1.56.1 via NODE_PATH; a fresh dependency install was not tested. The tests do not verify live rules, actual authentication providers, Firestore offline delivery, full production boot or physical mobile browsers. See the [integration report](../../My%20Partner/collaboration/messaging/commons/FELLOWSHIP-INTEGRATION.md).

## Integrated security candidate

The combined implementation passes all original 12 scenarios plus six integrated authentication/disposal cases (18 total, 159.0 seconds). SDK doubles now model auth restoration and before-auth transitions. New cases verify the hardened Account flow inside Fellowship, UID-preserving linking and collision handling, disposed popups, stale parent callbacks, profile-to-Account navigation and prohibition of independent Prayer Map sign-in. Actual providers and production authorization remain unverified. See [integration readiness](../../My%20Partner/collaboration/messaging/commons/FELLOWSHIP-SECURITY-INTEGRATION.md).
