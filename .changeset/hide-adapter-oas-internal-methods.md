---
'@kubb/adapter-oas': major
'@kubb/core': minor
'@kubb/cli': patch
---

**Breaking change for `@kubb/adapter-oas`**: Remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API — these are implementation details that should not be exposed. Use `adapter.validate(input, options?)` instead for validation.

**New feature for `@kubb/core`**: Add required `validate` method to the `Adapter<T>` type so all adapters must implement validation support.

**Internal change for `@kubb/cli`**: Update the `kubb validate` command to use `adapterOas().validate()` instead of the removed standalone functions.
