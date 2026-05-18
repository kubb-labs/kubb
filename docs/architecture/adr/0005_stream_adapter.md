# ADR-0005: AsyncGenerator Streaming for Adapters

| Status   | Authors | Reviewers | Issue | Decision date |
| -------- | ------- | --------- | ----- | ------------- |
| Proposed |         |           |       | 2026-05-14    |

## Context

Kubb's adapter `parse()` method materialises the entire `InputNode` — all
`SchemaNode[]` and `OperationNode[]` — before any plugin runs. For large OpenAPI
specifications (hundreds of schemas and operations) these parsed AST objects occupy
significant heap for the full lifetime of the build, even though each node is only
needed briefly while plugins process it.

The underlying OAS document (with `$ref`s resolved via Redocly bundle) must remain
fully in memory because reference resolution is graph-wide. The savings opportunity
is specifically in the **parsed Kubb AST nodes** created by `parseSchema()` and
`parseOperation()` — rich JS objects that currently stay alive from parse time until
the entire build finishes.

### What actually reduces in memory

| Layer | Streaming impact |
|---|---|
| Raw OAS document (Redocly bundle) | **Unchanged — must stay for lazy re-parsing** |
| `nameMapping: Map<string,string>` | Unchanged (needed for import resolution) |
| `schemaObjects: Record<name, SchemaObject>` | Unchanged (refs into document, not copies) |
| **Parsed `SchemaNode` objects** | **One at a time instead of all N simultaneously** |
| **Parsed `OperationNode` objects** | **One at a time; collected only for `gen.operations()`** |

For a 500-schema spec with 5 plugins: batch holds ~2.5 MB of schema AST nodes throughout
the full build; streaming holds ~5 KB at a time.

## Decision

A new `InputStreamNode` type replaces `InputNode` for large specs. Its `schemas` and
`operations` fields are `AsyncIterable<SchemaNode>` and `AsyncIterable<OperationNode>`
rather than arrays. Each `for await` loop receives a fresh iterator from
`[Symbol.asyncIterator]()`, created from the already-loaded in-memory document.

```ts
type InputStreamNode = {
  kind: 'Input'
  schemas: AsyncIterable<SchemaNode>
  operations: AsyncIterable<OperationNode>
  meta?: InputMeta
}
```

The `Adapter` interface gains two optional methods:

```ts
// Lightweight pre-check — loads and caches the document without parsing AST nodes.
count?: (source: AdapterSource) => Promise<{ schemas: number; operations: number }>

// Returns an InputStreamNode whose iterables parse nodes lazily from the cached document.
stream?: (source: AdapterSource) => Promise<InputStreamNode>
```

The core (`createKubb.ts`) uses `adapter.count()` to decide:
- **≤ 100 schemas** → `adapter.parse()` → `InputNode` (existing batch path)
- **> 100 schemas** → `adapter.stream()` → `InputStreamNode` (new streaming path)

Plugins are unchanged — they still receive individual `SchemaNode` and `OperationNode`
objects via the same `gen.schema`, `gen.operation`, `gen.operations` callbacks.

`adapterOas` in `packages/adapter-oas/src/adapter.ts` implements both methods.

### Stream contract invariants

- `meta` is available on `InputStreamNode.meta` immediately (set before first yield).
- `adapter.document` and `adapter.options.nameMapping` are set before the first node.
- All `schema` iterations precede all `operation` iterations by default.
- Each `[Symbol.asyncIterator]()` call creates a **fresh** generator — multiple consumers
  (plugins) iterate independently without shared mutable state.

## Rationale

- Schema nodes are GC-eligible after all plugins process them, not after the full build.
- Additive and opt-in: adapters without `stream` use the existing batch path unchanged.
- No plugin API changes required.
- The `AsyncIterable` contract is reusable by any future adapter (AsyncAPI, GraphQL, etc.).

## Consequences

### Positive

