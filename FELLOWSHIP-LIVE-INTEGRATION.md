# Fellowship live-services integration candidate

Status: implementation/review only on codex/fellowship-live-integration, starting from current main 487a460 (controlled build and activation). No merge, deployment, Firebase configuration/rules/claim change, production data read/write, authentication operation, email or notification was performed. Eddie reports physical iPhone testing completed for the controlled interface; this is owner evidence, not certification of this new live adapter.

## Reuse and minimal integration

| Experience | Existing implementation reused directly | Data/service |
| --- | --- | --- |
| My Communities / Explore | Commons directory/index.html, embedded joined filter and enrollment controls | commonsMembers; commonsCommunityMembers/{area}/members/{uid} |
| Discussions and replies | Commons conversations/index.html and existing compose/read flows | commonsCommunityPosts/{area}/posts and replies; existing read markers |
| Messages / invitations / acceptance | Commons direct-live/index.html, shared DM composer and lifecycle | commonsDirectConversations and participant-scoped messages |
| Account / profile / directory | Hardened Commons auth/member and find-users pages | Existing Firebase Authentication, private profile and opt-in directory |
| Prayer Map | js/prayermap.js and cards/prayermap.html | Existing public prayers/feasts, historical static GeoJSON and tiles |
| Shell / navigation / themes | Existing card runtime, route adapter and embedded theme bridge | Current study week, global light/dark/diagnostic variables |

No new Firebase app, collection, privileged message reader, membership model, authentication provider or discussion engine. Existing live components were already in PR #31; the controlled deployment deliberately prevented their entry. This branch adds a distinct live entry, fixes route state to stay on that entry, preserves weeks 1–52 across Commons navigation and makes the existing account controls reachable. Existing Google/email-link UID/collision/stale-operation safeguards remain in use.

The week dock moves into the Fellowship card's normal document flow and is restored on disposal, instead of relying on fixed padding beneath an absolute overlay. Week changes retain the current Fellowship route and state. Embedded directory joins now reject duplicate pending actions and suppress async results after account generations/disposal. Permission errors report denial without guessing which rules are deployed.

## Separate release paths

- Existing ?card=fellowship-test and ?card=fellowship remain the owner-gated fictional read-only experience. Existing activation JSON is untouched, including its scheduled expiry. Ordinary Prayer Map/menu remain unchanged.
- New ?card=fellowship-live&view=explore&week=12 invokes the real existing services **only after** the separate data/fellowship-live.json pilot gate passes. It remains disabled, with the owner-supplied single pilot UID and no activation dates. There is no public live menu entry or general-member rollout mode.
- The pilot mode accepts one or two distinct allowlisted, non-anonymous UIDs with valid tokens and an online window of at most 24 hours. An allowlisted administrator can participate; an administrator claim alone grants no pilot access or extra Firebase permissions. The November 5 single-account configuration contains the owner-supplied UID and remains disabled. The two-standard-account verification plan below remains pending for two-person workflows.
- Missing/disabled/offline/expired flags or unrelated identities never mount Commons frames. Account/Sign in links use the existing hardened Account page and a strictly constrained return to this route. The flag gives no Firebase permissions and cannot revoke access to existing standalone Commons URLs. Security Rules remain authoritative. As with the existing test, Pages assets and any future pilot UID allowlist are public, not secrets; never put credentials or real-member identities in this file.
- The live pilot uses the existing Prayer Map in read-only mode: display/search remain, publication is disabled at the action/form/save entry points. The ordinary standalone Prayer Map retains its existing consent and rounded-new-record functionality. No locations are published or migrated by this integration.
- The worker has a new cache version and keeps both pilot decisions network-only. Existing read-only tests remain isolated. A stale renderer must advertise the new live capability before initialization. Periodic/foreground validation does not reset a stable composer's draft; identity changes remove private UI before checking; stable token refreshes revalidate without destroying drafts, and denied refreshes remove the view. Client time/refresh gates are rollout controls, not server access control or instantaneous remote deletion.

