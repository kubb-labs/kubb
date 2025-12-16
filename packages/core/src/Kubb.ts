import type { KubbFile } from '@kubb/fabric-core/types'
import type { Strategy } from './PluginManager.ts'
import type { Config, Plugin, PluginLifecycleHooks } from './types'

type DebugEvent = {
  date: Date
  logs: string[]
  fileName?: string
}

type ProgressStartMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H
  plugins: Array<Plugin>
}

type ProgressStopMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  hookName: H
}

type ExecutingMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: unknown[] | undefined
  output?: unknown
}

type ExecutedMeta<H extends PluginLifecycleHooks = PluginLifecycleHooks> = {
  duration: number
  strategy: Strategy
  hookName: H
  plugin: Plugin
  parameters?: unknown[] | undefined
  output?: unknown
}

// TODO add more Kubb related types like Context, Plugin, ... this will keep the root types clean of Kubb related types (and we could export all types via .types.ts like Fabric)

/**
 * Events emitted during the Kubb code generation lifecycle.
 * These events can be listened to for logging, progress tracking, and custom integrations.
 *
 * @example
 * ```typescript
 * import type { AsyncEventEmitter } from '@kubb/core'
 * import type { KubbEvents } from '@kubb/core'
 *
 * const events: AsyncEventEmitter<KubbEvents> = new AsyncEventEmitter()
 *
 * events.on('lifecycle:start', () => {
 *   console.log('Starting Kubb generation')
 * })
 *
 * events.on('plugin:end', (plugin, duration) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbEvents {
  /**
   * Emitted at the beginning of the Kubb lifecycle, before any code generation starts.
   * Use this to initialize loggers, progress bars, or other setup tasks.
   */
  'lifecycle:start': []

  /**
   * Emitted at the end of the Kubb lifecycle, after all code generation is complete.
   * Use this to finalize loggers, close resources, or perform cleanup tasks.
   */
  'lifecycle:end': []

  /**
   * Emitted when configuration loading starts.
   */
  'config:start': []

  /**
   * Emitted when configuration loading is complete.
   */
  'config:end': []

  /**
   * Emitted when code generation phase starts.
   * @param name - Optional name of the generation task
   */
  'generation:start': [name: string | undefined]

  /**
   * Emitted when code generation phase completes.
   * @param name - Optional name of the generation task
   */
  'generation:end': [name: string | undefined]

  /**
   * Emitted with a summary of the generation results.
   * Contains summary lines, title, and success status.
   */
  'generation:summary': [
    {
      /** Array of summary message lines */
      summary: string[]
      /** Title of the summary */
      title: string
      /** Whether the generation was successful */
      success: boolean
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
   * Emitted when a single hook execution starts.
   * @param command - The command being executed
   */
  'hook:start': [command: string]

  /**
   * Emitted to execute a hook command (e.g., format or lint).
   * The callback should be invoked when the command completes.
   * @param options - Command and optional arguments
   * @param cb - Callback to invoke when command completes
   */
  'hook:execute': [{ command: string | URL; args?: readonly string[] }, cb: () => void]

  /**
   * Emitted when a single hook execution completes.
   * @param command - The command that was executed
   */
  'hook:end': [command: string]

  /**
   * Emitted when a new version of Kubb is available.
   * @param currentVersion - The currently installed version
   * @param latestVersion - The latest available version
   */
  'version:new': [currentVersion: string, latestVersion: string]

  /**
   * Informational message event.
   * @param message - The main message
   * @param info - Optional additional information
   */
  info: [message: string, info?: string]

  /**
   * Error event. Emitted when an error occurs during code generation.
   * @param error - The error that occurred
   * @param meta - Optional metadata about the error context
   */
  error: [error: Error, meta?: Record<string, unknown>]

  /**
   * Success message event.
   * @param message - The success message
   * @param info - Optional additional information
   */
  success: [message: string, info?: string]

  /**
   * Warning message event.
   * @param message - The warning message
   * @param info - Optional additional information
   */
  warn: [message: string, info?: string]

  /**
   * Debug event for detailed logging.
   * Contains timestamp, log messages, and optional filename.
   * @param meta - Debug event metadata
   */
  debug: [meta: DebugEvent]

  /**
   * Emitted when file processing starts.
   * Contains the list of files to be processed.
   */
  'files:processing:start': [{ files: KubbFile.ResolvedFile[] }]

  /**
   * Emitted for each file being processed, providing progress updates.
   * Contains processed count, total count, percentage, and file details.
   */
  'file:processing:update': [
    {
      /** Number of files processed so far */
      processed: number
      /** Total number of files to process */
      total: number
      /** Processing percentage (0-100) */
      percentage: number
      /** Optional source identifier */
      source?: string
      /** The file being processed */
      file: KubbFile.ResolvedFile
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
  'files:processing:end': [{ files: KubbFile.ResolvedFile[] }]

  /**
   * Emitted when a plugin starts executing.
   * @param plugin - The plugin that is starting
   */
  'plugin:start': [plugin: Plugin]

  /**
   * Emitted when a plugin completes execution.
   * @param plugin - The plugin that completed
   * @param duration - Execution duration in milliseconds
   */
  'plugin:end': [plugin: Plugin, duration: number]

  /**
   * Emitted when plugin hook progress tracking starts.
   * Contains the hook name and list of plugins to execute.
   */
  'plugins:hook:progress:start': [meta: ProgressStartMeta]

  /**
   * Emitted when plugin hook progress tracking ends.
   * Contains the hook name that completed.
   */
  'plugins:hook:progress:end': [meta: ProgressStopMeta]

  /**
   * Emitted when a plugin hook starts processing.
   * Contains strategy, hook name, plugin, parameters, and output.
   */
  'plugins:hook:processing:start': [meta: ExecutingMeta]

  /**
   * Emitted when a plugin hook completes processing.
   * Contains duration, strategy, hook name, plugin, parameters, and output.
   */
  'plugins:hook:processing:end': [meta: ExecutedMeta]
}
