/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-argument */

import { EventEmitter } from './utils/EventEmitter.ts'
import { LogLevel } from './utils/logger.ts'
import { Queue } from './utils/Queue.ts'
import { transformReservedWord } from './utils/transformers/transformReservedWord.ts'
import { setUniqueName } from './utils/uniqueName.ts'
import { ParallelPluginError, PluginError, ValidationPluginError } from './errors.ts'
import { FileManager } from './FileManager.ts'
import { definePlugin as defineCorePlugin } from './plugin.ts'
import { isPromise, isPromiseRejectedResult } from './PromiseManager.ts'
import { PromiseManager } from './PromiseManager.ts'

import type { KubbFile } from './FileManager.ts'
import type { CorePluginOptions } from './plugin.ts'
import type {
  GetPluginFactoryOptions,
  KubbConfig,
  KubbPlugin,
  KubbUserPlugin,
  PluginFactoryOptions,
  PluginLifecycle,
  PluginLifecycleHooks,
  PluginParameter,
  PossiblePromise,
  ResolveNameParams,
  ResolvePathParams,
} from './types.ts'
import type { Logger } from './utils/logger.ts'
import type { QueueJob } from './utils/Queue.ts'

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
  plugin: KubbPlugin
  parameters?: unknown[] | undefined
  output?: unknown
}

type ParseResult<H extends PluginLifecycleHooks> = RequiredPluginLifecycle[H]

type SafeParseResult<H extends PluginLifecycleHooks, Result = ReturnType<ParseResult<H>>> = {
  result: Result
  plugin: KubbPlugin
}

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

type Options = {
  logger: Logger

  /**
   * Task for the FileManager
   */
  task: QueueJob<KubbFile.ResolvedFile>
  /**
   * Timeout between writes in the FileManager
   */
  writeTimeout?: number
}

type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [pluginError: PluginError]
}

export class PluginManager {
  plugins: KubbPlugin[]
  readonly fileManager: FileManager
  readonly eventEmitter: EventEmitter<Events> = new EventEmitter()

  readonly queue: Queue

  readonly executed: Executer[] = []
  readonly logger: Logger
  readonly #core: KubbPlugin<CorePluginOptions>

  readonly #usedPluginNames: Record<string, number> = {}
  readonly #promiseManager: PromiseManager

  constructor(config: KubbConfig, options: Options) {
    // TODO use logger for all warnings/errors
    this.logger = options.logger
    this.queue = new Queue(100, this.logger.logLevel === LogLevel.debug)
    this.fileManager = new FileManager({ task: options.task, queue: this.queue, timeout: options.writeTimeout })
    this.#promiseManager = new PromiseManager({ nullCheck: (state: SafeParseResult<'resolveName'> | null) => !!state?.result })

    const plugins = config.plugins || []

    const core = defineCorePlugin({
      config,
      logger: this.logger,
      pluginManager: this,
      fileManager: this.fileManager,
      resolvePath: this.resolvePath.bind(this),
      resolveName: this.resolveName.bind(this),
      getPlugins: this.#getSortedPlugins.bind(this),
    })

    // call core.api.call with empty context so we can transform `api()` to `api: {}`
    this.#core = this.#parse(core as unknown as KubbUserPlugin, this as any, core.api.call(null as any)) as KubbPlugin<CorePluginOptions>

    this.plugins = [this.#core, ...plugins].map((plugin) => {
      return this.#parse(plugin as KubbUserPlugin, this, this.#core.api)
    })

