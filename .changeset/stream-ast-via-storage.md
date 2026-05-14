---
'@kubb/adapter-oas': minor
'@kubb/core': minor
---

Stream parsed AST nodes through `config.storage` to reduce peak memory.

`adapter-oas` now writes each parsed schema and operation to `config.storage` under a per-build `.kubb/.cache/<namespace>/` directory and exposes them through a new `Adapter.source` (`AdapterStreamSource`) that yields nodes lazily. `createKubb` walks this streaming source when present so only one schema/operation lives in memory at a time per plugin pass.

The `InputNode` shape stays primitive-only — its `schemas` and `operations` arrays remain JSON-safe. Adapters that materialize everything up front (no `source`) continue to work unchanged.

A new `bundle` option on `adapterOas()` (default `true`) toggles Redocly's pre-parse bundling. Set it to `false` for very large OpenAPI documents where the bundler dominates memory.

The `operations` generator hook now receives an `AsyncIterable<OperationNode>` instead of `Array<OperationNode>` so consumers can stream through it. Existing first-party generators have been updated.
