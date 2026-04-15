# definePlugin Migration Gaps

This document tracks plugins that cannot yet be migrated from `createPlugin` to `definePlugin`, along with the missing features required for each.

## Successfully Migrated

| Plugin | Status |
| --- | --- |
| `plugin-ts` | ✅ Migrated |
| `plugin-zod` | ✅ Migrated |
| `plugin-cypress` | ✅ Migrated |
| `plugin-client` | ✅ Migrated |

## Not Yet Migrated

### plugin-oas

**Reason**: Uses the `inject()` lifecycle method to expose `getOas()` and `getBaseURL()` to all downstream plugins via their context. This is a unique capability not available in the hook-style API.

**Missing features**:
- `inject()` lifecycle support in `definePlugin` — allows a plugin to contribute methods to the shared context that other plugins can call (e.g., `this.getOas()`, `this.getBaseURL()`).

### plugin-redoc

**Reason**: `buildStart()` requires access to `this.adapter` to read the parsed OpenAPI document and generate HTML documentation.

**Missing features**:
- `adapter` access in `kubb:plugin:setup` or a new hook like `kubb:build:ready` that provides both adapter access and file injection capability.

### plugin-mcp

**Reason**: `buildStart()` conditionally injects files based on `this.adapter?.inputNode?.meta?.baseURL` and checks for the presence of other plugins via `driver.getPlugin()`. These runtime values are not available during `kubb:plugin:setup`.

**Missing features**:
- `adapter` access in a setup-phase hook (adapter is only available after parsing, which happens after `kubb:plugin:setup`).
- `getPlugin()` / `driver` access during file injection — to conditionally inject files based on other registered plugins.

### plugin-faker

**Reason**: `buildStart()` manually creates `SchemaGenerator` and `OperationGenerator` instances, calls `.build()`, and writes files and barrel files. This is the legacy v4 generation pattern.

**Missing features**:
- The plugin's generators (`fakerGenerator`) are already compatible with the new generator API. However, `buildStart()` also manually creates barrel files and uses `this.getOas()`, `this.driver`, `this.hooks`, `this.upsertFile()`.
- Automatic barrel file generation is already handled by the framework for hook-style plugins, so the manual barrel file creation would need to be removed.
- `resolvePath()` and `resolveName()` with custom logic (not just a preset resolver) — these would need to be expressible via `setResolver()`.

### plugin-msw

**Reason**: Same as `plugin-faker` — manually creates `OperationGenerator`, builds files, and creates barrel files in `buildStart()`.

**Missing features**:
- Same as `plugin-faker`: custom `resolvePath()` / `resolveName()` logic with `transformers.name` support needs to be expressible via `setResolver()`.
- `getOas()` access (from plugin-oas inject context) during generation.

### plugin-react-query

**Reason**: Complex `buildStart()` that fetches OAS, gets base URL, conditionally injects bundled client files, manually creates `OperationGenerator`, builds files, and creates barrel files.

**Missing features**:
- `getOas()` and `getBaseURL()` access (from plugin-oas inject context).
- `getPlugin()` access to check for the presence of `plugin-client`.
- Conditional file injection based on runtime plugin state and adapter values.
- Custom `resolvePath()` / `resolveName()` with `transformers.name` support.

### plugin-solid-query

**Reason**: Same pattern as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-svelte-query

**Reason**: Same pattern as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-vue-query

**Reason**: Same pattern as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-swr

**Reason**: Same pattern as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

## Summary of Missing Features

To migrate the remaining plugins, the following features need to be added to the `definePlugin` / hook-style API:

1. **`inject()` lifecycle equivalent** — Allow a hook-style plugin to contribute methods to the shared context (used by `plugin-oas` to expose `getOas()` / `getBaseURL()`).

2. **`adapter` access** — Provide adapter/inputNode access in a hook that also supports file injection. Currently `kubb:build:start` provides adapter but no file injection, and `kubb:plugin:setup` provides file injection but no adapter.

3. **`getPlugin()` / driver access** — Allow querying registered plugins during setup or build phases for conditional behavior.

4. **Custom `resolveName()` support via `setResolver()`** — The current `setResolver()` accepts a partial `Resolver`, but the legacy plugins have custom naming logic with `transformers.name` callbacks, prefix/suffix support, and type-aware casing. This logic needs to be expressible through the resolver API.

5. **Migration of legacy `SchemaGenerator` / `OperationGenerator` usage** — The v4 plugins that manually create generators and call `.build()` in `buildStart()` need to be refactored to use the declarative `addGenerator()` pattern where the framework drives the AST walk. This is more of a plugin refactor than a missing feature.
