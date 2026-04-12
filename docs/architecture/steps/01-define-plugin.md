# Step 1: `createPlugin` → `definePlugin` with `KubbEvents`

## Goal

Introduce `definePlugin` as a new plugin factory that uses **`KubbEvents` (namespaced lifecycle hooks)** instead of flat methods. `createPlugin` continues to work unchanged during the transition.

The key design: `KubbEvents` is the **type** defining lifecycle event signatures. Plugins declare their handlers via a `hooks:` property (matching Astro's naming). Internally, the **PluginDriver registers these hooks on its existing `AsyncEventEmitter`** and dispatches them via `events.emit(...)` — reusing the same event infrastructure already used for `plugin:start`, `plugin:end`, `files:processing:start`, etc.

## Scope

- `packages/core/src/definePlugin.ts` — new file
- `packages/core/src/Kubb.ts` — extend `KubbEvents` interface with new lifecycle events
- `packages/core/src/types.ts` — new hook context types
- `packages/core/src/PluginDriver.ts` — detect hook-style plugins, register hooks on emitter, dispatch via `events.emit`
- `packages/core/src/index.ts` — export `definePlugin`

## What Changes

### Extend existing `KubbEvents` in `Kubb.ts`

The existing `KubbEvents` interface already defines events like `plugin:start`, `lifecycle:start`, `error`, etc. We add the new namespaced lifecycle events to this same interface:

```ts
// packages/core/src/Kubb.ts — additions to existing KubbEvents interface

export interface KubbEvents {
  // ... existing events (plugin:start, lifecycle:start, error, debug, etc.) ...

  // NEW: Plugin lifecycle events (Astro-style)
  'kubb:setup': [ctx: KubbSetupContext]
  'kubb:config:done': [ctx: KubbConfigDoneContext]
  'kubb:build:start': [ctx: KubbBuildStartContext]
  'kubb:build:done': [ctx: KubbBuildDoneContext]
}
```

This means `events.emit('kubb:setup', ctx)` and `events.on('kubb:setup', handler)` are **fully typed** — the same `AsyncEventEmitter<KubbEvents>` that powers the existing event system now also powers the plugin lifecycle.

### New `definePlugin` function

```ts
// packages/core/src/definePlugin.ts
import type { PluginFactoryOptions } from './types.ts'

// KubbEvents is the TYPE — defines the hook signatures
type PluginKubbEvents<TOptions> = {
  'kubb:setup'?(ctx: KubbSetupContext<TOptions>): void
  'kubb:config:done'?(ctx: KubbConfigDoneContext): void
  'kubb:build:start'?(ctx: KubbBuildStartContext): void
  'kubb:build:done'?(ctx: KubbBuildDoneContext): void
}

// hooks: is the PROPERTY — matches Astro's convention
type HookStylePlugin<TOptions> = {
  name: string
  dependencies?: string[]
  hooks: PluginKubbEvents<TOptions>
}

export function definePlugin<TOptions = object>(
  factory: (options: TOptions) => HookStylePlugin<TOptions>,
): (options?: TOptions) => HookStylePlugin<TOptions> {
  return factory
}
```

### New hook context types

```ts
// Added to packages/core/src/types.ts

type KubbSetupContext<TOptions = object> = {
  addGenerator(generator: Generator): void
  setResolver(resolver: Partial<Resolver>): void
  setTransformer(visitor: Visitor): void
  setRenderer(renderer: RendererFactory): void
  injectFile(file: { baseName: string; path: string; content: string }): void
  injectBarrel(options: { type: 'named' | 'default'; path: string }): void
  updateConfig(config: Partial<Config>): void
  config: Config
  options: TOptions
  logger: Logger
}

type KubbConfigDoneContext = {
  config: Readonly<Config>
  logger: Logger
}

type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  logger: Logger
  openInStudio(options?: DevtoolsOptions): Promise<void>
  getPlugin(name: string): Plugin | undefined
}

type KubbBuildDoneContext = {
  files: FileNode[]
  config: Config
  logger: Logger
  outputDir: string
}
```

### PluginDriver changes — register hooks on `AsyncEventEmitter`, dispatch via `events.emit`

`PluginDriver` already has `events: AsyncEventEmitter<KubbEvents>`. Instead of directly calling `plugin.hooks['kubb:setup']?.(ctx)`, the driver **registers** each plugin's hooks on the emitter during plugin initialization and **dispatches** them via `events.emit(...)`:

```ts
// packages/core/src/PluginDriver.ts

function isHookStylePlugin(plugin: unknown): plugin is HookStylePlugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
}

class PluginDriver {
  // Already exists: events: AsyncEventEmitter<KubbEvents>

  /**
   * Register a hook-style plugin's lifecycle hooks on the event emitter.
   * Called once per plugin during initialization.
   */
  registerPluginHooks(plugin: HookStylePlugin) {
    const hooks = plugin.hooks

    if (hooks['kubb:setup']) {
      this.events.on('kubb:setup', (ctx) => hooks['kubb:setup']!(ctx))
    }
    if (hooks['kubb:config:done']) {
      this.events.on('kubb:config:done', (ctx) => hooks['kubb:config:done']!(ctx))
    }
    if (hooks['kubb:build:start']) {
      this.events.on('kubb:build:start', (ctx) => hooks['kubb:build:start']!(ctx))
    }
    if (hooks['kubb:build:done']) {
      this.events.on('kubb:build:done', (ctx) => hooks['kubb:build:done']!(ctx))
    }
  }

  /**
   * Dispatch a lifecycle event.
   * All registered hook-style plugins receive it via the emitter.
   */
  async runSetup(plugin: Plugin) {
    if (isHookStylePlugin(plugin)) {
      // Dispatch via events.emit — all registered kubb:setup handlers fire
      await this.events.emit('kubb:setup', {
        addGenerator: (gen) => this.registerGenerator(plugin.name, gen),
        setResolver: (res) => this.setPluginResolver(plugin.name, res),
        setTransformer: (vis) => this.setPluginTransformer(plugin.name, vis),
        setRenderer: (ren) => this.setPluginRenderer(plugin.name, ren),
        injectFile: (file) => this.fileManager.upsertFile(file),
        injectBarrel: (opts) => this.injectBarrel(plugin.name, opts),
        updateConfig: (cfg) => this.mergeConfig(cfg),
        config: this.config,
        options: plugin.options,
        logger: this.logger,
      })
    } else {
      // Legacy style: existing behavior unchanged
      // ...
    }
  }
}
```

**Why `events.emit`?** The existing `AsyncEventEmitter<KubbEvents>` already powers all of Kubb's lifecycle events (`plugin:start`, `plugin:end`, `files:processing:start`, `error`, `debug`, etc.). Using the same emitter for `kubb:setup` / `kubb:build:start` / `kubb:build:done`:

1. **Unified event system** — one emitter for everything, not two dispatch mechanisms
2. **External listeners** — CLI, devtools, and custom tooling can listen to `kubb:setup` events just like they listen to `plugin:start`
3. **Async-native** — `AsyncEventEmitter` already handles `await events.emit(...)` correctly
4. **Fully typed** — the same `KubbEvents` interface types both existing events and new lifecycle events

## What Does NOT Change

- `createPlugin` — unchanged, still works
- `defineGenerator` — unchanged
- `defineResolver` — unchanged
- All existing plugins — unchanged
- Build pipeline — unchanged (PluginDriver normalizes both formats internally)
- Existing events (`plugin:start`, `error`, `debug`, etc.) — unchanged

## Acceptance Criteria

- [ ] `definePlugin` exported from `@kubb/core`
- [ ] `KubbEvents` interface in `Kubb.ts` includes `kubb:setup`, `kubb:config:done`, `kubb:build:start`, `kubb:build:done`
- [ ] PluginDriver registers hook-style plugin handlers on `AsyncEventEmitter`
- [ ] PluginDriver dispatches lifecycle events via `events.emit('kubb:setup', ctx)`
- [ ] A plugin created with `definePlugin` can register generators via `addGenerator()` in `kubb:setup`
- [ ] A plugin created with `createPlugin` (legacy) continues to work identically
- [ ] Both styles can coexist in the same `kubb.config.ts`
- [ ] External listeners can subscribe to `events.on('kubb:setup', ...)` for tooling
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `definePlugin` creates a valid plugin object with `hooks:`
2. Add unit test: PluginDriver registers hooks on event emitter
3. Add unit test: `events.emit('kubb:setup', ctx)` calls the plugin's `kubb:setup` handler
4. Add unit test: `addGenerator()` registers generators on the plugin
5. Add integration test: mixed `definePlugin` + `createPlugin` in same config
6. Add test: external listener on `events.on('kubb:setup', ...)` receives context
7. All existing tests remain green

## Size Estimate

~250-350 lines of new code in core. No changes to any existing plugin.
