---
"@kubb/adapter-oas": minor
---

Add an `enums` option to `adapterOas` that controls where inline enums live. The default `'inline'` keeps each enum on the property that declares it. `'root'` lifts every inline enum to a reusable top-level schema named after its context (e.g. `PetStatusEnum`) and references it wherever it appears, so types, zod, and faker all share one definition.
