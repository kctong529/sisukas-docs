---
weight: 2
title: "Getting Started"
description: "Documentation for Sisukas."
---

# Getting Started with Sisukas

## Which Path Is Right for You?

### Try It Now (Recommended for Most People)

Visit **[sisukas.eu](https://sisukas.eu)** to:
- Browse 4000+ Aalto courses
- Apply intelligent filters
- Bookmark favorite courses
- Create Plans and explore study groups

> [!IMPORTANT]
> The application is browser-based with no installation required. Course data is automatically cached in your browser for instant searching and filtering, making it usable even with limited network connectivity.

### Run Locally (For Development or Self-Hosting)
Set up a local development environment if you want to:
- Contribute to the codebase
- Self-host the application
- Work on course discovery features
- Understand the architecture

> [!TIP]
> Authentication doesn't work out of the box on localhost (browser security limitation). You can still browse and filter courses, but can't access bookmarks, plans, or study groups.

## Running Locally: The Full Setup

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

> [!TIP]
> The project includes a Makefile with convenient commands for setup and management. 
See [Makefile Reference](../makefile/) for the complete list of available targets.

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

Live app status: The app at [sisukas.eu](sisukas.eu) has full authentication enabled. You can sign in, bookmark courses, and access authenticated features.

Local development status: Sign-in doesn't work on localhost because browsers treat different ports as different domains. Your frontend runs on localhost:5173, but the backend services run on different ports (localhost:3000), which breaks the secure cookie configuration that production uses.

This is a browser security limitation, not a bug. It's expected behavior for local development.

## What You Can Do Locally

Since authentication doesn't work on localhost, here's what's available 
in local development:

### Fully Functional (No Sign-In Required)
- ✓ Browse and search all courses
- ✓ Apply filters and see results
- ✓ Save filters to shareable URLs
- ✓ Explore course details and schedules

### Requires Sign-In (Only at sisukas.eu)
- ✗ View study groups and exercise options
- ✗ Create bookmarks (save favorite courses)
- ✗ Create Plans (group courses for a semester)
- ✗ Use planning features (Schedule Pairs, Decision Slots)

> [!NOTE]
> **Why?** Browsers treat `localhost:5173` (frontend) and `localhost:3000` (backend) as different origins. Authentication uses secure HttpOnly cookies, which can't be shared across different origins. This is a browser security feature, not a limitation of Sisukas.

To test authentication features, use the live app at [sisukas.eu](https://sisukas.eu).

### Running HTTPS Locally

If you want to test HTTPS in local development (for reasons other than authentication), see [Local HTTPS Setup](../local-https/).

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

### SISU Wrapper (REST API for Study Groups)

Provides study group and real-time schedule data. The frontend calls this service 
to display which lectures, exercises, and exams are available for each course.

**Is it required?**
- For course discovery/filtering: No, works without it
- For displaying detailed study groups: Yes, needed for full feature set
- For local development: Optional, but recommended

**To run locally:**
```sh
cd sisu-wrapper
uv run fastapi dev api/main.py --port 8001
```

Available at [http://127.0.0.1:8001](http://127.0.0.1:8001)

API documentation: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

**Using the Python library:**
The sisu-wrapper is also published on PyPI for programmatic use:
```sh
pip install sisu-wrapper
```

See the [Sisu Wrapper documentation](https://github.com/kctong529/sisukas/blob/main/sisu-wrapper/README.md) for usage examples.

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

## Learn More
- **[Why Sisukas?](../why-sisukas/)** – Problem we're solving
- **[The Big Picture](../concepts/overview/)** – Planning vision
- **[API Reference](../api/)** – Backend endpoints
