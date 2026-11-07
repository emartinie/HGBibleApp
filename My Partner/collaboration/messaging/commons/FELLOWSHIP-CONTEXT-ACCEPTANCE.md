> Historical approved inventory/acceptance baseline. Implementation and new evidence are recorded in [Fellowship Unification Phase 1](../../../../FELLOWSHIP-UNIFICATION-PHASE1.md). The inventory-only statements below describe the earlier review assignment.

# Fellowship: narrow architecture inventory and acceptance proposal

**Review only — November 6, 2026.** Source: emartinie/HGBibleApp main 786550e69369ec41224a918f993ef40cc80b083b. Branch: codex/fellowship-context-inventory. This assignment changes documentation only. Source inspection and isolated local function probes are distinguished below from browser/provider/production verification. No implementation, application/test/config/rules/data edit, production operation, merge or deployment.

## Principle and scope

HomeGroups makes fellowship available, not obligatory. Scripture is the foundation; fellowship connects people; Kingdom work expresses purpose in action. These are mission dimensions, not a requirement for three pages or a social dashboard. Reading, quiet prayer and nondiscoverability must remain valid participation.

Inventory only the connections needed for two round trips: **reading → explicitly associated discussion → community → Prayer Map → original reading**, and **discussion → permitted private conversation → original discussion**. Retain the current map-first entrance and Menu. Do not replace the router, rebuild readers/maps/Commons, redesign the application, or expand messaging/notification features in this milestone.

## What exists and can be reused

| Foundation | Source evidence and current capability | Boundary |
| --- | --- | --- |
| App shell and card loader | index.html plus card-app-runtime.js load one dynamic card; request IDs, aborts and cleanup hooks reject stale loads [E2] | MainStage DOM is retained; dynamic content is replaced and its scroll is reset. This is not a universal saved-position service. |
| Canonical routing | HGRoute supplies build/read/write/navigate, browser history, share links and per-card getState/restore adapters [E1] | Keys are allowlisted; building a route clears its hash. getState is used for canonical sharing, not automatic capture of every departing view. |
| Weekly study | MainStage adapter retains week; weeklyScriptureLoader owns language and asynchronous content replacement [E3] | Weekly language is local to that loader. Same-document DOM can incidentally preserve reading position; reload/departure continuity is not fully represented. |
| Reference-based reader | scriptureapi has reference parsing, chapter/verse loading, verse scrolling, a translation selector and ref-based initial routes [E4] | Its adapter reports ref only and has no restore method. Translation/visible-anchor offset are not captured. Do not confuse this with the separate small interlinear example in scripture.js. |
| Fellowship integration | One active same-origin frame or the existing Prayer Map; view/area/account/profile/recipient routing, theme bridge and explicit teardown [E5] | No origin-context trail, selected-post state or viewport snapshot. Return to study currently constructs a MainStage/week route. |
| Communities/discussions | Existing fixed community catalog and self-enrollment; discussions use area and #post-ID links, filters, paging and reply forms [E6] | Community membership remains the screen/server concern. A selected post/hash and filters are not reflected in the parent Fellowship route. |
| Study-to-discussion connection | Weekly companion reads context metadata, inserts a validated Reading URL in starter text and filters linked weeks [E7] | Context metadata covers weeks 1–4; starter/linked-week/message handlers are narrower (1–3). Word matches are labeled suggestions. This is not general passage association or all-week support. |
| Private messaging/drafts | Existing recipient link opens the matching deterministic conversation or an invitation prompt; accepted-state controls remain. DM composer isolates account/thread memory and clears on identity/disposal [E8] | Recipient navigation is not permission to send. DM drafts survive thread changes within that composer, not destruction/recreation of its frame. |
| Other drafts | Community posts/replies use UID/community/post-keyed sessionStorage; weekly starters use UID/community/week keys [E6], [E7] | Keep these owners and retention policies explicit; do not copy drafts into generic navigation snapshots. |
| Lifecycle/identity | commons-lifecycle wraps Auth/Firestore subscriptions, invalidates callbacks and runs disposal hooks. Fellowship replaces child views on account changes [E9], [E5] | Reuse and extend these guards; account changes are not ordinary Back navigation. |
| Prayer Map | Existing Leaflet instance, layers, search, location behavior and cleanup [E10] | Reinitialization uses a fixed default center/zoom. No center/zoom/layer-selection capture is connected to Fellowship return behavior. |
| Theme contract | Global root tokens, local theme diagnostic presets, live-scoped CSS and child token/font copying [E11], [E5] | Found the token/diagnostic pipeline, not a separate production Theme Manager service in the inspected js/css/cards entry paths. Embedded overrides and hard-coded standalone styles still coexist; do not invent another styling system. |

## Gap classification — each has one category

