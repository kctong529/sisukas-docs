---
weight: 2
title: "Getting Started"
---

# Getting Started with Sisukas

## Using the Live Application

The easiest way to get started is using the live app at [https://sisukas.eu](https://sisukas.eu).

> [!IMPORTANT]
> The application is browser-based with no installation required. Course data is automatically cached in your browser for instant searching and filtering, making it usable even with limited network connectivity.

## Running Locally

Local setup is straightforward and has been tested on macOS and Linux. Windows users should use WSL (Windows Subsystem for Linux).

### Prerequisites

Install the following tools:

**[uv](https://docs.astral.sh/uv/)** — Fast Python package manager:
```sh
uv --version
```

**[Node.js](https://nodejs.org/)** — v18 or later:
```sh
node --version
```

### Clone the Repository

```sh
git clone https://github.com/kctong529/sisukas.git
cd sisukas
```

### Setup All Components

```sh
make setup
```

This creates Python virtual environments and installs dependencies for all components (frontend, backend, filters-api, and sisu-wrapper). See `make help` for all available commands.

## Course Data

Course data comes from the Aalto University API and is automatically updated daily. The latest `courses.json` file is available from Google Cloud Storage and is loaded by the frontend when you start the dev server.

> [!TIP]
> For details on how course data is maintained, fetched, and updated, see the [Data Pipeline](../data-pipeline/) guide.

## Running the Frontend

The frontend runs independently and requires no backend services for basic course discovery and filtering.

```sh
cd frontend/course-browser
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173)

### Browser Requirements

The app works best on modern browsers (Chrome, Firefox, Safari, Brave). It's fully responsive and works on mobile devices.

> [!TIP]
> `courses.json` cannot be accessed directly via `file://` due to browser security restrictions. Always use the local dev server.

## Authentication & HTTPS

The authentication system uses BetterAuth with production cookie settings. These don't work on localhost, so sign-in is NOT functional in local development (neither HTTP nor HTTPS).

If you want to test with HTTPS locally (for future authentication work), see [Local HTTPS Setup](../local-https/).

## Running Backend Services

Backend services require an authenticated user session to function. Since authentication doesn't work locally, backend services are not practically useful in local development.

If you need to work on the backend or authentication:

### Backend Setup

First, install backend dependencies:

```sh
cd backend
npm ci --ignore-scripts
cp .env.example .env
```

Then run the development server (requires additional configuration based on your needs).

### Filters API

Handles persistence and sharing of filter configurations:

```sh
cd filters-api
uv run fastapi dev main.py
```

Available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### SISU Wrapper

Aggregates and normalizes SISU teaching session data:

```sh
cd sisu-wrapper
uv run fastapi dev api/main.py --port 8001
```

Available at [http://127.0.0.1:8001](http://127.0.0.1:8001)

API documentation: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

## Building for Production

To create a production build:

```sh
npm run build
```

This bundles the project and creates static files in the `/dist` folder. Serve using any HTTP server:

```sh
# Python
cd dist && python -m http.server

# Or using a Node.js server, nginx, etc.
```

## First Steps

1. **Browse courses** — Use the search bar to find courses by name, code, or instructor
2. **Apply filters** — Use the drag-and-drop period selector, text search, and other filters
3. **Explore details** — Click courses to see full information including schedule, credits, and description
4. **Save filters** — Once you've built a filter you like, save it and share via short URL
5. **Create an account** (optional) — Sign in to bookmark courses and prepare for planning features

## Troubleshooting

**"Courses.json failed to load"**

Make sure you're using the dev server (`npm run dev`), not opening `index.html` directly in the browser.

**"Port 5173 is already in use"**

Either stop the process using that port or run: `npm run dev -- --port 3000`

**Backend connection issues**

Backend services are optional. The frontend works fully without them. If you need them, ensure they're running on the correct ports before accessing features that require them.

## Project Structure

```
sisukas/
├── frontend/
│   └── course-browser/        # Frontend (Svelte)
├── backend/                   # Backend (Express.js)
├── filters-api/               # Filters persistence API (FastAPI)
├── sisu-wrapper/              # SISU data aggregation (FastAPI)
└── Makefile                   # Convenient commands
```

## Next Steps

- **[Learn about Filtering](../concepts/filtering/)** — Understand the powerful filter system
- **[Explore the Architecture](../architecture/)** — See how components fit together
- **[Start Contributing](../contributing/)** — Help build the future of Sisukas