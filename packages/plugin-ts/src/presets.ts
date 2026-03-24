import type { Visitor } from '@kubb/ast/types'
import { type CompatibilityPreset, definePreset, definePresets, getPreset as getCorePreset } from '@kubb/core'
import { typeGeneratorLegacy } from './generators/index.ts'
import { resolverTs, resolverTsLegacy } from './resolvers/index.ts'
import type { ResolverTs } from './types.ts'

export const presets = definePresets<ResolverTs>({
  default: definePreset('default', { resolvers: [resolverTs] }),
  kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy], generators: [typeGeneratorLegacy] }),
})

type GetPresetOptions = {
  resolvers?: Array<ResolverTs>
  transformers?: Array<Visitor>
}

export function getPreset(preset: CompatibilityPreset, { resolvers, transformers }: GetPresetOptions = {}) {
  return getCorePreset({
    preset,
    presets,
    resolvers: [resolverTs, ...(resolvers ?? [])],
    transformers,
  })
}
