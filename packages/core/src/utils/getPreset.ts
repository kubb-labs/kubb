import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Preset, Presets, Resolver } from '../types.ts'
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
  preset: Preset<TResolver> | undefined
}

export function getPreset<TResolver extends Resolver = Resolver>(params: GetPresetParams<TResolver>): GetPresetResult<TResolver> {
  const { preset: presetName, presets, resolvers, transformers: userTransformers } = params
  const [defaultResolver, ...userResolvers] = resolvers
  const preset = presets[presetName]

  const baseResolver = mergeResolvers(defaultResolver!, ...(preset?.resolvers ?? []))
  const resolver = mergeResolvers(baseResolver, ...(userResolvers ?? []))
  const transformers = [...(preset?.transformers ?? []), ...(userTransformers ?? [])]

  return {
    baseResolver,
    resolver,
    transformers,
    preset,
  }
}
