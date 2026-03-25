import type { FabricFile } from '@kubb/fabric-core/types'
import type { Strategy } from './PluginDriver.ts'
import type { Config, Plugin, PluginLifecycleHooks } from './types'

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
 * Events emitted during the Kubb code generation lifecycle.
 * These events can be listened to for logging, progress tracking, and custom integrations.
 *
 * @example
 * ```typescript
 * import type { AsyncEventEmitter } from '@internals/utils'
 * import type { KubbEvents } from '@kubb/core'
 *
 * const events: AsyncEventEmitter<KubbEvents> = new AsyncEventEmitter()
 *
 * events.on('lifecycle:start', () => {
 *   console.log('Starting Kubb generation')
 * })
 *
 * events.on('plugin:end', (plugin, { duration }) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbEvents {
  /**
   * Emitted at the beginning of the Kubb lifecycle, before any code generation starts.
   */
  'lifecycle:start': [version: string]
  /**
   * Emitted at the end of the Kubb lifecycle, after all code generation is complete.
   */
  'lifecycle:end': []

  /**
   * Emitted when configuration loading starts.
   */
  'config:start': []
  /**
   * Emitted when configuration loading is complete.
   */
  'config:end': [configs: Array<Config>]

  /**
   * Emitted when code generation phase starts.
   */
  'generation:start': [config: Config]
  /**
   * Emitted when code generation phase completes.
   */
  'generation:end': [config: Config, files: Array<FabricFile.ResolvedFile>, sources: Map<FabricFile.Path, string>]
  /**
   * Emitted with a summary of the generation results.
   * Contains summary lines, title, and success status.
   */
  'generation:summary': [
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
  'format:start': []
  /**
   * Emitted when code formatting completes.
   */
  'format:end': []

  /**
   * Emitted when linting starts.
   */
  'lint:start': []
  /**
   * Emitted when linting completes.
   */
  'lint:end': []

  /**
   * Emitted when plugin hooks execution starts.
   */
  'hooks:start': []
  /**
   * Emitted when plugin hooks execution completes.
   */
  'hooks:end': []

  /**
   * Emitted when a single hook execution starts (e.g., format or lint).
   * The callback should be invoked when the command completes.
   */
  'hook:start': [{ id?: string; command: string; args?: readonly string[] }]
  /**
   * Emitted when a single hook execution completes.
   */
  'hook:end': [{ id?: string; command: string; args?: readonly string[]; success: boolean; error: Error | null }]

  /**
   * Emitted when a new version of Kubb is available.
   */
  'version:new': [currentVersion: string, latestVersion: string]

  /**
   * Informational message event.
   */
  info: [message: string, info?: string]
  /**
   * Error event. Emitted when an error occurs during code generation.
   */
  error: [error: Error, meta?: Record<string, unknown>]
  /**
   * Success message event.
   */
  success: [message: string, info?: string]
  /**
   * Warning message event.
   */
  warn: [message: string, info?: string]
  /**
   * Debug event for detailed logging.
   * Contains timestamp, log messages, and optional filename.
   */
  debug: [info: DebugInfo]

  /**
   * Emitted when file processing starts.
   * Contains the list of files to be processed.
   */
  'files:processing:start': [files: Array<FabricFile.ResolvedFile>]
  /**
   * Emitted for each file being processed, providing progress updates.
   * Contains processed count, total count, percentage, and file details.
   */
  'file:processing:update': [
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
      file: FabricFile.ResolvedFile
      /**
       * Kubb configuration (not present in Fabric).
       * Provides access to the current config during file processing.
       */
      config: Config
    },
  ]
  /**
   * Emitted when file processing completes.
   * Contains the list of processed files.
   */
  'files:processing:end': [files: Array<FabricFile.ResolvedFile>]

  /**
   * Emitted when a plugin starts executing.
   */
  'plugin:start': [plugin: Plugin]
  /**
   * Emitted when a plugin completes execution.
   * Duration in ms.
   */
  'plugin:end': [plugin: Plugin, result: { duration: number; success: boolean; error?: Error }]

  /**
   * Emitted when plugin hook progress tracking starts.
   * Contains the hook name and list of plugins to execute.
   */
  'plugins:hook:progress:start': [progress: HookProgress]
  /**
   * Emitted when plugin hook progress tracking ends.
   * Contains the hook name that completed.
   */
  'plugins:hook:progress:end': [{ hookName: PluginLifecycleHooks }]

  /**
   * Emitted when a plugin hook starts processing.
   * Contains strategy, hook name, plugin, parameters, and output.
   */
  'plugins:hook:processing:start': [execution: HookExecution]
  /**
   * Emitted when a plugin hook completes processing.
   * Contains duration, strategy, hook name, plugin, parameters, and output.
   */
  'plugins:hook:processing:end': [result: HookResult]
}
