# Performance Analysis & Roadmap

This document captures what has already been done to optimize the build pipeline, what was investigated but found not applicable, and what concrete opportunities remain.

## Current Architecture

```
Parse OpenAPI spec
  ↓ stream schemas/operations (one at a time)
  ↓ Promise.all → all plugins process same node concurrently
      ↓ within each plugin: generators run sequentially
          ↓ jsxRendererSync → FileNode (sync, no fiber)
          ↓ FileManager.upsert() (in-memory merge)
  ↓ [repeat for every schema/operation node]
flushPendingFiles()
  ↓ for each file: FileProcessor.stream → TypeScript printer
  ↓ await storage.setItem(path, source)
  ↓ [repeat for every output file]
```

## What Has Already Been Done

### JSX sync renderer (`jsxRendererSync`)

The React fiber reconciler (`Runtime.tsx`) was replaced with a single-pass recursive tree walk (`SyncRuntime.tsx`) that produces `FileNode` objects directly with no intermediate virtual DOM. All plugins use `jsxRendererSync`. The fiber-based `jsxRenderer` is still exported for backward compatibility.

- **Gain:** Eliminates 20–25 ms of React scheduler overhead per generator call.
- **Files:** `packages/renderer-jsx/src/SyncRuntime.tsx`, `packages/renderer-jsx/src/createRenderer.tsx`

### `walkFiles` true streaming

`SyncRuntime.stream()` now yields each `FileNode` immediately as it is encountered in the element tree, rather than accumulating all nodes into a buffer first. `PluginDriver` drives rendering via `for...of` over `renderer.stream()`, so this makes the pipeline genuinely lazy.

- **Gain:** Correctness (second component is not evaluated before first file is consumed). Marginal memory reduction for generators returning multiple files.
- **Files:** `packages/renderer-jsx/src/SyncRuntime.tsx`

### Per-node plugin fan-out

All plugins process the same schema/operation node concurrently via `Promise.all`, and the adapter streams the spec once and distributes to all plugins in a single pass — eliminating N×parse-time overhead for multi-plugin builds.

- **Files:** `packages/core/src/createKubb.ts`

### `parse()` synchronous, `FileProcessor.stream` plain generator

`@kubb/parser-ts` `parse()` returns `string` directly (no async). `FileProcessor.stream` is a plain `Generator<FileNode>` (no microtask per file).

### `$ref` resolution cache

`$ref` lookups inside `parse()` are cached per parse call. For the Stripe spec (1,400 schemas) this dropped memory from OOM at 8 GB to 840 ms / 15 MB.

- **Files:** `packages/adapter-oas/`

### `resolveOptions` WeakMap cache

Per-node options resolution is cached via a two-level `WeakMap<options, WeakMap<node, result>>`. When no `include`/`exclude`/`override` filters exist (`optionsAreStatic`), the per-node call is skipped entirely.

- **Files:** `packages/core/src/defineResolver.ts`

### Printer caching in plugin-zod

`zodGenerator` caches printer instances per `resolver` reference using `WeakMap`. Printer construction is skipped on subsequent schema calls within the same build.

- **Files:** `plugins/packages/plugin-zod/src/generators/zodGenerator.tsx`

---

## What Was Investigated But Does Not Apply

### Phase 5: Memoize component generators via WeakMap on plugin config

**Proposal:** Cache the generator object returned by `defineGenerator` keyed on the user-supplied config object.

**Finding:** Not applicable. Generator objects (`zodGenerator`, `typeGenerator`, etc.) are module-level constants defined once at import time — they are not recreated per build or per call. Caching them is a no-op. The expensive work is inside the generator function body (printer construction, AST traversal), and the meaningful caching there already exists (see printer caching above).

### Lazy evaluation wrappers and tree memoization (Phases 4–5 from JSX proposal)

**Proposal:** Wrap expensive component subtrees in a `lazy(() => ...)` helper; cache component generators by config.

**Finding:** Since `jsxRendererSync` calls function components synchronously and in-order, lazy wrappers add allocation overhead without benefit — there is no scheduler to defer work to. Conditional early returns (`if (!condition) return null`) already skip subtrees at zero cost. No implementation needed.

