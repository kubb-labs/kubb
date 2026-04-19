import type { KubbHooks } from "./Kubb.ts";
import type { KubbPluginSetupContext, PluginFactoryOptions } from "./types.ts";

/**
 * A plugin object produced by `definePlugin`.
 * Instead of flat lifecycle methods, it groups all handlers under a `hooks:` property
 * (matching Astro's integration naming convention).
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
 */
export type Plugin<
  TFactory extends PluginFactoryOptions = PluginFactoryOptions,
> = {
  /**
   * Unique name for the plugin, following the same naming convention as `createPlugin`.
   */
  name: string;
  /**
   * Plugins that must be registered before this plugin executes.
   * An error is thrown at startup when any listed dependency is missing.
   */
  dependencies?: Array<string>;
  /**
   * The options passed by the user when calling the plugin factory.
   */
  options?: TFactory["options"];
  /**
   * Lifecycle event handlers for this plugin.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: {
    [K in Exclude<keyof KubbHooks, "kubb:plugin:setup">]?: (
      ...args: KubbHooks[K]
    ) => void | Promise<void>;
  } & {
    "kubb:plugin:setup"?(
      ctx: KubbPluginSetupContext<TFactory>,
    ): void | Promise<void>;
  };
};

/**
 * Returns `true` when `plugin` is a hook-style plugin created with `definePlugin`.
 *
 * Used by `PluginDriver` to distinguish hook-style plugins from legacy `createPlugin` plugins
 * so it can normalize them and register their handlers on the `AsyncEventEmitter`.
 */
export function isPlugin(plugin: unknown): plugin is Plugin {
  return typeof plugin === "object" && plugin !== null && "hooks" in plugin;
}

/**
 * Creates a plugin factory using the hook-style (`hooks:`) API.
 *
 * The returned factory is called with optional options and produces a `Plugin`
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
export function definePlugin<
  TFactory extends PluginFactoryOptions = PluginFactoryOptions,
>(
  factory: (options: TFactory["options"]) => Plugin<TFactory>,
): (options?: TFactory["options"]) => Plugin<TFactory> {
  return (options) => factory(options ?? ({} as TFactory["options"]));
}
