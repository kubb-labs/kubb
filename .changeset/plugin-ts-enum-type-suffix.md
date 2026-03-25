---
'@kubb/plugin-ts': minor
---

New config param `enumTypeSuffix` to speficy a custom type name suffix when using `enumType: asConst|asPascalConst`.
Default value `Key` for backwards compatibility.

**Before/Default:**
```typescript
export const GetPetsQueryParamsStatusEnum = { ... }
export type GetPetsQueryParamsStatusEnumKey = ...
```
**After:**
```typescript
export const GetPetsQueryParamsStatusEnum = { ... }
export type GetPetsQueryParamsStatusEnumCustomSuffix = ... // enumTypeSuffix=CustomSuffix
```
This change restores compatibility with the behavior before PR #2467 as well as maintaining the default behavior after said PR.
