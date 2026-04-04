A single AST visitor applied to every node before code is printed. Each method you provide replaces the corresponding built-in one. When a method returns `null` or `undefined`, the preset transformer's result is used as the fallback — so you only need to supply the methods you want to change.

Visitor methods receive the node and a context object. Return a modified node to replace it, or return `undefined`/`void` to leave it unchanged.

|           |            |
| --------: | :--------- |
|     Type: | `Visitor`  |
| Required: | `false`    |

```typescript [Strip descriptions before printing]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  transformer: {
    schema(node) {
      return { ...node, description: undefined }
    },
  },
})
```

```typescript [Prefix every operationId]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  transformer: {
    operation(node) {
      return { ...node, operationId: `api_${node.operationId}` }
    },
  },
})
```

> [!TIP]
> Use `transformer` to rewrite node properties before printing. For output naming customization, use `resolver` instead.
