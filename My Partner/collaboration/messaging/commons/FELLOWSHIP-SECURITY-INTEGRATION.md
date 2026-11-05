# Fellowship security integration — review candidate

Prepared November 4, 2026 (America/Chicago). Branch: `codex/fellowship-security-integration`. Base: current main `36e3516f4195a050e84b3d176e1e67b7220759bf`.

**Ready for draft code/architecture review; not approved for merge or release.** This candidate combines PR #29 at `52e4ab2a80090eee7a7ae23372669826822bfb4f` and PR #30 at `3ebd30482a9c21338eb3c84f0bcefdfec920e286`. Both original PRs remain unchanged and open drafts. The work was applied to a new main-based branch; neither source PR was merged into main. No production rule/configuration/data changes, real messages, authentication emails, memberships or prayer requests were made.

## Conflict resolution and retained functionality

| Overlap | Deliberate resolution |
| --- | --- |
| `auth/index.html` (textual conflict) | Retained all #29 action-intent, request nonce/expiry, original-UID linking, safe destination, auth restoration, pre-transition and completion-generation safeguards. Auth subscription comes from #30's lifecycle adapter; Firebase's real before-auth hook stays in the SDK. No collision fallback or security check was removed. |
| `member/index.html` (textual conflict) | Retained #29's revision-gated private/profile reads, immediately cleared consent, failed-read save prohibition and original-account save checks. Added #30 subscription disposal. The old direct Google/redirect shortcut now opens the hardened Account screen, preserving a safe member return destination. |
| `direct-live/index.html` (textual conflict) | Retained #29's shared composer, account/thread generations, invitation/acceptance guards and transcript clearing. Added #30's Auth/Snapshot lifetime wrapper. |
| `PROJECT-MAP.md`, `WORK-LOG.md` (textual conflicts) | Preserved both branches' historical entries; added this integration handoff. Historical test counts are labeled by their original review. |
| Legacy `direct/index.html` (semantic integration) | Kept #29 logic and added the same disposal adapter/reset as the current interface, so return links cannot enter a screen with weaker lifetime handling. |
| Fellowship, routes, directory, themes, map, launcher | Retained #30's native card, joined filter, existing enrollment/discussion/reply/recipient routes, account/profile actions, study week, legacy Prayer Map alias, global theme bridge, mobile layout, pending-card guards and paused launcher inbox. No new Firebase model or independent message implementation. |
| Rules proposal and deployment files | Proposal is byte-for-byte equivalent to #29 after line-ending normalization. Root rules, `firebase.json` and `js/firebase-init.js` match main. Nothing redirects production deployment to the proposal. |

## Additional integration defects found and corrected

Five adversarial client tests failed on the initially combined implementation, then passed after correction. These are controlled SDK-double interleavings, not observations of production provider races:

- A pending Google sign-in could finish after its Account screen had been disposed. Disposal now invalidates the captured auth generation; the pending operation's real before-auth guard rejects a late identity transition. The guard stays registered until that credential operation settles, rather than being removed early and allowing a stale sign-in.
- An email-action screen waiting for auth restoration could resume linking after disposal. It now checks disposal before interpreting/dispatching the action.
- A profile save awaiting its first write could continue with a directory-consent write after disposal. Disposal invalidates the revision and clears/disables sensitive fields; follow-up writes are not dispatched.
- Both DM composers could retain eligibility or publish success feedback into a disposed screen. Explicit teardown clears account, drafts, transcript/actions and pending UI generations, as well as unsubscribing observers.

The lifecycle adapter now offers page-owned disposal callbacks in addition to listener cleanup. The Fellowship parent also ignores stale auth callbacks whose UID differs from the SDK's current UID. Profile and Prayer Map sign-in entry points use Account, keeping #29's checks in the path rather than maintaining parallel popup implementations. A prayer may still be submitted after signing in/connecting Google through Account and returning to the map; posting never automatically switches accounts.

**An already dispatched operation is not cancelled by disposal.** A credential link or first profile/message write may still complete for its original account. This candidate prevents unauthorized continuation and stale UI effects in tested interleavings; it does not promise network cancellation, rollback or exactly-once delivery. Real SDK persistence and provider lifecycle behavior remain a release gate.

## Regression evidence

