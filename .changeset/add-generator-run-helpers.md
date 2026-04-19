---
'@kubb/core': minor
---

Add generator dispatch helpers.

New functions exported from `@kubb/core`:

- `runGeneratorSchema(node, ctx)` — dispatch a schema node to all generators
- `runGeneratorOperation(node, ctx)` — dispatch an operation node to all generators
- `runGeneratorOperations(nodes, ctx)` — batch-dispatch operation nodes

All accept `RunGeneratorContext<TOptions>` and handle option resolution and null-checking.
