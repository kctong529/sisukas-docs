---
weight: 1
title: "Planning System Architecture"
---

> [!NOTE]
> This page explains the **implementation** of:
> - [Plans](../../concepts/plans/) – Flexible workspaces
> - [Schedule Pairs](../../concepts/schedule-pairs/) – Ranked combinations
> - [Decision Slots](../../concepts/decision-slots/) – Explicit trade-offs

## Quick Context

This document describes how the planning system is built and how all pieces fit together.

For the conceptual foundation, see:
- [Plans](../../concepts/plans/) – Why you create them, the block model
- [Schedule Pairs](../../concepts/schedule-pairs/) – Why you need them
- [Decision Slots](../../concepts/decision-slots/) – Why trade-offs are explicit

## Block Composability: Core Model

Unlike traditional scheduling (where all events are fixed), Sisukas treats study groups as the fundamental selectable units. Blocks are user-defined groupings that define selection constraints during schedule computation.

```
Course Instance = { study groups }

Planning = Partitioning study groups into blocks
         + Selecting one study group per block
         + Composing those selections into valid combinations
         + Making trade-offs explicit
```

This model enables optimization (Schedule Pairs) and conscious choice-making (Decision Slots).

## Phase 1: Plans

### Plans: Data Model

A Plan is a user-scoped collection of course instance references. It stores:

- A name ("Spring 2025", "Option A", etc.)
- A list of instance IDs (just the identifiers, not full course data)
- Whether it's the active plan (only one per user)
- Timestamps for audit trail and sorting

#### Why Only Instance IDs?

Plans store only instance IDs (not full course data) because:

- **Single source of truth**: Course data lives in the SISU API; plans just reference it
- **No staleness**: If a course name changes in SISU, plans don't become outdated
- **Lightweight**: Plans are selections, not data copies
- **Decoupled architecture**: Frontend and backend can evolve independently
- **Immutability**: If a course is deleted from SISU, users' plan selections remain as historical records

