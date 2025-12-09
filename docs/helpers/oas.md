---
layout: doc

title: \@kubb/oas
outline: deep
---

# @kubb/oas

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/oas
```

```shell [pnpm]
pnpm add -D @kubb/oas
```

```shell [npm]
npm install --save-dev @kubb/oas
```

```shell [yarn]
yarn add -D @kubb/oas
```

:::

## Utilities

### mergeAllOf

The `mergeAllOf` utility function resolves and merges OpenAPI Schema `allOf` arrays into a single Schema object. This is useful for preprocessing schemas before code generation when you want to flatten schema inheritance.

::: info
This function does **not** resolve `$ref` references. It only merges `allOf` arrays. If you need to resolve references, use a separate tool like `@redocly/openapi-core` to bundle your schema first.
:::

#### Usage

```typescript
import { mergeAllOf } from '@kubb/oas'

const schema = {
  allOf: [
    {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string', format: 'uri' }
      },
      required: ['id', 'url']
    },
    { description: 'A shared link' },
    { nullable: true },
  ],
}

const merged = mergeAllOf(schema)
// Result: {
//   type: 'object',
//   properties: {
//     id: { type: 'string' },
//     url: { type: 'string', format: 'uri' }
//   },
//   required: ['id', 'url'],
//   description: 'A shared link',
//   nullable: true
// }
```

#### Merge Rules

The function follows OpenAPI semantics with these specific merge rules:

- **Properties**: Shallow merge. Later entries override earlier ones for the same property key.
- **Required arrays**: Union of all required fields (deduplicated).
- **Type**: Root schema's type takes precedence. Otherwise, later entries override earlier ones.
- **Description**: Root description takes precedence. Otherwise, use first non-empty description.
- **Boolean flags** (`nullable`, `deprecated`, `readOnly`, `writeOnly`): `true` if any entry is `true`, unless root explicitly overrides.
- **Example**: Root example takes precedence. Otherwise, use the last non-empty example.
- **Enum**: Union of all enum arrays (deduplicated).
- **additionalProperties**: `false` takes precedence. Otherwise, later overrides earlier.
- **Items**: For array schemas, prefer later entries.
- **Other properties**: Shallow merge with later entries overriding earlier ones.

#### Recursive Processing

The function recursively processes property schemas and array items that contain nested `allOf`:

```typescript
import { mergeAllOf } from '@kubb/oas'

const schema = {
  type: 'object',
  properties: {
    user: {
      allOf: [
        { type: 'object', properties: { id: { type: 'string' } } },
        { properties: { name: { type: 'string' } } },
      ],
    },
  },
}

const merged = mergeAllOf(schema)
// user property is also merged:
// merged.properties.user = {
//   type: 'object',
//   properties: {
//     id: { type: 'string' },
//     name: { type: 'string' }
//   }
// }
```
