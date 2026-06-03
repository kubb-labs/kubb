---
'@kubb/adapter-oas': major
'@kubb/core': minor
'@kubb/cli': patch
---

Breaking change for `@kubb/adapter-oas`: remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API. These are implementation details that should not be exposed. Use `adapter.validate(input, options?)` for validation instead.

New for `@kubb/core`: add a required `validate` method to the `Adapter<T>` type so every adapter implements validation.

Internal for `@kubb/cli`: the `kubb validate` command now uses `adapterOas().validate()` instead of the removed standalone functions.
