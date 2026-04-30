import type { AsyncEventEmitter } from '@internals/utils'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import type { BuildOutput } from './createKubb.ts'
import type { PluginDriver } from './PluginDriver.ts'
import type {
  Config,
  GeneratorContext,
  KubbBuildEndContext,
  KubbBuildStartContext,
  KubbConfigEndContext,
  KubbDebugContext,
  KubbErrorContext,
  KubbFileProcessingUpdateContext,
  KubbFilesProcessingEndContext,
  KubbFilesProcessingStartContext,
  KubbGenerationEndContext,
  KubbGenerationStartContext,
  KubbGenerationSummaryContext,
  KubbHookEndContext,
  KubbHookStartContext,
  KubbInfoContext,
  KubbLifecycleStartContext,
  KubbPluginEndContext,
  KubbPluginSetupContext,
  KubbPluginStartContext,
  KubbPluginsEndContext,
  KubbSuccessContext,
  KubbVersionNewContext,
  KubbWarnContext,
} from './types'

/**
 * Kubb code generation instance returned by {@link createKubb}.
 *
 * Use this when orchestrating multiple builds, inspecting plugin timings, or integrating Kubb into a larger toolchain.
 * For a single one-off build, chain directly: `await createKubb(config).build()`.
 */
export type Kubb = {
  /**
   * Shared event emitter for lifecycle and status events. Attach listeners before calling `setup()` or `build()`.
   */
  readonly hooks: AsyncEventEmitter<KubbHooks>
  /**
   * Generated source code keyed by absolute file path. Available after `build()` or `safeBuild()` completes.
   */
  readonly sources: Map<string, string>
  /**
   * Plugin driver managing all plugins. Available after `setup()` completes.
   */
  readonly driver: PluginDriver | undefined
  /**
   * Resolved configuration with defaults applied. Available after `setup()` completes.
   */
  readonly config: Config | undefined
  /**
   * Resolves config and initializes the driver. `build()` calls this automatically.
   */
  setup(): Promise<void>
  /**
   * Runs the full pipeline and throws on any plugin error. Automatically calls `setup()` if needed.
   */
  build(): Promise<BuildOutput>
  /**
   * Runs the full pipeline and captures errors in `BuildOutput` instead of throwing. Automatically calls `setup()` if needed.
   */
  safeBuild(): Promise<BuildOutput>
}

/**
 * Lifecycle events emitted during Kubb code generation.
 * Use these for logging, progress tracking, and custom integrations.
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
 * hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbHooks {
  /**
   * Fires at the start of the Kubb lifecycle, before code generation begins.
   */
  'kubb:lifecycle:start': [ctx: KubbLifecycleStartContext]
  /**
   * Fires at the end of the Kubb lifecycle, after all code generation completes.
   */
  'kubb:lifecycle:end': []

  /**
   * Fires when configuration loading starts.
   */
  'kubb:config:start': []
  /**
   * Fires when configuration loading completes.
   */
  'kubb:config:end': [ctx: KubbConfigEndContext]

  /**
   * Fires when code generation starts.
   */
  'kubb:generation:start': [ctx: KubbGenerationStartContext]
  /**
   * Fires when code generation completes.
   */
  'kubb:generation:end': [ctx: KubbGenerationEndContext]
  /**
   * Fires with a generation summary including summary lines, title, and success status.
   */
  'kubb:generation:summary': [ctx: KubbGenerationSummaryContext]

  /**
   * Fires when code formatting starts (e.g., Biome or Prettier).
   */
  'kubb:format:start': []
  /**
   * Fires when code formatting completes.
   */
  'kubb:format:end': []

  /**
   * Fires when linting starts.
   */
  'kubb:lint:start': []
  /**
   * Fires when linting completes.
   */
  'kubb:lint:end': []

  /**
   * Fires when plugin hooks execution starts.
   */
  'kubb:hooks:start': []
  /**
   * Fires when plugin hooks execution completes.
   */
  'kubb:hooks:end': []

  /**
   * Fires when a single hook executes (e.g., format or lint). The callback is invoked when the command finishes.
   */
  'kubb:hook:start': [ctx: KubbHookStartContext]
  /**
   * Fires when a single hook execution completes.
   */
  'kubb:hook:end': [ctx: KubbHookEndContext]

  /**
   * Fires when a new Kubb version is available.
   */
  'kubb:version:new': [ctx: KubbVersionNewContext]

  /**
   * Informational message event.
   */
  'kubb:info': [ctx: KubbInfoContext]
  /**
   * Error event, fired when an error occurs during generation.
   */
  'kubb:error': [ctx: KubbErrorContext]
  /**
   * Success message event.
   */
  'kubb:success': [ctx: KubbSuccessContext]
  /**
   * Warning message event.
   */
  'kubb:warn': [ctx: KubbWarnContext]
  /**
   * Debug event for detailed logging with timestamp and optional filename.
   */
  'kubb:debug': [ctx: KubbDebugContext]

  /**
   * Fires when file processing starts with the list of files to process.
   */
  'kubb:files:processing:start': [ctx: KubbFilesProcessingStartContext]
  /**
   * Fires for each file with progress updates: processed count, total, percentage, and file details.
   */
  'kubb:file:processing:update': [ctx: KubbFileProcessingUpdateContext]
  /**
   * Fires when file processing completes with the list of processed files.
   */
  'kubb:files:processing:end': [ctx: KubbFilesProcessingEndContext]

  /**
   * Fires when a plugin starts execution.
   */
  'kubb:plugin:start': [ctx: KubbPluginStartContext]
  /**
   * Fires when a plugin completes execution. Duration measured in milliseconds.
   */
  'kubb:plugin:end': [ctx: KubbPluginEndContext]

  /**
   * Fires once before plugins execute — allowing plugins to register generators, configure resolvers/transformers/renderers, or inject files.
   */
  'kubb:plugin:setup': [ctx: KubbPluginSetupContext]
  /**
   * Fires before the plugin execution loop begins. The adapter has already parsed the source and `inputNode` is available.
   */
  'kubb:build:start': [ctx: KubbBuildStartContext]
  /**
   * Fires after all plugins run and per-plugin barrels generate, but before files write to disk.
   * Use this to inject final files that must persist in the same write pass as plugin output.
   */
  'kubb:plugins:end': [ctx: KubbPluginsEndContext]
  /**
   * Fires after all files write to disk.
   */
  'kubb:build:end': [ctx: KubbBuildEndContext]

  /**
   * Fires for each schema node during AST traversal. Generator listeners respond to this.
   */
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
  /**
   * Fires for each operation node during AST traversal. Generator listeners respond to this.
   */
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
  /**
   * Fires once after all operations traverse with the full collected array. Batch generator listeners respond to this.
   */
  'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
}

declare global {
  namespace Kubb {
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

    /**
     * Extension point for root `Config['output']` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the global output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface ConfigOptionsRegistry {
     *       output: {
     *         barrel?: import('./types.ts').BarrelConfig | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface ConfigOptionsRegistry {}

    /**
     * Extension point for per-plugin `Output` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the per-plugin output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface PluginOptionsRegistry {
     *       output: {
     *         barrel?: import('./types.ts').PluginBarrelConfig | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface PluginOptionsRegistry {}
  }
}
