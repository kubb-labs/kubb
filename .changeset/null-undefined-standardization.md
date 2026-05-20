---
'@kubb/ast': minor
'@kubb/core': minor
'@kubb/adapter-oas': minor
'@kubb/cli': patch
'@kubb/middleware-barrel': patch
'@kubb/renderer-jsx': patch
---

Standardize `null` vs `undefined` across the codebase: Kubb-controlled "absent" or "skip" states now use `null` explicitly; `undefined` is reserved for optional TypeScript properties and external/user-supplied values.

## Breaking changes

### `@kubb/ast`

**`narrowSchema`** now returns `T | null` instead of `T | undefined` when the node type does not match.

```ts
// Before
const objectNode = narrowSchema(node, 'object') // ObjectSchemaNode | undefined

// After
const objectNode = narrowSchema(node, 'object') // ObjectSchemaNode | null
```

**`collectImports`** `resolve` callback must return `TImport | null` (instead of `TImport | undefined`) to skip an import.

```ts
// Before
collectImports({ node, nameMapping, resolve: (name) => undefined })

// After
collectImports({ node, nameMapping, resolve: (name) => null })
```

**`CollectVisitor<T>`** callbacks may now return `T | null | undefined`; both `null` and `undefined` are treated as "skip this node".

**`RefSchemaNode.schema`** is now `SchemaNode | null | undefined` — `null` means the ref was resolved but circular or unresolvable; `undefined` means resolution was not attempted.

**`keysToOmit`** on `RequestBodyContent` and `ResponseNode` now accepts `Array<string> | null`.

**`InputMeta.baseURL`** is now `string | null`.

### `@kubb/core`

**`FileManager.setOnUpsert`** now accepts `null` to detach the callback (previously `undefined`).

### `@kubb/adapter-oas`

**`resolveBaseUrl`** now returns `string | null` (previously `string | undefined`) when `serverIndex` is omitted or out of range.
