# Commons security regression tests

All dependencies are test-only and pinned in package.json / pnpm-lock.yaml. The production Firebase SDK and configuration are unchanged. Run with Node 24 and pnpm 11.25.0.

From this directory:

~~~sh
pnpm install --frozen-lockfile
pnpm test
~~~

## Rendered DM privacy tests

~~~sh
pnpm exec playwright install chromium
pnpm run test:browser
~~~

Alternatively set CHROMIUM_PATH to an existing Chrome or Edge executable. Tests intercept all browser requests; unrecognized external requests are aborted. They use synthetic identities and SDK doubles, never a real Firebase project.

## Firestore authorization tests

Use Java 21 and download [Firestore emulator 1.19.8](https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.19.8.jar) to a local work/cache directory. This official Firebase binary's SHA-256 must be:

~~~text
9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d
~~~

The version and checksum come from Firebase CLI v14.22.0's downloadableEmulatorInfo.json. The runner verifies the SHA-256 before launching. It does not download binaries or deploy anything.

PowerShell:

~~~powershell
$env:FIRESTORE_EMULATOR_JAR = 'C:\path\to\cloud-firestore-emulator-v1.19.8.jar'
$env:JAVA_BIN = 'C:\path\to\java.exe' # optional if java is on PATH
pnpm run test:rules
~~~

POSIX shell:

~~~sh
FIRESTORE_EMULATOR_JAR=/path/cloud-firestore-emulator-v1.19.8.jar pnpm run test:rules
~~~

The runner uses only demo-homegroups-commons-phase1 and 127.0.0.1:8088, refuses to reuse an occupied port, loads ../../firebase/commons-phase1.rules.proposed, runs tests, and stops its emulator. The test file independently rejects any other emulator endpoint before creating an SDK context or clearing records. There is no production fallback and no production credentials are required. PERMISSION_DENIED output is expected for negative authorization tests.

firebase.emulator.json documents the equivalent emulator-only configuration; the runner starts the pinned JAR directly to avoid requiring the full Firebase CLI. Do not run a deployment command using either this configuration or the review proposal.

## Existing application regression suites

From the repository root, PowerShell (use your installed browser):

~~~powershell
$env:NODE_PATH = (Resolve-Path 'tests/commons-security/node_modules').Path
$env:CHROMIUM_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:HG_TEST_OUTPUT_DIR = (Resolve-Path 'tests/commons-security').Path + '\test-results'
node 'My Partner/collaboration/messaging/commons/production-integration/check-messaging-screens.cjs'
node 'My Partner/collaboration/messaging/commons/production-integration/check-start-conversation.cjs'
~~~

For a sparse checkout missing study files, set HG_TEST_BASE to a checked-out commit such as 36e3516; fixtures then read those unchanged files through git show. The app's legacy sample-data check.cjs can also be run with NODE_PATH set.

These existing suites cover desktop/mobile community discussions, posting/replies/search, membership enrollment, profile saves, Google/email controls, navigation, and weekly starter/draft recovery. Their Firebase SDK doubles have been updated for current auth restoration, report exports, and badge subscriptions; current menu/minimize behavior is tested. No live messages or emails are sent.

See ../../My%20Partner/collaboration/messaging/commons/SECURITY-PHASE-1.md for review scope, rules provenance, production verification gates, and deferred concerns. Test results are not proof of production rules or real email-provider behavior.

## Security verification follow-up

The expanded suite covers 70 client cases, 4 rendered DM scenarios (both pages at desktop/mobile widths), and 14 Firestore authorization groups. Auth doubles model pre-transition hooks; this verifies the page control flow, not a real Google/email provider. Rendered checks allow 60 seconds per scenario for browser startup. Run the browser suites sequentially on resource-constrained machines. See SECURITY-PHASE-1.md for blocked production access, exact administrator actions, and the distinction between code review and deployment readiness.
