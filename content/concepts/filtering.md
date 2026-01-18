---
weight: 2
bookFlatSection: true
title: "How We Filter"
---

> [!NOTE]
> This page explains the **filtering philosophy**. For the big picture on planning,
> see [The Big Picture](../overview/). To start using filters, see [Getting Started](../../getting-started/).

## The Fundamental Problem

Consider a typical course search scenario:

> *"I want courses that start in Period II and are open for enrollment. From those, I'm interested in courses that count toward my CS major, or courses in my DSD minor, or anything taught by Milo."*

This requirement contains:
- **Universal constraints** (Period II, enrollment open) — non-negotiable requirements
- **Multiple alternatives** (CS major OR DSD minor OR Milo's courses) — any single option works
- **Different comparison types** (temporal, set membership, text) — each with distinct logic

Traditional interfaces force you to oversimplify or master complex query languages. This model provides structured flexibility that handles complexity while remaining clear.

## Core Concepts

### The Two-Tier Architecture

Filtering naturally breaks into two parts:

1. **Establish universal constraints:** "Show me Period II courses that are open for enrollment."
2. **Define selection criteria within that context:** "From those, give me my major, my minor, or anything from Milo."

> [!TIP]
> **Why Two Tiers?**  
> Without separating these, universal constraints repeat in every alternative. The two-tier structure mirrors how you naturally think: establish boundaries, then specify what qualifies within them.

**Without separation, constraints repeat:**
```
Match any of:
  - (Period II AND Enrollment open AND CS major)
  - (Period II AND Enrollment open AND DSD minor)
  - (Period II AND Enrollment open AND Teacher: Milo)
```

**With two tiers, structure is clear:**
```
Must satisfy: Period II AND Enrollment open
Then match any of:
  - CS major
  - DSD minor
  - Teacher: Milo
```

The universal constraints define the filtering context. The alternative patterns describe what qualifies within that context.

### Must Rules: Universal Requirements

Must rules answer: *"What must be true about every course I see?"*

No exceptions, no alternatives. Failure to satisfy even one must rule results in immediate exclusion.

**Key characteristics:**
- Apply to every course without exception
- All must pass (AND logic)
- Failure means immediate rejection

**Examples:**
- "All courses must overlap Period II 2024-25"
- "All courses must be open for enrollment"
- "All courses must be taught in English"

> [!IMPORTANT]
> **Must Rules Are Absolute**  
> A course might satisfy all group criteria, but if it fails a single must rule, it is excluded. These define non-negotiable boundaries.

### Rule Groups: Alternative Patterns

Rule groups answer: *"What are the different ways a course can meet my needs?"*

A course might qualify through your major, your minor, or by being taught by a preferred instructor. Any single path is sufficient.

Between groups, OR logic applies. Within a group, AND logic applies.

**Well-formed groups represent coherent selection criteria:**
- "My major courses" → Belongs to CS major
- "My minor courses" → Belongs to DSD minor  
- "Trusted instructor" → Teacher contains "Milo"

> [!NOTE]
> **Groups Are Independent**  
> Each group evaluates independently. One group's outcome doesn't affect others. A course needs to satisfy only one group to qualify.

### Filter Rules: Atomic Conditions

Rules are the building blocks. Each asks a single yes/no question: *"Does this attribute have this property?"*

**Every rule has three components:**

1. **Field** — What attribute are we examining? (Credits, Teacher, Period)
2. **Relation** — How are we comparing? (Contains, Equals, Overlaps)
3. **Value** — What are we comparing against? ("Milo", 5, "Period II")

**Examples:**

*Text matching:*
```
"Teacher contains Milo"
Course A: teacher = "Milo Orlich" → true ✓
Course B: teacher = "Jane Anderson" → false ✗
```

*Temporal overlap:*
```
"Period overlaps Period II 2024-25" (Oct 28 - Dec 13)
Course A: Oct 28 - Dec 13 → true ✓
Course B: Sep 9 - Oct 25 → false ✗ (ends before Period II starts)
```

*Set membership:*
```
"Belongs to CS major"
Course A: curricula = ["CS major", "Math minor"] → true ✓
Course B: curricula = ["DSD major"] → false ✗
```

## How Evaluation Works

To understand how filtering actually produces results, let's walk through the three-stage process:

{{% steps %}}
1. #### Stage 1: Universal Screening
   Every course is tested against must rules. Any failure results in immediate exclusion.

2. #### Stage 2: Group Matching
   Courses that passed Stage 1 are evaluated against rule groups. A course qualifies if any single group matches.

3. #### Stage 3: Result Collection
   All qualifying courses are collected and returned.
{{% /steps %}}

### Evaluation Example

**Query:**
```
Must Rules:
  - Period overlaps "Period II 2024-25"
  - Enrollment is open (assume today is 2024-10-01)

Groups:
  Group 1: Belongs to "CS major"
  Group 2: Belongs to "DSD minor"
  Group 3: Teacher contains "Milo"
```

#### Course A - "Introduction to Programming"
```
Period: Oct 28 - Dec 13 (Period II) ✓
Enrollment closes: 2024-10-15 ✓
Curricula: [CS major, Math minor]
Teacher: Anderson
```
**Result: ✓ INCLUDED** — Passes both must rules, matches Group 1 (CS major).

#### Course B - "Data Structures"
```
Period: Sep 9 - Oct 25 (Period I) ✗
Enrollment closes: 2024-10-15 ✓
Curricula: [CS major, DSD minor]
Teacher: Milo
```
**Result: ✗ EXCLUDED** — Fails the Period II must rule. Even though it would match all three groups, must rules are evaluated first and are non-negotiable.

> [!WARNING]
> **Must Rules Trump Everything**  
> Course B would satisfy all three group criteria, but fails the Period must rule and is therefore excluded.

#### Course C - "Linear Algebra"
```
Period: Oct 28 - Dec 13 (Period II) ✓
Enrollment closes: 2024-10-15 ✓
Curricula: [Math major]
Teacher: Milo
```
**Result: ✓ INCLUDED** — Passes both must rules. Doesn't satisfy Groups 1-2 (not CS or DSD), but matches Group 3 (taught by Milo).

## Why This Design

### Predictability

What you see is what you get. Identical queries on identical data always produce identical results. Rules evaluate independently without side effects.

> [!NOTE]
> **No Hidden State**  
> Identical queries always produce identical results. Rules evaluate independently. Standard boolean algebra applies. This predictability is essential for usability.

### Natural Expression

The two-tier structure, OR logic between groups, and AND logic within groups map directly to natural language. You shouldn't need to become a query language expert to say "courses from my programs or taught by Milo."

### The Core Formula

A course qualifies if it satisfies all must rules AND at least one group:

```
course matches if: (all must rules pass) AND (any group matches)
```

Within each group, all rules must pass:
```
group matches if: (all rules in group pass)
```

This simple, predictable logic handles complex requirements.
