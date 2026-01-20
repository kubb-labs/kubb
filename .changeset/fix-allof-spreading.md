---
'@kubb/plugin-faker': patch
---

Fix incorrect spreading of factory functions in `allOf` schemas with single refs

When using `allOf` with a single reference to a primitive type (e.g., enum), the generated factory code was incorrectly spreading the result like `{ ...createIssueCategory() }`. This has been fixed so that single refs in `allOf` are no longer spread, while multiple refs continue to be spread correctly.

**Before:**
```typescript
// Generated code (incorrect)
category: { ...createIssueCategory() }
```

**After:**
```typescript
// Generated code (correct)
category: createIssueCategory()
```
