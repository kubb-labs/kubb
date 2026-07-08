---
'@kubb/core': patch
---

Keep a resolver's `file` override when a plugin resolver and the CLI load different copies of `@kubb/core`.

A CommonJS `kubb.config.cjs` loads `@kubb/core` as CommonJS while the CLI runs the ESM build, so a plugin's resolver is not `instanceof` the driver's `Resolver`. `Resolver.merge` relied on that check and fell back to the instance's enumerable fields, which drop `file` (it is bound through `#baseName`, not set as an own property). The merged resolver then used the built-in `toFilePath` casing, so generated file names lost their plugin casing (`Pet.ts` became `pet.ts`) even though the identifiers stayed correct.

`Resolver.merge` now reads a resolver's build options through a shared `Symbol.for` brand instead of `instanceof`, so the `file` override survives across `@kubb/core` copies.
