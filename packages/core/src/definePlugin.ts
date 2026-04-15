import type { KubbHooks } from './Kubb.ts'
import type { KubbPluginSetupContext, PluginFactoryOptions } from './types.ts'

/**
 * Base hook handlers for all events except `kubb:plugin:setup`.
 * These handlers have identical signatures regardless of the plugin's
 * `PluginFactoryOptions` generic — they are split out so that the
 * interface below only needs to override the one event that depends on
 * the plugin type.
 */
type PluginHooksBase = {
  [K in Exclude<keyof KubbHooks, 'kubb:plugin:setup'>]?: (...args: KubbHooks[K]) => void | Promise<void>
}

/**
 * Plugin hook handlers.
 *
 * `kubb:plugin:setup` is typed with the plugin's own `PluginFactoryOptions` so
 * `ctx.setResolver`, `ctx.setOptions`, `ctx.options` etc. use the correct types.
 *
 * Uses interface + method shorthand for `kubb:plugin:setup`
 * checking, allowing `PluginHooks<PluginTs>` to be assignable to `PluginHooks`.
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
 */
export interface PluginHooks<TFactory extends PluginFactoryOptions = PluginFactoryOptions> extends PluginHooksBase {
  'kubb:plugin:setup'?(ctx: KubbPluginSetupContext<TFactory>): void | Promise<void>
}

/**
 * A hook-style plugin object produced by `definePlugin`.
 * Instead of flat lifecycle methods, it groups all handlers under a `hooks:` property
 * (matching Astro's integration naming convention).
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
 */
export type HookStylePlugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
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
   * The options passed by the user when calling the plugin factory.
   */
  options?: TFactory['options']
  /**
   * Lifecycle event handlers for this plugin.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: PluginHooks<TFactory>
}

/**
 * Returns `true` when `plugin` is a hook-style plugin created with `definePlugin`.
 *
 * Used by `PluginDriver` to distinguish hook-style plugins from legacy `createPlugin` plugins
 * so it can normalize them and register their handlers on the `AsyncEventEmitter`.
 */
export function isHookStylePlugin(plugin: unknown): plugin is HookStylePlugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
}

/**
 * Creates a plugin factory using the new hook-style (`hooks:`) API.
 *
 * The returned factory is called with optional options and produces a `HookStylePlugin`
 * that coexists with plugins created via the legacy `createPlugin` API in the same
 * `kubb.config.ts`.
 *
 * Lifecycle handlers are registered on the `PluginDriver`'s `AsyncEventEmitter`, enabling
 * both the plugin's own handlers and external tooling (CLI, devtools) to observe every event.
 *
 * @example
 * ```ts
 * // With PluginFactoryOptions (recommended for real plugins)
 * export const pluginTs = definePlugin<PluginTs>((options) => ({
 *   name: 'plugin-ts',
 *   hooks: {
 *     'kubb:plugin:setup'(ctx) {
 *       ctx.setResolver(resolverTs)  // typed as Partial<ResolverTs>
 *     },
 *   },
 * }))
 * ```
 */
export function definePlugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(
  factory: (options: TFactory['options']) => HookStylePlugin<TFactory>,
): (options?: TFactory['options']) => HookStylePlugin<TFactory> {
  return (options) => factory(options ?? ({} as TFactory['options']))
}
