---
weight: 4
title: "Composing Schedule Pairs"
---

> [!NOTE]
> This is Phase 1 of semester planning. After exploring Schedule Pairs, you'll use [Decision Slots](../decision-slots/) to handle conflicts.

## The Problem Schedule Pairs Solve

You've created a Plan with CS-A1110 and MATH-A1020. Both are offered with multiple lecture times and exercise groups. Which combination is best?

**CS-A1110 blocks:**
- Lecture: Mon/Wed 10-12 OR Mon/Wed 13-15 OR Tue/Thu 10-12
- Exercise: Tue 14-16 OR Thu 14-16

**MATH-A1020 blocks:**
- Lecture: Mon/Wed 11-13 OR Tue/Thu 11-13
- Exercise: Mon 15-17 OR Wed 15-17

**Possible compositions:**
- Combo 1: CS lecture (10-12) + MATH lecture (11-13) = 1hr overlap 11-12
- Combo 2: CS lecture (10-12) + MATH lecture (Tue/Thu 11-13) = no overlap
- Combo 3: CS lecture (13-15) + MATH lecture (11-13) = 1hr overlap (different day)
- ... and many more

Which should you choose?

## What Schedule Pairs Do

Schedule Pairs generate and rank all valid block combinations by how well they fit together.

For CS + MATH above, the system:
1. Generates all valid combinations (all ways to combine blocks from both courses)
2. Detects overlaps in each combination
3. Ranks them (best first: fewest conflicts)

Result: You see the top options ranked by level of conflicts. You choose based on what matters to you (flexibility, recording availability, break between classes, etc.).

## The Model: Ranking by Fit

```
Top options (ranked by fewest conflicts):
Option 1: CS lecture (Tue/Thu 10-12) + MATH lecture (Mon/Wed 11-13)
No overlaps ✓
Option 2: CS lecture (Mon/Wed 10-12) + MATH lecture (Tue/Thu 11-13)
No overlaps ✓
Option 3: CS lecture (Mon/Wed 10-12) + MATH exercise (Wed 15-17)
No overlaps, but exercises are separate ✓
Option 4: CS lecture (Mon/Wed 10-12) + MATH lecture (Mon/Wed 11-13)
1 hour overlap (11-12) Mon/Wed
...and so on
```

You pick whichever fits your needs best.

## Why This Matters for Planning

**Without Schedule Pairs:** You manually compare each combination (tedious, error-prone)

**With Schedule Pairs:** The system shows you ranked options so you can make an informed choice

Instead of a scheduling algorithm choosing *for* you, Schedule Pairs show you the options and let you decide. You understand the trade-offs before committing.

## Next Steps

Once you've chosen a Schedule Pair, **[Decision Slots](../decision-slots/)** make any remaining conflicts explicit so you can consciously decide which events to prioritize.

## Next in the planning process
- **[Decision Slots](../decision-slots/)** – Make your trade-offs explicit
- **[Planning Architecture](../../architecture/planning/)** – How this is built

## See Also
- [The Big Picture](../overview/) – Understand the three phases
- [Getting Started](../../getting-started/) – Run it locally
