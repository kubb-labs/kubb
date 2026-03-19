import type { PluginFactoryOptions, Resolver } from './types.ts'

type ResolverBuilder<TPlugin extends PluginFactoryOptions> = () => TPlugin['resolver']

/**
 * Creates a resolver for a plugin by eagerly invoking the builder and returning the resolver instance directly.
 *
 * Unlike `createAdapter` and `createStorage`, this is not a lazy factory — the resolver is created
 * immediately when `createResolver` is called. Pass the plugin's factory type (`PluginTs`, `PluginClient`, …)
 * as the generic to tie the resolver to the correct plugin at the type level.
 *
 * @example
 * ```ts
 * import { createResolver } from '@kubb/core'
 * import type { PluginTs } from '@kubb/plugin-ts'
 *
 * export const resolver = createResolver<PluginTs>(() => {
 *   return {
 *     default(name: string) { return pascalCase(name) },
 *     resolvePathName(name: string) { return pascalCase(name) },
 *   }
 * })
 * ```
 */
export function createResolver<TPlugin extends PluginFactoryOptions>(build: ResolverBuilder<TPlugin>): TPlugin['resolver'] {
  return build()
}

export type { Resolver }
