# Changelog

## v5.0.0-beta.3 — Apr 30, 2026

### @kubb/cli

#### Bug Fixes

- Reduce default install size by moving `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies`. The CLI never imports them at runtime — they expose their own `kubb-mcp` / agent entry points. Install them explicitly when needed:
  
  ```bash
  npm i @kubb/mcp     # for the MCP server
  npm i @kubb/agent   # for the HTTP agent
  ``` ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### kubb

#### Bug Fixes

- Reduce default install size by moving `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies`. The CLI never imports them at runtime — they expose their own `kubb-mcp` / agent entry points. Install them explicitly when needed:
  
  ```bash
  npm i @kubb/mcp     # for the MCP server
  npm i @kubb/agent   # for the HTTP agent
  ``` ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.2 — Apr 30, 2026

### @kubb/adapter-oas

#### Features

- Change the default value of `integerType` from `'number'` to `'bigint'`.
  
  `int64` fields in OpenAPI specs are now mapped to `bigint` by default. To preserve the previous behaviour, set `integerType: 'number'` explicitly in your adapter options. ([#3209](https://github.com/kubb-labs/kubb/pull/3209), [`9e90cbb`](https://github.com/kubb-labs/kubb/commit/9e90cbb2d0ded12d839739b9a13ab15532d38541))

### @kubb/ast

#### Features

- Fix `include` filter not preventing generation of component schemas from excluded operations.
  
  When `include` contains operation-based filters (`tag`, `operationId`, `path`, `method`, or `contentType`), only the schemas transitively referenced by the included operations are now generated. Schemas that are only used by excluded operations are silently skipped.
  
  **New `@kubb/ast` export: `collectUsedSchemaNames`**
  
  ```ts
  import { collectUsedSchemaNames } from '@kubb/ast'
  
  // Returns the set of top-level schema names reachable from the given operations.
  const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)
  ```
  
  **Before** (all schemas generated regardless of `include`):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  ├── ItemsResponse.ts  ✅
  ├── OrderStatus.ts    ❌ generated even though getOrders is excluded
  └── OrdersResponse.ts ❌ generated even though getOrders is excluded
  ```
  
  **After** (only schemas reachable from included operations):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  └── ItemsResponse.ts  ✅
  ```
  
  > [!NOTE]
  > When `include` contains a `schemaName` filter alongside operation filters, the new schema-scoping logic is disabled and `schemaName` rules apply instead. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

#### Bug Fixes

- Fixed `combineImports` incorrectly tree-shaking aliased named imports.
  
  When an import uses a local alias (e.g. `import { fakerDE as faker } from '@faker-js/faker'`), the used-check now tests the alias (`faker`) rather than the original export name (`fakerDE`). Previously, any aliased import whose propertyName did not appear verbatim in the generated source was silently dropped, leaving files with no import at all. ([#3212](https://github.com/kubb-labs/kubb/pull/3212), [`0e5bfaa`](https://github.com/kubb-labs/kubb/commit/0e5bfaabbced0e67ba560fda5bf6b3c380b63258))

### @kubb/core

#### Bug Fixes

- Fix `include` filter not preventing generation of component schemas from excluded operations.
  
  When `include` contains operation-based filters (`tag`, `operationId`, `path`, `method`, or `contentType`), only the schemas transitively referenced by the included operations are now generated. Schemas that are only used by excluded operations are silently skipped.
  
  **New `@kubb/ast` export: `collectUsedSchemaNames`**
  
  ```ts
  import { collectUsedSchemaNames } from '@kubb/ast'
  
  // Returns the set of top-level schema names reachable from the given operations.
  const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)
  ```
  
  **Before** (all schemas generated regardless of `include`):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  ├── ItemsResponse.ts  ✅
  ├── OrderStatus.ts    ❌ generated even though getOrders is excluded
  └── OrdersResponse.ts ❌ generated even though getOrders is excluded
  ```
  
  **After** (only schemas reachable from included operations):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  └── ItemsResponse.ts  ✅
  ```
  
  > [!NOTE]
  > When `include` contains a `schemaName` filter alongside operation filters, the new schema-scoping logic is disabled and `schemaName` rules apply instead. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

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
