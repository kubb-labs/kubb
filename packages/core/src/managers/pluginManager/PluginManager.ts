/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-argument */

import { definePlugin } from '../../plugin.ts'
import { isPromise, isPromiseRejectedResult } from '../../utils/isPromise.ts'
import { Queue } from '../../utils/Queue.ts'
import { FileManager } from '../fileManager/FileManager.ts'
import { ParallelPluginError } from './ParallelPluginError.ts'
import { PluginError } from './PluginError.ts'

import { EventEmitter } from '../../utils/EventEmitter.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type {
  KubbConfig,
  KubbPlugin,
  PluginContext,
  PluginLifecycle,
  PluginLifecycleHooks,
  ResolveNameParams,
  ResolvePathParams,
  OptionalPath,
} from '../../types.ts'
import type { QueueJob } from '../../utils/Queue.ts'
import type { Argument0, Executer, ParseResult, SafeParseResult, Strategy } from './types.ts'
import type { Logger } from '../../utils/logger.ts'
import type { ResolvedFile } from '../fileManager/types.ts'
import { pluginParser } from './pluginParser.ts'
import type { PossiblePromise } from '../../utils/types.ts'

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

type Options = { debug?: boolean; task: QueueJob<ResolvedFile>; logger: Logger }

type Events = {
  execute: [executer: Executer]
  executed: [executer: Executer]
  error: [pluginError: PluginError]
}

export class PluginManager {
  public plugins: KubbPlugin[]

  public readonly fileManager: FileManager

  private readonly core: KubbPlugin<CorePluginOptions>

  public queue: Queue

  public executed: Executer[] = []
  public logger: Logger
  private eventEmitter: EventEmitter<Events> = new EventEmitter()

  constructor(config: KubbConfig, options: Options) {
    // TODO use logger for all warnings/errors
    this.logger = options.logger
    this.queue = new Queue(100, options.debug)
    this.fileManager = new FileManager({ task: options.task, queue: this.queue })

    const core = definePlugin({
      config,
      logger: this.logger,
      fileManager: this.fileManager,
      resolvePath: this.resolvePath.bind(this),
      resolveName: this.resolveName.bind(this),
      getPlugins: this.getSortedPlugins.bind(this),
    }) as KubbPlugin<CorePluginOptions> & {
      api: (this: Omit<PluginContext, 'addFile'>) => CorePluginOptions['api']
    }

    this.core = pluginParser(core, core.api.call(null as any)) as KubbPlugin<CorePluginOptions>

    this.plugins = [this.core, ...(config.plugins || [])].reduce((prev, plugin) => {
      // TODO HACK to be sure that this is equal to the `core.api` logic.

      const convertedApi = pluginParser(plugin, this.core?.api)

      if (convertedApi) {
        return [...prev, convertedApi]
      }

      return [...prev, plugin]
    }, [] as KubbPlugin[])
  }

