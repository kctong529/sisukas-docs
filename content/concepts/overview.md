---
weight: 1
title: "The Big Picture"
---

> [!NOTE]
> First time here? See [Why Sisukas?](../../why-sisukas/) for context, 
> then [Getting Started](../../getting-started/) to run it locally.

## Our Core Philosophy

Most scheduling tools treat overlapping courses as an error to prevent. 
Sisukas takes the opposite view: **overlaps are inevitable and normal.** 
The goal is not to eliminate them, but to surface them clearly so students 
can make explicit trade-offs.

This fundamental shift changes how we approach planning and scheduling.

### Three Beliefs

1. **Scheduling conflicts are inevitable, not errors**  
Students actually deal with overlapping lectures, exercises, and exams. 
They make trade-offs, skip sessions, watch recordings later, or prioritize 
one course over another. Sisukas builds around this reality instead of 
ignoring it.

2. **Information should be easily accessible**  
SISU buries details behind many clicks and repetitive navigation. Finding 
and comparing course schedules requires excessive effort. Sisukas puts 
information front and center, eliminating friction from exploration.

3. **Students should make conscious choices**  
Instead of a scheduling algorithm that assigns your time, you retain control. 
You see the options, understand the trade-offs, and make informed choices.

## The Abstraction Problem

> [!IMPORTANT]
> When *discovering*, an abstract course code like "MS-A0111" is useful. It helps you find "Calculus 1" without worrying about when it runs. When *planning*, the instance is everything. You need "MS-A0111 in Autumn 2025" because you're building a specific semester.
 
But even instances aren't the full story. A course instance isn't a single fixed time slot. It's a collection of blocks you can mix and match: exercise groups at multiple times, lectures that might be optional, exams. Planning means assembling these blocks from *multiple courses* into a coherent semester.

This is where Plans, Schedule Pairs, and Decision Slots come in.

> [!TIP]
> Our model makes the concrete problem (how do you actually combine courses?) explicit before jumping to the solution.

## The Three-Phase Approach

We're building toward comprehensive semester planning incrementally:

### Phase 1: Flexible Exploration (Plans & Schedule Pairs)

Students need a workspace to explore combinations. This is where Plans live: flexible collections of course instances.

As students explore, they discover which study group combinations work well together. Schedule Pairs handle this optimization: they find the best pairing of study groups across multiple courses.

> [!NOTE]
> Exploration is different from commitment. Plans let you explore freely; Schedule Pairs help you make informed choices about study groups. Only when you've found combinations you like do you move to Phase 2.

### Phase 2: Explicit Trade-Offs (Decision Slots)

Once you've chosen study group combinations, conflicts become visible. Decision Slots make these explicit: "Here's where you have overlapping events. Which one matters more to you?"

> [!TIP]
> Discovering conflicts is different from deciding how to handle them. Phase 1 finds good combinations. Phase 2 makes your compromises visible and intentional.

### Phase 3: Understanding Your Pattern (Reflection Tools)

By Phase 3, you have a complete semester with all trade-offs made explicit. Reflection tools help you understand your patterns: which courses required sacrifices? How much content did you skip? Would a different pairing have been better?

> [!IMPORTANT]
> Understanding takes time. You need a complete semester before you can reflect on it. And reflection is valuable for future semesters, not this current one.

## Why This Order Matters

You *could* show all conflicts upfront (Phase 1 + Phase 2 combined), 
but that overwhelms exploration. By separating exploration from decision-making, 
you keep the interface simple while supporting complex planning.

You *could* add reflection immediately (Phase 1 + Phase 3 combined), 
but students haven't finished planning yet. Reflection tools are useless 
until the semester is locked in.

The phases aren't arbitrary. They reflect the natural progression of planning:  
explore → decide → reflect.

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

Planning builds directly on discovery. The complete workflow looks like:

1. **Discover** – Use fast filtering to find interesting courses
2. **Bookmark** – Save courses as favorites (no commitment)
3. **Plan** – Create a Plan for your semester with specific instances
4. **Explore** – Use Schedule Pairs to find good study group combinations
5. **Decide** – Use Decision Slots to make explicit trade-offs
6. **Commit** – Register in SISU with a complete, transparent plan

At each step, you can step back, explore more, or adjust your choices. The commitment step comes only when you're ready.

## Next Steps

- Explore how **[Filtering](../filtering/)** powers fast discovery
- Understand the **[composable block model](../plans/)** behind planning
- See how **[Schedule Pairs](../schedule-pairs/)** and **[Decision Slots](../decision-slots/)** work
- For implementation details, see **[Planning Architecture](../../architecture/planning/)**