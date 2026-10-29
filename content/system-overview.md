---
weight: 4
title: "System Overview"
description: "How Sisukas is structured end-to-end: its frontend, backend APIs, SISU wrapper, published course data, and planning workflows."
---

> [!NOTE]
> If you are new to the codebase, start here for the responsibilities and interactions of the main components. The [Course Data Architecture](../dev-guide/data-architecture/) explains the data flows and publication boundaries in greater detail.

This page describes Sisukas as a running system: what each component owns, which data crosses component boundaries, and how those choices affect course discovery and planning. For the underlying planning models and algorithms, see [Planning Architecture](../architecture/planning/).

## What Sisukas Is (Technically)

Sisukas is a client-heavy course-planning application for Aalto students. It supports exploratory browsing and schedule comparison before registration in SISU, rather than replacing SISU as the system where students register for courses.

The frontend does much of the interactive work: it loads and indexes published course catalogues, filters courses, and manages planning interfaces. Backend services handle persistent user data, authentication and authorization, and computations that are exposed as APIs. SISU teaching information is retrieved separately when it is needed. That separation matters because a published catalogue, an upcoming lecture time, and a student's saved plan have different freshness and ownership requirements.

The system is designed to remain responsive when large catalogue files have been cached, but it is not fully offline: live teaching data, authenticated persistence, and uncached content still depend on network services.

## Core Components

The main components are independently deployed or operated and have distinct responsibilities.

### Frontend (Course Browser)

**Location:** `frontend/course-browser/`

The Svelte frontend presents course discovery, search and filtering, academic-year and curriculum views, planning interfaces, study-group selection, schedule comparison, and other user-facing workflows. It builds searchable indexes from active and historical course catalogues and caches large published files in IndexedDB, with hash-based background revalidation.

When detailed teaching information is required, the frontend calls `sisu-wrapper` for study groups, offerings, and events rather than relying on the scheduled catalogue for live scheduling data. It can also retrieve runtime course snapshots from the main backend to supplement historical discovery when a course is missing from the published catalogue.

> [!IMPORTANT]
> IndexedDB caching improves responsiveness and resilience, but does not guarantee complete offline operation or immediate freshness. A cached catalogue may be usable while network-dependent operations are unavailable. Likewise, cached teaching details should not be confused with a promise that upstream schedules never change.

### Main Backend API

**Location:** `backend/`

The Express backend exposes authenticated resources such as plans, favourites, grades, and transcript import, as well as analytics and course-snapshot endpoints. It uses **Better Auth** for user sessions and **Drizzle with PostgreSQL** for persistence. Middleware establishes session context; protected routes also need resource-specific authorization checks. A separate administrative token mechanism protects designated admin operations.

Schedule analytics are performed through backend endpoints using submitted planning and event data. This is different from fetching the current SISU teaching schedule: the browser can request teaching data through the wrapper, while analytics operate on the data provided for a calculation.

The backend also participates in missing-course recovery. Its `POST /api/course-snapshots/resolve` route calls the wrapper's course-resolution endpoint and persists eligible results as expiring PostgreSQL snapshots. Accordingly, it is **not** correct to say that the backend never contacts `sisu-wrapper`.

The backend does not run the scheduled canonical catalogue publication workflow. Database-backed state, runtime snapshot records, and published catalogue files have separate lifecycles.

### Filters API

**Location:** `filters-api/`

The filters API is a small service for saving and resolving shareable filter configurations. A saved configuration is identified by a stable identifier that can be embedded in a URL. Unlike a saved plan, it is not modeled as user-owned planning state; the identifier is used to retrieve the filter definition.

This service is deliberately separate from authenticated plan persistence and from schedule computation. Its role is to make sets of filtering choices shareable and recoverable without mixing them with a student's personal plan.

### SISU Wrapper

**Location:** `sisu-wrapper/`

The FastAPI wrapper adapts data from SISU Kori into endpoints consumed by Sisukas. It provides study-group and offering details for scheduling and supports course-code resolution for missing-course recovery. The frontend calls the wrapper directly for on-demand teaching information; the backend calls its resolution endpoint when creating runtime snapshots.