**Broken:** existing supported behavior is lost. **Missing connection:** working pieces lack an integration. **New capability:** semantics or retention not currently provided; requires its own scope decision. Classification does not certify deployed Firebase permissions.

| ID / priority | Category | Evidence and smallest response for review |
| --- | --- | --- |
| B1 / first | **Broken existing capability** | The Fellowship bridge receives an existing conversations/?area=study#post-demo permalink but drops the hash when constructing the child URL [E5], [E6]. An isolated execution of the unmodified functions confirmed it. Repair the existing route/bridge representation of the selected post, rather than build another discussion viewer. Verify targets outside the first 30 loaded posts too. |
| B2 / first | **Broken existing capability** | Root app links are not recognized by the child bridge: path normalization turns '/' into '', but root special cases compare against '/'. The unmodified function returned false for /?card=scriptureapi&ref=John%201%3A5 [E5]. Default iframe navigation can then follow the link inside the frame; this consequence is inferred, not production-browser verified. Dispatch supported canonical app routes through HGRoute, preserving the intended card/ref. |
| C1 / next | **Missing connection** | Week restoration, reference/verse jumps and translation controls exist separately, but no departure/return capture joins them [E1], [E2], [E3], [E4]. Extend existing adapters with an explicit reader memento and restore it after content loads. Do not assume every same-session return currently loses its place. |
| C2 / next | **Missing connection** | Discussion focus/filter/scroll, community view and recipient navigation exist, but there is no account-aware origin/return trail [E5], [E6], [E8]. Preserve identifiers and bounded view state so a DM excursion can return to its discussion. A link alone cannot guarantee access. |
| C3 / next | **Missing connection** | Leaflet viewing state is discarded on teardown [E5], [E10]. Capture/restore chosen map center, zoom and enabled layers locally for the session; do not publish coordinates or trigger geolocation merely to restore a view. |
| C4 / alongside | **Missing connection** | Theme tokens and an embedded bridge already work, but the router’s mounted share toast/mobile utility menu still use literal dark colors instead of tokens [E1], [E11]. Reuse tokens when those controls are touched. Standalone fallback styling alone is not proof of an embedded defect; avoid a wholesale rewrite or a new component framework. |
| N1 / decision required | **Genuinely new capability** | An intentional, general passage ↔ discussion association and reverse lookup is not established by week/body links or keyword matches [E7]. Decide who may associate a passage, how provenance is shown, how a missing/restricted target behaves, and whether this starts as a reviewed link list/fixture or durable authoring. Do not infer associations from text matches. Real association metadata must inherit discussion visibility; do not publish a manifest of private posts. |
| N2 / defer unless approved | **Genuinely new capability** | Cross-screen DM draft retention exceeds the current clear-on-disposal contract [E8]. Do not call that policy a broken draft feature. First slice retains the policy; resuming such drafts needs a separate UID/generation-scoped, ephemeral ownership and feedback decision. No private draft in URL/history/general localStorage. |

Existing post documents use uid/authorName/body/createdAt, and the checked-in rules proposal restricts allowed keys [E12]. Therefore adding Scripture fields is not a harmless UI link change. A repository proposal is not authoritative production rules. No new collection, schema field or rules change is selected by this document.

## Smallest integration approach

Extend HGRoute and its existing card adapters; let existing screens continue to own data and authorization. Separate three kinds of state:

- **Destination:** approved card/view, Scripture ref, week, community/post or recipient identifiers. URLs are navigation, never authorization. Share only on explicit user action.
- **Local view memento:** selected reader translation/language and visible anchor/offset; discussion filter/scroll; chosen map viewport/layers. Start session-local. Map viewing position can itself reveal location: do not place it in share URLs or cloud history by default.
- **Private content:** messages, drafts, consent, identity and pending operations remain with their existing component/UID-generation owners. Never snapshot whole DOM, message text or account data into Back history. UID changes invalidate private return context; revisiting an old browser URL requires fresh authorization.

Use existing origin/source validation if a child needs to report navigation state. Restore after data and layout settle; reject stale restores after a newer route/account transition. Keep the reading route as the return destination when that was the origin, with MainStage/week only as a fallback. Do not preserve live listeners just to keep a screen's position.

## Measurable acceptance criteria — proposed, not implemented

Start with **one reader**, recommended scriptureapi because it already supports chapter/verse refs. The weekly reader and Sefaria are not silently included in a universal-reader rewrite. Use synthetic test pairing John 1:5 ↔ a labeled study discussion; no real discussion is presumed associated and no live record is created here.

