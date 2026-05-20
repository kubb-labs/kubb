import { resolve } from 'node:path'
import { type AsyncEventEmitter, URLPath } from '@internals/utils'
import type { FileNode, InputMeta, InputNode, InputStreamNode, OperationNode, SchemaNode } from '@kubb/ast'
import { createFile } from '@kubb/ast'
import { DEFAULT_STUDIO_URL, STREAM_SCHEMA_THRESHOLD } from './constants.ts'
import type { Generator } from './defineGenerator.ts'
import type { Plugin } from './definePlugin.ts'
import { getMode } from './definePlugin.ts'
import { defineResolver } from './defineResolver.ts'
import { openInStudio as openInStudioFn } from './devtools.ts'
import { FileManager } from './FileManager.ts'
import type { RendererFactory } from './createRenderer.ts'

import type {
  Adapter,
  AdapterSource,
  Config,
  DevtoolsOptions,
  GeneratorContext,
  KubbHooks,
  KubbPluginSetupContext,
  Middleware,
  NormalizedPlugin,
  PluginFactoryOptions,
  Resolver,
} from './types.ts'

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  hooks: AsyncEventEmitter<KubbHooks>
}

function enforceOrder(enforce: 'pre' | 'post' | undefined): number {
  return enforce === 'pre' ? -1 : enforce === 'post' ? 1 : 0
}

export class KubbDriver {
  readonly config: Config
  readonly options: Options

  /**
   * Returns `'single'` when `fileOrFolder` has a file extension, `'split'` otherwise.
   *
   * @example
   * ```ts
   * PluginDriver.getMode('src/gen/types.ts')  // 'single'
   * PluginDriver.getMode('src/gen/types')     // 'split'
   * ```
   */
  static getMode(fileOrFolder: string | undefined | null): 'single' | 'split' {
    return getMode(fileOrFolder)
  }

  /**
   * The universal `@kubb/ast` `InputNode` produced by the adapter, set by
   * the build pipeline after the adapter's `parse()` resolves.
   */
  inputNode: InputNode | undefined = undefined
  /**
   * Set when the adapter returns a streaming `InputStreamNode` (large specs).
   * Mutually exclusive with `inputNode` — exactly one is set after adapter setup.
   */
  inputStreamNode: InputStreamNode | undefined = undefined
  adapter: Adapter | undefined = undefined
  /**
   * The adapter source, stored so `openInStudio` can call `adapter.parse()`
   * lazily when the streaming path was used and `inputNode` was not eagerly populated.
   */
  #adapterSource: AdapterSource | undefined = undefined

  // Register middleware hooks after all plugin hooks are registered.
  // Because AsyncEventEmitter calls listeners in registration order,
  // middleware hooks for any event fire after all plugin hooks for that event.
  // Handlers are tracked so they can be removed after each build (disposeMiddleware),
  // preventing accumulation when multiple configs share the same hooks instance.
  middlewareListeners: Array<[keyof KubbHooks & string, (...args: never[]) => void | Promise<void>]> = []

  #studioIsOpen = false

  /**
   * Central file store for all generated files.
   * Plugins should use `this.addFile()` / `this.upsertFile()` (via their context) to
   * add files; this property gives direct read/write access when needed.
   */
  readonly fileManager = new FileManager()

  readonly plugins = new Map<string, NormalizedPlugin>()

