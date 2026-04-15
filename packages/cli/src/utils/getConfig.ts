import type { PossiblePromise } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'

type ConfigInput = PossiblePromise<Config | Config[]> | ((cli: CLIOptions) => PossiblePromise<Config | Config[]>)

export async function getConfigs(config: ConfigInput, args: CLIOptions): Promise<Array<Config>> {
  const resolved = await (typeof config === 'function' ? config(args as CLIOptions) : config)
  const userConfigs = Array.isArray(resolved) ? resolved : [resolved]

  return userConfigs.map((item) => ({ ...item, plugins: item.plugins ?? [] }) as Config)
}
