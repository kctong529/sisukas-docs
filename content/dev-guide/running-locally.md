---
weight: 1
title: "Running Sisukas Locally"
description: "Step-by-step local setup: required tools, HTTPS on localhost, service startup order, and common troubleshooting."
---

> [!NOTE]
> This page describes how to run Sisukas locally in a development setup. Sisukas consists of five independent services (frontend, backend, database, SISU wrapper, and filters API) that you'll run in separate terminals, allowing you to view logs clearly and restart individual components without stopping the others.

## Prerequisites

Verify you have all required tools installed before starting:

```
git --version
make --version
uv --version
node --version
docker --version
docker-compose version
mkcert --version
```

If any command fails, install the missing tool:

| Tool | Installation |
|------|--------------|
| Git | [https://git-scm.com/](https://git-scm.com/) |
| GNU Make | macOS: comes with Xcode; Linux: `apt install make`; Windows: `choco install make` |
| uv | [https://docs.astral.sh/uv/getting-started/installation/](https://docs.astral.sh/uv/getting-started/installation/) |
| Node.js (v18+) | [https://nodejs.org/](https://nodejs.org/) |
| Docker + Compose | [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| mkcert | [https://github.com/FiloSottile/mkcert](https://github.com/FiloSottile/mkcert) |

> [!IMPORTANT]
> **mkcert is not optional.** Local authentication requires HTTPS even on localhost. Without valid local certificates, the sign-in flow will fail completely. If mkcert is missing, the setup step will alert you but may not prevent the rest of setup from completing.

## Clone the Repository

```
git clone https://github.com/kctong529/sisukas.git
cd sisukas
```

## Initial Setup

Sisukas includes a Makefile that automates environment setup:

```
make setup
```

This command does the following:

1. Creates Python 3.12 virtual environments for `filters-api` and `sisu-wrapper`
2. Installs Python dependencies using `uv`
3. Installs Node.js dependencies via `npm ci`
4. Copies `.env.example` to `.env` in each service (only if `.env` doesn't already exist)
5. Generates localhost HTTPS certificates (`localhost.pem` and `localhost-key.pem`)

**After setup completes**, verify that the HTTPS certificates were created:

```
ls frontend/course-browser/localhost*.pem
```

> [!TIP]
> You should see both `localhost.pem` and `localhost-key.pem`. If these files are missing, mkcert failed silently — reinstall mkcert and run `make setup` again.

### Troubleshooting Setup

- "mkcert: command not found" → Install mkcert and try again
- "npm ERR! ..." → Run `npm ci` manually in `backend/` and `frontend/course-browser/` to see the full error
- Permission errors on `make setup` → Check that your user can run Docker commands, or fix file permissions. Avoid running `make setup` as root unless you know why it’s required

## Running Sisukas

> [!IMPORTANT]
> You will typically use 4–5 terminal windows or tabs simultaneously. Each service runs independently, so you can restart one without stopping the others.

### What You Need vs What's Optional

| Service | Required? | Purpose |
|---------|-----------|---------|
| Frontend (Vite) | **Yes** | Web UI at `https://localhost:5173/` |
| Database (Postgres) | **Yes** | Stores plans, favourites, user accounts |
| Backend API | **Yes** | Provides authentication and interacts with the database |
| SISU Wrapper | Optional* | Enables study group information |
| Filters API | Optional* | Enables shareable filter URLs |

\* You can use Sisukas without these, but some features won't work.

| Service      | Port |
| ------------ | ---- |
| Frontend     | 5173 |
| Backend      | 3000 |
| Filters API  | 8000 |
| SISU Wrapper | 8001 |
| Postgres     | 5432 |

> [!TIP]
> If you only work on course discovery UI, you only need the frontend. Everything else is for sign-in and planning features.

### Terminal 1: Frontend (Course Browser)

The frontend is a Vite development server served over HTTPS. Start it first since other services depend on redirect URLs pointing to `https://localhost:5173/`.

```
cd frontend/course-browser
npm run dev
```

You'll see output like:

```
HTTPS server running...
> Local:     https://localhost:5173/
```

**Open `https://localhost:5173/` in your browser now.** Even without the backend running, you can browse and search courses, apply filters, inspect course metadata, and view basic schedules. You just won't be able to sign in, save Favourites, or create Plans until the backend is running.

> [!IMPORTANT]
> Do not use `http://` — the browser will refuse to authenticate over HTTP on localhost.

### Terminal 2: Local Database (Postgres)

The backend expects a local Postgres database in development. Start it with Docker Compose from the repository root:

```
docker-compose up
```

You'll see output like:

```
sisukas-db  | LOG:  database system is ready to accept connections
```

Warnings about locales are normal and can be ignored. Leave this running for the entire development session.

> [!NOTE]
> The database runs on `localhost:5432` internally. You don't need to interact with it directly unless debugging.

### Terminal 3: Backend (API + Authentication)

With the database running, initialize the database tables and start the backend:

```
cd backend
npm run db:push
```

This creates all the necessary database tables (users, courses, plans, favourites, etc.) in your local Postgres database. You should see:

```
[✓] Changes applied
```

Then start the backend dev server:

```
npm run dev
```

Once running, you'll see:

```
> backend dev
Server running on http://localhost:3000
```

The backend logs authentication and API requests in real-time.

#### Local Authentication (Email Simulation)

In development, if `RESEND_API_KEY` is not set in `.env`, the backend prints a magic link to the terminal instead of emailing it:

```
[auth] RESEND_API_KEY missing/invalid; printing magic link instead of emailing.
[auth] Magic link for user@example.com: https://localhost:5173/auth/verify?token=eyJ...
```

**Copy this link and open it in your browser to complete login.** This works only over HTTPS.

> [!TIP]
> For testing with multiple accounts, use different email addresses (e.g., `alice@example.com`, `bob@example.com`). Each will generate a unique magic link.

### Terminal 4: SISU Wrapper (Study Groups & Schedules)

The SISU Wrapper fetches live study group and schedule data for course instances. Without it, you can still add courses to Favourites and Plans but won't see study group information.

```
cd sisu-wrapper
uv run fastapi dev api/main.py --port 8001
```

You'll see:

```
INFO   Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```

Interactive API docs are available at `http://127.0.0.1:8001/docs` if you want to test endpoints manually.

> [!NOTE]
> This service is optional. If it's not running, the frontend will simply not display study group data.

### Terminal 5: Filters API (shareable filters)

The Filters API persists filter configurations so users can share URLs with custom course filters. Without it, filters work locally but can't be saved/shared via URL.

> [!TIP]
> Saved filters are not associated with user accounts; they are identified only by the generated URL.

```
cd filters-api
uv run fastapi dev main.py
```

You'll see:

```
INFO   Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Interactive API docs: `http://127.0.0.1:8000/docs`

> [!NOTE]
> This service is optional. If it's not running, the frontend will show a warning when you try to save filters.

## Verifying Everything Works

Once all services are running, test the following:

1. **Frontend loads** — Navigate to `https://localhost:5173/` — you should see the course browser UI
2. **Sign in works** — Click "Sign in", enter any email, open the magic link from the backend terminal
3. **Courses display** — After signing in, you should see a list of courses, each with a heart icon by its side
4. **Add to Favourites** — Click a heart icon to add the course to Favourites (stored in the database)
5. **Create a Plan** — Create a new plan (or use Default) and add courses to it
6. **Study groups display** (if SISU Wrapper running) — Find a course with an active lecture and click on a course instance to see study group information (note: some courses like exams may not have study groups), and add to active plan
7. **LEGO View** — Switch to LEGO view to see course instances in active plan displayed as blocks
8. **Year Timeline** — Switch to Year Timeline view to see courses organized chronologically
9. **Save filters** (if Filters API running) — Create a filter, click "Share", and verify you get a shareable link

If any feature doesn't work, check the **Quick Checklist** below.

## Troubleshooting

### "Connection refused" or "Can't reach backend"
- Verify `npm run dev` is running in the `backend/` terminal
- Check that the backend printed `Server running on http://localhost:3000`
- Check for port conflicts: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Sign-in hangs or shows "HTTPS error"
- Verify `localhost.pem` and `localhost-key.pem` exist in `frontend/course-browser/`
- Restart the frontend: `npm run dev` in the `frontend/course-browser/` terminal
- Check that the frontend is running over HTTPS (should show `https://` not `http://`)

### Database errors or "unable to connect to Postgres"
- Verify `docker-compose up` is running and shows "database system is ready"
- Check for port conflicts: `lsof -i :5432` or `docker ps`
- Try restarting: stop `docker-compose`, then `docker-compose up` again
- If stuck, run `docker-compose down -v` then `docker-compose up` to reset. The `-v` flag removes Docker volumes (persistent data stored by the database), which clears all data and gives you a fresh database. This is useful when the database state becomes corrupted or when you want to start completely fresh.

### Study groups don't load
- Verify SISU Wrapper is running: `uv run fastapi dev api/main.py --port 8001`
- Check the frontend console (press F12) for errors
- The backend logs may show "connection refused" if port 8001 isn't available

### Filters can't be saved
- Verify Filters API is running: `uv run fastapi dev main.py` in `filters-api/`
- Check for port conflicts: `lsof -i :8000`

## Quick Checklist

Copy this list and verify each item is running before concluding something is broken:

```
Frontend:
  [ ] npm run dev in frontend/course-browser/
  [ ] Running over HTTPS at https://localhost:5173/
  [ ] localhost.pem and localhost-key.pem present

Database:
  [ ] docker-compose up in repository root
  [ ] Shows "database system is ready"

Backend:
  [ ] npm run db:push completed successfully
  [ ] npm run dev in backend/
  [ ] Shows "Server running on http://localhost:3000"

SISU Wrapper (optional):
  [ ] uv run fastapi dev api/main.py --port 8001 in sisu-wrapper/
  [ ] Running on http://127.0.0.1:8001

Filters API (optional):
  [ ] uv run fastapi dev main.py in filters-api/
  [ ] Running on http://127.0.0.1:8000

Certificates:
  [ ] localhost.pem exists in frontend/course-browser/
  [ ] localhost-key.pem exists in frontend/course-browser/
```

If all items are checked and something still doesn't work, check the respective service's terminal output for error messages.

## Stopping Services

To stop development cleanly:

1. Press `Ctrl+C` in each terminal running a service
2. Last, run `docker-compose down` to stop the database container

To resume development, restart services in the same order as above.

## Environment Variables

Each service reads configuration from a `.env` file (created by `make setup`). Common variables:

**Backend (`backend/.env`)**
- `RESEND_API_KEY` — Optional; if missing, magic links print to terminal instead
- `DATABASE_URL` — Automatically set by setup; don't change unless debugging

**SISU Wrapper (`sisu-wrapper/.env`)**
- Typically requires no changes for local development

**Filters API (`filters-api/.env`)**
- Typically requires no changes for local development

If you need to modify environment variables, edit the `.env` file in the respective directory and restart that service.

Check [Environment Variables Reference](../env/) for more details.
