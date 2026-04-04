import type { CLIOptions, ConfigInput } from '../defineConfig.ts'
import type { Config, UserConfig } from '../types.ts'

/**
 * Resolves a {@link ConfigInput} into a normalized array of {@link Config} objects.
 *
 * - Awaits the config when it is a `Promise`.
 * - Calls the factory function with `args` when the config is a function.
 * - Wraps a single config object in an array for uniform downstream handling.
 */
export async function getConfigs(config: ConfigInput | UserConfig, args: CLIOptions): Promise<Array<Config>> {
  const resolved = await (typeof config === 'function' ? config(args as CLIOptions) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return userConfigs.map((item) => ({ plugins: [], ...item }) as Config)
}
