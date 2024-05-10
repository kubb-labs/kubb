import PQueue from 'p-queue'

import { readSync } from '@kubb/fs'
import { FileManager, type ResolvedFile } from './FileManager.ts'
import { isPromise, isPromiseRejectedResult } from './PromiseManager.ts'
import { PromiseManager } from './PromiseManager.ts'
import { ValidationPluginError } from './errors.ts'
import { LogLevel } from './logger.ts'
import { pluginCore } from './plugin.ts'
import { transformReservedWord } from './transformers/transformReservedWord.ts'
import { EventEmitter } from './utils/EventEmitter.ts'
import { setUniqueName } from './utils/uniqueName.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { PossiblePromise } from '@kubb/types'
import type { Logger } from './logger.ts'
import type { PluginCore } from './plugin.ts'
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

type RequiredPluginLifecycle = Required<PluginLifecycle>

/**
 * Get the type of the first argument in a function.
 * @example Arg0<(a: string, b: number) => void> -> string
 */
type Argument0<H extends keyof PluginLifecycle> = Parameters<RequiredPluginLifecycle[H]>[0]

type Strategy = 'hookFirst' | 'hookForPlugin' | 'hookParallel' | 'hookReduceArg0' | 'hookSeq'

type Executer<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
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
  logger: Logger

  /**
   * Task for the FileManager
   */
  task: (file: ResolvedFile) => Promise<ResolvedFile>
}

type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [error: Error]
}

type GetFileProps<TOptions = object> = {
  name: string
  mode?: KubbFile.Mode
  extName: KubbFile.Extname
  pluginKey: Plugin['key']
  options?: TOptions
}

export class PluginManager {
  readonly plugins: PluginWithLifeCycle[]
  readonly fileManager: FileManager
  readonly events: EventEmitter<Events> = new EventEmitter()

  readonly config: Config

  readonly executed: Array<Executer> = []
  readonly logger: Logger
  readonly #core: Plugin<PluginCore>

  readonly #usedPluginNames: Record<string, number> = {}
  readonly #promiseManager: PromiseManager

  readonly queue: PQueue

