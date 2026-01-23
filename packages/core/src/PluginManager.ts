import path from 'node:path'
import { performance } from 'node:perf_hooks'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Fabric } from '@kubb/react-fabric'
import { ValidationPluginError } from './errors.ts'
import { isPromiseRejectedResult, PromiseManager } from './PromiseManager.ts'
import { transformReservedWord } from './transformers/transformReservedWord.ts'
import { trim } from './transformers/trim.ts'
import type {
  Config,
  GetPluginFactoryOptions,
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
import type { AsyncEventEmitter } from './utils/AsyncEventEmitter.ts'
import { setUniqueName } from './utils/uniqueName.ts'

type RequiredPluginLifecycle = Required<PluginLifecycle>

export type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookSeq'

type ParseResult<H extends PluginLifecycleHooks> = RequiredPluginLifecycle[H]

type SafeParseResult<H extends PluginLifecycleHooks, Result = ReturnType<ParseResult<H>>> = {
  result: Result
  plugin: Plugin
}

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  fabric: Fabric
  events: AsyncEventEmitter<KubbEvents>
  /**
   * @default Number.POSITIVE_INFINITY
   */
  concurrency?: number
}

type GetFileProps<TOptions = object> = {
  name: string
  mode?: KubbFile.Mode
  extname: KubbFile.Extname
  pluginKey: Plugin['key']
  options?: TOptions
}

export function getMode(fileOrFolder: string | undefined | null): KubbFile.Mode {
  if (!fileOrFolder) {
    return 'split'
  }
  return path.extname(fileOrFolder) ? 'single' : 'split'
}

export class PluginManager {
  readonly config: Config
  readonly options: Options

