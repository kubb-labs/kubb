---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Preserve `oneOf` and `anyOf` semantics in union schema nodes.

### Problem

The OAS adapter previously treated `oneOf` and `anyOf` schemas identically, combining their members into a single union type without distinguishing between them. This prevented plugins from implementing proper validation:
- `oneOf` requires exactly one schema to be valid
- `anyOf` allows any number of schemas to be valid

### Solution

Add `unionKind?: 'oneOf' | 'anyOf'` field to `UnionSchemaNode` to preserve which keyword was used in the original OpenAPI schema. This enables plugins (like Zod) to implement proper validation logic.

### Changes

**@kubb/ast**
- Add optional `unionKind` field to `UnionSchemaNode` type definition to track union semantics

**@kubb/adapter-oas**
- Update `convertUnion()` parser function to set `unionKind` based on whether `oneOf` or `anyOf` is present
- Prioritize `oneOf` when both keywords are present in the same schema
- Add comprehensive tests for `unionKind` behavior

### Impact

Plugins can now check `unionNode.unionKind` to determine validation strategy:
- For `oneOf`: Enforce exactly one member matches
- For `anyOf`: Allow any number of members to match

Backward compatible - `unionKind` is optional and defaults to `undefined`.
