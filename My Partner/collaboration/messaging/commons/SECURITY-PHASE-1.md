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


## Phase 1 security verification follow-up — November 4, 2026

Reviewed PR #29 at 1f1a96a7562483d06ef3748f92fac97dbbe7d1ba on the existing branch. This section supersedes the initial test totals above. No merge, deployment, production Firebase settings/data change, actual message, or authentication email was performed. Phase 2 remains planning only.

### Readiness decision

**Ready for maintainer code/merge review, but not for an unconditional merge or deployment approval. Keep PR #29 draft until the release gates below are resolved or a maintainer explicitly establishes that a code-only merge cannot publish the site.** Known local Phase 1 defects have corrections and executable regressions. Production authorization parity and real-provider behavior remain unverified, not passed.

The public GitHub Pages settings request returned 404 and the connector could not supply Pages settings. This is inconclusive, not evidence that publication is disabled. Existing project records show previous main changes were delivered through GitHub Pages. An administrator must confirm the publishing branch/workflow before treating merge as separate from deployment; no settings were changed here.

### Production Firebase access: unavailable in this session

- No Firebase/Google Cloud management tool is connected. Discovery found the official Firebase integration available but not installed/connected; availability is not authorization.
- No firebase or gcloud executable was found on PATH. The standard Windows Firebase CLI login and Google application-default-credential file locations were absent. No configured FIREBASE_TOKEN or GOOGLE_APPLICATION_CREDENTIALS was found. Only existence/names were checked; no secret values were printed or added to the repository.
- No authorized non-production cloud project or test-account configuration was supplied. The demo emulator project is local-only and is not a real staging Firebase project.
- Consequently, no authenticated production Rules API call or production collection/data read was attempted. There is no exported active ruleset, and an exhaustive production-to-proposal difference list cannot honestly be produced. Every production-parity row below remains unknown.

### Exact administrator action required

Choose either an authenticated read-only connection for this task or an administrator-produced export. Do not send private keys, passwords, service-account JSON, or bearer tokens in chat or a public PR.

1. Confirm project homegroups-app and database (default), plus whether any named Firestore databases are used. Provide the publishing branch/workflow for homegroups.org separately.
2. For an approved connection, use the Firebase Rules Viewer role (roles/firebaserules.viewer) on this project, or a narrower custom role with firebaserules.releases.get and firebaserules.rulesets.get; include release-list permission only if discovery is necessary. This does not require Rules Admin/Editor or document-content access. The connection must actually support reading release metadata and ruleset source; installing a plugin alone does not establish that.
3. Alternatively, an authorized administrator can perform only these read operations:
   - GET https://firebaserules.googleapis.com/v1/projects/homegroups-app/releases/cloud.firestore for the default-database release. Confirm the actual release name against the database; list releases read-only if necessary.
   - GET https://firebaserules.googleapis.com/v1/{rulesetName}, using the exact rulesetName returned by that release.
   - Export all source.files entries and names, the release/ruleset IDs and update times, database identity, UTC retrieval time and SHA-256 of each raw source file. Keep the original export privately for comparison. Do not copy an unpublished editor buffer and call it the deployed release.
4. Provide a collection-path inventory (names/purpose only, not user documents) for any backend/Admin-SDK paths absent from the exported rules. Rules source alone cannot enumerate every stored collection or establish IAM/privileged backend access.
5. Once the export is available, compare every match/helper/allow condition and wildcard with the proposal, classify each difference as preserve/restrict/intentional change, obtain owner decisions for policy changes, add corresponding compatibility/denial tests, and rerun the emulator. Do not replace the live release with either repository file before that reconciliation.

