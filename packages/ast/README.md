<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

<a href="https://npmjs.com/package/@kubb/ast" target="_blank">
  <img alt="@kubb/ast badges" src="https://shieldcn.dev/group/npm/v/@kubb/ast+npm/dm/@kubb/ast+github/stars/kubb-labs/kubb+npm/l/@kubb/ast+badge/sponsors-stijnvanhulle-EA4AAA.svg?variant=branded&size=xs&theme=zinc&mode=dark">
</a>

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/ast

### Spec-agnostic AST layer for Kubb

Defines the node tree, visitor pattern, factory functions, and type guards used across every Kubb code generation plugin.

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
import { extractRefName } from '@kubb/ast'

extractRefName('#/components/schemas/Pet') // 'Pet'
```

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)
