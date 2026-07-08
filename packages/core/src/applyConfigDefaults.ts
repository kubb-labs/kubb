import type { Adapter, Config, Plugin } from './types.ts'

type ApplyConfigDefaultsOptions<TOutput> = {
  defaultAdapter: Adapter
  barrelPlugin: Plugin
  barrelPluginName: string
  /** Output fields to fill in when the user's config leaves them unset. */
  defaultOutput: Partial<TOutput>
}

/**
 * Fills in the config defaults shared by `defineConfig` and the unplugin factory: the fallback
 * adapter, `defaultOutput`'s fields, and appending the barrel plugin when it's not already
 * registered. Both entry points construct their own adapter, barrel plugin, and output defaults
 * (`barrel` is a `@kubb/plugin-barrel` extension field core doesn't know about) and pass them in,
 * so `@kubb/core` doesn't need to depend on `@kubb/adapter-oas` or `@kubb/plugin-barrel`.
 */
export function applyConfigDefaults<TOutput extends Config['output'] = Config['output']>(
  config: { adapter?: Adapter; output: TOutput; plugins?: Array<Plugin> },
  { defaultAdapter, barrelPlugin, barrelPluginName, defaultOutput }: ApplyConfigDefaultsOptions<TOutput>,
): { adapter: Adapter; output: TOutput; plugins: Array<Plugin> } {
  const alreadyHasBarrel = config.plugins?.some((plugin) => plugin.name === barrelPluginName)
  const plugins = alreadyHasBarrel ? (config.plugins ?? []) : [...(config.plugins ?? []), barrelPlugin]

  return {
    adapter: config.adapter ?? defaultAdapter,
    plugins,
    output: { ...defaultOutput, ...config.output },
  }
}
