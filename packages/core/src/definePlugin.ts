import type { KubbHooks } from './Kubb.ts'
import type { KubbPluginSetupContext, PluginFactoryOptions } from './types.ts'

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
 * Returns `true` when `plugin` is a hook-style plugin created with `definePlugin`.
 *
 * Used by `PluginDriver` to distinguish hook-style plugins from legacy `createPlugin` plugins
 * so it can normalize them and register their handlers on the `AsyncEventEmitter`.
 */
export function isPlugin(plugin: unknown): plugin is Plugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
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
