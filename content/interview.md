---
weight: 2
title: "Interview Prep"
bookHidden: true
---

Sisukas is a course planning system I built that evolved from a static browser into a constraint-aware backend system with historical persistence and deterministic dataset guarantees.

It evolved in distinct phases, each triggered by a real limitation or breakage. I can walk you through that evolution.

---

## 0️⃣ Origin: Second Year Curiosity

Sisukas didn't start as a "project idea."

In my second year, I was trying to explore elective options, and I found SISU frustrating for browsing.

It wasn't that SISU was broken: it just wasn't optimized for exploration.

So I started poking around.

That's when I discovered Aalto's official public course API.

It wasn't hidden: it was documented and publicly accessible.

Out of curiosity, I started experimenting with it.

At that time, I wasn't planning to build a system.

I just wanted to see:

* What data is available?
* Can I visualize it differently?
* Can browsing be simpler?

That curiosity phase eventually became Sisukas.

---

## 1️⃣ Static Browser Using Official API

The first real version of Sisukas was completely static.

Architecture:

* Fetch structured course metadata from the official API
* Generate a dataset
* Serve a static frontend
* Do all filtering client-side

There was no backend.
No database.
No user accounts.

Why?

Because the problem didn't require it.

The dataset size made client-side filtering feasible. The data was pre-generated and versioned, so filtering never depended on network calls. Browsing worked offline through cached datasets, which kept exploration responsive even with unstable connectivity.

Operational complexity was minimal.

This phase lasted several months.

And importantly: it worked.

At that stage, Sisukas was just:

A fast interface over official data.

And that was enough.

---

## 2️⃣ The First Inflection Point: Event-Level Metadata

Later, when thinking about planning rather than browsing, I realized:

The official public API did not expose detailed scheduling data per course instance.

While inspecting SISU's network calls, I noticed the frontend fetched richer event-level metadata.

This was not in the public API.

Before building on that, I contacted Aalto IT to ask whether there was a supported interface for accessing this data.

There wasn't a clear public one.

So I evaluated whether using the same publicly accessible endpoints as the official frontend was reasonable:

* No authentication bypass
* No scraping beyond what the official client loads
* Respectful request patterns

This unlocked instance-level modeling.

And that fundamentally changed the system.

Sisukas could now reason about time conflicts.

It was no longer just browsing.

---

## 3️⃣ Transitional Architecture: Two Targeted APIs

Instead of jumping straight into a "real backend," I added two focused services.

### Filters API

Filtering became more complex.

I wanted:

* Shareable filter configurations
* Deterministic reproducibility

Instead of encoding JSON blobs in URLs, I built a Filters API that:

* Deterministically hashes filter configurations
* Stores them
* Returns a short identifier

This allowed clean, shareable, stable URLs.

It wasn't a user system.
Just config → hash mapping.

---

### SISU Wrapper API

The event metadata required:

* Normalization
* Reshaping
* Shielding from upstream structural drift

So I built a wrapper API that:

* Fetches upstream event data
* Transforms it into a stable internal format
* Caches responses

At this point, Sisukas looked like:

* Static frontend
* Filters API
* Wrapper API

Still no full domain backend.

---

### Introducing User Accounts & Plans

Up to this point, Sisukas was mostly stateless: filters were shareable, and scheduling data was normalized, but nothing persisted per user.

That changed when students wanted to:

* Save favourite courses
* Create and revisit semester plans

At that moment, a static architecture wasn't enough.

I introduced user accounts and a database-backed backend with basic persistence for favourites and plans.

This was the moment Sisukas stopped being a tool and became a system of record for users.

Once it became stateful, correctness and data integrity started to matter much more.

It also changed how I approached performance. Instead of optimizing purely client-side, I reduced round trips, batched related requests, and ensured non-critical data loads asynchronously so primary rendering never blocks.

Once users could save plans, the next natural question was:

> Can the system help evaluate whether a saved plan is actually feasible?

That's what led to overlap minimization.

---

## 4️⃣ Planning: Overlap Minimization Under Uncertainty

As I talked to students, I kept hearing questions like:

* "If I take these courses together, will they clash?"
* "Is this combination realistically attendable?"
* "Are the overlaps minor or impossible?"

That's when Sisukas moved from browsing into constraint reasoning.

I implemented a backend module that evaluates combinations of study groups and ranks them by how much their time intervals overlap.

The idea was simple:

For each block where students can choose between multiple study groups, the system explores combinations and prefers those with fewer overlapping events.

This became the first part of Sisukas that was computationally non-trivial.
Enumerating combinations can grow quickly, so I designed it for realistic semester-scale inputs and benchmarked it to ensure it stays interactive.

But there was an important limitation:

I don't have reliable data about which events are mandatory.

So the system can detect structural overlap, but it can't yet distinguish between:

* Hard conflicts (mandatory attendance)
* Soft conflicts (optional sessions)

