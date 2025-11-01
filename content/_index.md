---
weight: 1
title: ""
layout: docs
bookFlatSection: true
---

# Sisukas

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)
[![Documentation](https://img.shields.io/badge/docs-sisukas.eu-blue)](https://docs.sisukas.eu/)

A lightweight, fast alternative to the official SISU system for course filtering, [right here](https://sisukas.eu/).

> [!IMPORTANT]
> If you're a university student in the Finnish education system, you’ve likely encountered the frustrations of the SISU system. With limited filters, navigation that hides key details behind multiple clicks, and a confusing pagination system that makes it easy to lose track, finding courses can be unnecessarily tedious. Slow performance only adds to the hassle, making the whole experience more cumbersome than it needs to be. On top of that, the lack of curriculum information makes planning your studies more difficult.

Sisukas offers a faster, more intuitive way to browse and filter courses:

- Quick response with preloaded data, with no additional requests
- Intuitive drag-and-drop selection across periods
- Refined search using Boolean logic (AND, OR) for more specific results
- Filter courses by start and end dates to focus on specific time frames
- Predefined course lists for specific majors and minors
- Share filter configurations via short URLs

> [!NOTE]
> Sisukas strikes the right balance in presenting course information. It features a compact layout that displays all necessary course details at a glance, with no extra clicks. A unique toggle merges duplicate entries, showing only one per course code. The app is fully responsive, ensuring smooth performance across both desktop and mobile devices.

> [!TIP]
> Want to stay informed about important course details, key registration deadlines, and exam schedules? Sisukas now features a public newsletter! Check out the latest issue or subscribe [here](https://sisukas.eu/newsletter.html).

## How It Works

Sisukas is built for speed and simplicity. The frontend uses Vanilla JavaScript to deliver a lightweight, responsive experience without the overhead of heavy frameworks. Course data is fetched once from the Aalto Open API and cached locally using IndexedDB, eliminating the need for repeated network requests. This approach ensures instant filtering and searching, even with thousands of courses. The development workflow is powered by Vite for fast builds and hot module replacement, while Vitest handles unit testing to ensure reliability.

Behind the scenes, a serverless API backend running on Google Cloud Run manages filter sharing functionality, allowing users to save and distribute their configurations via short URLs. A GitHub Actions workflow automatically checks for course updates daily and commits changes to the repository, keeping the data fresh without manual intervention. The entire application is containerized with Docker and deployed globally via Fly.io's edge network, ensuring fast access for users regardless of their location. Work is currently underway on the `sisu-wrapper` module to aggregate study group schedules and teaching sessions, which will enable users to view all relevant events and recurring patterns directly on their dashboard.

> [!NOTE]
> The course data (`courses.json`) was retrieved using the Aalto Open API, following the instructions at [3scale Aalto Open API Docs](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu). The data was obtained using the `GET /courseunitrealisations` endpoint, with the parameter: `startTimeAfter=2024-01-01`.

> [!IMPORTANT]
> The app uses a cached version of this data with HTTP conditional requests (If-Modified-Since) to ensure fast performance while staying up-to-date. The browser will automatically fetch updates only when the data has changed on the server.

## Running Locally

> [!NOTE]
> Local setup has been verified on macOS and Linux. Windows users may need WSL (Windows Subsystem for Linux). Feedback on other platforms is welcome!

### Prerequisites

Install [uv](https://docs.astral.sh/uv/) (fast Python package manager) and [Node.js](https://nodejs.org/) (v18+):
```sh
uv --version && node --version
```

### Quick Start
```sh
git clone https://github.com/kctong529/sisukas.git
cd sisukas
make setup        # Creates venvs, installs dependencies for all components
```

The project uses **uv** for faster, more reliable Python dependency management, and a **Makefile** for streamlined setup across frontend and backend services.

**Run the frontend:**
```sh
cd course-browser && npm run dev
# Opens at http://localhost:5173
```

**Run backend services (optional):**
```sh
# Filters API at http://127.0.0.1:8000
cd filters-api && uv run fastapi dev main.py

# Sisu Wrapper at http://127.0.0.1:8001
cd sisu-wrapper && uv run fastapi dev api/main.py --port 8001
```

> [!NOTE]
> The frontend runs independently—backend services are only needed for filter sharing or SISU integration features. See the [Filters API documentation](https://filters-api.sisukas.eu/) for production endpoints.

Run `make help` to see all available commands.

> [!NOTE]
> If you're interested in building the app for production, you can run `npm run build`. This will bundle the project for production and create the necessary static files in the `/dist` folder. You can serve the files from the `/dist` directory using any HTTP server of your choice (e.g. `python -m http.server`).

> [!TIP]
> `courses.json` is blocked when accessed directly via `file://` in the browser (due to browser security restrictions). Using the local server ensures proper loading of `courses.json`.
