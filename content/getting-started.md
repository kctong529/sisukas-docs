---
weight: 2
title: "Getting Started"
description: "Start here to try sisukas.eu or run Sisukas locally, with pointers to the main concepts and developer guide."
---
> [!NOTE]
> Sisukas helps explore courses and planning options, but official course registration remains in SISU. You can use the hosted app without installing the developer stack.

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

This is the easiest way to experience the full system with no setup required.

### Run Locally (For Development or Self-Hosting)

Set up a local development environment if you want to:
- Contribute to the codebase
- Self-host the application
- Work on discovery, filtering, or planning features
- Understand the system architecture

Local development is fully supported, but requires a few services to run together.

> [!TIP]
> The documented full-stack local authentication configuration expects an HTTPS frontend URL.
> Vite itself can run over HTTP if certificates are absent; use `mkcert` and align the frontend URL settings when testing authentication.

See **[Running Sisukas Locally](../dev-guide/running-locally/)** for details.

That page covers:
- required tools
- one-time setup
- which services need to run
- how authentication works on localhost

## What You Can Do Without Any Setup

Even without signing in or running backend services, Sisukas supports:

- ✓ Browsing and searching courses
- ✓ Applying complex filters
- ✓ Inspecting course metadata and basic schedules
- ✓ Saving and sharing filter configurations (when Filters API is running)

This makes frontend-only development and exploration easy.

## What Requires Authentication

Authenticated features include:

- bookmarking courses
- creating and persisting Plans
- schedule evaluation and decision slots

These features work:
- on sisukas.eu, or
- locally with HTTPS and backend services running

## Course Data

Course data is collected by the upstream data pipeline and published as datasets for frontend consumption. The frontend includes logic for active and historical course indexes, rather than simply loading a single `courses.json` when Vite starts. See the data pipeline and dataset lifecycle documentation for refresh and caching details.

> [!NOTE]
> For details on how course data is fetched, cached, and updated, see the
> [Data Pipeline](../dev-guide/data-pipeline/) guide.

### Browser Support

Sisukas works best on modern browsers such as Chrome, Firefox, Safari, and Brave.
It is fully responsive and usable on mobile devices.

> [!TIP]
> `courses.json` cannot be accessed via `file://` URLs due to browser
> security restrictions. Use the Vite dev server when running locally.

## Related documentation

- [Why Sisukas?](../why-sisukas/) — Product motivation.
- [Concepts](../concepts/) — Planning ideas and terminology.
- [Running Sisukas Locally](../dev-guide/running-locally/) — Developer setup.