| ID | Pass condition |
| --- | --- |
| A1 Voluntary participation | Signed-out visitors can use the existing public reading and Prayer Map routes without a profile, community enrollment, discovery consent or automatic sign-in prompt. Fellowship pilot/member restrictions remain unchanged; study never requires social participation. |
| A2 Exact reading return | From a supported ref, choose an available translation and position a visible verse anchor. Complete reading → linked discussion → community → Prayer Map → return. Same reader/ref/translation/week and the same anchor offset within 32 CSS pixels at the same viewport after layout settles; test independently on desktop and iPhone. |
| A3 References and history | Open/share/refresh a permitted discussion permalink and reader ref; Back/Forward reach the intended post/card rather than a nested app or a generic index. Include an older post and a deleted/restricted target; show a truthful unavailable state without leaking its content. Rapid Back during a delayed load must finish with the view matching the final URL. Sharing a route need not share private view mementos. |
| A4 Association honesty | Only an explicitly established test association is offered as associated. With none, say no association is available; a keyword suggestion must not masquerade as one. Restricted targets reveal no title, participant, body or association metadata to unauthorized accounts. Approval of N1 is required before claiming the two-way discovery journey complete. |
| A5 Map continuity | On map → community/discussion → map, restore the same zoom, enabled layers and center within two screen pixels at the same viewport. No new location lookup, publication, server write or precise-coordinate URL. Preserve existing map source/consent/read-only policy. |
| A6 Private excursion | Discussion → correct recipient → existing conversation or invitation prompt → return restores the same post/filter/position. Navigation sends zero messages/requests. Pending/unaccepted or unauthorized conversations never expose an enabled send composer or old transcript. |
| A7 Account/draft boundaries | Same-account thread switching retains matching in-composer drafts. Retain current clear-on-disposal DM behavior for this slice. A → B → A, sign-out, late callbacks and browser Back cannot resurrect another session's private drafts, transcript, consent or return memento. Community draft restoration remains keyed to its actual owner. Already-dispatched writes are not promised cancelled. |
| A8 Lifecycle | Active subscriptions stay at the expected baseline for each view; disposed child callbacks cannot render or navigate. Repeat the journey three times without growing child subscriptions. Return waits for current authorization/data, not cached private HTML. |
| A9 Appearance/accessibility | Existing compact live Menu and map-first entrance remain. Verify light/dark and the actual diagnostic preset, keyboard focus/Escape, touch navigation, and portrait/landscape. Week controls stay hidden only in live Fellowship and restore outside it. No new independent palette or mandatory dashboard. |

## Review decisions and stopping point

1. Approve or revise the first reader and nine criteria. The 32-pixel/two-pixel tolerances are proposed test thresholds, not claims of current behavior.
2. Choose the explicit association owner/representation for N1. A reviewed synthetic fixture is enough to test navigation; durable association authoring/reverse discovery is separately scoped.
3. Approve repairing B1/B2 and connecting C1–C3 using current adapters. C4 applies only to touched UI. Defer N2, mentions/notifications, activity dashboards, arbitrary passage-range parsing and broader reader support.

Evidence is source inspection plus three isolated, read-only local probes: post-hash loss, root-card fallthrough, and omission of translation/anchor from the current route whitelist. Probe artifacts are outside the repository in outputs/fellowship-context-inventory/. Week 1 markup was sampled for anchor readiness; this is not a corpus-wide audit. Existing regression files were inspected, not rerun. Earlier UI tests covered menu destinations and week retention, not the exact round trips above. No current end-to-end, physical-device, provider or deployed-rules certification is made.

Before any real-operation verification, retain the previously required active-rules reconciliation, designated test identities/community and explicit release/execution approval. This documentation task neither retries that access step nor expands its authorization. **Stop here for joint review; no application changes are made.**

## Source evidence (pinned revision)

[E1]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/share-routing.js#L7
[E2]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/card-app-runtime.js#L371
[E3]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/mainstage.js#L623
[E4]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/scriptureapi.js#L115
[E5]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/fellowship.js#L32
[E6]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/conversations/index.html#L31
[E7]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/week-context-pilot/index.html#L44
[E8]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/direct-composer.js#L1
[E9]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/commons-lifecycle.js#L1
[E10]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/prayermap.js#L212
[E11]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/themeDiagnostic.js#L1
[E12]: https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/firebase/commons-phase1.rules.proposed#L212

Additional directly inspected owners: [weekly loader](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/weeklyScriptureLoader.js#L41), [MainStage adapter](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/js/mainstage.js#L744), [root theme tokens](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/index.html#L45), [embedded CSS](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/css/fellowship-embedded.css#L1), [weekly context](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/week-context-pilot/context.js#L3), [starter payload/draft owner](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/week-context-pilot/start-conversation.js#L13), [DM recipient/disposal](https://github.com/emartinie/HGBibleApp/blob/786550e69369ec41224a918f993ef40cc80b083b/My%20Partner/collaboration/messaging/commons/direct-live/index.html#L25).
