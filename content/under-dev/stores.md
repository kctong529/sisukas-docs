---
weight: 4
title: "Canonical Store Patterns"
description: "A consistent, performance-conscious architecture for state management using Svelte 5 runes, with clear separation between state, queries, and mutations."
---

> [!NOTE]
> These conventions are intentionally opinionated. They exist to keep store APIs predictable, avoid subtle reactivity bugs, and make performance characteristics easy to reason about.

This project uses **Svelte 5 runes-style stores** for all new and modernized state.  
Legacy `writable` stores may remain temporarily, but **all new code should follow the patterns below**.

## Goals

- Consistent store API across the app
- Fast reads in templates and services
- Clear separation between **state**, **queries**, and **mutations**
- Safe bridging for legacy `subscribe` stores during migration
- Avoid accidental reactivity pitfalls and performance cliffs

## 1) Store shape: `.state`, `.read`, `.actions`

Every runes-style store exports a **single object** with three clearly defined sections:

```ts
export const someStore = {
  state,   // mutable reactive state ($state)
  read,    // pure query helpers (no side effects)
  actions, // mutations, async operations, IO, caching
};
````

> [!IMPORTANT]
> Components should **never mutate store state directly**.
> All mutations must go through `.actions`.

### `.state` (reactive, mutable)

Rules:

* **Only** `$state(...)` objects and primitive fields
* Keep it small and normalized
* Include `loading` / `error` fields if the store does IO

Example:

```ts
const state = $state({
  items: [] as Item[],
  byId: new Map<string, Item>(),

  loading: false,
  error: null as string | null,
  lastUpdatedAt: 0,
});
```

> [!TIP]
> Prefer indexes (`Map`, `Set`) over repeatedly scanning arrays in `.read`.

### `.read` (pure queries)

Rules:

* **No side effects** (no network, no writes)
* Takes inputs and returns derived values
* May read from `state`, but must not mutate it
* Prefer stable return types when possible

```ts
const read = {
  getById(id: string) {
    return state.byId.get(id);
  },
  has(id: string) {
    return state.byId.has(id);
  },
};
```

> [!WARNING]
> If a function needs to fetch data, update state, or trigger effects, it does **not** belong in `.read`.

### `.actions` (mutations + IO)

Rules:

* The **only place** that:

  * mutates `state`
  * triggers network calls
  * does caching or memoization
  * orchestrates multi-step updates

```ts
const actions = {
  async load() { /* ... */ },
  setItems(items: Item[]) { /* ... */ },
  clear() { /* ... */ },
};
```

## 2) “Mode” pattern for stores with multiple datasets

If a store supports multiple datasets (e.g. *active* vs *historical*), use an explicit mode.

```ts
type Mode = "active" | "all";

const state = $state({
  mode: "active" as Mode,
  activeLoaded: false,
  historicalLoaded: false,
  historicalLoading: false,
});
```

Canonical API:

* `actions.setMode(mode: Mode)`
  * switches the active view
  * **auto-loads required data** (idempotent)
* `actions.ensureHistoricalLoaded()`
  * safe to call repeatedly
* `read.*Current*` functions are **mode-aware**

> [!IMPORTANT]
> “Current” always means *whatever the active mode points at*.
> Components should not need to know about internal indexing details.

## 3) Idempotent async actions (no duplicate loads)

Every async loader **must** be safe to call multiple times.

Canonical pattern:

```ts
let historicalPromise: Promise<void> | null = null;

