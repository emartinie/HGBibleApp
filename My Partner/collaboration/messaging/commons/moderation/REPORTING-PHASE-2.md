# Messaging Phase 2 — Member reporting and moderation

Status: **implementation specification; not enabled in production**.

## Scope
- Week 1 and Week 2 Messaging; reports may refer to any existing study community post or reply.
- Signed-in community members can report harassment, threats, spam, personal attacks, privacy violations, or other inappropriate conduct.
- **Disagreement over Scripture, doctrine, interpretations, or evidence is not itself a violation.**
- A report does not automatically hide, delete, or down-rank a message.

## Security finding
The checked-in root `firestore.rules` currently has no match for `commonsCommunityPosts` or `commonsCommunityMembers` and ends with a deny-all fallback. The deployed Firebase rules must therefore be inspected before any report-writing client is enabled. **Do not replace live rules with the repository file.**

## Proposed report storage
Use `commonsReports/{reportId}` with these fields:
- `reporterUid`: authenticated user's UID
- `community`: existing community ID (e.g. `study`)
- `postId`: existing post document ID
- `replyId`: optional reply document ID, otherwise null
- `reason`: one of `harassment`, `threats`, `spam`, `privacy`, `personal-attack`, `other`
- `details`: optional text, max 500 characters
- `status`: `pending` at creation
- `createdAt`: server timestamp

Do not store the reported message body or member email in the report. Reviewers can resolve the reference through the existing posts collection, reducing duplication of sensitive content.

## Mandatory rule properties before rollout
- Create: authenticated, active member of the referenced community; UID equals request.auth.uid; exact allowed fields/types, bounded lengths and reason values; createdAt equals request.time; status fixed to pending.
- Read/list: moderators only. Reporter should receive submission acknowledgement, not an exposed feed of reports.
- Update/delete: denied to members; review decisions through an authenticated privileged server/admin workflow.
- Rate limiting and duplicate-report controls: implement server-side or enforce one deterministic report ID per reporter/target; client-only throttling is not security.
- Verify membership checks against actual live community rules and consider deleted posts and replies.
- Do not grant moderator access based on an editable profile field.

## Rollout
1. Export and inspect the live Firebase rules and confirm privileged moderation access.
2. Implement and test report submission for post and reply in both floating and full Messaging.
3. Deploy only the additive, validated report rules; preserve all existing live rules.
4. Test signed-in report, signed-out rejection, nonmember rejection, unauthorized read, duplicate reports, and mobile UI.
5. Introduce private review queue and moderator action/audit trail; no automatic removal.

## UX copy
“Report content” opens a short form explaining: “Reporting is for harmful or inappropriate conduct, not differences in biblical interpretation. Reports are private and do not automatically remove content.”
