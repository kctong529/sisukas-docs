---
title: "Developer Guide"
weight: 6
---

The Developer Guide is for contributors who want to understand how Sisukas is built, deployed, and operated in practice. It focuses on implementation details, system boundaries, and operational concerns rather than product philosophy or user-facing behavior.

This section assumes familiarity with the core concepts (Plans, Schedule Pairs, Decision Slots) and the overall system structure. If you are new to the project, start with the **System Overview** and **Concepts** sections before diving in here.

## How to Read This Section

The documents under the Developer Guide are intentionally scoped and loosely ordered. You do not need to read everything linearly, but most contributors will benefit from the following progression.

### 1. Running the system locally

If you want to run, debug, or modify Sisukas, start here:

- **[Running Sisukas Locally](./running-locally/)**  
  A complete, authoritative guide to the local development setup.  
  Covers HTTPS on localhost, required services, startup order, and common failure modes.

This page is the source of truth for local setup. The repository README and other pages intentionally defer to it.

### 2. Understanding where data comes from

Once the system is running, the next question is usually *where the data comes from*:

- **[Data Pipeline](./data-pipeline/)**  
  Explains how course metadata is fetched from the Aalto Open API, transformed, versioned, and distributed to runtime systems.

This document is essential for understanding why the frontend treats course data as immutable snapshots and why SISU data is handled separately at runtime.

### 3. Service boundaries and APIs

Sisukas is composed of several independent services with clear responsibilities:

- **[API Reference](./api/)**  
  Documents the SISU Wrapper REST API and its Python library, including how study group and schedule data is accessed.

This is the right place to look when modifying backend–frontend interactions or adding new endpoints.

### 4. Configuration and environments

For changes that involve setup, credentials, or deployment differences:

- **[Environment Variables Reference](./env/)**  
  Lists all supported `.env` variables by component, explains which ones are required, and clarifies what is safe to change in local development.

### 5. Tooling and automation

Finally, for contributors working on setup, CI, or onboarding flows:

- **[Makefile Reference](./makefile/)**  
  Describes the automation used to bootstrap the development environment, manage dependencies, and generate local HTTPS certificates.

This page explains *what `make setup` actually does* and when it is appropriate to rerun or partially rerun it.

## When to Use the Developer Guide

Use this section when you want to:

- modify system behavior or data flow,
- add new features or services,
- understand operational trade-offs,
- debug local or deployment-specific issues,
- or reason about why the system is structured the way it is.

Individual pages explain not only **what** the system does, but **why** it is structured that way, to help future contributors make changes without breaking core invariants.
