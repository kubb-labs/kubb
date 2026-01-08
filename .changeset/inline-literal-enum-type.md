---
"@kubb/plugin-ts": minor
---

Add `inlineLiteral` enum type to inline enum values directly into types

You can now use `enumType: 'inlineLiteral'` to inline enum values as literal union types instead of creating separate enum declarations:

```typescript
pluginTs({
  enumType: 'inlineLiteral',
})
```

**Before (enumType: 'asConst' - default):**
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

**After (enumType: 'inlineLiteral'):**
```typescript
export interface Pet {
  status?: "available" | "pending" | "sold"
}
```

> **Note**: In Kubb v5, `inlineLiteral` will become the default `enumType`.
