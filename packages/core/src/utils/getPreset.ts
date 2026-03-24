import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Generator, Preset, Presets, Resolver } from '../types.ts'
import { mergeResolvers } from './mergeResolvers.ts'

type GetPresetParams<TResolver extends Resolver> = {
  preset: CompatibilityPreset
  presets: Presets<TResolver>
  resolvers: Array<TResolver>
  transformers?: Array<Visitor>
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
 * - Returns the preset's generators (if any) for use as the default generator list.
 */
export function getPreset<TResolver extends Resolver = Resolver>(params: GetPresetParams<TResolver>): GetPresetResult<TResolver> {
  const { preset: presetName, presets, resolvers, transformers: userTransformers } = params
  const [defaultResolver, ...userResolvers] = resolvers
  const preset = presets[presetName]

  const baseResolver = mergeResolvers(defaultResolver!, ...(preset?.resolvers ?? []))
  const resolver = mergeResolvers(baseResolver, ...(userResolvers ?? []))
  const transformers = [...(preset?.transformers ?? []), ...(userTransformers ?? [])]
  const generators = preset?.generators ?? []

  return {
    baseResolver,
    resolver,
    transformers,
    generators,
    preset,
  }
}
