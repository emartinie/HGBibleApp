# Conversation-first Fellowship pilot

This is an **isolated experimental presentation**, not a replacement for the current Fellowship card or Commons conversations page. It reads and writes the **existing** Commons Firestore collections and reuses the existing HomeGroups `addContentControl` and `sharedReading` functions.

## Open a specific existing conversation

`/prototypes/fellowship-conversation-first/?area=study&post=z9UetXFb1nrqwe8YFmkZ`

The example post ID is taken from an existing user-supplied conversation link. The pilot is **not yet deployed** from the draft branch; this URL only works after publishing the branch to an isolated preview environment or intentionally merging.

## First-screen contract

- One conversation header, messages, composer, and hidden-until-open Add Content.
- No embedded iframe, new-discussion form, topic browser, instructional wall, or permanent community selector.
- The existing community membership and Firestore rules remain authoritative.
- Replies are real writes to the existing reply collection. A generated stable ID and server check protect retries of the same pending reply.
- Drafts remain account/community/post scoped in session storage.
- Scripture/study attachments use existing canonical `Reading:` links.

## Deliberately excluded

No new posts, reactions, private messaging, feed navigation, reader-in-place, or migration. Those are later work, **not** claimed as complete.

## Required verification before any merge

1. Sign-in and denied/nonmember cases, including account switch and anonymous auth.
2. Existing post and replies load; test zero, 30, and 31+ replies.
3. Reply send, failed send and retry; confirm no duplicate and draft retention.
4. Scripture and weekly study attachments persist and render as links.
5. Mobile and desktop sizing; keyboard, focus, safe area, long text.
6. Navigate back to Fellowship and return without losing state.
7. Confirm this pilot does not alter existing production routes.
8. Review security, CSP, and Firestore permissions before publishing.

**Known limitation:** no automated or physical-device verification has been run. This is a first implementation for review, not a release candidate.
