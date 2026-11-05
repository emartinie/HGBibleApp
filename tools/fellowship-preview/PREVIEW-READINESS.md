# Fellowship preview readiness

Starting candidate: draft [PR #31](https://github.com/emartinie/HGBibleApp/pull/31), `codex/fellowship-security-integration`, commit `48da7191af866e02f9c1ca004eb03577941307be`.

**Safest available method: the isolated local preview described in [README.md](README.md).** No merge, deployment, external hosting resource, Firebase configuration/rules change or production data operation is needed or performed. No real message, authentication email, membership or prayer request is sent.

## Hosting determination

The existing `firebase.json` configures Firestore only; it establishes no isolated Hosting preview target. PR #31 records a successful GitHub Pages deployment for current main and unavailable authoritative Pages settings access. No existing branch-preview environment or separate non-production Firebase project has been verified. A static branch URL would still initialize the production Firebase client unless deliberately isolated; a deployment or new hosting/channel resource is outside the current authorization. Therefore no live hosted preview is created or represented as safe.

The provided Node server listens only on 127.0.0.1, serves an explicit allowlist, rewrites SDK imports to a synthetic local service, substitutes entirely fictional map records, denies arbitrary files/HTTP writes, enforces Host validation and supplies a same-origin CSP plus device/worker restrictions. It is not a general repository static server or a production proxy. Source Firebase settings/SDK initialization and historical files are never served by this adapter. No new dependency is needed merely to run it.

## Available for visual and functional review

- Actual #31 Fellowship card loader/controller, four views, legacy Prayer Map alias, study-week routes, account/profile/directory entry points and existing Commons screens.
- Dark, Light, Sapphire and Diagnostic controls; desktop and narrow touch viewport review. Exported screenshots cover all four views at 1440×1000 and 390×1000, dark/light (16 images).
- Synthetic community enrollment, discussion/reply viewing and message composer/request behavior. Service mutations remain in browser memory; some existing pages retain demo draft/display preferences in this localhost origin's browser storage.
- The existing authentication/identity/generation/disposal guards remain in the path. Their source is unchanged; the mock service is not an authoritative rules engine.

## Mocked / unavailable / unverified

| Area | Preview behavior / limitation |
| --- | --- |
| Accounts | Demo Alice, Demo Bob and signed-out states; Google controls simulate a local identity. No real account authentication, Google popup, UID/provider persistence or credentials are tested. |
| Email/linking/redirect | No email is sent; real email action links, expiration/cross-device behavior and credential/redirect operations are unavailable. Errors explicitly identify the local demo. |
| Firestore and delivery | Synthetic in-memory documents/listeners and limited access checks, not live Firestore or a complete emulator of rules. No cross-device delivery, cloud persistence, offline queue or exactly-once guarantee. |
| Prayer Map | Clickable fictional coordinate schematic and existing prayer form/search/layer controls. No real basemap, geographic pan/zoom fidelity, tile requests or device geolocation. No historical record is displayed. |
| Study | Focused host with a clearly labeled study placeholder; routing/week/return context can be inspected. Full Bible/audio/time boot and production service-worker/cache behavior are outside it. The focused host uses index theme/card CSS with a small local utility-style fallback; it does not reproduce every production stylesheet/script. |
| Devices/accessibility | Desktop Chromium and mobile viewport/touch emulation. Physical iOS/Android, assistive technology and complete accessibility approval remain open. |

No production authentication is required to use this preview. A real end-to-end candidate still depends on a separately designated non-production Firebase project and separately authorized provider operations. Mock success is not production authorization evidence.

## Necessary changes

New files under `tools/fellowship-preview/` are local-only server, fixtures, schematic, controls, tests and review documents. Actual application JavaScript, authentication/composer logic, rules/configuration and both original GeoJSON files remain unchanged from #31.

Visual review found two embedded Messages presentation defects: its standalone dark gradient remained under the light theme, and its extra branding/minimum height crowded the mobile view. A small `css/fellowship-embedded.css` correction hides the redundant embedded heading, inherits global surfaces/text and reduces mobile chat minimum spacing. It is loaded only for Fellowship's embedded screens; standalone messaging styling and security logic are preserved. The preview smoke test checks the corrected heading/gradient behavior.

## Verification

- Preview HTTP and browser tests: 2 passed, including both viewport widths, all four views/two themes, synthetic enrollment/discussions/replies/messages/account cleanup and zero external requests.
- Security client suite: 75 passed; no assertion removed.
- Firestore proposal emulator: 14 groups passed against the unchanged checksum-pinned loopback setup; not live rules evidence.
- Fellowship browser suite: all 18 passed. Both DM interfaces: all four desktop/mobile cases passed. Existing five-screen messaging suite passed at both widths; Week 1 desktop and Week 2 mobile starter scenarios passed.
- Syntax checks passed for all five preview scripts; protected source comparisons show production Firebase inputs and both historical GeoJSON files unchanged after Git line-ending normalization. Whitespace checks are completed before the review-branch update.

The final preview rerun passed both tests (29.8 seconds) and regenerated all 16 screenshots. An earlier run timed out waiting for mobile carousel positioning; the unchanged assertion passed on rerun. Keep carousel animation/focus positioning on the manual device review list rather than treating screenshots as timing certification.

Initial preview-fixture issues were corrected without weakening product safeguards: the hostile Host test now uses Node's HTTP client because Fetch normalizes Host; joined-only checks select a visible enrollment; mobile recipient navigation checks its already-open conversation instead of clicking a hidden sidebar; test-server shutdown closes connections. These are test/adapter issues, distinct from the two scoped product-style corrections above.

## Historical location correction

The exposure remains in the original application/data: displayed rounding does not remove raw coordinates transmitted through static downloads or publicly readable records. See [PRIVACY-PROPOSAL.md](PRIVACY-PROPOSAL.md) for an approval-gated plan covering verified consent, minimal public fields, every coordinate representation, both existing URLs, restricted originals, trusted validation, withdrawal, public Git history and caches. This task does not transform, publish, migrate, delete or change access to real datasets.

## Recommendation

Use the local preview and screenshots for design/navigation feedback now. Keep PR #31 draft. Resolve the original live-rules, real-auth, historical consent, physical-device/accessibility and publishing gates before considering a separately authorized release. A hosted preview would require explicit hosting/deployment approval plus verified data/auth isolation; no such approval is requested merely to run this local preview.
