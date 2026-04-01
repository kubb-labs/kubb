import { composeTransformers } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Generator, Preset, Presets, Resolver } from '../types.ts'

/**
 * Returns a copy of `defaults` where each function in `userOverrides` is wrapped
 * so a `null`/`undefined` return falls back to the original. Non-function values
 * are assigned directly. All calls use the merged object as `this`.
 */
function withFallback<T extends object>(defaults: T, userOverrides: Partial<T>): T {
  const merged = { ...defaults } as T

  for (const key of Object.keys(userOverrides) as Array<keyof T>) {
    const userVal = userOverrides[key]
    const defaultVal = defaults[key]

    if (typeof userVal === 'function' && typeof defaultVal === 'function') {
      ;(merged as any)[key] = (...args: any[]) => (userVal as Function).apply(merged, args) ?? (defaultVal as Function).apply(merged, args)
    } else if (userVal !== undefined) {
      merged[key] = userVal as T[typeof key]
    }
  }

  return merged
}

type GetPresetParams<TResolver extends Resolver> = {
  preset: CompatibilityPreset
  presets: Presets<TResolver>
  /**
   * Optional single resolver whose methods override the preset resolver.
   * When a method returns `null` or `undefined` the preset resolver's method is used instead.
   */
  resolver?: Partial<TResolver> & ThisType<TResolver>
  /**
   * User-supplied generators to append after the preset's generators.
   */
  generators?: Array<Generator<any>>
  /**
   * Optional single transformer visitor whose methods override the preset transformer.
   * When a method returns `null` or `undefined` the preset transformer's method is used instead.
   */
  transformer?: Visitor
}

type GetPresetResult<TResolver extends Resolver> = {
  resolver: TResolver
  transformer: Visitor | undefined
  generators: Array<Generator<any>>
  preset: Preset<TResolver> | undefined
}

/**
 * Resolves a named preset into a resolver, transformer, and generators.
 *
 * - Selects the preset resolver; wraps it with user overrides using null/undefined fallback.
 * - Composes the preset's transformers into a single visitor; wraps it with the user transformer using null/undefined fallback.
 * - Combines preset generators with user-supplied generators; falls back to the `default` preset's generators when neither provides any.
 */
export function getPreset<TResolver extends Resolver = Resolver>(params: GetPresetParams<TResolver>): GetPresetResult<TResolver> {
  const { preset: presetName, presets, resolver: userResolver, transformer: userTransformer, generators: userGenerators = [] } = params
  const preset = presets[presetName]

  const presetResolver = preset?.resolver ?? presets['default']!.resolver
  const resolver = userResolver ? withFallback(presetResolver, userResolver) : presetResolver

  const presetTransformers = preset?.transformers ?? []
  const presetTransformer = presetTransformers.length > 0 ? composeTransformers(...presetTransformers) : undefined
  const transformer = presetTransformer && userTransformer ? withFallback(presetTransformer, userTransformer) : (userTransformer ?? presetTransformer)

  const presetGenerators = preset?.generators ?? []
  const defaultGenerators = presets['default']?.generators ?? []
  const generators = (presetGenerators.length > 0 || userGenerators.length > 0 ? [...presetGenerators, ...userGenerators] : defaultGenerators) as Array<
    Generator<any>
  >

  return { resolver, transformer, generators, preset }
}
