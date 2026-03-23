import type { Visitor } from '@kubb/ast/types'
import type { Preset, Resolver } from './types.ts'

/**
 * Creates a typed preset object that bundles a name, resolvers, and optional
 * transformers — the building block for composable plugin presets.
 *
 * @example
 * import { definePreset } from '@kubb/core'
 * import { resolverTsLegacy } from '@kubb/plugin-ts'
 *
 * export const myPreset = definePreset('myPreset', { resolvers: [resolverTsLegacy] })
 *
 * @example
 * // With custom transformers
 * export const myPreset = definePreset('myPreset', { resolvers: [resolverTsLegacy], transformers: [myTransformer] })
 */
export function definePreset<TResolver extends Resolver = Resolver, TName extends string = string>(
  name: TName,
  { resolvers, transformers }: { resolvers: Array<TResolver>; transformers?: Array<Visitor> },
): Preset<TResolver> & { name: TName } {
  return { name, resolvers, transformers }
}
