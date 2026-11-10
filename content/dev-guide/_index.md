---
weight: 6
title: "Developer Guide"
description: "Practical instructions for building, testing, running, and maintaining Sisukas."
---

> [!NOTE]
> The Developer Guide answers **what to do in the repository and how to do it**. Commands, environment requirements, API usage, maintenance, and failure recovery belong here. Architectural reasoning and stable data contracts live in [Architecture](../architecture/), not in duplicate explanations on these pages.

## Setup and tooling

- [Local Development](./running-locally/) — Start the services, configure local HTTPS, and troubleshoot startup.
- [Environment Variables](./env/) — Configure each service safely.
- [Makefile Reference](./makefile/) — Understand setup and maintenance targets.
- [State Conventions](./stores/) — Prescriptive Svelte store patterns for contributors; not a description of every existing runtime adapter.

## Data operations

- [Data Pipeline](./data-pipeline/) — Run, validate, reconcile, and publish course datasets.
- [Historical Records](./historical/) — Collect and maintain historical datasets.
- [Curriculum Metadata](./curriculum-metadata/) — Maintain curated curriculum source files and validation.
- [Transcript Import](./transcript-import/) — Operate and verify the import workflow.

## Service reference

- [SISU Wrapper API](./api/) — Wrapper endpoints and Python library usage.

## Read the design

- [Course Data](../architecture/course-data/) — Data ownership and canonical/runtime boundaries.
- [Teaching Events](../architecture/teaching-events/) — Event identity and location contracts.
- [Study-group Loading](../architecture/study-group-loading/) — In-memory retrieval architecture.
- [Calendar Visibility](../architecture/calendar-visibility-preferences/) and [Calendar Schema](../architecture/calendar-visibility-schema/) — Reviewed Calendar preference design, not yet deployed persistence.

For component orientation use [System Overview](../system-overview/); for unfinished features use [Under Development](../under-dev/).
