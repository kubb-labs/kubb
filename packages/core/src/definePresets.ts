import type { Preset, Presets, Resolver } from './types.ts'

/**
 * Creates a typed presets registry object — a named collection of {@link Preset} entries.
 *
 * @example
 * import { definePreset, definePresets } from '@kubb/core'
 * import { resolverTsLegacy } from '@kubb/plugin-ts'
 *
 * export const myPresets = definePresets({
 *   kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy] }),
 * })
 */
export function definePresets<TResolver extends Resolver = Resolver>(presets: Presets<TResolver>): Presets<TResolver> {
  return presets
}