That means the ranking is technically correct in terms of time conflicts, but semantically incomplete.

In parallel, I experimented with a summarized heatmap that aggregated scheduling density across weeks.

Technically it was derived from the overlap analysis, but users found it unintuitive: compressing all weeks into one view reduced clarity.

At that point, I realized two things:

1. Overlap minimization alone doesn't capture the full planning problem.
2. Without attendance semantics, I shouldn't formalize ranking invariants too aggressively.

So I paused further heuristic expansion and waited for stronger user signal.

---

## 5️⃣ External Trigger: SISU Retires Timeline

Until then, Sisukas was primarily future-oriented:

* Explore options
* Detect overlaps
* Compare combinations

It helped answer:

> "Can I take these courses together next semester?"

But then two months ago, SISU retired the Timeline view.

There was no longer a clear way in SISU to see your academic progression in one place. You could toggle events on a calendar, but that's event visibility: not planning.

That's when I realized Sisukas couldn't just be forward-looking.

It also needed to:

* Remember past courses
* Preserve course metadata even after it disappears upstream
* Stay stable across academic years

That's when I introduced a historical dataset layer.

### The Architectural Shift

The active dataset reflects only what currently exists upstream.

So when a course disappears, it disappears from the system.

That's acceptable for browsing.

It's not acceptable for continuity.

So I introduced a historical dataset layer:

* Active dataset for current offerings
* Append-only historical dataset for past course metadata

From that point on, Sisukas stopped being just a smart browser over live data.

It became a system with memory.

And once you introduce memory, you introduce invariants.

That's when the backend architecture truly solidified.

---

## 6️⃣ Historical Dataset: Built Overnight

To support that shift, I needed historical metadata.

So I built a best-effort historical dataset generation pipeline.

Over one night, I:

* Iterated through known course codes
* Queried past offerings
* Deduplicated records
* Normalized them into the internal schema
* Ensured compatibility with the active dataset

This gave Sisukas basic historical memory.

At that point, I thought the problem was largely solved.

But then a new issue appeared.

---

## 7️⃣ Transcript Import & The Missing Courses Problem

I implemented a SISU transcript parsing feature.

The idea was:

* Users upload or paste their SISU transcript
* Sisukas parses it
* Their previous studies are imported automatically
* Minimal manual interaction required

This made historical awareness practical.

But while testing it on my own transcript, I discovered something troubling:

Some of the courses I had previously taken were not found in Sisukas.

They weren't in the active dataset.
And they also weren't in the initial historical dataset.

That was a critical moment.

Because transcript import assumes:

> If a course existed and a student completed it, the system must recognize it.

Now I had a correctness gap.

And correctness, once you import transcripts, is no longer optional.

---

### What This Revealed

The historical dataset I generated was best-effort.

But it wasn't complete.

And worse:

There was no mechanism to backfill missing historical instances deterministically.

This is when I realized:

A historical dataset cannot be "fire and forget."

It needs:

* Controlled backfill capability
* Deterministic promotion rules
* Protection against duplication
* Append-only guarantees

That's when snapshot/backfill mechanisms became necessary.

### Backend Consolidation

At this stage, Sisukas wasn't just:

* A planner
* Or a browser
* Or a visualization tool

It was now responsible for representing a student's academic history correctly.

That requires stronger guarantees.

So I consolidated everything into a structured backend with:

* Explicit domain models
* PostgreSQL invariants
* Active vs append-only historical separation
* Deterministic snapshot promotion
* CI-controlled dataset updates

The backend didn't emerge from feature expansion.

It emerged from correctness obligations.

---

### Current State: Backfill Implemented, Promotion Contracting

At this point, the snapshot/backfill mechanism itself is implemented and functional.

If a transcript import discovers a missing historical course, the system can:

* Fetch the necessary upstream data
* Normalize it
* Stage it safely
* Ensure it does not violate dataset invariants

What I have not fully finalized yet is the deterministic promotion pipeline that governs how staged historical data graduates into the canonical historical dataset.

That's deliberate.

The official curriculum for next year hasn't been published yet, so there isn't strong user pressure at the moment.

Instead of rushing to close v1.0 quickly, I decided to formalize correctness requirements first.

I wrote a v1.0.0 release contract that defines:

* What invariants must hold
* What states are considered valid
* What dataset transitions are allowed
* What failure modes are acceptable

My goal is to ship v1.0 by mid-March, but only after those guarantees are fully satisfied.

At this stage, the focus is not feature expansion.

It's correctness hardening.

---

## Final Reflection

Looking back, Sisukas evolved through pressure:

* Curiosity → static browser
* Scheduling metadata → constraint reasoning
* Statefulness → data integrity
* Timeline removal → historical memory
* Transcript import → correctness invariants

Nothing was designed as a grand system upfront.
Each layer was introduced only when the previous guarantees became insufficient.