This path is time-sensitive and may fail independently of the last successfully published course catalogue. The wrapper is an adapter to an external source, not the canonical course catalogue store.

### Course Data Pipeline (Batch System)

**Locations:** `scripts/`, `.github/workflows/check_course_updates.yml`

A separate GitHub Actions workflow fetches course realisations from the Aalto Course API, transforms and validates the results, and reconciles them against the previously published catalogue. The reconciliation step accounts for removals, reactivations, and historical archive candidates, including safeguards against unexpectedly large archive transitions. Validated active and historical datasets, hashes, and related artifacts are published to Google Cloud Storage (GCS).

The workflow is scheduled daily and also supports the configured push and manual triggers. Its processing occurs outside ordinary user requests: browsing a course or viewing a schedule does not start the publication job. Conversely, the pipeline does not require the browser or backend to be active to publish a new catalogue.

The previous published datasets are inputs to reconciliation, so this process is not simply an unconditional overwrite using the latest upstream response. See [Data Pipeline](../dev-guide/data-pipeline/) for the operational sequence.

### External Systems and Storage

Aalto's Course API supplies course-realisations data for scheduled ingestion. SISU Kori supplies teaching details and course relationships used by the runtime wrapper and historical discovery. GCS distributes the published active and historical catalogues to browsers. PostgreSQL stores application data and runtime course snapshots. Curriculum metadata is also curated in YAML and review data; it does not originate automatically from the daily course-data fetch.

The components share information but **do not share one universal data source of truth**.

## Data Classes (Critical Distinction)

| Data class | Examples | How it is obtained | Lifecycle and authority |
| --- | --- | --- | --- |
| **Published catalogue** | Active `courses.json`, historical `historical.json` | Aalto Course API → validation/reconciliation → GCS | Canonical published Sisukas catalogue; versioned through publication and hash updates |
| **Runtime teaching details** | Study groups, offerings, teaching events | SISU Kori → `sisu-wrapper` → frontend | Time-sensitive; requested as needed and potentially changed upstream |
| **Runtime recovery snapshots** | Resolved missing course instances | SISU Kori → wrapper → backend → PostgreSQL → frontend | Expiring, best-effort supplementary records; not automatically canonical |
| **Curriculum metadata** | Programme/module membership and curated references | Repository YAML and review process | Independently maintained metadata used for discovery and validation |
| **User-owned state** | Plans, favourites, grades | Authenticated frontend ↔ backend ↔ PostgreSQL | Persistent, user-scoped; requires access checks |
| **Shareable filters** | Saved filter definitions | Frontend ↔ filters API | Addressable by identifier; distinct from user-owned plans |
| **Derived results** | Conflict analytics, schedule rankings | Backend computation from supplied planning data | Recomputed; not an independent upstream source |

> [!NOTE]
> “Canonical” here refers to the **published Sisukas course catalogue**, not to the claim that a cached or normalized record is always the most up-to-date information available from Aalto. The wrapper and runtime snapshots serve different purposes and should not silently overwrite that catalogue.

## How the System Is Used (End-to-End)

Different user actions cross different boundaries. A course search should not require the same services as an authenticated plan update or a live schedule lookup.

### 1. Course Discovery (Primarily Client-Side)

The frontend downloads the published active and, when needed, historical catalogue from GCS. The loader uses IndexedDB to reuse previously downloaded data and checks hashes for updates. Course parsers validate entries, and frontend stores build the indexes used for browsing and filtering.

Curated curriculum metadata influences programme- and module-based views. Routine catalogue filtering does not require a backend query for every search interaction. A first-time load still depends on obtaining the published files over the network; a previously cached copy may be older than the latest publication.

### 2. Planning and Persistence (User-Scoped and Shareable State)

For authenticated planning data, the frontend submits requests to the main backend. Session middleware identifies the user, route handlers check authorization, and PostgreSQL persists the user-scoped records. The frontend updates its presentation from the resulting application state.

