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

## Decision

The `Adapter` interface gains an optional `stream(source)` method that is an
`AsyncGenerator<AdapterStreamEvent>`. The event union is:

```ts
type AdapterStreamEvent =
  | { kind: 'meta';      meta: InputMeta }
  | { kind: 'schema';    node: SchemaNode }
  | { kind: 'operation'; node: OperationNode }
```

When `adapter.stream` is present, `safeBuild()` routes to a new
`runAllPluginsWithStream()` function that consumes the generator once and fans each
emitted node out to all plugins before advancing to the next node. Plugins are
unchanged — they still receive individual nodes through the same generator callbacks
(`gen.schema`, `gen.operation`, `gen.operations`).

`adapterOas` implements `stream()` in `packages/adapter-oas/src/adapter.ts`. The
underlying generator, `streamOas()`, lives in `packages/adapter-oas/src/parser.ts`
alongside the existing `parseOas()`.

Key invariants of the stream contract:

- The `meta` event is always first.
- All `schema` events precede all `operation` events (matching topological schema order).
- `nameMapping` and `adapter.document` are set before the first schema event is yielded.

## Rationale

- Schema nodes are GC-eligible immediately after all plugins process them, rather
  than being held until the entire build completes.
- The change is additive and opt-in: adapters that do not implement `stream` fall
  through to the existing `parse()` + `ast.walk()` batch path unchanged.
- Plugins do not change their API surface.
- The streaming contract is generic enough to be reused by any future adapter
  (AsyncAPI, GraphQL, Drizzle ORM, etc.).

## Consequences

### Positive

- Lower peak heap for large OAS specs (proportional to schema count × schema node size).
- Opens the door for future incremental/watch-mode streaming.
- No plugin API changes required.

### Negative

- The raw OAS document (Redocly bundle output) is still fully resident — only parsed
  AST node memory is reduced.
- `driver.inputNode.schemas` is empty during streaming; the full node list is replaced
  by a synthetic `InputNode { schemas: [], operations: [], meta }`. Generators that
  inspect `ctx.inputNode.schemas` at runtime will see an empty array.
- The `allowedSchemaNames` operation-reachability optimisation is skipped in streaming
  mode (operations arrive after schemas in the stream, so the pre-filter cannot run).
- Per-plugin wall-clock timing is not individually tracked in streaming mode (all
  plugins run interleaved in a single pass).

## Considered options

**Option A — Full lazy document loading (partial spec streaming)**
Stream the raw YAML/JSON and parse incrementally. Rejected: Redocly's bundler requires
the full graph for `$ref` resolution; there is no incremental API available.

**Option B — Per-plugin streaming (re-parse for each plugin)**
Call `adapter.stream(source)` once per plugin instead of once total. Rejected: causes
redundant document loading and validation on every plugin pass.

**Option C — Tee the stream for multiple consumers**
Buffer the stream so each plugin can independently replay it. Rejected: defeats the
memory goal; equivalent to the current batch path.

## Related ADRs

None.
