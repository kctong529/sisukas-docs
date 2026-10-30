---
weight: 6
title: "Developer Guide"
description: "Contributor-focused guide to running, debugging, and extending Sisukas: setup, services, data flow, and operations."
---

> [!NOTE]
> This section assumes familiarity with the core concepts (Plans, Schedule Pairs, Decision Slots) and the overall system structure. If you are new to the project, start with the [System Overview](../system-overview/) and [Concepts](../concepts/) sections before diving in here.

The Developer Guide is for contributors who want to understand how Sisukas is built, deployed, and operated in practice. It focuses on implementation details, system boundaries, and operational concerns rather than product philosophy or user-facing behavior.

## In this section

The documents under the Developer Guide are intentionally scoped and loosely ordered. You do not need to read everything linearly, but most contributors will benefit from the following progression.

### 1. Running the system locally

If you want to run, debug, or modify Sisukas, start here:

- **[Running Sisukas Locally](./running-locally/)**  
  A complete, authoritative guide to the local development setup.  
  Covers HTTPS on localhost, required services, startup order, and common failure modes.

This page is the source of truth for local setup. The repository README and other pages intentionally defer to it.

### 2. Understanding where data comes from

Once the system is running, the next question is usually *where the data comes from*:

- **[Course Data Architecture](./data-architecture/)**
  Introduces canonical publication, runtime resolution, caching, and their ownership boundaries before diving into individual workflows.

- **[Data Pipeline](./data-pipeline/)**  
  Explains how course metadata is fetched from the Aalto Open API, transformed, versioned, and distributed to runtime systems.

The scheduled workflow publishes canonical catalogues; the on-demand SISU wrapper serves a different runtime responsibility.

- **[Historical Course Records](./historical/)**  
  Covers historical discovery, checkpointed collection, normalization, and dataset maintenance.

- **[Curriculum Metadata](./curriculum-metadata/)**  
  Explains how Aalto curriculum modules are catalogued, verified against official sources, and integrated into Sisukas. Covers module identifiers, source attribution, review decisions, and validation.

### 3. Service boundaries and APIs

Sisukas is composed of several independent services with clear responsibilities:

- **[SISU Wrapper API](./api/)**
  Documents the SISU Wrapper REST API and its Python library, including how study group and schedule data is accessed.

This is the reference for the SISU wrapper. Consult the corresponding backend routes when changing other API endpoints.

- **[Study-event and Location Contract](./study-event-contract/)**  
  Describes event series identities, expanded occurrences, room/building resolution, and scheduling limitations.

### 4. User data and frontend state

- **[Transcript Import](./transcript-import/)**  
  Explains the implemented bulk import workflow and its transactional guarantees.

- **[Frontend State Management](./stores/)**  
  Defines Svelte 5 runes-based conventions for new and modernized stores, while acknowledging existing legacy state.

### 5. Configuration and environments

For changes that involve setup, credentials, or deployment differences:

- **[Environment Variables Reference](./env/)**  
  Lists all supported `.env` variables by component, explains which ones are required, and clarifies what is safe to change in local development.

### 6. Tooling and automation

Finally, for contributors working on setup, CI, or onboarding flows:

- **[Makefile Reference](./makefile/)**  
  Describes the automation used to bootstrap the development environment, manage dependencies, and generate local HTTPS certificates.

This page explains *what `make setup` actually does* and when it is appropriate to rerun or partially rerun it.

## Related documentation

- [System Overview](../system-overview/) — Start with the components and their responsibilities.
- [Concepts](../concepts/) — Planning terminology and design goals.
