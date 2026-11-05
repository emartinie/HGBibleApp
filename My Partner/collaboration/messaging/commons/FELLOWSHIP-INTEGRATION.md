# Fellowship integration — Phase 1

> Historical PR #30 report. The current integration branch now includes PR #29 with deliberate conflict resolutions and additional disposal guards. Its source-integration dependency is resolved in this candidate, but neither original PR is merged and production release gates remain. Current evidence and checklist: [FELLOWSHIP-SECURITY-INTEGRATION.md](FELLOWSHIP-SECURITY-INTEGRATION.md).

Review branch: `codex/fellowship-phase1`. Base: current `main`, `36e3516f4195a050e84b3d176e1e67b7220759bf` (November 4, 2026). This branch does not include or merge draft [PR #29](https://github.com/emartinie/HGBibleApp/pull/29). No deployment or production mutations were performed.

## Architecture and reuse

| Existing component | Fellowship integration |
| --- | --- |
| `js/app.js`, `js/share-routing.js` | Existing card loader, lifecycle hooks and history router. Primary route `?card=fellowship`; legacy `?card=prayermap` resolves to the Prayer Map view. Week context remains in the URL and the mounted study remains intact. |
| `cards/prayermap.html`, `js/prayermap.js` | Same map, prayer search, explicit device-location control, public prayers, group and feast layers. No migration, deletion or replacement schema. |
| Commons `directory/` | Same six interest communities and membership workflow; embedded joined-only filter powers My Communities, full list powers Explore. Illustrative local groups are hidden inside Fellowship. Geographical location is not required. |
| Commons `conversations/` | Existing enrolled-community discussions, replies, pagination, drafts and reporting controls. Links and author message buttons remain inside Fellowship. |
| Commons `direct-live/` | Existing inbox, requests, acceptance and message interface; no new composer or direct-message service. |
| Commons `auth/`, `member/`, `find-users/` | Existing account, member-profile and directory screens, reached from native card actions. |
| Global theme / `themeDiagnostic.js` | Fellowship uses the existing variables. A same-origin bridge copies computed variables and color scheme to the active embedded screen; diagnostic/preset changes update it. Standalone styling remains available outside Fellowship. |

The native card owns tabs, status/retry feedback, routing, reading return and one active content view. Existing Commons documents are reused as same-origin component frames rather than duplicated into a second application. There is one active frame, or the existing map, at a time. Each screen retains its existing authorization checks. No parent code queries private messages or grants additional access.

`commons-lifecycle.js` wraps existing Auth/Snapshot subscriptions with guarded callbacks and explicit disposal on view teardown/pagehide. Account UID changes remove the old frame and mount a fresh screen; callbacks from disposed subscriptions are ignored. The global launcher pauses its inbox while Fellowship is active. The map separately aborts group fetches, unsubscribes layers and rejects stale callbacks. Main-stage navigation now invalidates in-flight card loads, preventing a delayed Fellowship load from reopening after a return to study. Rapid reopening shares the pending module promise; a failed script is removed so retry can load it again.

## Collections and privacy

Unchanged collections include `prayers`, `feasts`, `commonsMembers`, `commonsDirectory`, `commonsCommunityMembers/{area}/members/{uid}`, `commonsCommunityPosts/{area}/posts/{id}/replies`, `commonsDirectConversations/{id}/messages` and the existing reporting collection. Existing documents and field shapes are preserved. The HomeGroups GeoJSON remains the existing read source. No rules or Firebase configuration files changed.

New prayer submissions require an explicit public-location consent checkbox. Submitted and displayed prayer coordinates use two decimal places. Historical group and feast pins now also display approximate coordinates; raw coordinate strings are omitted from group popups. Device geolocation remains an explicit button action and is not persisted by this integration. A signed-in non-Google user is directed to Account to connect Google rather than silently being signed out/switched while posting a prayer; anonymous link collisions do not trigger an automatic account switch.

**Remaining limitation:** rounding a displayed pin does not retract precise coordinates already available in public GeoJSON or legacy Firestore documents. Description fields may also contain identifying information. No historical publication consent can be established from repository inspection. An administrator must review consent and data minimization before community rollout; this branch does not modify existing data.

## Verification evidence

Public read-only HTTP inspection on November 4, 2026 returned 200 for `index.html`, `js/app.js`, `js/prayermap.js` and Commons `directory/index.html`. All four matched the main baseline after line-ending normalization. This is evidence about those public assets, not the active Firestore rules or the entire deployed application.

**Final result: 12 browser tests passed, 0 failed (91.7 seconds); JS syntax and Git whitespace checks passed.** Desktop/mobile parchment previews were visually inspected.

The automated suite is in `tests/fellowship/`. It executes the actual card loader/router/controller and actual Commons pages in Edge/Chromium with a representative HomeGroups viewport and the index theme CSS. Firebase SDK modules, time-system modules, Leaflet and public map records use deterministic test doubles. External requests are blocked. Membership mutations are assertions against in-memory doubles only; no message is submitted. It covers card/alias loading, community discovery/joined membership, discussion/reply/message entry points, account cleanup and stale callbacks, themes, mobile/desktop overflow, error/retry, explicit location consent, existing Account/Profile entry points and launcher subscription coordination.

Run instructions and final results: see [test README](../../../../tests/fellowship/README.md).

## Release dependencies and manual verification

1. **PR #29 is a release blocker.** Main still contains the known DM draft and account/linking/consent defects addressed by that PR. Fellowship uses the main screens and does not claim to fix those defects. Integrate #29 only through a separate authorized review. Reconcile overlapping imports in `auth/`, `member/`, `direct-live/` and other Commons screens while preserving both its privacy guards and this lifecycle wrapper. Re-run both suites against the combined candidate; neither branch's tests certify an unbuilt combination.
2. **Active Firebase rules remain unverified.** A project administrator must supply the active release and referenced ruleset source for `homegroups-app` (including release/ruleset IDs, source filenames and timestamp), or provide authorized read-only Firebase Rules API access. Compare all collections against the proposed #29 rules and actual approved behavior. Do not infer live permissions from repository files. No rules/configuration deployment is authorized here.
3. Use a **non-production** Firebase project and separate test identities for Google popup, email-link cross-device/expired/collision/account-link behavior, UID retention, persistence between parent/iframe, failed permissions, offline writes and accepted/pending DM flows. No such real-auth test was performed; no authentication email was sent. Popup/redirect behavior in an embedded document needs explicit browser verification. Cross-origin frame teardown is defensive, but does not certify provider compatibility.
4. Test the combined candidate in the full app with study/audio state, browser Back/Forward, existing bookmarks, service-worker upgrade/offline behavior, real map tiles, geolocation permission denial, and keyboard/screen-reader navigation. Automated browser coverage uses the real loader with a focused host fixture, not every production script. iOS Safari and Android browsers require device checks. The pre-existing weekly discussion companion remains a distinct study tool; this phase does not redesign its hidden-panel/draft lifecycle.
5. Review existing abuse/reporting and directory policies before community expansion. The inherited 100-message history, 50-conversation inbox, unread accuracy and invitation idempotency limitations remain outside this integration phase.

## Recommended next steps

- Review this draft for architecture, privacy and design; keep it unmerged and undeployed while the security gates remain open.
- Verify #29 and the live rules independently, then test an explicitly combined non-production candidate.
- Resolve historical location consent/data exposure and complete device/accessibility checks.
- Plan later work for pagination, activity ordering, invitation idempotency, reliable unread state and blocking/reporting protections. Do not expand the data model or implementation in this phase.