  /**
   * Tracks which plugins have generators registered via `addGenerator()` (event-based path).
   * Used by the build loop to decide whether to emit generator events for a given plugin.
   */
  readonly #pluginsWithEventGenerators = new Set<string>()
  readonly #resolvers = new Map<string, Resolver>()
  readonly #defaultResolvers = new Map<string, Resolver>()
  readonly #hookListeners = new Map<keyof KubbHooks, Set<(...args: never[]) => void | Promise<void>>>()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.adapter = config.adapter
  }

  async setup() {
    const normalized: NormalizedPlugin[] = []
    const depSets = new Map<string, Set<string>>()

    for (const rawPlugin of this.config.plugins) {
      const plugin = this.#normalizePlugin(rawPlugin as Plugin)
      normalized.push(plugin)
      if (plugin.dependencies?.length) {
        depSets.set(plugin.name, new Set(plugin.dependencies))
      }
    }

    normalized.sort((a, b) => {
      if (depSets.get(b.name)?.has(a.name)) return -1
      if (depSets.get(a.name)?.has(b.name)) return 1

      return enforceOrder(a.enforce) - enforceOrder(b.enforce)
    })

    for (const plugin of normalized) {
      if (plugin.apply) {
        plugin.apply(this.config)
      }

      this.#registerPlugin(plugin)
      this.plugins.set(plugin.name, plugin)
    }

    if (this.config.middleware) {
      for (const middleware of this.config.middleware) {
        for (const event of Object.keys(middleware.hooks) as Array<keyof KubbHooks & string>) {
          this.#registerMiddleware(event, middleware.hooks)
        }
      }
    }
    if (this.config.adapter) {
      await this.#registerAdapter(this.config.adapter)
    }
  }

  get hooks() {
    return this.options.hooks
  }

  /**
   * Creates an `NormalizedPlugin` from a hook-style plugin and registers
   * its lifecycle handlers on the `AsyncEventEmitter`.
   */
  #normalizePlugin(plugin: Plugin): NormalizedPlugin {
    const normalized: NormalizedPlugin = {
      name: plugin.name,
      dependencies: plugin.dependencies,
      enforce: plugin.enforce,
      hooks: plugin.hooks,
      options: plugin.options ?? { output: { path: '.' }, exclude: [], override: [] },
    } as NormalizedPlugin

    if ('apply' in plugin && typeof plugin.apply === 'function') {
      normalized.apply = plugin.apply as (config: Config) => boolean
    }

    return normalized
  }

  async #registerAdapter(adapter: Adapter) {
    const source = inputToAdapterSource(this.config)
    this.#adapterSource = source

    if (adapter.count && adapter.stream) {
      const { schemas: schemaCount, operations: operationCount } = await adapter.count(source)

      if (schemaCount > STREAM_SCHEMA_THRESHOLD) {
        this.inputStreamNode = await adapter.stream(source)

        await this.hooks.emit('kubb:debug', {
          date: new Date(),
          logs: [
            `✓ Adapter '${adapter.name}' streaming InputStreamNode`,
            `  • Schemas: ${schemaCount} (threshold: ${STREAM_SCHEMA_THRESHOLD})`,
            `  • Operations: ${operationCount}`,
          ],
        })
      }
    }

    if (!this.inputStreamNode) {
      this.inputNode = await adapter.parse(source)

      await this.hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [
          `✓ Adapter '${adapter.name}' resolved InputNode`,
          `  • Schemas: ${this.inputNode.schemas.length}`,
          `  • Operations: ${this.inputNode.operations.length}`,
        ],
      })
    }
  }

  #registerMiddleware<K extends keyof KubbHooks & string>(event: K, middlewareHooks: Middleware['hooks']) {
    const handler = middlewareHooks[event]

    if (!handler) {
      return
    }

    this.hooks.on(event, handler)
    this.middlewareListeners.push([event, handler as (...args: never[]) => void | Promise<void>])
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * For `kubb:plugin:setup`, the registered listener wraps the globally emitted context with a
   * plugin-specific one so that `addGenerator`, `setResolver`, `setTransformer`, and
   * `setRenderer` all target the correct `normalizedPlugin` entry in the plugins map.
   *
   * All other hooks are iterated and registered directly as pass-through listeners.
   * Any event key present in the global `KubbHooks` interface can be subscribed to.
   *
   * External tooling can subscribe to any of these events via `hooks.on(...)` to observe
   * the plugin lifecycle without modifying plugin behavior.
   *
   * @internal
   */
  #registerPlugin(plugin: NormalizedPlugin): void {
    const { hooks } = plugin

    if (!hooks) return

    // kubb:plugin:setup gets special treatment: the globally emitted context is wrapped with
    // plugin-specific implementations so that addGenerator / setResolver / etc. target
    // this plugin's normalizedPlugin entry rather than being no-ops.
    if (hooks['kubb:plugin:setup']) {
      const setupHandler = (globalCtx: KubbPluginSetupContext) => {
        const pluginCtx: KubbPluginSetupContext = {
          ...globalCtx,
          options: plugin.options ?? {},
          addGenerator: (gen) => {
            this.registerGenerator(plugin.name, gen)
          },
          setResolver: (resolver) => {
            this.setPluginResolver(plugin.name, resolver)
          },
          setTransformer: (visitor) => {
            plugin.transformer = visitor
          },
          setRenderer: (renderer) => {
            plugin.renderer = renderer
          },
          setOptions: (opts) => {
            plugin.options = { ...plugin.options, ...opts }
          },
          injectFile: (userFileNode) => {
            this.fileManager.add(createFile(userFileNode))
          },
        }
        return hooks['kubb:plugin:setup']!(pluginCtx)
      }

      this.hooks.on('kubb:plugin:setup', setupHandler)
      this.#trackHookListener('kubb:plugin:setup', setupHandler as (...args: never[]) => void | Promise<void>)
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const [event, handler] of Object.entries(hooks) as Array<[keyof KubbHooks, ((...args: never[]) => void | Promise<void>) | undefined]>) {
      if (event === 'kubb:plugin:setup' || !handler) continue

      this.hooks.on(event, handler as never)
      this.#trackHookListener(event, handler as (...args: never[]) => void | Promise<void>)
    }
  }

  /**
   * Emits the `kubb:plugin:setup` event so that all registered hook-style plugin listeners
   * can configure generators, resolvers, transformers and renderers before `buildStart` runs.
   *
   * Call this once from `safeBuild` before the plugin execution loop begins.
   */
  async emitSetupHooks(): Promise<void> {
    const noop = () => {}

    await this.hooks.emit('kubb:plugin:setup', {
      config: this.config,
      options: {},
      addGenerator: noop,
      setResolver: noop,
      setTransformer: noop,
      setRenderer: noop,
      setOptions: noop,
      injectFile: noop,
      updateConfig: noop,
    })
  }

  /**
   * Registers a generator for the given plugin on the shared event emitter.
   *
   * The generator's `schema`, `operation`, and `operations` methods are registered as
   * listeners on `kubb:generate:schema`, `kubb:generate:operation`, and `kubb:generate:operations`
   * respectively. Each listener is scoped to the owning plugin via a `ctx.plugin.name` check
   * so that generators from different plugins do not cross-fire.
   *
   * The renderer resolution chain is: `generator.renderer → plugin.renderer → config.renderer`.
   * Set `generator.renderer = null` to explicitly opt out of rendering even when the plugin
   * declares a renderer.
   *
   * Call this method inside `addGenerator()` (in `kubb:plugin:setup`) to wire up a generator.
   */
  registerGenerator(pluginName: string, gen: Generator): void {
    const resolveRenderer = () => {
      const plugin = this.plugins.get(pluginName)
      return gen.renderer === null ? undefined : (gen.renderer ?? plugin?.renderer ?? this.config.renderer)
    }

    if (gen.schema) {
      const schemaHandler = async (node: SchemaNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.schema!(node, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:schema', schemaHandler)
      this.#trackHookListener('kubb:generate:schema', schemaHandler as (...args: never[]) => void | Promise<void>)
    }

    if (gen.operation) {
      const operationHandler = async (node: OperationNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operation!(node, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:operation', operationHandler)
      this.#trackHookListener('kubb:generate:operation', operationHandler as (...args: never[]) => void | Promise<void>)
    }

    if (gen.operations) {
      const operationsHandler = async (nodes: Array<OperationNode>, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operations!(nodes, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:operations', operationsHandler)
      this.#trackHookListener('kubb:generate:operations', operationsHandler as (...args: never[]) => void | Promise<void>)
    }

    this.#pluginsWithEventGenerators.add(pluginName)
  }

  /**
   * Returns `true` when at least one generator was registered for the given plugin
   * via `addGenerator()` in `kubb:plugin:setup` (event-based path).
   *
   * Used by the build loop to decide whether to walk the AST and emit generator events
   * for a plugin that has no static `plugin.generators`.
   */
  hasRegisteredGenerators(pluginName: string): boolean {
    return this.#pluginsWithEventGenerators.has(pluginName)
  }

  /**
   * Unregisters all plugin lifecycle listeners from the shared event emitter.
   * Called at the end of a build to prevent listener leaks across repeated builds.
   *
   * @internal
   */
  dispose(): void {
    for (const [event, handlers] of this.#hookListeners) {
      for (const handler of handlers) {
        this.hooks.off(event, handler as never)
      }
    }

    this.#hookListeners.clear()
    this.#pluginsWithEventGenerators.clear()
    // Release resolver closures — the driver is rebuilt for each build() call
    // so there is no value in retaining these maps after disposal.
    this.#resolvers.clear()
    this.#defaultResolvers.clear()
    // Release the parsed adapter graph and the FileNode cache once the build
    // has finished; the returned `BuildOutput.files` array still references
    // any FileNodes the caller needs to inspect.
    this.fileManager.dispose()
    this.inputNode = undefined
    this.inputStreamNode = undefined
    this.#adapterSource = undefined

    for (const [event, handler] of this.middlewareListeners) {
      this.hooks.off(event, handler as never)
    }
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  #trackHookListener(event: keyof KubbHooks, handler: (...args: never[]) => void | Promise<void>): void {
    let handlers = this.#hookListeners.get(event)
    if (!handlers) {
      handlers = new Set()
      this.#hookListeners.set(event, handlers)
    }
    handlers.add(handler)
  }

  #createDefaultResolver(pluginName: string): Resolver {
    const existingResolver = this.#defaultResolvers.get(pluginName)
    if (existingResolver) {
      return existingResolver
    }

    const resolver = defineResolver<PluginFactoryOptions>(() => ({
      name: 'default',
      pluginName,
    }))
    this.#defaultResolvers.set(pluginName, resolver)
    return resolver
  }

  /**
   * Merges `partial` with the plugin's default resolver and stores the result.
   * Also mirrors it onto `plugin.resolver` so callers using `getPlugin(name).resolver`
   * get the up-to-date resolver without going through `getResolver()`.
   */
  setPluginResolver(pluginName: string, partial: Partial<Resolver>): void {
    const defaultResolver = this.#createDefaultResolver(pluginName)
    const merged = { ...defaultResolver, ...partial }
    this.#resolvers.set(pluginName, merged)
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.resolver = merged
    }
  }

  /**
   * Returns the resolver for the given plugin.
   *
   * Resolution order: dynamic resolver set via `setPluginResolver` → static resolver on the
   * plugin → lazily created default resolver (identity name, no path transforms).
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver<TResolver extends Resolver = Resolver>(pluginName: string): TResolver
  getResolver(pluginName: string): Resolver {
    return this.#resolvers.get(pluginName) ?? this.plugins.get(pluginName)?.resolver ?? this.#createDefaultResolver(pluginName)
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: NormalizedPlugin<TOptions>): GeneratorContext<TOptions> & Record<string, unknown> {
    const driver = this

    return {
      config: driver.config,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path)
      },
      getMode(output: { path: string }): 'single' | 'split' {
        return KubbDriver.getMode(resolve(driver.config.root, driver.config.output.path, output.path))
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      requirePlugin: driver.requirePlugin.bind(driver),
      getResolver: driver.getResolver.bind(driver),
      driver,
      addFile: async (...files: Array<FileNode>) => {
        driver.fileManager.add(...files)
      },
      upsertFile: async (...files: Array<FileNode>) => {
        driver.fileManager.upsert(...files)
      },
      get meta(): InputMeta {
        return driver.inputNode?.meta ?? driver.inputStreamNode?.meta ?? { circularNames: [], enumNames: [] }
      },
      get adapter(): Adapter | undefined {
        return driver.adapter
      },
      get resolver() {
        return driver.getResolver(plugin.name)
      },
      get transformer() {
        return plugin.transformer
      },
      warn(message: string) {
        driver.hooks.emit('kubb:warn', { message })
      },
      error(error: string | Error) {
        driver.hooks.emit('kubb:error', { error: typeof error === 'string' ? new Error(error) : error })
      },
      info(message: string) {
        driver.hooks.emit('kubb:info', { message })
      },
      async openInStudio(options?: DevtoolsOptions) {
        if (!driver.config.devtools || driver.#studioIsOpen) {
          return
        }

        if (typeof driver.config.devtools !== 'object') {
          throw new Error('Devtools must be an object')
        }

        if (!driver.adapter || !driver.#adapterSource) {
          throw new Error('adapter is not defined, make sure you have set the parser in kubb.config.ts')
        }

        driver.#studioIsOpen = true

        const studioUrl = driver.config.devtools?.studioUrl ?? DEFAULT_STUDIO_URL
        // When the streaming path was taken, `inputNode` is not populated; parse lazily.
        const inputNode = driver.inputNode ?? (await driver.adapter.parse(driver.#adapterSource))

        return openInStudioFn(inputNode, studioUrl, options)
      },
    } as unknown as GeneratorContext<TOptions>
  }

  getPlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions> | undefined
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions>
  requirePlugin(pluginName: string): Plugin {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Error(`[kubb] Plugin "${pluginName}" is required but not found. Make sure it is included in your Kubb config.`)
    }
    return plugin
  }
}

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - Renderer output → rendered via the provided `rendererFactory` (e.g. JSX), files stored in `driver.fileManager`
 * - `Array<FileNode>` → added directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 *
 * Pass a `rendererFactory` (e.g. `jsxRenderer` from `@kubb/renderer-jsx`) when the result
 * may be a renderer element. Generators that only return `Array<FileNode>` do not need one.
 */
export function applyHookResult<TElement = unknown>({
  result,
  driver,
  rendererFactory,
}: {
  result: TElement | Array<FileNode> | void
  driver: KubbDriver
  rendererFactory?: RendererFactory<TElement>
}): void | Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  if (!rendererFactory) {
    return
  }

  const renderer = rendererFactory()
  if (renderer.stream) {
    for (const file of renderer.stream(result)) {
      driver.fileManager.upsert(file)
    }
    renderer.unmount()
    return
  }
  return applyAsyncRender({ renderer, result, driver })
}

async function applyAsyncRender<TElement>({
  renderer,
  result,
  driver,
}: {
  renderer: { render(el: TElement): Promise<void>; files: ReadonlyArray<FileNode>; unmount(): void }
  result: TElement
  driver: KubbDriver
}): Promise<void> {
  await renderer.render(result)
  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input
  if (!input) {
    throw new Error('[kubb] input is required when using an adapter. Provide input.path or input.data in your config.')
  }

  if ('data' in input) {
    return { type: 'data', data: input.data }
  }

  if (new URLPath(input.path).isURL) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}
