import type { Config, NormalizedPlugin } from '@kubb/core'
import type { BarrelType } from '../types.ts'

const DEFAULT_BARREL_TYPE: BarrelType = 'named'

/**
 * Resolves the effective barrel style for a single plugin: explicit plugin option →
 * root config option → `'named'` default. Returns `false` when barrel generation is disabled.
 */
export function resolvePluginBarrelType(plugin: NormalizedPlugin, config: Config): BarrelType | false {
  return plugin.options.output?.barrelType ?? config.output.barrelType ?? DEFAULT_BARREL_TYPE
}

/**
 * Resolves the effective barrel style for the root `index.ts`: root config option → `'named'` default.
 * Returns `false` when the root barrel is disabled.
 */
export function resolveRootBarrelType(config: Config): BarrelType | false {
  return config.output.barrelType ?? DEFAULT_BARREL_TYPE
}
