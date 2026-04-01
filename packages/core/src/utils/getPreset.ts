import { composeTransformers } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import type { CompatibilityPreset, Generator, Preset, Presets, Resolver } from '../types.ts'

/**
 * Wraps a resolver so that any method returning `null` or `undefined` falls back
 * to the corresponding method on `defaultResolver`.
 *
 * Non-function overrides (e.g. `name`, `pluginName`) are applied directly.
 * All wrapped methods are called with `wrapper` as `this`, preserving resolver
 * cross-method calls (e.g. `this.default(...)` inside `resolveName`).
 */
function withFallback<T extends Resolver>(defaultResolver: T, userOverrides: Partial<T>): T {
  const wrapper = { ...defaultResolver } as T

  for (const key of Object.keys(userOverrides) as Array<keyof T>) {
    const userFn = userOverrides[key]
    const defaultFn = defaultResolver[key]

    if (typeof userFn === 'function' && typeof defaultFn === 'function') {
      ;(wrapper as any)[key] = (...args: any[]) => {
        const result = (userFn as Function).apply(wrapper, args)
        if (result == null) {
          return (defaultFn as Function).apply(wrapper, args)
        }
        return result
      }
    } else if (userFn !== undefined) {
      wrapper[key] = userFn as T[typeof key]
    }
  }

  return wrapper
}

/**
 * Wraps a composed preset transformer so that any visitor method returning
 * `null` or `undefined` falls back to the corresponding preset method.
 */
function withTransformerFallback(presetTransformer: Visitor, userTransformer: Visitor): Visitor {
  const result = { ...presetTransformer } as Visitor

  for (const key of Object.keys(userTransformer) as Array<keyof Visitor>) {
    const userFn = userTransformer[key]
    const presetFn = presetTransformer[key]

    if (typeof userFn === 'function') {
      ;(result as any)[key] = (...args: any[]) => {
        const val = (userFn as Function)(...args)
        if (val == null) {
          return typeof presetFn === 'function' ? (presetFn as Function)(...args) : undefined
        }
        return val
      }
    }
  }

  return result
}

type GetPresetParams<TResolver extends Resolver> = {
  preset: CompatibilityPreset
  presets: Presets<TResolver>
  /**
   * Optional single resolver whose methods override the preset resolver.
   * When a method returns `null` or `undefined` the preset resolver's method is used instead.
   */
  resolver?: Partial<TResolver>
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
  const transformer = userTransformer
    ? presetTransformer
      ? withTransformerFallback(presetTransformer, userTransformer)
      : userTransformer
    : presetTransformer

  const presetGenerators = preset?.generators ?? []
  const defaultPresetGenerators = presets['default']?.generators ?? []
  const generators = (presetGenerators.length > 0 || userGenerators.length
    ? [...presetGenerators, ...userGenerators]
    : defaultPresetGenerators) as unknown as Array<Generator<any>>

  return {
    resolver,
    transformer,
    generators,
    preset,
  }
}
