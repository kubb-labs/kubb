import type { CLIOptions, Config, PossibleConfig } from '@kubb/core'

type ConfigInput = PossibleConfig<Config, CLIOptions>

export async function getConfigs(config: ConfigInput, args: CLIOptions): Promise<Array<Config>> {
  const resolved = await (typeof config === 'function' ? config(args as CLIOptions) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config)
}
