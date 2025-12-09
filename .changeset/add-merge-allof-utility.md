---
"@kubb/oas": minor
---

Add `mergeAllOf` utility function to resolve and merge OpenAPI Schema `allOf` arrays into a single Schema object. This utility is useful for preprocessing schemas before code generation when you want to flatten schema inheritance.

**Features:**
- Merges `allOf` entries following OpenAPI semantics
- Properties: shallow merge with later entries overriding earlier ones
- Required arrays: union of all required fields (deduplicated)
- Boolean flags (nullable, deprecated, readOnly, writeOnly): true if any entry is true
- Recursively processes nested `allOf` in property schemas and array items
- Returns `$ref` unchanged (does not resolve references)

**Usage:**
```typescript
import { mergeAllOf } from '@kubb/oas'

const schema = {
  allOf: [
    { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    { description: 'A shared link' },
    { nullable: true }
  ]
}

const merged = mergeAllOf(schema)
// Result: { type: 'object', properties: { id: ... }, required: ['id'], description: '...', nullable: true }
```