Shareable filter configurations are different: they are saved through the filters API and recovered using a URL identifier. They are not the same kind of resource as an authenticated plan and should not inherit the plan's ownership assumptions.

Transcript import and grade storage are also backend responsibilities, illustrating why the main backend should not be described merely as a scheduling calculator.

### 3. Live Scheduling and Evaluation

When the user inspects teaching details or needs study-group choices, the frontend requests information through `sisu-wrapper`. The frontend's normalized study-group/event models are then used to prepare scheduling interactions. The backend's analytics endpoints can evaluate supplied selections for conflicts and rankings without being responsible for refreshing SISU teaching information on every calculation.

Avoid a blanket invariant that teaching information is fetched **exactly once** per course instance: caching and refresh behavior should be established from the relevant store and service implementation. What matters architecturally is the separation between **obtaining teaching data** and **deriving schedule results from it**.

### 4. Recovery of Missing Courses

When a course is absent from the published datasets, the backend can resolve the code through `sisu-wrapper` and store eligible returned records in PostgreSQL with an expiry period. The frontend can merge supported snapshots into its historical index on a best-effort basis.

A successful runtime recovery **does not** automatically add the course to `historical.json` on GCS. Canonical publication and historical maintenance use separate procedures, and the proposed delayed promotion workflow should not be mistaken for a deployed daily job.

## Runtime vs. Batch Systems

| Category | Components | When it runs |
| --- | --- | --- |
| **Scheduled / batch** | GitHub Actions course ingestion and publication | Daily or configured/manual triggers, independently of user sessions |
| **Runtime (browser)** | Course browsing, filtering, planning UI, IndexedDB caching | During user interaction and frontend loading |
| **Runtime (server)** | Main backend, filters API, `sisu-wrapper` | On API requests; services may persist records even if request handlers are short-lived |
| **External** | Aalto Course API, SISU Kori | Accessed by the scheduled pipeline or the runtime wrapper according to purpose |

The distinction is both temporal and functional. A published catalogue can remain available even if live SISU teaching endpoints temporarily fail; conversely, updating teaching details does not require rebuilding the entire course catalogue.

## Authority vs. Derivation

There is no single authority for every piece of information in a plan.

| Category | Examples | How to interpret it |
| --- | --- | --- |
| **Upstream source** | Aalto course realisations, SISU teaching events | Provided by external systems and normalized by Sisukas |
| **Published canonical data** | Active/historical GCS catalogues | Validated and published Sisukas view of course records |
| **User-authored state** | Saved plans, selected groups, grades | User-scoped state persisted by the application |
| **Supplementary recovery data** | Runtime course snapshots | Noncanonical records that can help restore missing course references |
| **Derived computation** | Conflicts, analytics, schedule pairs | Outputs calculated from available plan and teaching inputs |
| **Planned user decisions** | Decision Slots | A conceptual workflow, not automatically an implemented persistence contract |

Derived results should expose scheduling trade-offs rather than silently decide them for a user. For details on what has been implemented and what remains a design proposal, consult the corresponding Concepts and Planning Architecture pages.

## What Sisukas Explicitly Does Not Do

Sisukas does not register students for courses in SISU, guarantee that all teaching information is up to date without a refresh, or silently resolve every scheduling conflict. It is designed as a complementary planning workspace. Likewise, a runtime snapshot is not a substitute for the validated catalogue publication process.

These limits are deliberate boundaries, not merely missing UI features: Sisukas owns the planning experience, while registration and original academic records remain with the relevant Aalto systems.

## Where to Go Next

- Read [Why Sisukas](../why-sisukas/) for the motivation and user problem.
- Use the [Concepts Overview](../concepts/overview/) for the planning vocabulary.
- Continue to [Planning Architecture](../architecture/planning/) for domain models and computations.
- See [Course Data Architecture](../dev-guide/data-architecture/) for the diagram, data ownership, and failure boundaries.
- Read [Data Pipeline](../dev-guide/data-pipeline/) for the scheduled ingestion and publication workflow.
- Use the [Developer Guide](../dev-guide/) for setup, APIs, and implementation references.
