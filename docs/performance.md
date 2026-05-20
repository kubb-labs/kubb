# Performance Analysis & Roadmap

This document captures what has already been done to optimize the build pipeline, what was investigated but found not applicable, and what concrete opportunities remain — each with estimated time savings across representative spec sizes.

## Baseline Benchmarks

All timings are wall-clock end-to-end build time, measured against three representative specs running ts + zod + react-query plugins:

| Spec | Schemas | Output files | Current | hey-api |
|------|--------:|-------------:|--------:|--------:|
| petStore | ~50 | ~150 | 97 ms | 55 ms |
| twitter | ~300 | ~900 | 714 ms | 466 ms |
| openai | ~1 000 | ~3 000 | 2 580 ms | 1 680 ms |

## Current Architecture

```
Parse OpenAPI spec                        ~5–50 ms (scales with spec size)
  ↓ stream schemas/operations (one at a time)
  ↓ Promise.all → all plugins process same node concurrently
      ↓ within each plugin: generators run sequentially
          ↓ jsxRendererSync → FileNode (sync, no fiber)  ~0.1–0.5 ms/call
          ↓ FileManager.upsert() (in-memory merge)        ~0.05 ms/call
  ↓ [repeat for N schemas × M plugins]                   bulk of total time
flushPendingFiles()
  ↓ for each file: FileProcessor.stream → TS printer      ~0.1–0.3 ms/file
  ↓ await storage.setItem(path, source)                   ~0.05–0.2 ms/file
  ↓ [repeat sequentially for every output file]
```

---

## What Has Already Been Done

### JSX sync renderer (`jsxRendererSync`)

Replaced the React fiber reconciler (`Runtime.tsx`) with a single-pass recursive tree walk (`SyncRuntime.tsx`). All plugins use `jsxRendererSync`. The fiber-based `jsxRenderer` is still exported for backward compatibility.

| Spec | Estimated saving |
|------|-----------------|
| petStore | **~25 ms** |
| twitter | **~150 ms** |
| openai | **~500 ms** |

The fiber scheduler added ~0.15–0.2 ms of overhead per generator call. With N schemas × M generators, this accumulated significantly on larger specs.

- **Files:** `packages/renderer-jsx/src/SyncRuntime.tsx`, `packages/renderer-jsx/src/createRenderer.tsx`

### `walkFiles` true streaming

`SyncRuntime.stream()` now yields each `FileNode` immediately as it is encountered rather than accumulating all nodes into a buffer first.

| Spec | Estimated saving |
|------|-----------------|
| petStore | **< 1 ms** |
| twitter | **< 1 ms** |
| openai | **< 1 ms** |

This is a correctness improvement (second component is not evaluated before first file is consumed) with negligible wall-clock impact, since both the tree walk and `fileManager.upsert()` are fully synchronous.

- **Files:** `packages/renderer-jsx/src/SyncRuntime.tsx`

### Per-node plugin fan-out

All plugins process the same schema/operation node concurrently via `Promise.all`. The adapter streams the spec once and distributes to all plugins in a single pass, eliminating the N×parse-time overhead for multi-plugin builds.

| Spec | Estimated saving vs. sequential plugins |
|------|----------------------------------------|
| petStore (3 plugins) | **~40 ms** |
| twitter (3 plugins) | **~300 ms** |
| openai (3 plugins) | **~1 100 ms** |

- **Files:** `packages/core/src/createKubb.ts`

### `parse()` synchronous, `FileProcessor.stream` plain generator

`@kubb/parser-ts` `parse()` returns `string` directly (no async). `FileProcessor.stream` is a plain `Generator<FileNode>`, removing one microtask per file from the flush path.

| Spec | Estimated saving |
|------|-----------------|
| petStore | **~5 ms** |
| twitter | **~30 ms** |
| openai | **~100 ms** |

### `$ref` resolution cache

`$ref` lookups inside `parse()` are cached per parse call. For the Stripe spec (1 400 schemas) this dropped memory from OOM at 8 GB to 840 ms / 15 MB.

