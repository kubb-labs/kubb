---
"@kubb/plugin-ts": minor
---

Add `enumInline` option to inline enum values directly into types

You can now use the `enumInline` option to inline enum values as literal union types instead of creating separate enum declarations:

```typescript
pluginTs({
  enumInline: true,
})
```

**Before (enumInline: false - default):**
```typescript
export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export interface Pet {
  status?: PetStatusEnumKey
}
```

**After (enumInline: true):**
```typescript
export interface Pet {
  status?: "available" | "pending" | "sold"
}
```