References: [Rules API release read](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/get), [ruleset source read](https://firebase.google.com/docs/reference/rules/rest/v1/projects.rulesets/get), [Rules Viewer permissions](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaserules).

### Known repository comparison; production differences still unknown

The proposal and production config were not modified during this follow-up. The root-rule prefix is preserved exactly apart from the added proposal header; regression coverage checks the complete prefix. None of the following is a statement about the deployed release.

| Repository path/family | Known proposal behavior | Active-production comparison |
| --- | --- | --- |
| appConfig/main; users/{uid}/settings | Existing public config read/private owner settings unchanged | Unknown: export required |
| prayers | Existing public reads, Google-provider creation, validated owner/location/body and denied updates/deletes retained. Older proposed rules allowed other providers and prayer acknowledgments; do not assume either policy is live | Unknown: verify provider and prayed-update behavior explicitly |
| feasts | Existing public reads and authenticated validated creates retained | Unknown |
| investigationBallots; investigationVotes; investigationSuggestionUsers | Existing ballot status, Google-provider/owner authorization, limits and withdrawal restrictions retained | Unknown |
| commonsMembers; commonsDirectory | Private owner profile; public opt-in minimal display/interest directory; owner-only writes | Unknown |
| commonsCommunityMembers; commonsCommunityPosts and replies | Owner enrollment and membership-scoped community access | Unknown |
| commonsDiscussionReads | Private enrolled-user read markers | Unknown |
| commonsDirectConversations and messages | Participant-only access, recipient-only terminal pending transitions, accepted-only messages, authenticated sender validation, server timestamps, immutable fields/messages. No owner/moderator DM bypass | Unknown: local emulator tests do not certify production enforcement |
| commonsModeratorAssignments; commonsReports; commonsReportDecisions | Claim-scoped owner management, active study-moderator reads, immutable reports/owner decisions | Unknown |
| Other match paths, recursive wildcards, custom claims, IAM/Admin-SDK paths or named databases | Not inferred from the repository; proposal ends in default deny | Unknown: active export and administrator path inventory required |

### Confirmed follow-up corrections and evidence

The initial 29 client tests passed, but new adversarial scenarios exposed six failing assertions across three defect families before corrections:

- **Deferred authentication action used a changed account.** A Google/email linking click could wait for auth restoration, then use the later current account. Actions now capture the initiating account generation and cancel after any identity transition. Email form values are captured at submit time. Fields and status are scrubbed on account changes, including while another operation is pending. Credential collision failures have no sign-in/merge fallback.
- **Closed DM observers could act on a reopened same-ID thread.** Auth epoch and conversation ID alone did not distinguish two openings of the same conversation. Both pages now use a separate thread generation plus current SDK UID to reject stale conversation/message callbacks and delayed invitation/acceptance completions. Snapshot errors hide the composer; unavailable conversations clear sensitive content. This does not change invitation state policy or implement Phase 2 idempotency.
- **Legacy logout hid but retained the old transcript/recipient DOM.** Legacy direct/ now clears both on auth transitions, alongside draft/action cleanup. Both actual interfaces are tested in a rendered browser at desktop/mobile widths.

A further pending-sign-in race review added Firebase beforeAuthStateChanged guards for Google and email sign-in. An intervening account may sign in, but a later result from the old pending sign-in cannot replace it. Guard cleanup and provider errors are tested. The production 10.12.2 SDK export was read-only checked for this API; SDK version/configuration were not changed. This uses the [documented pre-auth transition hook](https://firebase.google.com/docs/reference/js/auth#beforeauthstatechanged).

### Asynchronous-send conclusion and limits

The shared composer passed new two-conversation, success/failure, A-B-A account, duplicate-submit and edited/retyped-draft scenarios without needing a composer implementation change in this follow-up. Each dispatched write retains its original senderUid, conversation path and body. A UID mismatch before dispatch prevents the call; a pending-operation token cannot unlock a newer operation after returning to the same account. Failures retain only the matching draft, and successful writes clear only the submitted draft version. Old callbacks do not update the new account/thread UI.

**Submitting is not cancellation:** once addDoc or a credential operation has been dispatched, signing out, closing, or changing context cannot guarantee that the server operation is cancelled. Tests verify payload/context isolation and stale UI suppression, not network cancellation or exactly-once delivery. The proposed Firestore sender/participant checks are the final protection if the SDK changes identity while a write is pending. Their actual production deployment remains a gate. Retrying an ambiguous failure and durable operation IDs remain a Phase 2 delivery design concern. No actual message was sent to test this.

### Authentication verification matrix

| Scenario | Evidence | Remaining limit |
| --- | --- | --- |
| Google sign-in, popup closure/failure, auth restoration | Actual page logic with SDK doubles; controls recover; explicit sign-out required for switching | No real Google/OAuth interaction |
| Google and email credential linking | Calls use the original UID; success/collision/cancellation and no sign-in fallback are tested | No real credential/UID assertion against a cloud Auth service |
| Email sign-in, new tab/device without local state | Explicit address and confirmation required; already-signed-in account is not replaced | No delivered email or physical-device action-link test |
| Expired/malformed/mismatched linking state | Fail-closed local 30-minute expiry, nonce, UID and mode checks | Firebase server-side expiry tested as a mocked auth/expired-action-code response, not a real token |
| Delayed sign-in after an intervening account | Pre-transition guard rejects stale completion and is removed after success/error | Real persistence/cross-tab SDK behavior needs non-production verification |
| Shared browser consent and delayed reads/writes | Original consent gating tests plus stale auth/thread generations and DOM cleanup regressions pass | Physical iOS/Safari, browser back-forward cache and screen readers are not certified |

Real-provider testing requires an explicitly designated non-production project, its public web app configuration, enabled Google/email-link providers, authorized test origins/action-handler domains, controlled test accounts, and an approved browser session. The current instruction also prohibits actual authentication emails; email-delivery testing would need separate explicit authorization or administrator-provided evidence. No production provider settings, test users, or cloud projects were created/changed. Local mocks and the Firestore emulator do not satisfy this gate.

### Current verification results

| Verification | Result | Evidence / limit |
| --- | --- | --- |
| Client regressions | **58 passed; 0 failed/skipped** | [Actual page-script tests](../../../../tests/commons-security/client.test.cjs), including both DM pages, deferred auth, provider failures, shared-browser cleanup and stale completions |
| Rendered privacy regressions | **4 passed; 0 failed/skipped** | [Both actual DM modules](../../../../tests/commons-security/browser.test.cjs) at 1440px and 390px, all network traffic intercepted/blocked |
| Firestore authorization | **14 groups passed; 0 failed/skipped** | [Proposal tests](../../../../tests/commons-security/rules.test.cjs), checksum-pinned loopback Firestore 1.19.8 and fixed demo project |
| Existing five-screen browser suite | **Passed desktop and mobile** | Community reading/posting/replies/search, enrollment, profile, account controls, navigation and embedded return; SDK doubles |
| Existing weekly starters | **Week 1 desktop and Week 2 mobile passed** | Existing payloads, drafts, membership, retry and account isolation; SDK doubles |
| Changed JavaScript syntax and diff whitespace | **Passed** | Inline module parse checks plus Node checks and git diff --check |
| Root rules / production config / Phase 2 code | **Unchanged / unchanged / not implemented** | Compared against 36e3516 and initial PR head |
| Active production rules / real cloud authentication | **Blocked, not verified** | No connected authorized management session or designated non-production project |
| Physical Safari/iOS / actual deployment coupling | **Not verified** | Requires administrator/device evidence |

Reinstalled the unchanged dependency lockfile after finding broken local package links. An initial resource-contended parallel browser run timed out (one DM case and a mobile embedded-navigation wait). A later starter rerun also exposed a narrow-screen desktop-mouse hover race in the fixture. The fixtures now model touch at mobile widths and use keyboard menu activation. Sequential reruns passed every browser scenario with no assertions removed. The configured rendered-test timeout is 60 seconds to allow slow local browser startup. These reruns do not establish real-provider or production-rules behavior. Historical initial totals above remain as the earlier review record.

### Remaining risks and recommended next action

No newly uncovered Phase 1 client defect is knowingly left unresolved in the corrected/tested paths. This is a bounded code-review conclusion, not a certification of the deployed system. Production rules/IAM, real-provider configuration and persistence, physical mobile behavior, in-flight-operation cancellation and the original deferred audit findings remain unverified or intentionally out of scope.

Recommended next action: keep the PR draft, review the Phase 1 corrections, and arrange the read-only rules export plus a non-production authentication verification session. Confirm whether merging publishes the site. Reconcile and retest before any merge that could publish, and before any deployment approval. For expansion work, use [the prioritized Phase 2 plan](PHASE-2-PLAN.md); it is planning only.
