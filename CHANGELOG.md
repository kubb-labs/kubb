# Changelog

## v5.0.0-beta.2 — Apr 30, 2026

### @kubb/middleware-barrel

#### Breaking Changes

- Refactor middleware-barrel API from string-based `barrelType` to object-based `barrel` configuration.
  
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
  - `nested` parameter in `getBarrelFiles` for fine-grained control ([#3200](https://github.com/kubb-labs/kubb/pull/3200), [`3519370`](https://github.com/kubb-labs/kubb/commit/35193705080f85f60bbb20d4e525724a9f19a3c4))

### @kubb/adapter-oas

#### Features

- Change the default value of `integerType` from `'number'` to `'bigint'`.
  
  `int64` fields in OpenAPI specs are now mapped to `bigint` by default. To preserve the previous behaviour, set `integerType: 'number'` explicitly in your adapter options. ([#3209](https://github.com/kubb-labs/kubb/pull/3209), [`9e90cbb`](https://github.com/kubb-labs/kubb/commit/9e90cbb2d0ded12d839739b9a13ab15532d38541))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.1 — Apr 29, 2026

### kubb

#### Bug Fixes

- Update packages ([`c17c092`](https://github.com/kubb-labs/kubb/commit/c17c0926ac211bbf77ec82eae68fd3d44fd0baad))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)