### `resolveOptions` WeakMap cache

Per-node options resolution is cached via a two-level `WeakMap<options, WeakMap<node, result>>`. When no `include`/`exclude`/`override` filters exist (`optionsAreStatic`), the per-node call is skipped entirely.

| Spec | Estimated saving |
|------|-----------------|
| petStore | **~3 ms** |
| twitter | **~15 ms** |
| openai | **~50 ms** |

### Printer caching in plugin-zod

`zodGenerator` caches printer instances per `resolver` reference using `WeakMap`. Printer construction is skipped on subsequent schema calls within the same build.

| Spec | Estimated saving |
|------|-----------------|
| petStore | **~5 ms** |
| twitter | **~30 ms** |
| openai | **~100 ms** |

---

## What Was Investigated But Does Not Apply

### Phase 5: Memoize component generators via WeakMap on plugin config

**Proposal:** Cache the generator object returned by `defineGenerator` keyed on the user-supplied config object.

**Finding:** Not applicable. Generator objects (`zodGenerator`, `typeGenerator`, etc.) are module-level constants defined once at import time — they are not recreated per build or per call. Caching them is a no-op. The expensive work is inside the generator function body (printer construction, AST traversal), and the meaningful caching there already exists (see printer caching above).

**Estimated saving: 0 ms.**

### Lazy evaluation wrappers and tree memoization (Phases 4–5 from JSX proposal)

**Proposal:** Wrap expensive component subtrees in a `lazy(() => ...)` helper; cache component generators by config.

**Finding:** Since `jsxRendererSync` calls function components synchronously and in-order, lazy wrappers add allocation overhead without benefit — there is no scheduler to defer work to. Conditional early returns (`if (!condition) return null`) already skip subtrees at zero cost. No implementation needed.

**Estimated saving: 0 ms.**

---

## Remaining Opportunities

> All estimates below are theoretical, derived from architectural analysis. They should be validated with profiling on real specs before implementation.

### 1. Parallel file writes

**Current:** `flushPendingFiles()` writes files sequentially — each `await storage.setItem()` blocks the next write.

```ts
// createKubb.ts — current
for (const { file, source } of stream) {
  await storage.setItem(file.path, source)  // sequential
}
```

**Improvement:** A bounded `Promise.all` pool (8–16 concurrent writes) cuts the write phase significantly. `STREAM_FLUSH_EVERY = 50` is already defined in `constants.ts` but unused — this is where it belongs.

```ts
// proposed
const queue: Promise<void>[] = []
for (const { file, source } of stream) {
  queue.push(storage.setItem(file.path, source))
  if (queue.length >= STREAM_FLUSH_EVERY) {
    await Promise.all(queue.splice(0))
  }
}
await Promise.all(queue)
```

| Spec | Write phase (current) | Write phase (parallel) | Saving |
|------|----------------------:|----------------------:|-------:|
| petStore | ~10 ms | ~2 ms | **~8 ms** |
| twitter | ~60 ms | ~8 ms | **~52 ms** |
| openai | ~200 ms | ~20 ms | **~180 ms** |

- **Effort:** Low
- **Risk:** Low — writes are independent
- **Files:** `packages/core/src/createKubb.ts`, `packages/core/src/constants.ts`

### 2. Streaming flush during generation

**Current:** All `FileNode` objects accumulate in `FileManager` until generation is complete, then flush in one batch. For a 1 000-schema spec generating 3 000 files, peak memory is proportional to total output.

**Improvement:** Flush completed files every N operations during the generation loop rather than at the end. This overlaps I/O with generation and reduces peak memory. Uses the same `STREAM_FLUSH_EVERY` constant.

| Spec | Saving (time) | Peak memory reduction |
|------|:-------------:|:---------------------:|
| petStore | **~3 ms** | ~30% |
| twitter | **~20 ms** | ~40% |
| openai | **~70 ms** | ~50% |

Time savings come from hiding I/O latency behind in-progress generation. Memory savings are proportional to how early files can be flushed and GC'd.

