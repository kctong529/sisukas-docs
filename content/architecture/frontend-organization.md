---
weight: 3
title: "Frontend Architecture and Module Organization"
description: "Feature-oriented frontend ownership, reusable domain modules, dependency boundaries, and migration conventions."
---

> [!NOTE]
> **Architecture direction — November 2026.** This page defines the intended frontend organization under [#177](https://github.com/kctong529/sisukas/issues/177). It is **not a description of a completed migration**. The current `src/domain/`, `src/application/`, `src/infrastructure/`, `src/lib/`, and `src/components/` directories remain in use while modules are relocated incrementally. Existing paths and imports are valid until their respective migrations are merged.

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

For example, the first proposed migration is the study-group data subsystem:

```text
src/
└── modules/
    └── study-groups/
        ├── cache/          # Full-data entries and cache lifecycle
        ├── retrieval/      # Requests, coordination, transport, API access
        ├── stores/         # Svelte-facing observable adapters
        ├── StudyGroupDataRuntime.ts  # Runtime composition (initially)
        └── index.ts        # Deliberate public exports, if needed
```

The precise files and the ownership of `StudyGroup` / `StudyEvent` models will be confirmed by inspecting their dependencies during migration. The example does not require a `domain/`, `application/`, `infrastructure/`, `service/`, or `repository/` folder.

These terms still have useful meanings:

- **Domain logic** expresses concepts, constraints, and rules independent of HTTP, UI frameworks, or persistence.
- **Application orchestration** coordinates operations and lifecycle decisions, such as ensuring requested data is available.
- **Infrastructure** integrates with external APIs, storage, and technical mechanisms.
- **Stores** expose or manage state; an observable Svelte adapter is not necessarily the authoritative owner of the data.
- **Repositories** are introduced only when a data-access abstraction is needed. An in-memory cache does not automatically require a repository interface.

A file can have one of these responsibilities without living in a directory named after its architectural category. Likewise, `services/` should not be used as an unqualified catch-all.

## Domain ownership and public contracts

**Put a model with the capability that owns its meaning**, even when multiple features consume it. Sharing a type does not by itself justify moving it to `shared/`.

For the initial study-group migration, the default assumption is that the study-group module owns its source-data contracts, including `StudyGroup` and `StudyEvent`, subject to dependency review. Calendar may construct its own calendar projections from those types, but must not turn calendar-specific presentation decisions into study-group source-data rules.

Each capability should expose only what external consumers require. A public entry point such as `modules/study-groups/index.ts` may export types and read/retrieval operations without exporting cache mutation internals or coordinator scheduling controls. Do **not** add a barrel file merely for convenience; prefer explicit exports and deliberate APIs.

For example, a future Calendar import might use a stable module interface:

```ts
import { getStudyGroupDataRuntime } from "@modules/study-groups";
```

This is an **illustrative target import**, not an alias or entry point guaranteed to exist today. The exact public exports and aliases must be introduced together with their implementation and verified by TypeScript.

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

## State and reactive integration

A Svelte store or adapter is a presentation-facing state interface, not necessarily the source of truth. In the study-group subsystem, the full-data cache owns authoritative records; its Svelte adapter observes changes and exposes read-only snapshots. Calling `entry()` alone does not trigger retrieval.

Existing Svelte 5 store conventions are documented in [Frontend State Management](../../dev-guide/stores/). The `{ state, read, actions }` convention applies where an appropriate rune-store interface is being implemented; it should **not** be imposed mechanically on read-only adapters or framework-independent caches.

Preserve successful-empty, missing, loading, failed, and refresh semantics when migrating the study-group subsystem. Refer to [Study-group Data Management](../study-group-loading/) for its established lifecycle and cancellation contracts.

## Tests and migration workflow

Tests should remain easy to locate from the production capability. The preferred direction is for `tests/` to mirror capability ownership, for example `tests/modules/study-groups/` and `tests/features/calendar/`, while existing test locations remain valid during transition. Use one consistent rule for a migrated capability rather than scattering its tests across old and new trees.

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
> **Current state:** The feature-oriented structure is a target. The frontend still uses its existing layered directories. Do not follow the example imports or delete legacy directories until the corresponding changes are merged.

1. **[#177](https://github.com/kctong529/sisukas/issues/177):** Establish these conventions, map the study-group subsystem, complete the first behavior-preserving relocation, and record follow-up migrations.
2. **[#173](https://github.com/kctong529/sisukas/issues/173):** Introduce centralized study-group loading policy on the settled module boundaries.
3. **[#174](https://github.com/kctong529/sisukas/issues/174):** Migrate Calendar, Favourites, and other consumers to the shared runtime.
4. **[#175](https://github.com/kctong529/sisukas/issues/175):** Remove legacy loading infrastructure and benchmark the consolidated path.

Other feature migrations (for example Calendar, planning, and filters) should be independently scoped and need not block completion of #177.

## Related documentation

- [System Overview](../../system-overview/) — Main application responsibilities.
- [Study-group Data Management](../study-group-loading/) — Cache, request coordination, runtime, and cancellation semantics.
- [Frontend State Management](../../dev-guide/stores/) — Store conventions and transitional reactive state.
- [Course Data Architecture](../../dev-guide/data-architecture/) — Course data provenance and runtime retrieval.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — Source identities, occurrences, and location metadata.
