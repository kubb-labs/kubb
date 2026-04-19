<div align="center">
  <h1>@kubb/ast</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev/" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

Spec-agnostic AST layer for Kubb. Defines nodes, visitor pattern, factory functions, and type guards used across codegen plugins.

## Imports

| Path              | Contents                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `@kubb/ast`       | Runtime: factory functions, guards, visitor, ref helpers, constants |
| `@kubb/ast/types` | Types only: all node interfaces, type aliases, visitor types        |

## Node tree

```
RootNode
├── schemas: SchemaNode[]
└── operations: OperationNode[]
    ├── parameters: ParameterNode[]   → SchemaNode
    ├── requestBody?: SchemaNode
    └── responses: ResponseNode[]     → SchemaNode?

SchemaNode (discriminated union)
  object        → properties: PropertyNode[] → SchemaNode
  array | tuple → items: SchemaNode[]
  union | intersection → members: SchemaNode[]
  enum | ref | string | number | integer | bigint
  boolean | null | any | unknown | void
  date | datetime | time | uuid | email | url | blob
```

## Usage

### Factory

```ts
import { createRoot, createOperation, createSchema, createProperty } from '@kubb/ast'

const root = createRoot({
  schemas: [
    createSchema({
      name: 'Pet',
      type: 'object',
      properties: [
        createProperty({
          name: 'id',
          schema: createSchema({ type: 'integer' }),
          required: true,
        }),
        createProperty({
          name: 'name',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
      ],
    }),
  ],
})
```

### Visitor

```ts
import { walk, transform, collect } from '@kubb/ast'

// Side effects
await walk(root, {
  schema(node) {
    console.log(node.type)
  },
})

// Immutable transformation
const updated = transform(root, {
  schema(node) {
    return { ...node, description: 'generated' }
  },
})

// Extraction
const types = collect<string>(root, {
  schema(node) {
    return node.type
  },
})
```

### Guards

```ts
import { isSchemaNode, narrowSchema } from '@kubb/ast'
import type { Node } from '@kubb/ast/types'

function process(node: Node) {
  if (isSchemaNode(node)) {
    const obj = narrowSchema(node, 'object')
    obj?.properties?.forEach((p) => console.log(p.name))
  }
}
```

### Refs

```ts
import { buildRefMap, resolveRef } from '@kubb/ast'

const refMap = buildRefMap(root)
const pet = resolveRef(refMap, 'Pet')
```

## Supporting Kubb

Kubb uses an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/ast?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/ast
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/ast?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/ast
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/ast
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
