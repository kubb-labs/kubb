import type { FileNode, UserFileNode, Visitor } from '@kubb/ast'
import type { Resolver } from './defineResolver.ts'
import type { KubbHooks } from './types.ts'
import type { Config, Exclude as FilterExclude, Generator, Include, Output, Override, RendererFactory } from './types.ts'

export type PluginFactoryOptions<
  /**
   * Unique plugin name.
   */
  TName extends string = string,
  /**
   * User-facing plugin options.
   */
  TOptions extends object = object,
  /**
   * Plugin options after defaults are applied.
   */
  TResolvedOptions extends object = TOptions,
  /**
   * Resolver that encapsulates naming and path-resolution helpers.
   * Define with `defineResolver` and export alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  resolver: TResolver
}

/**
 * Context for hook-style plugin `kubb:plugin:setup` handler.
 * Provides methods to register generators, configure resolvers, transformers, and renderers.
 */
export type KubbPluginSetupContext<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Register a generator dynamically. Generators fire during the AST walk (schema/operation/operations)
   * just like generators declared statically on `createPlugin`.
   */
  addGenerator<TElement = unknown>(generator: Generator<TFactory, TElement>): void
  /**
   * Set or override the resolver for this plugin.
   * The resolver controls file naming and path resolution.
   */
  setResolver(resolver: Partial<TFactory['resolver']>): void
  /**
   * Set the AST transformer to pre-process nodes before they reach generators.
   */
  setTransformer(visitor: Visitor): void
  /**
   * Set the renderer factory to process JSX elements from generators.
   */
  setRenderer(renderer: RendererFactory): void
  /**
   * Set resolved options merged into the normalized plugin's `options`.
   * Call this in `kubb:plugin:setup` to provide options generators need.
   */
  setOptions(options: TFactory['resolvedOptions']): void
  /**
   * Inject a raw file into the build output, bypassing the generation pipeline.
   */
  injectFile(userFileNode: UserFileNode): void
  /**
   * Merge a partial config update into the current build configuration.
   */
  updateConfig(config: Partial<Config>): void
  /**
   * The resolved build configuration at setup time.
   */
  config: Config
  /**
   * The plugin's user-provided options.
   */
  options: TFactory['options']
}

/**
 * A plugin object produced by `definePlugin`.
 * Instead of flat lifecycle methods, it groups all handlers under a `hooks:` property
 * (matching Astro's integration naming convention).
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
 */
export type Plugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name for the plugin, following the same naming convention as `createPlugin`.
   */
  name: string
  /**
   * Plugins that must be registered before this plugin executes.
   * An error is thrown at startup when any listed dependency is missing.
   */
  dependencies?: Array<string>
  /**
   * Controls the execution order of this plugin relative to others.
   *
   * - `'pre'`  — runs before all normal plugins.
   * - `'post'` — runs after all normal plugins.
   * - `undefined` (default) — runs in declaration order among normal plugins.
   *
   * Dependency constraints always take precedence over `enforce`.
   */
  enforce?: 'pre' | 'post'
  /**
   * The options passed by the user when calling the plugin factory.
   */
  options?: TFactory['options']
  /**
   * Lifecycle event handlers for this plugin.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: {
    [K in Exclude<keyof KubbHooks, 'kubb:plugin:setup'>]?: (...args: KubbHooks[K]) => void | Promise<void>
  } & {
    'kubb:plugin:setup'?(ctx: KubbPluginSetupContext<TFactory>): void | Promise<void>
  }
}

/**
 * Normalized plugin after setup, with runtime fields populated.
 * For internal use only — plugins use the public `Plugin` type externally.
 *
 * @internal
 */
export type NormalizedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & {
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<FilterExclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  resolver: TOptions['resolver']
  transformer?: Visitor
  renderer?: RendererFactory
  generators?: Array<Generator>
  apply?: (config: Config) => boolean
  version?: string
}

export type KubbPluginStartContext = {
  plugin: NormalizedPlugin
}

export type KubbPluginEndContext = {
  plugin: NormalizedPlugin
  duration: number
  success: boolean
  error?: Error
  config: Config
  /**
   * Returns all files currently in the file manager (lazy snapshot).
   * Includes files added by plugins that have already run.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Upsert one or more files into the file manager.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

/**
 * Wraps a factory function and returns a typed `Plugin` with lifecycle handlers grouped under `hooks`.
 *
 * Handlers live in a single `hooks` object (inspired by Astro integrations).
 * All lifecycle events from `KubbHooks` are available for subscription.
 *
 * @note For real plugins, use a `PluginFactoryOptions` type parameter to get type-safe context in `kubb:plugin:setup`.
 * Plugin names should follow the convention `plugin-<feature>` (e.g., `plugin-react-query`, `plugin-zod`).
 *
 * @example
 * ```ts
 * import { definePlugin } from '@kubb/core'
 *
 * export const pluginTs = definePlugin((options: { prefix?: string } = {}) => ({
 *   name: 'plugin-ts',
 *   hooks: {
 *     'kubb:plugin:setup'(ctx) {
 *       ctx.setResolver(resolverTs)
 *     },
 *   },
 * }))
 * ```
 */
export function definePlugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(
  factory: (options: TFactory['options']) => Plugin<TFactory>,
): (options?: TFactory['options']) => Plugin<TFactory> {
  return (options) => factory(options ?? ({} as TFactory['options']))
}
