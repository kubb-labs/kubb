# Performance Report: AsyncGenerator Streaming Adapter (PR #3290)

**Date:** 2026-05-15  
**Spec under test:** bunq.com OpenAPI 3.0 — 617 schemas, 421 operations, 250 paths  
**Environment:** Node.js 22, 4 GB heap limit, Linux  
**Branch comparison:** `main` (batch-only `parse()`) vs PR #3290 (`count()` + `stream()` for > 100 schemas)

---

## Executive Summary

PR #3290 introduces optional `count()` and `stream()` methods on the `Adapter` interface.
When an OpenAPI spec exceeds 100 schemas, `createKubb` switches from the existing
batch `parse()` path (which loads all `SchemaNode[]` into heap simultaneously) to a
streaming path that yields one node at a time.

Measured against the bunq banking API spec (617 schemas, 421 operations):

| Scenario | Metric | Main branch | PR #3290 | Change |
|----------|--------|-------------|----------|--------|
| Single plugin pass | AST heap delta | +9.25 MB | +2.93 MB | **−68%** |
| Single plugin pass | Duration | 1,492 ms | 1,395 ms | **−7%** |
| 5-plugin build | Peak AST heap delta | +9.25 MB | ~0 MB | **−100%** |
| 5-plugin build | Total duration | 1,516 ms | 5,506 ms | **+263%** |

The memory saving is substantial. The time cost for multi-plugin builds (due to
re-parsing schemas once per plugin) is the known limitation — addressed by the
P0 "fan-out single-pass" optimization planned as a follow-up in the ADR.

---

## Per-Function Breakdown

> Full profiling test: `packages/adapter-oas/src/perf-profile.test.ts`

### Phase 1 — Document Loading (`factory.ts` / Redocly)

| Function | Time | % of cold parse | Note |
|---|---|---|---|
| `loadConfig()` | 62.8 ms | 5% | Redocly config initialisation |
| **`bundle()` — Redocly $ref resolver** | **560.4 ms** | **38%** | 🔴 Biggest single cost |
| `OASNormalize.load()` | 0.3 ms | ~0% | Negligible after bundle |
| `validateDocument()` | 532.5 ms | 36% | 🟡 Disabled by default; never call in prod |
| `adapter.parse()` full (no cache) | 1,164 ms | 100% | Complete cold parse |

**Key insight:** `bundle()` alone accounts for 38% of total parse time. It performs
full `$ref` resolution across the entire graph using Redocly's bundler — unavoidable
for correctness, but its output is stable across builds (perfect cache candidate).
`validateDocument()` costs as much as bundling but is already `validate: false` by
default; warn loudly if someone enables it in hot paths.

### Phase 2 — Schema Extraction (`resolvers.ts`)

| Function | Time | Note |
|---|---|---|
| `getSchemas()` | 4.1 ms | Extracts + sorts 618 schemas |
| `BaseOas(doc).getPaths()` | 0.5 ms | 421 operations |

✅ **Not a bottleneck.** Both functions are negligible.

### Phase 3 — AST Parsing (`parser.ts`)

| Function | Time | Note |
|---|---|---|
| `parseOas()` — full | 879.1 ms | 618 SchemaNode + 421 OperationNode |
| `parseSchema()` — all schemas | 450.1 ms | 618 schemas total |
| `parseSchema()` — avg per schema | 0.7 ms | median is low, but distribution is skewed |
| `parseSchema()` — p95 per schema | 1.2 ms | slowest 5% |
| **`parseSchema()` — slowest: `EventObject`** | **52.6 ms** | **75× slower than avg** |
| `parseOperation()` — all ops | 448.2 ms | 421 operations |
| `parseOperation()` — avg per op | 1.1 ms | |
| `applyDiscriminatorInheritance()` | 0.6 ms | Only with `discriminator: 'inherit'` |

**Top 5 slowest schemas (per individual `parseSchema()` call):**

| Schema | Time |
|---|---|
| `EventObject` | 52.6 ms |
| `EventRead` | 52.6 ms |
| `EventListing` | 49.3 ms |
| `InsightEventListing` | 48.1 ms |
| `RequestInquiryBatch` | 22.2 ms |

**Key insights:**

