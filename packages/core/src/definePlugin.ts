import type { Config } from './types.ts'
import type { KubbBuildDoneContext, KubbBuildStartContext, KubbSetupContext } from './types.ts'

/**
 * Lifecycle event handlers that a hook-style plugin may declare.
 *
 * Modelled after Astro's integration API — lifecycle events are fired by the
 * `PluginDriver` via the shared `AsyncEventEmitter<KubbEvents>` so that both
 * the plugin's own handler and any external listeners (CLI, devtools, …) receive
 * each event through a single unified event system.
 *
 * @template TOptions - The plugin's own options type; tightens `ctx.options` in `kubb:setup`.
 */
export type PluginKubbEvents<TOptions = object> = {
  /**
   * Fired once before any plugin's `buildStart` runs.
   * Use this hook to register generators, configure the resolver/transformer/renderer,
   * or inject extra files into the build output.
   */
  'kubb:setup'?(ctx: KubbSetupContext & { options: TOptions }): void | Promise<void>
  /**
   * Fired when configuration loading is complete (reuses the existing `kubb:config:end` event).
   * Receives the full array of resolved configs.
   */
  'kubb:config:end'?(configs: Array<Config>): void | Promise<void>
  /**
   * Fired immediately before the plugin execution loop begins.
   * The adapter has already parsed the source and `inputNode` is available.
   */
  'kubb:build:start'?(ctx: KubbBuildStartContext): void | Promise<void>
  /**
   * Fired after all files have been written to disk.
   */
  'kubb:build:done'?(ctx: KubbBuildDoneContext): void | Promise<void>
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
   */
  hooks: PluginKubbEvents<TOptions>
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
 *     'kubb:setup'(ctx) {
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
