# HomeGroups Commons — first interface prototype

October 9, 2026 · Partner · all changes scoped to My Partner/.

Open index.html through a static web server. No build step, frameworks, CDN dependencies, or Firebase writes. app.js contains a replaceable LocalRepository adapter. Sample conversations are fictional. The public preview is not suitable for private content.

## Working first-pass features
Community spaces, conversation search, thread creation, message sending, reply attribution, local persistence, reading-position memory per browser tab, explicit mark-read, task creation/status and board, source-linked sample decisions, explicit handoff acknowledgment and answer linking, copy fallback, JSON export, demo reset, and same-browser cross-tab storage refresh. Notification delivery and authenticated privacy are not implemented. No real agent has access through this UI.

## Storage
Browser localStorage key hg-partner-commons-v1. Message sending writes only here, not to GitHub or other members' devices. Storage errors show an export reminder. Reset requires confirmation. Read state is for the one demo participant. Source text is escaped before display. Prototype methods and browser prompts are intentionally small; custom forms, paginated history, stable read cursors, and authenticated roles belong in the integration iteration.

## Firebase handoff
No Firebase setup is needed to review this first draft. For a separate live test, agree on an isolated project/database first. Plan Authentication provider and invite-only membership, a reviewed group/thread/message schema, enforced rules and emulator tests, and server-mediated notification delivery. Do not weaken current production rules or place service-account credentials in this repo. Decide app registration and notification prerequisites after device/platform review. The browser adapter boundary is preparation, not a complete Firestore adapter.

## Verification
JavaScript syntax checked with node --check. Browser smoke script check.cjs covers sending, escaped markup, persistence, navigation, task status, thread creation, and mobile overflow. Browser execution status is recorded in QA.md. Source inspection is not proof of authenticated privacy, network synchronization, or push notifications. No deployment or live service state is claimed.

## Prayer Map update — October 9
Prayer Map navigation now includes a schematic world illustration with public sample markers, group-only requests omitted from markers, local prayer acknowledgments, request creation, and conversation follow-up (confirmation before copying request text). No precise location collection. Group-only visibility remains illustrative, not authenticated privacy.

Source inspection: js/firebase-init.js exports existing app/db/auth for homegroups-app; js/prayermap.js reads prayers and creates requests with Google sign-in. Repository firestore.rules allows public prayer reads, Google-authenticated creates, and no updates/deletes. Deployed rules and live service configuration were not verified. Existing project/configuration may be reused with reviewed new membership-protected collections; no new database is yet established as necessary. No credentials copied and no Firebase connection activated.

Updated JavaScript passed syntax check. Browser checks remain unexecuted. Public/static site may update on commits; refresh after hosting publishes the new version.
