---
title: "Securities"
weight: 5
---

> [!NOTE]
> Part of Sisukas' overall architecture. See [Architecture Overview](../../architecture/) 
> for how security fits in.

# Security Layers Overview

Sisukas implements **defense in depth** with two complementary security layers:

1. **Route Protection** (Express middleware) - Application-level authorization
2. **Row-Level Security** (Supabase policies) - Database-level access control

Together they prevent data breaches from multiple attack vectors.

## Why Both Layers?

**Layer 1 problem:** A bug in a route handler could leak data.

**Layer 2 problem:** An attacker could bypass the API entirely and access the database directly.

**Solution:** Use both. If one fails, the other catches it.

```
User → API Request
       ↓
    [Layer 1: Route checks user owns resource]
       ├─ ✅ Passes → Continue
       └─ ❌ Fails → 403 Forbidden
       ↓
    [Layer 2: Database filters by user]
       ├─ ✅ User owns rows → Return data
       └─ ❌ User doesn't own rows → Return nothing
```

## Attack Scenario

**Without RLS:** Attacker finds Supabase URL, creates their own client, and reads all users' data.

```typescript
// Attacker bypasses the API entirely
const attackerClient = createClient(supabaseUrl, anonKey);
const victimData = await attackerClient
  .from('user')
  .select('*')
  .eq('id', 'victim-id');
// Result: TOTAL BREACH ❌
```

**With RLS:** Database automatically filters queries.

```typescript
// Same attack, but RLS is enforced
const victimData = await attackerClient
  .from('user')
  .select('*')
  .eq('id', 'victim-id');
// Database executes:
// SELECT * FROM user WHERE id = $1 AND auth.uid() = id
// Result: Returns 0 rows - Data Protected ✅
```

## The Layers in Detail

| Layer | Protects Against | When It Fails |
|-------|------------------|---------------|
| **Route Protection** | Invalid requests, unauthorized access | Bug in route handler forgotten ownership check |
| **RLS** | Direct database access, SQL injection | All application code bypassed |
| **Both** | Multiple attack vectors | Single point of failure |

See [User Route Protection](../route-protection/) and [Row-Level Security Testing](../row-level-security-testing/) for details.

## Testing Strategy

**Layer 1 tests** verify routes check ownership:
```bash
curl -H "Cookie: user2_token" http://localhost:3000/api/plans/user1_plan_id
# Expected: 403 Forbidden
```

**Layer 2 tests** verify RLS policies work:
```typescript
await setUser2Session(ctx.supabase, ctx.USER_2_SESSION)
const { data } = await ctx.supabase
  .from('plans')
  .select('*')
  .eq('id', user1_plan_id)
expect(data).toEqual([])  // RLS blocks access
```

Both test suites must pass for security to be verified.

## Implementation

For specific implementations, see:
- **[Route Protection](../route-protection/)** – Express middleware layer
- **[Row-Level Security](../row-level-security-testing/)** – Database layer
