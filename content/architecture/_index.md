---
weight: 7
title: "Architecture"
description: "System design, responsibilities, invariants, data contracts, and trade-offs."
---

> [!NOTE]
> Architecture answers **how Sisukas works and why it is designed that way**. These pages own technical explanations and contracts, not setup commands or operational runbooks. For a short introduction to the major services, read the [System Overview](../system-overview/); for application terminology, read [Concepts](../concepts/).

## Data and integration

- [Course Data](./course-data/) — Why published catalogues, runtime snapshots, teaching details, and curriculum metadata follow different lifecycles.
- [Teaching Events](./teaching-events/) — Observed SISU event identities, occurrences, and location-enrichment rules.
- [Study-group Loading](./study-group-loading/) — Shared frontend retrieval, caching, concurrency, and invalidation.

## Planning and frontend

- [Planning Architecture](./planning/) — Domain models, candidate generation, and planning algorithms, with implemented and proposed parts distinguished.
- [Frontend Organization](./frontend-organization/) — Module boundaries, dependencies, and migration rules.

## Calendar persistence

- [Calendar Visibility](./calendar-visibility-preferences/) — Visibility identity, inheritance, and ambiguity contracts.
- [Calendar Schema](./calendar-visibility-schema/) — Reviewed *proposal* for plan-scoped database persistence; no migration is implied.

## Working on the code

Use the [Developer Guide](../dev-guide/) for local setup, service commands, import operations, and state-convention checklists. For upcoming rather than deployed work, see [Under Development](../under-dev/).
