import type { Visitor } from '@kubb/ast/types'
import type { Resolver } from './types.ts'

/**
 * A preset bundles a name, one or more resolvers, and optional AST transformers
 * into a single reusable configuration object.
 *
 * @template TResolver - The concrete resolver type for this preset.
 */
export type Preset<TResolver extends Resolver = Resolver> = {
  /**
   * Unique identifier for this preset.
   */
  name: string
  /**
   * Ordered list of resolvers applied by this preset (last entry wins on merge).
   */
  resolvers: Array<TResolver>
  /**
   * Optional AST visitors / transformers applied after resolving.
   */
  transformers?: Array<Visitor>
}

/**
 * Creates a typed preset object that bundles a name, resolvers, and optional
 * transformers — the building block for composable plugin presets.
 *
 * @example
 * import { definePreset } from '@kubb/core'
 * import { resolverTsLegacy } from '@kubb/plugin-ts'
 *
 * export const myPreset = definePreset('myPreset', [resolverTsLegacy])
 *
 * @example
 * // With custom transformers
 * export const myPreset = definePreset('myPreset', [resolverTsLegacy], [myTransformer])
 */
export function definePreset<TResolver extends Resolver = Resolver, TName extends string = string>(
  name: TName,
  resolvers: Array<TResolver>,
  transformers?: Array<Visitor>,
): Preset<TResolver> & { name: TName } {
  return { name, resolvers, transformers }
}
