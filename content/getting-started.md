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

This is the easiest way to experience the full system with no setup required.

### Run Locally (For Development or Self-Hosting)

Set up a local development environment if you want to:
- Contribute to the codebase
- Self-host the application
- Work on discovery, filtering, or planning features
- Understand the system architecture

Local development is fully supported, but requires a few services to run together.

> [!TIP]
> Local authentication requires HTTPS.
> The setup uses locally trusted certificates generated with `mkcert`.
> Without HTTPS, sign-in will not work.

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

Course data is fetched from the Aalto University API and updated daily.
The frontend loads the latest `courses.json` automatically when the dev
server starts.

> [!NOTE]
> For details on how course data is fetched, cached, and updated, see the
> [Data Pipeline](../dev-guide/data-pipeline/) guide.

### Browser Support

Sisukas works best on modern browsers such as Chrome, Firefox, Safari, and Brave.
It is fully responsive and usable on mobile devices.

> [!TIP]
> `courses.json` cannot be accessed via `file://` URLs due to browser
> security restrictions. Always use the dev server when running locally.

## Where to Go Next

- **Want to understand the system?**  
  Read **[System Overview](../system-overview/)** and **[Concepts Overview](../concepts/overview/)**

- **Want to run or modify the code?**  
  Start with **[Running Sisukas Locally](../dev-guide/running-locally/)**

- **Looking for implementation details?**  
  Continue to the **[Developer Guide](../dev-guide/)**

Sisukas is designed to support deliberate exploration first and commitment later.  
The documentation follows the same principle.
