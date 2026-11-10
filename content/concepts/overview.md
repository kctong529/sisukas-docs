---
weight: 1
title: "Planning Concepts"
description: "Sisukas planning philosophy and roadmap: conflicts are normal, information is accessible, and trade-offs are explicit."
---

> [!NOTE]
> New to the project? Start with [Why Sisukas?](../../why-sisukas/) for the philosophy, then return here for the implementation roadmap.

## Our Core Philosophy

Sisukas treats overlaps not as errors, but as **inevitable trade-offs**. This fundamental shift changes how we approach planning.

Long-term context is provided by the [Year Timeline](../year-timeline/), which shows completed, ongoing, and planned studies across an academic year.

### Three Beliefs

1. **Conflicts are normal**  
Students already skip sessions, watch recordings, or prioritize one course over another. Sisukas builds around this reality.

2. **Information should be easily accessible**  
No more clicking through five menus to see a schedule. Details are front and center.

3. **Conscious Choice**  
Scheduling candidates are proposals, not decisions. Sisukas makes their trade-offs visible so students can choose how to proceed.

## The Planning Lifecycle

Planning moves from abstract ideas to concrete schedules in three phases:

### Phase 1: Workspace & Composition (Plans & Blocks)
You create a **Plan**: a flexible workspace for a specific semester (e.g. "Autumn 2025"). Inside, course instances are broken into **Blocks** (user-defined groupings of study groups). By default, Sisukas suggests blocks like Lectures/Exercises/Exams, but you can partition study groups however you want.

### Phase 2: Assembly (proposed model)
The **assembler** takes selected LEGO blocks and returns ordered **assembly candidates**. Its ranking and course-inclusion rules are intentionally left open; conflicts may remain. The current implementation uses a narrower Schedule Pair algorithm.

### Phase 3: Calendar (under development)

The **calendar** is the student's working timetable. A candidate may be explicitly applied to it after previewing proposed changes, including active courses and study-group defaults. Regenerating candidates does not modify the calendar. Students can adjust attendance and resolve or leave overlaps independently of the assembler.

**Decision Slots** are historical terminology for an earlier proposed conflict-resolution stage, not a required phase of the new model.

## Core Terminology

| Term | Definition |
| --- | --- |
| **Instance** | A specific course offering |
| **LEGO block** | A configurable grouping of study groups used as scheduling input |
| **Assembly candidate** | One proposed configuration from an ordered assembler result |
| **Saved assembly** | An explicitly retained candidate (future option) |
| **Apply to calendar** | Explicit reconciliation and confirmation of proposed calendar changes |
| **Calendar** | Persistent working timetable and attendance intent |

## Related documentation

- [Filtering](../filtering/) — Discover candidate courses.
- [Plans](../plans/) — Organize course choices into a workspace.
- [Assemblies](../assemblies/) — Proposed scheduling domain model.
- [Legacy Schedule Pairs](../schedule-pairs/) — Existing terminology and assumptions.
- [Decision Slots](../decision-slots/) — Explore intended conflict-handling behavior.