## Production authorization gate — blocked; no live operations executed

The official Firebase plugin is installed/enabled, but the callable catalog contains no Firebase management tools. Neither firebase/gcloud CLI nor standard Firebase CLI/ADC login files were available. No credential was requested, printed or invented. Repository rules, a publicly served rules file and passing emulator tests are **not** evidence of deployed authorization.

Administrator action: use trusted read-only access to homegroups-app and export the default database's active Firebase Rules release and referenced ruleset. Supply privately the project/database, release name, ruleset ID, retrieval time, complete source (including all additional collection matches), and SHA-256. Alternatively connect an authorized management session with firebaserules.releases.get and firebaserules.rulesets.get (and list access if needed to identify the release). The existing [Firebase Rules Viewer role](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaserules) documents these read-only permissions; no role assignment is performed by this task. Do not share tokens/service-account keys in chat or the public repository.

Official API: [release lookup](https://firebase.google.com/docs/reference/rules/rest/v1/projects.releases/get) followed by [referenced ruleset source](https://firebase.google.com/docs/reference/rules/rest/v1/projects.rulesets/get). The authenticated default-database release is commonly projects/homegroups-app/releases/cloud.firestore; verify the actual database binding rather than assuming a repository file is current. Reconcile every live path against firebase/commons-phase1.rules.proposed, especially private DM participant/accepted-status/sender protections, profile/directory opt-in, self-only enrollment, member-only discussions/replies, prayer provider/consent/schema and unrelated study/moderation collections. Preserve existing restrictions/functionality. No rule deployment is authorized.

## Approved test plan — prerequisites and pending details

Eddie approved preparation of the following bounded plan, conditional on rules verification and confirmed dedicated accounts. This is not immediate execution or deployment approval. Record exact UIDs and operation IDs in a private verification record; do not publish credentials or tokens.

| Required input | Current status |
| --- | --- |
| Fellowship Test A — standard member | Exact UID/account and existing Commons profile pending trusted administrator designation; no account created here |
| Fellowship Test B — standard member | Exact UID/account and existing Commons profile pending trusted administrator designation; no elevated claims assigned |
| Designated test community and test-only visibility | Exact existing area pending; current catalog supports projects, fellowship, prayer, study, discipleship, family, not arbitrary new communities |
| Active rules/source reconciliation | Blocked as above |
| Approved release/activation window | Not supplied; new live gate stays disabled |
| Real auth environment | Designated non-production Google/email-link project still needed for provider/link/collision tests; no actual email authorized/sent by this task |

Before execution, document account UID mapping, community area, label prefix such as [FELLOWSHIP TEST], expected records, timestamps, visibility and cleanup owner. Do not experiment in a community with real-member notifications/content until isolation is confirmed. The existing model has no independent private test-community provisioning workflow; choosing an existing area requires administrator confirmation of an appropriate isolated scope. Do not invent a competing collection to get around this.

Once prerequisites and execution/release approval are established:

1. Sign in/out A and B through existing Account. Verify generation cleanup, no prior-account UI/drafts or consent. Confirm no administrator privileges and no unauthorized provider/config changes.
2. Discover the designated community, join as needed, verify self-only membership and leave. Only restore memberships created by this test; do not remove pre-existing ones. Two participants may need enrollment to see discussion/reply visibility.
3. Create exactly one labeled test discussion and one labeled reply in that area; verify expected member access. No existing discussion may be altered. **Current UI has no edit/delete workflow; proposal rules deny message deletion.** If active rules also forbid cleanup, obtain explicit retention or separately approved trusted-admin deletion instructions before creating content. Do not add a rules bypass or claim successful cleanup.
4. A requests B, B accepts, then one harmless message each direction. Record conversation/message IDs and verify private reads are denied to a nonparticipant using only an explicitly designated test identity or a signed-out read if that is the approved extent. Two participant accounts cannot by themselves prove authenticated nonparticipant denial; do not use a real member or invent a third identity. Emulator denial tests supplement, not replace, this production check. Existing DM immutability means retention/admin cleanup must be settled before execution.
5. Open the existing map for read-only verification. No prayer/feast/location create/update/delete and no geolocation action is required.
6. Change tabs, leave Fellowship, sign out and switch A/B, including pending operations; verify listener teardown, drafts, sensitive DOM, exact recipient/conversation paths and account-specific consent. Never send extra messages to probe a race.
7. Disable pilot after the approved window, verify denial, leave only test-created memberships and delete only authorized test content where current permissions allow. Record exact retained immutable test IDs and agreed cleanup/retention. Do not alter historical records or delete unrelated data.

## Privacy and release blockers

Historical GeoJSON and existing public prayer coordinates are unchanged. Approximate display does not reduce downloaded precision or establish historical consent. The live map still downloads the existing sources; general-member launch requires the separately approved minimization/consent strategy in tools/fellowship-preview/PRIVACY-PROPOSAL.md. The synthetic route still never fetches these sources.

Member release also needs active-rules evidence, real-provider verification, completed approved account operations, this new layout's physical-device/accessibility checks and abuse/delivery limits review (50-conversation/100-message limits, idempotency, unread accuracy, blocking/reporting). iPhone testing of fixtures does not verify these live paths. No verified cloud result is claimed.

Pages publishes main/root; merging is deployment. Keep this branch/draft unmerged. After review and gates, approve an exact combined release and independent pilot configuration. Normal rollback disables the live pilot flag while retaining authentication/privacy guards and the separate read-only test; never revert to an unguarded Fellowship implementation or deploy repository rules as a shortcut.

## Automated results

- 75/75 client security regressions passed.
- 14/14 Firestore emulator authorization groups passed against the unchanged proposal, not active production rules.
- All 62 Fellowship cases verified: 25 controlled-route cases, 18 preserved component cases and 19 new live-integration cases. The combined run initially passed 61/62; one preserved feedback selector expected the word “permissions” after the denial message was corrected. Accurate permission-denial copy was retained, its original test/assertions were unchanged, and the targeted rerun passed 1/1. No cases were skipped. Token-refresh recursion/draft preservation, delayed-expiry, fixed account returns and stale disposal checks passed in that full run.
- 13 changed JavaScript/module sources parsed; whitespace and protected-file diffs passed. Firebase configuration/initialization, root rules/proposal, both historical GeoJSON files and the existing read-only activation file are unchanged.
- All 4 rendered DM cases verified. Three passed the initial supporting run; the mobile direct-live case was cancelled at the 60-second overall runner limit, then passed a targeted rerun with a 120-second overall allowance and unchanged assertions. Existing five-screen messaging checks passed at 1440px and 390px. Weekly starter/integration checks passed for Week 1 desktop and Week 2 mobile.
- Local Windows execution was interrupted by account lockout/runtime restart; completed logs were recovered, and interrupted supporting suites resumed. No unfinished suite is represented as passing.

Commands: node --test tests/commons-security/client.test.cjs; node tests/commons-security/run-emulator.cjs with the pinned local JAR/JRE; node --test --test-concurrency=1 --test-timeout=60000 tests/fellowship/integration.test.cjs tests/fellowship/controlled.test.cjs tests/fellowship/live.test.cjs; targeted permission-error rerun. Local evidence is in work/fellowship-live-{client,rules,final,support,support-resumed,support-final}.log outside the repository; screenshots are in outputs/fellowship-live/. Production-entry browser fixtures load actual index markup, policy and card loader, while omitting unrelated study/audio bootstrap and substituting existing static third-party styles/images and all Firebase SDK calls. They target the Fellowship iframe explicitly, rather than an unrelated application iframe. This is functional client integration coverage, not complete application boot or provider certification. All external traffic is blocked; emulator authorization runs only on loopback demo-homegroups-commons-phase1 against the unchanged proposal.