- Lower peak heap for large OAS specs (proportional to schema count × AST node size).
- Opens the door for watch-mode incremental streaming.
- No plugin API surface changes.

### Negative

- Raw OAS document still resident — only parsed AST node memory is reduced.
- `ctx.inputNode.schemas` is `[]` in streaming mode (synthetic node); generators that
  inspect this array at runtime see an empty list.

## Memory reduction roadmap

The following additional strategies have been researched and prioritised for follow-up
implementation. They address the remaining limitations of the base streaming approach.

### P0 — Fan-out single-pass

**Problem:** The current per-plugin outer loop re-parses schemas once per plugin (N times).
**Fix:** Invert the loop — iterate the stream once and fan each node out to all plugins:

```
for await (const schema of inputStreamNode.schemas) {
  for (const plugin of plugins) { processSchemaForPlugin(schema, plugin) }
}
// Peak: 1 SchemaNode in memory, parsed once total
```

**Files:** `packages/core/src/createKubb.ts` — new `runAllPluginsWithStream()` function.

---

### P0 — Two-pass discriminator (`discriminator: 'inherit'`)

**Problem:** `applyDiscriminatorInheritance()` requires all schemas at once, forcing a full
buffer in streaming mode.
**Fix:** Split into two steps using raw OAS objects (no AST parsing):
1. Walk `schemaObjects` to build `childMap: Map<name, { propertyName, enumValues[] }>` (small).
2. Yield schemas lazily; apply the `childMap` patch inline per schema.

**Files:**
- `packages/adapter-oas/src/discriminator.ts` — add `buildDiscriminatorChildMap(document)`
- `packages/adapter-oas/src/adapter.ts` — use inline patch in the lazy schema generator

---

### P1 — FileNode release after flushing

**Problem:** `flushPendingFiles()` writes files to storage but keeps all `FileNode` objects
(including rendered source strings) in `FileManager.#cache` until `driver.dispose()`.
**Fix:** After `fileProcessor.run()` completes, call `fileManager.delete(path)` for each
written file to release source strings from heap.

**Files:**
- `packages/core/src/FileManager.ts` — add `delete(path: string)` method
- `packages/core/src/createKubb.ts` — call after each `flushPendingFiles()` run

---

### P1 — `_refCache` cleanup after streaming

**Problem:** `refs.ts` holds a `WeakMap<Document, Map<string, unknown>>` that caches all
resolved `$ref` pointers. It grows during parsing and stays resident as long as the document
is held in the adapter closure.
**Fix:** Expose `clearRefCache(document)` and call it in a `finally` block at the end of
each schema generator pass — no more `$ref` lookups are needed once streaming completes.

**Files:**
- `packages/adapter-oas/src/refs.ts` — export `clearRefCache(document: Document)`
- `packages/adapter-oas/src/adapter.ts` — call in `finally` of schema generator

---

### P2 — Operations-first stream ordering

**Problem:** `allowedSchemaNames` reachability optimisation is skipped because operations
arrive after schemas in the stream.
**Fix:** Yield operations before schemas so plugins can build `allowedSchemaNames` before
the schema stream begins. Stream order: `meta → operations → schemas`.

**Files:** `packages/adapter-oas/src/adapter.ts` — reorder yields in the generator.

---

### P2 — Hook listener cleanup

**Problem:** `PluginDriver.#hookListeners` accumulates handler closures that capture large
objects (`config`, `storage`, plugin state) until `driver.dispose()`.
**Fix:** Call `hooks.removeAllListeners()` in `safeBuild()` after `kubb:build:end` fires,
before returning `BuildOutput`, to release closure-captured references early.

**Files:** `packages/core/src/createKubb.ts`

---

### P3 — `WeakRef` for cached document (advanced)