| Suite | Integrated result | Scope |
| --- | --- | --- |
| Security client regressions | **75 passed: all original 70 + 5 disposal cases** | Actual page logic plus real lifecycle adapter; SDK doubles |
| DM browser regressions | **4 passed** | Current and legacy DM at 1440px/390px; private drafts/auth cleanup, no real sends |
| Firestore emulator authorization | **14 groups passed** | Unchanged proposal, checksum-pinned emulator 1.19.8, loopback-only fixed demo project |
| Fellowship browser regressions | **18 passed: all original 12 + 6 integration cases** | Actual loader/screens; map, membership/discussion/reply/recipient navigation, week/alias, themes, mobile/desktop, lifecycle and auth transitions |
| Existing five-screen integration | **1440px and 390px passed** | Discussions/replies/search, enrollment/profile, account controls, unread deep links, shared navigation/embedded return and preview isolation |
| Existing weekly study starters | **Week 1 desktop and Week 2 mobile passed** | Existing study membership/payloads, pinned reading context, draft recovery, permission errors, duplicate prevention, stale callbacks |
| Legacy sample preview | **Passed** | Local sample send/escaping/persistence, space/project/new-thread navigation and mobile width; loopback-only server, no live services |
| Syntax / protected files | **18 JS/inline parse checks passed; protected file comparisons passed** | No production Firebase rule/configuration changes |

The six new Fellowship cases cover a mocked Google identity transition inside the card, UID-preserving Google linking/collision handling, disposal during a pending popup, a stale parent auth callback, safe profile-to-Account navigation and prohibition of an independent Prayer Map popup. All service mutations are in-memory doubles except synthetic data in the isolated emulator. **These tests do not prove production authorization or real OAuth/email delivery.**

Reproduce with [security test commands](../../../../tests/commons-security/README.md) and [Fellowship commands](../../../../tests/fellowship/README.md). Existing installed pinned dependencies were reused through NODE_PATH; no fresh package install was verified. Browser runs were sequential. The original 12 Fellowship cases plus the six additions passed together in 159.0 seconds. After the final auth state-initialization review, all 75 client cases and the six targeted auth browser cases were rerun and passed. The five new client counterexamples were deliberately observed failing before corrections; their assertions remain in the passing suite.

The legacy preview initially stopped because its exact accessible-name selector did not account for a decorative icon. Its stable community-view selector was corrected; all original assertions remain and the complete preview rerun passed. The loopback runner redirects screenshots to local artifacts and blocks external requests.

The initial shell-based attempt to start the five-screen suite failed to create a Windows process (error 1909); the suite was then run through the available Node runtime and both widths passed. No product or test assertion was bypassed. This is an execution-environment issue, separate from application test results. A focused fixture stands in for the full main-stage/time/audio boot; full app and physical-device checks below remain necessary.

## Location privacy assessment

| Layer | Confirmed repository/test evidence | Privacy implication |
| --- | --- | --- |
| Displayed prayer/group/feast pins | Map renders coordinates to two decimals; raw group coordinate strings are omitted from popups. | Approximate presentation only; this does not protect the response data. |
| Historical static downloads | Both `data/HomeGroupsMap.geojson` and root `HomeGroupsMap.geojson` contain 2,000 records and 2,000 coordinate pairs. In each file 1,998 pairs are more precise than two decimals. No consent/opt-in field was found in their properties. Map and Find Users use these existing static sources. | Raw coordinates and other original fields are delivered to browsers even though visible pins are rounded. Absence of consent metadata is not proof that consent was never obtained elsewhere, but publication consent is unverified. No individual record or private field is reproduced in this report. |
| Firestore browser responses | Map's existing prayer query (latest 250) and feast listener receive document fields before client rounding. | If stored coordinates are precise, the client receives that precision. Actual production records were not queried or inspected. |
| Public authorization | Checked-in root rules and the preserved proposal allow public reads of prayers/feasts and do not require coordinate quantization or a consent field on create. | This is source evidence, not a verified production-rules statement. An alternative client could submit precise allowed coordinates under that proposal. |
| New prayer submissions | Explicit public-location checkbox; UI rounds coordinates before the existing write. No location is required to browse or join communities. | Consent is enforced in this UI only; no auditable consent field is persisted in the current schema. Server-side enforcement and withdrawal policy are unresolved. |
| Current device location | Only the explicit Locate me action requests device location; its precise local marker is not persisted by this integration. | Device permission/denial and mapping-provider metadata still require device/privacy review. |
| Legacy helpers/free text | The unused legacy feast form still accepts coordinates for its existing payload; descriptions, names and prayer text can include identifying information. | Do not treat approximate pins, an unused UI path or text masking as complete privacy controls. |

