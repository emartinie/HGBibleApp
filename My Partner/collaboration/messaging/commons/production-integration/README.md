# Week 1–2 production Messaging integration

The production app shell loads `commons-week-companion.js`. It opens the existing Week 1/2 Messaging page in a floating iframe, using the same Firebase account, Kingdom Projects membership, discussion starters, and replies as the full conversation page.

## Start a conversation

1. Open Week 1 or Week 2 and select the floating **Messaging** button.
2. Sign in and join Kingdom Projects if prompted.
3. Select **Start conversation** above the discussion filters, including when no discussions exist.
4. Enter a title and opening message. The optional study link stays tied to the week where the draft was started.
5. Select **Post conversation**. On confirmed creation, the panel opens the new thread; use **← Discussions** to return to All recent.

The title, message, and optional study link together have the existing 1,200-character body limit. A starter uses the established `[HG-TITLE:...]` body prefix and writes only `uid`, `authorName`, `body`, and a server timestamp to `commonsCommunityPosts/projects/posts`. Firebase rules, content files, and existing messages are unchanged. New replies continue to use the existing reply paths.

Drafts are scoped to the signed-in account, community, and originating week. They survive failed sends, list navigation, and tab reloads when sessionStorage is available. If browser storage is blocked, an in-memory draft remains in the open Messaging window. Signing out or changing accounts removes the old account’s composer from view. Posting uses the current authenticated UID, and stale membership or week-context results cannot authorize a new account or overwrite a newer context.

## Wiring and cache refresh

```html
<script type="module" src="My%20Partner/collaboration/messaging/commons/production-integration/commons-week-companion.js?v=20261015-compose-1"></script>
```

- `commons-week-companion.js`: floating launcher, dragging, collapse/restore, Week 1/2 context messages, and iframe lifetime.
- `../week-context-pilot/index.html`: authenticated discussion list, Start conversation control, composer integration, and replies.
- `../week-context-pilot/start-conversation.js`: conversation form, limits, account/week-scoped drafts, and existing Firestore starter write.
- `../week-context-pilot/context.js`: read-only study metadata adapter; its identifiers remain provisional.

Root script, embedded iframe, and composer import use the `20261015-compose-1` cache marker. Existing `commons` URLs, IDs, Firebase paths, and the `commonsWeek` message protocol are retained for compatibility with the published rename.

## Verification

From the repository root, with Playwright and Chromium available:

```sh
node 'My Partner/collaboration/messaging/commons/production-integration/check-start-conversation.cjs'
```

The script accepts `CHROMIUM_PATH` (default `/usr/bin/chromium`). This cloud machine exposes Playwright through `NODE_PATH=/opt/codex/cua_node/lib/node_modules`. Screenshots go to `/tmp`.

The test exercises the actual production module, embedded page, and composer with Firebase doubles: Week 1 at 1440px and Week 2 at 390px, empty discussion lists, exact starter path/fields, failed-send retry, permission-denied messages, pinned study references, duplicate-submit prevention, text rendering, close/minimize, owner-only draft recovery after account changes/reload, length/title validation, and stale membership/context responses. It does not send live test messages or establish deployed Firebase authorization.

## Remaining limits

- Membership is Kingdom Projects only, with no automatic joining.
- Related discussions remain word matches within the 20 recent starters, rather than verified corpus relationships.
- Editing/deleting messages is not available in this pilot.
- Full Messaging/account/community links may navigate inside the iframe; top-level handoff remains separate work.
- Actual signed-in Firebase posting and cross-device delivery require verification on the published origin. The cloud environment currently cannot reach Firebase’s SDK CDN or homegroups.org through its outbound proxy.

## Rollback

Restore the preceding versions of root `index.html`, the integration module, and embedded pilot, and remove the new composer import/helper if rolling back this release. No data migration is required. Already-posted conversations remain in the existing Firebase collection.
