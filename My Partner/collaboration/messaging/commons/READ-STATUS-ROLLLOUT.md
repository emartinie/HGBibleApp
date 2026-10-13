# Commons cross-device read-status rollout (proposal)

Status: NOT DEPLOYED. Authentication is out of scope. The existing browser-local unread tracking remains active.

## Firestore rules proposal

See `firestore.rules.proposed` for the new match:

`commonsDiscussionReads/{userId}/communities/{communityId}/posts/{postId}`

- `get`: only the signed-in owner who is still enrolled in that community.
- `list`: denied to everyone.
- `create/update`: only that owner, enrolled, for an existing post, with exactly `seenAt: request.time`.
- `delete`: denied.

These rules are not active merely because they are committed to GitHub. Do not deploy this proposal wholesale without comparing it against the **current live Firestore rules**, particularly the Prayer Map permissions. The repository root Firebase rules may differ from live rules.

## Rollout plan

1. Review and merge **only the new read-marker match** into the live rules, then publish via Firebase console after validation.
2. Confirm with two signed-in test users: owner can get and write own marker, cannot list markers, cannot read/write another user's marker, and a nonmember cannot write a marker for a community.
3. Update activity page to load individual read markers via `getDoc` for up to 60 loaded discussions, with per-user browser-local state as a fallback on permission/network errors. Do not use collection queries: list is denied.
4. When a user opens a discussion from activity, use `setDoc(..., {seenAt: serverTimestamp()})`; refresh the indicator only after confirmed write, or retain the local fallback if offline.
5. For unread comparison use latest post/reply activity timestamp vs `seenAt`; note that only the most recent 10 starters per community are loaded, and only the latest reply per discussion is queried.
6. Test cross-device behavior and ensure the activity page continues to work if the rules are not yet deployed.

## Constraints

- Never store other users' read markers in public profiles.
- Never grant collection-list access to private markers.
- Never overwrite live Prayer Map or unrelated security rules.
- Do not deploy from root `firebase.json` until the root rules are reconciled with the live Firebase rules.
