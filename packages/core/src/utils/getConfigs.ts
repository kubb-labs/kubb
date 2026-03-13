import type { CLIOptions, ConfigInput } from '../config.ts'
import type { Config, UserConfig } from '../types.ts'
import { getPlugins } from './getPlugins.ts'

/**
 * Converting UserConfig to Config Array without a change in the object beside the JSON convert.
 */
export async function getConfigs(config: ConfigInput | UserConfig, args: CLIOptions): Promise<Array<Config>> {
  const resolvedConfig: Promise<UserConfig | Array<UserConfig>> =
    typeof config === 'function' ? Promise.resolve(config(args as CLIOptions)) : Promise.resolve(config)

  let userConfigs = await resolvedConfig

  if (!Array.isArray(userConfigs)) {
    userConfigs = [userConfigs]
  }

  const results: Array<Config> = []

  for (const item of userConfigs) {
    const plugins = item.plugins ? await getPlugins(item.plugins) : undefined

    results.push({
      ...item,
      plugins,
    } as Config)
  }

  return results
}
