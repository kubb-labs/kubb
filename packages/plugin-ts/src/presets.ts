import type { Visitor } from '@kubb/ast/types'
import { type CompatibilityPreset, definePreset, definePresets, getPreset as getCorePreset } from '@kubb/core'
import type { Generator } from '@kubb/plugin-oas/generators'
import { typeGenerator, typeGeneratorLegacy } from './generators/index.ts'
import { resolverTs, resolverTsLegacy } from './resolvers/index.ts'
import type { PluginTs, ResolverTs } from './types.ts'

export const presets = definePresets<ResolverTs>({
  default: definePreset('default', { resolvers: [resolverTs] }),
  kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy], generators: [typeGeneratorLegacy] }),
})

type GetPresetOptions = {
  resolvers?: Array<ResolverTs>
  transformers?: Array<Visitor>
  generators?: Array<Generator<PluginTs>>
}

export function getPreset(preset: CompatibilityPreset, { resolvers, transformers, generators: userGenerators }: GetPresetOptions = {}) {
  const result = getCorePreset({
    preset,
    presets,
    resolvers: [resolverTs, ...(resolvers ?? [])],
    transformers,
  })

  const generators: Array<Generator<PluginTs>> =
    result.generators.length > 0 || userGenerators?.length ? [...(result.generators as Array<Generator<PluginTs>>), ...(userGenerators ?? [])] : [typeGenerator]

  return { ...result, generators }
}
