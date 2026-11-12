# Fellowship iPhone unification — issue #51

Review implementation on a new branch from `main` `1e31cc4` (merged PR #50).
No merge or deployment. The existing HomeGroups colors, typography, account,
community collections and Firestore rules are retained.

## Implementation and acceptance

| Issue area | Result in synthetic browser checks | Evidence |
| --- | --- | --- |
| Full-height conversation | PASS | Existing threads mount directly into Fellowship. The excursion/card is the scrolling surface; messages have no inset viewport or iframe. The composer sticks to its lower edge. |
| Navigation and containers | PASS | Compact Feed back action, one visible Fellowship title, shorter Close action, compact Menu controls, no redundant Home feed/Return to study actions inside a conversation excursion. Feed position and loaded pages survive return. |
| Integrated account | PASS | Google/email actions mount inside the same shell, without Messaging navigation. Sign-in methods are grouped under details; native presentation omits the raw member ID. Existing account controller guards and email return allowlist are reused. |
| Access verification | PASS for simulated cache/server sequences | Cached membership never grants access. A short verification phase uses neutral text; a reconnect warning appears only after 1.5 seconds without confirmation. Revocation, cache-only access and errors still disable replies and clear private content. |
| Launcher and activity badge | PASS | The study-page entrance owns the badge in normal document flow. The overlapping floating duplicate stays hidden there. A visible count explanation, accessible label and title describe the count precisely. |
| PR #50 functionality | PASS | Replies, pagination/idempotent retry, Scripture/study shared readers, private messaging, account changes, pending-operation cancellation and return context retain regression coverage. |
| Physical iPhone/provider/deployed backend | NOT TESTED | Requires separate live/device verification. |

Conversation and account controllers are mounted with independent Commons lifecycle
scopes. View disposal and page hide invalidate operations and remove subscriptions.
The standalone account page uses the same controller, preserving its Google/email
sign-in, method linking, collision handling and email-action validation. The legacy
post-creation, directory and private-message screens retain their existing services;
this is not a replacement authentication or messaging implementation.

The open excursion follows `visualViewport` resize/scroll events at normal zoom,
including height and top offset, and releases those listeners on close. Composer
padding includes safe-area insets. Simulated viewport changes verify the event
plumbing; they do not establish Safari keyboard behavior on a physical phone.

## Why the community-access message appeared

The previous reader immediately displayed “Connect to verify your community
access” on every `fromCache` membership snapshot. Firestore commonly emits the
local snapshot before server confirmation, so that code could label a normal
bootstrap as a connectivity problem. The production iPhone event cannot be
attributed conclusively without its network/provider evidence.

The new controller still fails closed on cached metadata immediately. It changes
the initial explanation, not authorization. It retains a draft that has not yet
been exposed during initial cache verification; confirmed denial, account changes
and loss of previously verified access clear the appropriate private state. A
server read still rechecks membership directly before each reply write. A pending
cached-only warning is cancelled on confirmation or disposal. The active native
view also survives a stable token refresh, avoiding unnecessary remounts.

## What the red badge counts

The existing subscription considers up to 50 private conversations for the current
account. Its number is the sum of:

1. Incoming pending conversation requests (outgoing requests do not count).
2. Accepted conversations whose latest message is from someone else and newer
   than this browser/account's `hg-direct-read-v1:<uid>:<conversation>` marker.

It is **not** a count of individual unread messages, community replies, or all
account notifications. Multiple new messages in one conversation contribute one.
Read markers are local to this browser/account, not a server-wide read receipt;
cleared/blocked storage or another browser can change the result. The badge,
visible explanation and accessible labels now use requests and conversations
rather than implying a message total. Opening Fellowship continues to pause its
outer activity subscriptions; closing it resumes the existing behavior.

## Validation and screenshots

Run `npm run test:conversation` in `tests/fellowship` with the pinned Playwright
package and `BROWSER_PATH=/usr/bin/chromium` when using the system browser. This
includes PR #50 coverage plus `iphone-unified.test.cjs`. Run the existing Commons
client/browser tests in `tests/commons-security`; use `CHROMIUM_PATH` for its
browser executable. Rules checks use the checksum-pinned Firestore 1.19.8 local
emulator through `run-emulator.cjs` and `FIRESTORE_EMULATOR_JAR`.

**Final results:** 109/109 focused Fellowship browser/integration/context cases,
79/79 Commons client/browser checks, and 15/15 local Firestore rules groups passed
(203 total). Syntax checks and `git diff --check` passed. Six viewport screenshots
were inspected and committed with this review.

All browser records and provider actions are synthetic; unmocked external traffic
is blocked by the harness. The account-email browser fixture records a request
without sending an email. The rules suite tests the checked-in proposed rules,
not a deployed export. The historical aggregate containing obsolete pilot/filter
expectations is not certified by this focused validation.

Viewport checks cover desktop 1440×1000, 320×568, 375×667, 390×844, 844×390, and
390×420. Screenshots below use fictional content. The study screenshot intentionally
shows the harness's loading placeholders; it is evidence for entrance placement,
not a test of Bible content loading.

- [Desktop conversation](docs/fellowship-issue51/desktop-conversation.png)
- [iPhone-sized conversation](docs/fellowship-issue51/iphone-conversation.png)
- [Narrow 320px conversation](docs/fellowship-issue51/iphone-narrow.png)
- [Integrated sign-in](docs/fellowship-issue51/iphone-signin.png)
- [Account transition](docs/fellowship-issue51/iphone-account.png)
- [Study entrance and badge](docs/fellowship-issue51/study-entrance.png)

## Physical iPhone checks before release

- Safari address-bar expansion/collapse, keyboard open/close, multiline typing,
  portrait/landscape changes, and notch/home-indicator safe areas.
- Attachment picker while the keyboard is open; Send and cancellation visibility.
- Google popup completion and real email sign-in/linking, including the canonical
  standalone email callback and its explicit return to Fellowship.
- VoiceOver navigation/focus, swipe/back and back-forward cache restoration.
- Real member exchange, membership revocation, intermittent network and deployed
  rules verification. In-flight writes already dispatched cannot be cancelled;
  lifecycle guards prevent later dispatches and stale feedback.
