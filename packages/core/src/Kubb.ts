import type { AsyncEventEmitter } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { BuildOutput } from './createKubb.ts'
import type { Plugin } from './definePlugin.ts'
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
  KubbSuccessContext,
  KubbVersionNewContext,
  KubbWarnContext,
} from './types'

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
 * hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbHooks {
  /**
   * Emitted at the beginning of the Kubb lifecycle, before any code generation starts.
   */
  'kubb:lifecycle:start': [ctx: KubbLifecycleStartContext]
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
  'kubb:config:end': [ctx: KubbConfigEndContext]

  /**
   * Emitted when code generation phase starts.
   */
  'kubb:generation:start': [ctx: KubbGenerationStartContext]
  /**
   * Emitted when code generation phase completes.
   */
  'kubb:generation:end': [ctx: KubbGenerationEndContext]
  /**
   * Emitted with a summary of the generation results.
   * Contains summary lines, title, and success status.
   */
  'kubb:generation:summary': [ctx: KubbGenerationSummaryContext]

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
  'kubb:hook:start': [ctx: KubbHookStartContext]
  /**
   * Emitted when a single hook execution completes.
   */
  'kubb:hook:end': [ctx: KubbHookEndContext]

  /**
   * Emitted when a new version of Kubb is available.
   */
  'kubb:version:new': [ctx: KubbVersionNewContext]

  /**
   * Informational message event.
   */
  'kubb:info': [ctx: KubbInfoContext]
  /**
   * Error event. Emitted when an error occurs during code generation.
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
   * Debug event for detailed logging.
   * Contains timestamp, log messages, and optional filename.
   */
  'kubb:debug': [ctx: KubbDebugContext]

  /**
   * Emitted when file processing starts.
   * Contains the list of files to be processed.
   */
  'kubb:files:processing:start': [ctx: KubbFilesProcessingStartContext]
  /**
   * Emitted for each file being processed, providing progress updates.
   * Contains processed count, total count, percentage, and file details.
   */
  'kubb:file:processing:update': [ctx: KubbFileProcessingUpdateContext]
  /**
   * Emitted when file processing completes.
   * Contains the list of processed files.
   */
  'kubb:files:processing:end': [ctx: KubbFilesProcessingEndContext]

  /**
   * Emitted when a plugin starts executing.
   */
  'kubb:plugin:start': [ctx: KubbPluginStartContext]
  /**
   * Emitted when a plugin completes execution.
   * Duration in ms.
   */
  'kubb:plugin:end': [ctx: KubbPluginEndContext]

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
