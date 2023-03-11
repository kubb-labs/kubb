/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { definePlugin } from '../../plugin'
import { FileManager } from '../fileManager'
import { Queue } from '../../utils/queue'

import type { QueueTask } from '../../utils/queue'
import type { Argument0, Strategy } from './types'
import type { KubbConfig, KubbPlugin, PluginLifecycleHooks, PluginLifecycle, MaybePromise, ResolveIdParams } from '../../types'
import type { Logger } from '../../build'
import type { CorePluginOptions } from '../../plugin'

// inspired by: https://github.com/rollup/rollup/blob/master/src/utils/PluginDriver.ts#

// This will make sure no input hook is omitted
const hookNames: {
  [P in PluginLifecycleHooks]: 1
} = {
  validate: 1,
  buildStart: 1,
  resolveId: 1,
  load: 1,
  transform: 1,
  writeFile: 1,
  buildEnd: 1,
}
export const hooks = Object.keys(hookNames) as [PluginLifecycleHooks]

export class PluginManager {
  public plugins: KubbPlugin[]

  public readonly fileManager: FileManager

  private readonly logger?: Logger

  private readonly config: KubbConfig

  public readonly core: KubbPlugin<CorePluginOptions>

  public queue: Queue

  constructor(config: KubbConfig, options: { logger?: Logger; task: QueueTask<unknown> }) {
    this.logger = options.logger
    this.config = config
    this.queue = new Queue(10)

    this.fileManager = new FileManager({ task: options.task, queue: this.queue })
    this.core = definePlugin({
      config,
      fileManager: this.fileManager,
      load: this.load,
      resolveId: this.resolveId,
    }) as KubbPlugin<CorePluginOptions> & {
      api: CorePluginOptions['api']
    }
    this.plugins = [this.core, ...(config.plugins || [])]
  }

  resolveId = (params: ResolveIdParams) => {
    if (params.pluginName) {
      return this.hookForPlugin(params.pluginName, 'resolveId', [params.fileName, params.directory, params.options])
    }
    return this.hookFirst('resolveId', [params.fileName, params.directory, params.options])
  }

  load = async (id: string) => {
    return this.hookFirst('load', [id])
  }

  // run only hook for a specific plugin name
  hookForPlugin<H extends PluginLifecycleHooks>(
    pluginName: string,
    hookName: H,
    parameters: Parameters<PluginLifecycle[H]>,
    skipped?: ReadonlySet<KubbPlugin> | null
  ): Promise<ReturnType<PluginLifecycle[H]> | null> {
    let promise: Promise<ReturnType<PluginLifecycle[H]> | null> = Promise.resolve(null)
    for (const plugin of this.getSortedPlugins(hookName, pluginName)) {
      if (skipped && skipped.has(plugin)) continue
      promise = promise.then((result) => {
        if (result != null) return result
        return this.run('hookFirst', hookName, parameters, plugin) as any
      })
    }
    return promise
  }

  // chains, first non-null result stops and returns
  hookFirst<H extends PluginLifecycleHooks>(
    hookName: H,
    parameters: Parameters<PluginLifecycle[H]>,
    skipped?: ReadonlySet<KubbPlugin> | null
  ): Promise<ReturnType<PluginLifecycle[H]> | null> {
    let promise: Promise<ReturnType<PluginLifecycle[H]> | null> = Promise.resolve(null)
    for (const plugin of this.getSortedPlugins(hookName)) {
      if (skipped && skipped.has(plugin)) continue
      promise = promise.then((result) => {
        if (result != null) return result
        return this.run('hookFirst', hookName, parameters, plugin) as any
      })
    }
    return promise
  }

  // parallel
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>(hookName: H, parameters?: Parameters<PluginLifecycle[H]> | undefined) {
    const parallelPromises: Promise<TOuput>[] = []

    for (const plugin of this.getSortedPlugins(hookName)) {
      if ((plugin[hookName] as { sequential?: boolean })?.sequential) {
        await Promise.all(parallelPromises)
        parallelPromises.length = 0
        await this.run('hookParallel', hookName, parameters, plugin)
      } else {
        const promise: Promise<TOuput> = this.run('hookParallel', hookName, parameters, plugin)

        parallelPromises.push(promise)
      }
    }
    return Promise.all(parallelPromises)
  }

