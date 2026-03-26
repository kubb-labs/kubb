import type { Visitor } from '@kubb/ast/types'
import { type CompatibilityPreset, definePreset, definePresets, type Generator, getPreset as getCorePreset } from '@kubb/core'
import { cypressGenerator } from './generators/index.ts'
import { resolverCypress } from './resolvers/index.ts'
import type { PluginCypress, ResolverCypress } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-cypress`.
 *
 * - `default` — uses `resolverCypress` and `cypressGenerator`.
 * - `kubbV4`  — uses `resolverCypress` and `cypressGenerator` (same conventions as `default` for cypress).
 */
export const presets = definePresets<ResolverCypress>({
  default: definePreset('default', { resolvers: [resolverCypress], generators: [cypressGenerator] }),
  kubbV4: definePreset('kubbV4', { resolvers: [resolverCypress], generators: [cypressGenerator] }),
})

type GetPresetOptions = {
  resolvers: Array<ResolverCypress>
  transformers: Array<Visitor>
  generators: Array<Generator<PluginCypress>>
}

/**
 * Resolves a compatibility preset for `plugin-cypress`, merging user-supplied
 * resolvers, transformers, and generators on top of the built-in preset defaults.
 *
 * `resolverCypress` is always prepended to the resolver list as the baseline.
 *
 * @example
 * ```ts
 * const preset = getPreset('default', { resolvers: [], transformers: [], generators: [] })
 * ```
 */
export function getPreset(preset: CompatibilityPreset, { resolvers, transformers, generators }: GetPresetOptions) {
  return getCorePreset({
    preset,
    presets,
    resolvers: [resolverCypress, ...(resolvers ?? [])],
    transformers,
    generators,
  })
}
