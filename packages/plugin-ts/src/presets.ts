import type { Visitor } from '@kubb/ast/types'
import { type CompatibilityPreset, definePreset, definePresets, type Generator, getPreset as getCorePreset } from '@kubb/core'
import { typeGenerator, typeGeneratorLegacy } from './generators/index.ts'
import { resolverTs, resolverTsLegacy } from './resolvers/index.ts'
import type { PluginTs, ResolverTs } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-ts`.
 *
 * - `default` — uses `resolverTs` and `typeGenerator` (current naming conventions).
 * - `kubbV4` — uses `resolverTsLegacy` and `typeGeneratorLegacy` (Kubb v4 naming conventions).
 */
export const presets = definePresets<ResolverTs>({
  default: definePreset('default', { resolvers: [resolverTs], generators: [typeGenerator] }),
  kubbV4: definePreset('kubbV4', { resolvers: [resolverTsLegacy], generators: [typeGeneratorLegacy] }),
})

type GetPresetOptions = {
  resolvers: Array<ResolverTs>
  transformers: Array<Visitor>
  generators: Array<Generator<PluginTs>>
}

/**
 * Resolves a compatibility preset for `plugin-ts`, merging user-supplied resolvers,
 * transformers, and generators on top of the built-in preset defaults.
 *
 * `resolverTs` is always prepended to the resolver list as the baseline.
 *
 * @example
 * ```ts
 * const preset = getPreset('kubbV4', { resolvers: [], transformers: [], generators: [] })
 * ```
 */
export function getPreset(preset: CompatibilityPreset, { resolvers, transformers, generators }: GetPresetOptions) {
  return getCorePreset({
    preset,
    presets,
    resolvers: [resolverTs, ...(resolvers ?? [])],
    transformers,
    generators,
  })
}
