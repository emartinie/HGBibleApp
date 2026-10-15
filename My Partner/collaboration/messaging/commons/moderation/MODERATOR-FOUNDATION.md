# HomeGroups moderation — owner and moderator foundation

## Scope
Owner appoints and revokes moderators for each of the six existing communities. A moderator can later review reports assigned to their community, but cannot appoint moderators, grant themselves access, change owner status, or automatically delete posts. The first rollout is **study** (Weeks 1 and 2).

## Trust boundaries
- Owner identity must be verified independently, then bootstrapped by a trusted Firebase Admin SDK with the `homegroupsOwner: true` custom claim. **Never infer owner status from a reporter UID, email address, or editable Commons profile.**
- Only owner claim may write `commonsModeratorAssignments/{community}/members/{uid}`. A moderator assignment has `active`, `appointedAt`, `appointedBy`, and `updatedAt`.
- Moderators should be assigned to named communities, not granted blanket access.
- Client-facing UI is not security. Rules must be deployed before management controls go live.
- Existing `commonsReports` records remain inaccessible to client reads. For review, use a trusted server with Firebase Admin SDK and server-side authorization, or a separately reviewed rules strategy. Never add broad report read permissions.
- Maintain an immutable audit log for report decisions (actor UID, timestamp, community, report ID, action, rationale) on the trusted server.
- No automatic content removal. Doctrinal disagreement is not a moderation violation.

## Safe deployment sequence
1. Verify the owner's Firebase Auth UID out of band. Do not use the UID from the sample report as proof of ownership.
2. Bootstrap the custom owner claim using a trusted Admin SDK context. Have the owner sign out/in to refresh the token.
3. Back up current live rules, merge `moderator-access.rules.snippet` inside the existing database match, and test using the emulator.
4. Test owner create/update/list; moderator self-appointment denial; other-user reads denied; owner cannot change immutable assignment fields; community IDs constrained; no changes to existing Messaging access.
5. Publish rules. Only then enable an owner-only moderator management screen.
6. Build a trusted moderator review service and audit trail; verify community assignment on every request and never trust client-supplied role information.

## Decision states (future)
`pending` → `dismissed`, `resolved`, or `escalated`. Capture rationale, actor, timestamp, and audit entry. No content changes without a separately authorized, logged action.
