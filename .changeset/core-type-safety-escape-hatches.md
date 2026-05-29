---
'@kubb/core': patch
---

Tighten internal type safety by removing `any` and unnecessary casts. The `Parser` type now defaults `TMeta` to `object` instead of `any`, `getContext` returns an honest `Omit<GeneratorContext, 'options'>` rather than laundering a missing field through `as unknown as`, and a couple of `as never` casts are replaced with proper optional types. No runtime behavior or public API change.
