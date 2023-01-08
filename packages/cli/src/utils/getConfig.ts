import type { KubbUserConfig, CLIOptions } from '@kubb/core'
import { isPromise } from '@kubb/core'

import { getPlugins } from './getPlugins'

import type { CosmiconfigResult } from '../types'

export const getConfig = async (result: CosmiconfigResult, options: CLIOptions) => {
  const config = result?.config

  // for json files
  if (result?.filepath.endsWith('.json')) {
    let JSONConfig = config as KubbUserConfig
    JSONConfig = {
      ...JSONConfig,
      plugins: JSONConfig.plugins ? await getPlugins(JSONConfig.plugins) : undefined,
    }
    return Promise.resolve(JSONConfig)
  }

  // for ts or js files
  if (typeof config === 'function') {
    const possiblePromise = config(options)
    if (isPromise(possiblePromise)) {
      return possiblePromise
    }
    return Promise.resolve(possiblePromise)
  }

  return config
}
