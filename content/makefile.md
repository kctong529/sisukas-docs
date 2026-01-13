---
weight: 4
title: "Makefile Reference"
---

# Makefile Reference

## Overview

The Makefile automates setup and management of the Sisukas development environment, handling Python virtual environments, Node.js dependencies, and optional localhost certificate generation.

Works in both local development and CI/CD environments. Certificate generation is optional and automatically skipped if mkcert is not available (as in GitHub Actions).

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
6. Generates localhost certificates

**Use this:** First time setup or when you want everything fresh.

### `make check-tools`
Verifies that required tools are installed:
- `uv` (Python package manager) — Required, exits with error if missing
- `node` (JavaScript runtime) — Required, exits with error if missing
- `mkcert` (localhost certificate tool) — Optional, prints warning if missing

Exits with error if uv or node are missing. Prints warning (doesn't exit) if mkcert is not found.

### `make setup-filters-api`
Sets up the filters-api Python service:
- Creates Python 3.12 virtual environment
- Compiles requirements if requirements.in exists
- Syncs dependencies
- Copies .env.example to .env

Location: `filters-api/`

### `make setup-sisu-wrapper`
Sets up the sisu-wrapper Python service:
- Creates Python 3.12 virtual environment
- Compiles requirements if requirements.in exists
- Syncs dependencies

Location: `sisu-wrapper/`

### `make setup-backend`
Sets up backend Node.js dependencies:
- Runs `npm ci --ignore-scripts` in backend directory
- Copies .env.example to .env

Location: `backend/`

### `make setup-frontend`
Sets up frontend Node.js dependencies:
- Runs `npm ci --ignore-scripts` in frontend/course-browser
- Copies .env.example to .env

Location: `frontend/course-browser/`

### `make setup-certs`
Generates localhost certificates using mkcert:
- Checks if mkcert is installed
- If not found: Skips with warning (optional, only needed for local HTTPS)
- Creates certificates for localhost and 127.0.0.1
- Stores in `frontend/course-browser/`
- Skips if certificates already exist
- Provides instructions for installing mkcert

Creates:
- `frontend/course-browser/localhost.pem`
- `frontend/course-browser/localhost-key.pem`

**Note:** Certificates are optional. They're only needed if you want HTTPS in local development. CI/CD pipelines automatically skip this step.

### `make compile-requirements`
Compiles Python requirements.in files to requirements.txt:
- `filters-api/requirements.in` → `filters-api/requirements.txt`
- `sisu-wrapper/requirements.in` → `sisu-wrapper/requirements.txt`

Use when you update requirements.in files.

### `make clean`
Removes all generated artifacts:
- Python virtual environments: `filters-api/.venv`, `sisu-wrapper/.venv`
- Node modules: `backend/node_modules`, `frontend/course-browser/node_modules`

Does NOT remove certificates. Use `make clean-certs` for that.

### `make clean-certs`
Removes localhost certificates:
- `frontend/course-browser/localhost.pem`
- `frontend/course-browser/localhost-key.pem`

## Common Workflows

### First-Time Setup
```bash
make setup
```

This installs everything needed.

### Install mkcert First-Time (if needed)
```bash
# macOS
brew install mkcert

# Linux
sudo apt install mkcert

# Windows (with Chocolatey)
choco install mkcert
```

Then run `make setup` to generate certificates.

### Update Python Requirements
```bash
# Edit requirements.in files
nano filters-api/requirements.in

# Compile and sync
make compile-requirements

# Reinstall (includes compile)
make setup-filters-api
```

### Clean Everything and Start Fresh
```bash
make clean
make setup
```

### Regenerate Certificates
```bash
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
Uses `uv` for fast Python package management:
- Creates virtual environments with Python 3.12
- Compiles requirements.in to requirements.txt (universal, platform-independent)
- Uses `uv pip sync` to install exact versions

### Node Setup
Uses `npm ci --ignore-scripts` for clean, reproducible installs:
- Skips build scripts during setup
- Works for both backend and frontend components

### Certificate Generation (mkcert)
Uses mkcert for development HTTPS:
- Creates a local Certificate Authority on first run
- Installs CA in system trust store (asks for password once)
- Generates certificates signed by local CA
- Certificates work in all browsers automatically
- Only for localhost development (not valid on the internet)

### Idempotency
Most targets are safe to run multiple times:
- `setup-certs` skips if certs already exist
- `.env` files copied with `|| true` (don't fail if exists)
- `npm ci` and `uv pip sync` are designed to be repeatable

## Environment Variables

Each component can have a `.env` file. Copy from `.env.example`:
- `filters-api/.env`
- `frontend/course-browser/.env`
- `backend/.env`

`make setup` does this automatically if `.env.example` exists.

## Troubleshooting

### "uv not found"
Install from https://astral.sh/uv

### "node not found"
Install from https://nodejs.org

### "mkcert not found"
In CI/CD (GitHub Actions, etc.): This is normal and not an error. Certificate generation is automatically skipped. Certificates are only needed for local HTTPS development.

In local development: Optional. Only needed if you want HTTPS certificates. 
Install as described above, then run `make setup-certs`.

### Certificates won't generate
```bash
# Make sure mkcert is installed and in PATH
which mkcert

# Try generating again
make clean-certs
make setup-certs

# If it still fails, install local CA manually
mkcert -install
```

### Need to use a different Python version
Edit the Makefile and change `3.12` to your desired version (3.11, 3.10, etc.)

### npm ci failing
Make sure package-lock.json exists in the directory. If not:
```bash
cd backend  # or frontend/course-browser
npm install
cd ..
```

## Notes

- The Makefile uses bash features. For Windows, use WSL or Git Bash.
- Environment variables in .env files are loaded by the applications, not by make itself.
- Certificates are regenerated with `make setup` only if they don't exist (idempotent).
- Clean targets are not automatically run by `make setup` - you must explicitly run `make clean` if you want fresh install.