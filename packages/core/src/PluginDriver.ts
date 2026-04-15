import { basename, extname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { AsyncEventEmitter } from '@internals/utils'
import { isPromiseRejectedResult, transformReservedWord } from '@internals/utils'
import { createFile } from '@kubb/ast'
import type { FileNode, InputNode } from '@kubb/ast/types'
import { DEFAULT_STUDIO_URL } from './constants.ts'
import type { Generator } from './defineGenerator.ts'
import { type HookStylePlugin, isHookStylePlugin } from './definePlugin.ts'
import { defineResolver } from './defineResolver.ts'
import { openInStudio as openInStudioFn } from './devtools.ts'
import { FileManager } from './FileManager.ts'
import { applyHookResult } from './renderNode.ts'

import type {
  Adapter,
  Config,
  DevtoolsOptions,
  KubbHooks,
  KubbPluginSetupContext,
  Plugin,
  PluginContext,
  PluginFactoryOptions,
  PluginLifecycle,
  PluginLifecycleHooks,
  PluginParameter,
  PluginWithLifeCycle,
  ResolveNameParams,
  ResolvePathParams,
  Resolver,
} from './types.ts'
import { hookFirst, hookParallel, hookSeq } from './utils/executeStrategies.ts'

type RequiredPluginLifecycle = Required<PluginLifecycle>

/**
 * Hook dispatch strategy used by the `PluginDriver`.
 *
 * - `hookFirst` — stops at the first non-null result.
 * - `hookForPlugin` — calls only the matching plugin.
 * - `hookParallel` — calls all plugins concurrently.
 * - `hookSeq` — calls all plugins in order, threading the result.
 */
export type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookSeq'

type ParseResult<H extends PluginLifecycleHooks> = RequiredPluginLifecycle[H]

type SafeParseResult<H extends PluginLifecycleHooks, Result = ReturnType<ParseResult<H>>> = {
  result: Result
  plugin: Plugin
}

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  hooks?: AsyncEventEmitter<KubbHooks>
  /**
   * @default Number.POSITIVE_INFINITY
   */
  concurrency?: number
}

/**
 * Parameters accepted by `PluginDriver.getFile` to resolve a generated file descriptor.
 */
export type GetFileOptions<TOptions = object> = {
  name: string
  mode?: 'single' | 'split'
  extname: FileNode['extname']
  pluginName: string
  options?: TOptions
}

/**
 * Returns `'single'` when `fileOrFolder` has a file extension, `'split'` otherwise.
 *
 * @example
 * ```ts
 * getMode('src/gen/types.ts')  // 'single'
 * getMode('src/gen/types')     // 'split'
 * ```
 */
export function getMode(fileOrFolder: string | undefined | null): 'single' | 'split' {
  if (!fileOrFolder) {
    return 'split'
  }
  return extname(fileOrFolder) ? 'single' : 'split'
}

const hookFirstNullCheck = (state: unknown) => !!(state as SafeParseResult<'resolveName'> | null)?.result

export class PluginDriver {
  readonly config: Config
  readonly options: Options

  /**
   * The universal `@kubb/ast` `InputNode` produced by the adapter, set by
   * the build pipeline after the adapter's `parse()` resolves.
   */
  inputNode: InputNode | undefined = undefined
  adapter: Adapter | undefined = undefined
  #studioIsOpen = false

  /**
   * Central file store for all generated files.
   * Plugins should use `this.addFile()` / `this.upsertFile()` (via their context) to
   * add files; this property gives direct read/write access when needed.
   */
  readonly fileManager = new FileManager()

  readonly plugins = new Map<string, Plugin>()