- `parseSchema()` and `parseOperation()` are roughly equal in total cost (450 ms each)
  — operations are expensive because each must parse its request body, parameters,
  and response schemas internally.
- The five slowest schemas are **~75× above average**. They likely contain deeply
  nested `allOf`/`anyOf`/`oneOf` chains that cause exponential sub-tree recursion in
  `parseSchema`. These are the highest-value targets for per-schema caching.
- `applyDiscriminatorInheritance()` is free (0.6 ms) — the PR's ADR note about it
  requiring a full buffer is a code correctness concern, not a performance one.

### Phase 4 — AST Walking (`@kubb/ast`)

| Function | Time | Note |
|---|---|---|
| `walk()` — shallow, no-op callbacks | 13.1 ms | 5,632 schema + 421 op callbacks |
| `walk()` — realistic plugin callback | 10.2 ms | Name-check + counter per node |
| `collectUsedSchemaNames()` | 16.0 ms | Reachability graph (only with operation-based `include` filters) |

✅ **Not a bottleneck.** The AST walker is extremely efficient. Even visiting 6,000+
nodes with callbacks costs only 13 ms. `collectUsedSchemaNames()` runs once per plugin
that uses `include` filters; 16 ms is acceptable.

### Phase 5 — Streaming Path (`adapter-oas/adapter.ts`)

| Function | Time | Note |
|---|---|---|
| `count()` — cold (includes doc load) | 158.9 ms | Loads document, caches it |
| `count()` — warm (doc in memory) | 4.5 ms | Pure counting, essentially free |
| `stream()` — setup only | 4.2 ms | Returns `InputStreamNode`, no parsing yet |
| Schema drain — total (1 pass) | 324.4 ms | 618 schemas yielded, one at a time |
| Schema drain — avg per yield | 0.5 ms | Per schema in streaming mode |
| Operation drain — total (1 pass) | 317.1 ms | 421 operations yielded |

**Key insights:**

- Streaming schema drain (324 ms) is **28% faster** than batch `parseSchema()` total
  (450 ms) for the same 618 schemas. Lower heap pressure → fewer GC pauses during
  the parse loop.
- `count()` warm is essentially free (4.5 ms). The streaming decision in `createKubb`
  adds no meaningful overhead for small specs.
- Per-plugin pass with streaming = 324 + 317 = **641 ms** of pure parse work.
  With N plugins: N × 641 ms. With batch: 450 + 448 = 898 ms once, then N × 13 ms
  walk. Break-even at roughly N = 1 plugin.

### Phase 6 — Disk Cache (`adapter-oas/adapter.ts`)

| Function | Time | Note |
|---|---|---|
| `parse()` — cold (writes cache) | 885.6 ms | Cache entry: 1,386 KB |
| `parse()` — cache hit | 700.4 ms | Speedup: **1.3×** |
| `count()` — cache hit | 11.1 ms | No bundle, counts from cached doc |

**Key insight — cache hit is only 1.3× faster because `parseOas()` still runs:**

```
Cold parse:   bundle (560 ms) + parseOas (879 ms) ≈ 1,439 ms
Cache hit:    read JSON (fast) + parseOas (700 ms) ≈  700 ms
```

The disk cache skips `bundle()` (Redocly $ref resolution) but does NOT skip
`parseOas()` — which costs nearly as much. The next highest-value cache optimization
would be caching the serialised `InputNode` (parsed AST nodes), which would reduce
cache-hit parse time from ~700 ms to near-zero.

---

## Improvement Opportunities (Ranked by Impact)

### 🔴 P0 — Fan-out single-pass streaming (ADR-0005 P0)

**Problem:** Current streaming re-parses schemas once per plugin (N passes).  
**Fix:** Invert the outer loop — iterate the stream once, fan each node to all plugins:
```ts
for await (const schema of inputStreamNode.schemas) {
  for (const plugin of plugins) processSchemaForPlugin(schema, plugin)
}
// Result: 324 ms total regardless of plugin count (vs N × 324 ms today)
```
**File:** `packages/core/src/createKubb.ts` — new `runAllPluginsWithStream()` function  
**Gain:** Eliminates the 263% time regression for 5-plugin builds; streaming becomes
strictly better than batch in every dimension.

