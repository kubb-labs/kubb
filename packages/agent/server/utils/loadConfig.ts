import { getConfigs } from '@kubb/core/utils'
import { getCosmiConfig } from './getCosmiConfig.ts'

/**
 * Load and return the first Kubb config from the given config file path.
 */
export async function loadConfig(resolvedConfigPath: string) {
  const result = await getCosmiConfig(resolvedConfigPath)
  const configs = await getConfigs(result.config, {})

  if (configs.length === 0) {
    throw new Error('No configs found')
  }

  return configs[0]
}
