# Isolated Fellowship visual preview

This is a **local synthetic preview of PR #31**, not a deployment or a Firebase environment. It requires Node.js 18+ and no packages to run. The real Fellowship loader/controller, Prayer Map logic and Commons screens are served through a narrow loopback adapter. Production application files are unchanged.

From the repository root on `codex/fellowship-security-integration`:

~~~sh
node tools/fellowship-preview/server.cjs
~~~

Open [the local preview](http://127.0.0.1:4318/?card=fellowship&view=prayer&week=12). Stop with **Ctrl+C** in that terminal. Set `HG_PREVIEW_PORT` to another unused port if 4318 is occupied. The server refuses to replace an existing service and binds only to 127.0.0.1. Do not use a generic static server for this preview: that would serve the real Firebase initialization and original datasets.

Use the banner controls to select Dark, Light, Sapphire or Diagnostic, switch Demo Alice / Demo Bob / Signed out, select a study week, and reset synthetic service data. No production sign-in is needed. Browser developer tools → device toolbar → 390×844 or 390×1000 allows narrow-screen review; real phone access is deliberately not enabled. Screenshots can be opened on another device without exposing the server on the network.

## Review walkthrough

1. Prayer Map: click fictional pins, search the demo prayer, toggle layers. The diagram is labeled as a schematic; it has no geographic basemap, tile network, pan/zoom fidelity or device location. Add Prayer uses the actual consent form but saves only to the synthetic service. Locate me reports that device location is unavailable.
2. My Communities: Demo Alice begins in Study and Prayer. Open a community, its discussion and replies using existing screens.
3. Explore: all six non-geographical communities are available. Joining/leaving affects demo memory only; return to My Communities to inspect the result.
4. Messages: open the accepted Demo Bob conversation, type a synthetic message, or inspect Demo Carol's pending invitation and acceptance controls. No real message/request is delivered.
5. Account/Profile: the actual #31 screens remain in use. Google sign-in/link controls are simulated; email delivery, real credentials, email action links and redirect authentication are unavailable. Use only fictional text. Switch demo accounts to inspect cleanup and signed-out states.
6. Return to study shows a clearly labeled placeholder; the week remains in the route. Full Bible/time/audio boot, production caching, service workers and offline delivery are outside this preview.

The synthetic service is not an emulator of all Firestore rules. Local success is not proof of production permissions. Service data resets on page reload/reset; existing screens may store **demo** drafts/display-name preferences in this localhost origin's browser storage. They cannot read homegroups.org storage. No production credentials are read. A separate designated non-production Firebase project is still required for real-provider/end-to-end validation.

## Isolation controls

- Explicit file allowlist; real Firebase initialization/configuration, rules, arbitrary repository files and historical GeoJSON are not served.
- Firebase SDK imports are rewritten in local HTTP responses to `fixture-sdk.js`; no real SDK is downloaded.
- Both historical map URLs return a single entirely fictional fixture created for this preview. It is not a transformation or copy of a real record.
- CSP limits scripts, connections, frames and images to this local origin; workers and device geolocation/camera/microphone are disabled. Existing inline application scripts/styles require the preview's inline CSP allowances.
- Loopback binding, Host validation, GET/HEAD-only HTTP and no server mutation endpoint. No external hosting resource, tunnel, deployment or production configuration is involved.

These controls apply to the provided local host. Do not publish these files as a substitute for security review or expose this server through a tunnel/LAN binding. The preview does not prevent a person from manually navigating their browser elsewhere.

## Automated verification / screenshots

With the existing `tests/commons-security` pinned dependencies installed (or Playwright otherwise available):

~~~sh
node --test --test-timeout=180000 tools/fellowship-preview/preview.test.cjs
~~~

Windows uses installed Edge by default; set `BROWSER_PATH` for another Chromium executable. Other systems may use Playwright's installed Chromium. Set `HG_PREVIEW_OUTPUT_DIR` to export 16 screenshots (four views × desktop/mobile × dark/light). Tests verify file/Host/write restrictions, synthetic replacements, external-request absence, view/theme rendering, demo enrollment/discussions/replies/messages and account cleanup. They make no real Firebase calls. Fresh dependency installation was not tested in this session.

Read the [preview-readiness report](PREVIEW-READINESS.md) and [location correction proposal](PRIVACY-PROPOSAL.md). All production release gates from [PR #31's integration report](../../My%20Partner/collaboration/messaging/commons/FELLOWSHIP-SECURITY-INTEGRATION.md) remain in force.