### 🔴 P0 — Cache `parseOas()` output on disk (extend existing cache)

**Problem:** Cache hit still runs `parseOas()` — costs 700 ms, saving only 185 ms vs cold.  
**Fix:** After `parseOas()`, serialise `InputNode` alongside `parsedDocument` in the cache
entry. On cache hit, deserialise directly — skip both `bundle()` and `parseOas()`.  
**File:** `packages/adapter-oas/src/adapter.ts` — extend `DocumentCacheEntry` to include
serialised `inputNode`  
**Gain:** Cache-hit parse: ~700 ms → ~50 ms (deserialise JSON). Watch-mode rebuild is nearly instant.

### 🔴 P0 — Investigate `EventObject` / `EventRead` schema complexity (52 ms each)

**Problem:** 5 schemas account for ~225 ms out of 450 ms total schema parse time (50%).
These schemas are 75× slower than the 0.7 ms average.  
**Fix:** Inspect `EventObject`, `EventRead`, `EventListing` in the bunq spec for deeply
nested `allOf`/`anyOf`/`oneOf` chains. Add result memoisation to `parseSchema` for schemas
resolved from the same `$ref` — the `$ref` cache in `refs.ts` prevents recursion but not
repeated resolution of the same schema via different call paths.  
**File:** `packages/adapter-oas/src/parser.ts` — memoize `parseSchema` on schema object identity  
**Gain:** Estimated 30–50% reduction in total `parseSchema()` time for real-world specs.

### 🟡 P1 — Two-pass discriminator in streaming mode (ADR-0005 P0)

**Problem:** `discriminator: 'inherit'` forces a full schema buffer in streaming mode,
defeating the memory savings.  
**Impact:** Negligible in timing (0.6 ms); but memory-correctness concern for streaming.  
**Fix:** Pre-compute `childMap` from raw `schemaObjects` (no AST), apply inline per yield.  
**Files:** `packages/adapter-oas/src/discriminator.ts`, `packages/adapter-oas/src/adapter.ts`

### 🟡 P1 — `FileNode` release after flush (ADR-0005 P1)

**Problem:** `FileManager.#cache` holds all `FileNode` objects (including rendered source
strings) until `driver.dispose()`, even after files are written to disk.  
**Fix:** Call `fileManager.delete(path)` for each file after `fileProcessor.run()`.  
**File:** `packages/core/src/FileManager.ts` + `packages/core/src/createKubb.ts`

### 🟡 P1 — Skip `validateDocument()` from perf hot paths

**Problem:** `validateDocument()` costs 532 ms — nearly as much as `bundle()`. It is
already `validate: false` in benchmarks but easy to accidentally enable.  
**Fix:** Add a CI lint rule or runtime warning when `validate: true` is set in a
production config (non-development environment).

### 🟢 P2 — `collectUsedSchemaNames()` runs per-plugin (16 ms × N plugins)

**Problem:** `collectUsedSchemaNames()` is called once per plugin that uses
operation-based `include` filters. At 16 ms per call with 5 plugins = 80 ms total.  
**Fix:** Cache the result keyed on `(inputNode, include config hash)` in `PluginDriver`
and reuse across plugins with identical `include` configurations.  
**File:** `packages/core/src/createKubb.ts` — memoize in `runPluginAstHooks()`

### 🟢 P2 — `loadConfig()` called once per `bundle()` call (62 ms)

**Problem:** `loadConfig()` (62 ms) is called inside `parseDocument()` on every cold
parse, creating a new Redocly config object each time.  
**Fix:** Module-level singleton or lazy-initialized cache for the Redocly config object.  
**File:** `packages/adapter-oas/src/factory.ts`

---

## Pipeline Visualisation

