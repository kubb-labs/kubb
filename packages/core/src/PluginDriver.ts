import { basename, extname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { AsyncEventEmitter } from '@internals/utils'
import { isPromiseRejectedResult, transformReservedWord } from '@internals/utils'
import { createFile } from '@kubb/ast'
import type { FileNode, InputNode } from '@kubb/ast/types'
import { DEFAULT_STUDIO_URL } from './constants.ts'
import { type HookStylePlugin, isHookStylePlugin } from './definePlugin.ts'
import { openInStudio as openInStudioFn } from './devtools.ts'
import { FileManager } from './FileManager.ts'

import type {
  Adapter,
  Config,
  DevtoolsOptions,
  KubbEvents,
  KubbSetupContext,
  Plugin,
  PluginContext,
  PluginFactoryOptions,
  PluginLifecycle,
  PluginLifecycleHooks,
  PluginParameter,
  PluginWithLifeCycle,
  ResolveNameParams,
  ResolvePathParams,
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
  events: AsyncEventEmitter<KubbEvents>
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

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
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

  get events() {
    return this.options.events
  }

  /**
   * Creates a `Plugin`-compatible object from a hook-style plugin and registers
   * its lifecycle handlers on the `AsyncEventEmitter`.
   *
   * The normalized plugin has an empty `buildStart` — generators registered via
   * `addGenerator()` in `kubb:setup` are stored on `normalizedPlugin.generators`
   * and used by `runPluginAstHooks` during the build.
   */
  #normalizeHookStylePlugin(hookPlugin: HookStylePlugin): Plugin {
    const generators: Plugin['generators'] = []
    // The options shape is the minimal struct required by Plugin. Hook-style plugins
    // don't participate in the legacy resolvePath/resolveName lifecycle; they use
    // generators registered via addGenerator() and resolvers set via setResolver() instead.
    const normalizedPlugin: Plugin = {
      name: hookPlugin.name,
      dependencies: hookPlugin.dependencies,
      options: { output: { path: '.' }, exclude: [], override: [] },
      generators,
      buildStart() {},
      buildEnd() {},
    }
    this.registerPluginHooks(hookPlugin, normalizedPlugin)
    return normalizedPlugin
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * For `kubb:setup`, the registered listener wraps the globally emitted context with a
   * plugin-specific one so that `addGenerator`, `setResolver`, `setTransformer`, and
   * `setRenderer` all target the correct `normalizedPlugin` entry in the plugins map.
   *
   * All other hooks (`kubb:config:end`, `kubb:build:start`, `kubb:build:done`) are
   * registered directly as pass-through listeners.
   *
   * External tooling can subscribe to any of these events via `events.on(...)` to observe
   * the plugin lifecycle without modifying plugin behaviour.
   */
  registerPluginHooks(hookPlugin: HookStylePlugin, normalizedPlugin: Plugin): void {
    const { hooks } = hookPlugin

    if (hooks['kubb:setup']) {
      this.events.on('kubb:setup', (globalCtx: KubbSetupContext) => {
        const pluginCtx: KubbSetupContext & { options: typeof hookPlugin.options } = {
          ...globalCtx,
          options: hookPlugin.options ?? {},
          addGenerator: (gen) => {
            normalizedPlugin.generators = normalizedPlugin.generators ?? []
            normalizedPlugin.generators.push(gen)
          },
          setResolver: (resolver) => {
            normalizedPlugin.resolver = resolver as Plugin['resolver']
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
        return hooks['kubb:setup']!(pluginCtx)
      })
    }

    if (hooks['kubb:config:end']) {
      this.events.on('kubb:config:end', hooks['kubb:config:end'])
    }

    if (hooks['kubb:build:start']) {
      this.events.on('kubb:build:start', hooks['kubb:build:start'])
    }

    if (hooks['kubb:build:done']) {
      this.events.on('kubb:build:done', hooks['kubb:build:done'])
    }
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
      events: driver.options.events,
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
        return plugin.resolver
      },
      get transformer() {
        return plugin.transformer
      },
      warn(message: string) {
        driver.events.emit('kubb:warn', message)
      },
      error(error: string | Error) {
        driver.events.emit('kubb:error', typeof error === 'string' ? new Error(error) : error)
      },
      info(message: string) {
        driver.events.emit('kubb:info', message)
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

    this.events.emit('kubb:plugins:hook:progress:start', {
      hookName,
      plugins: [plugin],
    })

    const result = await this.#execute<H>({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })

    this.events.emit('kubb:plugins:hook:progress:end', { hookName })

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

    this.events.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

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

    this.events.emit('kubb:plugins:hook:progress:end', { hookName })

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
    this.events.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

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
          this.events.emit('kubb:error', result.reason, {
            plugin,
            hookName,
            strategy: 'hookParallel',
            duration: Math.round(performance.now() - startTime),
            parameters,
          })
        }
      }
    })

    this.events.emit('kubb:plugins:hook:progress:end', { hookName })

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
    this.events.emit('kubb:plugins:hook:progress:start', { hookName, plugins })

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

    this.events.emit('kubb:plugins:hook:progress:end', { hookName })
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
    this.events.emit('kubb:plugins:hook:processing:end', {
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

    this.events.emit('kubb:plugins:hook:processing:start', {
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
        this.events.emit('kubb:error', error as Error, {
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

    this.events.emit('kubb:plugins:hook:processing:start', {
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
      this.events.emit('kubb:error', error as Error, {
        plugin,
        hookName,
        strategy,
        duration: Math.round(performance.now() - startTime),
      })

      return null
    }
  }
}
