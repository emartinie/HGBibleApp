# Member reporting deployment — gated rollout

The actual Firebase Console rules were provided on October 15, 2026 and include the live Commons membership and post permissions. **Do not publish the older repository root `firestore.rules`**; it omits those rules.

## 1. Rule deployment
1. Back up the entire current Firebase Console rules text.
2. Merge `firebase-report-rules.snippet` **inside** `match /databases/{database}/documents`, above the final catch-all deny. Keep all existing rules.
3. Run the Firestore rules simulator or emulator for the following:
   - Signed-in enrolled study member can create a pending report for an existing post.
   - Signed-in enrolled member can create a report for an existing reply.
   - Nonmember and unauthenticated users cannot create reports.
   - Members cannot read/list/update/delete reports, including their own.
   - Incorrect reporter UID, nonexistent target, malformed fields, other community, or forged timestamps are rejected.
   - A second write to the same deterministic document ID is rejected.
   - Existing study posts and replies remain readable/writable under their existing constraints.
4. Publish only after those checks pass.

## 2. Application rollout
- Report form code is present but submission remains disabled until deployment confirmation.
- Once rules are published, wire the client to `setDoc(doc(db,'commonsReports',reportId), payload)`, using the deterministic ID from the rules, and `serverTimestamp()`.
- Handle permission-denied, duplicate-report, offline, and transient errors without losing the member's explanation.
- Test desktop and iPhone in the Week 1 and Week 2 companion and full Messaging.

## 3. Moderator operations
- Client Firestore rules intentionally deny reading reports to all regular users.
- For initial review, use Firebase Console with administrator credentials; do not add a public review feed.
- Later, implement a privileged Admin SDK review service with authenticated moderator claims, audit trail, and appeal path. Avoid allowing a user-editable profile to grant moderation privileges.
- A report does not automatically hide or delete content.

## 4. Deployment coordination
Do not flip the client submission switch before the live rules are published. GitHub changes alone do not deploy Firestore rules to Firebase.