  constructor(config: Config, options: Options) {
    this.config = config
    this.logger = options.logger
    this.queue = new PQueue({ concurrency: 1 })
    this.fileManager = new FileManager({
      task: options.task,
      queue: this.queue,
    })
    this.#promiseManager = new PromiseManager({
      nullCheck: (state: SafeParseResult<'resolveName'> | null) => !!state?.result,
    })

    const plugins = config.plugins || []

    const core = pluginCore({
      config,
      logger: this.logger,
      pluginManager: this,
      fileManager: this.fileManager,
      resolvePath: this.resolvePath.bind(this),
      resolveName: this.resolveName.bind(this),
      getPlugins: this.#getSortedPlugins.bind(this),
    })

    // call core.api.call with empty context so we can transform `api()` to `api: {}`
    this.#core = this.#parse(core as unknown as UserPlugin, this as any, core.api.call(null as any)) as Plugin<PluginCore>

    this.plugins = [this.#core, ...plugins].map((plugin) => {
      return this.#parse(plugin as UserPlugin, this, this.#core.api)
    })

    return this
  }

  getFile<TOptions = object>({ name, mode, extName, pluginKey, options }: GetFileProps<TOptions>): KubbFile.File<{ pluginKey: Plugin['key'] }> {
    let source = ''
    const baseName = `${name}${extName}` as const
    const path = this.resolvePath({ baseName, mode, pluginKey, options })

    if (!path) {
      throw new Error(`Filepath should be defined for resolvedName "${name}" and pluginKey [${JSON.stringify(pluginKey)}]`)
    }

    try {
      source = readSync(path)
    } catch (_e) {
      //
    }

    return {
      path,
      baseName,
      meta: {
        pluginKey,
      },
      source,
    }
  }

  resolvePath = <TOptions = object>(params: ResolvePathParams<TOptions>): KubbFile.OptionalPath => {
    if (params.pluginKey) {
      const paths = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolvePath',
        parameters: [params.baseName, params.mode, params.options as object],
      })

      if (paths && paths?.length > 1) {
        this.logger.emit('debug', [
          `Cannot return a path where the 'pluginKey' ${
            params.pluginKey ? JSON.stringify(params.pluginKey) : '"'
          } is not unique enough\n\nPaths: ${JSON.stringify(paths, undefined, 2)}\n\nFalling back on the first item.\n`,
        ])
      }

      return paths?.at(0)
    }
    return this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.baseName, params.mode, params.options as object],
    }).result
  }
  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginKey) {
      const names = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolveName',
        parameters: [params.name, params.type],
      })

      if (names && names?.length > 1) {
        this.logger.emit('debug', [
          `Cannot return a name where the 'pluginKey' ${
            params.pluginKey ? JSON.stringify(params.pluginKey) : '"'
          } is not unique enough\n\nNames: ${JSON.stringify(names, undefined, 2)}\n\nFalling back on the first item.\n`,
        ])
      }

      return transformReservedWord(names?.at(0) || params.name)
    }

    const name = this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [params.name, params.type],
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
  hookForPlugin<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
  }: {
    pluginKey: Plugin['key']
    hookName: H
    parameters: PluginParameter<H>
  }): Promise<Array<ReturnType<ParseResult<H>> | null>> | null {
    const plugins = this.getPluginsByKey(hookName, pluginKey)

    const promises = plugins
      .map((plugin) => {
        return this.#execute<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })
      })
      .filter(Boolean)

    return Promise.all(promises)
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

    return plugins
      .map((plugin) => {
        return this.#executeSync<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })
      })
      .filter(Boolean)
  }

  /**
   * First non-null result stops and will return it's value.
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
    const promises = this.#getSortedPlugins()
      .filter((plugin) => {
        return skipped ? skipped.has(plugin) : true
      })
      .map((plugin) => {
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

    return this.#promiseManager.run('first', promises)
  }

  /**
   * First non-null result stops and will return it's value.
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

    for (const plugin of this.#getSortedPlugins()) {
      if (skipped?.has(plugin)) {
        continue
      }

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
   * Run all plugins in parallel(order will be based on `this.plugin` and if `pre` or `post` is set).
   */
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<RequiredPluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOuput>[]> {
    const promises = this.#getSortedPlugins().map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookParallel',
          hookName,
          parameters,
          plugin,
        }) as Promise<TOuput>
    })

    const results = await this.#promiseManager.run('parallel', promises)

    results.forEach((result, index) => {
      if (isPromiseRejectedResult<Error>(result)) {
        const plugin = this.#getSortedPlugins()[index]

        this.#catcher<H>(result.reason, plugin, hookName)
      }
    })

    return results.filter((result) => result.status === 'fulfilled').map((result) => (result as PromiseFulfilledResult<Awaited<TOuput>>).value)
  }

  /**
   * Chain all plugins, `reduce` can be passed through to handle every returned value. The return value of the first plugin will be used as the first parameter for the plugin after that.
   */
  hookReduceArg0<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    reduce,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    reduce: (reduction: Argument0<H>, result: ReturnType<ParseResult<H>>, plugin: Plugin) => PossiblePromise<Argument0<H> | null>
  }): Promise<Argument0<H>> {
    const [argument0, ...rest] = parameters

    let promise: Promise<Argument0<H>> = Promise.resolve(argument0)
    for (const plugin of this.#getSortedPlugins()) {
      promise = promise
        .then((arg0) => {
          const value = this.#execute({
            strategy: 'hookReduceArg0',
            hookName,
            parameters: [arg0, ...rest] as PluginParameter<H>,
            plugin,
          })
          return value
        })
        .then((result) => reduce.call(this.#core.api, argument0, result as ReturnType<ParseResult<H>>, plugin)) as Promise<Argument0<H>>
    }

    return promise
  }

  /**
   * Chains plugins
   */
  async hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: PluginParameter<H> }): Promise<void> {
    const promises = this.#getSortedPlugins().map((plugin) => {
      return () =>
        this.#execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
        })
    })

    return this.#promiseManager.run('seq', promises)
  }

  #getSortedPlugins(hookName?: keyof PluginLifecycle): Plugin[] {
    const plugins = [...this.plugins].filter((plugin) => plugin.name !== 'core')

    if (hookName) {
      if (this.logger.logLevel === LogLevel.info) {
        const containsHookName = plugins.some((item) => item[hookName])
        if (!containsHookName) {
          this.logger.emit('warning', `No hook ${hookName} found`)
        }
      }

      return plugins.filter((item) => item[hookName])
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

  getPluginsByKey(hookName: keyof PluginLifecycle, pluginKey: Plugin['key']): Plugin[] {
    const plugins = [...this.plugins]
    const [searchPluginName, searchIdentifier] = pluginKey

    const pluginByPluginName = plugins
      .filter((plugin) => plugin[hookName])
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

      const corePlugin = plugins.find((plugin) => plugin.name === 'core' && plugin[hookName])

      if (corePlugin) {
        this.logger.emit('debug', [`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, falling back on the '@kubb/core' plugin`])
      } else {
        this.logger.emit('debug', [`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, no fallback found in the '@kubb/core' plugin`])
      }
      return corePlugin ? [corePlugin] : []
    }

    return pluginByPluginName
  }

  #addExecutedToCallStack(executer: Executer | undefined) {
    if (executer) {
      this.events.emit('executed', executer)
      this.executed.push(executer)
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

    this.events.emit('execute', { strategy, hookName, parameters, plugin })

    const task = Promise.resolve()
      .then(() => {
        if (typeof hook === 'function') {
          const possiblePromiseResult = (hook as Function).apply({ ...this.#core.api, plugin }, parameters) as Promise<ReturnType<ParseResult<H>>>

          if (isPromise(possiblePromiseResult)) {
            return Promise.resolve(possiblePromiseResult)
          }
          return possiblePromiseResult
        }

        return hook
      })
      .then((result) => {
        output = result

        this.#addExecutedToCallStack({
          parameters,
          output,
          strategy,
          hookName,
          plugin,
        })

        return result
      })
      .catch((e: Error) => {
        this.#catcher<H>(e, plugin, hookName)

        return null
      })

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

    this.events.emit('execute', { strategy, hookName, parameters, plugin })

    try {
      if (typeof hook === 'function') {
        const fn = (hook as Function).apply({ ...this.#core.api, plugin }, parameters) as ReturnType<ParseResult<H>>

        output = fn
        return fn
      }

      output = hook

      this.#addExecutedToCallStack({
        parameters,
        output,
        strategy,
        hookName,
        plugin,
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
    context: PluginCore['api'] | undefined,
  ): Plugin<GetPluginFactoryOptions<TPlugin>> {
    const usedPluginNames = pluginManager.#usedPluginNames

    setUniqueName(plugin.name, usedPluginNames)

    const key = [plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [typeof plugin.name, string]

    // default transform
    if (!plugin.transform) {
      plugin.transform = function transform(_path, code) {
        return code
      }
    }

    if (plugin.api && typeof plugin.api === 'function') {
      const api = (plugin.api as Function).call(context) as typeof plugin.api

      return {
        ...plugin,
        key,
        api,
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
    return ['buildStart', 'resolvePath', 'resolveName', 'load', 'transform', 'writeFile', 'buildEnd'] as const
  }
}
