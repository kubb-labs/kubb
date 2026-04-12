# Step 5: `pre`/`post` → `dependencies`

## Goal

Replace the separate `pre` and `post` arrays with a single `dependencies` array for clearer plugin ordering semantics. A plugin's `dependencies` lists the plugins it needs to run **before** it — matching npm/cargo dependency semantics ("I depend on these").

## Depends On

- Step 1 (`definePlugin` with hooks) — `dependencies` is a property on the new plugin format

## Scope

- `packages/core/src/types.ts` — add `dependencies` to plugin type
- `packages/core/src/PluginDriver.ts` — topological sort using `dependencies` instead of `pre`/`post`
- `packages/core/src/build.ts` — use new ordering

## What Changes

### Plugin type gets `dependencies`

```ts
// New plugin format (definePlugin)
type HookStylePlugin = {
  name: string
  dependencies?: string[]  // NEW: plugins that must run before this one
  hooks: { ... }
}
```

### Topological sort using `dependencies`

```ts
// packages/core/src/PluginDriver.ts

function sortPlugins(plugins: Plugin[]): Plugin[] {
  // Build dependency graph from `dependencies` arrays
  // Topological sort — plugins with no dependencies first
  // Cycle detection with clear error messages
  
  const graph = new Map<string, string[]>()
  for (const plugin of plugins) {
    graph.set(plugin.name, plugin.dependencies ?? [])
  }
  
  return topologicalSort(plugins, graph)
}
```

### How `pre`/`post` map to `dependencies`

```ts
// Before
{
  name: 'plugin-client',
  pre: ['plugin-ts', 'plugin-zod'],    // these run before me
  post: ['plugin-barrel'],              // I run before this
}

// After
{
  name: 'plugin-client',
  dependencies: ['plugin-ts', 'plugin-zod'],  // I depend on these (they run first)
}
// Note: plugin-barrel would declare: dependencies: ['plugin-client']
```

The key insight: `pre` is "these run before me" (= my dependencies), while `post` is "I run before these" (= I am THEIR dependency). With `dependencies`, each plugin only declares its own needs. `post` is just the inverse — `plugin-barrel` declares its dependency on `plugin-client` instead of `plugin-client` declaring it runs before `plugin-barrel`.

### Legacy compatibility

For `createPlugin` plugins that still use `pre`/`post`:
- `PluginDriver` converts `pre` to `dependencies` internally
- `post` items are converted by adding the current plugin to those plugins' dependency lists
- Warning logged when `pre`/`post` used: "Use `dependencies` instead"

## What Does NOT Change

- Build output — same execution order, just different way to express it
- `createPlugin` — still supports `pre`/`post` (converted internally)
- All existing plugins — not changed in this step

## Acceptance Criteria

- [ ] `dependencies` array accepted on `definePlugin` plugins
- [ ] Topological sort correctly orders plugins by dependencies
- [ ] Cycle detection with clear error message
- [ ] Legacy `pre`/`post` converted to `dependencies` internally
- [ ] Missing dependency warning (if plugin depends on a plugin not in config)
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `dependencies: ['a', 'b']` ensures `a` and `b` run before the dependent
2. Add unit test: circular dependency detected and reported
3. Add unit test: legacy `pre` converted to `dependencies`
4. Add unit test: legacy `post` converted correctly (inverse mapping)
5. Add unit test: missing dependency logs a warning
6. All existing tests remain green

## Size Estimate

~100-150 lines changed in core. No plugin changes.