    return this
  }

  resolvePath = (params: ResolvePathParams): KubbFile.OptionalPath => {
    if (params.pluginKey) {
      const paths = this.hookForPluginSync({
        pluginKey: params.pluginKey,
        hookName: 'resolvePath',
        parameters: [params.baseName, params.directory, params.options],
      })

      if (paths && paths?.length > 1) {
        throw new Error(
          `Cannot return a path where the 'pluginKey' ${params.pluginKey ? JSON.stringify(params.pluginKey) : '"'} is not unique enough\n\nPaths: ${
            JSON.stringify(paths, undefined, 2)
          }`,
        )
      }

      return paths?.at(0)
    }
    return this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.baseName, params.directory, params.options],
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
        throw new Error(
          `Cannot return a name where the 'pluginKey' ${params.pluginKey ? JSON.stringify(params.pluginKey) : '"'} is not unique enough\n\nNames: ${
            JSON.stringify(names, undefined, 2)
          }`,
        )
      }

      return transformReservedWord(names?.at(0) || params.name)
    }
    const name = this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [params.name, params.type],
    }).result

    return transformReservedWord(name)
  }

  on<TEventName extends keyof Events & string>(eventName: TEventName, handler: (...eventArg: Events[TEventName]) => void): void {
    this.eventEmitter.on(eventName, handler as any)
  }

  /**
   * Run only hook for a specific plugin name
   */
  hookForPlugin<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
  }: {
    pluginKey: KubbPlugin['key']
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

  hookForPluginSync<H extends PluginLifecycleHooks>({
    pluginKey,
    hookName,
    parameters,
  }: {
    pluginKey: KubbPlugin['key']
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
   * Chains, first non-null result stops and returns
   */
  async hookFirst<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<KubbPlugin> | null
  }): Promise<SafeParseResult<H>> {
    const promises = this.#getSortedPlugins().filter(plugin => {
      return skipped ? skipped.has(plugin) : true
    }).map((plugin) => {
      return async () => {
        const value = await this.#execute<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })

        return Promise.resolve(
          {
            plugin,
            result: value,
          } as SafeParseResult<H>,
        )
      }
    })

    return this.#promiseManager.run('first', promises)
  }

  /**
   * Chains, first non-null result stops and returns
   */
  hookFirstSync<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<KubbPlugin> | null
  }): SafeParseResult<H> {
    let parseResult: SafeParseResult<H> = null as unknown as SafeParseResult<H>

    for (const plugin of this.#getSortedPlugins()) {
      if (skipped && skipped.has(plugin)) {
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
   * Parallel, runs all plugins
   */
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<RequiredPluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOuput>[]> {
    const parallelPromises: Promise<TOuput>[] = []

    for (const plugin of this.#getSortedPlugins()) {
      // TODO implement sequential with `buildStart` as an object({ sequential: boolean; handler: PluginContext["buildStart"] })
      // if ((plugin[hookName] as { sequential?: boolean })?.sequential) {
      //   await Promise.all(parallelPromises)
      //   parallelPromises.length = 0
      //   await this.execute({
      //     strategy: 'hookParallel',
      //     hookName,
      //     parameters,
      //     plugin,
      //   })
      // }
      const promise: Promise<TOuput> | null = this.#execute({ strategy: 'hookParallel', hookName, parameters, plugin }) as Promise<TOuput>

      if (promise) {
        parallelPromises.push(promise)
      }
    }
    const results = await Promise.allSettled(parallelPromises)

    const errors = results
      .map((result) => {
        // needs `cause` because Warning and other errors will then not be added, only PluginError is possible here
        if (isPromiseRejectedResult<PluginError>(result) && result.reason instanceof PluginError) {
          return result.reason
        }
        return undefined
      })
      .filter(Boolean)

    if (errors.length) {
      throw new ParallelPluginError('Error', { errors, pluginManager: this })
    }

    return results.filter((result) => result.status === 'fulfilled').map((result) => (result as PromiseFulfilledResult<Awaited<TOuput>>).value)
  }

  /**
   * Chains, reduces returned value, handling the reduced value as the first hook argument
   */
  hookReduceArg0<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    reduce,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    reduce: (reduction: Argument0<H>, result: ReturnType<ParseResult<H>>, plugin: KubbPlugin) => PossiblePromise<Argument0<H> | null>
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

  #getSortedPlugins(hookName?: keyof PluginLifecycle): KubbPlugin[] {
    const plugins = [...this.plugins].filter((plugin) => plugin.name !== 'core')

    if (hookName) {
      if (this.logger.logLevel === 'info') {
        const containsHookName = plugins.some((item) => item[hookName])
        if (!containsHookName) {
          this.logger.warn(`No hook ${hookName} found`)
        }
      }

      return plugins.filter((item) => item[hookName])
    }

    return plugins
  }

  getPluginsByKey(hookName: keyof PluginLifecycle, pluginKey: KubbPlugin['key']): KubbPlugin[] {
    const plugins = [...this.plugins]
    const [searchKind, searchPluginName, searchIdentifier] = pluginKey

    const pluginByPluginName = plugins
      .filter((plugin) => plugin[hookName])
      .filter((item) => {
        const [kind, name, identifier] = item.key

        const identifierCheck = identifier?.toString() === searchIdentifier?.toString()
        const kindCheck = kind === searchKind
        const nameCheck = name === searchPluginName

        if (searchIdentifier) {
          return identifierCheck && kindCheck && nameCheck
        }

        return kindCheck && nameCheck
      })

    if (!pluginByPluginName?.length) {
      // fallback on the core plugin when there is no match

      const corePlugin = plugins.find((plugin) => plugin.name === 'core' && plugin[hookName])

      if (this.logger.logLevel === 'info') {
        if (corePlugin) {
          this.logger.warn(`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, falling back on the '@kubb/core' plugin`)
        } else {
          this.logger.warn(`No hook '${hookName}' for pluginKey '${JSON.stringify(pluginKey)}' found, no fallback found in the '@kubb/core' plugin`)
        }
      }

      return corePlugin ? [corePlugin] : []
    }

    return pluginByPluginName
  }

  #addExecutedToCallStack(executer: Executer | undefined) {
    if (executer) {
      this.eventEmitter.emit('executed', executer)
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
    plugin: KubbPlugin
  }): Promise<ReturnType<ParseResult<H>> | null> | null {
    const hook = plugin[hookName]
    let output: unknown

    if (!hook) {
      return null
    }

    this.eventEmitter.emit('execute', { strategy, hookName, parameters, plugin })

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

        return result
      })
      .catch((e: Error) => {
        this.#catcher<H>(e, plugin, hookName)

        return null
      })
      .finally(() => {
        this.#addExecutedToCallStack({
          parameters,
          output,
          strategy,
          hookName,
          plugin,
        })
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
    plugin: KubbPlugin
  }): ReturnType<ParseResult<H>> | null {
    const hook = plugin[hookName]
    let output: unknown

    if (!hook) {
      return null
    }

    this.eventEmitter.emit('execute', { strategy, hookName, parameters, plugin })

    try {
      if (typeof hook === 'function') {
        const fn = (hook as Function).apply({ ...this.#core.api, plugin }, parameters) as ReturnType<ParseResult<H>>

        output = fn
        return fn
      }

      output = hook
      return hook
    } catch (e) {
      this.#catcher<H>(e as Error, plugin, hookName)

      return null
    } finally {
      this.#addExecutedToCallStack({
        parameters,
        output,
        strategy,
        hookName,
        plugin,
      })
    }
  }

  #catcher<H extends PluginLifecycleHooks>(e: Error, plugin: KubbPlugin, hookName: H) {
    const text = `${e.message} (plugin: ${plugin.name}, hook: ${hookName})\n`
    const pluginError = new PluginError(text, { cause: e, pluginManager: this })

    this.eventEmitter.emit('error', pluginError)

    throw pluginError
  }

  #parse<TPlugin extends KubbUserPlugin>(
    plugin: TPlugin,
    pluginManager: PluginManager,
    context: CorePluginOptions['api'] | undefined,
  ): KubbPlugin<GetPluginFactoryOptions<TPlugin>> {
    const usedPluginNames = pluginManager.#usedPluginNames

    setUniqueName(plugin.name, usedPluginNames)

    const key = plugin.key || ([plugin.kind, plugin.name, usedPluginNames[plugin.name]].filter(Boolean) as [typeof plugin.kind, typeof plugin.name, string])

    if (plugin.name !== 'core' && usedPluginNames[plugin.name]! >= 2) {
      pluginManager.logger.warn('Using multiple of the same plugin is an experimental feature')
    }

    // default transform
    if (!plugin.transform) {
      plugin.transform = function transform(code) {
        return code
      }
    }

    if (plugin.api && typeof plugin.api === 'function') {
      const api = (plugin.api as Function).call(context) as typeof plugin.api

      return {
        ...plugin,
        key,
        api,
      } as unknown as KubbPlugin<GetPluginFactoryOptions<TPlugin>>
    }

    return {
      ...plugin,
      key,
    } as unknown as KubbPlugin<GetPluginFactoryOptions<TPlugin>>
  }

  static getDependedPlugins<
    T1 extends PluginFactoryOptions,
    T2 extends PluginFactoryOptions = never,
    T3 extends PluginFactoryOptions = never,
    TOutput = T3 extends never ? T2 extends never ? [T1: KubbPlugin<T1>]
      : [T1: KubbPlugin<T1>, T2: KubbPlugin<T2>]
      : [T1: KubbPlugin<T1>, T2: KubbPlugin<T2>, T3: KubbPlugin<T3>],
  >(plugins: Array<KubbPlugin>, dependedPluginNames: string | string[]): TOutput {
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static get hooks() {
    return ['validate', 'buildStart', 'resolvePath', 'resolveName', 'load', 'transform', 'writeFile', 'buildEnd'] as const
  }
}