  readonly #plugins = new Set<Plugin<GetPluginFactoryOptions<any>>>()
  readonly #usedPluginNames: Record<string, number> = {}
  readonly #promiseManager: PromiseManager

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.#promiseManager = new PromiseManager({
      nullCheck: (state: SafeParseResult<'resolveName'> | null) => !!state?.result,
    })
    ;[...(config.plugins || [])].forEach((plugin) => {
      const parsedPlugin = this.#parse(plugin as UserPlugin)

      this.#plugins.add(parsedPlugin)
    })

    return this
  }

  get events() {
    return this.options.events
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: Plugin<TOptions>): PluginContext<TOptions> & Record<string, any> {
    const plugins = [...this.#plugins]
    const baseContext = {
      fabric: this.options.fabric,
      config: this.config,
      plugin,
      events: this.options.events,
      pluginManager: this,
      mode: getMode(path.resolve(this.config.root, this.config.output.path)),
      addFile: async (...files: Array<KubbFile.File>) => {
        await this.options.fabric.addFile(...files)
      },
      upsertFile: async (...files: Array<KubbFile.File>) => {
        await this.options.fabric.upsertFile(...files)
      },
    } as unknown as PluginContext<TOptions>

    const mergedExtras: Record<string, any> = {}
    for (const p of plugins) {
      if (typeof p.inject === 'function') {
        const injector = p.inject.bind(baseContext as any) as any

        const result = injector(baseContext)
        if (result && typeof result === 'object') {
          Object.assign(mergedExtras, result)
        }
      }
    }

    return {
      ...baseContext,
      ...mergedExtras,
    }
  }

  get plugins(): Array<Plugin> {
    return this.#getSortedPlugins()
  }

  getFile<TOptions = object>({ name, mode, extname, pluginKey, options }: GetFileProps<TOptions>): KubbFile.File<{ pluginKey: Plugin['key'] }> {
    const baseName = `${name}${extname}` as const
    const path = this.resolvePath({ baseName, mode, pluginKey, options })

    if (!path) {
      throw new Error(`Filepath should be defined for resolvedName "${name}" and pluginKey [${JSON.stringify(pluginKey)}]`)
    }

    return {
      path,
      baseName,
      meta: {
        pluginKey,
      },
      sources: [],
      imports: [],
      exports: [],
    }
  }

  resolvePath = <TOptions = object>(params: ResolvePathParams<TOptions>): KubbFile.Path => {
    const root = path.resolve(this.config.root, this.config.output.path)
    const defaultPath = path.resolve(root, params.baseName)

    if (params.pluginKey) {
      const paths = this.hookForPluginSync({
        pluginKey: params.pluginKey,
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
    if (params.pluginKey) {
      const names = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolveName',
        parameters: [trim(params.name), params.type],
      })

      const uniqueNames = new Set(names)

      return transformReservedWord([...uniqueNames].at(0) || params.name)
    }

    const name = this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [trim(params.name), params.type],
    }).result

    return transformReservedWord(name)
  }

  /**
   * Run a specific hookName for plugin x.
   */
  async hookForPlugin<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
  }: {
    pluginKey: Plugin['key']
    hookName: H
    parameters: PluginParameter<H>
  }): Promise<Array<ReturnType<ParseResult<H>> | null>> {
    const plugins = this.getPluginsByKey(hookName, pluginKey)

    this.events.emit('plugins:hook:progress:start', {
      hookName,
      plugins,
    })

    const items: Array<ReturnType<ParseResult<H>>> = []

    for (const plugin of plugins) {
      const result = await this.#execute<H>({
        strategy: 'hookFirst',
        hookName,
        parameters,
        plugin,
      })

      if (result !== undefined && result !== null) {
        items.push(result)
      }
    }

    this.events.emit('plugins:hook:progress:end', { hookName })

    return items
  }
  /**
   * Run a specific hookName for plugin x.
   */

  hookForPluginSync<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
  }: {
    pluginKey: Plugin['key']
    hookName: H
    parameters: PluginParameter<H>
  }): Array<ReturnType<ParseResult<H>>> | null {
    const plugins = this.getPluginsByKey(hookName, pluginKey)

    const result = plugins
      .map((plugin) => {
        return this.#executeSync<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })
      })
      .filter(Boolean)

    return result
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
      return skipped ? skipped.has(plugin) : true
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

    const result = await this.#promiseManager.run('first', promises)

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
  }): SafeParseResult<H> {
    let parseResult: SafeParseResult<H> = null as unknown as SafeParseResult<H>
    const plugins = this.#getSortedPlugins(hookName).filter((plugin) => {
      return skipped ? skipped.has(plugin) : true
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

    const promises = plugins.map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookParallel',
          hookName,
          parameters,
          plugin,
        }) as Promise<TOutput>
    })

    const results = await this.#promiseManager.run('parallel', promises, {
      concurrency: this.options.concurrency,
    })

    results.forEach((result, index) => {
      if (isPromiseRejectedResult<Error>(result)) {
        const plugin = this.#getSortedPlugins(hookName)[index]

        if (plugin) {
          this.events.emit('error', result.reason, {
            plugin,
            hookName,
            strategy: 'hookParallel',
            duration: 0,
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

    await this.#promiseManager.run('seq', promises)

    this.events.emit('plugins:hook:progress:end', { hookName })
  }

  #getSortedPlugins(hookName?: keyof PluginLifecycle): Array<Plugin> {
    const plugins = [...this.#plugins]

    if (hookName) {
      return plugins.filter((plugin) => hookName in plugin)
    }
    // TODO add test case for sorting with pre/post

    return plugins
      .map((plugin) => {
        if (plugin.pre) {
          const missingPlugins = plugin.pre.filter((pluginName) => !plugins.find((pluginToFind) => pluginToFind.name === pluginName))

          if (missingPlugins.length > 0) {
            throw new ValidationPluginError(`The plugin '${plugin.name}' has a pre set that references missing plugins for '${missingPlugins.join(', ')}'`)
          }
        }

        return plugin
      })
      .sort((a, b) => {
        if (b.pre?.includes(a.name)) {
          return 1
        }
        if (b.post?.includes(a.name)) {
          return -1
        }
        return 0
      })
  }

  getPluginByKey(pluginKey: Plugin['key']): Plugin | undefined {
    const plugins = [...this.#plugins]
    const [searchPluginName] = pluginKey

    return plugins.find((item) => {
      const [name] = item.key

      return name === searchPluginName
    })
  }

  getPluginsByKey(hookName: keyof PluginWithLifeCycle, pluginKey: Plugin['key']): Plugin[] {
    const plugins = [...this.plugins]
    const [searchPluginName, searchIdentifier] = pluginKey

    const pluginByPluginName = plugins
      .filter((plugin) => hookName in plugin)
      .filter((item) => {
        const [name, identifier] = item.key

        const identifierCheck = identifier?.toString() === searchIdentifier?.toString()
        const nameCheck = name === searchPluginName

        if (searchIdentifier) {
          return identifierCheck && nameCheck
        }

        return nameCheck
      })

    if (!pluginByPluginName?.length) {
      // fallback on the core plugin when there is no match

      const corePlugin = plugins.find((plugin) => plugin.name === 'core' && hookName in plugin)
      // Removed noisy debug logs for missing hooks - these are expected behavior, not errors

      return corePlugin ? [corePlugin] : []
    }

    return pluginByPluginName
  }

  /**
   * Run an async plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be either in `PluginHooks` or `OutputPluginValueHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The actual pluginObject to run.
   */
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
    let output: unknown

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
        if (typeof hook === 'function') {
          const context = this.getContext(plugin)
          const result = await Promise.resolve((hook as Function).apply(context, parameters))

          output = result

          this.events.emit('plugins:hook:processing:end', {
            duration: Math.round(performance.now() - startTime),
            parameters,
            output,
            strategy,
            hookName,
            plugin,
          })

          return result
        }

        output = hook

        this.events.emit('plugins:hook:processing:end', {
          duration: Math.round(performance.now() - startTime),
          parameters,
          output,
          strategy,
          hookName,
          plugin,
        })

        return hook
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
   * @param replaceContext When passed, the plugin context can be overridden.
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
    let output: unknown

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
      if (typeof hook === 'function') {
        const context = this.getContext(plugin)
        const fn = (hook as Function).apply(context, parameters) as ReturnType<ParseResult<H>>

        output = fn

        this.events.emit('plugins:hook:processing:end', {
          duration: Math.round(performance.now() - startTime),
          parameters,
          output,
          strategy,
          hookName,
          plugin,
        })

        return fn
      }

      output = hook

      this.events.emit('plugins:hook:processing:end', {
        duration: Math.round(performance.now() - startTime),
        parameters,
        output,
        strategy,
        hookName,
        plugin,
      })

      return hook
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
    const usedPluginNames = this.#usedPluginNames

    setUniqueName(plugin.name, usedPluginNames)

    return {
      install() {},
      ...plugin,
      key: [plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [typeof plugin.name, string],
    } as unknown as Plugin
  }
}
