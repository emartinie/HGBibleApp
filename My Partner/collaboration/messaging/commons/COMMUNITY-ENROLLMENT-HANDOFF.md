# Community enrollment pilot — October 12, 2026

## Implemented
- Directory has Join/Leave controls for the six established areas.
- Firestore path: `commonsCommunityMembers/{communityId}/members/{auth.uid}`.
- Member profile must exist at `commonsMembers/{auth.uid}` before joining.
- Client reads only the signed-in member's own enrollment documents.
- Proposed additive rules appended in `firestore.rules.proposed`; **not deployed**.
- Existing member profiles, group drafts, and Prayer Map remain unchanged.

## Current behavior
The directory disables enrollment buttons when Firestore denies reading enrollment records. After rules are published, it will enable them and use Firebase server timestamps. Group discussions and public member lists are not implemented.

## Security review and activation
1. Compare currently deployed rules to the proposed rules; preserve any changes made in Firebase Console.
2. Test: owner get/create/delete, owner update denied, foreign UID get/create/delete denied, list denied, unauthenticated denied, invalid area denied, non-member create denied, invalid fields denied, timestamp forged denied.
3. Confirm existing Prayer Map and member profile operations are unaffected.
4. Publish only after approval. No automatic Firebase deployment is performed here.
5. Rollback: replace the `commonsCommunityMembers` match with `allow read, write: if false;` while preserving all other rules.

## Known limitations
- No community registry documents: area names and descriptions remain defined in directory UI.
- No member-to-member access or group messaging yet.
- No emulator testing has been performed. Independent intern audit remains pending.
