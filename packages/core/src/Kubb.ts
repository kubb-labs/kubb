import type { AsyncEventEmitter } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast/types'
import type { BuildOutput } from './createKubb.ts'
import type { PluginDriver, Strategy } from './PluginDriver.ts'
import type { Config, GeneratorContext, KubbBuildEndContext, KubbBuildStartContext, KubbPluginSetupContext, Plugin, PluginLifecycleHooks } from './types'

type DebugInfo = {
  date: Date
  logs: Array<string>
  fileName?: string
}

type HookProgress<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H
  plugins: Array<Plugin>
}

type HookExecution<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: Array<unknown>
  output?: unknown
}

type HookResult<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  duration: number
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: Array<unknown>
  output?: unknown
}

/**
 * The instance returned by {@link createKubb}.
 */
export type Kubb = {
  /**
   * The shared event emitter. Attach listeners here before calling `setup()` or `build()`.
   */
  readonly hooks: AsyncEventEmitter<KubbHooks>
  /**
   * Raw generated source, keyed by absolute file path.
   * Populated after a successful `build()` or `safeBuild()` call.
   */
  readonly sources: Map<string, string>
  /**
   * The plugin driver. Available after `setup()` has been called.
   */
  readonly driver: PluginDriver | undefined
  /**
   * The resolved config with applied defaults. Available after `setup()` has been called.
   */
  readonly config: Config | undefined
  /**
   * Initializes all Kubb infrastructure: validates input, applies config defaults,
   * runs the adapter, and creates the PluginDriver.
   *
   * Calling `build()` or `safeBuild()` without calling `setup()` first will
   * automatically invoke `setup()` before proceeding.
   */
  setup(): Promise<void>
  /**
   * Runs a full Kubb build and throws on any error or plugin failure.
   * Automatically calls `setup()` if it has not been called yet.
   */
  build(): Promise<BuildOutput>
  /**
   * Runs a full Kubb build and captures errors instead of throwing.
   * Automatically calls `setup()` if it has not been called yet.
   */
  safeBuild(): Promise<BuildOutput>
}

