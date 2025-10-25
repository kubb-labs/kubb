import type { App } from '@kubb/fabric-core'
import { ValidationPluginError } from './errors.ts'
import type { KubbFile } from './fs/index.ts'
import type { Logger } from './logger.ts'
import { isPromiseRejectedResult, PromiseManager } from './PromiseManager.ts'
import type { PluginCore } from './plugin.ts'
import { pluginCore } from './plugin.ts'
import { transformReservedWord } from './transformers/transformReservedWord.ts'
import { trim } from './transformers/trim.ts'
import type {
  Config,
  GetPluginFactoryOptions,
  Plugin,
  PluginFactoryOptions,
  PluginLifecycle,
  PluginLifecycleHooks,
  PluginParameter,
  PluginWithLifeCycle,
  ResolveNameParams,
  ResolvePathParams,
  UserPlugin,
  UserPluginWithLifeCycle,
} from './types.ts'
import { EventEmitter } from './utils/EventEmitter.ts'
import { setUniqueName } from './utils/uniqueName.ts'

type RequiredPluginLifecycle = Required<PluginLifecycle>

type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookSeq'

type Executer<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  message: string
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: unknown[] | undefined
  output?: unknown
}

type ParseResult<H extends PluginLifecycleHooks> = RequiredPluginLifecycle[H]

type SafeParseResult<H extends PluginLifecycleHooks, Result = ReturnType<ParseResult<H>>> = {
  result: Result
  plugin: Plugin
}

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  app: App
  logger: Logger
  /**
   * @default Number.POSITIVE_INFINITY
   */
  concurrency?: number
}

type Events = {
  executing: [executer: Executer]
  executed: [executer: Executer]
  error: [error: Error]
}

type GetFileProps<TOptions = object> = {
  name: string
  mode?: KubbFile.Mode
  extname: KubbFile.Extname
  pluginKey: Plugin['key']
  options?: TOptions
}

export class PluginManager {
  readonly plugins = new Set<Plugin<GetPluginFactoryOptions<any>>>()
  readonly events: EventEmitter<Events> = new EventEmitter()

  readonly config: Config

  readonly executed: Array<Executer> = []
  readonly logger: Logger
  readonly options: Options
  readonly #core: Plugin<PluginCore>

