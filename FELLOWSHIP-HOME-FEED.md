# Fellowship unified home feed

Review branch: `codex/fellowship-unified-feed`, based on main `4ab3824a1c06eac1743fe3230594b1683756df74`. November 7, 2026. No merge or deployment authorized or performed.

## Behavior and reuse

- The authorized `fellowship-live` entry defaults to Home feed. The collapsed Menu retains Prayer Map, My Communities, Explore Communities, Messages, Find People, My Profile, Account / Sign In, and Return to Bible Study.
- Six existing community IDs and each member's own `commonsCommunityMembers/{area}/members/{uid}` documents determine eligibility. No community-wide membership lists, global post query, new collection, schema, index, or dependency.
- Only joined communities receive post queries: `commonsCommunityPosts/{area}/posts`, `orderBy(createdAt, desc)`, `limit(30)`, and existing `startAfter` pagination. Source buffers are merged newest first into 30-post global pages. Older pages remain accessible; this is not a latest-30-per-community cutoff.
- Membership listeners require server confirmation; post reads use `getDocsFromServer`. Cached membership alone cannot populate the feed. Denials, lost membership, account changes, and disposal invalidate pending reads and clear previews. All six membership listeners are removed on exit. SDK errors offer retry.
- Each post shows its stored author, community, timestamp and text. No HTML is interpreted. Open discussion reuses the current discussion/reply/Scripture/private-message screen; Create post offers joined communities and opens the existing community composer. This feed adds no write implementation.
- Feed scroll position and loaded count use the existing UID/epoch-scoped in-memory context layer, including shell remounts. No posts or drafts are persisted by the feed. Account changes clear the position. Restoration reauthorizes and refetches; it is practical rather than an immutable snapshot. Restoration is bounded to 10,000 previously loaded items.
- The normal Prayer Map route and separate synthetic read-only test route keep their existing behavior. No pilot configuration, authentication, message workflow, rules, map data, or community content is changed.

## Changed components

`js/fellowship-feed.js` supplies the read-only aggregate view. `js/fellowship.js` selects it and reuses existing navigation/composition. `js/fellowship-context.js` adds content-free position restoration and recognizes home discussions. `css/fellowship.css` uses current global tokens. Focused tests extend the existing browser harness; map presentation tests now open the explicit Prayer Map view.

## Verification

All checks passed, using installed Edge with desktop/mobile emulation:

| Run | Result |
| --- | --- |
| Selected context, feed, hardening, live-gate, presentation and unification suites | 72/72 |
| Final feed confirmation after lazy-loading/disposal guards, including two additional lifecycle tests | 17/17 |
| Separate read-only desktop/mobile route, policy-first entry and ordinary Prayer Map | 4/4 |
| Settled desktop/mobile screenshot and viewport confirmation | 2/2 |
| Three affected JavaScript module syntax checks; whitespace and protected-file diffs | PASS |

These represent 78 distinct checks (15 feed cases repeated in the confirmation run, plus two repeated for final screenshots). Coverage includes empty communities, multiple memberships, chronological pagination, denied access/retry, cache-only denial, revoked membership, A-B-A/sign-out isolation, listener teardown, older discussion/reply/composer flows, selected posting community, scroll restoration, Scripture association and browser history. Delayed composer work and feed imports cannot revive disposed views. Screenshots wait for the shell's existing smooth card scroll, and were visually inspected at 390×844 and 1440×1000, in light and dark themes.

The focused feed command is `npm run test:feed` from `tests/fellowship` after installing its existing dev dependencies. The other selected files were `context.test.cjs`, `hardening.test.cjs`, `live.test.cjs`, `presentation.test.cjs`, and `unification.test.cjs`; four isolation checks were selected from `controlled.test.cjs`. No new dependencies were installed.

Browser operations use synthetic Firebase identities and records with all external requests intercepted; passing these tests does not certify production authorization. The Firestore emulator suite was not rerun for this UI change. Firebase rules and the underlying discussion query/write implementation are unchanged.

Screenshots show synthetic records in the real application shell, not production member data:

| Desktop | Mobile |
| --- | --- |
| [Dark](tests/fellowship/screenshots/home-feed/feed-desktop-dark.png) | [Dark](tests/fellowship/screenshots/home-feed/feed-mobile-dark.png) |
| [Light](tests/fellowship/screenshots/home-feed/feed-desktop-light.png) | [Light](tests/fellowship/screenshots/home-feed/feed-mobile-light.png) |

## Limits and release checks

- Posts refresh on entry, return, or membership changes, matching the existing query-based discussion approach. This change does not add a continuously updating post listener, rankings, blocking, or moderation features.
- Offline access deliberately does not show cached feed content. Unverified or denied community access fails closed rather than showing a partial feed.
- Physical iPhone/Safari, screen-reader behavior, real provider authentication, real member operations and active deployed Firebase release identity were not tested here. Existing production authorization and historical Prayer Map privacy gates remain separate; no live records or historical datasets were inspected or modified.
- Before an approved release, manually verify authorized test-account membership, posting/replies, account switching, and iPhone Back/scroll behavior against the independently confirmed active rules. Use only the owner's designated test accounts and approved records. This PR does not authorize those operations or change rollout eligibility.
- GitHub Pages publishes `main / (root)`. Review and explicit owner approval must precede merge/publication.
