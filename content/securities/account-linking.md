---
weight: 4
title: "Account Linking"
description: "Explicit provider linking, identity guarantees, conflict handling and tested OAuth callback policy."
---

> [!NOTE]
> **Status — 16 November 2026.** #215 policy and callback invariants were verified using a controlled provider and Supabase Test. Real Google sign-in (#216) is now deployed on Test, without automatic linking. Connected-method UI and authenticated Connect Google (#217) remain pending; GitHub OAuth is not implemented.

## Linking is not account merging

The internal **`user.id`** defines who owns Sisukas data. An external `(provider_id, account_id)` identifies a login method. Linking an additional method means **adding an `account` association to an already authenticated user**, never silently consolidating two existing Sisukas users.

![Sign-in and explicit linking sequence](/images/architecture/auth/signin-linking-sequence.svg)

Ordinary sign-in with an already linked provider resolves to the associated user. For an unlinked provider whose email matches an existing magic-link user, implicit linking is disabled: the person must authenticate with the existing method and explicitly initiate the linking flow. New verified OAuth identities can register as new users when eligible; that test behavior does not mean a public provider is enabled.

## Effective linking policy

The Better Auth configuration in `backend/src/modules/auth/config/accountLinkingPolicy.ts` specifies:

| Setting | Value | Consequence |
| --- | --- | --- |
| `enabled` | `true` | Explicit linking API is enabled |
| `disableImplicitLinking` | `true` | An email match does not automatically link identities |
| `allowDifferentEmails` | `false` | Explicit linking requires matching emails |
| `allowUnlinkingAll` | `false` | Prevents removing every linked provider account under Better Auth's policy |
| `updateUserInfoOnLink` | `false` | Linked provider details do not automatically overwrite the user profile |

The explicit-linking callback also checks the authenticated session, state and eligible provider identity. Verified email and provider trust are part of that validation. The database's `(provider_id, account_id)` unique index provides an additional integrity guarantee.

![Account-linking decision and rejection flow](/images/architecture/auth/linking-decision-flow.svg)

> [!WARNING]
> `allowUnlinkingAll: false` should not be described as a complete account-recovery guarantee. Magic-link users can have zero provider-account rows, so future connected-method UI must reason about available authentication methods, not just `account` count.

## Tested security properties

The nine OAuth callback integration scenarios cover: same-email implicit merge refusal; successful explicit linking without changing the user/data owner; rejection of another user's provider identity; different/unverified email; cancelled authorization; invalid callback state; new verified identity signup; and expired linking sessions. Seven additional account-linking HTTP tests cover session requirements, account enumeration/unlink isolation and provider-identity uniqueness.

These tests establish **specific observed invariants**. They do not mean every rejected OAuth flow is entirely side-effect-free in temporary verification/session tables, nor do they replace browser verification after Test deployment.

## Observed behavior on Test — 16 November 2026

- New Google identities can sign in and retain application data across repeated Google sign-ins.
- A Google-created account can subsequently sign in via an email magic link and access the same observed data. The exact `user.id` correspondence remains to be verified explicitly (#218).
- Google sign-in with the email of an **existing unlinked magic-link user** fails with `account_not_linked`; there is no silent provider association. The current backend-root redirect provides no meaningful explanation, so error recovery is tracked by #222.

These directions of sign-in are not equivalent: magic-link authentication need not create an OAuth `account` association, and the observed magic-link access is **not evidence** that the explicit provider-linking flow has been implemented.

## What remains outside #215

- Google sign-in on Test is implemented by #216; its callback-failure UX is tracked by #222.
- Connected provider display and authenticated Connect Google belong to #217. Do not infer usable login methods only from `account` rows.
- Deployed identity regression, Production migration and rollout acceptance remain #218.
- GitHub OAuth remains under #37.

See [Authentication Architecture](../../architecture/authentication/), [Authentication Data Model](../../architecture/authentication-data-model/), and [Authentication Testing](../../dev-guide/authentication-testing/).
