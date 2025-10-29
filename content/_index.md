---
weight: 1
title: ""
layout: docs
bookFlatSection: true
---

# Sisukas

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)

A lightweight, fast alternative to the official SISU system for course filtering, [right here](https://sisukas.eu/).

> [!IMPORTANT]
> If you're a university student in the Finnish education system, you’ve likely encountered the frustrations of the SISU system. With limited filters, navigation that hides key details behind multiple clicks, and a confusing pagination system that makes it easy to lose track, finding courses can be unnecessarily tedious. Slow performance only adds to the hassle, making the whole experience more cumbersome than it needs to be. On top of that, the lack of curriculum information makes planning your studies more difficult.

Sisukas offers a faster, more intuitive way to browse and filter courses:

- Quick response with preloaded data, with no additional requests
- Intuitive drag-and-drop selection across periods
- Refined search using Boolean logic (AND, OR) for more specific results
- Filter courses by start and end dates to focus on specific time frames
- Predefined course lists for specific majors and minors
- Share filter configurations via URL for easy collaboration

> [!NOTE]
> Sisukas strikes the right balance in presenting course information. It features a compact layout that displays all necessary course details at a glance, with no extra clicks. A unique toggle merges duplicate entries, showing only one per course code. The app is fully responsive, ensuring smooth performance across both desktop and mobile devices.

> [!TIP]
> Want to stay informed about important course details, key registration deadlines, and exam schedules? Sisukas now features a public newsletter! Check out the latest issue or subscribe [here](https://sisukas.eu/newsletter.html).

## How It Works

The Sisukas frontend is built with Vanilla JavaScript, chosen for its simplicity, lightweight nature, and fast performance in the browser. To ensure quick access, it uses IndexedDB-based caching to efficiently load course data once at startup, eliminating unnecessary network requests. The app's development process is optimized with the Vite build tool, which supports ECMAScript modules and handles cache invalidation efficiently. Vitest is used to perform fast, reliable unit tests, ensuring that key features like filtering, sorting, and data handling work correctly with minimal overhead. A serverless API backend (Google Cloud Run) handles filter sharing functionality, allowing users to save and share filter configurations via short URLs. Finally, for deployment, Fly.io distributes the app across multiple edge locations for global access, while Docker ensures consistent, containerized environments.

> [!NOTE]
> The course data (`courses.json`) was retrieved using the Aalto Open API, following the instructions at [3scale Aalto Open API Docs](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu). The data was obtained using the `GET /courseunitrealisations` endpoint, with the parameter: `startTimeAfter=2024-01-01`. A GitHub Actions workflow automatically checks for course updates daily and commits changes to the repository.

> [!IMPORTANT]
> The app uses a cached version of this data with HTTP conditional requests (If-Modified-Since) to ensure fast performance while staying up-to-date. The browser will automatically fetch updates only when the data has changed on the server.

## Running Locally

To test the application on your local machine, follow these steps:

1. Clone the repository: `git clone https://github.com/kctong529/sisukas.git`
2. Navigate to the frontend directory: `cd sisukas/course-browser`
3. Install dependencies: `npm ci`
4. Start the development server: `npm run dev`

This will start the Vite development server and provide a URL in the console (e.g., `http://localhost:5173`). Simply open this URL in your browser.

> [!NOTE]
> If you're interested in building the app for production, you can run `npm run build`. This will bundle the project for production and create the necessary static files in the `/dist` folder. You can serve the files from the `/dist` directory using any HTTP server of your choice (e.g. `python -m http.server`).

> [!TIP]
> `courses.json` is blocked when accessed directly via `file://` in the browser (due to browser security restrictions). Using the local server ensures proper loading of `courses.json`.
