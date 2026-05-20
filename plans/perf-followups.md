# Performance follow-ups: `@kubb/core`

## Context

The recent refactor (extracting `KubbDriver.run()`, converting `createKubb` to a `Kubb` class, adding `[Symbol.dispose]` semantics, and switching `FileManager` to incremental sorted storage) captured the obvious memory/speed wins. The items below are **potential** further optimizations identified during review. They are intentionally not implemented yet — each carries a non-trivial trade-off, and the test suite + benchmark don't exercise the code paths that would prove the win.

**Prerequisite for all of these:** add an end-to-end perf harness that runs a real generation (real spec, real plugin set, real storage) and exposes Node's `--prof` / `--heap-prof`. Without that, we're optimizing on intuition. The existing `packages/adapter-oas/src/adapter.bench.ts` only times OAS parsing — it doesn't hit `FileManager`, `hooks.emit`, or `KubbDriver.run()`.

## Candidate optimizations (deferred — needs profiling data)

### 1. Avoid redundant `createFile()` work on repeated `upsert` of the same path

**Where:** `packages/core/src/FileManager.ts:#store` calls `createFile(merged)` on every `upsert`. `createFile` (in `packages/ast/src/factory.ts`) runs `combineExports`, `combineImports`, `combineSources`, plus extension parsing and SHA hashing. For barrel files that are merged dozens of times during a single build, the same work runs every time.

