---
weight: 3
title: "Frontend Architecture and Module Organization"
description: "Capability-oriented frontend ownership, public module contracts, dependency boundaries, and incremental migration conventions."
---

> [!NOTE]
> **Architecture direction — November 2026.** This page defines the capability-oriented frontend organization established under [#177](https://github.com/kctong529/sisukas/issues/177). The study-group data subsystem is the first reference implementation, and [#173](https://github.com/kctong529/sisukas/issues/173) now uses `src/app/` to coordinate authentication and active-plan loading. The broader frontend migration remains incremental, and existing `src/domain/`, `src/application/`, `src/infrastructure/`, `src/lib/`, and `src/components/` directories remain in use until their respective capabilities are relocated.

## Goals and organizing principles

Sisukas has several user-facing workflows—Calendar, Favourites, course browsing, and planning—that rely on shared concepts and data services. Earlier restructuring improved separation between domain, application, infrastructure, and presentation code, but it left individual capabilities distributed across unrelated top-level directories. The directory name often indicates a *technical layer* without indicating *who owns the code*.

The target organization prioritizes **cohesive ownership**, while retaining separation of responsibilities where useful:

- **Organize by capability before technical layer.** Code for a workflow or reusable subsystem should be easy to locate and understand together.
- **Distinguish user features from foundational modules.** Not every important domain concept is a feature or has a screen of its own.
- **Make dependencies explicit.** Consumers should rely on a module's public contract rather than reaching into its implementation.
- **Avoid mandatory internal templates.** Introduce directories such as `cache/`, `retrieval/`, `domain/`, or `stores/` only when they clarify real responsibilities.
- **Preserve behavior during migration.** File moves and import changes should be reviewable independently of new functionality.

This direction succeeds the layered frontend reorganization recorded under [#152](https://github.com/kctong529/sisukas/issues/152). The conventions that were not documented there will be established here for the new architecture rather than formalizing an organization that is being replaced.

## Top-level ownership

The following is a **target vocabulary**, not a requirement to create every directory immediately:

```text
src/
├── app/          # Startup, application composition, global wiring
├── features/     # User-facing workflows and interactions
├── modules/      # Reusable, domain-oriented capabilities
├── shared/       # Truly generic utilities and UI primitives
└── data/         # Static source-controlled datasets
```

| Area | Owns | Examples and boundaries |
| --- | --- | --- |
| `app/` | Application entry points, routing or global setup, and composition that spans multiple capabilities | Bootstrap and initialization; not a general home for business logic |
| `features/` | End-user workflows, their UI, and workflow-specific rules | Calendar, Favourites, course browsing, planning |
| `modules/` | Independently owned domain capabilities consumed by multiple features | Study-group data management; potentially course catalogue or academic-period data after their ownership is evaluated |
| `shared/` | Code with no meaningful feature or domain-module owner | Generic helpers and reusable visual primitives; **not** a replacement for `lib/` |
| `data/` | Static, versioned reference data | Curriculum and academic-period source files, where appropriate |

A module does **not** become a feature simply because several screens use it. `StudyGroup` and `StudyEvent` are domain concepts; the subsystem that retrieves, caches, and exposes them is a reusable data capability. Calendar and Favourites use that capability but do not own it.

Conversely, placing an item in `modules/` should be justified by cohesive ownership and a stable contract. Avoid creating a separate module for every data type or class.

## Organizing code within a capability

Use directories named for **actual responsibilities**, not a required set of architectural layers. A small feature may need only a few files; a larger capability may reasonably separate state, retrieval, rendering, and domain policies.

The study-group data subsystem is the first implemented reference module:

```text
src/
└── modules/
    └── study-groups/
        ├── cache/                    # Full-data entries and cache lifecycle
        ├── formatters/               # Existing study-group formatting utilities
        ├── infrastructure/           # API access and transport
        ├── models/                   # Source-data contracts
        ├── retrieval/                # Requests, coordination, cancellation
        ├── stores/                   # Svelte-facing observable adapters
        ├── StudyGroupDataRuntime.ts
        └── index.ts                  # Explicit public contract
```

These terms still have useful meanings:

- **Domain logic** expresses concepts, constraints, and rules independent of HTTP, UI frameworks, or persistence.
- **Application orchestration** coordinates operations and lifecycle decisions, such as ensuring requested data is available.
- **Infrastructure** integrates with external APIs, storage, and technical mechanisms.
- **Stores** expose or manage state; an observable Svelte adapter is not necessarily the authoritative owner of the data.
- **Repositories** are introduced only when a data-access abstraction is needed. An in-memory cache does not automatically require a repository interface.

A file can have one of these responsibilities without living in a directory named after its architectural category. Likewise, `services/` should not be used as an unqualified catch-all.

## Domain ownership and public contracts

**Put a model with the capability that owns its meaning**, even when multiple features consume it. Sharing a type does not by itself justify moving it to `shared/`.

The study-group module owns its source-data contracts, including `StudyGroup`, `StudyEvent`, and `StudyLocation`. Calendar may construct its own projections from those types, but calendar-specific presentation decisions must not become study-group source-data rules.

Each capability should expose only what external consumers require. A public entry point such as `modules/study-groups/index.ts` may export types and read/retrieval operations without exporting cache mutation internals or coordinator scheduling controls. Do **not** add a barrel file merely for convenience; prefer explicit exports and deliberate APIs.

### Study-group public interface

The study-group module provides a deliberate public entry point at `src/modules/study-groups/index.ts`.

External consumers should import supported domain contracts and runtime operations through `@modules/study-groups`:

```ts
import {
  getStudyGroupDataRuntime,
  type StudyGroup,
  type StudyEvent,
  type StudyGroupRequest,
} from "@modules/study-groups";
```

The public interface includes source-data models, retrieval request and observable entry-state contracts, and the shared runtime facade.

The runtime's internal construction, cache lifecycle, request coordination, transport, and service implementations are not exported through this entry point.

A public type may be defined in an internal directory such as `cache/` or `retrieval/`. Its inclusion in the public entry point makes that particular type part of the supported contract; it does not expose the surrounding implementation.

Internal code within the study-group module may import its own implementation files directly. Focused implementation tests may do the same.

Existing formatting utilities are not included in the core public interface. Their current external consumers retain documented transitional imports until their ownership is reconsidered during later migrations.

The public entry point does not introduce retrieval side effects. Calling `entry()` alone remains observational and does not initiate network retrieval. The separate application-owned lifecycle introduced in #173 calls `ensure()` for resolved offerings in the authenticated active plan.

## Dependency rules

The intended dependency direction is:

```text
app/ -> features/ -> modules/ -> shared/
  |         |                     
  +---------+--------------------> shared/
```

This is a general ownership rule, **not** a ban on all justified feature-to-feature cooperation:

1. `app/` may assemble features and modules, but ordinary domain modules must not depend on application startup or global UI setup.
2. A feature may consume a module's public API; a foundational module must not import its consumer feature.
3. Cross-feature imports should use an explicit public interface or a purpose-built shared contract, not private implementation paths.
4. Modules can depend on other modules when ownership is clear and the dependency remains acyclic. Reassess mutual dependencies rather than masking cycles with import aliases.
5. Keep external API and browser-specific dependencies at appropriate boundaries; pure business rules should remain independently testable.
6. Avoid deep imports into another capability's `cache/`, `retrieval/`, or other internal directories unless a temporary migration exception is documented.

The study-group module should therefore **not** import Calendar, Favourites, or planning code. Those consumers should use the public study-group contract. Runtime composition that genuinely spans multiple capabilities belongs under `app/`; a factory assembling only the internals of one module may remain within that module.

### Import boundary enforcement

The study-group module is the first capability with an automatically checked public import boundary.

A local ESLint rule prevents production code outside `src/modules/study-groups/` from importing private study-group implementation files. External consumers should use the public `@modules/study-groups` entry point.

The rule allows:

- Direct implementation imports within the owning study-group module.
- Focused implementation tests that verify internal components.
- Explicitly documented transitional production dependencies.

Current transitional exceptions:

| Consumer | Dependency | Reason |
| --- | --- | --- |
| `src/components/courses/StudyGroupsSection.svelte` | `formatters/studyGroupFormatters` | Presentation formatting pending ownership review |
| `src/lib/stores/studyGroupStore.svelte.ts` | `formatters/studyGroupFormatters` | Legacy presentation dependency |
| `src/lib/stores/studyGroupStore.svelte.ts` | `infrastructure/StudyGroupService` | Legacy service dependency pending consumer migration under #174 |

These exceptions are temporary and should be removed when their consumers are migrated. They do not justify adding private implementation types to the module's public API.

This enforcement currently applies to the study-group reference module. Other capability boundaries should be introduced incrementally as ownership and public contracts are established.

## State and reactive integration

A Svelte store or adapter is a presentation-facing state interface, not necessarily the source of truth. In the study-group subsystem, the full-data cache owns authoritative records; its Svelte adapter observes changes and exposes read-only snapshots. Calling `entry()` alone does not trigger retrieval.

Existing Svelte 5 store conventions are documented in [Frontend State Management](../../dev-guide/stores/). The `{ state, read, actions }` convention applies where an appropriate rune-store interface is being implemented; it should **not** be imposed mechanically on read-only adapters or framework-independent caches.

Preserve successful-empty, missing, loading, failed, and refresh semantics when migrating the study-group subsystem. Refer to [Study-group Data Management](../study-group-loading/) for its established lifecycle and cancellation contracts.

### Application composition and loading ownership

`src/app/auth/AuthenticatedDataLifecycle.svelte` now coordinates settled authentication transitions and the initialization/clearing of plans, favourites, grades, and both study-group caches. Its controller (`authenticatedPlanLifecycle.ts`) delegates actual data operations to the owning stores. This avoids making individual views responsible for account setup.

`src/app/study-group-loading/activePlanRequests.ts` selects deduplicated active-plan offering requests using the active course index. The application waits for authenticated session settlement, plan hydration, and `activeReady` before invoking the shared runtime's `ensure()`. A stable derived loading key prevents equivalent session updates from reinitiating the same demand.

These are **application orchestration responsibilities**, not responsibilities of `modules/study-groups/`. The runtime still owns cache-aware retrieval and remains independent of the Calendar and Favourites. Consumer-level observation and on-demand retrieval remain part of #174; clearing the legacy cache remains necessary until #175.

## Tests and migration workflow

Study-group implementation tests are organized under `tests/modules/study-groups/`, grouped by cache, retrieval, infrastructure, stores, and integration responsibilities. The import-boundary rule is tested separately under `tests/scripts/`. Tests belonging to capabilities that have not yet migrated retain their existing locations.

For each migration slice:

1. **Inventory ownership and dependencies.** List implementation files, imports, consumers, tests, and any circular dependencies before choosing destinations.
2. **Agree on the public surface.** Identify externally used types and operations versus internal cache, transport, and coordinator details.
3. **Move code without altering behavior.** Keep file moves and import/alias changes separate from refactoring algorithms or state semantics whenever feasible.
4. **Move and update tests alongside the code.** Avoid long periods in which source and tests use conflicting organization schemes.
5. **Validate each slice.** Run relevant focused tests, lint, Svelte/TypeScript checks, the full frontend test suite, and the production build for the final migration.
6. **Document any temporary exceptions.** Remove compatibility paths and transitional aliases when their consumers are migrated.

The existing frontend baseline at the end of [#172](https://github.com/kctong529/sisukas/issues/172) was **609 passing tests across 54 files**, with successful lint, type checks, and production build. Treat it as a historical comparison, not a fixed count for future branches.

## Migration status and planned sequence

> [!IMPORTANT]
> **Incremental adoption.** The study-group data subsystem is the first migrated reusable module. The broader `app/`, `features/`, `modules/`, `shared/`, and `data/` organization remains the target architecture. Existing layered directories and imports remain valid until their respective migrations are completed.

1. **#177 — Capability organization and module boundaries:** Establish ownership conventions, the study-group reference module, deliberate public contracts, and import-boundary enforcement.
2. **#173 — Authenticated lifecycle and default loading (complete):** Centralize account initialization and invalidation, derive active-plan demand after catalogue readiness, and invoke the shared runtime.
3. **#174 — Study-group consumer migration (next):** Migrate Calendar, Favourites, StudyGroupsSection, LEGO, and other consumers to the shared runtime.
4. **#175 — Legacy loading cleanup:** Remove superseded infrastructure and benchmark the consolidated implementation.

The reference module demonstrates the intended architectural principles without requiring a repository-wide reorganization.

Additional feature migrations, including Calendar, planning, course browsing, and filters, will be scoped separately based on dependency and ownership reviews.

After #173, the focused lifecycle/readiness suite passed 57 tests across 8 files, and the complete frontend suite passed 672 tests across 63 files. ESLint, application and test TypeScript checks, and the production/PWA build passed. The earlier #177 reference-module milestone passed 615 tests across 55 files; the [#172](https://github.com/kctong529/sisukas/issues/172) runtime baseline was 609 tests across 54 files.

## Related documentation

- [System Overview](../../system-overview/) — Main application responsibilities.
- [Study-group Data Management](../study-group-loading/) — Cache, request coordination, runtime, and cancellation semantics.
- [Frontend State Management](../../dev-guide/stores/) — Store conventions and transitional reactive state.
- [Course Data Architecture](../../dev-guide/data-architecture/) — Course data provenance and runtime retrieval.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — Source identities, occurrences, and location metadata.
