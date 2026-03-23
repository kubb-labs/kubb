import type { Visitor } from '@kubb/ast/types'
import { mergeResolvers } from '@kubb/core'
import type { CompatibilityPreset } from '@kubb/core'
import { resolverTs, resolverTsHeyapi, resolverTsLegacy, resolverTsOrval } from './resolvers/index.ts'
import type { ResolverTs } from './types.ts'

export type TsCompatibilityPreset = {
  name: Exclude<CompatibilityPreset, 'none'>
  resolvers: Array<ResolverTs>
  transformers?: Array<Visitor>
}

const tsPresetRegistry: Record<Exclude<CompatibilityPreset, 'none'>, TsCompatibilityPreset> = {
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverTsLegacy],
  },
  heyapi: {
    name: 'heyapi',
    resolvers: [resolverTsHeyapi],
  },
  orval: {
    name: 'orval',
    resolvers: [resolverTsOrval],
  },
}

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
