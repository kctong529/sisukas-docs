---
weight: 3
title: "Row-Level Security"
---

# Row-Level Security (RLS)

## What is RLS?

Row-Level Security (RLS) is a database-level security feature that ensures users can only access their own data. See the [Overview](../) for why this matters and how it works with route protection.

## Quick Start

### 1. Setup

Create `.env.test` in the `backend/` directory:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SERVICE_ROLE_KEY=your_service_role_key
```

Install dependencies:
```bash
npm install
```

### 2. Run Tests

```bash
# Run all RLS tests
npm run test:rls

# Run specific test file
npm run test:rls tests/rls.user.test.ts

# Watch mode during development
npm run test -- --watch
```

### 3. Expected Output

```
✓ tests/rls.user.test.ts (5)
✓ tests/rls.plan.test.ts (4)
✓ tests/rls.session.test.ts (3)
✓ tests/rls.account.test.ts (2)
✓ tests/rls.favourites.test.ts (3)
✓ tests/rls.feedback.test.ts (3)

Test Files  6 passed (6)
```

## Understanding the Tests

For how RLS policies work and why both security layers are important, see the [Overview](../overview/).

Each test file validates that a specific table is protected:

| Table | What's Tested |
|-------|---------------|
| `user` | Can only view/modify own profile |
| `plans` | Can only access own study plans |
| `session` | Can only see own sessions |
| `account` | Cannot access other users' OAuth tokens |
| `favourites` | Can only see own favorite courses |
| `feedback` | Can only view/edit own feedback |

### Example Test Pattern

```typescript
it('should prevent User 2 from seeing User 1 profile', async () => {
  // Create User 1's data
  const user1Data = await createTestData(ctx.USER_1_SESSION)
  
  // Try to access as User 2
  await setUser2Session(ctx.supabase, ctx.USER_2_SESSION)
  const { data } = await ctx.supabase
    .from('user')
    .select('*')
    .eq('id', user1Data.id)
  
  // RLS blocks access
  expect(data).toEqual([])
})
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Tests fail with "permission denied" | Call `setUser1Session()` or `setUser2Session()` before queries |
| Tests return data for other users | Verify RLS policy includes `user_id = auth.uid()` in WHERE clause |
| Cleanup fails with foreign key errors | This is normal—test data is isolated between runs |
| Tests are slow | Expected—each test runs fresh setup/teardown for isolation |

## Key Files

| File | Purpose |
|------|---------|
| `tests/rls.setup.ts` | Core setup/teardown logic |
| `tests/rls.session-helper.ts` | Functions to set user sessions |
| `tests/rls.*.test.ts` | Tests for each protected table |
| `vitest.config.ts` | Vitest configuration |

## Best Practices

✅ **Do:**
- Run tests before pushing changes
- Test both positive (user can access their data) and negative (user can't access others' data) cases
- Add tests when creating new protected tables
- Keep `.env.test` secure (add to `.gitignore`)

❌ **Don't:**
- Share `SERVICE_ROLE_KEY` (it bypasses RLS)
- Run tests in parallel (use sequential mode)
- Commit `.env.test` to git

## Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vitest Documentation](https://vitest.dev/)

## Complete Security Picture

This is Layer 2 (database). See:
- **[Security Overview](../overview/)** – Defense in depth approach
- **[Route Protection](../route-protection/)** – Layer 1 (API routes)
- **[Getting Started](../../getting-started/#running-backend-services)** – Setting up for testing