  // chains, reduces returned value, handling the reduced value as the first hook argument
  hookReduceArg0<H extends PluginLifecycleHooks>(
    hookName: H,
    [argument0, ...rest]: Parameters<PluginLifecycle[H]>,
    reduce: (reduction: Argument0<H>, result: ReturnType<PluginLifecycle[H]>, plugin: KubbPlugin) => MaybePromise<Argument0<H> | null>
  ): Promise<Argument0<H>> {
    let promise = Promise.resolve(argument0)
    for (const plugin of this.getSortedPlugins(hookName)) {
      promise = promise.then((argument0) =>
        this.run('hookReduceArg0', hookName, [argument0, ...rest] as Parameters<PluginLifecycle[H]>, plugin).then((result) =>
          reduce.call(this.core.api, argument0, result, plugin)
        )
      )
    }
    return promise
  }

  // chains

  hookSeq<H extends PluginLifecycleHooks>(hookName: H, parameters?: Parameters<PluginLifecycle[H]>) {
    let promise: Promise<void> = Promise.resolve()
    for (const plugin of this.getSortedPlugins(hookName)) {
      promise = promise.then(() => this.run('hookSeq', hookName, parameters, plugin))
    }
    return promise.then(noReturn)
  }

  private getSortedPlugins(hookName: keyof PluginLifecycle, pluginName?: string): KubbPlugin[] {
    const plugins = [...this.plugins]

    if (pluginName) {
      const pluginsByPluginName = plugins.filter((item) => item.name === pluginName && item[hookName])
      if (pluginsByPluginName.length === 0) {
        // fallback on the core plugin when there is no match
        if (this.config.logLevel === 'warn' && this.logger?.spinner) {
          this.logger.spinner.info(`Plugin hook with ${hookName} not found for plugin ${pluginName}`)
        }
        return [this.core]
      }
      return pluginsByPluginName
    }

    return plugins
  }

  /**
   * Run an async plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be either in `PluginHooks` or `OutputPluginValueHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The actual pluginObject to run.
   */
  // Implementation signature
  private run<H extends PluginLifecycleHooks, TResult = void>(
    strategy: Strategy,
    hookName: H,
    parameters: unknown[] | undefined,
    plugin: KubbPlugin
  ): Promise<TResult> {
    const hook = plugin[hookName]!

    return Promise.resolve()
      .then(() => {
        if (typeof hook !== 'function') {
          return hook
        }

        if (this.config.logLevel === 'info' && this.logger?.spinner) {
          this.logger.spinner.text = `[${strategy}] ${hookName}: Excecuting task for plugin ${plugin.name} \n`
        }

        const hookResult = (hook as any).apply(this.core.api, parameters)

        if (!hookResult?.then) {
          // short circuit for non-thenables and non-Promises
          if (this.config.logLevel === 'info' && this.logger?.spinner) {
            this.logger.spinner.succeed(`[${strategy}] ${hookName}: Excecuting task for plugin ${plugin.name} \n`)
          }
          return hookResult
        }

        return Promise.resolve(hookResult).then((result) => {
          // action was fulfilled
          if (this.config.logLevel === 'info' && this.logger?.spinner) {
            this.logger.spinner.succeed(`[${strategy}] ${hookName}: Excecuting task for plugin ${plugin.name} \n`)
          }
          return result
        })
      })
      .catch((e: Error) => {
        this.catcher<H>(e, plugin, hookName)
      })
  }

  /**
   * Run a sync plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be in `PluginHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The acutal plugin
   * @param replaceContext When passed, the plugin context can be overridden.
   */
  private runSync<H extends PluginLifecycleHooks>(hookName: H, parameters: Parameters<PluginLifecycle[H]>, plugin: KubbPlugin): ReturnType<PluginLifecycle[H]> {
    const hook = plugin[hookName]!

    // const context = this.pluginContexts.get(plugin)!;

    try {
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (hook as Function).apply(this.core.api, parameters)
    } catch (error: any) {
      return error
    }
  }

  private catcher<H extends PluginLifecycleHooks>(e: Error, plugin: KubbPlugin, hookName: H) {
    const text = `${e.message} (plugin: ${plugin.name}, hook: ${hookName})\n`

    throw new Error(text, { cause: e })
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noReturn() {}
