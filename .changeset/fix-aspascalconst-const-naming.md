---
'@kubb/plugin-ts': patch
---

Fix `enumType: "asPascalConst"` const naming to prevent broken barrel exports

When using `enumType: "asPascalConst"`, the generated const now uses the base name without the `Key` suffix, while the type alias correctly uses the name with the `Key` suffix.

**Before:**
```typescript
export const GetPetsQueryParamsStatusEnumKey = { ... } // ❌ Wrong
export type GetPetsQueryParamsStatusEnumKey = ...      // Correct
```

**After:**
```typescript
export const GetPetsQueryParamsStatusEnum = { ... }    // ✅ Correct
export type GetPetsQueryParamsStatusEnumKey = ...      // ✅ Correct
```

This fix ensures barrel exports work correctly by exporting the const with the proper name.
