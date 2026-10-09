# HomeGroups messaging and collaboration — project draft v0.1

Author: Partner. October 9, 2026. Status: consolidated product draft, ready for technical review.

## Direction confirmed by Eddie
Build a reusable HomeGroups site collaboration and messaging tool tied to Firebase/Cloud Firestore. Use a private project group for Eddie, Partner, and Intern as the initial test group. Later expand to HomeGroups users collaborating in study and service. The product is user messaging; agent automation is optional. Manual prompts to agents are acceptable and do not block success.

Partner coordinates the specification and review. Intern brings implementation and architecture recommendations. Eddie owns priorities and material authorization. No requirement exists for Intern to seek Partner's approval for every routine technical choice.

## First release experience
A member signs in, sees accessible groups and unread conversations, opens a thread, reads replies, and sends a message. Connected members see updates. Members can choose available notification preferences. In the project test group, Eddie can relay attributed agent replies and export a focused handoff for each session.

Conversation is the main surface. Tasks, decisions, and explicit handoffs are optional supporting views for a collaboration group, not mandatory steps for ordinary messaging.

## Scope
- Invite-only private groups with authenticated membership.
- Conversation threads, individually stored messages, replies, timestamps, and source links.
- Actual submitting identity distinct from attributed author; agent relays visibly labeled.
- Participant-specific read state, separate from task/handoff completion.
- Explicit handoffs: recipient, requested action, source message, acknowledgment, answer link, blocked reason or withdrawal.
- Simple optional tasks and decision records linked to conversation.
- Focused copy/export with relevant messages, scope, decisions, and requested action.
- In-app unread indicators first. Background notification delivery is part of the product plan, with supported destinations, prerequisites, permissions, and device checks specified by technical review.

Not first-release requirements: public discovery, attachments, audio/video calling, autonomous agents, arbitrary chat-session delivery, elaborate project management.

## Proposed data responsibilities
Groups own membership and access roles. Threads belong to groups; messages belong to threads. Read markers belong to actual users. Relayed participant labels are attribution metadata, never credentials. Tasks, decisions, and handoffs reference source messages. Notification preferences and delivery destinations belong to authenticated users; delivery attempts should be distinguishable from message creation.

Use stable IDs and duplicate prevention for imported relays. Preserve correction history or append corrections rather than silently replacing another author's words. Paginate history; do not require every client to load every message.

This is a conceptual contract, not a committed Firestore collection schema. Intern should propose concrete structure after inspecting existing architecture.

## Access and notifications
A private group's content is accessible only to authorized members. Membership changes, role changes, attribution, and decision recording need enforced authorization. Public repository fixture data must be fictional.

Distinguish live in-app updates, background device notifications, and agent-session participation. Firestore storage alone is not an agent channel or background push delivery service. Never put server credentials in browser code. Intern should identify a supported delivery architecture, including trusted sender, consent, failure handling, platform constraints, and emulator checks. No live cloud changes are authorized by this draft.

## Acceptance walkthrough
1. Two authorized test users exchange a message and a reply in the same private group.
2. A nonmember cannot read or write that group; an ordinary member cannot elevate roles or spoof submitting identity.
3. Updates arrive in an open second client; unread state is per user.
4. Reading a request does not mark it answered.
5. Eddie relays a sample agent reply; its attributed author and actual submitter are visible.
6. A focused handoff exports with correct source links.
7. A decision links to its authority and source; tasks remain distinct from messages.
8. Repeated import does not duplicate a relay.
9. Notification refusal, unsupported background delivery, or failure leaves messaging usable and reports the actual state.
10. A supported background notification flow is tested on target devices before being called working.

## Delivery sequence
A. Intern reviews current app/Firebase architecture and returns one recommended approach, concrete schema, isolation strategy, verification plan, and only blocking questions.
B. Build a reviewable prototype with sample data and the above walkthrough. Partner-owned writes remain inside My Partner/.
C. Implement an isolated authenticated test environment with tested rules and notification delivery after explicit scope is provided.
D. Use our private group, record friction, then refine for wider user groups.
E. Integrate/release to production under Eddie's separately defined authorization.

Routine reversible design details can use documented defaults. Bring Eddie questions only when they change product scope, privacy, costs, authorization, or a genuinely blocking choice. Review concrete results rather than requiring agreement on every detail before building.

## Focused handoff to Intern
Read this draft and the earlier collaboration messages. Review current repository architecture and existing Firebase-related code within your read authority. Return a separately attributed technical review with:
- Recommended integration and isolated prototype location.
- Existing configuration observed versus live service facts not verified.
- Concrete schema and authentication/access model.
- Notification options and prerequisites, including target-device verification.
- How each current agent session could read/submit, or the manual handoff fallback.
- First executable milestone, proposed write paths, checks, dependencies, and effort risks.
- Blocking decisions only; give a recommended default for other choices.

This handoff describes requested review for Eddie to relay under Intern's existing constraints. It does not expand Intern permissions, initiate deployment, or require an answer to every optional detail. Preserve existing application code until implementation scope is explicit.

## Evidence and handoff
Based on Eddie's October 9 discussion and [Intern's proposal](../messages/2026-10-09-intern-firebase-collaboration.md). Firebase implementation details have not been independently verified here. Documentation only; no infrastructure or production changes. Partner's write boundary remains My Partner/.
