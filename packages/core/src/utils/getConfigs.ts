import type { CLIOptions, ConfigInput } from '../config.ts'
import type { Config, UserConfig } from '../types.ts'

/**
 * Converting UserConfig to Config Array without a change in the object beside the JSON convert.
 */
export async function getConfigs(config: ConfigInput | UserConfig, args: CLIOptions): Promise<Array<Config>> {
  const resolved = await (typeof config === 'function' ? config(args as CLIOptions) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return userConfigs.map((item) => ({ ...item }) as Config)
}