/**
 * Events emitted during the Kubb code generation lifecycle.
 * These events can be listened to for logging, progress tracking, and custom integrations.
 *
 * @example
 * ```typescript
 * import type { AsyncEventEmitter } from '@internals/utils'
 * import type { KubbHooks } from '@kubb/core'
 *
 * const hooks: AsyncEventEmitter<KubbHooks> = new AsyncEventEmitter()
 *
 * hooks.on('kubb:lifecycle:start', () => {
 *   console.log('Starting Kubb generation')
 * })
 *
 * hooks.on('kubb:plugin:end', (plugin, { duration }) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbHooks {
  /**
   * Emitted at the beginning of the Kubb lifecycle, before any code generation starts.
   */
  'kubb:lifecycle:start': [version: string]
  /**
   * Emitted at the end of the Kubb lifecycle, after all code generation is complete.
   */
  'kubb:lifecycle:end': []

  /**
   * Emitted when configuration loading starts.
   */
  'kubb:config:start': []
  /**
   * Emitted when configuration loading is complete.
   */
  'kubb:config:end': [configs: Array<Config>]

  /**
   * Emitted when code generation phase starts.
   */
  'kubb:generation:start': [config: Config]
  /**
   * Emitted when code generation phase completes.
   */
  'kubb:generation:end': [config: Config, files: Array<FileNode>, sources: Map<string, string>]
  /**
   * Emitted with a summary of the generation results.
   * Contains summary lines, title, and success status.
   */
  'kubb:generation:summary': [
    config: Config,
    {
      failedPlugins: Set<{ plugin: Plugin; error: Error }>
      status: 'success' | 'failed'
      hrStart: [number, number]
      filesCreated: number
      pluginTimings?: Map<Plugin['name'], number>
    },
  ]

  /**
   * Emitted when code formatting starts (e.g., running Biome or Prettier).
   */
  'kubb:format:start': []
  /**
   * Emitted when code formatting completes.
   */
  'kubb:format:end': []

  /**
   * Emitted when linting starts.
   */
  'kubb:lint:start': []
  /**
   * Emitted when linting completes.
   */
  'kubb:lint:end': []

  /**
   * Emitted when plugin hooks execution starts.
   */
  'kubb:hooks:start': []
  /**
   * Emitted when plugin hooks execution completes.
   */
  'kubb:hooks:end': []

  /**
   * Emitted when a single hook execution starts (e.g., format or lint).
   * The callback should be invoked when the command completes.
   */
  'kubb:hook:start': [{ id?: string; command: string; args?: readonly string[] }]
  /**
   * Emitted when a single hook execution completes.
   */
  'kubb:hook:end': [{ id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }]

  /**
   * Emitted when a new version of Kubb is available.
   */
  'kubb:version:new': [currentVersion: string, latestVersion: string]

  /**
   * Informational message event.
   */
  'kubb:info': [message: string, info?: string]
  /**
   * Error event. Emitted when an error occurs during code generation.
   */
  'kubb:error': [error: Error, meta?: Record<string, unknown>]
  /**
   * Success message event.
   */
  'kubb:success': [message: string, info?: string]
  /**
   * Warning message event.
   */
  'kubb:warn': [message: string, info?: string]
  /**
   * Debug event for detailed logging.
   * Contains timestamp, log messages, and optional filename.
   */
  'kubb:debug': [info: DebugInfo]

  /**
   * Emitted when file processing starts.
   * Contains the list of files to be processed.
   */
  'kubb:files:processing:start': [files: Array<FileNode>]
  /**
   * Emitted for each file being processed, providing progress updates.
   * Contains processed count, total count, percentage, and file details.
   */
  'kubb:file:processing:update': [
    {
      /**
       * Number of files processed so far.
       */
      processed: number
      /**
       * Total number of files to process.
       */
      total: number
      /**
       * Processing percentage (0–100).
       */
      percentage: number
      /**
       * Optional source identifier.
       */
      source?: string
      /**
       * The file being processed.
       */
      file: FileNode
      /**
       * Kubb configuration
       * Provides access to the current config during file processing.
       */
      config: Config
    },
  ]
  /**
   * Emitted when file processing completes.
   * Contains the list of processed files.
   */
  'kubb:files:processing:end': [files: Array<FileNode>]

  /**
   * Emitted when a plugin starts executing.
   */
  'kubb:plugin:start': [plugin: Plugin]
  /**
   * Emitted when a plugin completes execution.
   * Duration in ms.
   */
  'kubb:plugin:end': [plugin: Plugin, result: { duration: number; success: boolean; error?: Error }]

  /**
   * Emitted when plugin hook progress tracking starts.
   * Contains the hook name and list of plugins to execute.
   */
  'kubb:plugins:hook:progress:start': [progress: HookProgress]
  /**
   * Emitted when plugin hook progress tracking ends.
   * Contains the hook name that completed.
   */
  'kubb:plugins:hook:progress:end': [{ hookName: PluginLifecycleHooks }]

  /**
   * Emitted when a plugin hook starts processing.
   * Contains strategy, hook name, plugin, parameters, and output.
   */
  'kubb:plugins:hook:processing:start': [execution: HookExecution]
  /**
   * Emitted when a plugin hook completes processing.
   * Contains duration, strategy, hook name, plugin, parameters, and output.
   */
  'kubb:plugins:hook:processing:end': [result: HookResult]

  /**
   * Fired once — before any plugin's `buildStart` runs — so that hook-style plugins
   * can register generators, configure resolvers/transformers/renderers, or inject
   * extra files.  All `kubb:plugin:setup` handlers registered via `definePlugin` receive
   * a plugin-specific context (with the correct `addGenerator` closure).
   * External tooling can observe this event via `hooks.on('kubb:plugin:setup', …)`.
   */
  'kubb:plugin:setup': [ctx: KubbPluginSetupContext]
  /**
   * Fired immediately before the plugin execution loop begins.
   * The adapter has already parsed the source and `inputNode` is available.
   */
  'kubb:build:start': [ctx: KubbBuildStartContext]
  /**
   * Fired after all files have been written to disk.
   */
  'kubb:build:end': [ctx: KubbBuildEndContext]

  /**
   * Emitted for each schema node during the AST walk.
   * Generator listeners registered via `addGenerator()` in `kubb:plugin:setup` respond to this event.
   * The `ctx.plugin.name` identifies which plugin is driving the current walk.
   * `ctx.options` carries the per-node resolved options (after exclude/include/override).
   */
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
  /**
   * Emitted for each operation node during the AST walk.
   * Generator listeners registered via `addGenerator()` in `kubb:plugin:setup` respond to this event.
   * The `ctx.plugin.name` identifies which plugin is driving the current walk.
   * `ctx.options` carries the per-node resolved options (after exclude/include/override).
   */
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
  /**
   * Emitted once after all operations have been walked, with the full collected array.
   * Generator listeners with an `operations()` method respond to this event.
   * The `ctx.plugin.name` identifies which plugin is driving the current walk.
   * `ctx.options` carries the plugin-level resolved options for the batch call.
   */
  'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
}

declare global {
  namespace Kubb {
    interface PluginContext {}
    /**
     * Registry that maps plugin names to their `PluginFactoryOptions`.
     * Augment this interface in each plugin's `types.ts` to enable automatic
     * typing for `getPlugin` and `requirePlugin`.
     *
     * @example
     * ```ts
     * // packages/plugin-ts/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface PluginRegistry {
     *       'plugin-ts': PluginTs
     *     }
     *   }
     * }
     * ```
     */
    interface PluginRegistry {}
  }
}