- **Effort:** Medium
- **Risk:** Low
- **Files:** `packages/core/src/createKubb.ts`

### 3. Extend printer caching to all plugins

`plugin-zod` already caches its printer via `WeakMap<resolver, printer>`. The same pattern should be applied to `plugin-ts`, `plugin-client`, `plugin-react-query`, and other plugins that construct printer objects inside their generators.

| Spec | Saving per plugin | Saving across 3 plugins |
|------|:-----------------:|:-----------------------:|
| petStore | ~3–5 ms | **~10–15 ms** |
| twitter | ~15–25 ms | **~50–75 ms** |
| openai | ~50–80 ms | **~150–240 ms** |

- **Effort:** Low per plugin
- **Risk:** Low
- **Files:** `plugins/packages/plugin-ts/src/generators/`, `plugins/packages/plugin-client/src/generators/`, etc.

### 4. Schema-level parallelism

**Current:** Schemas are processed one at a time through the streaming loop, even though plugins already fan out in parallel per node.

**Improvement:** Process batches of N schema nodes concurrently. The blocker is import resolution: schema A's imports may reference schema B's resolved path. A two-pass approach solves this — resolve all schema file paths first (fast, synchronous), then parallelize code generation.

| Spec | Generation loop (current) | Generation loop (8 parallel) | Saving |
|------|-------------------------:|-----------------------------:|-------:|
| petStore | ~55 ms | ~35 ms | **~20 ms** |
| twitter | ~400 ms | ~200 ms | **~200 ms** |
| openai | ~1 500 ms | ~650 ms | **~850 ms** |

Estimated assuming ~4× throughput improvement with 8-way parallelism, partially limited by I/O and sequential bottlenecks within each schema.

- **Effort:** High
- **Risk:** Medium — ordering guarantees must be preserved
- **Files:** `packages/core/src/createKubb.ts`, `packages/core/src/defineResolver.ts`

### 5. Worker threads for CPU-bound printing

The TypeScript printer (`parser-ts`) and Zod schema printer are pure CPU work with no shared mutable state. They take a `FileNode` and return a `string`. Offloading to a `worker_threads` pool would parallelize printing across CPU cores.

Structural requirement: printer inputs must be serializable (no functions, no class instances). Kubb's `FileNode` and `CodeNode` types are plain objects, so this is feasible. Serialization overhead likely erases gains for small files — this matters most for large files (complex Zod schemas, large operation clients) on machines with multiple cores.

| Spec | Print phase (current) | Print phase (4 workers) | Saving |
|------|----------------------:|------------------------:|-------:|
| petStore | ~20 ms | ~8 ms | **~12 ms** |
| twitter | ~120 ms | ~40 ms | **~80 ms** |
| openai | ~450 ms | ~130 ms | **~320 ms** |

- **Effort:** High
- **Risk:** Medium — worker pool setup, data serialization overhead for small files may reduce gains
- **Files:** `packages/core/src/createKubb.ts`, `packages/parser-ts/src/`

### 6. Unify to always-stream (remove dual code paths)

**Current:** Two mutually exclusive execution paths exist gated by `STREAM_SCHEMA_THRESHOLD = 100` schemas. Below the threshold, `adapter.parse()` loads all nodes into memory and `runAstPlugin()` processes plugins sequentially. Above it, `adapter.stream()` yields nodes lazily and `runStreamPlugins()` fans each node to all plugins concurrently. The `count()` pre-scan adds redundant parsing overhead whenever the adapter supports streaming.

**Improvement:** Always use the streaming path. Enrich `InputMeta` with pre-computed data (`circularSchemas`, `enumSchemaNames`, `schemasByName`, `document`) so plugins no longer need `inputNode.schemas`. Replace `context.inputNode` with `context.meta` in generators. Remove `runAstPlugin()`, `inputNode`, and `STREAM_SCHEMA_THRESHOLD` entirely.

This eliminates the `count()` pre-scan for specs above the threshold (saves one full document parse), removes ~90 lines of duplicate orchestration code, and ensures all specs benefit from the single-pass fan-out optimization regardless of size.