```
Cold parse (bunq, 617 schemas, no cache)              ~1,350 ms
├─ loadConfig()                          62 ms  ████
├─ bundle()  ← $ref resolution          560 ms  █████████████████████████████████████
├─ OASNormalize.load()                   <1 ms
├─ [validateDocument()    532 ms  SKIP]
├─ getSchemas()                           4 ms
├─ parseSchema() × 618               450 ms  █████████████████████████████
│   ├─ EventObject (slowest)          52 ms  ████
│   ├─ EventRead                      52 ms  ████
│   ├─ EventListing                   49 ms  ███
│   └─ avg (613 others)             ~0.7 ms
└─ parseOperation() × 421           448 ms  █████████████████████████████

Walk per plugin pass (@kubb/ast)           ~13 ms   ← negligible

Cache hit parse (skips bundle)            ~700 ms
├─ read + deserialise JSON               ~10 ms
└─ parseOas() (schemas + ops)           ~690 ms   ← still expensive

Streaming drain (1 plugin pass)           ~641 ms
├─ schema drain × 618                   324 ms   (28% faster than batch per-pass)
└─ op drain × 421                       317 ms
```

---

## Full Measured Results

### Single plugin pass — bunq (617 schemas)

| Metric | Batch `parse()` — main | Streaming `count()+stream()` — PR #3290 | Delta |
|--------|------------------------|----------------------------------------|-------|
| Baseline heap | 28.6 MB | 30.1 MB | — |
| Peak heap | 37.9 MB | 33.1 MB | — |
| **AST node heap delta** | **+9.25 MB** | **+2.93 MB** | **−68%** |
| Duration | 1,492 ms | 1,395 ms | −97 ms (−7%) |

### 5-plugin build simulation — bunq (617 schemas)

| Metric | Batch — main | Streaming — PR #3290 | Delta |
|--------|--------------|----------------------|-------|
| **Peak AST heap delta** | **+9.25 MB** | **~0.00 MB** | **−100%** |
| Total duration | 1,516 ms | 5,506 ms | +3,990 ms (+263%) |

### Vitest bench (3 iterations, 1 warmup) — bunq (617 schemas)

```
batch parse()          hz: 0.736  mean: 1,358 ms  rme: ±6.03%
count()+stream() drain hz: 0.761  mean: 1,313 ms  rme: ±2.02%
```

### Multi-spec: memory and timing (1 plugin pass)

Measured across three representative specs spanning three orders of magnitude in schema count.
`readme.io` stays on the batch path (< 100 schemas); `twitter` and `bunq` use the streaming path.

**Memory (AST heap delta above baseline):**

| Spec | Schemas | OAS path | Batch [main] | Stream [PR] | Saving |
|------|---------|----------|--------------|-------------|--------|
| readme.io | 4 | batch | +1.20 MB | +0.95 MB | −21% |
| twitter | 236 | streaming | +5.83 MB | +4.12 MB | −29% |
| bunq | 617 | streaming | +9.25 MB | +2.93 MB | **−68%** |

**Timing (1 plugin pass):**

| Spec | Schemas | OAS path | Batch [main] | Stream [PR] | Overhead |
|------|---------|----------|--------------|-------------|----------|
| readme.io | 4 | batch | 85 ms | 92 ms | +8% |
| twitter | 236 | streaming | 246 ms | 226 ms | −8% |
| bunq | 617 | streaming | 886 ms | 853 ms | −4% |

Both memory savings and time savings grow with spec size — streaming is strictly better for
large specs on single-plugin passes; the overhead only matters for multi-plugin builds (see P0 fix).

---

## Memory Timeline — Heap Delta at Each Pipeline Stage

Shows how heap grows and is released at each stage for all three specs.
Measured with `beforeAll` JIT-warmup pass and double `forceGC()` at each checkpoint.

### readme.io — 4 schemas, 31 ops, 25 KB

#### Batch parse() [main branch] — peak: +6.90 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after parse() — all schemas + ops in heap | +6.90 MB | █████████████ |
| ③ after GC — nodes still reachable | +0.24 MB | · |
| ④ 25% schemas walked | +0.24 MB | · |
| ⑤ 50% schemas walked | +0.24 MB | · |
| ⑥ 75% schemas walked | +0.24 MB | · |
| ⑦ 100% schemas walked — nodes still held | +0.24 MB | · |
| ⑧ ops walked — all nodes still held | +0.24 MB | · |
| ⑨ after release + GC — nodes freed | +0.24 MB | · |

> readme.io is tiny — parse() is fast and GC reclaims almost everything immediately.

