---
"@kubb/plugin-ts": patch
---

Fix TS2411 error in generated QueryParams types by using `unknown` type for index signatures when typed properties coexist with `additionalProperties`. This resolves TypeScript compilation errors that occur when query parameters combine typed params (enums, objects) with dynamic params from `explode: true` and `style: form`.

**Before:**
```typescript
export type QueryParams = {
  include?: 'author' | 'tags';    // TS2411: not assignable to string
  page?: { number?: number };      // TS2411: not assignable to string
  [key: string]: string;
};
```

**After:**
```typescript
export type QueryParams = {
  include?: 'author' | 'tags';
  page?: { number?: number };
  [key: string]: unknown;  // All properties compatible
};
```
