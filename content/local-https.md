---
weight: 10
title: "Local HTTPS with mkcert"
---

# Local HTTPS Development

## Why HTTPS Locally?

See [Getting Started: Authentication & HTTPS](../getting-started/#authentication--https) 
for context on the authentication limitation.

If you want to run the dev server with HTTPS (for other testing purposes):

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