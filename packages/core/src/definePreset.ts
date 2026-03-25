import type { Visitor } from '@kubb/ast/types'
import type { Generator, Preset, Resolver } from './types.ts'

/**
 * Creates a typed preset object that bundles a name, resolvers, optional
 * transformers, and optional generators — the building block for composable plugin presets.
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
 *
 * @example
 * // With generators
 * export const myPreset = definePreset('myPreset', { resolvers: [resolverTsLegacy], generators: [typeGeneratorLegacy] })
 */
export function definePreset<TResolver extends Resolver = Resolver, TName extends string = string>(
  name: TName,
  { resolvers, transformers, generators }: { resolvers: Array<TResolver>; transformers?: Array<Visitor>; generators?: Array<Generator<any>> },
): Preset<TResolver> & { name: TName } {
  return { name, resolvers, transformers, generators }
}
