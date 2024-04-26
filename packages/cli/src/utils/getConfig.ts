import { isPromise } from '@kubb/core/utils'

import { getPlugins } from './getPlugins.ts'

import type { CLIOptions, Config, UserConfig } from '@kubb/core'
import type { CosmiconfigResult } from './getCosmiConfig.ts'

/**
 * Converting UserConfig to Config without a change in the object beside the JSON convert.
 */
export async function getConfig(result: CosmiconfigResult, CLIOptions: CLIOptions): Promise<Array<Config> | Config> {
  const config = result?.config
  let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

  // for ts or js files
  if (typeof config === 'function') {
    const possiblePromise = config(CLIOptions)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    }
    kubbUserConfig = Promise.resolve(possiblePromise)
  }

  let JSONConfig = await kubbUserConfig

  if (Array.isArray(JSONConfig)) {
    const promises = JSONConfig.map(async (item) => {
      return {
        ...item,
        plugins: item.plugins ? await getPlugins(item.plugins) : undefined,
      }
    }) as unknown as Array<Promise<Config>>

    return Promise.all(promises)
  }

  JSONConfig = {
    ...JSONConfig,
    plugins: JSONConfig.plugins ? await getPlugins(JSONConfig.plugins) : undefined,
  }

  return JSONConfig as Config
}
