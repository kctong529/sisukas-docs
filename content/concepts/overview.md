---
weight: 1
title: "The Big Picture"
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
We don't use a "black box" algorithm to solve your schedule; we show you the trade-offs so you can decide.

## The Planning Lifecycle

Planning moves from abstract ideas to concrete schedules in three phases:

### Phase 1: Workspace & Composition (Plans & Blocks)
You create a **Plan**: a flexible workspace for a specific semester (e.g. "Autumn 2025"). Inside, course instances are broken into **Blocks** (user-defined groupings of study groups). By default, Sisukas suggests blocks like Lectures/Exercises/Exams, but you can partition study groups however you want.

### Phase 2: Optimization (Schedule Pairs)
The **Schedule Pairs** engine analyzes your Plan. It generates every possible combination by selecting one study group per block across your chosen courses and ranks them by "fit," showing you which combinations have the fewest conflicts.

### Phase 3: Resolution (Decision Slots)
For the conflicts that remain, you use **Decision Slots**. You explicitly mark which event is "Primary" (attendance) and which is "Secondary" (recording/self-study).

## Technical Vocabulary

| Term | Definition |
| :--- | :--- |
| **Instance** | A specific run of a course (e.g. "Fall 2025") |
| **Block** | A user-defined partition (grouping) over study groups that defines one “choice slot” during computation. Defaults suggest Lecture/Exercise/Exam blocks |
| **Schedule Pair** | A concrete timetable choice: one study group selected from each block across the courses in a Plan, ranked by fit |
| **Decision Slot** | A specific time interval where selected study groups overlap, requiring a priority choice |

## Next Steps

- Explore how **[Filtering](../filtering/)** powers fast discovery
- Understand the **[composable block model](../plans/)** behind planning
- See how **[Schedule Pairs](../schedule-pairs/)** and **[Decision Slots](../decision-slots/)** work
- For implementation details, see **[Planning Architecture](../../architecture/planning/)**
