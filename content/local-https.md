---
weight: 5
title: "Local HTTPS with mkcert"
---

# Local HTTPS Development

## Why HTTPS Locally?

The authentication system uses BetterAuth with production cookie settings. These cookie settings don't work on localhost (HTTP or HTTPS), so sign-in doesn't function locally.

However, HTTPS is still useful for:
- Testing other parts of the application without sign-in
- Preparing the environment for when cookie issues are resolved
- Matching production environment more closely

## Current Status

Sign-in doesn't work on localhost (whether HTTP or HTTPS). This is a known limitation while we resolve the cookie configuration.

## How It Works

The `vite.config.ts` checks if certificates exist:

```typescript
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

server: mode === 'development' ? {
  ...(hasCerts ? {
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  } : {}),
  port: 5173
} : undefined
```

- If certificates exist → Dev server uses HTTPS
- If no certificates → Dev server uses HTTP

## Setup

If you want to run with HTTPS:

### Install mkcert (One Time)

```bash
# macOS
brew install mkcert

# Linux
sudo apt install mkcert

# Windows
choco install mkcert
```

### Generate Certificates

```bash
make setup-certs
```

This creates:
- `frontend/course-browser/localhost.pem` — Certificate
- `frontend/course-browser/localhost-key.pem` — Private key

The vite config automatically detects these and enables HTTPS.

### Start Dev Server

```bash
npm run dev
```

Dev server will use HTTPS:
```bash
  ➜  Local:   https://localhost:5173/
```

## Removing HTTPS

If you prefer HTTP while developing:

```bash
make clean-certs
npm run dev
```

Dev server will use HTTP:
```bash
  ➜  Local:   http://localhost:5173/
```

## For Contributors

Currently, sign-in doesn't work on localhost. To work on the authentication system:
- See the backend authentication configuration
- The cookie settings work in production but not locally
- Check the BetterAuth documentation for localhost cookie configuration

For other features, you can use either HTTP or HTTPS based on preference. The vite config automatically switches between them based on whether certificates exist.