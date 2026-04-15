import type { KubbHooks } from './Kubb.ts'
import type { KubbPluginSetupContext } from './types.ts'

/**
 * Converts the global `KubbHooks` tuple-style event signatures into optional
 * callback-style handlers for use on a `HookStylePlugin`.
 *
 * Every key from the shared `KubbHooks` interface is available as an optional hook.
 * The `kubb:plugin:setup` event is widened with the plugin's own `options` type so that
 * `ctx.options` is strongly typed inside the handler.
 *
 * @template TOptions - The plugin's own options type; tightens `ctx.options` in `kubb:plugin:setup`.
 */
export type PluginHooks<TOptions = object> = {
  [K in keyof KubbHooks]?: K extends 'kubb:plugin:setup'
    ? (ctx: KubbPluginSetupContext & { options: TOptions }) => void | Promise<void>
    : (...args: KubbHooks[K]) => void | Promise<void>
}

/**
 * A hook-style plugin object produced by `definePlugin`.
 * Instead of flat lifecycle methods, it groups all handlers under a `hooks:` property
 * (matching Astro's integration naming convention).
 *
 * @template TOptions - The plugin's own options type.
 */
export type HookStylePlugin<TOptions = object> = {
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
  options?: TOptions
  /**
   * Lifecycle event handlers for this plugin.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: PluginHooks<TOptions>
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
 * import { definePlugin, defineGenerator } from '@kubb/core'
 *
 * export const myPlugin = definePlugin<{ tag: string }>((options) => ({
 *   name: 'my-plugin',
 *   hooks: {
 *     'kubb:plugin:setup'(ctx) {
 *       ctx.addGenerator(myGenerator)
 *     },
 *   },
 * }))
 *
 * // In kubb.config.ts:
 * export default defineConfig({
 *   plugins: [myPlugin({ tag: 'pets' })],
 * })
 * ```
 */
export function definePlugin<TOptions = object>(factory: (options: TOptions) => HookStylePlugin<TOptions>): (options?: TOptions) => HookStylePlugin<TOptions> {
  // `{} as TOptions` follows the same convention as `createPlugin` — when no options
  // are provided the factory receives an empty object. Factories should treat all option
  // fields as optional (or supply defaults) to make the call-site ergonomic.
  return (options) => factory(options ?? ({} as TOptions))
}
