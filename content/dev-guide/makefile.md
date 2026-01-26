---
weight: 5
title: "Makefile Reference"
---

> [!NOTE]
> Used in [Getting Started](../../getting-started/#setup-all-components). 
> See there for typical workflows.

# Makefile Reference

## Overview

The Makefile automates setup and management of the Sisukas development environment, handling Python virtual environments, Node.js dependencies, and localhost HTTPS certificate generation.

It is designed to work in both local development and CI/CD environments.  
Some steps (notably HTTPS certificate generation) are environment-sensitive and may be skipped automatically in CI.

## Available Targets

### `make help`

Displays all available targets and their descriptions.

### `make setup`

Complete setup of all components. Runs in this order:
1. Verifies required tools (uv, node, mkcert)
2. Sets up filters-api Python environment
3. Sets up sisu-wrapper Python environment
4. Sets up backend Node.js dependencies
5. Sets up frontend Node.js dependencies
6. Generates localhost HTTPS certificates (if mkcert is available)

**Use this:** First time setup or when you want everything fresh.

> [!NOTE]
> If mkcert is not installed, setup will still complete,
> but local authentication will not work until certificates are generated.

### `make check-tools`

Verifies that required tools are installed:
- `uv` (Python package manager) — **Required**, exits with error if missing
- `node` (JavaScript runtime) — **Required**, exits with error if missing
- `mkcert` (localhost certificate tool) — **Required for authenticated local development**

If mkcert is missing, the command prints a warning and continues.
This allows CI and non-auth frontend work to proceed.

### `make setup-filters-api`

Sets up the filters-api Python service:
- Creates Python 3.12 virtual environment
- Compiles requirements if `requirements.in` exists
- Syncs dependencies
- Copies `.env.example` to `.env`

Location: `filters-api/`

### `make setup-sisu-wrapper`

Sets up the sisu-wrapper Python service:
- Creates Python 3.12 virtual environment
- Compiles requirements if `requirements.in` exists
- Syncs dependencies

Location: `sisu-wrapper/`

### `make setup-backend`

Sets up backend Node.js dependencies:
- Runs `npm ci --ignore-scripts`
- Copies `.env.example` to `.env`

Location: `backend/`

### `make setup-frontend`

Sets up frontend Node.js dependencies:
- Runs `npm ci --ignore-scripts` in frontend/course-browser
- Copies .env.example to .env

Location: `frontend/course-browser/`

### `make setup-certs`

Generates localhost HTTPS certificates using mkcert:

- Checks if mkcert is installed
- If not found: prints warning and skips
- Creates certificates for `localhost` and `127.0.0.1`
- Stores them in `frontend/course-browser/`
- Skips generation if certificates already exist

Creates:
- `frontend/course-browser/localhost.pem`
- `frontend/course-browser/localhost-key.pem`

> [!IMPORTANT]
> These certificates are **required** for local sign-in and authentication flows.
> Without them, the frontend must be run over HTTP and authentication will fail.

### `make compile-requirements`

Compiles Python `requirements.in` files to `requirements.txt`:
- `filters-api/requirements.in` → `filters-api/requirements.txt`
- `sisu-wrapper/requirements.in` → `sisu-wrapper/requirements.txt`

Use when updating Python dependencies.

### `make clean`

Removes all generated artifacts:
- Python virtual environments: `filters-api/.venv`, `sisu-wrapper/.venv`
- Node modules: `backend/node_modules`, `frontend/course-browser/node_modules`

Does NOT remove certificates. Use `make clean-certs` for that.

### `make clean-certs`

Removes localhost HTTPS certificates:
- `frontend/course-browser/localhost.pem`
- `frontend/course-browser/localhost-key.pem`

## Common Workflows

### First-Time Setup
```
make setup
```

Installs all dependencies and generates HTTPS certificates (if mkcert is installed).

### Install mkcert
```
# macOS
brew install mkcert

# Linux
sudo apt install mkcert

# Windows (with Chocolatey)
choco install mkcert
```

Then generate certificates:

```
make setup-certs
```

### Clean Everything and Start Fresh
```
make clean
make setup
```

### Regenerate Certificates
```
make clean-certs
make setup-certs
```

## Project Structure

After running `make setup`:

```
sisukas/
├── Makefile
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   └── course-browser/
│       ├── node_modules/
│       ├── localhost.pem
│       ├── localhost-key.pem
│       ├── package.json
│       ├── .env
│       └── .env.example
├── filters-api/
│   ├── .venv/
│   ├── requirements.in
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
└── sisu-wrapper/
    ├── .venv/
    ├── requirements.in
    ├── requirements.txt
    └── (no .env setup for this one)
```

## How It Works

### Python Setup (uv)

- Uses Python 3.12
- Compiles `requirements.in` to pinned `requirements.txt`
- Installs exact versions via `uv pip sync`

### Node Setup

- Uses `npm ci --ignore-scripts`
- Ensures reproducible installs for frontend and backend

### Certificate Generation (mkcert)

- Creates a local Certificate Authority
- Installs it into the system trust store
- Generates browser-trusted certificates for localhost
- Required for secure cookies and auth redirects

### Idempotency

Most targets are safe to rerun:
- Certificates are skipped if already present
- `.env` files are not overwritten
- Dependency installs are repeatable

## Troubleshooting

### "mkcert not found"

- In CI: expected, certificates are skipped
- Locally: install mkcert and run `make setup-certs`

### Authentication not working locally

- Check that `localhost.pem` and `localhost-key.pem` exist
- Ensure frontend is running over `https://localhost:5173`
- Restart the frontend after generating certificates

## Notes

- The Makefile uses bash features; use WSL or Git Bash on Windows
- `.env` files are loaded by applications, not by make
- HTTPS certificates are **mandatory for local authentication**
- Clean targets are never run implicitly