| Spec | Saving (remove count pre-scan) | Code reduction |
|------|:------------------------------:|:--------------:|
| petStore | **~5 ms** | ~90 lines removed |
| twitter | **~15 ms** | same |
| openai | **~40 ms** | same |

Time savings apply only to specs that currently trigger the streaming path (>100 schemas). For smaller specs, the benefit is architectural: one code path to maintain, consistent plugin execution order, and future optimizations only need to land once.

- **Effort:** Medium (6 phases, see [architecture/always-stream.md](architecture/always-stream.md))
- **Risk:** Low — phased rollout, each phase is independently shippable
- **Files:** `packages/ast/src/nodes/root.ts`, `packages/core/src/KubbDriver.ts`, `packages/core/src/createKubb.ts`, `packages/core/src/defineGenerator.ts`, `packages/core/src/defineResolver.ts`, `packages/adapter-oas/src/adapter.ts`

### 7. Incremental builds

**Current:** Every build is a full rebuild. Watch mode re-runs the entire pipeline even for a single schema change.

**Improvement:** Content-hash each input schema node. On rebuild, skip generation for schemas whose hash is unchanged and whose transitive dependencies are unchanged. Only re-run affected schemas and re-merge their files.

The architecture already has the right primitives: `FileNode` identity is path-based, schema nodes are named, and the AST is deterministic. The main complexity is dependency tracking (schema A imports schema B → changing B must also invalidate A).

| Spec | Cold build | Warm rebuild (1 schema changed) | Saving |
|------|:-----------:|:-------------------------------:|-------:|
| petStore | 97 ms | ~8 ms | **~89 ms** |
| twitter | 714 ms | ~25 ms | **~689 ms** |
| openai | 2 580 ms | ~60 ms | **~2 520 ms** |

Warm rebuild estimate assumes only 1–3 files need regeneration and their imports re-resolved. Dependency graph overhead is amortized after first build.

- **Effort:** Very high
- **Risk:** High — must correctly track all cross-schema and cross-plugin dependencies
- **Files:** `packages/core/src/createKubb.ts`, `packages/core/src/FileManager.ts`, new cache layer

---

## Summary

### Already done

| Change | petStore | twitter | openai |
|--------|:--------:|:-------:|:------:|
| jsxRendererSync (no React fiber) | −25 ms | −150 ms | −500 ms |
| Per-node plugin fan-out | −40 ms | −300 ms | −1 100 ms |
| parse() sync + FileProcessor plain generator | −5 ms | −30 ms | −100 ms |
| $ref resolution cache | — | — | −800+ ms |
| resolveOptions WeakMap cache | −3 ms | −15 ms | −50 ms |
| Printer caching (plugin-zod) | −5 ms | −30 ms | −100 ms |

### Remaining opportunities

| Change | Effort | petStore | twitter | openai | Risk |
|--------|--------|:--------:|:-------:|:------:|------|
| Parallel file writes | Low | −8 ms | −52 ms | −180 ms | Low |
| Streaming flush | Medium | −3 ms | −20 ms | −70 ms | Low |
| Extend printer caching (all plugins) | Low | −15 ms | −75 ms | −240 ms | Low |
| Unify to always-stream | Medium | −5 ms | −15 ms | −40 ms | Low |
| Schema-level parallelism | High | −20 ms | −200 ms | −850 ms | Medium |
| Worker threads for printing | High | −12 ms | −80 ms | −320 ms | Medium |
| Incremental builds (warm) | Very high | −89 ms | −689 ms | −2 520 ms | High |

Applying all remaining low/medium-effort changes (parallel writes + streaming flush + printer caching + always-stream) would bring the build to approximately:

| Spec | Current | After low-effort changes | After all changes |
|------|--------:|-------------------------:|------------------:|
| petStore | 97 ms | **~66 ms** | **~44 ms** |
| twitter | 714 ms | **~552 ms** | **~203 ms** |
| openai | 2 580 ms | **~2 050 ms** | **~580 ms** |
