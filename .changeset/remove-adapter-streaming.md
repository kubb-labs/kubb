---
'@kubb/adapter-oas': major
'@kubb/core': major
'@kubb/ast': major
---

Remove the adapter streaming architecture. `Adapter.stream` and `InputNode`'s `Stream` generic are gone, `schemas`/`operations` are always plain arrays now, and `@kubb/adapter-oas` only implements `parse()`.

Streaming was meant to cut peak memory on large specs, but `KubbDriver` already buffered every schema and operation into arrays before running plugins (needed for fan-out and the pruning pre-scan), so the one-node-at-a-time benefit never applied in practice. The measured memory fix for large specs (e.g. the Stripe spec) comes from a separate `$ref` resolution cache in the parser, unaffected by this change.

`InputNode<true>` and `Streamable<T, Stream>` are removed from `@kubb/ast`. A custom `Adapter` no longer needs (or can) implement `stream`.
