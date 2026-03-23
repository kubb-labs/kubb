---
'@kubb/plugin-ts': patch
---

Fix aggregated operation type naming order when using `transformers.name` with legacy mode. Previously, a transformer like `(name) => \`${name}Type\`` produced `AddPetMutationType` instead of the v4-compatible `AddPetTypeMutation`. The `Query`/`Mutation` suffix is now appended after the transformer runs.