  readonly #usedPluginNames: Record<string, number> = {}
  readonly #promiseManager: PromiseManager

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.logger = options.logger
    this.#promiseManager = new PromiseManager({
      nullCheck: (state: SafeParseResult<'resolveName'> | null) => !!state?.result,
    })

    const core = pluginCore({
      app: options.app,
      config,
      logger: this.logger,
      pluginManager: this,
      resolvePath: this.resolvePath.bind(this),
      resolveName: this.resolveName.bind(this),
      getPlugins: this.#getSortedPlugins.bind(this),
    })

    // call core.context.call with empty context so we can transform `context()` to `context: {}`
    this.#core = this.#parse(core as unknown as UserPlugin, this as any, core.context.call(null as any)) as Plugin<PluginCore>
    ;[this.#core, ...(config.plugins || [])].forEach((plugin) => {
      const parsedPlugin = this.#parse(plugin as UserPlugin, this, this.#core.context)

      this.plugins.add(parsedPlugin)
    })

    return this
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
    }
  }

  resolvePath = <TOptions = object>(params: ResolvePathParams<TOptions>): KubbFile.OptionalPath => {
    if (params.pluginKey) {
      const paths = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolvePath',
        parameters: [params.baseName, params.mode, params.options as object],
        message: `Resolving path '${params.baseName}'`,
      })

      if (paths && paths?.length > 1) {
        this.logger.emit('debug', {
          date: new Date(),
          logs: [
            `Cannot return a path where the 'pluginKey' ${
              params.pluginKey ? JSON.stringify(params.pluginKey) : '"'
            } is not unique enough\n\nPaths: ${JSON.stringify(paths, undefined, 2)}\n\nFalling back on the first item.\n`,
          ],
        })
      }

      return paths?.at(0)
    }
    return this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.baseName, params.mode, params.options as object],
      message: `Resolving path '${params.baseName}'`,
    }).result
  }
  //TODO refactor by using the order of plugins and the cache of the fileManager instead of guessing and recreating the name/path
  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginKey) {
      const names = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolveName',
        parameters: [trim(params.name), params.type],
        message: `Resolving name '${params.name}' and type '${params.type}'`,
      })

      if (names && names?.length > 1) {
        this.logger.emit('debug', {
          date: new Date(),
          logs: [
            `Cannot return a name where the 'pluginKey' ${
              params.pluginKey ? JSON.stringify(params.pluginKey) : '"'
            } is not unique enough\n\nNames: ${JSON.stringify(names, undefined, 2)}\n\nFalling back on the first item.\n`,
          ],
        })
      }

      return transformReservedWord(names?.at(0) || params.name)
    }

    const name = this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [trim(params.name), params.type],
      message: `Resolving name '${params.name}' and type '${params.type}'`,
    }).result

    return transformReservedWord(name)
  }

  /**
   * Instead of calling `pluginManager.events.on` you can use `pluginManager.on`. This one also has better types.
   */
  on<TEventName extends keyof Events & string>(eventName: TEventName, handler: (...eventArg: Events[TEventName]) => void): void {
    this.events.on(eventName, handler as any)
  }

  /**
   * Run a specific hookName for plugin x.
   */
  async hookForPlugin<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
    message,
  }: {
    pluginKey: Plugin['key']
    hookName: H
    parameters: PluginParameter<H>
    message: string
  }): Promise<Array<ReturnType<ParseResult<H>> | null>> {
    const plugins = this.getPluginsByKey(hookName, pluginKey)

    this.logger.emit('progress_start', { id: hookName, size: plugins.length, message: 'Running plugins...' })

    const items: Array<ReturnType<ParseResult<H>>> = []

    for (const plugin of plugins) {
      const result = await this.#execute<H>({
        strategy: 'hookFirst',
        hookName,
        parameters,
        plugin,
        message,
      })

      if (result !== undefined && result !== null) {
        items.push(result)
      }
    }

    this.logger.emit('progress_stop', { id: hookName })

    return items
  }
  /**
   * Run a specific hookName for plugin x.
   */

  hookForPluginSync<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
    message,
  }: {
    pluginKey: Plugin['key']
    hookName: H
    parameters: PluginParameter<H>
    message: string
  }): Array<ReturnType<ParseResult<H>>> | null {
    const plugins = this.getPluginsByKey(hookName, pluginKey)

    const result = plugins
      .map((plugin) => {
        return this.#executeSync<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
          message,
        })
      })
      .filter(Boolean)

    return result
  }

  /**
   * First non-null result stops and will return it's value.
   */
  async hookFirst<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
    message,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<Plugin> | null
    message: string
  }): Promise<SafeParseResult<H>> {
    const plugins = this.#getSortedPlugins(hookName).filter((plugin) => {
      return skipped ? skipped.has(plugin) : true
    })

    this.logger.emit('progress_start', { id: hookName, size: plugins.length })

    const promises = plugins.map((plugin) => {
      return async () => {
        const value = await this.#execute<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
          message,
        })

        return Promise.resolve({
          plugin,
          result: value,
        } as SafeParseResult<H>)
      }
    })

    const result = await this.#promiseManager.run('first', promises)

    this.logger.emit('progress_stop', { id: hookName })

    return result
  }

  /**
   * First non-null result stops and will return it's value.
   */
  hookFirstSync<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
    message,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<Plugin> | null
    message: string
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
          message,
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
   * Run all plugins in parallel(order will be based on `this.plugin` and if `pre` or `post` is set).
   */
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>({
    hookName,
    parameters,
    message,
  }: {
    hookName: H
    parameters?: Parameters<RequiredPluginLifecycle[H]> | undefined
    message: string
  }): Promise<Awaited<TOuput>[]> {
    const plugins = this.#getSortedPlugins(hookName)
    this.logger.emit('progress_start', { id: hookName, size: plugins.length })

    const promises = plugins.map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookParallel',
          hookName,
          parameters,
          plugin,
          message,
        }) as Promise<TOuput>
    })

    const results = await this.#promiseManager.run('parallel', promises, { concurrency: this.options.concurrency })

    results.forEach((result, index) => {
      if (isPromiseRejectedResult<Error>(result)) {
        const plugin = this.#getSortedPlugins(hookName)[index]

        this.#catcher<H>(result.reason, plugin, hookName)
      }
    })

    this.logger.emit('progress_stop', { id: hookName })

    return results.filter((result) => result.status === 'fulfilled').map((result) => (result as PromiseFulfilledResult<Awaited<TOuput>>).value)
  }

  /**
   * Chains plugins
   */
  async hookSeq<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    message,
  }: {
    hookName: H
    parameters?: PluginParameter<H>
    message: string
  }): Promise<void> {
    const plugins = this.#getSortedPlugins(hookName)
    this.logger.emit('progress_start', { id: hookName, size: plugins.length })

    const promises = plugins.map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
          message,
        })
    })

    await this.#promiseManager.run('seq', promises)

    this.logger.emit('progress_stop', { id: hookName })
  }

  #getSortedPlugins(hookName?: keyof PluginLifecycle): Plugin[] {
    const plugins = [...this.plugins].filter((plugin) => plugin.name !== 'core')

    if (hookName) {
      return plugins.filter((plugin) => hookName in plugin)
    }
    // TODO add test case for sorting with pre/post

    return plugins
      .map((plugin) => {
        if (plugin.pre) {
          const isValid = plugin.pre.every((pluginName) => plugins.find((pluginToFind) => pluginToFind.name === pluginName))

          if (!isValid) {
            throw new ValidationPluginError(`This plugin has a pre set that is not valid(${JSON.stringify(plugin.pre, undefined, 2)})`)
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
    const plugins = [...this.plugins]
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

      if (corePlugin) {
        this.logger.emit('debug', {
          date: new Date(),
          logs: [`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, falling back on the '@kubb/core' plugin`],
        })
      } else {
        this.logger.emit('debug', {
          date: new Date(),
          logs: [`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, no fallback found in the '@kubb/core' plugin`],
        })
      }
      return corePlugin ? [corePlugin] : []
    }

    return pluginByPluginName
  }

  #addExecutedToCallStack(executer: Executer | undefined) {
    if (executer) {
      this.events.emit('executed', executer)
      this.executed.push(executer)

      this.logger.emit('progressed', { id: executer.hookName, message: `${executer.plugin.name}: ${executer.message}` })
    }
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
    message,
  }: {
    strategy: Strategy
    hookName: H
    parameters: unknown[] | undefined
    plugin: PluginWithLifeCycle
    message: string
  }): Promise<ReturnType<ParseResult<H>> | null> | null {
    const hook = plugin[hookName]
    let output: unknown

    if (!hook) {
      return null
    }

    this.events.emit('executing', { strategy, hookName, parameters, plugin, message })

    const task = (async () => {
      try {
        if (typeof hook === 'function') {
          const result = await Promise.resolve((hook as Function).apply({ ...this.#core.context, plugin }, parameters))

          output = result

          this.#addExecutedToCallStack({
            parameters,
            output,
            strategy,
            hookName,
            plugin,
            message,
          })

          return result
        }

        output = hook

        this.#addExecutedToCallStack({
          parameters,
          output,
          strategy,
          hookName,
          plugin,
          message,
        })

        return hook
      } catch (e) {
        this.#catcher<H>(e as Error, plugin, hookName)
        return null
      }
    })()

    return task
  }

  /**
   * Run a sync plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be in `PluginHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The acutal plugin
   * @param replaceContext When passed, the plugin context can be overridden.
   */
  #executeSync<H extends PluginLifecycleHooks>({
    strategy,
    hookName,
    parameters,
    plugin,
    message,
  }: {
    strategy: Strategy
    hookName: H
    parameters: PluginParameter<H>
    plugin: PluginWithLifeCycle
    message: string
  }): ReturnType<ParseResult<H>> | null {
    const hook = plugin[hookName]
    let output: unknown

    if (!hook) {
      return null
    }

    this.events.emit('executing', { strategy, hookName, parameters, plugin, message })

    try {
      if (typeof hook === 'function') {
        const fn = (hook as Function).apply({ ...this.#core.context, plugin }, parameters) as ReturnType<ParseResult<H>>

        output = fn

        this.#addExecutedToCallStack({
          parameters,
          output,
          strategy,
          hookName,
          plugin,
          message,
        })

        return fn
      }

      output = hook

      this.#addExecutedToCallStack({
        parameters,
        output,
        strategy,
        hookName,
        plugin,
        message,
      })

      return hook
    } catch (e) {
      this.#catcher<H>(e as Error, plugin, hookName)

      return null
    }
  }

  #catcher<H extends PluginLifecycleHooks>(cause: Error, plugin?: Plugin, hookName?: H) {
    const text = `${cause.message} (plugin: ${plugin?.name || 'unknown'}, hook: ${hookName || 'unknown'})`

    this.logger.emit('error', text, cause)
    this.events.emit('error', cause)
  }

  #parse<TPlugin extends UserPluginWithLifeCycle>(
    plugin: TPlugin,
    pluginManager: PluginManager,
    context: PluginCore['context'] | undefined,
  ): Plugin<GetPluginFactoryOptions<TPlugin>> {
    const usedPluginNames = pluginManager.#usedPluginNames

    setUniqueName(plugin.name, usedPluginNames)

    const key = [plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [typeof plugin.name, string]

    if (plugin.context && typeof plugin.context === 'function') {
      return {
        ...plugin,
        key,
        context: (plugin.context as Function).call(context) as typeof plugin.context,
      } as unknown as Plugin<GetPluginFactoryOptions<TPlugin>>
    }

    return {
      ...plugin,
      key,
    } as unknown as Plugin<GetPluginFactoryOptions<TPlugin>>
  }

  static getDependedPlugins<
    T1 extends PluginFactoryOptions,
    T2 extends PluginFactoryOptions = never,
    T3 extends PluginFactoryOptions = never,
    TOutput = T3 extends never ? (T2 extends never ? [T1: Plugin<T1>] : [T1: Plugin<T1>, T2: Plugin<T2>]) : [T1: Plugin<T1>, T2: Plugin<T2>, T3: Plugin<T3>],
  >(plugins: Array<Plugin>, dependedPluginNames: string | string[]): TOutput {
    let pluginNames: string[] = []
    if (typeof dependedPluginNames === 'string') {
      pluginNames = [dependedPluginNames]
    } else {
      pluginNames = dependedPluginNames
    }

    return pluginNames.map((pluginName) => {
      const plugin = plugins.find((plugin) => plugin.name === pluginName)
      if (!plugin) {
        throw new ValidationPluginError(`This plugin depends on the ${pluginName} plugin.`)
      }
      return plugin
    }) as TOutput
  }

  static get hooks() {
    return ['buildStart', 'resolvePath', 'resolveName', 'buildEnd'] as const
  }
}
