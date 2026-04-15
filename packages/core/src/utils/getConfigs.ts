import type { CLIOptions, Config, ConfigInput } from '../types.ts'

export async function getConfigs(config: ConfigInput | Config, args: CLIOptions): Promise<Array<Config>> {
  const resolved = await (typeof config === 'function' ? config(args as CLIOptions) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config)
}
