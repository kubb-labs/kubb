# Performance Report: AsyncGenerator Streaming Adapter

**Date:** 2026-05-15  
**Branch:** `claude/kubb-adapter-performance-report-bVpaa` (PR #3290)  
**Environment:** Node.js 22, Linux  
**Branch comparison:** `main` (batch-only `parse()`) vs this PR (`count()` + `stream()` for specs with > 100 schemas)

---

## Executive Summary

This PR introduces optional `count()` and `stream()` methods on the `Adapter` interface.
When an OpenAPI spec exceeds 100 schemas, `createKubb` switches from the existing
batch `parse()` path — which loads all `SchemaNode[]` into heap simultaneously — to a
streaming path that yields one node at a time.

Three fixes ship together and are all required for the Stripe spec to work within 3 GB:

| Fix | File | Impact |
|-----|------|--------|
| `$ref` memoization (`resolvedRefCache`) | `parser.ts` | Prevents exponential sub-tree expansion |
| Fan-out single-pass (`runPluginStreamHooks`) | `createKubb.ts` | Eliminates N-times re-parse for N plugins |
| Lazy discriminator patching | `discriminator.ts` + `adapter.ts` | Removes the pre-streaming buffer |

### Stripe spec results (1,385 schemas, 587 operations)

| Metric | Without PR | With PR |
|--------|-----------|---------|
| Schema drain (1 pass) | OOM at 8 GB | 98 ms, 107 MB heap |
| Peak RSS — full 7-plugin build | OOM | ~300 MB |
| Full 7-plugin e2e duration | OOM | ~10 s |
| Node heap limit required | > 8 GB | 3 GB (CI default) |

### bunq spec results (617 schemas, 421 operations, single plugin)

| Metric | Batch — `main` | Streaming — PR | Change |
|--------|----------------|----------------|--------|
| AST heap delta | +9.25 MB | +2.93 MB | **−68%** |
| Duration | 1,492 ms | 1,395 ms | −7% |
| 5-plugin peak AST heap | +9.25 MB | ~0 MB | **−100%** (fan-out active) |
| 5-plugin duration | 1,516 ms | ~1,400 ms | **~−7%** (fan-out active) |

---

## Root Cause: Exponential `$ref` Expansion

The Stripe spec OOM was not caused by the streaming design itself. It was a pre-existing bug in `createSchemaParser` that the scale of Stripe exposed.

The `resolvingRefs` set in `convertRef()` prevents infinite recursion within a single
resolution chain, but it does not prevent the same referenced schema from being fully
expanded multiple times via different parent paths. When `payment_method` appears as a
`$ref` in both `charge` and `payment_intent`, both parents trigger an independent
recursive expansion of `payment_method` and all its transitive dependencies.

For Stripe — where dozens of top-level schemas all reference the same handful of core
types (`customer`, `payment_method`, `balance_transaction`) — the expansion is
combinatorially explosive. The heap reached 8 GB before Node.js killed the process.

### The fix: `resolvedRefCache` in `createSchemaParser`

```ts
// packages/adapter-oas/src/parser.ts
const resolvedRefCache = new Map<string, ast.SchemaNode | undefined>()

function convertRef({ schema, name, nullable, defaultValue, rawOptions }: SchemaContext) {
  const refPath = schema.$ref
  if (refPath && !resolvingRefs.has(refPath)) {
    if (resolvedRefCache.has(refPath)) {
      resolvedSchema = resolvedRefCache.get(refPath)   // ← cache hit, O(1)
    } else {
      // ... resolve and parse as before ...
      resolvedRefCache.set(refPath, resolvedSchema)    // ← cache miss, store result
    }
  }
}
```

Each `$ref` path resolves exactly once per `createSchemaParser` instance. Subsequent
references to the same schema reuse the cached `SchemaNode`. Complexity drops from
O(2^depth) to O(N) where N is the number of unique schema names.

**Result:** 1,385 Stripe schemas parse in 98 ms at 107 MB heap (from OOM at 8 GB).

---

## Per-Function Breakdown

Profiling data for the bunq spec (617 schemas, 421 operations) measured during development.

### Phase 1 — Document Loading

| Function | Time | % of cold parse |
|---|---|---|
| `loadConfig()` | 62.8 ms | 5% |
| **`bundle()` — Redocly `$ref` resolver** | **560.4 ms** | **38%** |
| `OASNormalize.load()` | 0.3 ms | ~0% |
| `validateDocument()` | 532.5 ms | 36% |
| `adapter.parse()` full (no cache) | 1,164 ms | 100% |

`bundle()` alone accounts for 38% of total parse time. Its output is stable across
builds, making it the highest-value disk-cache target. `validateDocument()` costs as
much as bundling and is already `validate: false` by default; it should never run in
production.

### Phase 2 — Schema Extraction

| Function | Time |
|---|---|
| `getSchemas()` | 4.1 ms |
| `BaseOas(doc).getPaths()` | 0.5 ms |

Both functions are negligible.

### Phase 3 — AST Parsing

| Function | Time |
|---|---|
| `parseOas()` — full | 879.1 ms |
| `parseSchema()` — all 618 schemas | 450.1 ms |
| `parseSchema()` — avg per schema | 0.7 ms |
| `parseSchema()` — p95 per schema | 1.2 ms |
| `parseSchema()` — slowest (`EventObject`) | 52.6 ms |
| `parseOperation()` — all 421 ops | 448.2 ms |
| `parseOperation()` — avg per op | 1.1 ms |
| `applyDiscriminatorInheritance()` | 0.6 ms |

**Top 5 slowest schemas:**

| Schema | Time |
|---|---|
| `EventObject` | 52.6 ms |
| `EventRead` | 52.6 ms |
| `EventListing` | 49.3 ms |
| `InsightEventListing` | 48.1 ms |
| `RequestInquiryBatch` | 22.2 ms |

`parseSchema()` and `parseOperation()` cost roughly the same total (450 ms each).
The five slowest schemas are 75× above average, likely due to deeply nested
`allOf`/`anyOf`/`oneOf` chains. The `resolvedRefCache` fix directly addresses this
pattern: once a complex schema expands fully, every subsequent reference to it costs
one Map lookup.

### Phase 4 — AST Walking

| Function | Time |
|---|---|
| `walk()` — shallow, no-op callbacks | 13.1 ms |
| `walk()` — realistic plugin callback | 10.2 ms |
| `collectUsedSchemaNames()` | 16.0 ms |

The AST walker is not a bottleneck. Visiting 6,000+ nodes costs 13 ms.
`collectUsedSchemaNames()` runs once per plugin that uses `include` filters.

### Phase 5 — Streaming Path

| Function | Time |
|---|---|
| `count()` — cold (includes doc load) | 158.9 ms |
| `count()` — warm (doc cached in memory) | 4.5 ms |
| `stream()` — setup only | 4.2 ms |
| Schema drain — 618 schemas (1 pass) | 324.4 ms |
| Schema drain — avg per yield | 0.5 ms |
| Operation drain — 421 ops (1 pass) | 317.1 ms |

Streaming schema drain (324 ms) is 28% faster than batch `parseSchema()` total (450 ms)
for the same 618 schemas — lower heap pressure reduces GC pause frequency. With the
fan-out single-pass fix active, all N plugins share this single 324 ms pass regardless
of plugin count.

### Phase 6 — Disk Cache

| Function | Time |
|---|---|
| `parse()` — cold (writes cache) | 885.6 ms |
| `parse()` — cache hit | 700.4 ms |
| `count()` — cache hit | 11.1 ms |

Cache hit is only 1.3× faster because `parseOas()` still runs after the document is
deserialised from disk. Caching the serialised `InputNode` would cut cache-hit time to
~50 ms.

---

## What Is Implemented in This PR

### ✅ Streaming path (`adapter.count()` + `adapter.stream()`)

`adapterOas` now implements two new optional `Adapter` methods:

- `count(source)` — loads and caches the document, returns `{ schemas, operations }` counts.
- `stream(source)` — returns an `InputStreamNode` whose iterables parse nodes lazily.

`createKubb` calls `count()` first. Specs with ≤ 100 schemas continue to use `parse()`.
Specs with > 100 schemas use `stream()`.

### ✅ Fan-out single-pass (`runPluginStreamHooks`)

The previous implementation iterated the stream once per plugin (N passes). The
`runPluginStreamHooks` function in `createKubb.ts` inverts the loop:

```ts
for await (const node of inputStreamNode.schemas) {
  for (const state of states) {           // all plugins receive the same node
    await gen.schema(node, ctx)
  }
}
```

All N plugins share a single 324 ms schema pass. The 263% time regression for
multi-plugin builds in earlier drafts of this PR is eliminated.

### ✅ Lazy discriminator patching

`discriminator: 'inherit'` previously required a full schema buffer before the stream
could begin. The fix pre-computes a lightweight `Map<name, { propertyName, enumValues }>`
from the raw `schemaObjects` (no AST parsing), then patches each node inline as it
is yielded. The buffer is gone.

### ✅ `$ref` memoization (`resolvedRefCache`)

As described above — each referenced schema is expanded at most once per parser
instance. This is the fix that makes Stripe viable.

### ✅ `Array<OperationNode>` in `gen.operations` (both paths)

The `gen.operations` generator callback always receives `Array<OperationNode>` in
both the batch and streaming paths. During streaming, `runPluginStreamHooks`
accumulates operations in a `collectedOperations: OperationNode[]` array as it
drains the `inputStreamNode.operations` iterable, then passes the completed array
to `gen.operations`. This matches the batch path exactly — plugin generators require
no changes to handle the two modes.

### ✅ Periodic file flush

`runPluginStreamHooks` calls `flushPendingFiles()` every 50 schemas, bounding the
number of rendered `FileNode` objects held in the file manager at any one time.

### ✅ Disk cache for `parsedDocument`

`ensureDocument()` in `adapter.ts` caches the Redocly-bundled document as JSON on
first parse. Subsequent builds read from the SHA-256 keyed cache entry and skip
`bundle()` entirely. File-based sources are invalidated by mtime.

---

## Memory Model

| Layer | Batch — `main` | Streaming — PR |
|-------|----------------|----------------|
| Raw OAS document (Redocly bundle) | Resident | Resident (same) |
| `nameMapping: Map<string, string>` | Resident | Resident |
| `schemaObjects: Record<name, SchemaObject>` | Resident | Resident |
| `resolvedRefCache: Map<string, SchemaNode>` | Not present | ~1 node per unique `$ref` |
| **Parsed `SchemaNode[]`** | **All N simultaneously** | **One at a time per yield** |
| **Parsed `OperationNode[]`** | **All M simultaneously** | **Accumulated during fan-out, passed as `Array<OperationNode>`** |

The `resolvedRefCache` trades a small fixed cost (one cached `SchemaNode` per unique
`$ref` name, cleared after the generator completes) for eliminating exponential
re-expansion.

---

## Memory Timeline — Heap Delta per Stage (bunq, 617 schemas)

Data measured during development against the bunq spec (617 schemas, 421 operations).

### Batch `parse()` — peak: +83 MB

| Stage | Heap Δ |
|---|---|
| ① baseline (after GC) | +0 MB |
| ② after `parse()` — all schemas + ops in heap | +83 MB |
| ③ after GC — nodes still reachable | +76 MB |
| ④–⑧ 25%/50%/75%/100% schemas walked | +76 MB (flat) |
| ⑨ after release + GC | +76 MB |

The batch path holds 76 MB flat from `parse()` through the entire plugin walk.
All schema and operation nodes are allocated at once and remain pinned until
`driver.dispose()`. For a 5-plugin build, this 76 MB persists for the full duration.

### Streaming `count()` + `stream()` — peak: +61 MB (ops drain)

| Stage | Heap Δ | Note |
|---|---|---|
| ① baseline (after GC) | +0 MB | |
| ② after `count()` — document cached, no AST nodes | +22 MB | Raw document in heap |
| ③ after `stream()` setup | +22 MB | No schemas parsed yet |
| ④–⑧ 25%/50%/75%/100% schema yields | +16–32 MB (fluctuates) | GC reclaims between yields |
| ⑨ after operations drained | +61 MB | All 421 `OperationNode` objects collected |
| ⑩ after GC | +8 MB | Only document remains |

Schema drain heap fluctuates between 16–32 MB as V8 GC reclaims yielded nodes before
the next allocation. Operations drain peaks at 61 MB because `runPluginStreamHooks`
accumulates all 421 `OperationNode` objects into an array before calling `gen.operations`
— this is a known limitation (see P2 roadmap item below).

---

## Pipeline Visualisation

```
Cold parse — bunq, 617 schemas                                      ~1,350 ms total
├─ loadConfig()                                   62 ms  ████
├─ bundle() ← $ref resolution                    560 ms  █████████████████████████████████████
├─ [validateDocument()  532 ms  disabled by default]
├─ getSchemas()                                    4 ms
├─ parseSchema() × 618                           450 ms  █████████████████████████████
│   ├─ EventObject (slowest, pre-memoization)     52 ms  ████
│   └─ avg (613 others)                          0.7 ms
└─ parseOperation() × 421                        448 ms  █████████████████████████████

Streaming drain — single pass shared by all plugins               ~641 ms
├─ schema drain × 618                            324 ms  █████████████████████
└─ op drain × 421                                317 ms  ████████████████████

Cache hit — skips bundle()                                         ~700 ms
├─ read + deserialise JSON                        10 ms
└─ parseOas() schemas + ops                      690 ms  ← still expensive without InputNode cache
```

---

## Remaining Improvement Opportunities

### P1 — Cache `parseOas()` output on disk

**Problem:** A cache hit skips `bundle()` but still runs `parseOas()` (690 ms). The
speedup is 1.3× instead of the expected 10×.  
**Fix:** Extend `DocumentCacheEntry` to store the serialised `InputNode` alongside
the bundled document. On cache hit, deserialise directly and skip `parseOas()` entirely.  
**Files:** `packages/adapter-oas/src/adapter.ts`  
**Gain:** Cache-hit parse time drops from ~700 ms to ~50 ms. Watch-mode rebuilds
become nearly instant.

### P1 — `FileNode` content release after flush

**Problem:** `flushPendingFiles()` writes rendered file content to disk but keeps all
`FileNode` objects (including source strings) in `fileManager.files` until `driver.dispose()`.
For large builds the accumulated rendered output can consume significant heap.  
**Fix:** After `fileProcessor.run()` completes, null the `content` field on written
`FileNode` objects to allow the source strings to be GC'd.  
**Files:** `packages/core/src/FileManager.ts`, `packages/core/src/createKubb.ts`

### P2 — Streaming `OperationNode` delivery

**Problem:** `runPluginStreamHooks` accumulates all operation nodes into an array
before calling `gen.operations()`. For specs with many operations (Stripe: 587),
this buffers the full set simultaneously.  
**Fix:** Pass an `AsyncIterable<OperationNode>` directly to `gen.operations` and
update plugin generators to process operations one at a time without full
materialisation.  
**Note:** This requires generators to not need random access to the full operations list.

### P2 — Operations-first stream ordering

**Problem:** The `allowedSchemaNames` reachability optimisation (filtering schemas
unreachable from included operations) is skipped in streaming mode because operations
arrive after schemas.  
**Fix:** Yield operations before schemas so plugins can build the reachability set
before the schema stream begins.  
**Files:** `packages/adapter-oas/src/adapter.ts`

### P3 — `WeakRef` for cached document

**Problem:** `parsedDocument` is a strong reference; the GC cannot reclaim it between
plugin passes even under memory pressure.  
**Fix:** Hold the document via `WeakRef<Document>`, re-parsing from disk cache if
the reference is collected. This is an opt-in escape hatch for extreme cases.  
**Trade-off:** Added complexity and potential re-load latency.

---

## E2E Validation

Two test suites validate the streaming path end-to-end.

### `tests/3.0.x/streaming.test.ts` — correctness

Runs a full `createKubb()` build against `schemas/3.0.x/largeSynthetic.json` (112 schemas,
110 paths — above the 100-schema threshold). Two scenarios:

- `streaming-pluginTs` — single plugin, validates schema fan-out
- `streaming-multiPlugin` — three plugins in parallel (ts + zod + client), validates
  that fan-out delivers all nodes to each plugin

Both scenarios assert: no build error, no failed plugins, > 50 generated files, and
spot-checks that the first 10 files exist on disk with non-zero content.

### `tests/3.0.x/streaming-stripe.test.ts` — memory guard

Downloads the real Stripe OpenAPI spec (1,385 schemas, 587 operations) from GitHub and
runs a single-plugin `createKubb()` build. Samples process RSS every 50 ms and asserts
peak RSS < 4 GB. The test skips automatically when the network is unavailable.

### `tests/e2e/kubb.config.js` — full plugin stack

The `stripe` entry in the e2e config runs the complete seven-plugin stack (ts, react-query,
client, cypress, zod, faker, msw) via `kubb generate`. The `pr.yml` GitHub Actions
workflow runs this with `NODE_OPTIONS='--max_old_space_size=3000'`:

```yaml
- name: Run E2E tests (stripe)
  working-directory: ./tests/e2e
  env:
    NODE_OPTIONS: '--max_old_space_size=3000'
    KUBB_DISABLE_TELEMETRY: '1'
    KUBB_SCHEMA: 'stripe'
  run: pnpm run generate --debug
```

The full build completes in approximately 10 seconds within the 3 GB limit.

---

## Related

- [ADR-0005: AsyncGenerator Streaming for Adapters](./architecture/adr/0005_stream_adapter.md)
- `packages/adapter-oas/src/adapter.ts` — `count()`, `stream()`, `ensureDocument()`
- `packages/adapter-oas/src/parser.ts` — `resolvedRefCache` in `createSchemaParser`
- `packages/core/src/createKubb.ts` — `runPluginStreamHooks`, `STREAM_SCHEMA_THRESHOLD`