---

## Remaining Opportunities

### 1. Parallel file writes

**Current:** `flushPendingFiles()` writes files sequentially — each `await storage.setItem()` blocks the next write.

```ts
// createKubb.ts — current
for (const { file, source } of stream) {
  await storage.setItem(file.path, source)  // sequential
}
```

**Improvement:** A bounded `Promise.all` pool (8–16 concurrent writes) cuts the write phase by 60–80% on typical SSDs. `STREAM_FLUSH_EVERY = 50` is already defined as a constant in `constants.ts` but unused — this is where it belongs.

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

- **Effort:** Low
- **Risk:** Low — writes are independent
- **Impact:** High on any spec producing 100+ files

### 2. Streaming flush during generation

**Current:** All `FileNode` objects accumulate in `FileManager` until generation is complete, then flush in one batch. For a 1,000-schema spec generating 2,000 files, peak memory is proportional to total output.

**Improvement:** Flush completed files every N operations during the generation loop rather than at the end. This overlaps I/O with generation and reduces peak memory. Uses the same `STREAM_FLUSH_EVERY` constant.

- **Effort:** Medium (requires coordinating flush points with the streaming loop)
- **Risk:** Low
- **Impact:** Medium — memory reduction + lower time-to-first-file-on-disk

### 3. Schema-level parallelism

**Current:** Schemas are processed one at a time through the streaming loop, even though plugins already fan out in parallel per node.

**Improvement:** Process batches of N schema nodes concurrently. The blocker is import resolution: schema A's imports may reference schema B's resolved path. A two-pass approach solves this — resolve all schema file paths first (fast, synchronous), then parallelize code generation.

- **Effort:** High
- **Risk:** Medium — ordering guarantees must be preserved
- **Impact:** Medium on large specs

### 4. Worker threads for CPU-bound printing

The TypeScript printer (`parser-ts`) and Zod schema printer are pure CPU work with no shared mutable state. They take a `FileNode` and return a `string`. Offloading to a `worker_threads` pool would parallelize printing across cores.

Structural requirement: printer inputs must be serializable (no functions, no class instances). Kubb's `FileNode` and `CodeNode` types are plain objects, so this is feasible. The overhead of worker serialization likely erases gains for small files — this matters most for large generated files (complex Zod schemas, large operation clients).

- **Effort:** High
- **Risk:** Medium
- **Impact:** Medium on multi-core machines with large per-file output

### 5. Incremental builds

**Current:** Every build is a full rebuild. Watch mode re-runs the entire pipeline even for a single schema change.

**Improvement:** Content-hash each input schema node. On rebuild, skip generation for schemas whose hash is unchanged and whose transitive dependencies are unchanged. Only re-run affected schemas and re-merge their files.

This is the single largest potential win for watch mode: a warm rebuild on a 2,000-file spec could drop from ~1 s to ~10–50 ms for typical single-schema changes.

The architecture already has the right primitives: `FileNode` identity is path-based, schema nodes are named, and the AST is deterministic. The main complexity is dependency tracking (schema A imports schema B → changing B must also invalidate A).

- **Effort:** Very high
- **Risk:** High — must correctly track all cross-schema dependencies
- **Impact:** Highest — transforms watch mode from "full rebuild" to "partial rebuild"

### 6. Extend printer caching to other plugins

`plugin-zod` already caches its printer via `WeakMap<resolver, printer>`. The same pattern should be applied to `plugin-ts`, `plugin-client`, `plugin-react-query`, and other plugins that construct printer objects inside their generators.

- **Effort:** Low per plugin
- **Risk:** Low
- **Impact:** Small per plugin, cumulative across all plugins

---

## Priority Order

| Change | Effort | Impact | Risk |
|--------|--------|--------|------|
| Parallel file writes | Low | High | Low |
| Streaming flush | Medium | Medium | Low |
| Extend printer caching to all plugins | Low | Small–medium | Low |
| Schema-level parallelism | High | Medium | Medium |
| Worker threads for printing | High | Medium | Medium |
| Incremental builds | Very high | Highest | High |
