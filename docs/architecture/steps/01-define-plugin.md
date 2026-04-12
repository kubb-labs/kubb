# Step 1: `createPlugin` → `definePlugin` with Namespaced Hooks

## Goal

Introduce `definePlugin` as a new plugin factory that uses **namespaced lifecycle hooks** instead of flat methods. `createPlugin` continues to work unchanged during the transition.

## Scope

- `packages/core/src/definePlugin.ts` — new file
- `packages/core/src/types.ts` — new hook types
- `packages/core/src/PluginDriver.ts` — detect and dispatch both formats
- `packages/core/src/index.ts` — export `definePlugin`

## What Changes

### New `definePlugin` function

```ts
// packages/core/src/definePlugin.ts
import type { PluginFactoryOptions } from './types.ts'

type HookStyle<TOptions> = {
  name: string
  dependencies?: string[]
  hooks: {
    'kubb:setup'?(ctx: KubbSetupContext<TOptions>): void
    'kubb:config:done'?(ctx: KubbConfigDoneContext): void
    'kubb:build:start'?(ctx: KubbBuildStartContext): void
    'kubb:build:done'?(ctx: KubbBuildDoneContext): void
  }
}

export function definePlugin<TOptions = object>(
  factory: (options: TOptions) => HookStyle<TOptions>,
): (options?: TOptions) => HookStyle<TOptions> {
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

### PluginDriver changes

`PluginDriver` needs to detect whether a plugin uses the new `hooks` format or the legacy flat format:

```ts
// packages/core/src/PluginDriver.ts

function isHookStylePlugin(plugin: unknown): plugin is HookStylePlugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
}

// When dispatching lifecycle events:
async function runSetup(plugin: Plugin) {
  if (isHookStylePlugin(plugin)) {
    // New style: call kubb:setup with context
    plugin.hooks['kubb:setup']?.({
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
    // Legacy style: existing behavior
    // ...
  }
}
```

## What Does NOT Change

- `createPlugin` — unchanged, still works
- `defineGenerator` — unchanged
- `defineResolver` — unchanged
- All existing plugins — unchanged
- Build pipeline — unchanged (PluginDriver normalizes both formats internally)

## Acceptance Criteria

- [ ] `definePlugin` exported from `@kubb/core`
- [ ] A plugin created with `definePlugin` can register generators via `addGenerator()` in `kubb:setup`
- [ ] A plugin created with `definePlugin` can set a resolver via `setResolver()` in `kubb:setup`
- [ ] A plugin created with `createPlugin` (legacy) continues to work identically
- [ ] Both styles can coexist in the same `kubb.config.ts`
- [ ] Hook context types are exported from `@kubb/core`
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `definePlugin` creates a valid plugin object
2. Add unit test: `kubb:setup` hook receives correct context
3. Add unit test: `addGenerator()` registers generators on the plugin
4. Add integration test: mixed `definePlugin` + `createPlugin` in same config
5. All existing tests remain green

## Size Estimate

~200-300 lines of new code in core. No changes to any existing plugin.