**Idea:** keep a lightweight "pending" FileNode in `#cache` while merges are accumulating, and only call `createFile()` once per path before write (in the build loop's flush path). The accumulated merges become a simple `concat`-on-arrays operation; the expensive normalization runs once.

**Trade-off:**
- The merged file in the cache would not be fully canonicalized between merges. Any consumer that reads `fileManager.files` mid-build (event listeners, devtools) would see semi-resolved nodes.
- Could be solved by gating "fully canonicalized" behind the flush boundary.

**Estimated value:** depends entirely on merge frequency. For builds dominated by per-operation generators (one file per op, no barrel merge), near-zero gain. For builds with heavy barrel use (`middleware-barrel`), measurable.

**Critical files:**
- `packages/core/src/FileManager.ts`
- `packages/ast/src/factory.ts` (`createFile` — possibly split into `createFile` and `createFileLazy`)

### 2. Skip array copies in `mergeFile` when one side is empty

**Where:** `packages/core/src/FileManager.ts:4-15` — `mergeFile` does:

```ts
sources: [...(a.sources || []), ...(b.sources || [])],
imports: [...(a.imports || []), ...(b.imports || [])],
exports: [...(a.exports || []), ...(b.exports || [])],
```

When one side is empty (the common case for the very first merge), this still allocates a new array via spread.

**Idea:**

```ts
function concat<T>(a: ReadonlyArray<T> | undefined, b: ReadonlyArray<T> | undefined): Array<T> {
  if (!a?.length) return b ? [...b] : []
  if (!b?.length) return [...a]
  return [...a, ...b]
}
```

(Or skip the copy entirely and share the reference — see trade-off.)

**Trade-off:** if we share the reference (`return b!` instead of `[...b]`) we save the allocation but break the contract that returned files are independent of inputs. FileNodes are *conceptually* immutable, but nothing in the type system enforces it. Sharing references is a footgun if a plugin mutates a `sources` array it received elsewhere.

**Estimated value:** small per call, but `mergeFile` is on every barrel upsert. Could be measurable for barrel-heavy builds.

**Critical files:**
- `packages/core/src/FileManager.ts` (just `mergeFile`)

### 3. Gate per-node `hooks.emit` on `listenerCount`

**Where:** `packages/core/src/KubbDriver.ts:dispatchSchema` and `dispatchOperation`:

```ts
await this.hooks.emit('kubb:generate:schema', transformedNode, ctx)
await this.hooks.emit('kubb:generate:operation', transformedNode, ctx)
```

These fire **once per node per plugin**. For a 500-schema × 5-plugin build that's 2500 emit cycles. Even when nobody is listening, each emit walks the (empty) listener array.

**Idea:** mirror what we already do for `kubb:generate:operations` (line ~635):

```ts
const emitsSchemaHook = this.hooks.listenerCount('kubb:generate:schema') > 0
// ...
if (emitsSchemaHook) await this.hooks.emit('kubb:generate:schema', transformedNode, ctx)
```

Capture once at the top of `#runGenerators`. The check is correct because listener counts don't change during the run (plugin setup is done by then).

**Trade-off:** none worth mentioning. The only subtlety is that any listener registered *during* `#runGenerators` (highly unusual) would miss events for nodes already dispatched — same as today, since handlers register during plugin setup.

**Estimated value:** depends on emitter overhead. Node's `EventEmitter` is fast but not free; for builds with no listeners on these channels, the saving is real and proportional to schema/operation count.

**Critical files:**
- `packages/core/src/KubbDriver.ts` (`#runGenerators` only)

### 4. Batch `kubb:file:processing:update` events

**Where:** `packages/core/src/KubbDriver.ts:flushPending` emits one `kubb:file:processing:update` per file:

```ts
for (const { file, source, processed, total, percentage } of stream) {
  queue.push(
    (async () => {
      await hooks.emit('kubb:file:processing:update', { file, source, processed, total, percentage, config })
      // ...
    })(),
  )
}
```

For a 1000-file build, that's 1000 awaited emits.

**Idea:** introduce `kubb:files:processing:update:batch` taking `Array<{ file, source, … }>` and emit once per `STREAM_FLUSH_EVERY` chunk. Keep the per-file event for backwards compatibility, gated on `listenerCount`.

**Trade-off:** **public API change.** Users relying on per-file progress UI need to migrate. Worth doing only if profiling shows the emit overhead is meaningful.

**Estimated value:** unknown without measurement; could be sizeable for very large builds.

**Critical files:**
- `packages/core/src/KubbDriver.ts` (`flushPending`)
- `packages/core/src/createKubb.ts` (`KubbHooks` type)
- Anywhere in the ecosystem listening to `kubb:file:processing:update` (devtools, CLI progress reporters)

### 5. `indexOf` lookup in `FileManager.#store` for the existing-file position

**Where:** `packages/core/src/FileManager.ts:#store`:

```ts
const idx = this.#sorted.indexOf(existing)
if (idx !== -1) this.#sorted[idx] = merged
```

`indexOf` on the sorted array is O(N). For a build that upserts 5000 files with frequent merges into existing entries, this is N² work in aggregate.

**Idea:** maintain a sibling `Map<string, number>` (path → sorted-array index). Update both on every insert/delete.

**Trade-off:** `binaryInsert` does a `splice` which shifts later elements — every shift would also need to update its sibling-map index. Doable but the bookkeeping subtle. An alternative: use a `Map<string, FileNode>` for the cache and recompute sorted order only when needed for output (give up on the live sorted view). But event listeners currently expect `files` to always be sorted.

**Estimated value:** quadratic in worst case, but only matters when merging-into-existing is frequent. For "every plugin writes to one fresh path per operation," the existing-file branch isn't taken.

**Critical files:**
- `packages/core/src/FileManager.ts`

### 6. Skip the `transform()` wrapper on the identity case

**Where:** `packages/core/src/KubbDriver.ts:dispatchSchema` and `dispatchOperation`:

```ts
const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
```

Already gated on `plugin.transformer` being defined. But `transform()` itself (in `@kubb/ast`) might do work even when the transformer returns its input unchanged.

**Idea:** check `transform()`'s implementation. If it always builds a new node structure regardless of transformer return shape, we could fast-path identity transformations by returning the original reference.

**Trade-off:** none if the transformer truly returns the input — but plugins can return modified copies, so we can't skip blindly. The check would need to be `transformedNode === node ? node : transformedNode`, which is what `transform()` should already do.

**Estimated value:** depends on `transform()`'s current behaviour; likely already optimal. Worth a single read of `packages/ast/src/utils.ts:transform` to confirm.

**Critical files:**
- `packages/ast/src/utils.ts` (`transform`) — read first; may already be optimal

## Items deliberately not on this list

These were considered and rejected:

- **Converting `define*` / `create*` factories to classes** — they're stateless type-wideners. Class would add `new` ceremony with no behaviour change.
- **Converting `fsStorage` / `memoryStorage` to classes** — the factory pattern is what enables swappable backends. Would force a breaking API change (`new MemoryStorage()` instead of `memoryStorage()`).
- **Pruning pre-scan memory** (`#runGenerators` `allSchemas`) — the comment in the code already explains why this is a known trade-off. Schema reachability can't be computed without the full graph in memory.
- **Parallel `forBatches(schemas, …)` + `forBatches(operations, …)`** — tried once, reverted. Races on shared `flushPending` + `FileProcessor.events`. Real correctness bug, not just a perf question.
- **Tracking `kubb:plugin:end` payload allocation overhead** — each emit creates a fresh `{ get files(), upsertFile, … }`. Tiny per-plugin allocation; dedup'd via `#filesPayload()`. Not worth further reduction.

## Verification approach

When (and only when) profiling data motivates one of the items above:

1. **Baseline:** capture current numbers with a representative workload — large OpenAPI spec, full plugin set (`@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-react-query`, `middleware-barrel`), `fsStorage`. Record wall time + heap-used after build.
2. **Implement** the single chosen optimization.
3. **Re-run** with the same workload + seeded inputs. Compare wall time, RSS at peak, and `--prof` flame graphs.
4. **Regression-check** the test suite: `pnpm typecheck` + `pnpm test` (1387 tests).
5. **API check:** if the change touches a `kubb:*` hook payload or any export, add a changeset (`pnpm changeset`) flagging it as `patch` (internal-only optimization) or `minor` (new event) or `major` (removed/renamed event).

## Out of scope here

- **The perf harness itself.** Building it is a prerequisite, not part of these items. A separate plan should cover that: pick a benchmark spec (e.g. `petStore-expanded` or a stripped GitHub OpenAPI doc), pick a plugin set, decide on the measurement protocol (cold vs warm, formatter on/off, parallel runs for variance), and wire it into `pnpm bench`.
