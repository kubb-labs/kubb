import { isPromise } from '@kubb/core'

import { getPlugins } from './getPlugins.ts'

import type { CLIOptions, KubbConfig, KubbUserConfig } from '@kubb/core'
import type { CosmiconfigResult } from '../types.ts'

export async function getConfig(result: CosmiconfigResult, options: CLIOptions): Promise<KubbConfig> {
  const config = result?.config
  let kubbUserConfig: Promise<KubbUserConfig> = Promise.resolve(config) as Promise<KubbUserConfig>

  // for ts or js files
  if (typeof config === 'function') {
    const possiblePromise = config(options)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    }
    kubbUserConfig = Promise.resolve(possiblePromise)
  }

  let JSONConfig = await kubbUserConfig
  JSONConfig = {
    ...JSONConfig,
    plugins: JSONConfig.plugins ? await getPlugins(JSONConfig.plugins) : undefined,
  }

  return JSONConfig as KubbConfig
}
