---
weight: 5
title: "Semester Planning"
---

# Semester Planning: The Next Phase

## Current Implementation Status

> [!WARNING]
> **Planning features are in development.** The live app currently supports course discovery, filtering, and filter sharing. Plans, SchedulePairs, Decision Slots, and planning tools are not yet available. See the status table below for details.

| Feature | Status | Notes |
|---------|--------|-------|
| Plans | Partial backend | UI coming soon |
| SchedulePairs | Service prototype | Core logic being refined |
| Decision Slots | Designed | Not yet implemented |
| Calendar views | Planned | Foundation work needed |
| Reflection tools | Future | Dependent on earlier phases |

## The Core Insight

Most scheduling tools treat overlapping courses as an error to prevent. Sisukas takes the opposite view: **overlaps are inevitable and normal.** The goal is not to eliminate them, but to surface them clearly so students can make explicit trade-offs.

This fundamental shift changes how we approach planning and scheduling.

## Why This Approach?

### Reality-Based

Students actually deal with overlapping lectures, exercises, and exams. They make trade-offs, skip sessions, watch recordings later, or prioritize one course over another. Sisukas builds around this reality instead of ignoring it.

### Transparent

By making conflicts explicit and visible, students:
- Understand their actual commitments
- Make conscious trade-offs rather than defaulting
- Reflect on patterns to improve future planning

### Empowering

Instead of a scheduling algorithm that assigns your time, you retain control. You see the options, understand the trade-offs, and make informed choices.

## The Abstraction Problem

> [!IMPORTANT]
> In course discovery, an abstract course code like "MS-A0111" is useful. It helps you find the right course. But real planning requires specific instances: "MS-A0111 in Autumn 2025."

Why the distinction matters:

- The abstract course tells you *what* is offered
- The instance tells you *when* and *how often* it's offered
- Instance data is essential for building a real schedule

Once students have course instances, they need to:

1. Group them into a Plan for a semester
2. Explore combinations of study groups (lectures, exercises, exams) to find good pairings
3. See where conflicts arise and choose which events to prioritize

## Phase 1: Plans and SchedulePairs

### Plans: The Study Workspace

A **Plan** is a collection of course instances a student is considering together.

Instead of comparing courses one by one, students say: "I'm thinking about these 4 courses in Spring 2025" and work from there.

Plans serve as a flexible workspace where students can:
- Add and remove courses freely
- Explore different combinations
- See how instances interact
- Compare study group options

### SchedulePairs: Optimized Combinations

A **SchedulePair** is an optimized pairing of study groups across 2+ course instances.

> [!TIP]
> Why this matters: A course typically offers multiple lectures, exercises, or exam slots. When combining courses, you need to find which specific study group combinations minimize conflicts. That's what SchedulePairs solve.

When a student picks two courses and asks "what's the best way to combine study groups?", the system:
1. Generates all valid pairings of study groups
2. Scores each pairing by level of conflicts
3. Shows ranked options

A good pairing might have zero conflicts; a weaker one might have 1 hour of overlap on Tuesday mornings. The student chooses based on what works for them.

### The LEGO View

This is where exploration happens. Students:
1. Select 2+ instances from their Plan
2. See ranked SchedulePairs
3. Lock in the best option

> [!NOTE]
> The visual metaphor is intentional: building a schedule is like assembling LEGO blocks. Each piece (study group) can fit together in different ways, and you choose the combination that best suits your needs.

## Phase 2: Decision Slots and Explicit Trade-Offs

Once a student commits to a pairing, **Decision Slots** activate.

Decision Slots are time intervals where 2+ events overlap, requiring an explicit choice about which to attend.

### What Makes Decision Slots Different

Rather than hiding complexity, Decision Slots make every trade-off visible:

- One event is marked **primary** (you attend)
- Others are marked **secondary** (you skip, watch later, or negotiate)
- The system remembers what you sacrificed

This visibility feeds into workload metrics and reflection tools in later phases.

### Example

Imagine you've created a Plan with CS-A1110 and MATH-A1020 for Spring 2025. 
You choose these study groups:

```
CS-A1110: Lecture (Mondays 10:00-12:00)
MATH-A1020: Exercise Group H01 (Mondays 11:00-13:00)
```

These overlap from 11:00-12:00. That's a Decision Slot. You must choose:

- Option A: Attend CS-A1110 Lecture, skip MATH-A1020 H01 (watch recording later)
- Option B: Skip CS-A1110 Lecture (watch recording), attend MATH-A1020 H01
- Option C: Attend both (1 hour late to one, or leave one early)

> [!IMPORTANT]
> Decision Slots make this trade-off explicit and visible. The student knows exactly what they're sacrificing and can factor that into their semester planning.

## Phase 3: Understanding Your Schedule

The final phase brings these pieces together:

**The Schedule View** answers "What am I actually doing?" not just "What exists on my calendar?"

It shows:
- Primary vs. secondary events clearly distinguished
- Actual vs. theoretical workload
- Cumulative patterns across the semester
- Where sacrifices were made

**Reflection tools** help students understand their patterns:
- Which courses required the most trade-offs?
- How much content did you skip?
- What would a different pairing have looked like?

This creates a feedback loop for better planning in subsequent semesters.

## Scheduling Conflicts: A Different Perspective

Traditional scheduling assumes conflicts are a problem to solve. Sisukas assumes they're a problem to *manage*.

The difference is significant:

| Perspective | Traditional | Sisukas |
|---|---|---|
| Conflicts are | Errors to prevent | Inevitable and normal |
| Goal | Find perfect non-overlapping schedule | Minimize high-impact conflicts |
| Student role | Follow the algorithm | Make explicit choices |
| Information | "Here's your schedule" | "Here are your options and trade-offs" |

> [!TIP]
> This shift reflects the reality of student life. Most students don't have perfect, non-overlapping schedules. They work with what exists and make strategic decisions about which events matter most.

## Integration with Discovery

Planning builds directly on discovery. The workflow looks like:

1. Discover interesting courses using fast filtering
2. Bookmark courses as favorites (no commitment)
3. Create a Plan for your semester with specific instances
4. Build SchedulePairs to explore study group combinations
5. Lock in choices via Decision Slots
6. Commit to SISU with a complete, transparent plan

At each step, you can step back, explore more, or adjust your choices. The commitment step comes only when you're ready.

## Development Timeline

We're building this incrementally. There's no fixed deadline, but:
- Phase 1 (Plans & SchedulePairs) is actively being worked on
- Phase 2 (Decision Slots) is designed and waiting for Phase 1 to stabilize
- Phase 3 (Calendar views & Reflection) requires both earlier phases first

**Next:** See [Getting Started](../getting-started/) to try the current features, or check the [project backlog](https://github.com/users/kctong529/projects/1) to follow development.
