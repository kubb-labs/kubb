import { isPromise } from '@internals/utils'
import type { CLIOptions, Config } from '@kubb/core'

export type ResolveUserConfigOptions = {
  configPath?: string
  logLevel?: string
}

/**
 * Resolve the config by handling function configs and returning the final configuration
 */
export async function resolveUserConfig(config: Config, options: ResolveUserConfigOptions): Promise<Config> {
  let kubbUserConfig = Promise.resolve(config) as Promise<Config>

  if (typeof config === 'function') {
    const possiblePromise = (config as any)({ logLevel: options.logLevel, config: options.configPath } as CLIOptions)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    } else {
      kubbUserConfig = Promise.resolve(possiblePromise)
    }
  }

  return (await kubbUserConfig) as Config
}
