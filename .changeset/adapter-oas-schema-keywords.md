---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Keep `not` and the other JSON Schema applicator keywords on `SchemaNode`, so plugins can validate them instead of seeing them dropped.

- Add `SchemaNode.keywords` with `not`, `if`/`then`/`else`, `dependentRequired`, `dependentSchemas`, `propertyNames`, `contains`/`minContains`/`maxContains`, `unevaluatedProperties` and `unevaluatedItems`.
- Parse a bare `required` list inside these keywords (for example `not: { required: ['query', 'id'] }`) as an object with those required properties.
- Visitors don't walk into `keywords`, so printers that ignore them (TypeScript types) keep their current output and imports.

```ts
// Username: { type: string, minLength: 3, not: { $ref: '#/components/schemas/ReservedName' } }
{ type: 'string', min: 3, keywords: { not: { type: 'ref', ref: '#/components/schemas/ReservedName' } } }
```
