import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Generator, Preset, Presets, Resolver } from '../types.ts'
import { mergeResolvers } from './mergeResolvers.ts'

type GetPresetParams<TResolver extends Resolver> = {
  preset: CompatibilityPreset
  presets: Presets<TResolver>
  resolvers: Array<TResolver>
  transformers?: Array<Visitor>
  /**
   * User-supplied generators to append after the preset's generators.
   */
  generators?: Array<Generator>
  /**
   * Fallback generators used when neither the preset nor the user supplies any generators.
   */
  defaultGenerators?: Array<Generator>
}

type GetPresetResult<TResolver extends Resolver> = {
  baseResolver: TResolver
  resolver: TResolver
  transformers: Array<Visitor>
  generators: Array<Generator>
  preset: Preset<TResolver> | undefined
}

/**
 * Resolves a named preset into merged resolvers, transformers, and generators.
 *
 * - Merges the preset's resolvers on top of the first (default) resolver to produce `baseResolver`.
 * - Merges any additional user-supplied resolvers on top of that to produce the final `resolver`.
 * - Concatenates preset transformers before user-supplied transformers.
 * - Combines preset generators with user-supplied generators; falls back to `defaultGenerators` when neither provides any.
 */
export function getPreset<TResolver extends Resolver = Resolver>(params: GetPresetParams<TResolver>): GetPresetResult<TResolver> {
  const { preset: presetName, presets, resolvers, transformers: userTransformers, generators: userGenerators, defaultGenerators } = params
  const [defaultResolver, ...userResolvers] = resolvers
  const preset = presets[presetName]

  const baseResolver = mergeResolvers(defaultResolver!, ...(preset?.resolvers ?? []))
  const resolver = mergeResolvers(baseResolver, ...(userResolvers ?? []))
  const transformers = [...(preset?.transformers ?? []), ...(userTransformers ?? [])]

  const presetGenerators = preset?.generators ?? []
  const generators =
    presetGenerators.length > 0 || userGenerators?.length
      ? [...presetGenerators, ...(userGenerators ?? [])]
      : (defaultGenerators ?? [])

  return {
    baseResolver,
    resolver,
    transformers,
    generators,
    preset,
  }
}