  resolvePath = (params: ResolvePathParams): OptionalPath => {
    if (params.pluginName) {
      return this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolvePath',
        parameters: [params.fileName, params.directory, params.options],
      })
    }
    return this.hookFirstSync({
      hookName: 'resolvePath',
      parameters: [params.fileName, params.directory, params.options],
    }).result
  }

  resolveName = (params: ResolveNameParams): string => {
    if (params.pluginName) {
      return (
        this.hookForPluginSync({
          pluginName: params.pluginName,
          hookName: 'resolveName',
          parameters: [params.name],
        }) || params.name
      )
    }
    return this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [params.name],
    }).result
  }

  on<TEventName extends keyof Events & string>(eventName: TEventName, handler: (...eventArg: Events[TEventName]) => void): void {
    this.eventEmitter.on(eventName, handler as any)
  }

  /**
   *
   * Run only hook for a specific plugin name
   */
  hookForPlugin<H extends PluginLifecycleHooks>({
    pluginName,
    hookName,
    parameters,
  }: {
    pluginName: string
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
  }): Promise<ReturnType<ParseResult<H>> | null> | null {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.execute({
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
    parameters: Parameters<PluginLifecycle[H]>
  }): ReturnType<ParseResult<H>> | null {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.executeSync({
      strategy: 'hookFirst',
      hookName,
      parameters,
      plugin,
    })
  }

  /**
   *
   * Chains, first non-null result stops and returns
   */
  hookFirst<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
    skipped?: ReadonlySet<KubbPlugin> | null
  }): Promise<SafeParseResult<H>> {
    let promise: Promise<SafeParseResult<H>> = Promise.resolve(null as unknown as SafeParseResult<H>)

    for (const plugin of this.getSortedPlugins()) {
      if (skipped && skipped.has(plugin)) {
        continue
      }
      promise = promise.then(async (parseResult) => {
        if (parseResult?.result != null) {
          return parseResult
        }
        const value = await this.execute<H>({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        })

        return Promise.resolve({
          plugin,
          result: value,
        } as typeof parseResult)
      })
    }

    return promise
  }

  /**
   *
   * Chains, first non-null result stops and returns
   */
  hookFirstSync<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    skipped,
  }: {
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
    skipped?: ReadonlySet<KubbPlugin> | null
  }): SafeParseResult<H> {
    let parseResult: SafeParseResult<H> = null as unknown as SafeParseResult<H>

    for (const plugin of this.getSortedPlugins()) {
      if (skipped && skipped.has(plugin)) {
        continue
      }

      parseResult = {
        result: this.executeSync<H>({
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
   *
   * Parallel, runs all plugins
   */
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<PluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOuput>[]> {
    const parallelPromises: Promise<TOuput>[] = []

    for (const plugin of this.getSortedPlugins()) {
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
      const promise: Promise<TOuput> | null = this.execute({ strategy: 'hookParallel', hookName, parameters, plugin })

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
   *
   * Chains, reduces returned value, handling the reduced value as the first hook argument
   */
  hookReduceArg0<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    reduce,
  }: {
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
    reduce: (reduction: Argument0<H>, result: ReturnType<ParseResult<H>>, plugin: KubbPlugin) => PossiblePromise<Argument0<H> | null>
  }): Promise<Argument0<H>> {
    const [argument0, ...rest] = parameters

    let promise: Promise<Argument0<H>> = Promise.resolve(argument0)
    for (const plugin of this.getSortedPlugins()) {
      promise = promise
        .then((arg0) => {
          const value = this.execute({
            strategy: 'hookReduceArg0',
            hookName,
            parameters: [arg0, ...rest] as Parameters<PluginLifecycle[H]>,
            plugin,
          })
          return value
        })
        .then((result) => reduce.call(this.core.api, argument0, result as ReturnType<ParseResult<H>>, plugin)) as Promise<Argument0<H>>
    }
    return promise
  }

  /**
   * Chains plugins
   */
  hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: Parameters<PluginLifecycle[H]> }): Promise<void> {
    let promise: Promise<void | null> = Promise.resolve()
    for (const plugin of this.getSortedPlugins()) {
      promise = promise.then(() =>
        this.execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
        }),
      )
    }
    return promise.then(noReturn)
  }

  private getSortedPlugins(hookName?: keyof PluginLifecycle): KubbPlugin[] {
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

      return this.core
    }
    return pluginByPluginName
  }

  private addExecutedToCallStack(executer: Executer | undefined) {
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
  private execute<H extends PluginLifecycleHooks, TResult = void>({
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
          const possiblePromiseResult = (hook as Function).apply(this.core.api, parameters) as TResult

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
        this.catcher<H>(e, plugin, hookName)

        return null as TResult
      })
      .finally(() => {
        this.addExecutedToCallStack({
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
  private executeSync<H extends PluginLifecycleHooks>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
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
        const fn = (hook as Function).apply(this.core.api, parameters) as ReturnType<ParseResult<H>>

        output = fn
        return fn
      }

      output = hook
      return hook
    } catch (e) {
      this.catcher<H>(e as Error, plugin, hookName)

      return null as ReturnType<ParseResult<H>>
    } finally {
      this.addExecutedToCallStack({
        parameters,
        output,
        strategy,
        hookName,
        plugin,
      })
    }
  }

  private catcher<H extends PluginLifecycleHooks>(e: Error, plugin: KubbPlugin, hookName: H) {
    const text = `${e.message} (plugin: ${plugin.name}, hook: ${hookName})\n`
    const pluginError = new PluginError(text, { cause: e, pluginManager: this })

    this.eventEmitter.emit('error', pluginError)

    throw pluginError
  }
}

function noReturn() {}
