---
weight: 4
title: "System Overview"
---

> [!NOTE]
> If you are new to the codebase, start here before reading Concepts or Architecture.

This page explains how Sisukas is structured as a system: what components exist, what each one is responsible for, and how the system is used in practice.

## What Sisukas Is (Technically)

Sisukas is a client-heavy planning application with a thin backend. It is built around the idea that most planning work should happen fast, locally, and without premature commitments. Course discovery and planning are designed to remain responsive even under poor network conditions, while correctness-sensitive data is handled explicitly and on demand.

The system combines pre-fetched and cached course metadata for discovery, client-owned schedule data for accuracy, and user-scoped persistence for plans and decisions. Sisukas does not replace SISU. Instead, it complements it by providing a workspace for exploration, comparison, and deliberate decision-making before registration.

## Core Components

Sisukas is composed of several distinct components, each with clearly defined responsibilities and boundaries.

### Frontend (Course Browser)

**Location:** `frontend/course-browser`  
**Hosting:** Fly.io

The frontend is responsible for course discovery, filtering, and presentation of course metadata. It provides all planning-related user interfaces, including plan creation and editing, partitioning study groups into blocks, schedule visualization, and decision-making workflows. It also manages client-side caching using IndexedDB.

> [!IMPORTANT]
> The frontend runs entirely in the browser and can function offline once course data has been cached. It owns the current truth for study group data in active Plans and treats course metadata as immutable snapshots rather than live data.

### Backend APIs

**Location:** `backend/`, `filters-api/`  
**Hosting:** Google Cloud Run

The backend APIs are responsible for user authentication and authorization, persistence of user-scoped data such as plans, favorites, and feedback, and enforcement of ownership and access rules. They also perform deterministic schedule computation based solely on client-provided input.

The `filters-api/` is intentionally minimal and completely independent of user accounts. Its sole responsibility is to persist a filter configuration and return a stable identifier that can be embedded in a URL. This allows filter sets to be shared, bookmarked, or restored via URL parameters without requiring authentication or ownership. Saved filters are not attached to any user and carry no permissions or access control beyond possession of the identifier.

The filters API does not participate in planning logic, scheduling, or any user-scoped state. It exists purely as a lightweight serialization and lookup mechanism for filter definitions.

> [!TIP]
> All backend services are stateless and perform no long-lived or background computation. They do not fetch data from SISU. Data security for user-scoped resources is enforced both at the API layer and at the database layer, following a defense-in-depth approach.

### SISU Wrapper

**Location:** `sisu-wrapper`  
**Hosting:** Google Cloud Run

The SISU Wrapper is responsible for fetching live study group and schedule data from SISU and translating SISU responses into a stable internal format. It is used exclusively by the frontend and queried only when needed. All data retrieved through the wrapper is treated as volatile and time-sensitive.

### Data Pipeline (Batch System)

**Location:** `scripts/` + GitHub Actions

The data pipeline fetches course metadata from the Aalto Open API, transforms and reduces the data, detects changes, and uploads versioned artifacts to Google Cloud Storage. It runs either on a daily schedule or manually and produces immutable outputs such as `courses.json`.

This pipeline is completely decoupled from runtime systems and has no direct interaction with either the frontend or backend during normal user operation.

### External Systems

Sisukas depends on several external services. Course metadata is sourced from the Aalto Open API. Live study group and schedule data comes from the Aalto SISU API. Static course data is hosted on Google Cloud Storage, while Supabase provides the database, authentication, and row-level security used by the backend.

## Data Classes (Critical Distinction)

Sisukas relies on a strict separation between three kinds of data.

| Data Class | Examples | Source | Characteristics |
|-----------|--------|--------|----------------|
| **Static** | `courses.json` | Aalto Open API → GCS | Large, cacheable, slow-changing |
| **Dynamic** | Study groups, schedules | SISU API (via frontend) | Accurate, volatile |
| **User** | Plans, favorites, partitions | Supabase | Persistent, user-scoped |

> [!NOTE]
> This separation explains many design decisions throughout the system. Plans store instance identifiers rather than course data. Schedule results are computed on demand rather than stored. SISU data is fetched only when required, and frontend caching can be aggressive without risking stale or inconsistent user state.

## How the System Is Used (End-to-End)

Sisukas operates in three distinct modes, depending on user activity.

### 1. Course Discovery (no backend involvement)

When a user browses and filters courses, the frontend loads `courses.json` from Google Cloud Storage and caches it locally in IndexedDB. All filtering and searching happens entirely in the browser. The backend is not involved in this phase.

### 2. Planning and Persistence (user-scoped and anonymous state)

When a user creates or edits Plans, Favorites, or other user-scoped entities, the frontend sends authenticated requests to backend APIs hosted on Google Cloud Run. The backend validates ownership, persists the data in Supabase, and returns updated entities to the frontend, where changes are reflected immediately in the user interface. The backend itself remains stateless, and Supabase acts as the source of truth for all user-owned data.

Saved filter configurations follow a different model. When a user chooses to save a set of filters for sharing or later reuse, the frontend stores the filter definition via the filters API and receives a stable identifier in return. This identifier can be embedded in a URL and later resolved to restore the filter state. Saved filters are anonymous, are not attached to any user account, and do not require authentication. They exist purely as addressable filter definitions and are independent of plans or other user-scoped state.

### 3. Schedule Evaluation (client-owned truth)

When a course instance is added to the active Plan, the frontend fetches the live study group data once for that instance. This data becomes the frontend’s source of truth for that instance and is reused across partitioning, schedule computation, and conflict analysis.

When schedule computation is requested, the frontend sends the backend the selected instances, the current partition structure, and the cached study group and event data. The backend performs deterministic computation, including overlap detection, scoring, and ranking, and returns the computed results to the frontend for inspection and decision-making. The backend never fetches data from SISU.

> [!IMPORTANT]
> **Invariant:** Once a course instance exists in the active Plan, its study group data is fetched exactly once and reused until the instance is removed or explicitly refreshed.

## Runtime vs Batch Systems

Sisukas clearly separates when things happen as well as where they happen.

| Category | Components |
|--------|-----------|
| **Batch / Offline** | Data Pipeline (GitHub Actions) |
| **Runtime (Browser)** | Frontend filtering, planning, scheduling |
| **Runtime (Server)** | Backend APIs, deterministic computation |
| **External** | SISU, Aalto Open API |

This separation keeps runtime systems fast, predictable, and easy to reason about.

## Authority vs Derivation

Not all data in Sisukas is equally authoritative.

| Type | Examples | Notes |
|----|--------|------|
| **Authoritative** | Course metadata, study groups | Comes from Aalto systems |
| **Derived** | Schedule pairs, conflict analytics | Recomputed on demand |
| **Derived + Confirmed** | Decision Slots (planned) | Explicit user choices |

Sisukas never silently resolves conflicts. All trade-offs remain visible and intentional.

## What Sisukas Explicitly Does Not Do

Sisukas does not perform course registration, does not enforce degree requirements, does not automatically resolve conflicts, does not assume that all events are mandatory, and does not replace SISU. These constraints are deliberate and shape the architecture.

## Where to Go Next

- Read [Why Sisukas](../why-sisukas/) to understand the problem and motivation.
- See the [Concepts Overview](../concepts/overview/) for planning philosophy and terminology.
- Continue to the [Planning Architecture](../architecture/planning/) to see how Plans, Schedule Pairs, and Decision Slots are built.
- Proceed to the **Developer Guide** for setup, APIs, and system internals.
