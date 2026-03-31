Apply AST visitor transformers to modify nodes before code is printed. Each transformer is a `Visitor` object with optional methods for `root`, `operation`, `schema`, `property`, `parameter`, and `response` nodes.
Returning a node from a visitor method replaces the current node; returning `undefined` or `void` leaves it unchanged.

Transformers run depth-first. Later entries in the array run after earlier ones.

> [!TIP]
> Use `transformers` to rewrite node properties (like renaming an `operationId` or adding a keyword) without touching the resolver or generator.
> For output naming customization, use `resolvers` instead.

|           |                  |
| --------: | :--------------- |
|     Type: | `Array<Visitor>` |
| Required: | `false`          |

```typescript [Prefix every operationId]
import { pluginTs } from '@kubb/plugin-ts'
import type { Visitor } from '@kubb/ast/types'

const prefixOperations: Visitor = {
  operation(node) {
    return { ...node, operationId: `api_${node.operationId}` }
  },
}

pluginTs({
  transformers: [prefixOperations],
})
```
