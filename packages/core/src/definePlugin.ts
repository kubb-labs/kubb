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
 * A plugin object produced by `definePlugin`.
 * Groups all lifecycle handlers under a `hooks:` property.
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
 */
export type HookStylePlugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name for the plugin.
   */
  name: string
  /**
   * Plugins that must be registered before this plugin executes.
   * An error is thrown at startup when any listed dependency is missing.
   */
  dependencies?: Array<string>
  /**
   * Optional predicate controlling whether this plugin is active.
   * When it returns `false` the plugin is excluded from the driver.
   */
  apply?: (config: unknown) => boolean
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
 * Used by `PluginDriver` to distinguish hook-style plugins from legacy plugins.
 */
export function isPlugin(plugin: unknown): plugin is HookStylePlugin {
  return typeof plugin === 'object' && plugin !== null && 'hooks' in plugin
}

/**
 * Creates a plugin factory using the hook-style (`hooks:`) API.
 *
 * The returned factory is called with optional options and produces a `HookStylePlugin`.
 *
 * @example
 * ```ts
 * export const pluginTs = definePlugin<PluginTs>((options) => ({
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
  factory: (options: TFactory['options']) => HookStylePlugin<TFactory>,
): (options?: TFactory['options']) => HookStylePlugin<TFactory> {
  return (options) => factory(options ?? ({} as TFactory['options']))
}
