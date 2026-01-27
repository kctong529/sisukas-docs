---
weight: 3
title: "Why Sisukas: The Problem"
description: "Why Sisukas exists: SISU is built for registration, but students need a workspace for exploration, comparison, and trade-offs."
---

## The Real Problem with SISU

> [!NOTE]
> SISU works. Finnish universities have used it successfully for years to manage
> course catalogs and registration. The problem isn't that it's broken — it's
> that it's solving a different problem.

On the surface, SISU feels tedious. Finding a course schedule requires clicking
through multiple screens. Comparing two courses means switching tabs and relying
on memory. Adding a course feels like a commitment before you've really decided.
These aren't just UX annoyances. They're symptoms of a deeper mismatch.

SISU is fundamentally a course catalog and registration system. It does what
it's designed for well: helping students find specific courses and enroll in them.
What it doesn't support is planning: the work of assembling a coherent semester.

## Planning Is Not Registration

This distinction matters.

Registration is linear. You know what course you want, you navigate to it, and
you enroll. SISU is optimized for this workflow.

Planning is different. It's exploratory and iterative. It requires seeing how
courses interact with each other and with your own constraints. Real planning
means asking questions SISU can't answer:

- Which courses can I realistically take together?
- Where are the conflicts, and which ones can I live with?
- How does this semester feel as a whole?
- What changes if I swap one option for another?

> [!IMPORTANT]
> Planning requires seeing the whole picture, testing combinations, and making
> trade-offs consciously. SISU assumes this work happens elsewhere.

## Why SISU Assumes Planning Is Simple

SISU's design is based on a reasonable assumption: most students follow a
recommended curriculum. You find the suggested courses, register for them, and
move on.

This assumption breaks down as soon as students deviate, which most do.

Electives, multiple majors, cross-program courses, workload balancing, curiosity:
all of these require discovery and comparison. SISU assumes this work is minimal
or unnecessary.

The friction students experience isn't accidental. It's a structural consequence
of a system designed for predetermined paths being used for open-ended planning.

## How Friction Shows Up in Practice

> [!TIP]
> Comparing two courses in SISU requires sign-in first, including 2FA via
> Microsoft Authenticator.

### Comparing Without Adding to a Plan

1. Find the first course
2. Open course details
3. Navigate to completion methods
4. Scroll to the relevant instance
5. Open groups and study events
6. Inspect one study group
7. Switch courses and repeat
8. Remember what you just saw

### Comparing via the Calendar

1. Find both courses
2. Copy course codes
3. Open study plan
4. Paste into electives
5. Add courses to plan
6. Open each course
7. Select completion methods
8. Add to registration panel
9. Open calendar
10. Toggle study groups
11. Scroll and interpret conflicts

None of this is technically complex. But it's effort-heavy.

That effort discourages exploration. Students stick with familiar or “safe”
choices not because they're best, but because evaluating alternatives is costly.

## What SISU Actually Supports

| Task | SISU Strength | What’s Missing |
|---|---|---|
| “I need CS-A1110” | ✅ Strong | — |
| “What courses run in Period II?” | ⚠️ Possible | Expressive filtering |
| “Can I take CS-A1110 and MATH-A1020 together?” | ❌ | Composition & conflict analysis |
| “Which exercise group fits best?” | ⚠️ Buried | Clear comparison |
| “Here’s my semester — where are the conflicts?” | ❌ | Planning workspace |
| “Was this semester balanced?” | ❌ | Reflection tools |

SISU assumes that comparison, prioritization, and compromise happen outside the
system.

## What Students Actually Need

The core problem is simple: SISU gives you a catalog and a registration form.
It doesn’t give you a place to think.

> [!IMPORTANT]
> Students need a workspace for exploration: a place to see courses together,
> understand how study groups interact, and make trade-offs explicit before
> committing.

In reality, students already make these decisions. Some lectures are skippable.
Some exercise groups matter more than others. Some conflicts are acceptable.

SISU treats every event as equally mandatory. Students mentally override this,
but the system doesn’t reflect it. The result is noise: calendars full of events
you won’t attend, obscuring what actually matters.

## A Different Model

Sisukas starts from a different premise: planning is real work, and trade-offs
are unavoidable.

Instead of hiding this reality, Sisukas makes it explicit.

### What Sisukas Provides

Sisukas is a discovery and planning workspace with two core capabilities:

**1. Fast course discovery**  
Powerful, expressive filtering for exploring what’s available.
[Learn more about filtering](../concepts/filtering/).

**2. Planning as exploration and decision-making**  
Group courses into Plans, explore how study groups combine, see conflicts, and
explicitly decide how to handle them.
[See the planning model](../concepts/overview/).

## What’s Available Now

See [Getting Started](../getting-started/) to try the live app.

Current features include:
- Intelligent filtering
- Up-to-date course data
- Public APIs for integration

Planning features (Plans, Schedule Pairs, Decision Slots) are under active
development. See [The Big Picture](../concepts/overview/) for the roadmap.
