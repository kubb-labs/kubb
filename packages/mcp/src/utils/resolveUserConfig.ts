import type { CLIOptions, Config, UserConfig } from '@kubb/core'
import { isPromise } from '@kubb/core/utils'

export type ResolveUserConfigOptions = {
  configPath?: string
  logLevel?: string
}

/**
 * Resolve the config by handling function configs and returning the final configuration
 */
export async function resolveUserConfig(userConfig: UserConfig, options: ResolveUserConfigOptions): Promise<Config> {
  let kubbUserConfig = Promise.resolve(userConfig) as Promise<UserConfig>

  if (typeof userConfig === 'function') {
    const possiblePromise = (userConfig as any)({ logLevel: options.logLevel, config: options.configPath } as CLIOptions)
    if (isPromise(possiblePromise)) {
      kubbUserConfig = possiblePromise
    } else {
      kubbUserConfig = Promise.resolve(possiblePromise)
    }
  }

  return (await kubbUserConfig) as Config
}