Recommended minimization, **not implemented**: inventory authoritative data owners/consent first; publish only curated approximate coordinates and necessary display fields in both static sources and browser-readable records. Keep original import/location/consent evidence in an appropriately restricted system, never an additional public download. Design an auditable purpose/version/time/withdrawal consent record and trusted validation for new publication before adding schema/rule changes. Avoid requiring location for community participation. Stage dry-run transformations privately, validate authorized map functionality, obtain separate approval, and account for Git history, CDN/service-worker caches, backups and previously downloaded copies. Removing current URLs cannot retract prior public copies. Two-decimal coordinates do not guarantee anonymity, especially in sparse areas; prefer voluntary city/region-level disclosure where appropriate. No production migration, deletion, access-rule change or source dataset rewrite is part of this branch.

## Rules and security review

The [consolidated proposal](../../../../firebase/commons-phase1.rules.proposed) retains participant-only metadata, accepted-participant messages, caller-bound sender UID, immutable messages and recipient-only pending acceptance/decline. Owner/moderator roles gain no app-facing DM read bypass. Profile keys/ownership and enrollment/reply authorization remain enforced in emulator tests. The [bounded rules assessment](INTEGRATION-RULES-REVIEW.json) records known privacy/abuse risks; it is not an assessment of an unseen active release.

No callable authenticated Firebase management tools were available in this session and no active release/ruleset was exported. The authoritative source remains the Firebase Rules service release for `homegroups-app` / `(default)`, not the repository root or proposal. An administrator must supply release metadata and referenced ruleset source (IDs, source filenames, export time and hashes), or scoped read-only access including `firebaserules.releases.get` and `firebaserules.rulesets.get`. Preserve this evidence privately and reconcile every collection/permission, including any unrepresented collections, before applying a proposal. Exact previous access checklist: [SECURITY-PHASE-1.md](SECURITY-PHASE-1.md).

One compatibility concern remains unverified: the UI recognizes Google-linked accounts, while the preserved prayer rules require the token's current sign-in provider to be Google. A Google-linked account entering through email may therefore require explicit Google authentication under that policy. Do not silently broaden rules or switch the UID to make a test pass; verify the intended live policy in non-production.

Known expansion concerns remain: inbox/history limits (50/100), activity ordering, invitation idempotency, reliable unread state, blocking/rate limiting and broader abuse/report review. The inherited report submission policy is study-scoped, not a completed all-community moderation service. See [the original Phase 2 plan](PHASE-2-PLAN.md); this integration does not implement it.

## Release checklist and recommended next action

| Gate | Status / practical evidence required |
| --- | --- |
| Combine #29 and #30 without losing guards | **Verified in this review branch**; source PRs remain unchanged drafts. Review the conflicts and new disposal fixes above. |
| Active production Firestore rules | **BLOCKED**: authorized administrator export/access, exhaustive proposal diff and tests preserving all live authorized behavior. No deploy approval requested. |
| Real authentication / designated test project | **BLOCKED**: designate a non-production project, public web config, enabled Google/email-link providers, allowed test origins/action domains and controlled identities. Verify UID retention, popup failures/collisions, expired/cross-device links, same-tab linking, iframe persistence, account switching and pending operations. No real provider test or authentication email occurred. Current restrictions require separate explicit authorization for any actual email/message. |
| Historical location privacy | **BLOCKED**: verified publication consent and approved minimization/retention/withdrawal treatment for both static sources and existing records. Review public Git history/caches too. |
| Deployment behavior | **BLOCKED pending administrator confirmation**: public API shows successful [Pages run 41373395039](https://github.com/emartinie/HGBibleApp/actions/runs/41373395039), event `dynamic`, for the exact current main SHA. This is evidence main is deployed, not proof of all current triggers. Public Pages settings endpoint returned 404 (not authoritative settings access). Confirm Settings → Pages source/build type, main branch/folder or external automation, environment approvals, custom domain and rollback before any future merge. Treat merging to main as potentially publishing immediately. No workflow was run or re-run here. |
| Full study app / service worker | **OPEN**: verify the combined app's complete reading/audio/time boot, Back/Forward, stale cached assets/offline upgrade, real tiles and geolocation denial; focused automated fixtures do not certify these. |
| Physical devices / accessibility | **OPEN**: iOS Safari and Android touch/keyboard, nested frame scrolling, zoom, focus movement, screen-reader names/states, contrast, modal focus/escape and return-to-reading behavior. Desktop Chromium emulation is not device certification. |
| Delivery/abuse operations | **OPEN before community expansion**: offline/ambiguous writes, duplicate invitation behavior, abuse/report policy, blocking and actual production IAM/admin access review. No exactly-once or backend-IAM privacy claim. |

Recommended next action: review this integrated draft while an administrator supplies live rules and publishing evidence and designates the non-production verification environment. Address historical location consent/minimization separately under explicit authorization. Only then verify a release candidate on non-production and consider a separately authorized merge/deployment decision. Do not merge this or either source PR now.