> [!IMPORTANT]
> Future Consideration: If SISU removes an instance entirely, that instance ID becomes a dead link. Users can't see what course they added; we have no record of it.
>
> To mitigate this, we should maintain a separate snapshot table (`instanceSnapshots`) that stores essential instance fields (course code, course name, instance time) the first time any user adds an instance to a plan. This creates a read-only, shared record of "what was here when the first user added it" while keeping `planInstances` rows lightweight. Multiple `planInstances` rows (from different users' plans) reference the same snapshot by `instanceId`. If SISU data becomes unavailable later, the UI can fall back to displaying this snapshot. This is infrastructure for future developers to implement if dead links become a real problem.

#### The Active Plan

Only one plan can be active per user at any time. This is enforced both at the database level and in the UI. When a user opens Favourites View, courses can be added to the active plan. When they activate a different plan in Lego View, the previous plan becomes inactive, and the new plan is always highlighted in Lego View. This constraint prevents confusion: users always know which plan receives new instances.

## Phase 2: Schedule Pairs

### Finding Good Combinations

**Input:** 2+ course instances from a Plan

**Algorithm:**

```
For each instance:
  Fetch all study groups (lectures, exercises, exams)
  
Generate all valid combinations (one study group per block per instance):

Example:
  Instance A (default partition): 1 Lecture block × 1 Exercise block (3 study groups)
  Instance B (default partition): 1 Lecture block × 1 Exercise block (3 study groups)

Total combinations: 2 × 3 = 6 Schedule Pairs
  
For each combination:
  Find all overlapping time slots
  Calculate overlap score
  
Sort ascending (lower score = fewer conflicts)
Return ranked list
```

#### Conflict Detection

Two events overlap when: `event_a.start < event_b.end AND event_a.end > event_b.start`

```
Overlap duration = min(end_a, end_b) - max(start_a, start_b)
```

#### Scoring

**Simple scoring (current prototype):**
```
score = total_overlap_minutes
```

**Scoring (being refined):**
```
score = (overlap_minutes × weight_1)
      + (conflict_count × weight_2)  
      + (longest_overlap × weight_3)
```

#### Block Composition Example

```
Instance A: CS-A1110
  ├─ Lecture study groups:
  │  ├─ Mon/Wed 10-12
  │  ├─ Mon/Wed 13-15
  │  └─ Tue/Thu 10-12
  └─ Exercise study groups:
     ├─ Tue 14-16 (Group H01)
     └─ Thu 14-16 (Group H02)

Instance B: MATH-A1020
  ├─ Lecture study groups:
  │  ├─ Mon/Wed 11-13
  │  └─ Tue/Thu 11-13
  └─ Exercise study groups:
     ├─ Mon 15-17
     ├─ Wed 15-17
     └─ Fri 15-17
```

Valid composition must include:
- One lecture study group from CS-A1110
- One exercise study group from CS-A1110
- One lecture study group from MATH-A1020
- One exercise study group from MATH-A1020

Schedule Pairs generates all valid combinations, ranks by overlap.

**Status:** Basic algorithm works, scoring being optimized, API endpoint ready

### Partitioning System

Partitioning is the mechanism by which blocks are defined.

Blocks do not exist independently of partitioning; they are computational groupings over study groups created by the user (or provided as defaults).

#### What is Partitioning?

In implementation, blocks are computational groupings derived from study groups; users can refine these groupings beyond the conceptual defaults described in the concept docs.

By default, the system provides a suggested partition where:
- all lecture study groups form one block
- all exercise study groups form one block
- exams (if any) form fixed blocks

This default reflects common course structure, not a constraint of the system. The partition can be freely modified by the user.

#### Workflow: From Selection to Computation

1. User arranges blocks in Lego View (default: all exercises as one block per instance)
2. User customizes partitioning (optional): split groups, combine groups, etc
3. User clicks "Compute Schedule" button
4. Client sends partition + selected instances to backend
5. Server computes non-conflicting combinations
6. Server saves partition snapshot (if this is the first computation for the instance)
7. Server returns schedule combinations to client
8. UI displays valid schedule options to the user

#### Default Partitioning

When instances are first viewed in Lego View, all exercise groups for an instance are treated as a single block by default. This simplification:
- Reduces cognitive load (one block per course type)
- Mirrors how many students think about courses ("go to exercises on Tuesday")
- Can be customized before computation

#### User Computation Flow

When a user clicks "Compute Schedule", the server receives the partition and selected instances, computes non-conflicting combinations, and returns the results. If this is the first computation for that instance, the server saves the partition as a snapshot in the database for other users to reuse.

> [!NOTE]
> Future users viewing the same instance automatically fetch the cached partition as their default. This saves computation time and ensures consistency. However, users can still customize the partitioning before computing their own schedule.

#### Custom Overrides

Users can split exercise groups into separate blocks, combine groups, or define custom preferences per instance. These custom partitions are stored in `userInstancePartitions` and always take precedence over cached defaults.

#### Lookup Order

When Lego View needs a partition for an instance, it checks in this order:

1. **User-specific custom override** (user explicitly modified this instance's partitioning)
2. **Cached default from previous computation** (another user computed this instance and saved their partition)
3. **System default** (all exercises as one block)

When a user computes, their selection is saved if it's custom, or used directly if it's a cached default.

## Phase 3: Decision Slots (Planned)

**Purpose:** Make remaining conflicts explicit and force intentional choices

**Concept:** After a user commits to a Schedule Pair, mark one event as primary (attend) and others as secondary (handle somehow).

**Status:** Designed, not yet implemented. Waiting for Plans & Schedule Pairs to stabilize.

---

## Phase 4: Reflection & Workload Tools (Future)

**Planned:** Track patterns across a semester to help students understand their choices and plan better next semester.

**Ideas being considered:**
- Which courses required the most trade-offs?
- How much content was skipped?
- What was the actual workload vs. theoretical?
- How would different Schedule Pair choices have looked?

**Status:** Concept phase, depends on Phase 1 - 3

---

## Database Schema

### Plans Table

```typescript
export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Constraint: only one active plan per user (database-enforced)
    uniqueActivePlan: unique('unique_active_plan')
      .on(table.userId, table.isActive)
      .where(eq(table.isActive, true)),
  })
);
```

### Plan Instances Table

```typescript
export const planInstances = pgTable(
  'plan_instances',
  {
    planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
    instanceId: varchar('instance_id', { length: 100 }).notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => ({
    // Composite primary key: prevents adding the same instance twice to the same plan
    pk: primaryKey({ columns: [table.planId, table.instanceId] }),
  })
);
```

### Key Design Choices

**1. Separate `planInstances` table (not an array column):**
- The composite primary key `(planId, instanceId)` prevents duplicates at the database level
- Easier to query across plans ("which plans contain instance X?")
- Normalized schema: clearer queries and fewer edge cases

**2. `isActive` as a boolean (not an enum):**
- Simpler schema and queries
- Database constraint ensures only one active per user
- Frontend logic stays simple

**3. Cascading deletes:**
- If a user is deleted, their plans are deleted
- If a plan is deleted, its instances are deleted
- No orphaned data

**4. Instance IDs stored as strings (not foreign keys):**
- Instance data lives in SISU, not our database
- We can reference instances we don't own
- Plans remain valid even if SISU changes data structure

---

## API Reference

### Plans Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List all plans for the authenticated user |
| POST | `/api/plans` | Create a new plan with a name |
| PATCH | `/api/plans/:id` | Update plan name |
| PATCH | `/api/plans/:id/activate` | Make this plan active (deactivates others) |
| DELETE | `/api/plans/:id` | Delete a plan (cascades to instances) |

### Plan Instances Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plans/:id/instances` | Add an instance to the plan |
| DELETE | `/api/plans/:id/instances/:instanceId` | Remove an instance from the plan |

### Schedule Pairs Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plans/:id/compute-schedule` | Compute non-conflicting Schedule Pairs for selected instances |

### Response Format

```typescript
// GET /api/plans
{
  plans: [
    {
      id: "plan-123",
      userId: "user-456",
      name: "Spring 2025",
      isActive: true,
      instanceIds: ["inst-001", "inst-002", "inst-003"],
      createdAt: "2025-01-15T10:30:00Z",
      updatedAt: "2025-01-18T14:22:00Z"
    }
  ]
}

// POST /api/plans/:id/instances
{
  plan: {
    id: "plan-123",
    name: "Spring 2025",
    isActive: true,
    instanceIds: ["inst-001", "inst-002"],
    updatedAt: "2025-01-18T14:25:00Z"
  }
}

// POST /api/plans/:id/compute-schedule
{
  schedulePairs: [
    {
      rank: 1,
      studyGroupSelections: [
        { instanceId: "inst-001", studyGroupId: "sg-001", type: "lecture", time: "Mon 10-12" },
        { instanceId: "inst-002", studyGroupId: "sg-002", type: "exercise", time: "Tue 14-16" }
      ],
      conflicts: {
        totalOverlapMinutes: 0,
        overlaps: []
      }
    },
    {
      rank: 2,
      studyGroupSelections: [...],
      conflicts: {
        totalOverlapMinutes: 60,
        overlaps: [
          { time: "Mon 11-12", instances: ["inst-001", "inst-002"] }
        ]
      }
    }
  ]
}
```

## Design Rationale

### Decision: Store Only Instance IDs

**Alternative:** Store full course objects (name, credits, instructor, etc.)

**Why we didn't:**
- Duplicates course data already in SISU
- If course details change, plans become stale
- Tight coupling to SISU schema
- Significantly more storage

**Our choice:**
- Plans are lightweight selections
- Frontend fetches course details separately via courseStore
- Plans remain valid even if courses are renamed in SISU

### Decision: Separate `planInstances` Table

**Alternative:** Store instances as a PostgreSQL array column

**Why we didn't:**
- Can't enforce uniqueness at database level (would need app logic)
- Harder to query across plans
- Less normalized (violates relational principles)

**Our choice:**
- Composite primary key prevents duplicates automatically
- Queries are clearer and more maintainable
- One extra table is minimal overhead for data safety

### Decision: One Active Plan Per User

**Alternative:** Allow multiple active plans

**Why we didn't:**
- Ambiguous UX: which plan receives new instances?
- Users could confuse which plan they're modifying
- No real benefit (switching plans is one click)

**Our choice:**
- Clear mental model: one "current" plan
- Database constraint prevents bugs
- UI always shows which plan is active

### Decision: Always Sync with Backend

**Alternative:** Optimistic updates (update UI immediately, sync later)

**Why we didn't:**
- Need rollback logic if server rejects change
- Risk of UI desync if page refreshes
- Backend must validate anyway

**Our choice:**
- Wait for server confirmation before updating UI
- Single source of truth: backend is authoritative
- Simpler code: no optimistic rollback logic

### Decision: Cached Partitions Across Users

**Alternative:** Each user computes and stores their own partition independently

**Why we didn't:**
- Duplicate computation for identical instances
- No consistency across users viewing same instance
- Wastes storage

**Our choice:**
- Cached partitions are treated as suggested defaults, not authoritative truth, and are always overridable by the user
- Cached defaults speed up computation for subsequent users
- Users can still customize partitions (custom overrides)
- Balances efficiency with user flexibility

---

## Edge Cases & Unspecified Behavior

### Favorites and Plans Cascade

**Current behavior (unspecified):** If a user removes a course from their favorites list, what happens to instances of that course already added to a plan?

**Possible interpretations:**

1. **No cascade** (likely current): Instances remain in the plan. The plan is an independent selection that doesn't depend on the favorites list. The course can always be re-added to favorites later and viewed again.

2. **Cascade deletion**: Removing from favorites deletes all instances of that course from all plans. This would require a foreign key relationship and would be enforced at the database level.

3. **Soft delete with warning**: Removing from favorites marks instances as "orphaned" in plans. The plan can show them as "no longer available" but keeps them for historical reference.

**Why it matters:**
- Interpretation 1 treats plans as independent of the favorites system (loosely coupled)
- Interpretation 2 treats plans as derived from favorites (tightly coupled, riskier)
- Interpretation 3 treats plans as historical records (immutable but informative)

**Current assumption:** We assume **Interpretation 1** (no cascade). Plans are permanent selections independent of favorites. A user can remove a course from favorites, then re-add it later and still see their planned instances. However, **this should be explicitly documented or tested** before relying on it.

**Action items for developers:**
- [ ] Verify current behavior through testing or code inspection
- [ ] Add tests for this scenario (favorites removal shouldn't affect plans)
- [ ] Document the chosen behavior explicitly in this section
- [ ] If cascade is needed later, add foreign key constraint and update schema

### Duplicate Instances in Plan

**Current behavior:** If a user somehow tries to add the same instance twice to a plan, the composite primary key `(planId, instanceId)` silently ignores the second insert.

**Desired behavior:** Should we:
1. Silently ignore (current) - prevents duplicates, but user gets no feedback
2. Return error to UI - user sees "Already added to plan"
3. Return success but don't duplicate - user gets confirmation, no duplicate created

**Recommendation:** Option 2 or 3. Add service logic in `PlansService.ts` to check for duplicate before insert and either reject with a message or return success without inserting.

**Action item:**
- [ ] Update service layer to handle duplicate instance addition gracefully

### Instance Removed from SISU

**Current behavior (unspecified):** If SISU removes an instance entirely after a user has added it to a plan, what does the user see?

**Scenarios:**
1. **Instance still in database, course details available** - Show normally
2. **Instance deleted from SISU, snapshot available** - Show snapshot data ("This course was offered in Spring 2025")
3. **Instance deleted from SISU, no snapshot** - Show error or placeholder

**Current implementation:** Uses instance snapshots (see `instanceSnapshots` table description above)

**Action items:**
- [ ] Implement `instanceSnapshots` table when dead links become a real problem
- [ ] Add migration to create snapshot for instances already in plans
- [ ] Update API responses to fall back to snapshots when instance is unavailable

### Partition Computation for Large Plans

**Current behavior (unspecified):** If a user has 10 course instances with many study groups each, computing all combinations could be expensive.

**Example worst case:**
- 10 instances
- Each with 3 lectures × 3 exercise groups = 9 combinations per instance
- Total: 9^10 = ~3.6 billion combinations

**Mitigation strategies:**
1. **Limit number of instances** - Compute only for selected subset (2-4 instances at a time)
2. **Pagination** - Show top 50 results, allow user to request more
3. **Time limit** - If computation takes >5 seconds, return best results found so far
4. **Client-side filtering** - Let user pre-filter before sending to backend

**Current assumption:** Users will compute in small batches (2-4 instances). Not specified.

**Action items:**
- [ ] Document expected behavior (number of instances, response time)
- [ ] Add tests for performance with varying numbers of instances
- [ ] Implement limits if computation becomes slow in production

### Partition Persistence Across Instances

**Current behavior:** When a user customizes a partition for one instance, does it affect other instances of the same course (different semesters)?

**Example:**
- User has CS-A1110 in Spring 2025 (inst-001) and Fall 2025 (inst-002)
- User customizes partition for Spring 2025 instance
- Does Fall 2025 instance use the same custom partition by default?

**Current assumption:** No - each instance is independent. Custom partitions are per-instance per-user.

**Action items:**
- [ ] Verify this is the intended behavior
- [ ] Add tests to ensure independence
- [ ] Consider future feature: "Apply this partition to all instances of this course"

## Current Limitations

**Block composition constraints:**
- Assumes chosen study group selections are independent across blocks (no constraints like “must attend lecture A to take exercise B”)
- Doesn't yet account for prerequisite ordering (some exercises depend on lecture)
- Exam times are fixed (no choice in combination)
- Doesn't model "blended" courses (mixed live/recorded)

**Scoring model:**
- Simple time overlap, doesn't weight by content (lecture > exercise > exam)
- No "break time" consideration
- No location/travel time
- Doesn't model student-specific preferences (some prefer stacked courses, some prefer spread out)

**Why:** First version optimizes for simplicity and correctness. Refinements will be added as patterns emerge from real usage.

## Integration Points

**With Discovery:** Plans use course instances from filtered course discovery

**With SISU Wrapper:** Fetches live study group data when user requests Schedule Pairs

**With Authentication:** All plans are user-scoped (RLS at database level)

**With Favorites:** Plans are independent collections; removing from favorites doesn't affect plans (no cascade)

**With Future Phases:** Decision Slots will reference both Plan and Schedule Pair data

## Troubleshooting

### "Why doesn't my instance show up in the plan?"

Possible causes:
- Instance ID is invalid (check courseStore has loaded the course)
- Plan is not active (switch to it in Lego View before adding)
- Network error (check browser console for failed requests)
- User is not signed in (check Auth store)
- Instance was deleted from SISU (check instance snapshots)

**Solution:** Refresh the page and try again. If persists, check backend logs for validation errors.

### "Can I delete a plan?"

Yes, use the delete button in Lego View. **Warning:** This is permanent—deleted plans cannot be recovered. You'll lose any instances stored in that plan (but not the courses themselves, which remain in SISU).

### "Can I have multiple active plans?"

No—only one plan can be active at a time. This is by design. If you want to add courses to a different plan, switch to it in Lego View first (click "Make Active").

### "Why do my plans disappear after I close the browser?"

Plans should persist. If they don't, it means the backend didn't save them. Check:
- You are signed in (plans are user-scoped)
- Network requests succeeded (check Network tab in browser dev tools)
- Backend is running and healthy

If plans consistently disappear, file a bug report with your browser console logs.

### "Schedule computation is slow. Why?"

Possible causes:
- Too many instances selected (try computing with fewer)
- Instances with many study groups (try simplifying partitions)
- Backend under heavy load (try again later)
- Algorithm not optimized for your data (file an issue with instance details)

**Solution:** Compute in smaller batches (2-4 instances at a time). If consistently slow, add benchmarking and optimize the algorithm.


## See Also
- **[Concepts Overview](../../concepts/overview/)** – Design philosophy
- **[Security Overview](../../securities/overview/)** – Data protection
- **[API Reference](../../api/)** – How to query the APIs