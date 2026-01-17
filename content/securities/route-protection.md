---
weight: 2
title: "User Route Protection"
---

# User Route Protection Implementation

The backend server has comprehensive protection for user routes with role-based access control and session management.

## Architecture

### Authentication Layers

1. **User Authentication** (`extractSession` middleware)
   - Validates BetterAuth sessions
   - Extracts user info from request headers
   - Available via `res.locals.user`

2. **User Authorization** (`requireAuth` middleware)
   - Ensures user is authenticated
   - Validates `res.locals.user` exists
   - Returns 401 if not authenticated

3. **Admin Authorization** (`requireAdmin` middleware)
   - Validates admin session token
   - Checks token expiration (1 hour TTL)
   - Returns 401 if token missing or expired

### Token-Based Admin Sessions

**In-Memory Store:**
```typescript
const adminSessions = new Map<string, { expiresAt: number }>();
```

- Tokens stored in memory (cleared on server restart)
- Each token has expiration time (1 hour)
- Sessions automatically cleaned when expired

**Token Sources (checked in order):**
1. Authorization header: `Bearer <token>`
2. Cookie: `admin_token=<token>`
3. Query parameter: `?admin_token=<token>`

## Protected Routes

### `GET /api/users` - List All Users
**Protection:** Admin only (token-based)

```typescript
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  // Only accessible with valid admin token
  // Returns: { users: [], count: number, adminToken: string }
});
```

**Access Control:**
- Requires valid admin session token
- Token must not be expired
- Returns 401 if no token or expired
- Returns 200 with user list if authorized

**Response:**
```json
{
  "users": [
    { "id": "...", "email": "...", "name": "..." },
    ...
  ],
  "count": 42,
  "adminToken": "8j9k3l2m..."
}
```

---

### `GET /api/users/:id` - Get Single User Profile
**Protection:** Authenticated users can only view their own profile

```typescript
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  // Users must authenticate via BetterAuth (requireAuth enforces this)
  // Can only access their own profile (id must match res.locals.user.id)
  // Returns: { user: {...} }
});
```

**Access Control Flow:**
1. User must be authenticated (BetterAuth session)
2. Requested user ID must match authenticated user's ID
3. Returns 403 if user tries to access someone else's profile
4. Returns 404 if user not found
5. Returns 200 with user data if authorized

---

### `POST /api/users` - Register New User
**Protection:** None (public registration)

```typescript
router.post('/', async (req: Request, res: Response) => {
  // Public endpoint - anyone can register
  // Body: { email: string, password: string, name?: string }
  // Returns: { message: string, user: {...} }
});
```

**Access Control:**
- No authentication required
- Validates email is unique (BetterAuth handles this)
- Returns 201 on success
- Returns 409 if email already exists
- Returns 400/422 on validation errors

---

### `DELETE /api/users/:id` - Delete User Account
**Protection:** Authenticated users can only delete their own account

```typescript
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  // Users must authenticate via BetterAuth (requireAuth enforces this)
  // Can only delete their own account (id must match res.locals.user.id)
  // Returns: { message: string, user: {...} }
});
```

**Access Control Flow:**
1. User must be authenticated (BetterAuth session)
2. Can only delete their own account (ID must match)
3. Returns 403 if trying to delete someone else's account
4. Returns 404 if user not found
5. Returns 200 with deleted user data if authorized

---

## Admin Login Flow

### 1. Initial Access
```
User visits: http://localhost:3000/api/admin/login
↓
Returns: HTML login form
```

### 2. Credential Submission
```
POST /api/admin/login
Body: { username: "admin", password: "secret" }
↓
Backend validates credentials against:
  - ADMIN_USERNAME env var
  - ADMIN_PASSWORD env var
↓
If valid:
  - Generate random token
  - Store in adminSessions Map with 1-hour expiration
  - Set httpOnly cookie: admin_token
  - Return: { token: "..." }
↓
Frontend receives token:
  - Stores in localStorage
  - Redirects to /api/users
```

### 3. Accessing Protected Routes
```
GET /api/users (with token)
↓
requireAdmin middleware:
  1. Check Authorization header for "Bearer TOKEN"
  2. Check cookies for admin_token
  3. Check query param ?admin_token=TOKEN
↓
If token found:
  - Lookup in adminSessions Map
  - Check expiration (Date.now() < expiresAt)
  - If valid: continue to route handler
  - If expired: delete session, return 401
↓
Route handler executes with access to res.locals.adminToken
```

### 4. Logout
```
User visits: /api/admin/logout
↓
requireAdmin validates token (same flow as above)
↓
If authorized:
  - Delete token from adminSessions Map
  - Clear admin_token cookie
  - Return logout confirmation page
↓
Token is now invalid for future requests
```

---

## Security Features

### Token Expiration
- Tokens expire after 1 hour
- Automatic cleanup when accessed after expiration
- Admin must login again for new token

### Multiple Token Sources
- Supports Bearer token in Authorization header (API access)
- Supports cookies (browser access)
- Supports query params (bookmark-friendly links)

### Session Logging
All authentication attempts are logged:
```
[2026-01-17T10:30:45.123Z] [ADMIN LOGIN FAILED] Username: admin, IP: 127.0.0.1, User-Agent: Mozilla/5.0...
[2026-01-17T10:30:52.456Z] [ADMIN LOGIN SUCCESS] Username: admin, IP: 127.0.0.1, Token: 8j9k3l2m..., User-Agent: Mozilla/5.0...
[2026-01-17T10:35:20.789Z] [ADMIN LOGOUT] IP: 127.0.0.1, Token: 8j9k3l2m...
```

### Cookie Security
```typescript
res.cookie('admin_token', token, {
  httpOnly: true,        // JavaScript can't access (XSS protection)
  secure: production,    // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 1 * 60 * 60 * 1000  // 1 hour
});
```



## Testing

### Login as Admin
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
# Returns: { "message": "Login successful", "token": "..." }
```

### Access Users List
```bash
TOKEN="your_token_from_login"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users
# Returns: { "users": [...], "count": 42 }
```

### View Own Profile
```bash
USER_TOKEN="your_user_auth_token"
USER_ID="your_user_id"

curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:3000/api/users/$USER_ID
# Returns: { "user": {...} }
```

### Logout
```bash
TOKEN="your_admin_token"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/logout
# Returns: HTML logout page
# Token is now invalid
```

---

## Summary

| Route | Method | Auth | Access | Notes |
|-------|--------|------|--------|-------|
| `/api/users` | GET | Admin Token | Admin only | Lists all users |
| `/api/users/:id` | GET | BetterAuth | Own profile only | Protected with `requireAuth` |
| `/api/users` | POST | None | Public | Registration endpoint |
| `/api/users/:id` | DELETE | BetterAuth | Own account only | Protected with `requireAuth` |
| `/api/admin/login` | GET | None | Public | Login form |
| `/api/admin/login` | POST | None | Public | Credential verification |
| `/api/admin/logout` | GET | Admin Token | Admin only | Session destruction |