async function ensureHistoricalLoaded(): Promise<void> {
  if (state.historicalLoaded) return;
  if (historicalPromise) return historicalPromise;

  state.historicalLoading = true;
  historicalPromise = (async () => {
    try {
      const data = await fetchHistorical();
      // merge into indexes
      state.historicalLoaded = true;
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      state.historicalLoading = false;
      historicalPromise = null;
    }
  })();

  return historicalPromise;
}
```

> [!TIP]
> This allows components to safely do:
>
> ```ts
> void store.actions.ensureHistoricalLoaded();
> ```
>
> without coordinating or checking flags first.

## 4) Canonical normalization: indexes vs lists

If you need fast lookups, store **indexes** in state:

* `byId: Map<string, T>`
* `idsByGroup: Map<string, string[]>`
* `ids: string[]` (optional)

Avoid storing the same data in multiple heavyweight forms unless necessary.

Update related structures **atomically**:

```ts
function setItems(items: Item[]) {
  state.items = items;
  state.byId = new Map(items.map(i => [i.id, i]));
}
```

## 5) Reactive collections: use them deliberately

### Default rule

Use **plain `Map` / `Set`** in `$state` unless you need mutation-level reactivity.

* If you *replace* the whole map/set → plain `Map` / `Set`
* If you *mutate* frequently and need fine-grained reactivity → `SvelteMap` / `SvelteSet`

### Canonical options

**Option A — immutable updates (recommended default)**

```ts
state.byId = new Map(state.byId).set(id, item);
```

**Option B — reactive collections (use sparingly)**

```ts
import { SvelteMap } from "svelte/reactivity";

state.byId = new SvelteMap();
state.byId.set(id, item);
```

> [!WARNING]
> Blindly converting everything to `SvelteMap` / `SvelteSet` can cause serious performance regressions.
> Use them only where mutation-level reactivity is actually required.

## 6) Cross-store reads

When Store A needs data from Store B:

* Prefer `storeB.read.*`
* Avoid poking `storeB.state` unless it’s a cheap, read-only check

```ts
const course = courseIndexStore.read.resolveByInstanceId(id);
```

## 7) Component integration

### Reading state in templates

```svelte
{#if courseIndexStore.state.historicalLoading}
  <p>Loading…</p>
{/if}
```

### Lookups and derived logic

```ts
const resolveCourse = (id: string) =>
  courseIndexStore.read.resolveByInstanceId(id);
```

### Effects trigger actions (fire-and-forget)

```ts
$effect(() => {
  if (needsHistorical) {
    void courseIndexStore.actions.ensureHistoricalLoaded();
  }
});
```

> [!IMPORTANT]
> Prefer `void` for fire-and-forget actions.
> Rendering should never block on store IO.

## 8) Bridging legacy writable stores

During migration, legacy `writable` stores may still exist.

Canonical utilities:

```ts
type Unsubscriber = () => void;
type Subscribable<T> = { subscribe(run: (value: T) => void): Unsubscriber };

export function isSubscribable<T>(x: unknown): x is Subscribable<T> {
  return !!x && typeof (x as { subscribe?: unknown }).subscribe === "function";
}
```

Canonical bridge:

```ts
$effect(() => {
  const unsubs: Unsubscriber[] = [];

  if (isSubscribable<PlansStoreValue>(plansStore)) {
    unsubs.push(plansStore.subscribe(v => {
      // copy into local $state
    }));
  }

  return () => unsubs.forEach(u => u());
});
```

> [!NOTE]
> Bridge once, then use local `$state`.
> Do not spread legacy `.subscribe` usage throughout the component.

## 9) Error and loading fields

If a store performs IO, include:

* `loading: boolean`
* `error: string | null`

For multiple loaders, be explicit:

* `historicalLoading`, `historicalLoaded`
* `activeLoading`, `activeLoaded`

Actions should:

* set loading flags before/after
* set `error` on failure
* rethrow only when the caller needs to react

## 10) Naming conventions

* Files:

  * rune store: `fooStore.svelte.ts`
  * legacy store (temporary): `fooStore.ts`
* Public API:

  * `.read.resolveById`, `.read.getCurrent…`
  * `.actions.load`, `.actions.ensure…`, `.actions.set…`, `.actions.clear`
* “Current” always means **mode-aware**

## Checklist for new or updated stores

* [ ] Exports `{ state, read, actions }`
* [ ] No side effects in `.read`
* [ ] All mutations happen via `.actions`
* [ ] Async loads are idempotent (deduped promise)
* [ ] Indexes updated atomically
* [ ] Reactive collections used only when justified
* [ ] Legacy stores bridged locally, not leaked
* [ ] Clear loading/error flags
