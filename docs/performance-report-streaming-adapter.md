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

### Single plugin pass

| Metric | Batch `parse()` — main | Streaming `count()+stream()` — PR #3290 | Delta |
|--------|------------------------|----------------------------------------|-------|
| Baseline heap | 28.6 MB | 30.1 MB | — |
| Peak heap | 37.9 MB | 33.1 MB | — |
| **AST node heap delta** | **+9.25 MB** | **+2.93 MB** | **−68%** |
| Duration | 1,492 ms | 1,395 ms | −97 ms (−7%) |

### 5-plugin build simulation

| Metric | Batch — main | Streaming — PR #3290 | Delta |
|--------|--------------|----------------------|-------|
| **Peak AST heap delta** | **+9.25 MB** | **~0.00 MB** | **−100%** |
| Total duration | 1,516 ms | 5,506 ms | +3,990 ms (+263%) |

### Vitest bench (3 iterations, 1 warmup)

```
batch parse()          hz: 0.736  mean: 1,358 ms  rme: ±6.03%
count()+stream() drain hz: 0.761  mean: 1,313 ms  rme: ±2.02%
```

---

## Memory Model

| Layer | Batch — main | Streaming — PR #3290 |
|-------|-------------|----------------------|
| Raw OAS document (Redocly bundle) | Resident | Resident (same) |
| `nameMapping: Map<string, string>` | Resident | Resident |
| `schemaObjects: Record<name, SchemaObject>` | Resident | Resident |
| **Parsed `SchemaNode[]`** | **All N simultaneously** | **One at a time** |
| **Parsed `OperationNode[]`** | **All M simultaneously** | **One at a time\*** |

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

# Timing benchmark:
NODE_OPTIONS='--max_old_space_size=4096' \
  pnpm vitest bench --config ./configs/vitest.bench.config.ts \
  packages/adapter-oas/src/adapter.bench.ts

# Requires: packages/adapter-oas/mocks/bunq.json (bunq.com OpenAPI 3.0, 617 schemas)
```
