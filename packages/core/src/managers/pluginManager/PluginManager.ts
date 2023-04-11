/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { definePlugin } from '../../plugin'
import { FileManager } from '../fileManager'
import { Queue } from '../../utils/Queue'

import type { QueueTask } from '../../utils/Queue'
import type { Argument0, Strategy } from './types'
import type { KubbConfig, KubbPlugin, PluginLifecycleHooks, PluginLifecycle, MaybePromise, ResolvePathParams, ResolveNameParams } from '../../types'
import type { Logger } from '../../build'
import type { CorePluginOptions } from '../../plugin'

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

export class PluginManager {
  public plugins: KubbPlugin[]

  public readonly fileManager: FileManager

  private readonly logger?: Logger

  private readonly config: KubbConfig

  public readonly core: KubbPlugin<CorePluginOptions>

  public queue: Queue

  constructor(config: KubbConfig, options: { logger?: Logger; task: QueueTask }) {
    this.logger = options.logger
    this.config = config
    this.queue = new Queue(10)

    this.fileManager = new FileManager({ task: options.task, queue: this.queue })
    this.core = definePlugin({
      config,
      fileManager: this.fileManager,
      load: this.load,
      resolvePath: this.resolvePath,
      resolveName: this.resolveName,
    }) as KubbPlugin<CorePluginOptions> & {
      api: CorePluginOptions['api']
    }
    this.plugins = [this.core, ...(config.plugins || [])]
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
    })
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
    })
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
  }): Promise<ReturnType<PluginLifecycle[H]> | null> {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.run({
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
  }): ReturnType<PluginLifecycle[H]> {
    const plugin = this.getPlugin(hookName, pluginName)

    return this.runSync({
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
  }): Promise<ReturnType<PluginLifecycle[H]>> {
    let promise: Promise<ReturnType<PluginLifecycle[H]>> = Promise.resolve(null as ReturnType<PluginLifecycle[H]>)
    for (const plugin of this.getSortedPlugins(hookName)) {
      if (skipped && skipped.has(plugin)) continue
      promise = promise.then((result) => {
        if (result != null) return result
        return this.run({
          strategy: 'hookFirst',
          hookName,
          parameters,
          plugin,
        }) as typeof result
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
  }): ReturnType<PluginLifecycle[H]> {
    let result = null

    for (const plugin of this.getSortedPlugins(hookName)) {
      if (skipped && skipped.has(plugin)) continue

      result = this.runSync<H>({
        strategy: 'hookFirst',
        hookName,
        parameters,
        plugin,
      })

      if (result != null) {
        break
      }
    }
    return result as ReturnType<PluginLifecycle[H]>
  }

  // parallel
  async hookParallel<H extends PluginLifecycleHooks, TOuput = void>({
    hookName,
    parameters,
  }: {
    hookName: H
    parameters?: Parameters<PluginLifecycle[H]> | undefined
  }): Promise<Awaited<TOuput>[]> {
    const parallelPromises: Promise<TOuput>[] = []

    for (const plugin of this.getSortedPlugins(hookName)) {
      if ((plugin[hookName] as { sequential?: boolean })?.sequential) {
        await Promise.all(parallelPromises)
        parallelPromises.length = 0
        await this.run({
          strategy: 'hookParallel',
          hookName,
          parameters,
          plugin,
        })
      } else {
        const promise: Promise<TOuput> = this.run({ strategy: 'hookParallel', hookName, parameters, plugin })

        parallelPromises.push(promise)
      }
    }
    return Promise.all(parallelPromises)
  }

  // chains, reduces returned value, handling the reduced value as the first hook argument
  hookReduceArg0<H extends PluginLifecycleHooks>({
    hookName,
    parameters,
    reduce,
  }: {
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
    reduce: (reduction: Argument0<H>, result: ReturnType<PluginLifecycle[H]>, plugin: KubbPlugin) => MaybePromise<Argument0<H> | null>
  }): Promise<Argument0<H>> {
    const [argument0, ...rest] = parameters

    let promise: Promise<Argument0<H>> = Promise.resolve(argument0)
    for (const plugin of this.getSortedPlugins(hookName)) {
      promise = promise.then((argument0) =>
        this.run({
          strategy: 'hookReduceArg0',
          hookName,
          parameters: [argument0, ...rest] as Parameters<PluginLifecycle[H]>,
          plugin,
        }).then((result) => reduce.call(this.core.api, argument0, result as ReturnType<PluginLifecycle[H]>, plugin))
      ) as Promise<Argument0<H>>
    }
    return promise
  }

  // chains

  hookSeq<H extends PluginLifecycleHooks>({ hookName, parameters }: { hookName: H; parameters?: Parameters<PluginLifecycle[H]> }) {
    let promise: Promise<void> = Promise.resolve()
    for (const plugin of this.getSortedPlugins(hookName)) {
      promise = promise.then(() =>
        this.run({
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
    const plugins = [...this.plugins]

    return plugins
  }

  private getPlugin(hookName: keyof PluginLifecycle, pluginName: string): KubbPlugin {
    const plugins = [...this.plugins]

    const pluginByPluginName = plugins.find((item) => item.name === pluginName && item[hookName])
    if (!pluginByPluginName) {
      // fallback on the core plugin when there is no match
      if (this.config.logLevel === 'warn' && this.logger?.spinner) {
        this.logger.spinner.info(`Plugin hook with ${hookName} not found for plugin ${pluginName}`)
      }
      return this.core
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
  private run<H extends PluginLifecycleHooks, TResult = void>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: unknown[] | undefined
    plugin: KubbPlugin
  }): Promise<TResult> {
    const hook = plugin[hookName]!

    return Promise.resolve()
      .then(() => {
        if (typeof hook !== 'function') {
          return hook
        }

        if (this.config.logLevel === 'info' && this.logger?.spinner) {
          this.logger.spinner.text = `[${strategy}] ${hookName}: Excecuting task for plugin ${plugin.name} \n`
        }

        const hookResult = (hook as Function).apply(this.core.api, parameters)

        if (!(hookResult as Promise<unknown>)?.then) {
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
      }) as Promise<TResult>
  }

  /**
   * Run a sync plugin hook and return the result.
   * @param hookName Name of the plugin hook. Must be in `PluginHooks`.
   * @param args Arguments passed to the plugin hook.
   * @param plugin The acutal plugin
   * @param replaceContext When passed, the plugin context can be overridden.
   */
  private runSync<H extends PluginLifecycleHooks>({
    strategy,
    hookName,
    parameters,
    plugin,
  }: {
    strategy: Strategy
    hookName: H
    parameters: Parameters<PluginLifecycle[H]>
    plugin: KubbPlugin
  }): ReturnType<PluginLifecycle[H]> {
    const hook = plugin[hookName]!

    // const context = this.pluginContexts.get(plugin)!;

    try {
      // eslint-disable-next-line @typescript-eslint/ban-types
      if (typeof hook !== 'function') {
        return hook
      }

      return (hook as Function).apply(this.core.api, parameters)
    } catch (e) {
      this.catcher<H>(e as Error, plugin, hookName)
      return null as ReturnType<PluginLifecycle[H]>
    }
  }

  private catcher<H extends PluginLifecycleHooks>(e: Error, plugin: KubbPlugin, hookName: H) {
    const text = `${e.message} (plugin: ${plugin.name}, hook: ${hookName})\n`

    throw new Error(text, { cause: e })
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noReturn() {}
