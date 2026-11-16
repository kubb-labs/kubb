---
'@kubb/core': minor
---

Generators can read every schema in the spec from `ctx.schemas`. `ctx.driver` is deprecated: use `ctx.schemas`, `ctx.getPlugin`, `ctx.getResolver` and `ctx.memo` instead. It will be removed in the next major version.
