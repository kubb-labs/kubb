---
"@kubb/plugin-client": major
---

### `@kubb/plugin-client` — v5 architecture rewrite

`@kubb/plugin-client` has been rewritten to match the v5 plugin architecture used by `@kubb/plugin-ts`, `@kubb/plugin-zod`, and `@kubb/plugin-mcp`.

#### New `compatibilityPreset` option

Use `compatibilityPreset: 'kubbV4'` to preserve v4 naming conventions during migration. The default `'default'` preset uses the new v5 naming conventions.

```typescript
pluginClient({ compatibilityPreset: 'kubbV4' })
```

#### New `resolver` option

Override individual resolver methods to customise generated names without replacing the entire naming strategy. Any method you omit falls back to the preset resolver. Use `this.default(...)` to call the preset's implementation.

```typescript
pluginClient({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Client`
    },
  },
})
```

#### New `transformer` option

Apply an AST `Visitor` to transform schema and operation nodes before they are printed. This replaces the old `transformers` callback approach.

```typescript
import { pluginClient } from '@kubb/plugin-client'

pluginClient({
  transformer: {
    operation(node) {
      return { ...node, operationId: `api_${node.operationId}` }
    },
  },
})
```

#### `transformers.name` replaced by `resolver`

The `transformers: { name }` callback has been removed. Use the `resolver` option instead.

::: code-group
```typescript [Before (v4)]
pluginClient({
  transformers: {
    name: (name, type) => type === 'function' ? `${name}Client` : name,
  },
})
```

```typescript [After (v5)]
pluginClient({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Client`
    },
  },
})
```
:::

#### `baseURL` now defaults to the adapter baseURL

In v4, the `baseURL` option had to be set explicitly in the plugin options. In v5, `baseURL` automatically falls back to the base URL defined in the OAS spec (via the adapter). Explicitly setting `baseURL` in plugin options still overrides the adapter value.

#### `contentType` override matching fixed

The `contentType` override type now correctly filters operations by their request body content type. In v4, `{ type: 'contentType', pattern: 'multipart/form-data' }` overrides were silently ignored. This is now fixed in `@kubb/core`.
