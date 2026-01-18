---
weight: 3
bookFlatSection: true
title: "Plans: Grouping Your Blocks"
---

> [!NOTE]
> This is Phase 1 of semester planning. After exploring Plans, you'll use [Schedule Pairs](../schedule-pairs/) to find best combinations, then [Decision Slots](../decision-slots/) to handle conflicts.

## The Block Model: How Courses Are Really Structured

A course instance isn't a single fixed event. It's a collection of different types of components: lectures, exercises, and exams. We organize these into what we call blocks. But this is Sisukas's way of thinking about it, not how SISU names things.

### Understanding Blocks and Study Groups

In SISU, you choose between study groups: specific sections like "Lecture" or "Exercise Group H01." These are real things all students are familiar with.

Sisukas adds a layer on top: we organize study groups by type (lectures, exercises, exams) into blocks. This helps you think about planning systematically:

```
CS-A1110 (Autumn 2025):
├─ Lecture Block
│  ├─ Lecture (Mon/Wed 10:00-12:00)
│
├─ Exercise Block
│  ├─ Exercise Group H01 (Tue 14:00-16:00)
│  └─ Exercise Group H02 (Wed 14:00-16:00)
│  └─ Exercise Group H03 (Thu 14:00-16:00)
│
└─ Exam Block
   └─ Exam (Jan 15, 2026)
```

### How Planning Works with Blocks

When you take this course, you don't take all of it. You **compose** it by choosing:
- Whether to attend the lecture (Mon/Wed 10:00-12:00) or skip it
- Which exercise group works for your schedule (H01, H02, or H03)
- Attend the exam

**Planning means assembling these blocks from multiple courses into a coherent semester.**

## What is a Plan?

A Plan is a flexible workspace where you group course instances you're considering for a specific semester.

> [!TIP]
> Instead of comparing courses one by one or committing immediately, you create a Plan that says: "I'm thinking about these 4 courses for Spring 2025." Once they're in a Plan, you can explore how they interact.

## Why Plans Matter

Without Plans, you're comparing courses in isolation. 
"Does this course work?" is a different question from 
"Do these courses work *together*?"

Plans answer the second question. They let you:

1. **Explore combinations** – Add courses, remove them, try different semesters
2. **Understand interactions** – See how blocks from different courses fit
3. **Make informed choices** – Before committing, know which combinations are possible
4. **Iterate freely** – Plans are not commitments, just workspaces

## How Planning Works: The Journey

1. **Create a Plan** – "Spring 2025 Exploration"
2. **Add course instances** – "I'm thinking about CS-A1110, MATH-A1020, DSD-B2345"
3. **Explore blocks and study groups** – See all the lecture times, exercise groups, exams available
4. **Use Schedule Pairs** – Ask: "What's the best way to combine these study group choices?"
5. **Use Decision Slots** – Identify conflicts and prioritize (e.g. "CS lectures matter more")
6. **Commit** – Register in SISU with a plan you understand

## The Composability Principle

The block model is what makes planning powerful. Here's why:

**Without blocks (traditional model):**
- You manually check each course's schedule options
- You try different combinations by hand, comparing times
- Finding even a non-overlapping schedule takes extensive back-and-forth trial and error
- You end up with something that works, but you've lost time exploring options

**With blocks (Sisukas model):**
- You see all study group combinations automatically ranked
- You control which study groups to prioritize
- Conflicts are choices to make explicitly, not obstacles to overcome

This shifts planning from "manually trying combinations until something works" to "exploring ranked options and choosing consciously."

## What Comes After Plans

Once you've created a Plan with your course instances, you have options:

### 1. Explore Study Group Combinations (Schedule Pairs)

Not all course instances are the same. Most offer multiple study groups. Which combination works best?

Schedule Pairs automatically rank combinations by how well they fit together:
- Fewest time conflicts first
- Consider your priorities (which courses matter more?)
- Understand trade-offs before committing

[Learn more about Schedule Pairs »](../schedule-pairs/)

### 2. Make Explicit Trade-Offs (Decision Slots)

Conflicts are inevitable. When blocks overlap, Decision Slots make this explicit: 
"Here's where you have a choice. Which matters more?"

You don't eliminate conflicts. You make conscious decisions about them.

[Learn more about Decision Slots »](../decision-slots/)

### 3. Commit

Once you've decided on your blocks and prioritized conflicts, you register in SISU 
with a complete, transparent plan.

## Current Status

See [Planning implementation status](../overview/#current-implementation-status).

## Next Steps

- **[Schedule Pairs](../schedule-pairs/)** – How blocks combine and rank
- **[Decision Slots](../decision-slots/)** – How to prioritize when blocks overlap
- **[Planning Architecture](../../architecture/planning/)** – How this is implemented

## See Also

- [The Big Picture](../overview/) – Why we design this way
- [Getting Started](../../getting-started/) – Create your first Plan