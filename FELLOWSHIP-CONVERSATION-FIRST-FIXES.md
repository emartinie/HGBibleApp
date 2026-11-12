# PR #50 conversation-first corrections

November 12, 2026. Existing branch: `codex/fellowship-feed-visible-posts`.
Base reviewed: `main` at `6aa1491`; corrections start at PR head `36ce68d`.

## Result

Existing community threads keep the conversation-first presentation. The controller
is now in `js/fellowship-conversation.js` and uses the existing Commons lifecycle
adapter. Closing or disposing Fellowship, navigating away, or changing identity
invalidates asynchronous work before another write can be issued. Each awaited
reply lookup is followed by a session/access check. Account transitions also
clear the old visible draft and its session-storage key.

A server-confirmed membership observer gates thread loading and the composer.
Revoked, cached-only or failed membership verification clears the thread,
disables the form and invalidates pending operations. Membership is checked with
the server again immediately before a reply write. Firestore remains the final
authorization boundary; no rules, schemas, claims, authentication configuration,
or production data were changed. A request already dispatched to Firestore cannot
be cancelled by closing a client view; the guards prevent subsequent dispatches
and stale completion feedback.

Canonical Scripture and weekly study attachments use the existing shared-reader
bridge. The discussion stays mounted with its draft and scroll position. Private
messaging uses the existing recipient/request screen; showing the action neither
creates a request nor grants permission to send. Self and malformed author IDs do
not receive this action. Return mementos contain only navigation, scroll position
and a bounded reply count, scoped to the current identity.

Replies initially load the newest 30 records and display in chronological order.
“Load earlier replies” fetches preceding pages. Acknowledged submissions enter the
current view immediately without resetting pagination. IDs deduplicate fetched and
locally acknowledged replies; retrying a lost acknowledgement reuses its ID. Text
typed during a pending send remains in the composer.

Embedded padding and sizing now fit the iframe content box. The excursion supplies
one visible Fellowship title. Messages scroll while the composer stays visible.
The new-post composer retains its existing flow.

## Reproducible validation

Use the pinned dependencies in `tests/fellowship` and `tests/commons-security`.
On Linux with a system browser, set `BROWSER_PATH=/usr/bin/chromium` for Fellowship
and `CHROMIUM_PATH=/usr/bin/chromium` for Commons browser tests. Otherwise use the
installed Playwright browser (or the existing Windows Edge default).

- `cd tests/fellowship && npm run test:conversation`: conversation regressions,
  excursion, feed, presentation, study sharing, context and existing integration.
- `cd tests/commons-security && npm test`: client state and lifecycle checks.
- `cd tests/commons-security && npm run test:browser`: existing direct/direct-live
  messaging at desktop and mobile widths.
- `cd tests/commons-security && FIRESTORE_EMULATOR_JAR=/path/to/cloud-firestore-emulator-v1.19.8.jar npm run test:rules`:
  checksum-pinned local demo emulator; no production fallback.

The Fellowship fixture now represents the checked-in version-2 authenticated
rollout and respects reply ordering, cursors and limits. Browser checks block
unmocked external traffic and use fictional records. The new regression cases
exercise pending profile, reply-existence and membership lookups across closure,
disposal, revocation and account changes, including A-B-A. Layout checks cover
1440×1000, 390×844, 844×390, 390×420 and 320×568. Screenshots were inspected.

Final results: **90/90** focused Fellowship browser/integration/context checks,
**79/79** existing Commons client/browser checks, and **15/15** local Firestore
rules groups passed (184 total). Three affected JavaScript modules passed syntax
checks; `git diff --check` passed.

The focused command is the review gate for this correction. The full historical
`npm test` also includes older pilot-window and legacy discussion/filter tests;
this correction does not certify that historical aggregate as green.

## Limits and handoff

No live Firebase/provider exchange, deployed-rules inspection, physical iPhone
Safari/native keyboard, or assistive-technology verification was performed.
Reduced browser viewports do not establish native keyboard behavior. The rules
suite exercises the checked-in proposed rules, not a deployed-rules export.
No merge, deployment or production operation is authorized by these results.
