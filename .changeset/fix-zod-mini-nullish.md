---
'@kubb/plugin-zod': patch
---

Fix Zod Mini nullish modifier to use functional wrapper instead of method call

When using `mini: true` option with Zod v4, object properties with nullish modifier now correctly generate `z.nullish(schema)` instead of `schema.nullish()`.

**Issue:**
Zod Mini doesn't support chainable methods like `.nullish()`. It only supports functional wrappers like `z.nullish()`.

**Before** (v4.18.5):
```typescript
export const postApiExampleMutationRequestSchema = z.object({
  email: z.string().nullish() // ❌ Error: .nullish() doesn't exist in Zod Mini
});
```

**After** (this fix):
```typescript
export const postApiExampleMutationRequestSchema = z.object({
  email: z.nullish(z.string()) // ✅ Correct functional wrapper
});
```

This fix ensures consistency with how `optional` and `nullable` modifiers were already being handled in mini mode.
