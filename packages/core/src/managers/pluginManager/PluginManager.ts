/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-argument */

import { definePlugin } from '../../plugin.ts'
import { EventEmitter } from '../../utils/EventEmitter.ts'
import { isPromise, isPromiseRejectedResult } from '../../utils/isPromise.ts'
import { Queue } from '../../utils/Queue.ts'
import { transformReservedWord } from '../../utils/transformers/transformReservedWord.ts'
import { FileManager } from '../fileManager/FileManager.ts'
import { ParallelPluginError } from './ParallelPluginError.ts'
import { PluginError } from './PluginError.ts'
import { pluginParser } from './pluginParser.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type {
  KubbConfig,
  KubbPlugin,
  KubbUserPlugin,
  PluginContext,
  PluginLifecycle,
  PluginLifecycleHooks,
  PossiblePromise,
  ResolveNameParams,
  ResolvePathParams,
} from '../../types.ts'
import type { Logger } from '../../utils/logger.ts'
import type { QueueJob } from '../../utils/Queue.ts'
import type { KubbFile } from '../fileManager/types.ts'
import type {Argument0, Executer, ParseResult, PluginParameter, RequiredPluginLifecycle, SafeParseResult, Strategy } from './types.ts'

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

// This will make sure no input hook is omitted
const hookNames: {
  [P in PluginLifecycleHooks]: 1
} = {
  validate: 1,
  buildStart: 1,
  resolvePath: 1,
  resolveName: 1,
  load: 1,
  transform: 1,
  writeFile: 1,
  buildEnd: 1,
}
export const hooks = Object.keys(hookNames) as [PluginLifecycleHooks]

type Options = { debug?: boolean; task: QueueJob<KubbFile.ResolvedFile>; logger: Logger }

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

  constructor(config: KubbConfig, options: Options) {
    // TODO use logger for all warnings/errors
    this.logger = options.logger
    this.queue = new Queue(100, options.debug)
    this.fileManager = new FileManager({ task: options.task, queue: this.queue })

    const core = definePlugin({
      config,
      logger: this.logger,
      pluginManager: this,
      fileManager: this.fileManager,
      resolvePath: this.resolvePath.bind(this),
      resolveName: this.resolveName.bind(this),
      getPlugins: this.#getSortedPlugins.bind(this),
      plugin: undefined as unknown as KubbPlugin
    }) as KubbPlugin<CorePluginOptions> & {
      api: (this: Omit<PluginContext, 'addFile'>) => CorePluginOptions['api'];
      plugin?: undefined
    }

    this.#core = pluginParser(core, core.api.call(null as any)) as KubbPlugin<CorePluginOptions>

    this.plugins = [this.#core, ...(config.plugins || [])].reduce((prev, plugin) => {
      // TODO HACK to be sure that this is equal to the `core.api` logic.
      const convertedApi = pluginParser(plugin as KubbUserPlugin, this.#core?.api)

      return [...prev, convertedApi]
    }, [] as KubbPlugin[])

    return this
  }

  resolvePath = (params: ResolvePathParams): KubbFile.OptionalPath => {
    if (params.pluginName) {
      return this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolvePath',
        parameters: [params.baseName, params.directory, params.options],
      })
    }
    return this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.baseName, params.directory, params.options],
    }).result
  }

  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginName) {
      const name = this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolveName',
        parameters: [params.name, params.type],
      })
      return transformReservedWord(name || params.name)
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
    pluginName,
    hookName,
    parameters,
  }: {
    pluginName: string
    hookName: H
    parameters: PluginParameter<H>
  }): Promise<ReturnType<ParseResult<H>> | null> | null {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.#execute({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })
  }

  hookForPluginSync<H extends PluginLifecycleHooks>({
    pluginName,
    hookName,
    parameters,
  }: {
    pluginName: string
    hookName: H
    parameters: PluginParameter<H>
  }): ReturnType<ParseResult<H>> | null {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.#executeSync({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })
  }

  /**
   * Chains, first non-null result stops and returns
   */
  hookFirst<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: PluginParameter<H>
    skipped?: ReadonlySet<KubbPlugin> | null
  }): Promise<SafeParseResult<H>> {
    let promise: Promise<SafeParseResult<H>> = Promise.resolve(null as unknown as SafeParseResult<H>)

    for (const plugin of this.#getSortedPlugins()) {
      if (skipped && skipped.has(plugin)) {
        continue
      }
      promise = promise.then(async (parseResult) => {
        if (parseResult?.result != null) {
          return parseResult
        }
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
          } as typeof parseResult,
        )
      })
    }

    return promise
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
      const promise: Promise<TOuput> | null = this.#execute({ strategy: 'hookParallel', hookName, parameters, plugin })

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
  hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: PluginParameter<H> }): Promise<void> {
    let promise: Promise<void | null> = Promise.resolve()
    for (const plugin of this.#getSortedPlugins()) {
      promise = promise.then(() => {
        this.#execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
        })
      })
    }
    return promise.then(noReturn)
  }

  #getSortedPlugins(hookName?: keyof PluginLifecycle): KubbPlugin[] {
    const plugins = [...this.plugins].filter((plugin) => plugin.name !== 'core')

    if (hookName) {
      return plugins.filter((item) => item[hookName])
    }

    return plugins
  }

  public getPlugin(hookName: keyof PluginLifecycle, pluginName: string): KubbPlugin {
    const plugins = [...this.plugins]

    const pluginByPluginName = plugins.find((item) => item.name === pluginName && item[hookName])
    if (!pluginByPluginName) {
      // fallback on the core plugin when there is no match

      return this.#core
    }
    return pluginByPluginName
  }

  #addExecutedToCallStack(executer: Executer | undefined) {
    if (executer) {
      this.eventEmitter.emit('execute', executer)
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
  #execute<H extends PluginLifecycleHooks, TResult = void>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: unknown[] | undefined
    plugin: KubbPlugin
  }): Promise<TResult> | null {
    const hook = plugin[hookName]
    let output: unknown

    if (!hook) {
      return null
    }

    this.eventEmitter.emit('execute', { strategy, hookName, parameters, plugin })

    const task = Promise.resolve()
      .then(() => {
        if (typeof hook === 'function') {
          const possiblePromiseResult = (hook as Function).apply({ ...this.#core.api, plugin }, parameters) as TResult

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

        return null as TResult
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
        const fn = (hook as Function).apply(this.#core.api, parameters) as ReturnType<ParseResult<H>>

        output = fn
        return fn
      }

      output = hook
      return hook
    } catch (e) {
      this.#catcher<H>(e as Error, plugin, hookName)

      return null as ReturnType<ParseResult<H>>
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
}

function noReturn() {}
