/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-argument */

import { definePlugin } from '../../plugin.ts'
import { isPromise } from '../../utils/isPromise.ts'
import { Queue } from '../../utils/Queue.ts'
import { FileManager } from '../fileManager/FileManager.ts'
import type { File } from '../fileManager/types.ts'
import { ParallelPluginError } from './ParallelPluginError.ts'
import { PluginError } from './PluginError.ts'

import type { CorePluginOptions } from '../../plugin.ts'
import type {
  KubbConfig,
  KubbPlugin,
  KubbUserPlugin,
  MaybePromise,
  PluginContext,
  PluginLifecycle,
  PluginLifecycleHooks,
  ResolveNameParams,
  ResolvePathParams,
} from '../../types.ts'
import type { QueueTask } from '../../utils/Queue.ts'
import type { Argument0, Executer, OnExecute, ParseResult, SafeParseResult, Strategy } from './types.ts'

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
// TODO move to utils file
const convertKubbUserPluginToKubbPlugin = (plugin: KubbUserPlugin, context: CorePluginOptions['api'] | undefined): KubbPlugin | null => {
  if (plugin.api && typeof plugin.api === 'function') {
    const api = (plugin.api as Function).call(context)

    return {
      ...plugin,
      api,
    }
  }

  return null
}

type Options = { task: QueueTask<File>; onExecute?: OnExecute<PluginLifecycleHooks> }

export class PluginManager {
  public plugins: KubbPlugin[]

  public readonly fileManager: FileManager

  private readonly onExecute?: OnExecute

  private readonly core: KubbPlugin<CorePluginOptions>

  public queue: Queue

  public executer: Executer | undefined

  public executed: Executer[] = []

  constructor(config: KubbConfig, options: Options) {
    this.onExecute = options.onExecute?.bind(this)
    this.queue = new Queue(10)

    this.fileManager = new FileManager({ task: options.task, queue: this.queue })
    const core = definePlugin({
      config,
      fileManager: this.fileManager,
      load: this.load,
      resolvePath: this.resolvePath,
      resolveName: this.resolveName,
      getExecuter: this.getExecuter.bind(this),
    }) as KubbPlugin<CorePluginOptions> & {
      api: (this: Omit<PluginContext, 'addFile'>) => CorePluginOptions['api']
    }

    const convertedCore = convertKubbUserPluginToKubbPlugin(core, core.api.call(null as any)) as KubbPlugin<CorePluginOptions>

    this.core = convertedCore

    this.plugins = [this.core, ...(config.plugins || [])].reduce((prev, plugin) => {
      // TODO HACK to be sure that this is equal to the `core.api` logic.

      const convertedApi = convertKubbUserPluginToKubbPlugin(plugin, convertedCore?.api)

      if (convertedApi) {
        return [...prev, convertedApi]
      }

      return [...prev, plugin]
    }, [] as KubbPlugin[])
  }

  getExecuter() {
    return this.executer
  }

  resolvePath = (params: ResolvePathParams) => {
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

  resolveName = (params: ResolveNameParams) => {
    if (params.pluginName) {
      return this.hookForPluginSync({
        pluginName: params.pluginName,
        hookName: 'resolveName',
        parameters: [params.name],
      })
    }
    return this.hookFirstSync({
      hookName: 'resolveName',
      parameters: [params.name],
    }).result
  }

  load = async (id: string) => {
    return this.hookFirst({
      hookName: 'load',
      parameters: [id],
    })
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

    for (const plugin of this.getSortedPlugins(hookName)) {
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

    for (const plugin of this.getSortedPlugins(hookName)) {
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

    for (const plugin of this.getSortedPlugins(hookName)) {
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
    const errors = results.filter((result) => result.status === 'rejected').map((result) => (result as PromiseRejectedResult).reason) as PluginError[]

    if (errors.length) {
      console.log(errors)
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
    reduce: (reduction: Argument0<H>, result: ReturnType<ParseResult<H>>, plugin: KubbPlugin) => MaybePromise<Argument0<H> | null>
  }): Promise<Argument0<H>> {
    const [argument0, ...rest] = parameters

    let promise: Promise<Argument0<H>> = Promise.resolve(argument0)
    for (const plugin of this.getSortedPlugins(hookName)) {
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
  hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: Parameters<PluginLifecycle[H]> }) {
    let promise: Promise<void | null> = Promise.resolve()
    for (const plugin of this.getSortedPlugins(hookName)) {
      promise = promise.then(() =>
        this.execute({
          strategy: 'hookSeq',
          hookName,
          parameters,
          plugin,
        })
      )
    }
    return promise.then(noReturn)
  }

  private getSortedPlugins(_hookName: keyof PluginLifecycle): KubbPlugin[] {
    const plugins = [...this.plugins].filter((plugin) => plugin.name !== 'core')

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

  private addExecuter(executer: Executer | undefined) {
    this.onExecute?.call(this, executer, this)

    if (executer) {
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

    if (!hook) {
      return null
    }

    return Promise.resolve()
      .then(() => {
        // add current execution to the variable `this.executer` so we can track which plugin is getting called
        this.executer = {
          strategy,
          hookName,
          plugin,
        }

        if (typeof hook === 'function') {
          const hookResult = (hook as Function).apply(this.core.api, parameters) as TResult

          if (isPromise(hookResult)) {
            return Promise.resolve(hookResult).then((result: TResult) => {
              this.addExecuter({
                strategy,
                hookName,
                plugin,
              })

              return result
            })
          }

          return hookResult
        }

        this.addExecuter({
          strategy,
          hookName,
          plugin,
        })

        return hook
      })
      .catch((e: Error) => {
        this.catcher<H>(e, plugin, hookName)
      }) as Promise<TResult>
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

    if (!hook) {
      return null
    }

    try {
      // add current execution to the variable `this.executer` so we can track which plugin is getting called
      this.executer = {
        strategy,
        hookName,
        plugin,
      }

      if (typeof hook === 'function') {
        const fn = (hook as Function).apply(this.core.api, parameters) as ReturnType<ParseResult<H>>

        this.addExecuter({
          strategy,
          hookName,
          plugin,
        })

        return fn
      }

      this.addExecuter({
        strategy,
        hookName,
        plugin,
      })

      return hook
    } catch (e) {
      this.catcher<H>(e as Error, plugin, hookName)

      return null as ReturnType<ParseResult<H>>
    }
  }

  private catcher<H extends PluginLifecycleHooks>(e: Error, plugin: KubbPlugin, hookName: H) {
    const text = `${e.message} (plugin: ${plugin.name}, hook: ${hookName})\n`

    throw new PluginError(text, { cause: e, pluginManager: this })
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noReturn() {}
