---
"@kubb/adapter-oas": patch
---

Two schemas that only `$ref` each other no longer print a self-referencing type such as `export type Baz = Baz`. A chain of pure aliases that leads back to itself now resolves to `unknown`.
