# Commons membership — implementation handoff (October 12, 2026)

## Status
- Implemented a Google-authenticated, opt-in Firestore membership read/create/update flow in `member/index.html`.
- Member document path: `commonsMembers/{auth.uid}`. No Auto ID.
- Uses `displayName`, `about`, `interest`, `createdAt`, `updatedAt`.
- Local drafts remain available if Firestore rules deny access.
- Proposed additive rules are at `firestore.rules.proposed` in this directory. **Not deployed.**
- Existing root `firestore.rules` and Prayer Map were not changed.

## Intern review requested
1. Verify client SDK and Firebase Auth flow in hosted member page.
2. Emulator-test owner get/create/update, unauthenticated denial, other-user denial, list denial, field validation, and timestamps.
3. Compare proposed rules against latest root `firestore.rules` before any merge.
4. Review the UI for race conditions, existing-member updates, data loss, and local-draft behavior.
5. Review Firestore document naming, consent, and separation of private vs public profiles.
6. Do not deploy rules or modify production without Eddie's approval.

## Acceptance
Eddie can explicitly join Commons, save profile, sign out, sign in on a different browser, and retrieve profile. No user may read or edit another user's private profile. Existing Prayer Map functionality remains unchanged.

## Note
An Auto-ID placeholder document exists in `commonsMembers`, created manually in Firebase Console. Leave it untouched during pilot; it is not an authenticated member document.

## October 12 continuation (intern unavailable)
- Directory now reads `commonsMembers/{uid}` after sign-in and prefers a saved cloud profile when readable. If unavailable, it uses the existing local draft and clearly labels it local-only.
- Directory commit: `69f55519003ada803acadb5c40eb47d1d7004025`.
- No Firestore rules were deployed and no production code outside `My Partner` was modified.
- Before enabling real memberships: emulator-test proposed rules, confirm current root rules match the draft's baseline, review UI and consent, then request deployment approval.
