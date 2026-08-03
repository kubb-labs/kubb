---
'@kubb/adapter-oas': patch
---

Respect `type: 'string'` when the schema carries a numeric `format` (`int64`, `uint64`, `int32`, `float`, `double`).

A schema like `{ type: 'string', format: 'int64' }` produced a `bigint` node, dropping the declared type. ProtoJSON (and so every gRPC-gateway spec) encodes 64-bit integers as JSON strings, so those fields are now generated as `string`, matching what other generators do. The format stays on the node, so `@kubb/plugin-zod` adds a digits `.regex(...)` and `@kubb/plugin-faker` mocks a numeric string.

A numeric format on an `integer`/`number` schema, or on a schema with no `type` at all, keeps mapping to `bigint`/`integer`/`number` as before.