**Problem:** `parsedDocument` is a strong reference — the GC cannot reclaim it between
plugin passes even under memory pressure. A 10 MB YAML spec expands to 50–200 MB in memory.
**Fix:** Hold `parsedDocument` via `WeakRef<Document>`. Deref before each generator pass;
re-parse from source if the ref has been collected.

**Trade-off:** Added complexity and potential re-loading latency. Opt-in for extreme cases.

**Files:** `packages/adapter-oas/src/adapter.ts`

---

## Disk cache for cross-build memory savings

Streaming reduces **per-build** peak memory by holding one AST node at a time. Caching to disk reduces **cross-build** redundancy — the most expensive step (Redocly `bundle()` + `$ref` resolution) runs once and is reused on subsequent builds.

### What is worth caching

| Artifact | Serialisable | Rebuild cost | Cache verdict |
|---|---|---|---|
| `parsedDocument` (bundled OAS doc) | Yes — plain JSON | High (Redocly bundle, network/disk I/O, full `$ref` resolution) | **Cache (P1)** |
| `nameMapping: Map<string,string>` | Yes — trivial `Object.fromEntries` | Low (linear scan of schema keys) | Cache alongside document |
| `inputNode` (parsed SchemaNode/OperationNode arrays) | Yes — fully JSON-serialisable plain objects | Medium (depends on schema count) | **Cache (P2)** — only when streaming is not active |
| `FileManager.#cache` (FileNode + rendered sources) | Yes — but sources already on disk | Zero (sources are the output, not input) | **Not worth caching** |

All `SchemaNode`, `OperationNode`, and `FileNode` types are JSON-serialisable (no functions, Symbols, or circular references).

### `parseFromConfig()` has no caching today

Every build calls `parseFromConfig(source)` → Redocly `bundle()` unconditionally. There is no mtime check, no hash check, and no module-level cache. For remote specs this is an HTTP round-trip on every build.

### Recommended approach

Serialise `{ document, nameMapping }` as a single JSON blob, keyed by a SHA-256 hash of the source content (URL string or file bytes). Persist it via the existing `fsStorage` interface (same `setItem` / `getItem` API that stores generated output files today).

Invalidation:
- **File source**: compare file mtime; re-bundle if stale.
- **URL source**: compare SHA-256 of downloaded bytes; re-bundle if hash changes.

On cache hit, `parsedDocument` and `nameMapping` are deserialised from disk — Redocly `bundle()` is skipped entirely. The `_refCache` (`WeakMap`) is rebuilt lazily on first `$ref` access (normal behaviour after deserialisation).

### Relationship to `InputStreamNode` streaming

The two strategies are complementary, not alternatives:

| Strategy | What it reduces | When |
|---|---|---|
| `InputStreamNode` streaming | Per-build peak heap (AST nodes in memory) | During a single build |
| Disk cache for `parsedDocument` | Cross-build latency and cold-start memory | Between builds (watch mode, CI) |

Both can be active simultaneously: cache hit → skip `bundle()` → stream schemas lazily → minimal heap.

### Implementation files

- `packages/adapter-oas/src/factory.ts` — add `getCachedDocument(source, storage)` / `setCachedDocument(source, doc, storage)`
- `packages/adapter-oas/src/adapter.ts` — pass storage to `count()` / `stream()` / `parse()`; check cache before calling `parseFromConfig()`
- `packages/core/src/createAdapter.ts` — thread `storage` into `AdapterSource` or `AdapterContext`

---

## Considered options

**Option A — Full lazy document loading**
Stream the raw YAML/JSON and parse incrementally. Rejected: Redocly's bundler requires the
full graph for `$ref` resolution; no incremental API exists.

**Option B — Per-plugin streaming (re-parse per plugin)**
Call `stream(source)` once per plugin. Rejected: redundant document loading every pass;
addressed instead by the fan-out single-pass strategy (P0 above).

**Option C — Tee the stream for multiple consumers**
Buffer the stream so each plugin replays it. Rejected: equivalent to the batch path.

## Related ADRs

None.
