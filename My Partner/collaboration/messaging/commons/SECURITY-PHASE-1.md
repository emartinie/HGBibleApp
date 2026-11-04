# Phase 1: Commons Messaging Privacy and Security Hardening

Prepared November 4, 2026. Baseline: 36e3516f4195a050e84b3d176e1e67b7220759bf.
Status: review branch only. No production deployment, Firebase configuration change, production data access/write, real message, or authentication email was performed.

## Rules authority and deployment path

| Evidence | Meaning |
| --- | --- |
| Root firebase.json selects database (default) and firestore.rules | This is the repository CLI deployment input, not proof of the active Firebase release. |
| js/firebase-init.js selects homegroups-app | This is the existing production client project. It is unchanged. |
| moderation/DEPLOYMENT-CHECKLIST.md records Console-managed Commons rules on October 15 | Historical evidence of manual rules management and repository drift; not a current export. |
| No .firebaserc or checked-in deployment workflow was found at the baseline | The repository does not establish a complete automated production rules pipeline. |
| Firebase Rules service release for the actual database | This deployed release, and its referenced ruleset, is the authority for enforcement. It was not authenticated/read in this task. |

The authoritative operational path is the deployed Firestore rules release for homegroups-app's default database, managed through Firebase Console / the Rules API. The local CLI path remains firebase.json -> firestore.rules and is known to be incomplete for Commons. Do not deploy that root file or treat the publicly served copy as a live-rules export.

Before deployment can be considered, an authorized administrator must export the exact active Console rules (or obtain the release and its referenced ruleset through the read-only Rules API). Record project/database, release name, ruleset ID, retrieval time, and SHA-256 of the source in a private review record. Compare that export with this proposal, preserve all additional live permissions, and rerun authorization tests. No authenticated Firebase management connection was available here; production parity remains unverified.

