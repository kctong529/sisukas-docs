---
weight: 2
title: "Getting Started"
description: "Documentation for Sisukas"
---

## Which Path Is Right for You?

### Try It Now (Recommended for Most People)

Visit **[sisukas.eu](https://sisukas.eu)** to:
- Browse 4000+ Aalto courses
- Apply intelligent filters
- Bookmark favorite courses
- Create Plans and explore semester-level planning options

> [!IMPORTANT]
> Sisukas runs entirely in the browser with no installation required.
> Course data is cached locally for instant searching and filtering, making
> the app usable even with limited connectivity.

### Run Locally (For Development or Self-Hosting)

Set up a local development environment if you want to:
- Contribute to the codebase
- Self-host the application
- Work on discovery, filtering, or planning features
- Understand the system architecture

> [!TIP]
> Authentication does not work out of the box on localhost due to browser
> security restrictions. You can still browse and filter courses locally,
> but authenticated features require the live app.

## Running Locally: Full Setup

Local setup is straightforward and tested on macOS and Linux.
Windows users should use WSL (Windows Subsystem for Linux).

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

This creates Python virtual environments and installs dependencies for all components (frontend, backend, filters-api, and sisu-wrapper). Run `make help` to see all available commands.

> [!TIP]
> The project includes a Makefile with convenient shortcuts.
> See the [Makefile Reference](../makefile/) for details.

## Course Data

Course data is fetched from the Aalto University API and updated daily.
The frontend loads the latest `courses.json` automatically when the dev
server starts.

> [!TIP]
> For details on how course data is fetched, cached, and updated, see the
> [Data Pipeline](../dev-guide/data-pipeline/) guide.

## Running the Frontend

The frontend runs independently and does not require backend services
for course discovery and filtering.

```sh
cd frontend/course-browser
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173)

### Browser Requirements

Sisukas works best on modern browsers (Chrome, Firefox, Safari, Brave)
and is fully responsive on mobile.

> [!TIP]
> `courses.json` cannot be accessed via `file://` URLs due to browser
> security restrictions. Always use the dev server.

## Authentication & HTTPS (Local Development)

The live app at **[sisukas.eu](https://sisukas.eu)** supports full
authentication, bookmarks, and planning features.

In local development, authentication does not work because browsers treat
different ports (e.g. `localhost:5173` and `localhost:3000`) as different
origins. Secure authentication cookies cannot be shared across them.

This is expected browser behavior, not a Sisukas limitation.

> [!NOTE]
> To test authenticated features, use the live app.

If you need HTTPS locally for other reasons, see
[Local HTTPS Setup](../local-https/).

## What You Can Do Locally

### Fully Functional (No Sign-In Required)

- ✓ Browse and search courses
- ✓ Apply and share filters
- ✓ Explore course details and schedules

### Requires Sign-In (Live App Only)

- ✗ Bookmark courses
- ✗ Create Plans
- ✗ Use Schedule Pairs
- ✗ Use Decision Slots

## Backend Services (Optional)

Backend services are only required if you are working on:

- authentication,
- persistence,
- or planning-related APIs.

Frontend-only development does **not** require running backend services.

### Backend Setup

```sh
cd backend
npm ci --ignore-scripts
cp .env.example .env
```

Running the backend requires additional configuration depending on what
you are working on.

### Filters API

Handles persistence and sharing of filter configurations.

```sh
cd filters-api
uv run fastapi dev main.py
```

Available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### SISU Wrapper (Study Group API)

Provides real-time study group and schedule data.

- Required for full planning features
- Optional for frontend development

```sh
cd sisu-wrapper
uv run fastapi dev api/main.py --port 8001
```

Available at [http://127.0.0.1:8001](http://127.0.0.1:8001)

API documentation: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

The Python library is also available on PyPI:

```sh
pip install sisu-wrapper
```

## Building the Frontend for Production

To build the frontend bundle:

```sh
npm run build
```

This creates static files in `/dist`, which can be served using any HTTP server.

## First Steps

1. Browse courses
2. Apply filters
3. Explore course details
4. Save and share filters
5. Sign in (optional) to access planning features

## Learn More

- **[Why Sisukas?](../why-sisukas/)** – The problem Sisukas solves
- **[The Big Picture](../concepts/overview/)** – Planning philosophy
- **[API Reference](../api/)** – Backend endpoints
