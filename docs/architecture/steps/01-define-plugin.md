# Step 1: `createPlugin` → `definePlugin` with `KubbEvents` ✅ IMPLEMENTED

> **Status: Complete** — Merged into `main`. See `packages/core/src/definePlugin.ts`, `packages/core/src/Kubb.ts`, `packages/core/src/PluginDriver.ts`, `packages/core/src/types.ts`.

## Goal

Introduce `definePlugin` as a new plugin factory that uses **`KubbEvents` (namespaced lifecycle hooks)** instead of flat methods. `createPlugin` continues to work unchanged during the transition.

The key design: `KubbEvents` is the **shared interface** defining all lifecycle event signatures (tuple-style for `AsyncEventEmitter`). `PluginHooks<TOptions>` is a mapped type that derives optional callback-style handlers from `KubbEvents`. Plugins declare their handlers via a `hooks:` property (matching Astro's naming). Internally, the **PluginDriver registers these hooks on its existing `AsyncEventEmitter`** and dispatches them via `events.emit(...)` — reusing the same event infrastructure already used for `kubb:plugin:start`, `kubb:plugin:end`, `kubb:files:processing:start`, etc.

## Files Changed

- `packages/core/src/definePlugin.ts` — new file with `PluginHooks<T>`, `HookStylePlugin<T>`, `isHookStylePlugin()`, and `definePlugin()`
- `packages/core/src/Kubb.ts` — `KubbEvents` interface extended with `kubb:plugin:setup`, `kubb:build:start`, `kubb:build:end`
- `packages/core/src/types.ts` — new `KubbPluginSetupContext`, `KubbBuildStartContext`, `KubbBuildEndContext` types
- `packages/core/src/PluginDriver.ts` — `#normalizeHookStylePlugin()`, `registerPluginHooks()`, `emitSetupHooks()`, dependency-based sorting
- `packages/core/src/build.ts` — calls `driver.emitSetupHooks()` before build loop, emits `kubb:build:start` and `kubb:build:end`
- `packages/core/src/index.ts` — exports `definePlugin`
- `packages/core/src/definePlugin.test.ts` — comprehensive test suite
- `internals/utils/src/asyncEventEmitter.ts` — added `listenerCount()` method

## What Was Implemented

### `KubbEvents` in `Kubb.ts`

The existing `KubbEvents` interface was extended with three new lifecycle events following the `kubb:` namespace convention:

```ts
// packages/core/src/Kubb.ts

export interface KubbEvents {
  // ... existing events (kubb:lifecycle:start, kubb:plugin:start, kubb:error, kubb:debug, etc.) ...

  // NEW: Plugin lifecycle events (Astro-style)
  'kubb:plugin:setup': [ctx: KubbPluginSetupContext]
  'kubb:build:start': [ctx: KubbBuildStartContext]
  'kubb:build:end': [ctx: KubbBuildEndContext]
}
```

All events follow the `kubb:` prefix convention established by the existing events. `events.emit('kubb:plugin:setup', ctx)` and `events.on('kubb:plugin:setup', handler)` are **fully typed** via the shared `AsyncEventEmitter<KubbEvents>`.

### `PluginHooks<T>` — derived from `KubbEvents`

Rather than defining a separate type, `PluginHooks<TOptions>` is a **mapped type** that converts every event in `KubbEvents` into an optional callback. The `kubb:plugin:setup` event is special-cased to extend the context with the plugin's own `options` type:

```ts
// packages/core/src/definePlugin.ts

export type PluginHooks<TOptions = object> = {
  [K in keyof KubbEvents]?: K extends 'kubb:plugin:setup'
    ? (ctx: KubbPluginSetupContext & { options: TOptions }) => void | Promise<void>
    : (...args: KubbEvents[K]) => void | Promise<void>
}
```

This means **any event** from the global `KubbEvents` can be subscribed to in a plugin's `hooks:` — not just the three lifecycle events, but also `kubb:error`, `kubb:debug`, `kubb:plugin:start`, etc.

### `HookStylePlugin<T>` and `definePlugin()`

```ts
// packages/core/src/definePlugin.ts

export type HookStylePlugin<TOptions = object> = {
  name: string
  dependencies?: Array<string>
  options?: TOptions
  hooks: PluginHooks<TOptions>
}

export function isHookStylePlugin(plugin: unknown): plugin is HookStylePlugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
}

export function definePlugin<TOptions = object>(
  factory: (options: TOptions) => HookStylePlugin<TOptions>,
): (options?: TOptions) => HookStylePlugin<TOptions> {
  return (options) => factory(options ?? ({} as TOptions))
}
```

### Hook context types

```ts
// packages/core/src/types.ts

export type KubbPluginSetupContext = {
  addGenerator(generator: Generator): void
  setResolver(resolver: Partial<Resolver>): void
  setTransformer(visitor: Visitor): void
  setRenderer(renderer: RendererFactory): void
  injectFile(file: Pick<FileNode, 'baseName' | 'path'> & { sources?: FileNode['sources'] }): void
  updateConfig(config: Partial<Config>): void
  config: Config
  options: object
}

export type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  getPlugin(name: string): Plugin | undefined
}

export type KubbBuildEndContext = {
  files: Array<FileNode>
  config: Config
  outputDir: string
}
```

### PluginDriver — register hooks on `AsyncEventEmitter`, dispatch via `events.emit`

`PluginDriver` detects hook-style plugins during initialization, normalizes them into the `Plugin` format, and registers their hooks on the shared emitter:

```ts
// packages/core/src/PluginDriver.ts

class PluginDriver {
  constructor(config, options) {
    config.plugins.map((rawPlugin) => {
      if (isHookStylePlugin(rawPlugin)) {
        return this.#normalizeHookStylePlugin(rawPlugin as HookStylePlugin)
      }
      return Object.assign({ buildStart() {}, buildEnd() {} }, rawPlugin)
    })
    // ... filter, sort by dependencies, store in plugins Map
  }

  #normalizeHookStylePlugin(hookPlugin: HookStylePlugin): Plugin {
    const generators: Plugin['generators'] = []
    const normalizedPlugin = {
      name: hookPlugin.name,
      dependencies: hookPlugin.dependencies,
      options: { output: { path: '.' }, exclude: [], override: [] },
      generators,
      inject: () => undefined,
      buildStart() {},
      buildEnd() {},
    } as unknown as Plugin
    this.registerPluginHooks(hookPlugin, normalizedPlugin)
    return normalizedPlugin
  }

  registerPluginHooks(hookPlugin: HookStylePlugin, normalizedPlugin: Plugin): void {
    const { hooks } = hookPlugin

    // kubb:plugin:setup gets special treatment: the globally emitted context is
    // wrapped with plugin-specific implementations
    if (hooks['kubb:plugin:setup']) {
      this.events.on('kubb:plugin:setup', (globalCtx: KubbPluginSetupContext) => {
        const pluginCtx = {
          ...globalCtx,
          options: hookPlugin.options ?? {},
          addGenerator: (gen) => {
            normalizedPlugin.generators = normalizedPlugin.generators ?? []
            normalizedPlugin.generators.push(gen)
          },
          setResolver: (resolver) => { normalizedPlugin.resolver = resolver },
          setTransformer: (visitor) => { normalizedPlugin.transformer = visitor },
          setRenderer: (renderer) => { normalizedPlugin.renderer = renderer },
          injectFile: (file) => { this.fileManager.add(createFile(file)) },
        }
        return hooks['kubb:plugin:setup']!(pluginCtx)
      })
    }

    // All other hooks registered as direct pass-through listeners
    for (const [event, handler] of Object.entries(hooks)) {
      if (event === 'kubb:plugin:setup' || !handler) continue
      this.events.on(event, handler)
    }
  }

  async emitSetupHooks(): Promise<void> {
    await this.events.emit('kubb:plugin:setup', {
      config: this.config,
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })
  }
}
```

### Build loop integration

```ts
// packages/core/src/build.ts

// 1. Emit setup hooks before the build loop
await driver.emitSetupHooks()

// 2. Emit kubb:build:start (adapter and inputNode available)
if (driver.adapter && driver.inputNode) {
  await events.emit('kubb:build:start', {
    config,
    adapter: driver.adapter,
    inputNode: driver.inputNode,
    getPlugin: (name) => driver.getPlugin(name),
  })
}

// 3. ... plugin execution loop ...

// 4. Emit kubb:build:end after all files written
await events.emit('kubb:build:end', {
  files,
  config,
  outputDir: resolve(config.root, config.output.path),
})
```

**Why `events.emit`?** The existing `AsyncEventEmitter<KubbEvents>` already powers all of Kubb's lifecycle events. Using the same emitter for `kubb:plugin:setup` / `kubb:build:start` / `kubb:build:end`:

1. **Unified event system** — one emitter for everything, not two dispatch mechanisms
2. **External listeners** — CLI, devtools, and custom tooling can listen to `kubb:plugin:setup` events just like they listen to `kubb:plugin:start`
3. **Async-native** — `AsyncEventEmitter` already handles `await events.emit(...)` correctly
4. **Fully typed** — the same `KubbEvents` interface types both existing events and new lifecycle events

## What Does NOT Change

- `createPlugin` — unchanged, still works
- `defineGenerator` — unchanged
- `defineResolver` — unchanged
- All existing plugins — unchanged
- Build pipeline — unchanged (PluginDriver normalizes both formats internally)
- Existing events (`kubb:plugin:start`, `kubb:error`, `kubb:debug`, etc.) — unchanged

## Acceptance Criteria

- [x] `definePlugin` exported from `@kubb/core`
- [x] `KubbEvents` interface in `Kubb.ts` includes `kubb:plugin:setup`, `kubb:build:start`, `kubb:build:end`
- [x] `PluginHooks<TOptions>` derived from `KubbEvents` via mapped type (any event subscribable)
- [x] PluginDriver registers hook-style plugin handlers on `AsyncEventEmitter`
- [x] PluginDriver dispatches lifecycle events via `events.emit('kubb:plugin:setup', ctx)`
- [x] `kubb:plugin:setup` context wraps global context with plugin-specific `addGenerator`, `setResolver`, etc.
- [x] A plugin created with `definePlugin` can register generators via `addGenerator()` in `kubb:plugin:setup`
- [x] Plugin `options` forwarded via `ctx.options` (strongly typed)
- [x] A plugin created with `createPlugin` (legacy) continues to work identically
- [x] Both styles can coexist in the same `kubb.config.ts`
- [x] External listeners can subscribe to `events.on('kubb:plugin:setup', ...)` for tooling
- [x] Existing tests pass unchanged
- [x] `AsyncEventEmitter` has `listenerCount()` method for testing

## Test Coverage

All tests in `packages/core/src/definePlugin.test.ts`:

1. ✅ `definePlugin` creates a valid plugin object with `hooks:` and typed `options`
2. ✅ Uses empty object as default options when none provided
3. ✅ `isHookStylePlugin` returns `true` for `definePlugin` output, `false` for `createPlugin`
4. ✅ PluginDriver registers hook-style plugin in the plugins map
5. ✅ PluginDriver registers `kubb:plugin:setup` handler on event emitter (verified via `listenerCount`)
6. ✅ `events.emit('kubb:plugin:setup', ctx)` calls the plugin's handler
7. ✅ `addGenerator()` registers generators on the normalized plugin
8. ✅ Plugin options forwarded via `ctx.options`
9. ✅ External listeners receive `kubb:plugin:setup` context
10. ✅ Mixed `createPlugin` + `definePlugin` coexist in same config
