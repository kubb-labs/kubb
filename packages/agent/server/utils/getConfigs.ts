import type { Config, UserConfig } from '@kubb/core'
import { isPromise } from '@kubb/core/utils'
import type { CosmiconfigResult } from './getCosmiConfig.ts'

function getPlugins(plugins: UserConfig['plugins']): Promise<UserConfig['plugins']> {
  if (plugins instanceof Object && !Array.isArray(plugins)) {
    throw new Error('Object plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  if (Array.isArray(plugins) && plugins.some((plugin: any) => Array.isArray(plugin) && typeof plugin?.at(0) === 'string')) {
    throw new Error('JSON plugins are not supported anymore, best to use http://kubb.dev/getting-started/configure#json')
  }

  return Promise.resolve(plugins)
}

/**
 * Converting UserConfig to Config Array without a change in the object beside the JSON convert.
 */
export async function getConfigs(result: CosmiconfigResult): Promise<Array<Config>> {
  const config = result?.config
  let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

  // for ts or js files
  if (typeof config === 'function') {
    const possiblePromise = config({} as any)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    } else {
      kubbUserConfig = Promise.resolve(possiblePromise)
    }
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
