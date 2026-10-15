---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Keep the JSON Schema `not` keyword instead of dropping it. `@kubb/ast` gains a `not` schema node with one member, and `@kubb/adapter-oas` parses `{ type: string, not: X }` as `intersection[string, not[X]]`. A printer that cannot express negation returns `null` for the `not` node, so TypeScript output does not change.

```ts
// Username: { type: string, minLength: 3, not: { $ref: '#/components/schemas/ReservedName' } }
{ type: 'intersection', members: [{ type: 'string', min: 3 }, { type: 'not', members: [{ type: 'ref', ref: '#/components/schemas/ReservedName' }] }] }
```
