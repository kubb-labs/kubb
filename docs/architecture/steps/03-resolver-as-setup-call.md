# Step 3: Resolver as a `setResolver()` Setup Call

## Goal

Move resolver configuration from a property getter on the plugin object (`get resolver()`) to a `setResolver()` call inside the `kubb:setup` event. The framework provides a default resolver and merges user overrides.

## Depends On

- Step 1 (`definePlugin` with `KubbEvents` + `events.emit` dispatch)
- Step 2 (generator registration) — generators receive the resolved resolver via context

## Scope

- `packages/core/src/PluginDriver.ts` — resolver storage per plugin, default merging
- `packages/core/src/types.ts` — `setResolver()` type in `KubbSetupContext`
- `packages/core/src/build.ts` — pass resolver into generator context

## What Changes

### PluginDriver stores resolver per plugin

```ts
// packages/core/src/PluginDriver.ts

class PluginDriver {
  #resolvers = new Map<string, Resolver>()

  setPluginResolver(pluginName: string, partial: Partial<Resolver>) {
    // Merge with the default resolver — user only overrides what they need
    const defaultResolver = createDefaultResolver(pluginName, this.config)
    const merged = { ...defaultResolver, ...partial }
    this.#resolvers.set(pluginName, merged)
  }

  getResolver(pluginName: string): Resolver {
    // If setResolver() was never called, return the default
    return this.#resolvers.get(pluginName) ?? createDefaultResolver(pluginName, this.config)
  }
}
```

### Generator context includes the resolved resolver

```ts
// In the build loop, generators receive the resolved resolver:
const generatorContext = {
  resolver: driver.getResolver(plugin.name),
  adapter,
  inputNode,
  options: plugin.options,
  root: config.root,
  logger,
  emitFile: (...files) => driver.fileManager.upsertFile(...files),
  getPlugin: (name) => driver.getPlugin(name),
}
```

### Example: setResolver in practice

```ts
// Before (current API)
export const pluginTs = createPlugin<PluginTs>((options) => ({
  name: 'plugin-ts',
  get resolver() {
    return preset.resolver  // resolver is a property on the plugin
  },
}))

// After (new API)
export const pluginTs = definePlugin((options = {}) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ setResolver }) {
      setResolver({
        name(name, type) {
          return type === 'type' ? pascalCase(name) : camelCase(name)
        },
        // file(), path(), banner(), footer() use defaults
      })
    },
  },
}))
```

### Default resolver behavior

If a plugin never calls `setResolver()`, the framework provides a default resolver that:
- Uses the plugin's `output` config for paths
- Uses PascalCase for naming
- Generates standard banner/footer

This matches the current behavior where `getPreset` falls back to defaults.

## What Does NOT Change

- `defineResolver` — unchanged (still used to create resolver objects)
- `createPlugin` plugins — still use `get resolver()` property
- Existing plugins — not migrated in this step

## Acceptance Criteria

- [ ] `setResolver()` available in `kubb:setup` context
- [ ] Partial resolver merges with defaults (user only overrides what they need)
- [ ] Default resolver used when `setResolver()` is never called
- [ ] Generators receive the resolved resolver via `ctx.resolver`
- [ ] `ctx.resolver.name()`, `ctx.resolver.file()`, `ctx.resolver.path()` all work
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `setResolver({ name: customFn })` overrides only `name`, keeps defaults for `file`/`path`
2. Add unit test: no `setResolver()` call → default resolver is used
3. Add unit test: generator receives correct resolver in context
4. All existing tests remain green

## Size Estimate

~100-150 lines changed in core. No plugin changes.
