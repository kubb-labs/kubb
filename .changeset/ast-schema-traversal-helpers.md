---
"@kubb/ast": minor
---

Export shared helpers from `@kubb/ast/utils` for printers to build on. `lazyGetter` emits the `get key() { return body }` form for circular-ref positions, and `resolveRefName` is now exported from the subpath as the shared ref-name resolver. Pure addition, no behavior change.
