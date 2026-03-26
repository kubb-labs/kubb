import { basename, extname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { AsyncEventEmitter } from '@internals/utils'
import { isPromiseRejectedResult, transformReservedWord, ValidationPluginError } from '@internals/utils'
import type { RootNode } from '@kubb/ast/types'
import type { FabricFile, Fabric as FabricType } from '@kubb/fabric-core/types'
import { DEFAULT_STUDIO_URL } from './constants.ts'
import { openInStudio as openInStudioFn } from './devtools.ts'

import type {
  Adapter,
  Config,
  DevtoolsOptions,
  KubbEvents,
  Plugin,
  PluginContext,
  PluginFactoryOptions,
  PluginLifecycle,
  PluginLifecycleHooks,
  PluginParameter,
  PluginWithLifeCycle,
  ResolveNameParams,
  ResolvePathParams,
  UserPlugin,
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
  fabric: FabricType
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
  mode?: FabricFile.Mode
  extname: FabricFile.Extname
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
export function getMode(fileOrFolder: string | undefined | null): FabricFile.Mode {
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
   * The universal `@kubb/ast` `RootNode` produced by the adapter, set by
   * the build pipeline after the adapter's `parse()` resolves.
   */
  rootNode: RootNode | undefined = undefined
  adapter: Adapter | undefined = undefined
  #studioIsOpen = false

  readonly plugins = new Map<string, Plugin>()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    ;[...config.plugins]
      .map((plugin) => this.#parse(plugin as UserPlugin))
      .sort((a, b) => {
        if (b.pre?.includes(a.name)) return 1
        if (b.post?.includes(a.name)) return -1
        return 0
      })
      .forEach((plugin) => {
        this.plugins.set(plugin.name, plugin)
      })
  }

  get events() {
    return this.options.events
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: Plugin<TOptions>): PluginContext<TOptions> & Record<string, unknown> {
    const driver = this

    const baseContext = {
      fabric: this.options.fabric,
      config: this.config,
      plugin,
      events: this.options.events,
      driver: this,
      mode: getMode(resolve(this.config.root, this.config.output.path)),
      addFile: async (...files: Array<FabricFile.File>) => {
        await this.options.fabric.addFile(...files)
      },
      upsertFile: async (...files: Array<FabricFile.File>) => {
        await this.options.fabric.upsertFile(...files)
      },
      get rootNode(): RootNode | undefined {
        return driver.rootNode
      },
      get adapter(): Adapter | undefined {
        return driver.adapter
      },
      openInStudio(options?: DevtoolsOptions) {
        if (!driver.config.devtools || driver.#studioIsOpen) {
          return
        }

        if (typeof driver.config.devtools !== 'object') {
          throw new Error('Devtools must be an object')
        }

        if (!driver.rootNode || !driver.adapter) {
          throw new Error('adapter is not defined, make sure you have set the parser in kubb.config.ts')
        }

        driver.#studioIsOpen = true

        const studioUrl = driver.config.devtools?.studioUrl ?? DEFAULT_STUDIO_URL

        return openInStudioFn(driver.rootNode, studioUrl, options)
      },
    } as unknown as PluginContext<TOptions>

    const mergedExtras: Record<string, unknown> = {}

    for (const [_pluginName, plugin] of this.plugins) {
      if (typeof plugin.inject === 'function') {
        const result = (plugin.inject as (this: PluginContext, context: PluginContext) => unknown).call(
          baseContext as unknown as PluginContext,
          baseContext as unknown as PluginContext,
        )
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

  getFile<TOptions = object>({ name, mode, extname, pluginName, options }: GetFileOptions<TOptions>): FabricFile.File<{ pluginName: string }> {
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

    return {
      path,
      baseName: basename(path) as FabricFile.File['baseName'],
      meta: {
        pluginName,
      },
      sources: [],
      imports: [],
      exports: [],
    }
  }

  resolvePath = <TOptions = object>(params: ResolvePathParams<TOptions>): FabricFile.Path => {
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
  //TODO refactor by using the order of plugins and the cache of the fileManager instead of guessing and recreating the name/path
  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginName) {
      const names = this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolveName',
        parameters: [params.name.trim(), params.type],
      })

      const uniqueNames = new Set(names)

      return transformReservedWord([...uniqueNames].at(0) || params.name)
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
      throw new Error(`Plugin "${pluginName}" not found.`)
    }

    this.events.emit('plugins:hook:progress:start', {
      hookName,
      plugins: [plugin],
    })

    const result = await this.#execute<H>({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })

    this.events.emit('plugins:hook:progress:end', { hookName })

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
      throw new Error(`Plugin "${pluginName}" not found.`)
    }

    const result = this.#executeSync<H>({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })

    return [result].filter(Boolean)
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
    const plugins = this.#getSortedPlugins(hookName).filter((plugin) => {
      return skipped ? !skipped.has(plugin) : true
    })

    this.events.emit('plugins:hook:progress:start', { hookName, plugins })

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

    this.events.emit('plugins:hook:progress:end', { hookName })

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
    const plugins = this.#getSortedPlugins(hookName).filter((plugin) => {
      return skipped ? !skipped.has(plugin) : true
    })

    for (const plugin of plugins) {
      parseResult = {
        result: this.#executeSync<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        }),
        plugin,
      } as SafeParseResult<H>

      if (parseResult?.result != null) {
        break
      }
    }

    return parseResult
  }

  /**
   * Runs all plugins in parallel based on `this.plugin` order and `pre`/`post` settings.
   */
  async hookParallel<H extends PluginLifecycleHooks, TOutput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<RequiredPluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOutput>[]> {
    const plugins = this.#getSortedPlugins(hookName)
    this.events.emit('plugins:hook:progress:start', { hookName, plugins })

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
        const plugin = this.#getSortedPlugins(hookName)[index]

        if (plugin) {
          const startTime = pluginStartTimes.get(plugin) ?? performance.now()
          this.events.emit('error', result.reason, {
            plugin,
            hookName,
            strategy: 'hookParallel',
            duration: Math.round(performance.now() - startTime),
            parameters,
          })
        }
      }
    })

    this.events.emit('plugins:hook:progress:end', { hookName })

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
    const plugins = this.#getSortedPlugins(hookName)
    this.events.emit('plugins:hook:progress:start', { hookName, plugins })

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

    this.events.emit('plugins:hook:progress:end', { hookName })
  }

  #getSortedPlugins(hookName?: keyof PluginLifecycle): Array<Plugin> {
    if (hookName) {
      return [...this.plugins.values()].filter((plugin) => hookName in plugin)
    }

    // Validate pre dependencies at runtime (adapter may be set after construction)
    for (const [_pluginName, plugin] of this.plugins) {
      if (plugin.pre) {
        let missingPlugins = plugin.pre.filter((pluginName) => !this.plugins.has(pluginName))

        // when adapter is set, we can ignore the depends on plugin-oas, in v5 this will not be needed anymore
        if (missingPlugins.includes('plugin-oas') && this.adapter) {
          missingPlugins = missingPlugins.filter((pluginName) => pluginName !== 'plugin-oas')
        }

        if (missingPlugins.length > 0) {
          throw new ValidationPluginError(`The plugin '${plugin.name}' has a pre set that references missing plugins for '${missingPlugins.join(', ')}'`)
        }
      }
    }

    return [...this.plugins.values()]
  }

  getPluginByName<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions> | undefined {
    return this.plugins.get(pluginName) as Plugin<TOptions> | undefined
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
    this.events.emit('plugins:hook:processing:end', {
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

    this.events.emit('plugins:hook:processing:start', {
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
        this.events.emit('error', error as Error, {
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

    this.events.emit('plugins:hook:processing:start', {
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
      this.events.emit('error', error as Error, {
        plugin,
        hookName,
        strategy,
        duration: Math.round(performance.now() - startTime),
      })

      return null
    }
  }

  #parse(plugin: UserPlugin): Plugin {
    return {
      install() {},
      ...plugin,
    } as unknown as Plugin
  }
}
