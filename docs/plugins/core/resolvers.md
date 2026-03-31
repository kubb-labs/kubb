Array of named resolvers that control naming and path-resolution conventions. Later entries override earlier ones (last wins).

Each plugin ships a default resolver and a legacy resolver for Kubb v4 compatibility:

| Plugin | Default resolver | Legacy resolver |
| --- | --- | --- |
| `@kubb/plugin-ts` | `resolverTs` | `resolverTsLegacy` |
| `@kubb/plugin-zod` | `resolverZod` | `resolverZodLegacy` |
| `@kubb/plugin-cypress` | `resolverCypress` | — |

|           |                   |
| --------: | :---------------- |
|     Type: | `Array<Resolver>` |
| Required: | `false`           |

```typescript [Custom resolver (plugin-ts example)]
import { pluginTs, resolverTs } from '@kubb/plugin-ts'
import { defineResolver } from '@kubb/core'

const myResolver = defineResolver<PluginTs>(() => ({
  ...resolverTs,
  name: 'my-resolver',
  resolveName(node) {
    // prefix every type name with 'Api'
    return `Api${this.default(node.name, 'type')}`
  },
}))

pluginTs({
  resolvers: [resolverTs, myResolver],
})
```

> [!TIP]
> `compatibilityPreset: 'kubbV4'` is a shorthand for swapping in the legacy resolver. Use `resolvers` directly when you need fine-grained control beyond what a preset offers.
