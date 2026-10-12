# Commons membership production pilot — controlled activation

Date: 2026-10-12
Project: existing Firebase project `homegroups-app`
Scope: `commonsMembers/{uid}` private member profiles only.

## Verified by source inspection
- Root `firestore.rules` and `firestore.rules.proposed` were fetched from GitHub on 2026-10-12.
- Proposed file retains the existing rules and inserts only `validCommonsProfile` and `commonsMembers/{memberId}` rules before the final catch-all deny.
- `firebase.json` targets the default database and root `firestore.rules`.
- Client uses explicit Join Commons; local drafts are retained.
- **No emulator tests or production deployment have been performed.** Do not claim security testing complete.

## Before activation
1. Confirm Firebase project and current live Firestore rules match the GitHub baseline (Console may have unpublished or manual edits).
2. Back up current live rules (copy exact contents into a private backup).
3. Emulator-test own create/get/update, invalid fields, another UID, unauthenticated access, list denial, immutable createdAt, and existing Prayer Map operations.
4. Merge the reviewed Commons block into root `firestore.rules`, or paste the complete reviewed proposed file into Firestore Rules console if live baseline is identical.
5. Publish the rules only after explicit approval.

## Smoke test
1. Open `https://homegroups.org/My%20Partner/collaboration/messaging/commons/member/?v=7645b1b`.
2. Google sign-in. Enter a display name, optional introduction, and starting area.
3. Click **Join Commons**. Confirm success status.
4. Confirm Firestore document `commonsMembers/{FirebaseAuthUID}` has correct data and timestamp fields.
5. Sign out/in; confirm cloud membership loaded and **Update Commons profile** is offered.
6. Open directory and confirm cloud-saved membership status.
7. Use a second signed-in account for cross-account denial testing before public rollout.

## Emergency disable (minimal blast radius)
In Firebase Console > Firestore Database > Rules, replace only the `commonsMembers/{memberId}` match block with:
```
match /commonsMembers/{memberId} {
  allow read, write: if false;
}
```
Keep every other match block intact. Publish. This immediately blocks future client access to member profiles. Existing Firestore data is not erased, and previously disclosed data cannot be recalled. Restore reviewed rules only after correcting the issue.

## Important
- The Auto-ID placeholder in `commonsMembers` is not a member account. Leave it alone until cleanup.
- Avoid deploying `firebase deploy --only firestore:rules` from a workspace with an unmerged root file: `firebase.json` points at root `firestore.rules`, not the proposed file.
- Do not replace the entire production ruleset with only the Commons block.
- Intern's independent post-deployment review remains outstanding.
