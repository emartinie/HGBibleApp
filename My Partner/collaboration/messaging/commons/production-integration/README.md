# Week 1–2 production Messaging integration

The production app shell loads `commons-week-companion.js`. It opens the existing Week 1/2 Messaging page in a floating iframe, using the same Firebase account, Bible Study & Investigation membership, discussion starters, and replies as the full conversation page.

## Start a conversation

1. Open Week 1 or Week 2 and select the floating **Messaging** button.
2. Sign in and join Bible Study & Investigation if prompted.
3. Select **Start conversation** above the discussion filters, including when no discussions exist.
4. Enter a title and opening message. The study link stays tied to the week where the draft was started.
5. Select **Post conversation**. On confirmed creation, the panel opens the new thread; use **← Discussions** to return to the current week.

The title, message, and study link together have the existing 1,200-character body limit. A starter uses the established `[HG-TITLE:...]` body prefix and writes only `uid`, `authorName`, `body`, and a server timestamp to `commonsCommunityPosts/study/posts`. Firebase rules, content files, and existing messages are unchanged. New replies continue to use the existing reply paths.

Drafts are scoped to the signed-in account, community, and originating week. They survive failed sends, list navigation, and tab reloads when sessionStorage is available. If browser storage is blocked, an in-memory draft remains in the open Messaging window. Signing out or changing accounts removes the old account’s composer from view. Posting uses the current authenticated UID, and stale membership or week-context results cannot authorize a new account or overwrite a newer context.

## Week organization

**This week** is the default view. It shows explicit Week 1/2 reading links among the 20 most recent Bible Study starters; this sample is not a complete week history. **All Bible Study** includes unlinked posts and other study topics. **Related passages** remains a word-match suggestion. New weekly conversations always include their originating week’s reading URL using the existing message body; no new collection, corpus schema, rules, or fields are introduced. Drafts started in Kingdom Projects stay separate from Bible Study drafts.

## Wiring and cache refresh

```html
<script type="module" src="My%20Partner/collaboration/messaging/commons/production-integration/commons-week-companion.js?v=20261015-unified-1"></script>
```

- `commons-week-companion.js`: floating launcher, dragging, collapse/restore, Week 1/2 context messages, and iframe lifetime.
- `../week-context-pilot/index.html`: authenticated discussion list, Start conversation control, composer integration, and replies.
- `../week-context-pilot/start-conversation.js`: conversation form, limits, account/week-scoped drafts, and existing Firestore starter write.
- `../week-context-pilot/context.js`: read-only study metadata adapter; its identifiers remain provisional.

Root script, embedded iframe, and composer import use the `20261015-unified-1` cache marker. Existing `commons` URLs, IDs and the `commonsWeek` message protocol are retained. Weekly conversations now read and write the existing `study` community; previous Kingdom Projects posts remain there and are not moved.

## Verification

From the repository root, with Playwright and Chromium available:

```sh
node 'My Partner/collaboration/messaging/commons/production-integration/check-start-conversation.cjs'
```

The script accepts `CHROMIUM_PATH` (default `/usr/bin/chromium`). This cloud machine exposes Playwright through `NODE_PATH=/opt/codex/cua_node/lib/node_modules`. Screenshots go to `/tmp`.

The test exercises the actual production module, embedded page, and composer with Firebase doubles: Week 1 at 1440px and Week 2 at 390px, study-only membership and read/write paths, week-specific filters and all-study browsing, empty discussion lists, exact starter path/fields, failed-send retry, permission-denied messages, pinned study references, duplicate-submit prevention, text rendering, close/minimize, owner-only draft recovery after account changes/reload, length/title validation, and stale membership/context responses. It does not send live test messages or establish deployed Firebase authorization.

## Remaining limits

- Bible Study & Investigation membership is required, with no automatic joining. Existing Kingdom Projects membership alone does not grant access.
- Related discussions remain word matches within the 20 recent starters, rather than verified corpus relationships.
- Editing/deleting messages is not available in this pilot.
- Linked Messaging screens stay in the floating iframe and use the shared shell. Return to study closes the window without reloading the reading. Direct visits return through a normal app link.
- Actual signed-in Firebase posting and cross-device delivery require verification on the published origin. The cloud environment currently cannot reach Firebase’s SDK CDN or homegroups.org through its outbound proxy.

## Rollback

Restore the preceding versions of root `index.html`, the integration module, and embedded pilot, and remove the new composer import/helper if rolling back this release. No data migration is required. Already-posted conversations remain in the existing Firebase collection.

## Unified Messaging screens — October 15, 2026

The live conversations, activity, directory, member-profile and sign-in pages now use [messaging-shell.css](../messaging-shell.css) and [messaging-shell.js](../messaging-shell.js). They share the production companion’s navy surfaces, gold headings and cream header, with consistent Conversations / Activity / Communities / Profile / Account navigation. The existing local preview uses the same theme but remains explicitly labeled as sample data; live navigation no longer routes into it.

Links leaving the weekly panel carry the originating week and community. Explicit community links retain their own destination; changing communities updates the shell navigation. Thread links retain their source week. The shell does not read or write Firebase, change account identifiers, migrate messages, or introduce collections. Existing page modules retain account, enrollment, discussion, reply, draft and unread behavior. Product copy now describes profile saves and posting without infrastructure jargon.

The existing floating frame retains its drag, minimize, close and reopen controls while displaying these pages. Its verified same-origin iframe can request Return to study; messages from any other window are ignored. The reading page remains loaded, and reopening retains the linked Messaging screen. The week context is an originating-location hint; it is not an additional full-page discussion filter or a new corpus identity.

Run `node 'My Partner/collaboration/messaging/commons/production-integration/check-messaging-screens.cjs'` with the same Playwright/Chromium setup above. At 1440px and 390px it exercises all five actual live pages, responsive layout, full-page posting/replies/search, explicit community switches, enrollment, local group drafts, profile updates, Google/email/sign-out controls, unread deep links, week-bearing navigation, iframe handoff/return, sender validation, and preservation of the local preview. Firebase is doubled and no live messages or memberships are changed. The Week 1/2 starter regression also passes. Screenshots are local test artifacts in `/tmp`.

Rollback this visual/navigation release by restoring its changed HTML/module files and removing the shared-shell imports. Firebase content and memberships require no rollback.
