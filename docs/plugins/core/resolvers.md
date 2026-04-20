A single resolver that overrides the naming and path-resolution conventions. Each method you provide replaces the corresponding built-in one. When a method returns `null` or `undefined`, the resolver's result is used as the fallback, so you only need to supply the methods you want to change.

`this` inside each method is bound to the **full** resolver, so you can call other resolver methods (e.g. `this.default(name, 'function')`) without losing context.

Each plugin ships a built-in resolver:

| Plugin | Default resolver |
| --- | --- |
| `@kubb/plugin-ts` | `resolverTs` |
| `@kubb/plugin-zod` | `resolverZod` |
| `@kubb/plugin-cypress` | `resolverCypress` |
| `@kubb/plugin-mcp` | `resolverMcp` |

|           |                                                      |
| --------: | :--------------------------------------------------- |
|     Type: | `Partial<Resolver> & ThisType<Resolver>`             |
| Required: | `false`                                              |

```typescript [Custom resolver (plugin-ts example)]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    resolveName(name) {
      // Prefix every operation-derived name; falls back for names where
      // this returns null/undefined.
      return `Api${this.default(name, 'function')}`
    },
  },
})
```

> [!TIP]
> Use `resolver` for fine-grained control over naming conventions.
