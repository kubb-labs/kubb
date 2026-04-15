# definePlugin Migration Gaps

This document tracks plugins that cannot yet be migrated from `createPlugin` to `definePlugin`, along with the missing features required for each.

## Successfully Migrated

| Plugin | Status |
| --- | --- |
| `plugin-ts` | ✅ Migrated |
| `plugin-zod` | ✅ Migrated |
| `plugin-cypress` | ✅ Migrated |
| `plugin-client` | ✅ Migrated |
| `plugin-mcp` | ✅ Migrated |

## Not Yet Migrated

### plugin-oas

**Reason**: Uses the `inject()` lifecycle method to expose `getOas()` and `getBaseURL()` to all downstream plugins via their context. This is a cross-cutting capability not available in the hook-style API.

**Missing features**:
- `inject()` lifecycle support in `definePlugin` — allows a plugin to contribute methods to the shared context that other plugins can call (e.g., `this.getOas()`, `this.getBaseURL()`).

### plugin-redoc

**Reason**: `buildStart()` requires access to `this.adapter` to read the parsed OpenAPI document and generate HTML documentation.

**Missing features**:
- `adapter` access in `kubb:plugin:setup` or a new hook (e.g., `kubb:build:ready`) that provides both adapter access and file injection capability.

### plugin-faker

**Reason**: Uses `createReactGenerator` with React hooks (`useOas`, `useDriver`, `useOperationManager`, `useSchemaManager`) and manually creates `SchemaGenerator`/`OperationGenerator` in `buildStart()`. The generators are fundamentally different from the `defineGenerator`-style `schema(node, ctx)` / `operation(node, ctx)` API.

**Missing features**:
1. **Generator migration**: The `fakerGenerator` uses `createReactGenerator` with `Operation()` components and React hooks. It needs to be rewritten as a `defineGenerator`-style generator with `schema(node, ctx)` / `operation(node, ctx)` methods before it can be registered via `addGenerator()`.
2. **Custom resolver**: `resolveName()` uses `camelCase` with `prefix: 'create'` and `transformers.name` callbacks. A resolver needs to be created using `defineResolver` to express this naming logic.
3. **Legacy `SchemaGenerator`/`OperationGenerator` removal**: The `buildStart()` manually creates these and calls `.build()`. The framework already handles AST walking for hook-style plugins, so this manual invocation needs to be replaced.

### plugin-msw

**Reason**: Same architecture as `plugin-faker` — uses `createReactGenerator` with React hooks and manually creates `OperationGenerator` in `buildStart()`.

**Missing features**:
1. **Generator migration**: Same as `plugin-faker` — `mswGenerator` and `handlersGenerator` use `createReactGenerator`.
2. **Custom resolver**: `resolveName()` uses `camelCase` with `suffix: 'handler'` and `transformers.name` callbacks.
3. **Legacy `OperationGenerator` removal**: Same as `plugin-faker`.

### plugin-react-query

**Reason**: Uses `createReactGenerator` with React hooks, complex `buildStart()` that fetches OAS, gets base URL, conditionally injects bundled client files, and manually creates `OperationGenerator`.

**Missing features**:
1. **Generator migration**: Generators (`queryGenerator`, `mutationGenerator`, `infiniteQueryGenerator`, etc.) use `createReactGenerator` with `Operation()` components.
2. **Custom resolver**: `resolveName()` uses `camelCase` for functions/files, `pascalCase` for types, and `transformers.name` callbacks.
3. **`getOas()` and `getBaseURL()` access**: Needed for setting `client.baseURL` at runtime.
4. **`getPlugin()` access**: Needed to check for `plugin-client` presence and conditionally inject client files.
5. **Conditional file injection**: Needs to inject bundled client/config files based on runtime plugin state. Currently `kubb:plugin:setup` can check `ctx.config.plugins` for this (as `plugin-mcp` does).

### plugin-solid-query

**Reason**: Same architecture as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-svelte-query

**Reason**: Same architecture as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-vue-query

**Reason**: Same architecture as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

### plugin-swr

**Reason**: Same architecture as `plugin-react-query`.

**Missing features**: Same as `plugin-react-query`.

## Summary of Missing Features

To migrate the remaining plugins, the following changes are needed:

### 1. Rewrite generators from `createReactGenerator` to `defineGenerator`

All remaining plugins use `createReactGenerator` with React component `Operation()` methods and hooks (`useOas`, `useDriver`, `useOperationManager`, `useSchemaManager`, `useMode`). These need to be rewritten as `defineGenerator`-style generators with `schema(node, ctx)` / `operation(node, ctx)` / `operations(nodes, ctx)` methods. This is the **primary blocker** for all 7 operation-based plugins (faker, msw, react-query, solid-query, svelte-query, vue-query, swr).

### 2. Create resolvers using `defineResolver`

Each plugin needs a resolver created with `defineResolver` that encapsulates:
- Custom naming logic (prefix/suffix, casing per type)
- `transformers.name` callback support
- Path resolution logic

### 3. `inject()` lifecycle equivalent (plugin-oas only)

Allow a hook-style plugin to contribute methods to the shared context (used by `plugin-oas` to expose `getOas()` / `getBaseURL()`).

### 4. `adapter` access for file-generating hooks (plugin-redoc only)

Provide adapter/inputNode access in a hook that also supports file injection. Currently `kubb:build:start` provides adapter but no file injection, and `kubb:plugin:setup` provides file injection but no adapter.

### 5. Runtime `getOas()` / `getBaseURL()` access (query plugins)

The query plugins need OAS and base URL info at generation time. Once generators are migrated to `defineGenerator`, this information could be provided through the generator context (`ctx`) or resolved through the adapter.

