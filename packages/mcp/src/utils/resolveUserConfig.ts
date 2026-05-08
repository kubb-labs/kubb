import { isPromise } from '@internals/utils'
import type { CLIOptions, Config, PossibleConfig } from '@kubb/core'

export type ResolveUserConfigOptions = {
  configPath?: string
  logLevel?: string
}

export async function resolveUserConfig(config: PossibleConfig<CLIOptions>, options: ResolveUserConfigOptions): Promise<Config> {
  const result = typeof config === 'function' ? config({ logLevel: options.logLevel as CLIOptions['logLevel'], config: options.configPath }) : config
  const resolved = isPromise(result) ? await result : result
  return (Array.isArray(resolved) ? resolved[0] : resolved) as Config
}
