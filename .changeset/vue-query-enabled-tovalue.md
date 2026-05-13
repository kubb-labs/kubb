---
"@kubb/plugin-vue-query": patch
---

Fixed `enabled` flag generation to correctly unwrap `MaybeRefOrGetter` path params.

Previously, the generator emitted `enabled: !!(petId)` — but since path params in Vue Query are typed as `MaybeRefOrGetter<T>`, the `!!` check was always `true` (a `Ref` object is always truthy), causing queries to fire even when the underlying value was `undefined`.

The generator now emits a reactive getter that applies `toValue` per param:

```typescript
// Before
enabled: !!(petId),

// After
enabled: () => !!toValue(petId),
```
