---
weight: 4
title: "Account Linking"
description: "Explicit provider linking, identity guarantees, conflict handling and tested OAuth callback policy."
---

> [!NOTE]
> **Status — 16 November 2026.** #215 security policy and database uniqueness are verified on Supabase Test; Google sign-in (#216), frontend OAuth failure recovery (#222), and authenticated account linking with connected-method UI (#217) are implemented and exercised on **Test**. Google remains disabled in Production; GitHub OAuth is not implemented.

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

Better Auth validates the authenticated linking session, OAuth state, verified provider email, and provider identity. The database's `(provider_id, account_id)` unique index provides an additional integrity guarantee. The frontend additionally checks the original user identity and the confirmed provider association before reporting success; these browser checks are not a substitute for backend authorization.

![Account-linking decision and rejection flow](/images/architecture/auth/linking-decision-flow.svg)

> [!WARNING]
> `allowUnlinkingAll: false` should not be described as a complete account-recovery guarantee. Magic-link users can have zero provider-account rows, so the connected-method UI represents magic-link availability separately from OAuth provider rows. Disconnect remains unavailable until method-aware recovery and last-usable-method safeguards exist.

## Tested security properties

The nine OAuth callback integration scenarios cover: same-email implicit merge refusal; successful explicit linking without changing the user/data owner; rejection of another user's provider identity; different/unverified email; cancelled authorization; invalid callback state; new verified identity signup; and expired linking sessions. Seven additional account-linking HTTP tests cover session requirements, account enumeration/unlink isolation and provider-identity uniqueness.

These tests establish **specific observed invariants**. They do not mean every rejected OAuth flow is entirely side-effect-free in temporary verification/session tables, nor do they replace browser verification after Test deployment.

## Implemented Connect Google and callback recovery (#217)

1. A signed-in user opens **Account settings**. `listAccounts()` supplies connected OAuth providers; email magic-link availability is presented separately.
2. **Connect Google** starts Better Auth `linkSocial()` in the current authenticated session, not an independent sign-in. The request uses Google's `prompt=select_account` to let users choose another identity on retry.
3. A 15-minute timestamped browser marker captures the original `user.id` for consistency checking. Better Auth retains responsibility for OAuth state, session authorization and provider ownership.
4. After redirect, the client re-reads the session and connected methods. Success is reported only if the original `user.id` remains current **and** Google is now connected.
5. Rejected or uncertain results display actionable feedback; `email_doesn't_match` / `email_does_not_match` explain that different-email linking is not yet supported. Invalid markers, missing sessions, expired callbacks and provider conflicts cannot be treated as success.

**Manual Test evidence (16 November 2026):** a magic-link-only user connected a matching Google identity and subsequently used each method with the same `user.id` and existing data. A Google-created user also signed in via magic link with the same canonical `user.id`. Different-email linking was rejected with unchanged identity/data; users could retry using Google's account chooser and complete a matching-email link. Account settings keyboard navigation, focus return and narrow mobile usability were checked. A real Google cancellation UI path was not independently exercised; controlled-provider callback tests cover cancellation and invalid state.

**Error recovery (#222):** ordinary Google sign-in with an existing unlinked magic-link email returns `account_not_linked` to the **frontend sign-in modal** with instructions to sign in by magic link first. It no longer strands the browser on the backend root. This is distinct from an authenticated linking failure.

## Scope and rollout boundaries

- **No Disconnect UI.** `allowUnlinkingAll: false` alone does not establish recovery safety, and provider account counts are not equivalent to usable login methods.
- **No cross-email linking.** The current policy deliberately requires the same email, and no account merge is performed. Extending this requires separate recovery and ownership design.
- **No Production OAuth rollout.** Full deployment acceptance, monitoring, rollback and Production migration `0006` are tracked by #218 and the [Release Procedure](../../dev-guide/release-procedure/).
- GitHub OAuth remains under #37; expanded user-profile and session management is separate follow-up work.

See [Authentication Architecture](../../architecture/authentication/), [Authentication Data Model](../../architecture/authentication-data-model/), and [Authentication Testing](../../dev-guide/authentication-testing/).
