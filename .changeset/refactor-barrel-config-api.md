---
"@kubb/middleware-barrel": major
---

Refactor middleware-barrel API from string-based `barrelType` to object-based `barrel` configuration.

**Breaking Changes:**

- `barrelType` option replaced with `barrel` object at both config and plugin levels
- `barrelType: 'propagate'` replaced with `barrel: { type: 'all' | 'named', nested: true }`
- Root config: `barrel?: { type: 'all' | 'named' } | false`
- Plugin level: `barrel?: { type: 'all' | 'named', nested?: boolean } | false`

**Migration Guide:**

```ts
// Before
export default defineConfig({
  output: { path: 'src/gen', barrelType: 'named' },
  plugins: [
    pluginTs({ output: { path: 'types', barrelType: 'all' } }),
    pluginZod({ output: { path: 'schemas', barrelType: 'propagate' } }),
  ],
  middleware: [middlewareBarrel()],
})

// After
export default defineConfig({
  output: { path: 'src/gen', barrel: { type: 'named' } },
  plugins: [
    pluginTs({ output: { path: 'types', barrel: { type: 'all' } } }),
    pluginZod({ output: { path: 'schemas', barrel: { type: 'all', nested: true } } }),
  ],
  middleware: [middlewareBarrel()],
})
```

**New Features:**

- Explicit `nested` option for hierarchical barrel generation at plugin level
- Clearer separation of export strategy (`type`) from structure (`nested`)
- Better type safety with distinct `BarrelConfig` and `PluginBarrelConfig` types
- `nested` parameter in `getBarrelFiles` for fine-grained control
