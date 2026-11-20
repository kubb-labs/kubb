import type {
  Generator as CoreGenerator,
  GeneratorContext as CoreGeneratorContext,
  PluginType,
  ResolverInput as CoreResolverInput,
  ResolverLike,
} from '@kubb/core'

// Own aliases, so imports from kit do not carry the deprecation of core's types.

/**
 * Context passed to a generator's `schema`, `operation` and `operations` methods.
 */
export type GeneratorContext<TOptions extends PluginType = PluginType> = CoreGeneratorContext<TOptions>

/**
 * A generator: `schema`, `operation` and `operations` methods that return files for a plugin.
 */
export type Generator<TOptions extends PluginType = PluginType, TElement = unknown> = CoreGenerator<TOptions, TElement>

/**
 * One resolver or patch, or a list of them merged left to right.
 */
export type ResolverInput<T extends ResolverLike = ResolverLike> = CoreResolverInput<T>
