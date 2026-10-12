# HomeGroups identity and authentication architecture

Decision: A HomeGroups member identity is independent of the way the member authenticates. No provider is preferred.

## Identity invariant
- One member has one stable Firebase Auth UID for the current backend, with commonsMembers/{uid} as the canonical Commons profile.
- Community enrollments, posts and replies continue to refer to that stable UID.
- Google, verified email-link, email/password, Apple and other supported providers are optional, linked credentials, not separate member types.
- Existing Google accounts remain valid; never silently migrate, overwrite, or merge identities.
- A new sign-in method must be explicitly linked while the member is authenticated; handle credential-already-in-use and email-collision cases without automatic merging.
- Account recovery, unlinking, deletion and lost-access cases need a defined policy; never allow unlinking the final usable method.
- Email-link login does not make the underlying Firebase service independent of Google. Explain that clearly in privacy disclosures.

## Security work before enabling
1. Inventory all auth provider checks in Commons UI and proposed Firestore rules.
2. Replace Google-only authorization assumptions with authenticated-member and, where appropriate, verified-email checks. Continue to enforce enrollment, ownership, post validation, and default-deny.
3. Test an existing Google member, a new email-only member, linked sign-in methods on one UID, and cross-account denials.
4. Enable desired providers in Firebase Console, configure authorized domains and email action handling, then publish carefully merged rules after comparison with live Prayer Map rules.
5. Add a neutral HomeGroups sign-in screen and a member-controlled 'Sign-in methods' panel.
6. Do not enable public signups until moderation and abuse controls are ready.

Status: Architecture decision documented only. No authentication providers, deployed rules or live UI changed.
