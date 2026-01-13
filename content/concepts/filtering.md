---
weight: 1
title: "Filtering Architecture"
bookCollapseSection: true
---

# How Filtering Works in Sisukas

## The Fundamental Problem

Consider a real requirement from a student:

> "I want courses that start in Period II and are open for enrollment. From those, I'm interested in courses that count toward my CS major, or courses in my DSD minor, or anything taught by Milo."

This seemingly simple requirement actually contains multiple distinct parts:

- **Universal constraints** (Period II, enrollment open) — non-negotiable requirements
- **Multiple alternatives** (CS major OR DSD minor OR Milo's courses) — any single option satisfies the need
- **Different comparison types** (temporal overlap, set membership, text matching) — each requiring distinct logic

Traditional interfaces force users to either oversimplify their requirements or master complex query languages. Sisukas uses a structured approach that accommodates this complexity while remaining comprehensible.

## Core Concepts: The Two-Tier Architecture

Filtering requirements naturally decompose into two components:

**First, establish the filtering context:** "Show me Period II courses that are open for enrollment."

**Then, define selection criteria:** "From those, give me my major courses, or my minor courses, or anything from Milo."

### Why Two Tiers?

Without this separation, universal constraints must be repeated in every alternative. Compare these:

**Without separation (repetitive):**
```
Match any of:
  - (Period II AND Enrollment open AND CS major)
  - (Period II AND Enrollment open AND DSD minor)
  - (Period II AND Enrollment open AND Teacher: Milo)
```

Notice "Period II AND Enrollment open" appears three times, creating redundancy and potential for inconsistency.

**With two-tier structure (clean):**
```
Must satisfy: Period II AND Enrollment open
Then match any of:
  - CS major
  - DSD minor
  - Teacher: Milo
```

The universal constraints define the **filtering context**. The alternative patterns describe **what qualifies** within that context.

## Must Rules: Universal Requirements

Must rules represent non-negotiable requirements. They answer: *"What must be true about every course I see?"*

No exceptions, no alternatives, no conditional application. If a course fails even one must rule, it's immediately excluded.

### Key Characteristics

- Apply to every course without exception
- All must pass (AND logic)
- Failure means immediate rejection
- Evaluated before any group logic

### Examples

```
"All courses must overlap Period II 2024-25"
"All courses must be open for enrollment"
"All courses must be taught in English"
```

These establish boundaries within which all other selection logic operates.

## Rule Groups: Alternative Patterns

Rule groups define different acceptable qualification paths. They answer: *"What are the different ways a course can meet my needs?"*

A course might qualify through your major program, your minor program, or by being taught by a preferred instructor. Any single path is sufficient.

### Key Characteristics

- Define alternative qualification paths (OR logic between groups)
- Each group is a conjunction of rules (AND logic within groups)
- A course needs to satisfy only one group to qualify
- Groups evaluate independently

### Examples

Well-formed groups represent coherent selection criteria:
- "My major courses" → Belongs to CS major
- "My minor courses" → Belongs to DSD minor
- "Trusted instructor" → Teacher contains "Milo"

## Filter Rules: Atomic Conditions

Rules are the fundamental building blocks. Each rule asks a single yes/no question: *"Does this specific attribute have this specific property?"*

### Rule Components

Every rule consists of three parts:

1. **Field** — What attribute are we examining?
   - Examples: Credits, Teacher, Period
2. **Relation** — How are we comparing?
   - Examples: Contains, Equals, Overlaps
3. **Value** — What are we comparing against?
   - Examples: "Milo", 5, "Period II"

A rule evaluates a course by extracting the field, applying the relation operator, and returning true or false.

### Evaluation Examples

**Text matching:**
```
Rule: "Teacher contains Milo"
Course A: teacher = "Milo Orlich" → ✓ true
Course B: teacher = "Jane Anderson" → ✗ false
```

**Numeric comparison:**
```
Rule: "Credits equals 5"
Course A: credits = 5 → ✓ true
Course B: credits = 3 → ✗ false
```

**Temporal overlap:**
```
Rule: "Overlaps Period II (Oct 28 - Dec 13)"
Course A: Oct 28 - Dec 13 → ✓ true (complete overlap)
Course B: Sep 1 - Oct 15 → ✗ false (no overlap)
Course C: Nov 15 - Jan 31 → ✓ true (partial overlap)
```

## How Rules Combine: The Evaluation Logic

The complete filtering model works like this:

```
A course is INCLUDED if and only if:
  (All must rules pass) AND (At least one group matches)
```

Where each group requires all its rules to pass:
```
Group matches if: (Rule 1 AND Rule 2 AND ... AND Rule N)
```

## Worked Example

Let's evaluate four courses against a filter:

**Filter specification:**
```
Must rules:
  - Period II (Oct 28 - Dec 13)
  - Enrollment open

Rule groups:
  - Group 1: CS major
  - Group 2: DSD minor
  - Group 3: Teacher: Milo
```

### Course A: Intro Programming
```
Period: Oct 28 - Dec 13 (Period II) ✓
Enrollment closes: 2024-12-01 ✓
Curricula: [CS major]
Teacher: Kim
```

**Evaluation:**
1. Must 1 (Period II)? → ✓ Pass
2. Must 2 (Enrollment open)? → ✓ Pass
3. Check groups...
4. Group 1 (CS major)? → ✓ Match!
5. **Result: INCLUDE** (via CS major)

### Course B: Data Structures
```
Period: Sep 9 - Oct 25 (Period I) ✗
Enrollment closes: 2024-10-15 ✓
Curricula: [CS major, DSD minor]
Teacher: Milo
```

**Evaluation:**
1. Must 1 (Period II)? → ✗ **Fail**
2. **Result: EXCLUDE** (would have matched all three groups, but fails must rule)

**Key insight:** Must rules trump everything. Course B would satisfy all group criteria, but because it fails the Period II must rule, it's excluded immediately.

### Course C: Linear Algebra
```
Period: Oct 28 - Dec 13 (Period II) ✓
Enrollment closes: 2024-10-15 ✓
Curricula: [Math major]
Teacher: Milo
```

**Evaluation:**
1. Must 1 (Period II)? → ✓ Pass
2. Must 2 (Enrollment open)? → ✓ Pass
3. Check groups...
4. Group 1 (CS major)? → ✗ No
5. Group 2 (DSD minor)? → ✗ No
6. Group 3 (Teacher: Milo)? → ✓ Match!
7. **Result: INCLUDE** (via Milo, even though not in major/minor)

### Course D: Algorithms
```
Period: Oct 28 - Dec 13 (Period II) ✓
Enrollment closes: 2024-09-15 (passed) ✗
Curricula: [CS major]
Teacher: Smith
```

**Evaluation:**
1. Must 1 (Period II)? → ✓ Pass
2. Must 2 (Enrollment open)? → ✗ **Fail**
3. **Result: EXCLUDE** (would match Group 1, but fails must rule)

## Performance: Short-Circuit Evaluation

The system optimizes evaluation through early exit:

**In must rules:** Evaluation stops at the first failure—the course is already excluded.

**In groups:** Evaluation stops at the first match—the course is already included.

This typically reduces evaluations by 40-70% compared to checking every rule for every course.

## Design Principles

### Why This Structure?

This architecture was chosen because it matches how people naturally think:

1. Establish boundaries first ("I want Period II courses")
2. Get specific about what you want within those boundaries ("from my programs or from Milo")

The structure also makes it easier to:
- **Understand** what a query does (read it like natural language)
- **Debug** when something's wrong (check must rules, then check which group matched)
- **Modify** incrementally (add a new constraint, add a new alternative pattern)

### Predictability

The model maintains no hidden state. No surprising side effects. No context-dependent behavior.

**What you see is what you get.** Identical queries on identical data produce identical results. Rules evaluate independently without side effects. Standard boolean algebra properties apply.

### Natural Expression

The goal is to bridge the gap between how you think about filtering and how you express it. You shouldn't need to become a query language expert to say "courses from my programs or taught by Milo."

The two-tier structure, OR logic between groups, and AND logic within groups map directly to natural language patterns. This is intentional.

## Summary

The complete filtering model can be expressed formally:

```
A course x is in the result set S if and only if:

x ∈ S ⟺ (M₁(x) ∧ M₂(x) ∧ ... ∧ Mₙ(x)) ∧ (G₁(x) ∨ G₂(x) ∨ ... ∨ Gₖ(x))

where each group is: Gⱼ(x) = (R_{j,1}(x) ∧ R_{j,2}(x) ∧ ... ∧ R_{j,m}(x))
```

This structure elegantly handles complex real-world filtering requirements while remaining intuitive and predictable.
