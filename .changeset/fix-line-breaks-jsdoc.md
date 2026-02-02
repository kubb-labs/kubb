---
'@kubb/core': patch
'@kubb/plugin-oas': patch
'@kubb/plugin-mcp': patch
---

Fix: Preserve line breaks in JSDoc descriptions from OpenAPI schemas

Line breaks (`\r\n`, `\n`) in OpenAPI schema descriptions were being stripped from generated JSDoc comments, collapsing multi-line documentation into single lines without whitespace separation. This fix preserves the line breaks so that multi-line descriptions are properly formatted in the generated code.

**Before:**
```typescript
/**
 * @description Creates a pet in the store.This is an arbitrary description...
 */
```

**After:**
```typescript
/**
 * @description Creates a pet in the store.
 * This is an arbitrary description...
 */
```
