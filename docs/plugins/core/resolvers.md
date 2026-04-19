A single resolver that overrides the preset's naming and path-resolution conventions. Each method you provide replaces the corresponding built-in one. When a method returns `null` or `undefined`, the preset resolver's result is used as the fallback, so you only need to supply the methods you want to change.

`this` inside each method is bound to the **full** resolver, so you can call other resolver methods (e.g. `this.default(name, 'function')`) without losing context.

Each plugin ships a built-in resolver (and a legacy one for Kubb v4 compatibility):

| Plugin                 | Default resolver  | Legacy resolver     |
| ---------------------- | ----------------- | ------------------- |
| `@kubb/plugin-ts`      | `resolverTs`      | `resolverTsLegacy`  |
| `@kubb/plugin-zod`     | `resolverZod`     | `resolverZodLegacy` |
| `@kubb/plugin-cypress` | `resolverCypress` | —                   |
| `@kubb/plugin-mcp`     | `resolverMcp`     | —                   |

|           |                                          |
| --------: | :--------------------------------------- |
|     Type: | `Partial<Resolver> & ThisType<Resolver>` |
| Required: | `false`                                  |

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
> `compatibilityPreset: 'kubbV4'` is a shorthand for switching to the legacy resolver. Use `resolver` for fine-grained control on top of the active preset.