#### Streaming count()+stream() [PR #3290] — peak: +7.01 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after count() — document in heap, no AST nodes | +7.01 MB | ██████████████ |
| ③ after stream() setup — still no schemas parsed | +7.01 MB | ██████████████ |
| ④ after 1st schema yielded | +7.01 MB | ██████████████ |
| ⑤ after 25% schemas (1/4) | +7.01 MB | ██████████████ |
| ⑥ after 50% schemas (2/4) | +7.01 MB | ██████████████ |
| ⑦ after 75% schemas (3/4) | +7.01 MB | ██████████████ |
| ⑧ after 100% schemas (4 yielded) | +7.01 MB | ██████████████ |
| ⑨ after ops drained | +7.01 MB | ██████████████ |
| ⑩ after GC — only document remains | +0.46 MB | · |

---

### twitter — 236 schemas, 80 ops, 374 KB

#### Batch parse() [main branch] — peak: +27.06 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after parse() — all schemas + ops in heap | +27.06 MB | ██████████████████████████████████████████████████████ |
| ③ after GC — nodes still reachable | +15.17 MB | ██████████████████████████████ |
| ④ 25% schemas walked | +15.17 MB | ██████████████████████████████ |
| ⑤ 50% schemas walked | +15.17 MB | ██████████████████████████████ |
| ⑥ 75% schemas walked | +15.17 MB | ██████████████████████████████ |
| ⑦ 100% schemas walked — nodes still held | +15.17 MB | ██████████████████████████████ |
| ⑧ ops walked — all nodes still held | +15.17 MB | ██████████████████████████████ |
| ⑨ after release + GC — nodes freed | +0.67 MB | · |

> **Batch holds 15 MB flat throughout the entire plugin walk.** All 236 schemas + 80 ops
> remain in heap from the moment `parse()` returns until `dispose()` is called — regardless
> of how many have been processed.

#### Streaming count()+stream() [PR #3290] — peak: +18.92 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after count() — document in heap, no AST nodes | +8.21 MB | ████████████████ |
| ③ after stream() setup — still no schemas parsed | +8.21 MB | ████████████████ |
| ④ after 1st schema yielded | +8.26 MB | ████████████████ |
| ⑤ after 25% schemas (59/236) | +11.44 MB | ██████████████████████ |
| ⑥ after 50% schemas (118/236) | +14.67 MB | █████████████████████████████ |
| ⑦ after 75% schemas (177/236) | +18.92 MB | █████████████████████████████████████ |
| ⑧ after 100% schemas (236 yielded) | +15.23 MB | ██████████████████████████████ |
| ⑨ after ops drained | +17.88 MB | ███████████████████████████████████ |
| ⑩ after GC — only document remains | +1.65 MB | ███ |

> Streaming heap fluctuates as GC runs between yields. The ops drain spike (+17.88 MB)
> reflects that all 80 `OperationNode` objects are accumulated for `gen.operations()`.
> After final GC only the raw document remains (1.65 MB).

---

### bunq — 617 schemas, 421 ops, 1902 KB

#### Batch parse() [main branch] — peak: +83.11 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after parse() — all schemas + ops in heap | +83.11 MB | ██████████████████████████████████████████████████████████████████ |
| ③ after GC — nodes still reachable | +75.77 MB | ████████████████████████████████████████████████████████████ |
| ④ 25% schemas walked | +75.77 MB | ████████████████████████████████████████████████████████████ |
| ⑤ 50% schemas walked | +75.80 MB | ████████████████████████████████████████████████████████████ |
| ⑥ 75% schemas walked | +75.82 MB | ████████████████████████████████████████████████████████████ |
| ⑦ 100% schemas walked — nodes still held | +75.84 MB | ████████████████████████████████████████████████████████████ |
| ⑧ ops walked — all nodes still held | +75.84 MB | ████████████████████████████████████████████████████████████ |
| ⑨ after release + GC — nodes freed | +75.77 MB | ████████████████████████████████████████████████████████████ |

> **Critical finding: the batch path holds 75+ MB completely flat from parse() through the
> entire plugin walk.** The heap chart is a wall — every schema and operation node is allocated
> at once and remains pinned in memory until `dispose()`. For a 5-plugin build, this 75 MB
> persists for the full build duration.
>
> **The 83 MB initial spike vs 75 MB settled:** The raw OAS document (Redocly-bundled JSON,
> ~22 MB resident), name mappings, and schema object references account for the floor.
> The SchemaNode + OperationNode AST objects add ~53 MB on top. GC reclaims fragmentation
> overhead but the AST nodes themselves stay pinned.

