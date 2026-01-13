---
"@kubb/oas": patch
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-solid-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
---

Standardize optional parameter handling across all query plugins and improve structural optionality detection.

**Key improvements:**

1. **Fixed `getASTParams` required field detection** - Now correctly checks parent schema's `required` array instead of calling `isOptional` on individual property schemas.

2. **Added `isAllOptional` utility** - Recursively checks if a schema has no required fields, including composed schemas (allOf, anyOf, oneOf). Used for pathParams structural optionality detection.

3. **Unified parameter optionality pattern** - All query plugins now use consistent approach:
   - Object-mode: Uses `optional` field with `allChildrenAreOptional` check
   - Non-object mode: Inlined optionality checks directly in parameter definitions
   - pathParams: Uses `isAllOptional` for complex schema compositions

**Before:**
```typescript
// Separate const variables
const pathParamsOptional = typeSchemas.pathParams?.name ? isOptional(...) : false
const dataOptional = typeSchemas.request?.name ? isOptional(...) : false

return FunctionParams.factory({
  pathParams: { ..., optional: pathParamsOptional },
  data: { ..., optional: dataOptional },
})
```

**After:**
```typescript
// Inlined checks with proper structural detection
return FunctionParams.factory({
  pathParams: typeSchemas.pathParams?.name
    ? {
        mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
        children: getPathParams(...),
        default: (typeSchemas.pathParams?.name
          ? isAllOptional(typeSchemas.pathParams?.schema)
          : false) ? '{}' : undefined,
      }
    : undefined,
  data: typeSchemas.request?.name
    ? {
        type: typeSchemas.request?.name,
        optional: typeSchemas.request?.name
          ? isOptional(typeSchemas.request?.schema)
          : false,
      }
    : undefined,
})
```

This ensures consistent behavior across all plugins and better handling of complex OpenAPI schema compositions.