  /**
   * Tracks which plugins have generators registered via `addGenerator()` (event-based path).
   * Used by the build loop to decide whether to emit generator events for a given plugin.
   */
  readonly #pluginsWithEventGenerators = new Set<string>()
  readonly #resolvers = new Map<string, Resolver>()
  readonly #defaultResolvers = new Map<string, Resolver>()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = {
      ...options,
      hooks: options.hooks,
    }
    config.plugins
      .map((rawPlugin) => {
        if (isHookStylePlugin(rawPlugin)) {
          return this.#normalizeHookStylePlugin(rawPlugin as HookStylePlugin)
        }
        return Object.assign({ buildStart() {}, buildEnd() {} }, rawPlugin) as unknown as Plugin
      })
      .filter((plugin) => {
        if (typeof plugin.apply === 'function') {
          return plugin.apply(config)
        }
        return true
      })
      .sort((a, b) => {
        if (b.dependencies?.includes(a.name)) return -1
        if (a.dependencies?.includes(b.name)) return 1
        return 0
      })
      .forEach((plugin) => {
        this.plugins.set(plugin.name, plugin)
      })
  }

  get hooks() {
    if (!this.options.hooks) {
      throw new Error('hooks are not defined')
    }
    return this.options.hooks
  }

  /**
   * Creates a `Plugin`-compatible object from a hook-style plugin and registers
   * its lifecycle handlers on the `AsyncEventEmitter`.
   *
   * The normalized plugin has an empty `buildStart` — generators registered via
   * `addGenerator()` in `kubb:plugin:setup` are stored on `normalizedPlugin.generators`
   * and used by `runPluginAstHooks` during the build.
   */
  #normalizeHookStylePlugin(hookPlugin: HookStylePlugin): Plugin {
    const generators: Plugin['generators'] = []
    // The options shape is the minimal struct required by Plugin. Hook-style plugins
    // don't participate in the legacy resolvePath/resolveName lifecycle; they use
    // generators registered via addGenerator() and resolvers set via setResolver() instead.
    // `inject` and `resolver` are required by the Plugin type but are irrelevant for hook-style
    // plugins: inject is a no-op and resolver is set dynamically via setResolver() in kubb:plugin:setup.
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
   */
  registerPluginHooks(hookPlugin: HookStylePlugin, normalizedPlugin: Plugin): void {
    const { hooks } = hookPlugin

    // kubb:plugin:setup gets special treatment: the globally emitted context is wrapped with
    // plugin-specific implementations so that addGenerator / setResolver / etc. target
    // this plugin's normalizedPlugin entry rather than being no-ops.
    if (hooks['kubb:plugin:setup']) {
      this.hooks.on('kubb:plugin:setup', (globalCtx: KubbPluginSetupContext) => {
        const pluginCtx: KubbPluginSetupContext & { options: typeof hookPlugin.options } = {
          ...globalCtx,
          options: hookPlugin.options ?? {},
          addGenerator: (gen) => {
            this.registerGenerator(normalizedPlugin.name, gen)
          },
          setResolver: (resolver) => {
            this.setPluginResolver(normalizedPlugin.name, resolver)
          },
          setTransformer: (visitor) => {
            normalizedPlugin.transformer = visitor
          },
          setRenderer: (renderer) => {
            normalizedPlugin.renderer = renderer
          },
          injectFile: (file) => {
            const fileNode = createFile({
              baseName: file.baseName,
              path: file.path,
              sources: file.sources ?? [],
              imports: [],
              exports: [],
            })
            this.fileManager.add(fileNode)
          },
        }
        return hooks['kubb:plugin:setup']!(pluginCtx)
      })
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const [event, handler] of Object.entries(hooks) as Array<[keyof KubbHooks, ((...args: never[]) => void | Promise<void>) | undefined]>) {
      if (event === 'kubb:plugin:setup' || !handler) continue
      this.hooks.on(event, handler as never)
    }
  }

  /**
   * Emits the `kubb:plugin:setup` event so that all registered hook-style plugin listeners
   * can configure generators, resolvers, transformers and renderers before `buildStart` runs.
   *
   * Call this once from `safeBuild` before the plugin execution loop begins.
   */
  async emitSetupHooks(): Promise<void> {
    await this.hooks.emit('kubb:plugin:setup', {
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
  registerGenerator(pluginName: string, gen: Generator<any>): void {
    const resolveRenderer = () => {
      const plugin = this.plugins.get(pluginName)
      return gen.renderer === null ? undefined : (gen.renderer ?? plugin?.renderer ?? this.config.renderer)
    }

    if (gen.schema) {
      this.hooks.on('kubb:generate:schema', async (node, ctx) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.schema!(node, ctx)
        await applyHookResult(result, this, resolveRenderer())
      })
    }

    if (gen.operation) {
      this.hooks.on('kubb:generate:operation', async (node, ctx) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operation!(node, ctx)
        await applyHookResult(result, this, resolveRenderer())
      })
    }

    if (gen.operations) {
      this.hooks.on('kubb:generate:operations', async (nodes, ctx) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operations!(nodes, ctx)
        await applyHookResult(result, this, resolveRenderer())
      })
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

  setPluginResolver(pluginName: string, partial: Partial<Resolver>): void {
    const defaultResolver = this.#createDefaultResolver(pluginName)
    this.#resolvers.set(pluginName, { ...defaultResolver, ...partial })
  }

  getResolver(pluginName: string): Resolver {
    const dynamicResolver = this.#resolvers.get(pluginName)
    if (dynamicResolver) {
      return dynamicResolver
    }

    const pluginResolver = this.plugins.get(pluginName)?.resolver
    if (pluginResolver) {
      return pluginResolver
    }

    return this.#createDefaultResolver(pluginName)
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: Plugin<TOptions>): PluginContext<TOptions> & Record<string, unknown> {
    const driver = this

    const baseContext = {
      config: driver.config,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path)
      },
      getMode(output: { path: string }): 'single' | 'split' {
        return getMode(resolve(driver.config.root, driver.config.output.path, output.path))
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      requirePlugin: driver.requirePlugin.bind(driver),
      driver: driver,
      addFile: async (...files: Array<FileNode>) => {
        driver.fileManager.add(...files)
      },
      upsertFile: async (...files: Array<FileNode>) => {
        driver.fileManager.upsert(...files)
      },
      get inputNode(): InputNode | undefined {
        return driver.inputNode
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
        driver.hooks.emit('kubb:warn', message)
      },
      error(error: string | Error) {
        driver.hooks.emit('kubb:error', typeof error === 'string' ? new Error(error) : error)
      },
      info(message: string) {
        driver.hooks.emit('kubb:info', message)
      },
      openInStudio(options?: DevtoolsOptions) {
        if (!driver.config.devtools || driver.#studioIsOpen) {
          return
        }

        if (typeof driver.config.devtools !== 'object') {
          throw new Error('Devtools must be an object')
        }

        if (!driver.inputNode || !driver.adapter) {
          throw new Error('adapter is not defined, make sure you have set the parser in kubb.config.ts')
        }

        driver.#studioIsOpen = true

        const studioUrl = driver.config.devtools?.studioUrl ?? DEFAULT_STUDIO_URL

        return openInStudioFn(driver.inputNode, studioUrl, options)
      },
    } as unknown as PluginContext<TOptions>

    const mergedExtras: Record<string, unknown> = {}

    for (const p of this.plugins.values()) {
      if (typeof p.inject === 'function') {
        const result = (p.inject as (this: PluginContext) => unknown).call(baseContext as unknown as PluginContext)
        if (result !== null && typeof result === 'object') {
          Object.assign(mergedExtras, result)
        }
      }
    }

    return {
      ...baseContext,
      ...mergedExtras,
    }
  }
  /**
   * @deprecated use resolvers context instead
   */
  getFile<TOptions = object>({ name, mode, extname, pluginName, options }: GetFileOptions<TOptions>): FileNode<{ pluginName: string }> {
    const resolvedName = mode ? (mode === 'single' ? '' : this.resolveName({ name, pluginName, type: 'file' })) : name

    const path = this.resolvePath({
      baseName: `${resolvedName}${extname}` as const,
      mode,
      pluginName,
      options,
    })

    if (!path) {
      throw new Error(`Filepath should be defined for resolvedName "${resolvedName}" and pluginName "${pluginName}"`)
    }

    return createFile<{ pluginName: string }>({
      path,
      baseName: basename(path) as `${string}.${string}`,
      meta: {
        pluginName,
      },
      sources: [],
      imports: [],
      exports: [],
    })
  }

  /**
   * @deprecated use resolvers context instead
   */
  resolvePath = <TOptions = object>(params: ResolvePathParams<TOptions>): string => {
    const root = resolve(this.config.root, this.config.output.path)
    const defaultPath = resolve(root, params.baseName)

    if (params.pluginName) {
      const paths = this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolvePath',
        parameters: [params.baseName, params.mode, params.options as object],
      })

      return paths?.at(0) || defaultPath
    }

    const firstResult = this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.baseName, params.mode, params.options as object],
    })

    return firstResult?.result || defaultPath
  }
  /**
   * @deprecated use resolvers context instead
   */
  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginName) {
      const names = this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolveName',
        parameters: [params.name.trim(), params.type],
      })

      return transformReservedWord(names?.at(0) ?? params.name)
    }

    const name = this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [params.name.trim(), params.type],
    })?.result

    return transformReservedWord(name ?? params.name)
  }

  /**
   * Run a specific hookName for plugin x.
   */
  async hookForPlugin<H extends PluginLifecycleHooks>({
    pluginName,
    hookName,
    parameters,
  }: {
    pluginName: string
    hookName: H
    parameters: PluginParameter<H>
  }): Promise<Array<ReturnType<ParseResult<H>> | null>> {
    const plugin = this.plugins.get(pluginName)

    if (!plugin) {
      return [null]
    }

    this.hooks.emit('kubb:plugins:hook:progress:start', {
      hookName,
      plugins: [plugin],
    })

    const result = await this.#execute<H>({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })

    this.hooks.emit('kubb:plugins:hook:progress:end', { hookName })

    return [result]
  }

  /**
   * Run a specific hookName for plugin x.
   */
  hookForPluginSync<H extends PluginLifecycleHooks>({
    pluginName,
    hookName,
    parameters,
  }: {
    pluginName: string
    hookName: H
    parameters: PluginParameter<H>
  }): Array<ReturnType<ParseResult<H>>> | null {
    const plugin = this.plugins.get(pluginName)

    if (!plugin) {
      return null
    }

    const result = this.#executeSync<H>({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })

    return result !== null ? [result] : []
  }

  /**
   * Returns the first non-null result.
   */
  async hookFirst<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<Plugin> | null
  }): Promise<SafeParseResult<H>> {
    const plugins: Array<Plugin> = []
    for (const plugin of this.plugins.values()) {
      if (hookName in plugin && (skipped ? !skipped.has(plugin) : true)) plugins.push(plugin)
    }

    this.hooks.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

    const promises = plugins.map((plugin) => {
      return async () => {
        const value = await this.#execute<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })

        return Promise.resolve({
          plugin,
          result: value,
        } as SafeParseResult<H>)
      }
    })

    const result = await hookFirst(promises, hookFirstNullCheck)

    this.hooks.emit('kubb:plugins:hook:progress:end', { hookName })

    return result
  }

  /**
   * Returns the first non-null result.
   */
  hookFirstSync<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<Plugin> | null
  }): SafeParseResult<H> | null {
    let parseResult: SafeParseResult<H> | null = null

    for (const plugin of this.plugins.values()) {
      if (!(hookName in plugin)) continue
      if (skipped?.has(plugin)) continue

      parseResult = {
        result: this.#executeSync<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        }),
        plugin,
      } as SafeParseResult<H>

      if (parseResult.result != null) break
    }

    return parseResult
  }

  /**
   * Runs all plugins in parallel based on `this.plugin` order and `dependencies` settings.
   */
  async hookParallel<H extends PluginLifecycleHooks, TOutput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<RequiredPluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOutput>[]> {
    const plugins: Array<Plugin> = []
    for (const plugin of this.plugins.values()) {
      if (hookName in plugin) plugins.push(plugin)
    }
    this.hooks.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

    const pluginStartTimes = new Map<Plugin, number>()

    const promises = plugins.map((plugin) => {
      return () => {
        pluginStartTimes.set(plugin, performance.now())
        return this.#execute({
          strategy: 'hookParallel',
          hookName,
          parameters,
          plugin,
        }) as Promise<TOutput>
      }
    })

    const results = await hookParallel(promises, this.options.concurrency)

    results.forEach((result, index) => {
      if (isPromiseRejectedResult<Error>(result)) {
        const plugin = plugins[index]

        if (plugin) {
          const startTime = pluginStartTimes.get(plugin) ?? performance.now()
          this.hooks.emit('kubb:error', result.reason, {
            plugin,
            hookName,
            strategy: 'hookParallel',
            duration: Math.round(performance.now() - startTime),
            parameters,
          })
        }
      }
    })

    this.hooks.emit('kubb:plugins:hook:progress:end', { hookName })

    return results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.push(result.value)
      }
      return acc
    }, [] as Awaited<TOutput>[])
  }

  /**
   * Chains plugins
   */
  async hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: PluginParameter<H> }): Promise<void> {
    const plugins: Array<Plugin> = []
    for (const plugin of this.plugins.values()) {
      if (hookName in plugin) plugins.push(plugin)
    }
    this.hooks.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

    const promises = plugins.map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
        })
    })

    await hookSeq(promises)

    this.hooks.emit('kubb:plugins:hook:progress:end', { hookName })
  }

  getPlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions> | undefined
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName) as Plugin | undefined
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

  /**
   * Run an async plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be either in `PluginHooks` or `OutputPluginValueHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The actual pluginObject to run.
   */
  #emitProcessingEnd<H extends PluginLifecycleHooks>({
    startTime,
    output,
    strategy,
    hookName,
    plugin,
    parameters,
  }: {
    startTime: number
    output: unknown
    strategy: Strategy
    hookName: H
    plugin: PluginWithLifeCycle
    parameters: unknown[] | undefined
  }): void {
    this.hooks.emit('kubb:plugins:hook:processing:end', {
      duration: Math.round(performance.now() - startTime),
      parameters,
      output,
      strategy,
      hookName,
      plugin,
    })
  }

  // Implementation signature
  #execute<H extends PluginLifecycleHooks>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: unknown[] | undefined
    plugin: PluginWithLifeCycle
  }): Promise<ReturnType<ParseResult<H>> | null> | null {
    const hook = plugin[hookName]

    if (!hook) {
      return null
    }

    this.hooks.emit('kubb:plugins:hook:processing:start', {
      strategy,
      hookName,
      parameters,
      plugin,
    })

    const startTime = performance.now()

    const task = (async () => {
      try {
        const output =
          typeof hook === 'function' ? await Promise.resolve((hook as (...args: unknown[]) => unknown).apply(this.getContext(plugin), parameters ?? [])) : hook

        this.#emitProcessingEnd({ startTime, output, strategy, hookName, plugin, parameters })

        return output as ReturnType<ParseResult<H>>
      } catch (error) {
        this.hooks.emit('kubb:error', error as Error, {
          plugin,
          hookName,
          strategy,
          duration: Math.round(performance.now() - startTime),
        })

        return null
      }
    })()

    return task
  }

  /**
   * Run a sync plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be in `PluginHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The actual plugin
   */
  #executeSync<H extends PluginLifecycleHooks>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: PluginParameter<H>
    plugin: PluginWithLifeCycle
  }): ReturnType<ParseResult<H>> | null {
    const hook = plugin[hookName]

    if (!hook) {
      return null
    }

    this.hooks.emit('kubb:plugins:hook:processing:start', {
      strategy,
      hookName,
      parameters,
      plugin,
    })

    const startTime = performance.now()

    try {
      const output =
        typeof hook === 'function'
          ? ((hook as (...args: unknown[]) => unknown).apply(this.getContext(plugin), parameters) as ReturnType<ParseResult<H>>)
          : (hook as ReturnType<ParseResult<H>>)

      this.#emitProcessingEnd({ startTime, output, strategy, hookName, plugin, parameters })

      return output
    } catch (error) {
      this.hooks.emit('kubb:error', error as Error, {
        plugin,
        hookName,
        strategy,
        duration: Math.round(performance.now() - startTime),
      })

      return null
    }
  }
}