Official references: [rules deployment](https://firebase.google.com/docs/rules/manage-deploy), [read release metadata](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/get), [rules unit tests](https://firebase.google.com/docs/rules/unit-tests).

## Consolidated proposal

Review artifact: [consolidated proposal](../../../../firebase/commons-phase1.rules.proposed).

The proposal starts with every existing root rule unchanged, before the default deny. It then consolidates the Commons-specific portions of firestore.rules.proposed, direct/firestore.rules.snippet, and moderation snippets. It includes private profiles, public opt-in display-only directory, private enrollment, community posts/replies, account-scoped discussion read markers, DM requests/messages, owner appointments, study-only moderator report reads, and immutable owner decisions. The catch-all remains deny.

DM protections are preserved: only participants may read conversation metadata; only the recipient can accept/decline a pending request; participants/requester/creation time cannot change; messages require accepted status and participant membership; sender UID must match the caller; body limits and server timestamps are enforced; messages are immutable. Owner and moderator roles have no client DM read bypass.

The original root Prayer Map rules are deliberately preserved, including Google-only creation and denied prayer updates. The older proposed file differs on these points. If production permits prayer acknowledgment or other providers, those live permissions MUST be reconciled before deployment; this proposal cannot claim to preserve an unseen live ruleset. The baseline-preservation regression prevents accidental changes to known root permissions.

No production deployment target was redirected to the proposal. firebase.json, root firestore.rules, and js/firebase-init.js are unchanged. The emulator configuration is separate and uses only a fixed demo project.

## Client fixes

- Both direct-live/ and legacy direct/ use direct-composer.js. Drafts exist only in memory, are scoped by conversation within the current account, and are purged on account change. They are not written to browser storage or Firestore. Reloading loses unsent DM drafts by design. Pending requests cannot submit, duplicate submissions are blocked, and delayed success/failure callbacks cannot affect a different account or thread. Edited draft versions are retained while a previous send completes.
- member/ immediately clears discoverability and profile fields on every auth transition. Online saving is disabled until both profile and directory reads finish for that exact auth generation. Failed reads leave consent false and online saving disabled. Consent is captured for the saving account; stale callbacks cannot publish another account's form state. Partial profile/directory save failures are reported accurately.
- auth/ waits for Firebase auth restoration before processing email actions. New links carry an explicit action and random request ID. Linking requires matching, unexpired (30-minute), same-tab session state and the original UID, plus explicit confirmation. Missing/mismatched linking state never falls back to sign-in. Sign-in links cannot replace an already signed-in account; explicit sign-out is required. Cross-device sign-in requires email confirmation and an explicit confirmation prompt. Old links without an explicit action require requesting a fresh link. Credential collisions never auto-merge or silently sign into another account.
- Safe return destinations include Find Users and known Commons pages after normalization. Return context survives email actions. Auth pages suppress referrers to avoid sending email-action URL details in subsequent requests. No Firebase providers, domains, templates, project configuration, or account data were changed.

## Automated verification

The executable commands and pinned dependencies are in tests/commons-security/README.md. Tests use synthetic example.test identities and emulator-only records.

- Client DOM suite: 29 tests covering both actual DM page scripts, thread/account isolation, delayed sends, duplicate submissions, pending requests, failed sends, stale member reads/writes, consent gating, email intent/expiry/UID checks, auth restoration, cancellation, collisions, return URLs, storage failures, and root-rules/config preservation.
- Rendered DM suite: actual modules at 1440px and 390px, with every network request intercepted or blocked; verifies hidden composer, switching threads, draft restoration, sign-out clearing, and no writes.
- Firestore suite: 14 authorization test groups against the consolidated proposal, covering permitted operations and denied outsiders/forged fields, invitation transitions, messages, profiles, directory consent, communities, app config/settings, Prayer Map, feasts, ballots, owner/moderator permissions, reports, decisions, and default deny.
- Existing browser suites: five messaging screens plus Week 1/2 starters at desktop/mobile widths. Their fixtures were updated to model current badge SDK calls and auth restoration, use keyboard activation of the current launch menu, await navigation, and save screenshots portably. No assertions were removed.

Browser tests use SDK doubles, not real Firebase. Rules tests use Firebase JS 11.10.0 with rules-unit-testing 4.0.1; the production browser SDK remains 10.12.2. Emulator binary: Firebase Firestore 1.19.8, checksum-pinned in the runner. Test runner uses only demo-homegroups-commons-phase1 at 127.0.0.1:8088, refuses an occupied port, and has no production fallback. Expected authorization-denial cases can generate PERMISSION_DENIED emulator logs.

## Results from the final reviewed sources

| Check | Result |
| --- | --- |
| Client DOM regressions | 29 passed, 0 failed |
| Actual DM modules at 1440px / 390px | 2 passed, 0 failed |
| Consolidated rules / Firestore 1.19.8 | 14 groups passed, 0 failed |
| Existing messaging screen browser suite | Passed at 1440px and 390px |
| Existing weekly starter browser suite | Week 1 desktop and Week 2 mobile passed |
| JavaScript syntax and git diff whitespace checks | Passed |
| Deployed Firebase rules, real Google/email providers, physical iOS/Safari | Not verified |

The initial full CLI dependency installation exhausted available disk space; the smaller pinned JAR-based test runner succeeded. Only the smaller test dependency manifest and lockfile are included. No test failure is being hidden as a skipped test.

## Manual verification still required

1. Obtain and reconcile the current deployed rules release as described above; verify all manually added collections and Prayer Map/provider behavior.
2. In an explicitly authorized non-production Firebase project, verify Google authentication and real email-link delivery, same-tab linking, new-tab/device recovery messages, expired links, blocked storage, credential collisions, and unchanged UID for successful linking. Check actual authorized domains and provider settings read-only before rollout.
3. Test two synthetic accounts on a shared desktop/mobile browser: draft separation across contacts, logout/login, consent reset, accepted/pending requests, delayed and failed saves. Confirm Safari/iOS and screen-reader behavior; Edge desktop/mobile emulation does not cover physical devices.
4. Review Firebase IAM, service accounts, App Check, abuse controls, administrative access, retention and deletion policy. These are not established by client rules tests.

## Remaining concerns / intentionally deferred

The audit's history limit (first 100 messages), 50-conversation limit, last-activity ordering, invitation idempotency, unread-count model, identity/alias trust, missing DM block/report/rate limits, and service-worker navigation caching remain separate work. Existing accepted-contact access is preserved; this proposal does not introduce a new membership/block policy or privileged DM access. Public discoverability exposes the opted-in display name, interest, and UID, not email/about fields; consent is enforced through owner-only directory writes but historical publication cannot be recalled.

Production rules parity and real-provider authentication have not been verified. These are release gates. No deployment approval is requested by this change, and neither the draft PR nor passing emulator tests authorizes production publication.
