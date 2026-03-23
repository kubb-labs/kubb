import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Preset } from '@kubb/core'
import { definePreset, definePresets, mergeResolvers } from '@kubb/core'
import { resolverTs, resolverTsHeyapi, resolverTsLegacy, resolverTsOrval } from './resolvers/index.ts'
import type { ResolverTs } from './types.ts'

export type TsCompatibilityPreset = Preset<ResolverTs> & {
  name: Exclude<CompatibilityPreset, 'none'>
}

const tsPresetRegistry = definePresets<ResolverTs, Exclude<CompatibilityPreset, 'none'>>({
  kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy] }),
  heyapi: definePreset('heyapi', { resolvers: [resolverTsHeyapi] }),
  orval: definePreset('orval', { resolvers: [resolverTsOrval] }),
})

export function getTsCompatibilityPreset(preset: CompatibilityPreset): TsCompatibilityPreset | undefined {
  if (preset === 'none') {
    return undefined
  }

  return tsPresetRegistry[preset]
}

export function getTsResolverComposition(options: {
  compatibilityPreset: CompatibilityPreset
  userResolvers?: Array<ResolverTs>
  userTransformers?: Array<Visitor>
}): {
  resolver: ResolverTs
  baseResolver: ResolverTs
  transformers: Array<Visitor>
  preset: TsCompatibilityPreset | undefined
} {
  const { compatibilityPreset, userResolvers, userTransformers } = options
  const preset = getTsCompatibilityPreset(compatibilityPreset)
  const baseResolver = mergeResolvers(resolverTs, ...(preset?.resolvers ?? []))
  const resolver = mergeResolvers(baseResolver, ...(userResolvers ?? []))
  const transformers = [...(preset?.transformers ?? []), ...(userTransformers ?? [])]

  return {
    resolver,
    baseResolver,
    transformers,
    preset,
  }
}