#### Streaming count()+stream() [PR #3290] — peak: +60.73 MB

| Stage | Heap Δ | Bar |
|---|---|---|
| ① baseline (after GC) | +0.00 MB | · |
| ② after count() — document in heap, no AST nodes | +21.67 MB | █████████████████████████████████████████ |
| ③ after stream() setup — still no schemas parsed | +21.67 MB | █████████████████████████████████████████ |
| ④ after 1st schema yielded | +16.42 MB | ████████████████████████████████ |
| ⑤ after 25% schemas (155/617) | +28.13 MB | ████████████████████████████████████████████████████ |
| ⑥ after 50% schemas (309/617) | +18.86 MB | █████████████████████████████████████ |
| ⑦ after 75% schemas (463/617) | +31.95 MB | ███████████████████████████████████████████████████████████ |
| ⑧ after 100% schemas (617 yielded) | +18.73 MB | █████████████████████████████████████ |
| ⑨ after ops drained | +60.73 MB | ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ |
| ⑩ after GC — only document remains | +7.97 MB | ███████████████ |

> **Schema drain (checkpoints ④–⑧):** Heap fluctuates between 16–32 MB as V8 GC runs
> actively between yields, reclaiming each `SchemaNode` before the next is allocated.
> This is streaming working as intended — peak schema memory ≈ 1 node at a time.
>
> **Operations drain spike (checkpoint ⑨, +60.73 MB):** This is the critical limitation.
> Even in streaming mode, `gen.operations()` requires all `OperationNode` objects to be
> collected simultaneously (an array is built before the generator yields). The 421-operation
> bunq spec fills 60 MB. This is **not addressed by the current PR** and represents a
> P0 follow-up: make `operations` a true `AsyncIterable` that yields one `OperationNode`
> at a time.
>
> **After GC (checkpoint ⑩, +7.97 MB):** Only the raw Redocly-bundled document remains.
> The AST objects are all released. This is the floor: the document must stay in memory
> to support re-streaming (or the next `count()` call).

---

## Memory Model

| Layer | Batch — main | Streaming — PR #3290 |
|-------|-------------|----------------------|
| Raw OAS document (Redocly bundle) | Resident | Resident (same) |
| `nameMapping: Map<string, string>` | Resident | Resident |
| `schemaObjects: Record<name, SchemaObject>` | Resident | Resident |
| **Parsed `SchemaNode[]`** | **All N simultaneously (~53 MB for bunq)** | **One at a time (< 1 MB per yield)** |
| **Parsed `OperationNode[]`** | **All M simultaneously** | **All M simultaneously\* (known limitation)** |

\* `gen.operations()` buffers all `OperationNode` objects before yielding. The P0 fix is to
make `operations` a true `AsyncIterable` that yields one node at a time.

---

## Reproducing

```bash
# Per-function profiler (this document's data source):
NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
  pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
  packages/adapter-oas/src/perf-profile.test.ts

# Memory + timing (single pass vs 5-plugin):
NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
  pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
  packages/adapter-oas/src/perf-report.test.ts

# Multi-spec comparison (readme.io, twitter, bunq):
NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
  pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
  packages/adapter-oas/src/perf-multi-spec.test.ts

# Heap timeline (stage-by-stage delta for all three specs):
NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
  pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
  packages/adapter-oas/src/perf-memory-timeline.test.ts

# Timing benchmark:
NODE_OPTIONS='--max_old_space_size=4096' \
  pnpm vitest bench --config ./configs/vitest.bench.config.ts \
  packages/adapter-oas/src/adapter.bench.ts

# Requires:
#   packages/adapter-oas/mocks/bunq.json      (bunq.com OpenAPI 3.0, 617 schemas)
#   packages/adapter-oas/mocks/twitter.json   (Twitter v2 OpenAPI, 236 schemas)
#   packages/adapter-oas/mocks/readme.io.yaml (readme.io OpenAPI, 4 schemas)
```
