import type { Preset, Presets, Resolver } from './types.ts'

/**
 * Creates a typed presets registry object — a named collection of {@link Preset} entries.
 *
 * @example
 * import { definePreset, definePresets } from '@kubb/core'
 * import { resolverTsLegacy, resolverTsHeyapi } from '@kubb/plugin-ts'
 *
 * export const myPresets = definePresets({
 *   kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy] }),
 *   heyapi: definePreset('heyapi', { resolvers: [resolverTsHeyapi] }),
 * })
 */
export function definePresets<TResolver extends Resolver = Resolver, TName extends string = string>(
  presets: Presets<TResolver, TName>,
): Presets<TResolver, TName> {
  return presets
}
