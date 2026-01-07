import type { CLIOptions, Config, UserConfig } from '@kubb/core'
import { isPromise } from '@kubb/core/utils'
import type { Args } from '../commands/generate.ts'
import type { CosmiconfigResult } from './getCosmiConfig.ts'
import { getPlugins } from './getPlugins.ts'

/**
 * Converting UserConfig to Config Array without a change in the object beside the JSON convert.
 */
export async function getConfigs(result: CosmiconfigResult, args: Args): Promise<Array<Config>> {
  const config = result?.config
  let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

  // for ts or js files
  if (typeof config === 'function') {
    const possiblePromise = config(args as CLIOptions)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    }
    kubbUserConfig = Promise.resolve(possiblePromise)
  }

  let JSONConfig = await kubbUserConfig

  if (!Array.isArray(JSONConfig)) {
    JSONConfig = [JSONConfig]
  }

  const results: Array<Config> = []

  for (const item of JSONConfig) {
    const plugins = item.plugins ? await getPlugins(item.plugins) : undefined

    results.push({
      ...item,
      plugins,
    } as Config)
  }

  return results
}
