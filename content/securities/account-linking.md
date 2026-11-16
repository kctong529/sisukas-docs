---
weight: 4
title: "Account Linking"
description: "Explicit provider linking, identity guarantees, conflict handling and tested OAuth callback policy."
---

> [!NOTE]
> **#215 status — verified locally against Supabase Test.** The linking policy and OAuth callback paths were exercised through Better Auth with a controlled test provider. Public Google/GitHub sign-in and account-management UI are planned, not deployed by #215.

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

## What remains outside #215

- Google OAuth provider configuration and public sign-in (#216).
- Connected methods, explicit Connect/Disconnect controls and recovery UX (#217).
- Deployment acceptance and staged rollout (#218).

See [Authentication Architecture](../../architecture/authentication/), [Authentication Data Model](../../architecture/authentication-data-model/), and [Authentication Testing](../../dev-guide/authentication-testing/).
